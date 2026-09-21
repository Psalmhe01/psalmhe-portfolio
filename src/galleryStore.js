import { doc, getDoc, runTransaction, serverTimestamp, writeBatch } from "firebase/firestore";
import { db, auth } from "./firebase";
import { isAdminUser } from "./adminAccess";
import { newGalleryKey, encryptGallery, decryptGallery } from "./galleryCrypto";
function admin() { if (!isAdminUser(auth.currentUser)) throw Error("Photographer access required."); }
function slugValue(slug) { if (!/^[a-z0-9][a-z0-9-]{0,98}$/.test(slug || "")) throw Error("Invalid gallery link."); return slug; }
export async function openGallery(slug, password) {
  slugValue(slug);
  const snapshot = await getDoc(doc(db, "galleryShares", slug));
  if (!snapshot.exists()) throw Error("Unable to unlock. Check the password or contact the photographer.");
  return decryptGallery(slug, password, snapshot.data());
}
export async function createGalleryRecord({ slug, name, clientEmail, password }) {
  admin(); slugValue(slug);
  if (!name.trim() || name.length > 99 || clientEmail.length > 254) throw Error("Check the gallery name and email.");
  const access = await newGalleryKey(password);
  const gallery = { slug, name: name.trim(), clientEmail: clientEmail.trim(), photos: [], access, revision: 1, createdAt: serverTimestamp() };
  const share = await encryptGallery(gallery, access);
  await runTransaction(db, async tx => {
    const ref = doc(db, "galleries", slug);
    if ((await tx.get(ref)).exists()) throw Error("A gallery with that name already exists.");
    tx.set(ref, gallery);
    tx.set(doc(db, "galleryShares", slug), { ...share, revision: 1 });
  });
}
export async function changeGallery(slug, mutate) {
  admin(); slugValue(slug);
  await runTransaction(db, async tx => {
    const ref = doc(db, "galleries", slug);
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) throw Error("Gallery not found.");
    const gallery = { ...snapshot.data(), slug };
    const next = await mutate(gallery);
    next.revision = (gallery.revision || 0) + 1;
    delete next.passwordHash;
    if ((next.photos || []).length > 500) throw Error("Split this into galleries of fewer than 500 photos.");
    if (next.access) {
      const share = await encryptGallery(next, next.access);
      tx.set(doc(db, "galleryShares", slug), { ...share, revision: next.revision });
    }
    tx.set(ref, next);
  });
}
export async function setGalleryPassword(slug, password) {
  const access = await newGalleryKey(password);
  await changeGallery(slug, gallery => ({ ...gallery, access }));
}
export async function updateGalleryRecord(slug, updates) {
  const allowed = ["name","coverStyle","coverHeight","coverPhotoId","overlayOpacity","titleFont","titleSize","titleWeight","titleSpacing","layout","gridGap","gridCols"];
  if (Object.keys(updates).some(key => !allowed.includes(key))) throw Error("Invalid gallery update.");
  await changeGallery(slug, gallery => ({ ...gallery, ...updates }));
}
export async function addGalleryPhotos(slug, photos) {
  await changeGallery(slug, gallery => ({ ...gallery,
    photos: [...(gallery.photos || []), ...photos.filter(photo => !(gallery.photos || []).some(old => old.publicId === photo.publicId))] }));
}
export async function removeGalleryPhoto(slug, publicId) {
  await changeGallery(slug, gallery => ({ ...gallery, photos: (gallery.photos || []).filter(photo => photo.publicId !== publicId),
    coverPhotoId: gallery.coverPhotoId === publicId ? null : gallery.coverPhotoId || null }));
}
export async function removeGallery(slug) {
  admin(); slugValue(slug);
  const batch = writeBatch(db);
  batch.delete(doc(db, "galleries", slug));
  batch.delete(doc(db, "galleryShares", slug));
  await batch.commit();
}
