// Maps each Video003 shot's assetId -> real filename in public/images_video003/.
// Rule: strip leading "A", zero-pad the number to 3 digits, append any letter
// suffix, add extension (.jpeg by default; a couple of known exceptions).
//
// Run with: node scripts/add-image-filenames-v3.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "src", "data", "manifest_shots_video003.json");
const imagesDir = path.join(__dirname, "..", "public", "images_video003");

const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const onDisk = new Set(fs.readdirSync(imagesDir));

const EXTENSION_OVERRIDES = {
  A36: "036.png", // generated/exported as PNG instead of JPEG
};

function assetToFilename(assetId) {
  if (EXTENSION_OVERRIDES[assetId]) return EXTENSION_OVERRIDES[assetId];
  const m = assetId.match(/^A(\d+)([a-z]?)$/i);
  if (!m) throw new Error(`Unrecognized assetId format: ${assetId}`);
  const [, num, suffix] = m;
  return `${num.padStart(3, "0")}${suffix}.jpeg`;
}

const missing = [];
for (const shot of data.shots) {
  const file = assetToFilename(shot.assetId);
  shot.imageFile = file;
  if (!onDisk.has(file)) missing.push(`${shot.shotId} (${shot.assetId}) -> ${file}`);
}

if (missing.length) {
  console.log("WARNING - files not found on disk:");
  missing.forEach((m) => console.log(" ", m));
} else {
  console.log("All", data.shots.length, "shots resolved to an existing image file.");
}

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
