// Rebuilds src/data/manifest_shots.json timing fields from scratch, using:
//   - plannedStart/plannedDuration (original shot-brief estimates, source of truth for proportions)
//   - audio_durations.json (real measured duration of each section's mp3, from music-metadata)
//   - PLAYBACK_RATE: slows down narration (e.g. 0.9 = 10% slower)
//   - SECTION_GAP_SECONDS: silence inserted between sections so narration breathes
//   - NORMAL_TRANSITION_FRAMES / SECTION_TRANSITION_FRAMES: crossfade length for
//     shot-to-shot cuts inside a section vs. section-to-section cuts
//
// Run with: node scripts/build-manifest-timing.mjs

import fs from "fs";

const FPS = 30;
const PLAYBACK_RATE = 0.9; // 10% slower narration per user request
const SECTION_GAP_SECONDS = 0.5; // short breathing pause between sections
const NORMAL_TRANSITION_FRAMES = 8; // ~0.27s crossfade, shot-to-shot within a section
const SECTION_TRANSITION_FRAMES = 20; // ~0.67s crossfade, section-to-section (doubles as the "breath")
const WIPE_FRAMES = 10; // ~0.33s hard-edge wipe, used on BRIDGE ("câu nối") lines
const REWARD_DISSOLVE_FRAMES = 12; // a touch longer than normal, for the "opening up" feel

// beatRole must be known before transition timing is decided (see
// add-editorial-treatment.mjs for the authoritative copy of this table —
// duplicated here on purpose since this script runs first in the pipeline).
const ROLE_BY_BASE_BEAT = {
  1: "HOOK_COMMAND", 2: "HOOK_CONTRACT", 3: "HOOK_TEASE",
  4: "NAME", 5: "SCENE", 6: "NUMBER", 7: "MECHANISM", 8: "REWARD", 9: "COST", 10: "BRIDGE",
  11: "NAME", 12: "SCENE", 13: "NUMBER", 14: "MECHANISM", 15: "REWARD", 16: "COST", 17: "BRIDGE",
  18: "NAME", 19: "SCENE", 20: "NUMBER", 21: "MECHANISM", 22: "REWARD", 23: "COST", 24: "BRIDGE",
  25: "NAME", 26: "SCENE", 27: "NUMBER", 28: "MECHANISM", 29: "SUBSCRIBE", 30: "REWARD", 31: "COST", 32: "BRIDGE",
  33: "NAME", 34: "SCENE", 35: "NUMBER", 36: "MECHANISM", 37: "REWARD", 38: "COST", 39: "BRIDGE",
  40: "NAME", 41: "SCENE", 42: "NUMBER", 43: "MECHANISM", 44: "REWARD", 45: "COST", 46: "BRIDGE",
  47: "NAME", 48: "SCENE", 49: "NUMBER", 50: "MECHANISM", 51: "REWARD", 52: "COST", 53: "BRIDGE",
  54: "HERO_PAYOFF", 55: "COMMENT_BAIT", 56: "OUTRO",
};
function baseBeatNumber(beatId) {
  const m = beatId.match(/^B(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
const WIPE_DIRECTIONS = ["left", "right", "up", "down"];

const manifestPath = new URL("../src/data/manifest_shots.json", import.meta.url);
const durationsPath = new URL("../audio_durations.json", import.meta.url);

const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const rawDurations = JSON.parse(fs.readFileSync(durationsPath, "utf8"));

const sectionAudio = {
  HOOK: "Audio001.mp3",
  MUC1_TETRACHROMACY: "Audio002.mp3",
  MUC2_ECHOLOCATION: "Audio003.mp3",
  MUC3_BAJAU: "Audio004.mp3",
  MUC4_XUONG_LRP5: "Audio005.mp3",
  MUC5_CIPA: "Audio006.mp3",
  MUC6_HSAM: "Audio007.mp3",
  MUC7_MYOSTATIN: "Audio008.mp3",
  DOAN_DONG: "Audio009.mp3",
};
const sectionOrder = Object.keys(sectionAudio);

const bySection = {};
for (const s of data.shots) {
  (bySection[s.section] = bySection[s.section] || []).push(s);
}
// keep original brief order within each section
for (const sec of sectionOrder) {
  bySection[sec].sort((a, b) => a.plannedStart - b.plannedStart);
}

let globalOffset = 0;
const sectionReport = [];
const sectionBounds = {}; // section -> {start, end} in the new adjusted timeline

for (const sec of sectionOrder) {
  const shots = bySection[sec];
  const audioFile = sectionAudio[sec];
  const measuredDuration = rawDurations[audioFile];
  const adjustedDuration = measuredDuration / PLAYBACK_RATE; // slower playback = longer

  const plannedSecStart = Math.min(...shots.map((s) => s.plannedStart));
  const plannedSecEnd = Math.max(...shots.map((s) => s.plannedEnd));
  const plannedSecDuration = plannedSecEnd - plannedSecStart;
  const scale = adjustedDuration / plannedSecDuration;

  let cursor = 0;
  for (const s of shots) {
    const scaledDuration = s.plannedDuration * scale;
    s.audioFile = audioFile;
    s.audioPlaybackRate = PLAYBACK_RATE;
    s.section_measuredDurationSeconds = Number(measuredDuration.toFixed(3));
    s.section_adjustedDurationSeconds = Number(adjustedDuration.toFixed(3));
    s.scaleFactor = Number(scale.toFixed(4));
    s.scaledStart = Number((globalOffset + cursor).toFixed(3));
    s.scaledDuration = Number(scaledDuration.toFixed(3));
    s.scaledEnd = Number((s.scaledStart + scaledDuration).toFixed(3));
    cursor += scaledDuration;
  }

  sectionBounds[sec] = {
    start: globalOffset,
    end: globalOffset + adjustedDuration,
    audioFile,
    audioDurationInFramesForSequence: Math.round(adjustedDuration * FPS),
  };

  sectionReport.push({
    section: sec,
    audioFile,
    measuredDuration: Number(measuredDuration.toFixed(2)),
    adjustedDuration: Number(adjustedDuration.toFixed(2)),
    scale: Number(scale.toFixed(3)),
    globalOffsetStart: Number(globalOffset.toFixed(2)),
  });

  globalOffset += adjustedDuration + SECTION_GAP_SECONDS;
}
// remove the trailing gap added after the very last section
globalOffset -= SECTION_GAP_SECONDS;

// second pass: pick a TRANSITION per shot (not one formula for all cuts).
//   - DISSOLVE: this shot ramps opacity 0->1 while sitting on top of the
//     previous one (which needs no change) — composite = x*this + (1-x)*prev.
//   - CUT: no ramp, no pre-roll — a hard edit, used where a snap reads better
//     than a soft blend (gag punchlines, statistic reveals).
//   - WIPE: a hard-edged reveal via clip-path (handled in the React layer),
//     used on BRIDGE ("câu nối") lines — a directional "moving to the next
//     idea" cut, distinct from both the cut and the dissolve.
// Section boundaries always win with the long DISSOLVE regardless of the
// entering shot's own role, since that's tied to the breathing pause.
const shotsInOrder = sectionOrder.flatMap((sec) => bySection[sec]);
for (let i = 0; i < shotsInOrder.length; i++) {
  const shot = shotsInOrder[i];
  const prev = shotsInOrder[i - 1];
  const base = baseBeatNumber(shot.beatId);
  const beatRole = base !== null ? ROLE_BY_BASE_BEAT[base] ?? "OTHER" : "OTHER";
  shot.beatRole = beatRole;

  const isSectionBoundary = !prev || prev.section !== shot.section;

  let transition;
  if (isSectionBoundary) {
    transition = { type: "DISSOLVE", frames: prev ? SECTION_TRANSITION_FRAMES : NORMAL_TRANSITION_FRAMES, direction: null };
  } else if (shot.tag === "GAG" || beatRole === "NUMBER") {
    transition = { type: "CUT", frames: 0, direction: null };
  } else if (beatRole === "BRIDGE") {
    const dir = WIPE_DIRECTIONS[hash(shot.shotId) % WIPE_DIRECTIONS.length];
    transition = { type: "WIPE", frames: WIPE_FRAMES, direction: dir };
  } else if (beatRole === "REWARD") {
    transition = { type: "DISSOLVE", frames: REWARD_DISSOLVE_FRAMES, direction: null };
  } else {
    transition = { type: "DISSOLVE", frames: NORMAL_TRANSITION_FRAMES, direction: null };
  }

  const extensionSeconds = Math.min(transition.frames / FPS, shot.scaledStart);

  shot.transition = transition;
  shot.fadeInFrames = transition.frames; // kept for the Sequence name / debugging
  shot.renderStart = Number((shot.scaledStart - extensionSeconds).toFixed(4));
  shot.renderDuration = Number(
    (shot.scaledDuration + extensionSeconds).toFixed(4),
  );
}

data._meta.timingMethod =
  "scaledStart/scaledDuration/scaledEnd = thoi gian THAT sau khi ap dung playbackRate " +
  PLAYBACK_RATE +
  " (giong doc cham hon " +
  Math.round((1 / PLAYBACK_RATE - 1) * 100) +
  "%). Duration audio moi doan duoc do that (music-metadata) roi chia lai / " +
  PLAYBACK_RATE +
  ", sau do ty le plannedDuration cua tung shot duoc scale de khop tong. Giua cac doan (section) co them " +
  SECTION_GAP_SECONDS +
  "s im lang de nguoi doc 'tho'. Moi shot co 1 transition rieng (shot.transition.type): CUT (cat cung, dung cho GAG/NUMBER - de cu punch-in/flash tu lam viec), WIPE (gat man hinh huong ngau nhien, dung cho BRIDGE/cau noi), DISSOLVE (tan mo, dung cho phan con lai va LUON dung o diem chuyen doan voi " +
  SECTION_TRANSITION_FRAMES +
  " frame). Khong con 1 cong thuc crossfade ap dung cho moi shot nhu ban truoc.";
data._meta.playbackRate = PLAYBACK_RATE;
data._meta.sectionGapSeconds = SECTION_GAP_SECONDS;
data._meta.normalTransitionFrames = NORMAL_TRANSITION_FRAMES;
data._meta.sectionTransitionFrames = SECTION_TRANSITION_FRAMES;
data._meta.totalRealDurationSeconds = Number(globalOffset.toFixed(3));
data._meta.sectionAudioMap = sectionAudio;
data._meta.sectionBounds = sectionBounds;
data._meta.sectionScalingReport = sectionReport;

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
console.log("Total real duration:", globalOffset.toFixed(2), "s");
console.table(sectionReport);
const transitionTally = {};
for (const s of shotsInOrder) transitionTally[s.transition.type] = (transitionTally[s.transition.type] || 0) + 1;
console.log("Transition tally:", transitionTally);
