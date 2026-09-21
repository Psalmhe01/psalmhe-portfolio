const encoder = new TextEncoder();
export const ITERATIONS = 600000;
const encode = (bytes) => {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
};
const decode = (value) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export function sharedGallery(gallery) {
  const fields = ["slug", "name", "coverStyle", "coverHeight", "coverPhotoId", "overlayOpacity",
    "titleFont", "titleSize", "titleWeight", "titleSpacing", "layout", "gridGap", "gridCols"];
  const result = Object.fromEntries(fields.filter(key => gallery[key] !== undefined).map(key => [key, gallery[key]]));
  result.photos = (gallery.photos || []).map(photo => Object.fromEntries(
    ["publicId", "url", "thumbnailUrl", "filename", "width", "height"].filter(key => photo[key] !== undefined).map(key => [key, photo[key]])));
  return result;
}
async function derive(password, salt) {
  if (typeof password !== "string" || password.length < 1 || password.length > 128) throw Error("Invalid password.");
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: decode(salt), iterations: ITERATIONS },
    material, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
export async function newGalleryKey(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) throw Error("Use a long, unique password of 12–128 characters.");
  const salt = encode(crypto.getRandomValues(new Uint8Array(16)));
  const key = await derive(password, salt);
  return { salt, key: encode(await crypto.subtle.exportKey("raw", key)) };
}
export async function encryptGallery(gallery, access) {
  const key = await crypto.subtle.importKey("raw", decode(access.key), "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(gallery.slug) },
    key, encoder.encode(JSON.stringify(sharedGallery(gallery))));
  const ciphertext = encode(encrypted);
  if (ciphertext.length > 800000) throw Error("This gallery is too large. Split it into smaller galleries.");
  return { version: 1, salt: access.salt, iv: encode(iv), ciphertext };
}
export async function decryptGallery(slug, password, envelope) {
  try {
    if (envelope.version !== 1 || envelope.salt.length !== 24 || envelope.iv.length !== 16 ||
      typeof envelope.ciphertext !== "string" || envelope.ciphertext.length > 800000) throw Error();
    const key = await derive(password, envelope.salt);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(envelope.iv), additionalData: encoder.encode(slug) },
      key, decode(envelope.ciphertext));
    const gallery = JSON.parse(new TextDecoder().decode(plaintext));
    if (gallery.slug !== slug || !Array.isArray(gallery.photos)) throw Error();
    return gallery;
  } catch { throw Error("Unable to unlock. Check the password and try again."); }
}
