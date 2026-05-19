// src/hooks/useGallery.js
import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// Slugify a gallery name
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Hash a password (simple SHA-256 via Web Crypto)
export async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Fetch a gallery by slug (public)
export function useGallery(slug) {
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGallery = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    const ref = doc(db, "galleries", slug);
    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          setGallery({ id: snap.id, ...snap.data() });
        } else {
          setError("Gallery not found.");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const updateGalleryFn = async (gallerySlug, updates) => {
    await updateGallery(gallerySlug, updates);
    setGallery((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const deletePhotoFn = async (gallerySlug, publicId) => {
    await deletePhotoFromGallery(gallerySlug, publicId);
    setGallery((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        photos: prev.photos.filter((p) => p.publicId !== publicId),
      };
    });
  };

  return {
    gallery,
    loading,
    error,
    updateGallery: updateGalleryFn,
    deletePhoto: deletePhotoFn,
  };
}

// Fetch all galleries (admin only)
export function useAllGalleries() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "galleries"))
      .then((snap) => {
        setGalleries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .finally(() => setLoading(false));
  }, []);

  return { galleries, loading, refetch: () => {} };
}

// Create a new gallery
export async function createGallery({ name, clientEmail, password }) {
  const slug = slugify(name);
  const passwordHash = await hashPassword(password);

  const ref = doc(db, "galleries", slug);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error(`A gallery with slug "${slug}" already exists.`);
  }

  await setDoc(ref, {
    name,
    slug,
    clientEmail: clientEmail || "",
    passwordHash,
    photos: [],
    layout: "masonry",
    createdAt: serverTimestamp(),
  });

  return slug;
}

export async function updateGallery(slug, updates) {
  const ref = doc(db, "galleries", slug);
  await updateDoc(ref, updates);
}

// Add photos to a gallery
export async function addPhotosToGallery(slug, newPhotos) {
  const ref = doc(db, "galleries", slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Gallery not found");

  const existing = snap.data().photos || [];
  await updateDoc(ref, {
    photos: [...existing, ...newPhotos],
  });
}

// Delete a photo from a gallery
export async function deletePhotoFromGallery(slug, publicId) {
  const ref = doc(db, "galleries", slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Gallery not found");

  const existingPhotos = snap.data().photos || [];
  const photos = existingPhotos.filter((p) => p.publicId !== publicId);
  await updateDoc(ref, { photos });
}

// Delete entire gallery
export async function deleteGallery(slug) {
  await deleteDoc(doc(db, "galleries", slug));
}
