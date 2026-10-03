/** Assemble only the supplied photos, using their original download URLs. */
export async function buildPhotoArchive(galleryName, photos, { onProgress, fetchPhoto = globalThis.fetch } = {}) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const folderName = String(galleryName || "Gallery").replace(/[\\/]/g, "_");
  const folder = zip.folder(folderName);
  const failedPhotos = [];
  let successCount = 0;
  onProgress?.({ phase: "fetching", completed: 0, total: photos.length });

  for (let index = 0; index < photos.length; index++) {
    const photo = photos[index];
    try {
      const response = await fetchPhoto(photo.downloadUrl || photo.url);
      if (!response.ok) throw new Error("Photo unavailable");
      const bytes = new Uint8Array(await response.arrayBuffer());
      let filename = String(photo.filename || `photo-${index + 1}.jpg`).replace(/[\\/]/g, "_");
      if (!filename.includes(".")) filename += ".jpg";
      // The prefix keeps files with duplicate names from replacing each other.
      folder.file(`${index + 1}-${filename}`, bytes);
      successCount++;
    } catch {
      failedPhotos.push(photo);
    }
    onProgress?.({ phase: "fetching", completed: index + 1, total: photos.length });
  }

  return { zip, successCount, failedPhotos };
}
