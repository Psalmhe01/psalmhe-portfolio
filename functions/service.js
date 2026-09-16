import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { AccessError, requireAdmin, slugValue, string, passwordValue, passwordRecord, verifyPassword,
  validateBooking, clientGallery, sha256, token, SESSION_MS, TIME_ZONE } from "./policy.js";

// The adapters are injected so the real transactions can be tested against the emulator.
export function createService({ db, cloudinary, clock = Date.now, timeZone = TIME_ZONE, appCheckRequired = true }) {
  const requireApp = (request) => {
    if (appCheckRequired && !request.app?.appId) throw new AccessError("unauthenticated", "App verification is required. Refresh and try again.");
  };
  async function rateLimit(request, action, limit, windowMs = 15 * 60000) {
    // Use the platform-normalized IP; never accept an IP supplied in request.data.
    const ip = request.rawRequest?.ip;
    if (!ip) throw new AccessError("unavailable", "Unable to verify this request. Please try again.");
    const ref = db.doc(`rateLimits/${sha256(`${action}:${ip}`)}`);
    const now = clock();
    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const current = snapshot.data();
      const active = current && current.expiresAt.toMillis() > now;
      if (active && current.count >= limit) throw new AccessError("resource-exhausted", "Too many attempts. Please try again in 15 minutes.");
      tx.set(ref, { count: active ? current.count + 1 : 1, expiresAt: Timestamp.fromMillis(active ? current.expiresAt.toMillis() : now + windowMs) });
    });
  }
  function signPhoto(photo, variant, expiresAt) {
    const thumbnail = variant === true;
    if (!photo.assetId) throw new AccessError("failed-precondition", "This gallery needs a media migration.");
    const params = cloudinary.utils.sign_request({
      asset_id: photo.assetId, format: thumbnail || (photo.format === "heic" && variant !== "download") ? "jpg" : (photo.format || "jpg"),
      timestamp: Math.floor(clock() / 1000), attachment: variant === "download",
      expires_at: Math.floor(expiresAt / 1000),
      ...(thumbnail ? { transformation: "c_limit,w_600,q_auto" } : {}),
    });
    return `${cloudinary.utils.api_url("download", { resource_type: "asset" })}?${new URLSearchParams(params)}`;
  }
  return {
    async createBooking(request) {
      requireApp(request);
      const booking = validateBooking(request.data, clock(), timeZone);
      await rateLimit(request, "booking", 8);
      const requestRef = db.doc(`bookingRequests/${sha256(request.data.requestId)}`);
      const bookingRef = db.doc(`bookings/${booking.slotKey}`);
      const availabilityRef = db.doc(`availability/${booking.slotKey}`);
      const digest = sha256(JSON.stringify(booking));
      const cancellationToken = token();
      return db.runTransaction(async (tx) => {
        const [previous, occupied, current] = await Promise.all([tx.get(requestRef), tx.get(availabilityRef), tx.get(bookingRef)]);
        if (previous.exists) {
          if (previous.data().digest !== digest) throw new AccessError("invalid-argument", "This request has already been used.");
          if (!current.exists || current.data().cancellationToken !== previous.data().cancellationToken) {
            throw new AccessError("failed-precondition", "This request was already completed. Refresh to make a new booking.");
          }
          return { ...booking, cancellationToken: previous.data().cancellationToken, repeated: true };
        }
        if (occupied.exists || (current.exists && current.data().status !== "denied")) {
          throw new AccessError("already-exists", "That time is already booked. Choose another slot.");
        }
        if (current.exists) {
          tx.set(db.doc(`bookingHistory/${randomUUID()}`), current.data());
          if (current.data().cancellationToken) tx.delete(db.doc(`bookingCancellations/${current.data().cancellationToken}`));
        }
        tx.set(bookingRef, { ...booking, cancellationToken, status: "pending", createdAt: FieldValue.serverTimestamp() });
        tx.set(availabilityRef, { booked: true, date: booking.bookingDate });
        const { slotKey, bookingDate, bookingTime, firstName, lastName, email, occasion, timeZone: zone } = booking;
        tx.create(db.doc(`bookingCancellations/${cancellationToken}`), { slotKey, bookingDate, bookingTime, firstName, lastName, email, occasion, timeZone: zone });
        tx.create(requestRef, { digest, cancellationToken, expiresAt: Timestamp.fromMillis(clock() + 366 * 86400000) });
        return { ...booking, cancellationToken, repeated: false };
      });
    },
    async createGallery(request) {
      requireAdmin(request.auth);
      const slug = slugValue(request.data?.slug);
      const name = string(request.data?.name, "gallery name", 1, 99);
      const clientEmail = string(request.data?.clientEmail || "", "client email", 0, 254);
      if (clientEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)) throw new AccessError("invalid-argument", "Invalid client email.");
      const record = await passwordRecord(passwordValue(request.data?.password, true));
      await db.runTransaction(async (tx) => {
        const ref = db.doc(`galleries/${slug}`);
        if ((await tx.get(ref)).exists) throw new AccessError("already-exists", "A gallery with this name already exists.");
        tx.create(ref, { name, slug, clientEmail, photos: [], layout: "masonry", createdAt: FieldValue.serverTimestamp() });
        tx.set(db.doc(`gallerySecrets/${slug}`), record);
      });
      return { slug };
    },
    async setGalleryPassword(request) {
      requireAdmin(request.auth);
      const slug = slugValue(request.data?.slug);
      const record = await passwordRecord(passwordValue(request.data?.password, true));
      await db.runTransaction(async (tx) => {
        const ref = db.doc(`galleries/${slug}`);
        if (!(await tx.get(ref)).exists) throw new AccessError("not-found", "Gallery not found.");
        tx.set(db.doc(`gallerySecrets/${slug}`), record);
        tx.update(ref, { passwordHash: FieldValue.delete() });
      });
      return { updated: true };
    },
    async openGallery(request) {
      const slug = slugValue(request.data?.slug);
      let admin = false;
      try { requireAdmin(request.auth); admin = true; } catch { /* shared-password client */ }
      if (!admin) {
        requireApp(request);
        passwordValue(request.data?.password);
        // Shared across all slugs so guessing a different gallery cannot reset the budget.
        await rateLimit(request, "gallery-password", 10);
      }
      const ref = db.doc(`galleries/${slug}`);
      const secretRef = db.doc(`gallerySecrets/${slug}`);
      const [snapshot, secret] = await Promise.all([ref.get(), secretRef.get()]);
      const gallery = snapshot.data();
      if (!admin) {
        const correct = await verifyPassword(request.data.password, secret.data(), gallery?.passwordHash);
        if (!correct || !gallery) throw new AccessError("permission-denied", "Incorrect password or unavailable gallery.");
        if (!secret.exists) {
          const record = await passwordRecord(request.data.password);
          await db.runTransaction(async (tx) => {
            const [latest, latestSecret] = await Promise.all([tx.get(ref), tx.get(secretRef)]);
            if (!latest.exists || latestSecret.exists || latest.data().passwordHash !== gallery.passwordHash) {
              throw new AccessError("aborted", "Gallery access changed. Enter the password again.");
            }
            tx.set(secretRef, record);
            tx.update(ref, { passwordHash: FieldValue.delete() });
          });
        } else {
          // Do not issue links if an admin changed the password while verification ran.
          const latest = await secretRef.get();
          if (latest.data()?.hash !== secret.data().hash) throw new AccessError("aborted", "Gallery access changed. Enter the password again.");
        }
      }
      if (!gallery) throw new AccessError("not-found", "Gallery not found.");
      const expiresAt = clock() + SESSION_MS;
      return clientGallery(gallery, (photo, thumbnail) => signPhoto(photo, thumbnail, expiresAt), expiresAt);
    },
    async getGalleryUpload(request) {
      requireAdmin(request.auth);
      const slug = slugValue(request.data?.slug);
      const snapshot = await db.doc(`galleries/${slug}`).get();
      if (!snapshot.exists) throw new AccessError("not-found", "Gallery not found.");
      if ((snapshot.data().photos || []).length >= 500) throw new AccessError("resource-exhausted", "This gallery is full.");
      const params = { timestamp: Math.floor(clock() / 1000), public_id: `client-galleries/${slug}/${randomUUID()}`,
        type: "authenticated", overwrite: false, allowed_formats: "jpg,jpeg,png,webp,heic" };
      return { cloudName: cloudinary.config().cloud_name, apiKey: cloudinary.config().api_key,
        params, signature: cloudinary.utils.api_sign_request(params, cloudinary.config().api_secret) };
    },
    async registerGalleryPhotos(request) {
      requireAdmin(request.auth);
      const slug = slugValue(request.data?.slug);
      const ids = request.data?.publicIds;
      if (!Array.isArray(ids) || ids.length < 1 || ids.length > 25 || ids.some((id) => typeof id !== "string" || !id.startsWith(`client-galleries/${slug}/`) || id.length > 250)) {
        throw new AccessError("invalid-argument", "Invalid photo selection.");
      }
      // Never trust URLs, sizes, formats or delivery type from a browser upload response.
      const photos = [];
      for (const id of new Set(ids)) {
        const asset = await cloudinary.api.resource(id, { type: "authenticated", resource_type: "image" });
        if (asset.type !== "authenticated" || asset.resource_type !== "image" || asset.bytes > 30000000 ||
          !["jpg", "jpeg", "png", "webp", "heic"].includes(asset.format)) throw new AccessError("invalid-argument", "Unsupported image.");
        photos.push({ publicId: asset.public_id, assetId: asset.asset_id, format: asset.format, deliveryType: "authenticated",
          filename: `${asset.original_filename || id.split("/").at(-1)}.${asset.format}`,
          width: asset.width, height: asset.height, uploadedAt: new Date(clock()).toISOString() });
      }
      await db.runTransaction(async (tx) => {
        const ref = db.doc(`galleries/${slug}`);
        const snapshot = await tx.get(ref);
        if (!snapshot.exists) throw new AccessError("not-found", "Gallery not found.");
        const byId = new Map((snapshot.data().photos || []).map((photo) => [photo.publicId, photo]));
        photos.forEach((photo) => byId.set(photo.publicId, photo));
        if (byId.size > 500) throw new AccessError("resource-exhausted", "A gallery can contain at most 500 photos.");
        tx.update(ref, { photos: [...byId.values()] });
      });
      return { added: photos.length };
    },
    async deleteGalleryPhoto(request) {
      requireAdmin(request.auth);
      const slug = slugValue(request.data?.slug);
      const publicId = string(request.data?.publicId, "photo", 1, 250);
      await db.runTransaction(async (tx) => {
        const ref = db.doc(`galleries/${slug}`);
        const snapshot = await tx.get(ref);
        if (!snapshot.exists) throw new AccessError("not-found", "Gallery not found.");
        const gallery = snapshot.data();
        tx.update(ref, { photos: (gallery.photos || []).filter((photo) => photo.publicId !== publicId),
          ...(gallery.coverPhotoId === publicId ? { coverPhotoId: null } : {}) });
      });
      return { removed: true };
    },
    async deleteGallery(request) {
      requireAdmin(request.auth);
      const slug = slugValue(request.data?.slug);
      const batch = db.batch();
      batch.delete(db.doc(`galleries/${slug}`));
      batch.delete(db.doc(`gallerySecrets/${slug}`));
      await batch.commit();
      return { removed: true };
    },
  };
}
