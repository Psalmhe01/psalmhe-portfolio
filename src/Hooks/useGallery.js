import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, collection, onSnapshot, updateDoc } from "firebase/firestore";
import { callBackend } from "../backend";

export function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const needsMigration = (gallery) => (gallery.photos || []).some((photo) => photo.deliveryType !== "authenticated" || !photo.assetId);
async function adminGallery(snapshot) {
  const raw = { id: snapshot.id, ...snapshot.data() };
  // Only an authenticated admin can read this snapshot. Legacy previews remain
  // available to the photographer while client access fails closed.
  if (needsMigration(raw)) return { ...raw, needsMigration: true };
  return { ...raw, ...await callBackend("openGallery", { slug: snapshot.id }) };
}

export function useGallery(slug, admin = false) {
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(admin);
  const [error, setError] = useState(null);
  useEffect(() => {
    setGallery(null);
    setError(null);
    setLoading(admin);
    if (!admin || !slug) return;
    let version = 0;
    const unsubscribe = onSnapshot(doc(db, "galleries", slug), async (snapshot) => {
      const current = ++version;
      try {
        if (!snapshot.exists()) throw new Error("Gallery not found.");
        const result = await adminGallery(snapshot);
        if (current === version) setGallery(result);
      } catch (err) {
        if (current === version) setError(err.message || "Unable to load gallery.");
      } finally {
        if (current === version) setLoading(false);
      }
    }, () => { setError("Unable to load gallery."); setLoading(false); });
    return () => { version++; unsubscribe(); };
  }, [slug, admin]);
  useEffect(() => {
    if (!gallery?.expiresAt) return;
    let active = true;
    const timer = setTimeout(async () => {
      if (!admin) { setGallery(null); return; }
      try {
        const refreshed = await callBackend("openGallery", { slug });
        if (active) setGallery(refreshed);
      } catch { if (active) setError("Gallery access expired. Please refresh."); }
    }, Math.max(0, gallery.expiresAt - Date.now() - (admin ? 60000 : 0)));
    return () => { active = false; clearTimeout(timer); };
  }, [gallery?.expiresAt, admin, slug]);
  return {
    gallery, loading, error,
    unlock: async (password) => {
      const result = await callBackend("openGallery", { slug, password });
      setGallery(result);
    },
    updateGallery,
    deletePhoto: deletePhotoFromGallery,
  };
}

export function useAllGalleries() {
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setRefresh((count) => count + 1), 12 * 60000);
    return () => clearInterval(timer);
  }, []);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let version = 0;
    const unsubscribe = onSnapshot(collection(db, "galleries"), async (snapshot) => {
      const current = ++version;
      try {
        const results = await Promise.all(snapshot.docs.map(adminGallery));
        if (current === version) { setGalleries(results); setError(null); }
      } catch {
        if (current === version) setError("Unable to load galleries. Please refresh and try again.");
      } finally {
        if (current === version) setLoading(false);
      }
    }, () => { setError("Unable to load galleries."); setLoading(false); });
    return () => { version++; unsubscribe(); };
  }, [refresh]);
  return { galleries, loading, error };
}

export async function createGallery({ name, clientEmail, password }) {
  const slug = slugify(name);
  await callBackend("createGallery", { name, clientEmail, password, slug });
  return slug;
}
export async function updateGallery(slug, updates) {
  await updateDoc(doc(db, "galleries", slug), updates);
}
export async function deletePhotoFromGallery(slug, publicId) {
  await callBackend("deleteGalleryPhoto", { slug, publicId });
}
export async function deleteGallery(slug) {
  await callBackend("deleteGallery", { slug });
}
