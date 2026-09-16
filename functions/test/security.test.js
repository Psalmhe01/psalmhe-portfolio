import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v2 as media } from "cloudinary";
import { createService } from "../service.js";
import { passwordRecord, verifyPassword, validateBooking, sha256, localDateTime } from "../policy.js";
import { migrateMedia } from "../migrate-media.js";

const now = Date.UTC(2027, 0, 19, 18);
const auth = { uid: "admin", token: { email: "psalmhe@gmail.com", email_verified: true } };
const request = (data, admin = false, ip = "192.0.2.1") => ({ data, app: { appId: "test-app" }, rawRequest: { ip }, ...(admin ? { auth } : {}) });
const payload = (extra = {}) => ({ firstName: "Test", lastName: "Client", email: "client@example.com", phone: "1234567890",
  bookingDate: "2027-01-20", bookingTime: "09:00", occasion: "Portrait", notes: "", requestId: "a".repeat(64), ...extra });
let app, db, service;
before(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("These tests require the Firestore emulator; live database access is forbidden.");
  app = initializeApp({ projectId: "demo-portfolio" }, "server-tests");
  db = getFirestore(app);
  media.config({ cloud_name: "test-cloud", api_key: "test-key", api_secret: "test-secret", secure: true });
  service = createService({ db, cloudinary: media, clock: () => now });
});
beforeEach(async () => {
  const response = await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/demo-portfolio/databases/(default)/documents`, { method: "DELETE" });
  assert.equal(response.ok, true);
});
after(async () => { if (app) await deleteApp(app); });
const rejects = (operation, code) => assert.rejects(operation, (error) => error.code === code);
async function gallery(extra = {}) {
  await service.createGallery(request({ slug: "private-session", name: "Private Session", clientEmail: "private@example.com", password: "a strong test password", ...extra }, true));
}

test("passwords use independent salts and legacy verification never treats a hash as a password", async () => {
  const a = await passwordRecord("a strong test password");
  const b = await passwordRecord("a strong test password");
  assert.notEqual(a.hash, b.hash);
  assert.equal(await verifyPassword("a strong test password", a), true);
  assert.equal(await verifyPassword("wrong", a), false);
  const legacy = sha256("legacy password");
  assert.equal(await verifyPassword("legacy password", null, legacy), true);
  assert.equal(await verifyPassword(legacy, null, legacy), false);
});
test("server validates real dates, lengths, reserved fields, booking horizon and business timezone", () => {
  for (const values of [{ bookingDate: "2027-02-30" }, { bookingDate: "2027-01-18" }, { bookingTime: "03:00" },
    { bookingDate: "2030-01-01" }, { notes: "x".repeat(1000) }, { status: "confirmed" }, { email: "broken" }, { timeZone: "UTC" }]) {
    assert.throws(() => validateBooking(payload(values), now), (error) => error.code === "invalid-argument");
  }
  assert.equal(validateBooking(payload(), now).timeZone, "America/Chicago");
  assert.equal(localDateTime(new Date("2027-01-20T03:00:00Z")), "2027-01-19 21:00");
  assert.equal(localDateTime(new Date("2027-07-20T03:00:00Z")), "2027-07-19 22:00");
});
test("booking creation requires verified app context and persists a private cancellation capability", async () => {
  await rejects(service.createBooking({ ...request(payload()), app: null }), "unauthenticated");
  const result = await service.createBooking(request(payload()));
  assert.match(result.cancellationToken, /^[a-f0-9]{64}$/);
  const availability = (await db.doc(`availability/${result.slotKey}`).get()).data();
  assert.deepEqual(Object.keys(availability).sort(), ["booked", "date"]);
  assert.equal((await db.doc(`bookingCancellations/${result.cancellationToken}`).get()).data().email, "client@example.com");
});
test("a retry returns the same booking without duplication; altered retry payload is rejected", async () => {
  const first = await service.createBooking(request(payload()));
  const retry = await service.createBooking(request(payload()));
  assert.equal(retry.cancellationToken, first.cancellationToken);
  assert.equal(retry.repeated, true);
  await rejects(service.createBooking(request(payload({ firstName: "Different" }))), "invalid-argument");
});
test("concurrent requests cannot double-book a slot", async () => {
  const results = await Promise.allSettled([
    service.createBooking(request(payload())),
    service.createBooking(request(payload({ requestId: "b".repeat(64) }))),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.find((result) => result.status === "rejected").reason.code, "already-exists");
});
test("completed cancellation cannot be resurrected by replaying a booking request", async () => {
  const first = await service.createBooking(request(payload()));
  const batch = db.batch();
  batch.delete(db.doc(`bookings/${first.slotKey}`));
  batch.delete(db.doc(`availability/${first.slotKey}`));
  batch.delete(db.doc(`bookingCancellations/${first.cancellationToken}`));
  await batch.commit();
  await rejects(service.createBooking(request(payload())), "failed-precondition");
  assert.equal((await db.doc(`bookings/${first.slotKey}`).get()).exists, false);
});
test("denied bookings are archived when a new reservation takes the slot", async () => {
  const first = await service.createBooking(request(payload()));
  await db.doc(`bookings/${first.slotKey}`).update({ status: "denied" });
  await db.doc(`availability/${first.slotKey}`).delete();
  const next = await service.createBooking(request(payload({ requestId: "b".repeat(64) })));
  assert.notEqual(first.cancellationToken, next.cancellationToken);
  assert.equal((await db.doc(`bookingCancellations/${first.cancellationToken}`).get()).exists, false);
  assert.equal((await db.collection("bookingHistory").get()).size, 1);
});
test("booking attempts have a persistent IP rate limit", async () => {
  for (let i = 0; i < 8; i++) {
    await service.createBooking(request(payload({ requestId: i.toString(16).padStart(64, "0"), bookingTime: `${String(9 + i).padStart(2, "0")}:00` })));
  }
  await rejects(service.createBooking(request(payload({ requestId: "f".repeat(64), bookingTime: "18:00" }))), "resource-exhausted");
});
test("gallery creation and password reset require the verified photographer identity", async () => {
  const data = { slug: "private-session", name: "Private Session", password: "a strong test password" };
  await rejects(service.createGallery(request(data)), "permission-denied");
  await rejects(service.createGallery({ ...request(data), auth: { token: { email: "psalmhe@gmail.com", email_verified: false } } }), "permission-denied");
  await rejects(service.createGallery(request({ ...data, password: "short" }, true)), "invalid-argument");
  await gallery();
  assert.equal((await db.doc("galleries/private-session").get()).data().passwordHash, undefined);
  await rejects(service.setGalleryPassword(request({ slug: "private-session", password: "changed password" })), "permission-denied");
});
test("wrong and missing galleries use the same generic error, with a cross-gallery attempt limit", async () => {
  await gallery();
  for (let i = 0; i < 10; i++) {
    await rejects(service.openGallery(request({ slug: i % 2 ? "missing-session" : "private-session", password: "wrong" })), "permission-denied");
  }
  await rejects(service.openGallery(request({ slug: "another-gallery", password: "wrong" })), "resource-exhausted");
});
test("clients receive only sanitized data and expiring, signed media links", async () => {
  await gallery();
  await db.doc("galleries/private-session").update({ photos: [{ publicId: "client-galleries/private-session/photo", assetId: "a".repeat(32),
    deliveryType: "authenticated", format: "jpg", filename: "portrait.jpg", width: 100, height: 200, url: "https://old-public-url" }] });
  const result = await service.openGallery(request({ slug: "private-session", password: "a strong test password" }));
  assert.equal(result.clientEmail, undefined);
  assert.equal(result.passwordHash, undefined);
  assert.equal(result.createdAt, undefined);
  assert.equal(result.expiresAt, now + 15 * 60000);
  assert.equal(JSON.stringify(result).includes("old-public-url"), false);
  for (const url of [result.photos[0].url, result.photos[0].thumbnailUrl]) {
    const params = Object.fromEntries(new URL(url).searchParams);
    assert.equal(Number(params.expires_at), Math.floor(result.expiresAt / 1000));
    const { signature, api_key, ...signed } = params;
    assert.equal(signature, media.utils.api_sign_request(signed, "test-secret"));
    assert.equal(api_key, "test-key");
  }
  assert.equal(new URL(result.photos[0].thumbnailUrl).searchParams.get("transformation"), "c_limit,w_600,q_auto");
});
test("client access fails closed for still-public legacy photos", async () => {
  await gallery();
  await db.doc("galleries/private-session").update({ photos: [{ publicId: "legacy/photo", url: "https://public.example/photo" }] });
  await rejects(service.openGallery(request({ slug: "private-session", password: "a strong test password" })), "failed-precondition");
});
test("legacy hashes migrate to server-only scrypt records after successful verification", async () => {
  await db.doc("galleries/legacy-session").set({ name: "Legacy", slug: "legacy-session", photos: [], passwordHash: sha256("legacy password") });
  await service.openGallery(request({ slug: "legacy-session", password: "legacy password" }));
  assert.equal((await db.doc("gallerySecrets/legacy-session").get()).data().algorithm, "scrypt-v1");
  assert.equal((await db.doc("galleries/legacy-session").get()).data().passwordHash, undefined);
});
test("password reset invalidates the old password", async () => {
  await gallery();
  await service.setGalleryPassword(request({ slug: "private-session", password: "a different secure password" }, true));
  await rejects(service.openGallery(request({ slug: "private-session", password: "a strong test password" })), "permission-denied");
  assert.equal((await service.openGallery(request({ slug: "private-session", password: "a different secure password" }))).name, "Private Session");
});
test("upload signatures are admin-only and bind the asset to authenticated delivery", async () => {
  await gallery();
  await rejects(service.getGalleryUpload(request({ slug: "private-session" })), "permission-denied");
  const result = await service.getGalleryUpload(request({ slug: "private-session", type: "upload", public_id: "other/photo" }, true));
  assert.equal(result.params.type, "authenticated");
  assert.equal(result.params.overwrite, false);
  assert.match(result.params.public_id, /^client-galleries\/private-session\//);
  assert.equal(result.signature, media.utils.api_sign_request(result.params, "test-secret"));
  assert.equal(JSON.stringify(result).includes("test-secret"), false);
});
test("photo registration rejects cross-gallery paths and verifies provider metadata", async () => {
  await gallery();
  await rejects(service.registerGalleryPhotos(request({ slug: "private-session", publicIds: ["client-galleries/other/photo"] }, true)), "invalid-argument");
  const original = media.api.resource;
  media.api.resource = async () => ({ public_id: "client-galleries/private-session/photo", type: "upload", resource_type: "image", bytes: 100, format: "jpg" });
  try {
    await rejects(service.registerGalleryPhotos(request({ slug: "private-session", publicIds: ["client-galleries/private-session/photo"] }, true)), "invalid-argument");
  } finally { media.api.resource = original; }
});

test("verified photos are appended without duplicating successful retries", async () => {
  await gallery();
  const original = media.api.resource;
  media.api.resource = async (id) => ({ public_id: id, asset_id: "a".repeat(32), type: "authenticated", resource_type: "image", bytes: 100,
    format: "jpg", width: 100, height: 200, original_filename: "portrait" });
  try {
    const data = { slug: "private-session", publicIds: ["client-galleries/private-session/photo"] };
    await service.registerGalleryPhotos(request(data, true));
    await service.registerGalleryPhotos(request(data, true));
    const photos = (await db.doc("galleries/private-session").get()).data().photos;
    assert.equal(photos.length, 1);
    assert.equal(photos[0].deliveryType, "authenticated");
    assert.equal(photos[0].url, undefined);
  } finally { media.api.resource = original; }
});
test("migration dry-run changes nothing and refuses shared portfolio photos", async () => {
  await db.doc("galleries/legacy-session").set({ name: "Legacy", photos: [{ publicId: "legacy/portrait" }] });
  const result = await migrateMedia({ db, slug: "legacy-session", cloudinary: {} });
  assert.deepEqual(result.photos, ["legacy/portrait"]);
  assert.equal((await db.doc("galleries/legacy-session").get()).data().photos[0].deliveryType, undefined);
  await assert.rejects(migrateMedia({ db, slug: "legacy-session", cloudinary: {}, portfolioSource: 'image: "portrait.jpg"' }), /public portfolio/);
});
test("migration recovers after the media rename succeeded but the metadata write did not", async () => {
  await db.doc("galleries/legacy-session").set({ name: "Legacy", photos: [{ publicId: "legacy/portrait", url: "https://public.example/photo" }] });
  const stub = { api: { resource: async (_id, options) => {
    if (options.type === "upload") throw { http_code: 404 };
    return { public_id: "legacy/portrait", asset_id: "a".repeat(32), type: "authenticated", format: "jpg", width: 100, height: 200 };
  } }, uploader: { rename: () => { throw new Error("Should not rename again"); } } };
  await migrateMedia({ db, cloudinary: stub, slug: "legacy-session", apply: true });
  const migrated = (await db.doc("galleries/legacy-session").get()).data().photos[0];
  assert.equal(migrated.deliveryType, "authenticated");
  assert.equal(migrated.url, undefined);
});
