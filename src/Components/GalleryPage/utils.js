import JSZip from "jszip";
import { notifications } from "@mantine/notifications";

/**
 * Load Google Font into the document
 */
export function loadGoogleFont(family) {
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
    const res = await fetch(photo.url);
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

/**
 * Download all photos as a zip file
 */
export async function downloadAllPhotosAsZip(galleryName, photos) {
  if (!photos || photos.length === 0) {
    notifications.show({
      message: "No photos to download.",
      color: "yellow",
    });
    return;
  }

  const zip = new JSZip();
  let successCount = 0;
  let failCount = 0;

  // Create a folder in the zip
  const folder = zip.folder(galleryName || "Gallery");

  for (let i = 0; i < photos.length; i++) {
    try {
      const photo = photos[i];
      const response = await fetch(photo.url);
      const blob = await response.blob();

      // Get file extension from filename or URL
      let filename = photo.filename || `photo-${i + 1}.jpg`;
      // Ensure filename has extension
      if (!filename.includes(".")) {
        filename += ".jpg";
      }

      folder.file(filename, blob);
      successCount++;
    } catch (err) {
      console.error(`Failed to download photo ${i + 1}:`, err);
      failCount++;
    }
  }

  try {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${galleryName || "gallery"}-photos.zip`;
    link.click();
    URL.revokeObjectURL(url);

    notifications.show({
      message: `Downloaded ${successCount} photos${failCount > 0 ? ` (${failCount} failed)` : ""}`,
      color: successCount > 0 ? "green" : "red",
    });
  } catch (err) {
    notifications.show({
      message: "Failed to create zip file.",
      color: "red",
    });
  }
}
