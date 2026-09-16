import { initializeApp, applicationDefault, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v2 as cloudinary } from "cloudinary";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { migrateMedia } from "../migrate-media.js";

const args = process.argv.slice(2);
const value = (name) => args[args.indexOf(name) + 1];
if (!args.includes("--slug") || !args.includes("--project") || value("--project") !== "psalmhe-gallery") {
  throw new Error("Usage: node functions/scripts/migrate-gallery-media.js --project psalmhe-gallery --slug GALLERY [--apply]");
}
const apply = args.includes("--apply");
const app = initializeApp({ credential: applicationDefault(), projectId: "psalmhe-gallery" });
try {
  if (apply) {
    for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
      if (!process.env[key]) throw new Error(`Set ${key} in the server environment before applying migration.`);
    }
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  }
  const directory = fileURLToPath(new URL("../../src/Files/", import.meta.url));
  const sources = await Promise.all((await readdir(directory)).filter((name) => /\.[jt]sx?$/.test(name)).map((name) => readFile(path.join(directory, name), "utf8")));
  const result = await migrateMedia({ db: getFirestore(app), cloudinary, slug: value("--slug"), apply, portfolioSource: sources.join("\n") });
  console.log(JSON.stringify(result, null, 2));
} finally { await deleteApp(app); }
