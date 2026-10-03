import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { buildPhotoArchive } from "../src/Components/GalleryPage/photoArchive.mjs";

test("selected downloads contain only chosen originals and preserve duplicate filenames", async () => {
  const allPhotos = [
    { publicId: "one", url: "preview-one", downloadUrl: "original-one", filename: "portrait.jpg" },
    { publicId: "two", url: "preview-two", downloadUrl: "original-two", filename: "portrait.jpg" },
    { publicId: "three", url: "preview-three", downloadUrl: "original-three", filename: "portrait.jpg" },
  ];
  const selectedIds = new Set(["one", "three"]);
  const requested = [];
  const progress = [];
  const result = await buildPhotoArchive("Client/Session", allPhotos.filter((photo) => selectedIds.has(photo.publicId)), {
    fetchPhoto: async (url) => { requested.push(url); return new Response(url); },
    onProgress: (value) => progress.push(value),
  });
  const archive = await JSZip.loadAsync(await result.zip.generateAsync({ type: "uint8array" }));
  const files = Object.values(archive.files).filter((file) => !file.dir);
  assert.deepEqual(requested, ["original-one", "original-three"]);
  assert.deepEqual(files.map((file) => file.name), ["Client_Session/1-portrait.jpg", "Client_Session/2-portrait.jpg"]);
  assert.equal(await files[1].async("string"), "original-three");
  assert.equal(result.successCount, 2);
  assert.deepEqual(result.failedPhotos, []);
  assert.deepEqual(progress.map((value) => value.completed), [0, 1, 2]);
  assert.equal(progress.at(-1).total, 2);
});

test("partial failures retain available photos, report failed photos, and finish progress", async () => {
  const photos = [
    { publicId: "one", url: "available", filename: "../portrait" },
    { publicId: "two", url: "missing", filename: "missing.jpg" },
    { publicId: "three", url: "offline", filename: "offline.jpg" },
  ];
  const progress = [];
  const result = await buildPhotoArchive("Gallery", photos, {
    fetchPhoto: async (url) => {
      if (url === "offline") throw new Error("Network failure");
      return new Response("photo bytes", { status: url === "missing" ? 404 : 200 });
    },
    onProgress: (value) => progress.push(value),
  });
  assert.equal(result.successCount, 1);
  assert.deepEqual(result.failedPhotos.map((photo) => photo.publicId), ["two", "three"]);
  assert.equal(Object.values(result.zip.files).filter((file) => !file.dir).length, 1);
  assert.equal(progress.at(-1).completed, 3);
  assert.equal(progress.at(-1).total, 3);
});

test("empty and fully unavailable selections produce no photo entries", async () => {
  for (const photos of [[], [{ publicId: "missing", url: "missing" }]]) {
    const result = await buildPhotoArchive("Gallery", photos, { fetchPhoto: async () => new Response("", { status: 403 }) });
    assert.equal(result.successCount, 0);
    assert.equal(Object.values(result.zip.files).filter((file) => !file.dir).length, 0);
    assert.equal(result.failedPhotos.length, photos.length);
  }
});
