import { AccessError, slugValue } from "./policy.js";

// Deliberately not exposed as a public function. The CLI defaults to dry-run.
export async function migrateMedia({ db, cloudinary, slug, apply = false, portfolioSource = "" }) {
  slugValue(slug);
  const galleries = await db.collection("galleries").get();
  const target = galleries.docs.find((entry) => entry.id === slug);
  if (!target) throw new AccessError("not-found", "Gallery not found.");
  const photos = target.data().photos || [];
  const plan = photos.filter((photo) => photo.deliveryType !== "authenticated" || !photo.assetId);
  for (const photo of plan) {
    if (typeof photo.publicId !== "string" || !photo.publicId || photo.publicId.length > 250) throw new Error("Invalid photo identifier; migration stopped.");
    const basename = photo.publicId.split("/").at(-1);
    if (portfolioSource.includes(basename)) throw new Error(`Photo ${photo.publicId} may be used in the public portfolio. Separate shared assets before migration.`);
    if (galleries.docs.some((other) => other.id !== slug && (other.data().photos || []).some((candidate) => candidate.publicId === photo.publicId))) {
      throw new Error(`Photo ${photo.publicId} is shared with another gallery. Separate shared assets before migration.`);
    }
  }
  if (!apply) return { dryRun: true, slug, photos: plan.map((photo) => photo.publicId) };
  for (const photo of plan) {
    // If a previous run stopped after renaming but before updating Firestore,
    // locate the authenticated asset and complete its metadata update safely.
    let asset;
    try { asset = await cloudinary.api.resource(photo.publicId, { type: "authenticated", resource_type: "image" }); }
    catch (error) { if (error.http_code !== 404 && error.error?.http_code !== 404) throw error; }
    if (asset && photo.deliveryType !== "authenticated") {
      let publicAsset;
      try { publicAsset = await cloudinary.api.resource(photo.publicId, { type: "upload", resource_type: "image" }); }
      catch (error) { if (error.http_code !== 404 && error.error?.http_code !== 404) throw error; }
      if (publicAsset) throw new Error(`Conflicting public and authenticated assets for ${photo.publicId}; migration stopped.`);
    }
    if (!asset) {
      const result = await cloudinary.uploader.rename(photo.publicId, photo.publicId, {
        resource_type: "image", type: "upload", to_type: "authenticated", overwrite: false, invalidate: true,
      });
      asset = result.asset_id ? result : await cloudinary.api.resource(photo.publicId, { type: "authenticated", resource_type: "image" });
    }
    if (asset.type !== "authenticated" || !asset.asset_id || !asset.format) throw new Error("Cloudinary did not confirm protected delivery; migration stopped.");
    await db.runTransaction(async (tx) => {
      const ref = db.doc(`galleries/${slug}`);
      const current = await tx.get(ref);
      if (!current.exists) throw new Error("Gallery was deleted during migration.");
      tx.update(ref, { photos: (current.data().photos || []).map((entry) => entry.publicId !== photo.publicId ? entry : {
        publicId: photo.publicId, assetId: asset.asset_id, deliveryType: "authenticated", format: asset.format,
        filename: entry.filename || `${photo.publicId.split("/").at(-1)}.${asset.format}`,
        width: asset.width, height: asset.height, uploadedAt: entry.uploadedAt || new Date().toISOString(),
      }) });
    });
  }
  return { dryRun: false, slug, migrated: plan.length };
}
