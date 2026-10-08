// Video003 ("All 8 Blood Types, Ranked") timing build.
//
// Unlike Video002 (9 separate audio files, one per section, with an added
// silence gap between them), Video003's narration is ONE continuous read
// split into 3 files purely for generation reasons — natural pauses are
// already baked into the audio via SSML <break> tags, so no artificial gap
// is added here. Beat boundaries are REAL, measured via Whisper word-level
// alignment (see beat_boundaries_v3.json), not estimated — each beat's real
// [start, end) window is exact (end = next beat's real start, or the total
// audio duration for the last beat), so per-beat proportional scaling has no
// accumulated drift the way section-level scaling did for Video002.
//
// Run with: node scripts/build-manifest-timing-v3.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseFile } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "src", "data", "manifest_shots_video003.json");
const audioDir = path.join(__dirname, "..", "public", "audio_video003");
const boundariesPath = path.join(__dirname, "beat_boundaries_v3.json");

const FPS = 30;
const NORMAL_TRANSITION_FRAMES = 8;
const SECTION_TRANSITION_FRAMES = 20; // used at box-to-box boundaries (title card moments)
const WIPE_FRAMES = 10;

const AUDIO_FILES = ["Audio001.mp3", "Audio002.mp3", "Audio003.mp3"];
const BEAT_ORDER = Array.from({ length: 15 }, (_, i) => `B${String(i + 1).padStart(2, "0")}`);

const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const boundaries = JSON.parse(fs.readFileSync(boundariesPath, "utf8"));

const durations = {};
for (const f of AUDIO_FILES) {
  const meta = await parseFile(path.join(audioDir, f));
  durations[f] = meta.format.duration;
}
const fileOffset = {};
let acc = 0;
for (const f of AUDIO_FILES) {
  fileOffset[f] = acc;
  acc += durations[f];
}
const totalDurationSeconds = acc;

// Real start (global, continuous seconds) per beat, from Whisper alignment.
const realBeatStart = {};
for (const b of BEAT_ORDER) {
  const bd = boundaries[b];
  realBeatStart[b] = fileOffset[bd.file] + bd.startSeconds;
}
const realBeatEnd = {};
for (let i = 0; i < BEAT_ORDER.length; i++) {
  const b = BEAT_ORDER[i];
  realBeatEnd[b] = i + 1 < BEAT_ORDER.length ? realBeatStart[BEAT_ORDER[i + 1]] : totalDurationSeconds;
}

// Group shots by beat, in original planned order.
const byBeat = {};
for (const s of data.shots) (byBeat[s.beatId] = byBeat[s.beatId] || []).push(s);
for (const b of BEAT_ORDER) byBeat[b]?.sort((a, c) => a.plannedStart - c.plannedStart);

const beatReport = [];
for (const b of BEAT_ORDER) {
  const shots = byBeat[b];
  if (!shots) continue;
  const plannedStart = Math.min(...shots.map((s) => s.plannedStart));
  const plannedEnd = Math.max(...shots.map((s) => s.plannedEnd));
  const plannedDuration = plannedEnd - plannedStart;
  const realStart = realBeatStart[b];
  const realDuration = realBeatEnd[b] - realBeatStart[b];
  const scale = realDuration / plannedDuration;

  let cursor = 0;
  for (const s of shots) {
    const scaledDuration = s.plannedDuration * scale;
    s.beatRealStart = Number(realStart.toFixed(3));
    s.beatRealDuration = Number(realDuration.toFixed(3));
    s.scaleFactor = Number(scale.toFixed(4));
    s.scaledStart = Number((realStart + cursor).toFixed(3));
    s.scaledDuration = Number(scaledDuration.toFixed(3));
    s.scaledEnd = Number((s.scaledStart + scaledDuration).toFixed(3));
    cursor += scaledDuration;
  }
  beatReport.push({
    beat: b,
    plannedDuration: Number(plannedDuration.toFixed(2)),
    realDuration: Number(realDuration.toFixed(2)),
    scale: Number(scale.toFixed(3)),
    realStart: Number(realStart.toFixed(2)),
  });
}

// ---- box grouping for title cards / progress bar (8 boxes + hook + bombay + close) ----
const BOX_BY_BEAT = {
  B01: "HOOK", B02: "HOOK", B03: "HOOK",
  B04: "BOX1_AB_NEG", B05: "BOX2_B_NEG", B06: "BOX3_AB_POS", B07: "BOX4_A_NEG",
  B08: "BOX5_O_NEG", B09: "BOX6_B_POS", B10: "BOX7_A_POS",
  B11: "BOX8_O_POS", B12: "BOX8_O_POS", B13: "BOX8_O_POS",
  B14: "BOMBAY", B15: "CLOSE",
};
for (const s of data.shots) s.box = BOX_BY_BEAT[s.beatId] ?? "OTHER";

// ---- transitions: CUT for gag/number-reveal punches, WIPE for bridge/hand-off
// lines, DISSOLVE elsewhere and always (longer) at box boundaries. Role is
// inferred from `tag` (already extracted) plus light keyword matching on the
// Vietnamese `description` field, since this video's beat granularity is
// coarse (one beat = one whole box) unlike Video002's per-clause beats.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
const WIPE_DIRECTIONS = ["left", "right", "up", "down"];
const NUMBER_RE = /\bin \d|IN \d|"\d+ ?(iN|in)|\d+%|con so|so lieu/i;
const BRIDGE_RE = /cau noi|dan sang|ke tiep|o ke|tease|chot beat|khep beat|chuyen sang/;
const NAME_RE = /goi ten/;
const COST_RE = /cai gia/;

for (let i = 0; i < data.shots.length; i++) {
  const shot = data.shots[i];
  const prev = data.shots[i - 1];
  const desc = (shot.description || "").toLowerCase();

  let shotRole = "OTHER";
  if (NAME_RE.test(desc)) shotRole = "NAME";
  else if (NUMBER_RE.test(desc)) shotRole = "NUMBER";
  else if (COST_RE.test(desc)) shotRole = "COST";
  else if (BRIDGE_RE.test(desc)) shotRole = "BRIDGE";
  shot.shotRole = shotRole;

  const isBoxBoundary = !prev || prev.box !== shot.box;

  let transition;
  if (isBoxBoundary) {
    transition = { type: "DISSOLVE", frames: prev ? SECTION_TRANSITION_FRAMES : NORMAL_TRANSITION_FRAMES, direction: null };
  } else if (shot.tag === "GAG" || shotRole === "NUMBER") {
    transition = { type: "CUT", frames: 0, direction: null };
  } else if (shotRole === "BRIDGE") {
    const dir = WIPE_DIRECTIONS[hash(shot.shotId) % WIPE_DIRECTIONS.length];
    transition = { type: "WIPE", frames: WIPE_FRAMES, direction: dir };
  } else {
    transition = { type: "DISSOLVE", frames: NORMAL_TRANSITION_FRAMES, direction: null };
  }

  // Jitter the frame count a little (+/-0-2 frames, deterministic per shot) so
  // cuts don't land on a metronomic, machine-exact cadence — real editors'
  // cut points are never perfectly uniform.
  if (transition.frames > 0) {
    const jitter = hash(shot.shotId + "jit") % 3; // 0,1,2
    transition.frames = Math.max(4, transition.frames + jitter - 1);
  }

  const extensionSeconds = Math.min(transition.frames / FPS, shot.scaledStart);
  shot.transition = transition;
  shot.fadeInFrames = transition.frames;
  shot.renderStart = Number((shot.scaledStart - extensionSeconds).toFixed(4));
  shot.renderDuration = Number((shot.scaledDuration + extensionSeconds).toFixed(4));
}

data._meta = data._meta || {};
data._meta.fps = FPS;
data._meta.audioFiles = AUDIO_FILES;
data._meta.fileOffset = fileOffset;
data._meta.audioDurations = durations;
data._meta.totalRealDurationSeconds = Number(totalDurationSeconds.toFixed(3));
data._meta.beatRealStart = realBeatStart;
data._meta.beatRealEnd = realBeatEnd;
data._meta.beatReport = beatReport;
data._meta.timingMethod =
  "Video003 dung timestamp THAT tu Whisper alignment (khong phai co giai ty le nhu Video002) - moi beat co realBeatStart/realBeatEnd chinh xac, khong cong don sai so. 3 file audio noi lien tuc, KHONG co artificial gap (break da co san trong audio qua SSML). Transition: CUT (gag/number), WIPE (bridge, huong ngau nhien), DISSOLVE (con lai + luon dung o ranh gioi box). Moi transition co jitter +/-1 frame de tranh nhip cat deu tam tap nhu may.";

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
console.log("Total real duration:", totalDurationSeconds.toFixed(2), "s");
console.table(beatReport);
const transitionTally = {};
for (const s of data.shots) transitionTally[s.transition.type] = (transitionTally[s.transition.type] || 0) + 1;
console.log("Transition tally:", transitionTally);
