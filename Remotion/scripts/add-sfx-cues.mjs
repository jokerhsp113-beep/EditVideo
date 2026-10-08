// Adds an `sfxCues` array to manifest_shots.json: one entry per moment that
// should get a synthesized sound effect (GAG reveal, section transition,
// SUBSCRIBE / COMMENT_BAIT / HERO accents). Re-run any time after
// build-manifest-timing.mjs changes scaledStart/renderStart.
//
// Run with: node scripts/add-sfx-cues.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseFile } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "src", "data", "manifest_shots.json");
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

// 1) GAG reveals — pop right as the gag shot appears. Pitch/volume is jittered
// per-cue (deterministically, from the shotId) so 13 uses of the same 150ms
// clip don't read as one repeated stinger.
for (const shot of shots) {
  if (shot.tag === "GAG") {
    const playbackRate = 0.88 + rand01(shot.shotId + "pitch") * 0.3; // 0.88x-1.18x
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

// NOTE: a generic synthesized "whoosh" on every single section change was
// removed on purpose — playing the exact same clip 8 times back-to-back read
// as a cliché, repetitive amateur-editing crutch. The crossfade + silence gap
// already sells the transition; no stinger needed on top of it.

// 2) SUBSCRIBE / COMMENT_BAIT / HERO accents — chime once per moment (HERO
// spans two consecutive shots S114a/S114b; only the first gets the chime)
for (let i = 0; i < shots.length; i++) {
  const shot = shots[i];
  const isAccentTag = shot.tag === "SUBSCRIBE" || shot.tag === "COMMENT_BAIT";
  const isFirstOfHeroRun =
    shot.tag === "HERO" && (i === 0 || shots[i - 1].tag !== "HERO");
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
data._meta.sfxNote =
  "sfxCues[] la SFX TONG HOP bang code (public/sfx/pop.wav, chime.wav) - khong phai SFX that, chi la placeholder de nghe thu nhip. whoosh.wav da bi LOAI BO khoi moi cue (van con file trong public/sfx nhung khong con duoc dung) vi lap lai y het 8 lan nghe gia/cliche. Thay bang SFX that bang cach doi file trong public/sfx/ (giu nguyen ten file) hoac sua truong 'file' trong tung cue. GAG=pop (co jitter playbackRate moi lan de tranh lap y het) luc gag xuat hien, SUBSCRIBE/COMMENT_BAIT/HERO=chime.";

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
console.log(`Added ${cues.length} SFX cues:`);
console.table(
  cues.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {}),
);
