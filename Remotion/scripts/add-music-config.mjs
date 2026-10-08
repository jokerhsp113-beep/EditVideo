// Measures public/music/bed.mp3 and records its config into manifest_shots.json
// so VideoComposition.tsx doesn't need to read the file at render time.
//
// Run with: node scripts/add-music-config.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseFile } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "src", "data", "manifest_shots.json");
const musicPath = path.join(__dirname, "..", "public", "music", "bed.mp3");

const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const meta = await parseFile(musicPath);

data._meta.music = {
  file: "bed.mp3",
  sourceTrack: "Tiptoe - Nat Keefe",
  durationSeconds: meta.format.duration,
  duckVolume: 0.16, // under narration
  openVolume: 0.45, // during the silence gaps between sections
  rampSeconds: 0.35, // fade length at each duck/open transition
  edgeFadeSeconds: 1.2, // fade-in at video start, fade-out at video end
};

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
console.log("Music config:", data._meta.music);
