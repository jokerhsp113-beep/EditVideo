// Video003 music config — reuses the same bed.mp3 (Tiptoe - Nat Keefe)
// already in public/music/ from Video002's setup.
//
// Run with: node scripts/add-music-config-v3.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseFile } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "src", "data", "manifest_shots_video003.json");
const musicPath = path.join(__dirname, "..", "public", "music", "bed.mp3");

const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const meta = await parseFile(musicPath);

data._meta.music = {
  file: "bed.mp3",
  sourceTrack: "Tiptoe - Nat Keefe",
  durationSeconds: meta.format.duration,
  duckVolume: 0.16,
  openVolume: 0.4, // slightly lower peak than Video002 since box-to-box gaps are shorter/less frequent here
  rampSeconds: 0.35,
  edgeFadeSeconds: 1.2,
};

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
console.log("Music config:", data._meta.music);
