import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";

let env;
let client;
let admin;
const slot = "2027-01-20 09:00";
const token = "a".repeat(64);
const otherToken = "b".repeat(64);
const booking = (access = token) => ({
  firstName: "Test", lastName: "Client", email: "client@example.com", phone: "1234567890",
  occasion: "Portrait", notes: "", bookingDate: "2027-01-20", bookingTime: "09:00",
  slotKey: slot, status: "pending", createdAt: serverTimestamp(), cancellationToken: access,
});
const details = () => ({ slotKey: slot, bookingDate: "2027-01-20", bookingTime: "09:00",
  firstName: "Test", lastName: "Client", email: "client@example.com", occasion: "Portrait" });
// Fixture models writes from the trusted booking service, which is tested separately.
const reservation = async (_db, access = token) => env.withSecurityRulesDisabled(async (context) => {
  const db = context.firestore();
  const batch = writeBatch(db);
  batch.set(doc(db, "bookings", slot), booking(access));
  batch.set(doc(db, "availability", slot), { booked: true, date: "2027-01-20" });
  batch.set(doc(db, "bookingCancellations", access), details());
  return batch.commit();
});

const cancel = (db, access = token) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, "bookings", slot));
  batch.delete(doc(db, "availability", slot));
  batch.delete(doc(db, "bookingCancellations", access));
  return batch.commit();
};
before(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-portfolio", firestore: {
    host: "127.0.0.1", port: 8080, rules: await readFile("firestore.rules", "utf8"),
  } });
  client = env.unauthenticatedContext().firestore();
  admin = env.authenticatedContext("photographer", { email: "psalmhe@gmail.com", email_verified: true }).firestore();
});
beforeEach(async () => env.clearFirestore());
after(async () => env?.cleanup());

test("signed-out clients can cancel a server-created booking with the secret link", async () => {
  await assertSucceeds(reservation(client));
  await assertSucceeds(getDoc(doc(client, "bookingCancellations", token)));
  await assertSucceeds(cancel(client));
  assert.equal((await getDoc(doc(admin, "bookings", slot))).exists(), false);
  assert.equal((await getDoc(doc(client, "availability", slot))).exists(), false);
});
test("booking PII and cancellation link lists are private", async () => {
  await reservation(client);
  await assertFails(getDoc(doc(client, "bookings", slot)));
  await assertFails(getDocs(collection(client, "bookings")));
  await assertFails(getDocs(collection(client, "bookingCancellations")));
  await assertSucceeds(getDocs(collection(admin, "bookings")));
});
test("a guessed slot or wrong token cannot cancel a booking", async () => {
  await reservation(client);
  await assertFails(cancel(client, otherToken));
  assert.equal((await getDoc(doc(admin, "bookings", slot))).exists(), true);
});
test("partial cancellation cannot leave orphaned availability or booking data", async () => {
  await reservation(client);
  for (const [path, id] of [["bookings", slot], ["availability", slot], ["bookingCancellations", token]]) {
    await assertFails(deleteDoc(doc(client, path, id)));
  }
  const batch = writeBatch(client);
  batch.delete(doc(client, "bookings", slot));
  batch.delete(doc(client, "availability", slot));
  await assertFails(batch.commit());
});
test("reused links cannot cancel a replacement appointment", async () => {
  await reservation(client);
  await cancel(client);
  await reservation(client, otherToken);
  await assertFails(cancel(client));
  assert.equal((await getDoc(doc(admin, "bookings", slot))).data().cancellationToken, otherToken);
});
test("denied slots can be booked again with a new token", async () => {
  await reservation(client);
  const batch = writeBatch(admin);
  batch.update(doc(admin, "bookings", slot), { status: "denied" });
  batch.delete(doc(admin, "availability", slot));
  batch.delete(doc(admin, "bookingCancellations", token));
  await batch.commit();
  await assertSucceeds(reservation(client, otherToken));
  await assertFails(cancel(client));
});
test("clients cannot reserve an occupied slot or change status/contact data", async () => {
  await reservation(client);
  await assertFails(setDoc(doc(client, "bookings", slot), booking(otherToken)));
  await assertFails(updateDoc(doc(client, "bookings", slot), { status: "confirmed" }));
  await assertFails(updateDoc(doc(client, "bookingCancellations", token), { email: "other@example.com" }));
});
test("forged standalone booking, slot, and capability writes are denied", async () => {
  await assertFails(setDoc(doc(client, "bookings", slot), booking()));
  await assertFails(setDoc(doc(client, "availability", slot), { booked: true, date: "2027-01-20" }));
  await assertFails(setDoc(doc(client, "bookingCancellations", token), details()));
});
test("ordinary accounts and unverified admin-email accounts have no admin rights", async () => {
  await reservation(client);
  for (const claims of [{ email: "other@example.com", email_verified: true }, { email: "psalmhe@gmail.com", email_verified: false }]) {
    const db = env.authenticatedContext(claims.email, claims).firestore();
    await assertFails(getDocs(collection(db, "bookings")));
    await assertFails(updateDoc(doc(db, "bookings", slot), { status: "confirmed" }));
    await assertFails(getDocs(collection(db, "galleries")));
  }
});
test("confirmed bookings remain cancellable without an admin session", async () => {
  await reservation(client);
  await updateDoc(doc(admin, "bookings", slot), { status: "confirmed" });
  await assertSucceeds(cancel(client));
});
test("admin can issue a cancellation link for a legacy confirmed booking", async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    const legacy = booking();
    delete legacy.cancellationToken;
    legacy.status = "confirmed";
    await setDoc(doc(context.firestore(), "bookings", slot), legacy);
    await setDoc(doc(context.firestore(), "availability", slot), { booked: true, date: "2027-01-20" });
  });
  const batch = writeBatch(admin);
  batch.update(doc(admin, "bookings", slot), { cancellationToken: token });
  batch.set(doc(admin, "bookingCancellations", token), details());
  await assertSucceeds(batch.commit());
  await assertSucceeds(cancel(client));
});


test("all gallery documents and password verifiers reject direct client reads", async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "galleries", "private-gallery"), { name: "Private", photos: [], clientEmail: "private@example.com", passwordHash: token });
    await setDoc(doc(context.firestore(), "gallerySecrets", "private-gallery"), { hash: "secret" });
  });
  await assertFails(getDoc(doc(client, "galleries", "private-gallery")));
  await assertFails(getDocs(collection(client, "galleries")));
  await assertFails(getDoc(doc(admin, "gallerySecrets", "private-gallery")));
  await assertSucceeds(getDoc(doc(admin, "galleries", "private-gallery")));
});
test("even admin clients cannot bypass server booking, photo, or password validation", async () => {
  await assertFails(setDoc(doc(admin, "bookings", slot), booking()));
  await assertFails(setDoc(doc(admin, "gallerySecrets", "sample"), { hash: "new" }));
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "galleries", "sample"), { name: "Sample", photos: [], layout: "masonry" });
  });
  await assertFails(updateDoc(doc(admin, "galleries", "sample"), { photos: [{ url: "https://untrusted.example/photo" }] }));
  await assertFails(updateDoc(doc(admin, "galleries", "sample"), { passwordHash: "forged" }));
  await assertFails(updateDoc(doc(admin, "galleries", "sample"), { gridCols: 1000 }));
  await assertSucceeds(updateDoc(doc(admin, "galleries", "sample"), { gridCols: 4, titleFont: "Outfit", overlayOpacity: 0.5 }));
});
test("rate counters and booking retry receipts are never writable or readable by clients", async () => {
  for (const path of ["rateLimits/test", "bookingRequests/test"]) {
    await assertFails(getDoc(doc(client, path)));
    await assertFails(setDoc(doc(client, path), { count: 0 }));
    await assertFails(setDoc(doc(admin, path), { count: 0 }));
  }
});
test("admin denial and deletion must release all related documents together", async () => {
  await reservation(client);
  await assertFails(updateDoc(doc(admin, "bookings", slot), { status: "denied" }));
  await assertFails(deleteDoc(doc(admin, "availability", slot)));
  await assertFails(deleteDoc(doc(admin, "bookings", slot)));
  await assertSucceeds(cancel(admin));
});
