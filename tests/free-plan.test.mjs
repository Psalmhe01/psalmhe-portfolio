
import { test } from "node:test";
import assert from "node:assert/strict";
import { newGalleryKey, encryptGallery, decryptGallery } from "../src/galleryCrypto.js";
import { sessionDate } from "../src/bookingSchedule.js";
test("gallery encryption hides PII, password material, and photo URLs; only the right password unlocks", async () => {
  const password="a long random test password";
  const access=await newGalleryKey(password);
  const gallery={slug:"sample",name:"Session",clientEmail:"private@example.com",passwordHash:"oldhash",access,
    photos:[{publicId:"photo",url:"https://res.cloudinary.com/test/image/upload/photo.jpg",filename:"photo.jpg",internalSecret:"hidden"}]};
  const envelope=await encryptGallery(gallery,access);
  const serialized=JSON.stringify(envelope);
  for (const secret of [password,access.key,gallery.clientEmail,gallery.photos[0].url]) assert.ok(!serialized.includes(secret));
  const opened=await decryptGallery("sample",password,envelope);
  assert.equal(opened.photos[0].url,gallery.photos[0].url);
  for (const key of ["clientEmail","passwordHash","access"]) assert.equal(opened[key],undefined);
  assert.equal(opened.photos[0].internalSecret,undefined);
  await assert.rejects(decryptGallery("sample","wrong password",envelope));
  await assert.rejects(decryptGallery("different-slug",password,envelope));
  await assert.rejects(decryptGallery("sample",password,{...envelope,ciphertext:"A"+envelope.ciphertext.slice(1, -4)+"AAAA"}));
});
test("password rotation and fresh IVs change encrypted shares", async () => {
  const g={slug:"sample",name:"Session",photos:[]};
  const first=await newGalleryKey("first long password");
  const one=await encryptGallery(g,first), two=await encryptGallery(g,first);
  assert.notEqual(one.iv,two.iv); assert.notEqual(one.ciphertext,two.ciphertext);
  const rotated=await encryptGallery(g,await newGalleryKey("second long password"));
  await assert.rejects(decryptGallery("sample","first long password",rotated));
  assert.equal((await decryptGallery("sample","second long password",rotated)).name,"Session");
  await assert.rejects(newGalleryKey("123"));
  const pinEnvelope=await encryptGallery(g,await newGalleryKey("0123"));
  assert.equal((await decryptGallery("sample","0123",pinEnvelope)).name,"Session");
});
test("Chicago appointment times cover daylight saving transitions and valid calendars", () => {
  assert.equal(sessionDate("2027-03-13","09:00").toISOString(),"2027-03-13T15:00:00.000Z");
  assert.equal(sessionDate("2027-03-14","09:00").toISOString(),"2027-03-14T14:00:00.000Z");
  assert.equal(sessionDate("2027-11-06","09:00").toISOString(),"2027-11-06T14:00:00.000Z");
  assert.equal(sessionDate("2027-11-07","09:00").toISOString(),"2027-11-07T15:00:00.000Z");
  for (const date of ["2027-02-29","2027-04-31","bad"]) assert.throws(()=>sessionDate(date,"09:00"));
  assert.throws(()=>sessionDate("2027-01-01","23:00"));
});
