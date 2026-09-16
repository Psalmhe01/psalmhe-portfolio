import { randomBytes, scrypt as deriveKey, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(deriveKey);
export const ADMIN_EMAIL = "psalmhe@gmail.com";
export const SESSION_MS = 15 * 60 * 1000;
export const TIME_ZONE = "America/Chicago";
export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("hex");
export class AccessError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export function requireAdmin(auth) {
  if (!auth || auth.token?.email !== ADMIN_EMAIL || auth.token?.email_verified !== true) {
    throw new AccessError("permission-denied", "Photographer access required.");
  }
}
export function string(value, name, min, max) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) {
    throw new AccessError("invalid-argument", `Invalid ${name}.`);
  }
  return value.trim();
}
export function slugValue(value) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9-]{0,98}$/.test(value)) {
    throw new AccessError("invalid-argument", "Invalid gallery link.");
  }
  return value;
}
export function passwordValue(value, creating = false) {
  if (typeof value !== "string" || value.length < (creating ? 12 : 1) || value.length > 128) {
    throw new AccessError("invalid-argument", creating ? "Use a password of 12–128 characters." : "Invalid password.");
  }
  return value; // Spaces in passwords are meaningful.
}
export async function passwordRecord(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return { algorithm: "scrypt-v1", salt, hash: hash.toString("hex") };
}
export async function verifyPassword(password, record, legacyHash) {
  if (record?.algorithm === "scrypt-v1" && /^[a-f0-9]{32}$/.test(record.salt) && /^[a-f0-9]{128}$/.test(record.hash)) {
    const actual = await scrypt(password, record.salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    return timingSafeEqual(actual, Buffer.from(record.hash, "hex"));
  }
  if (!record && /^[a-f0-9]{64}$/.test(legacyHash || "")) {
    return timingSafeEqual(Buffer.from(sha256(password), "hex"), Buffer.from(legacyHash, "hex"));
  }
  // Keep missing-gallery requests on an expensive password path too.
  await scrypt(password, "missing-gallery", 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return false;
}
export function localDateTime(date, timeZone = TIME_ZONE) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
export function validateBooking(input, now = Date.now(), timeZone = TIME_ZONE) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new AccessError("invalid-argument", "Invalid booking.");
  const allowed = ["firstName", "lastName", "email", "phone", "occasion", "notes", "bookingDate", "bookingTime", "requestId"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new AccessError("invalid-argument", "Unexpected booking field.");
  const data = {
    firstName: string(input.firstName, "first name", 1, 99), lastName: string(input.lastName, "last name", 1, 99),
    email: string(input.email, "email", 3, 254), phone: string(input.phone, "phone", 6, 24),
    occasion: string(input.occasion ?? "", "occasion", 0, 199), notes: string(input.notes ?? "", "notes", 0, 999),
    bookingDate: string(input.bookingDate, "date", 10, 10), bookingTime: string(input.bookingTime, "time", 5, 5),
  };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email) || !/^\d{4}-\d{2}-\d{2}$/.test(data.bookingDate) ||
      !/^(09|1[0-8]):00$/.test(data.bookingTime)) throw new AccessError("invalid-argument", "Invalid date, time, or email.");
  const date = new Date(`${data.bookingDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.bookingDate) throw new AccessError("invalid-argument", "Choose a real calendar date.");
  const slotKey = `${data.bookingDate} ${data.bookingTime}`;
  if (slotKey <= localDateTime(new Date(now), timeZone) || slotKey > localDateTime(new Date(now + 365 * 86400000), timeZone)) {
    throw new AccessError("invalid-argument", "Choose a future appointment within the next year.");
  }
  if (!/^[a-f0-9]{64}$/.test(input.requestId || "")) throw new AccessError("invalid-argument", "Invalid booking request.");
  return { ...data, slotKey, timeZone };
}
export const DESIGN_KEYS = ["name", "slug", "coverStyle", "coverHeight", "coverPhotoId", "overlayOpacity", "titleFont", "titleSize", "titleWeight", "titleSpacing", "layout", "gridGap", "gridCols", "hoverEffect", "colorTheme"];
export function clientGallery(gallery, signPhoto, expiresAt) {
  const result = Object.fromEntries(DESIGN_KEYS.filter((key) => gallery[key] !== undefined).map((key) => [key, gallery[key]]));
  result.photos = (gallery.photos || []).map((photo) => {
    if (photo.deliveryType !== "authenticated") throw new AccessError("failed-precondition", "This gallery is being secured. Please contact the photographer.");
    return { publicId: photo.publicId, filename: photo.filename, width: photo.width, height: photo.height,
      url: signPhoto(photo, false), thumbnailUrl: signPhoto(photo, true), downloadUrl: signPhoto(photo, "download") };
  });
  return { ...result, expiresAt };
}
