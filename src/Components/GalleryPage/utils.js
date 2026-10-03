import { notifications } from "@mantine/notifications";
import { buildPhotoArchive } from "./photoArchive.mjs";

/**
 * Load Google Font into the document
 */
export function loadGoogleFont(family) {
  if (!family) return;
  const id = `gf-${family.replace(/\s+/g, "-")}`;
  if (!family || document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap`;
  document.head.appendChild(link);
}

/**
 * Download a single photo
 */
export async function downloadSinglePhoto(photo) {
  try {
    const res = await fetch(photo.downloadUrl || photo.url);
    if (!res.ok) throw new Error("Photo unavailable");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = photo.filename || "photo.jpg";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    notifications.show({ message: "Download failed.", color: "red" });
  }
}

/** Download the supplied photos as a ZIP (all photos or the chosen subset). */
export async function downloadAllPhotosAsZip(galleryName, photos, { selected = false, onProgress } = {}) {
  if (!photos?.length) {
    notifications.show({ message: "No photos to download.", color: "yellow" });
    return;
  }

  try {
    const { zip, successCount, failedPhotos } = await buildPhotoArchive(galleryName, photos, { onProgress });
    if (successCount === 0) {
      notifications.show({ message: "No photos could be downloaded. Please try again.", color: "red" });
      return;
    }

    onProgress?.({ phase: "packaging", completed: photos.length, total: photos.length });
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = String(galleryName || "gallery").replace(/[\\/:*?"<>|]/g, "_");
    link.download = `${safeName}-${selected ? "selected-" : ""}photos.zip`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    notifications.show({
      message: failedPhotos.length
        ? `Your ZIP contains ${successCount} photos. ${failedPhotos.length} couldn’t be downloaded; please try again.`
        : `Downloaded ${successCount} ${successCount === 1 ? "photo" : "photos"}.`,
      color: failedPhotos.length ? "yellow" : "green",
    });
  } catch {
    notifications.show({ message: "Failed to create the download. Please try again.", color: "red" });
  }
}
