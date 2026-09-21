import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { openGallery, createGalleryRecord, updateGalleryRecord, removeGalleryPhoto, removeGallery } from "../galleryStore";

export function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const adminGallery = snapshot => ({ ...snapshot.data(), id: snapshot.id, slug: snapshot.id, needsMigration: !snapshot.data().access });
export function useGallery(slug, admin = false) {
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(admin);
  const [error, setError] = useState(null);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setGallery(null); setError(null); setLoading(admin);
    if (!admin || !slug) return;
    const unsubscribe = onSnapshot(doc(db, "galleries", slug), snapshot => {
      if (snapshot.exists()) { setGallery(adminGallery(snapshot)); setError(null); }
      else { setGallery(null); setError("Gallery not found."); }
      setLoading(false);
    }, () => { setError("Unable to load gallery."); setLoading(false); });
    return () => { generation.current++; unsubscribe(); };
  }, [slug, admin]);
  return { gallery, loading, error, updateGallery, deletePhoto: deletePhotoFromGallery,
    unlock: async password => {
      const current = generation.current;
      const result = await openGallery(slug, password);
      if (current === generation.current) setGallery(result);
    }
  };
}
export function useAllGalleries() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => onSnapshot(collection(db, "galleries"), snapshot => {
    setGalleries(snapshot.docs.map(adminGallery)); setLoading(false); setError(null);
  }, () => { setError("Unable to load galleries."); setLoading(false); }), []);
  return { galleries, loading, error };
}
export async function createGallery({ name, clientEmail = "", password }) {
  const slug = slugify(name);
  await createGalleryRecord({ name, clientEmail, password, slug });
  return slug;
}
export const updateGallery = updateGalleryRecord;
export const deletePhotoFromGallery = removeGalleryPhoto;
export const deleteGallery = removeGallery;
