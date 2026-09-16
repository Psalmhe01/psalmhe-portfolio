import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { v2 as cloudinary } from "cloudinary";
import { createService } from "./service.js";
import { AccessError, TIME_ZONE } from "./policy.js";

initializeApp();
const cloudName = defineString("CLOUDINARY_CLOUD_NAME");
const cloudApiKey = defineString("CLOUDINARY_API_KEY");
const cloudSecret = defineSecret("CLOUDINARY_API_SECRET");
const bookingZone = defineString("BOOKING_TIME_ZONE", { default: TIME_ZONE });
const emulator = process.env.FUNCTIONS_EMULATOR === "true";
function endpoint(name, media = false, publicEntry = false) {
  return onCall({ region: "us-central1", maxInstances: 5, concurrency: 4, memory: "512MiB", timeoutSeconds: 120,
    enforceAppCheck: publicEntry && !emulator, secrets: media ? [cloudSecret] : [] }, async (request) => {
    try {
      if (media) cloudinary.config({ cloud_name: cloudName.value(), api_key: cloudApiKey.value(), api_secret: cloudSecret.value(), secure: true });
      const service = createService({ db: getFirestore(), cloudinary, timeZone: bookingZone.value(), appCheckRequired: !emulator });
      return await service[name](request);
    } catch (error) {
      if (error instanceof AccessError) throw new HttpsError(error.code, error.message);
      // Do not log request bodies, passwords, contact data, or signed media URLs.
      console.error("Portfolio operation failed", { operation: name, code: error.code || "internal" });
      throw new HttpsError("internal", "Unable to complete this request. Please try again.");
    }
  });
}
export const createBooking = endpoint("createBooking", false, true);
export const createGallery = endpoint("createGallery");
export const setGalleryPassword = endpoint("setGalleryPassword");
export const openGallery = endpoint("openGallery", true, true);
export const getGalleryUpload = endpoint("getGalleryUpload", true);
export const registerGalleryPhotos = endpoint("registerGalleryPhotos", true);
export const deleteGalleryPhoto = endpoint("deleteGalleryPhoto");
export const deleteGallery = endpoint("deleteGallery");
