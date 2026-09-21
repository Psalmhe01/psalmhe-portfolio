import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp } from "firebase/firestore";

import { sessionDate } from "../src/bookingSchedule.js";

let env;
let client;
let admin;
const futureDay = new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10);
const slot = futureDay + " 09:00";
const token = "a".repeat(64);
const otherToken = "b".repeat(64);
const booking = (access = token) => ({
  firstName: "Test", lastName: "Client", email: "client@example.com", phone: "1234567890",
  occasion: "Portrait", notes: "", bookingDate: futureDay, bookingTime: "09:00",
  startsAt: Timestamp.fromDate(sessionDate(futureDay, "09:00")), timeZone: "America/Chicago", slotKey: slot, status: "pending", createdAt: serverTimestamp(), cancellationToken: access,
});
const details = () => ({ timeZone: "America/Chicago", slotKey: slot, bookingDate: futureDay, bookingTime: "09:00",
  firstName: "Test", lastName: "Client", email: "client@example.com", occasion: "Portrait" });
const reservation = async (db, access = token) => {
  const batch = writeBatch(db);
  batch.set(doc(db, "bookings", slot), booking(access));
  batch.set(doc(db, "availability", slot), { booked: true, date: futureDay });
  batch.set(doc(db, "bookingCancellations", access), details());
  batch.set(doc(db, "bookingReceipts", access), { slotKey: slot, digest: access, createdAt: serverTimestamp() });
  return batch.commit();
};

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

test("signed-out clients can cancel a booking created without a backend with the secret link", async () => {
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
  await assertFails(setDoc(doc(client, "availability", slot), { booked: true, date: futureDay }));
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
    await setDoc(doc(context.firestore(), "availability", slot), { booked: true, date: futureDay });
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
test("only admins can edit gallery photos, and design bounds still apply", async () => {
  await assertFails(setDoc(doc(admin, "bookings", slot), booking()));
  await assertFails(setDoc(doc(admin, "gallerySecrets", "sample"), { hash: "new" }));
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "galleries", "sample"), { name: "Sample", photos: [], layout: "masonry" });
  });
  await assertFails(updateDoc(doc(client, "galleries", "sample"), { photos: [{ url: "https://untrusted.example/photo" }] }));
  await assertSucceeds(updateDoc(doc(admin, "galleries", "sample"), { photos: [] }));
  await assertFails(updateDoc(doc(client, "galleries", "sample"), { passwordHash: "forged" }));
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

test("competing anonymous reservations cannot overwrite the winner", async () => {
  const outcomes = await Promise.allSettled([reservation(client), reservation(client, otherToken)]);
  assert.equal(outcomes.filter(o => o.status === "fulfilled").length, 1);
});
test("a completed receipt cannot be reused to resurrect a cancelled request", async () => {
  await reservation(client);
  await cancel(client);
  await assertFails(reservation(client));
  await assertSucceeds(reservation(client, otherToken));
  await assertFails(getDocs(collection(client, "bookingReceipts")));
  await assertFails(updateDoc(doc(client, "bookingReceipts", token), { digest: otherToken }));
});
test("a receipt cannot be forged without a linked booking", async () => {
  await assertFails(setDoc(doc(client, "bookingReceipts", token), { slotKey: slot, digest: token, createdAt: serverTimestamp() }));
});
test("booking fields, future times, and Chicago offsets are enforced on writes", async () => {
  for (const changes of [
    { status: "confirmed" }, { firstName: "" }, { notes: "x".repeat(1000) },
    { email: "not-an-email" }, { timeZone: "UTC" }, { admin: true },
    { startsAt: Timestamp.fromMillis(Date.now()-60000) },
    { startsAt: Timestamp.fromMillis(sessionDate(futureDay,"09:00").getTime()+3600000) },
    { bookingDate: "2027-02-30" }, { bookingTime: "23:00" }
  ]) {
    const batch=writeBatch(client);
    batch.set(doc(client,"bookings",slot), { ...booking(), ...changes });
    batch.set(doc(client,"availability",slot), { booked:true, date:futureDay });
    batch.set(doc(client,"bookingCancellations",token), details());
    batch.set(doc(client,"bookingReceipts",token), { slotKey:slot,digest:token,createdAt:serverTimestamp() });
    await assertFails(batch.commit());
  }
});
test("cancellation documents cannot substitute other contact data", async () => {
  const batch=writeBatch(client);
  batch.set(doc(client,"bookings",slot), booking());
  batch.set(doc(client,"availability",slot), { booked:true, date:futureDay });
  batch.set(doc(client,"bookingCancellations",token), { ...details(), email:"attacker@example.com" });
  batch.set(doc(client,"bookingReceipts",token), { slotKey:slot,digest:token,createdAt:serverTimestamp() });
  await assertFails(batch.commit());
});
const envelope = (revision=1) => ({version:1,salt:"s".repeat(24),iv:"i".repeat(16),ciphertext:"x".repeat(24),revision});
const gallery = (revision=1) => ({name:"Private",slug:"private",photos:[],clientEmail:"private@example.com",access:{salt:"s".repeat(24),key:"k".repeat(44)},revision});
test("encrypted shares are public by exact link; private gallery data and lists remain denied", async () => {
  const batch=writeBatch(admin);
  batch.set(doc(admin,"galleries","private"),gallery());
  batch.set(doc(admin,"galleryShares","private"),envelope());
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(doc(client,"galleryShares","private")));
  await assertFails(getDocs(collection(client,"galleryShares")));
  await assertFails(getDoc(doc(client,"galleries","private")));
  await assertFails(updateDoc(doc(client,"galleryShares","private"),{ciphertext:"y".repeat(24)}));
  await assertFails(updateDoc(doc(admin,"galleryShares","private"),{clientEmail:"leaked@example.com"}));
  await assertFails(updateDoc(doc(admin,"galleries","private"),{revision:2}));
  const next=writeBatch(admin);
  next.update(doc(admin,"galleries","private"),{revision:2});
  next.set(doc(admin,"galleryShares","private"),envelope(2));
  await assertSucceeds(next.commit());
  await assertFails(deleteDoc(doc(admin,"galleries","private")));
  const remove=writeBatch(admin);
  remove.delete(doc(admin,"galleries","private")); remove.delete(doc(admin,"galleryShares","private"));
  await assertSucceeds(remove.commit());
});
test("public shares cannot be published without a matching private gallery", async () => {
  await assertFails(setDoc(doc(admin,"galleryShares","private"),envelope()));
  await assertFails(setDoc(doc(client,"galleries","private"),gallery()));
});
test("legacy gallery can be published by setting a new private encryption key", async () => {
  await setDoc(doc(admin,"galleries","private"),{name:"Legacy",photos:[],passwordHash:token});
  const batch=writeBatch(admin);
  batch.set(doc(admin,"galleries","private"),gallery());
  batch.set(doc(admin,"galleryShares","private"),envelope());
  await assertSucceeds(batch.commit());
});

test("the real reservation transaction supports retries without duplicating or resurrecting requests", async () => {
  const { reserveBooking } = await import("../src/bookingReservations.js");
  const input={firstName:"Test",lastName:"Client",email:"client@example.com",phone:"1234567890",
    occasion:"Portrait",notes:"",bookingDate:futureDay,bookingTime:"09:00",requestId:token};
  const first=await reserveBooking(client,input);
  const retry=await reserveBooking(client,input);
  assert.equal(retry.cancellationToken,first.cancellationToken);
  await assert.rejects(reserveBooking(client,{...input,notes:"changed"}),{code:"invalid-argument"});
  await assert.rejects(reserveBooking(client,{...input,requestId:otherToken}),{code:"already-exists"});
  await cancel(client);
  await assert.rejects(reserveBooking(client,input),{code:"failed-precondition"});
  await reserveBooking(client,{...input,requestId:otherToken});
  await assertFails(cancel(client));
});
test("rules validate Chicago daylight-saving timestamps across the next year", async () => {
  const { reserveBooking } = await import("../src/bookingReservations.js");
  for (const monthOffset of [1,5,9]) {
    const day = new Date(Date.now()+monthOffset*30*86400000).toISOString().slice(0,10);
    const id = String(monthOffset).repeat(64);
    await assertSucceeds(reserveBooking(client,{firstName:"Test",lastName:"Client",email:"client@example.com",phone:"1234567890",
      occasion:"",notes:"",bookingDate:day,bookingTime:"18:00",requestId:id}));
  }
});
