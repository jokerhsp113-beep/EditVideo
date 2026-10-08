// Video003 SFX cues — same synthesized pop.wav/chime.wav as Video002, same
// pitch-jitter treatment on GAG pops (23 gags here vs 13 in Video002, so the
// anti-repetition jitter matters even more).
//
// Run with: node scripts/add-sfx-cues-v3.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseFile } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "src", "data", "manifest_shots_video003.json");
const sfxDir = path.join(__dirname, "..", "public", "sfx");

const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const shots = data.shots;

const sfxDurations = {};
for (const file of ["pop.wav", "chime.wav"]) {
  const meta = await parseFile(path.join(sfxDir, file));
  sfxDurations[file] = meta.format.duration;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function rand01(seed) {
  return (hash(seed) % 10000) / 10000;
}

const cues = [];
let cueId = 1;

for (const shot of shots) {
  if (shot.tag === "GAG") {
    const playbackRate = 0.85 + rand01(shot.shotId + "pitch") * 0.35; // 0.85x-1.20x, wider spread (23 uses)
    cues.push({
      id: `SFX${cueId++}`,
      type: "GAG",
      file: "pop.wav",
      atSeconds: shot.scaledStart,
      durationSeconds: sfxDurations["pop.wav"] / playbackRate,
      playbackRate,
      shotId: shot.shotId,
    });
  }
}

for (let i = 0; i < shots.length; i++) {
  const shot = shots[i];
  const isAccentTag = shot.tag === "SUBSCRIBE" || shot.tag === "COMMENT_BAIT";
  const isFirstOfHeroRun = shot.tag === "HERO" && (i === 0 || shots[i - 1].tag !== "HERO");
  if (isAccentTag || isFirstOfHeroRun) {
    cues.push({
      id: `SFX${cueId++}`,
      type: shot.tag,
      file: "chime.wav",
      atSeconds: shot.scaledStart,
      durationSeconds: sfxDurations["chime.wav"],
      playbackRate: 1,
      shotId: shot.shotId,
    });
  }
}

cues.sort((a, b) => a.atSeconds - b.atSeconds);
data.sfxCues = cues;

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
console.log(`Added ${cues.length} SFX cues`);
console.table(cues.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {}));
