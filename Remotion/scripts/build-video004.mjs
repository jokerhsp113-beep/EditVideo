// Video004 "Rare Genetic Traits" — full manifest build in one pass.
//
// Design goals for this video (user feedback on V002/V003: "quá máy móc,
// giống dùng tool"):
//   1. NO progress bar at all.
//   2. Motion discipline follows the channel's edit skill: rich movement is
//      reserved for character-free diagram frames (Hạng A); frames containing
//      Fox/Stick stay nearly still (Hạng B) instead of every shot drifting.
//   3. KHOÁ / crop-kép chains cut HARD instead of dissolving — dissolving two
//      near-identical frames is the mushy, tool-generated look. Cutting makes
//      a pop-in read as "a new element appeared".
//   4. Ken Burns runs CONTINUOUSLY across a locked chain instead of resetting
//      per shot, so a 4-shot diagram build reads as one camera move.
//   5. Punch-ins overshoot ~3% then settle — hand-keyframed feel, not linear.
//   6. Tone profiles: MỤC 5 (B31-B38, the section the script forbids gags in)
//      gets slow dissolves, no flashes, no punch, no SFX at all.
//   7. SFX only where the scene motivates it (gag beats, tally marks,
//      subscribe) — never a stinger on every cut.
//
// Run: node scripts/build-video004.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseFile } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = "C:/Work/Youtube/Inside The Body/Video004";
const outManifest = path.join(__dirname, "..", "src", "data", "manifest_shots_video004.json");

const FPS = 30;
const AUDIO_FILES = ["Audio001.mp3", "Audio002.mp3", "Audio003.mp3", "Audio004.mp3"];
// the 4 audio files map 1:1 onto the 4 production lots; these beats therefore
// start exactly at a file boundary — stronger ground truth than ASR alignment
const LOT_START_BEAT = { B01: "Audio001.mp3", B11: "Audio002.mp3", B24: "Audio003.mp3", B39: "Audio004.mp3" };
// the somber section: script forbids gags here, we extend that to edit grammar
const SOMBER_BEATS = new Set(["B31", "B32", "B33", "B34", "B35", "B36", "B37", "B38"]);
const HOOK_BEATS = new Set(["B01", "B02", "B03", "B04"]);
const OUTRO_BEATS = new Set(["B53", "B54", "B55", "B56"]);

const shots = JSON.parse(fs.readFileSync(path.join(SRC, "shots_extracted_v4.json"), "utf8")).shots;
const align = JSON.parse(fs.readFileSync(path.join(SRC, "beat_boundaries_v4.json"), "utf8"));
const transcript = JSON.parse(fs.readFileSync(path.join(SRC, "transcript_words.json"), "utf8"));

// ---- BREATHS between sections ----------------------------------------------
// The first cut ran 9:29 with literally zero gaps: 239 shots wall to wall and
// four VO lots butted end to end, so the narration never stopped once. The cut
// rhythm was fine (median 2.3s); what was missing was any moment to let a
// section land before the next one started.
//
// Silence is inserted BEFORE each section opener. The picture leads: the
// section's dissolve happens during the silence, so the new image is already
// on screen when the voice comes back.
//
// Lengths are authored, not uniform — B31 is the script's tone shift into the
// section about people who cannot feel pain ("I want to change tone for this")
// and gets by far the longest hold; B18 has only 0.22s of natural silence to
// cut inside, so it stays tight.
const SECTION_BREATH = { B05: 0.85, B11: 0.95, B18: 0.70, B24: 1.00, B31: 1.60, B39: 1.00, B47: 1.15 };

const durations = {};
for (const f of AUDIO_FILES) {
  const m = await parseFile(path.join(SRC, "Audio", f));
  durations[f] = m.format.duration;
}
const fileOffset = {};
let acc = 0;
for (const f of AUDIO_FILES) { fileOffset[f] = acc; acc += durations[f]; }
const totalDuration = acc;

// ---- beat anchors, with lot-start beats forced to their file boundary ----
const beatOrder = Array.from({ length: 56 }, (_, i) => `B${String(i + 1).padStart(2, "0")}`);
const beatStart = {};
const corrections = [];
for (const b of beatOrder) {
  const a = align.beats[b];
  if (!a) throw new Error("missing alignment for " + b);
  let t = a.globalStart;
  if (LOT_START_BEAT[b]) {
    const forced = fileOffset[LOT_START_BEAT[b]];
    if (Math.abs(forced - t) > 0.05) corrections.push({ beat: b, asr: t, forced, delta: +(forced - t).toFixed(2) });
    t = forced;
  }
  beatStart[b] = t;
}
const beatEnd = {};
beatOrder.forEach((b, i) => { beatEnd[b] = i + 1 < beatOrder.length ? beatStart[beatOrder[i + 1]] : totalDuration; });

// ---- deterministic pseudo-random, stable across rebuilds ----
// Must actually avalanche. The old `h*31 + c` hash did not: two salts differing
// only in their last character (seed+"z" vs seed+"p", "tx" vs "ty") landed a
// few counts apart, so zoom magnitude, pan direction and card tilt were all
// near-copies of one another across the entire video — variation that looked
// deliberate in the code but arrived correlated on screen. FNV-1a + a murmur
// finalizer so every salt is independent.
function hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
  return (h ^= h >>> 16) >>> 0;
}
const rnd = (s) => hash(s) / 4294967296;

// ---- group shots by beat, scale to the measured beat window ----
const byBeat = {};
for (const s of shots) (byBeat[s.beatId] = byBeat[s.beatId] || []).push(s);
for (const b of beatOrder) byBeat[b]?.sort((x, y) => x.plannedStart - y.plannedStart);

const beatReport = [];
for (const b of beatOrder) {
  const list = byBeat[b];
  if (!list?.length) continue;
  const pStart = Math.min(...list.map((s) => s.plannedStart));
  const pEnd = Math.max(...list.map((s) => s.plannedEnd));
  const scale = (beatEnd[b] - beatStart[b]) / (pEnd - pStart);
  let cursor = 0;
  for (const s of list) {
    const d = s.plannedDuration * scale;
    s.scaleFactor = +scale.toFixed(4);
    s.scaledStart = +(beatStart[b] + cursor).toFixed(3);
    s.scaledDuration = +d.toFixed(3);
    s.scaledEnd = +(s.scaledStart + d).toFixed(3);
    cursor += d;
  }
  beatReport.push({ beat: b, planned: +(pEnd - pStart).toFixed(1), real: +(beatEnd[b] - beatStart[b]).toFixed(1), scale: +scale.toFixed(3) });
}

const ordered = beatOrder.flatMap((b) => byBeat[b] || []);

// ---- cut points for the breaths --------------------------------------------
// A mid-file breath must be spliced inside real silence or it clips a word, so
// the split lands at the midpoint of the pause the narrator already took.
const cutPoints = [];
for (const [beat, breath] of Object.entries(SECTION_BREATH)) {
  if (LOT_START_BEAT[beat]) {
    // the section opens a new VO file — no splice needed, just delay the file
    cutPoints.push({ beat, globalTime: fileOffset[LOT_START_BEAT[beat]], breath, kind: "file", silence: Infinity });
    continue;
  }
  const t = beatStart[beat];
  let file = AUDIO_FILES[0];
  for (const f of AUDIO_FILES) if (t >= fileOffset[f]) file = f;
  const local = t - fileOffset[file];
  const words = transcript[file].words;
  let i = words.findIndex((w) => w.start >= local - 0.03);
  if (i <= 0) throw new Error("cannot locate section opener for " + beat);
  const silence = words[i].start - words[i - 1].end;
  if (silence < 0.12) throw new Error(`${beat}: only ${silence.toFixed(2)}s of silence — unsafe to splice`);
  const splitLocal = words[i - 1].end + silence / 2;
  cutPoints.push({ beat, globalTime: fileOffset[file] + splitLocal, breath, kind: "splice", file, splitLocal, silence });
}
cutPoints.sort((a, b) => a.globalTime - b.globalTime);
const shiftAt = (t) => cutPoints.reduce((a, c) => a + (c.globalTime <= t + 1e-6 ? c.breath : 0), 0);
const totalBreath = cutPoints.reduce((a, c) => a + c.breath, 0);

// slide every shot onto the new timeline, and hand the extra time to the LAST
// shot of the outgoing section as a held frame rather than stretching the
// whole beat (which would just slow everything down instead of pausing)
for (const s of ordered) {
  const sh = shiftAt(s.scaledStart);
  s.scaledStart = +(s.scaledStart + sh).toFixed(3);
  s.scaledEnd = +(s.scaledStart + s.scaledDuration).toFixed(3);
}
for (const c of cutPoints) {
  const first = (byBeat[c.beat] || [])[0];
  const idx = ordered.indexOf(first);
  if (idx <= 0) continue;
  const held = ordered[idx - 1];
  held.scaledDuration = +(held.scaledDuration + c.breath).toFixed(3);
  held.scaledEnd = +(held.scaledStart + held.scaledDuration).toFixed(3);
  held.holdsBreath = c.breath;
}
for (const b of beatOrder) { if (beatStart[b] !== undefined) { const sh = shiftAt(beatStart[b]); beatStart[b] += sh; beatEnd[b] += shiftAt(beatEnd[b]); } }

// ---- VO segments: each file split at its splice points, each piece placed on
// the new timeline so the inserted silence actually exists in the mix --------
const voSegments = [];
for (const f of AUDIO_FILES) {
  const splits = cutPoints.filter((c) => c.kind === "splice" && c.file === f).map((c) => c.splitLocal).sort((a, b) => a - b);
  const bounds = [0, ...splits, durations[f]];
  for (let i = 0; i < bounds.length - 1; i++) {
    const globalOrig = fileOffset[f] + bounds[i];
    voSegments.push({
      id: `${f.replace(".mp3", "")}_${i}`, file: f,
      trimBefore: +bounds[i].toFixed(4), trimAfter: +bounds[i + 1].toFixed(4),
      startSeconds: +(globalOrig + shiftAt(globalOrig)).toFixed(4),
    });
  }
}
const totalDurationFinal = totalDuration + totalBreath;

// windows where the mix is empty, for the music layer to open into
const breaths = cutPoints.map((c) => ({
  beat: c.beat, startSeconds: +(beatStart[c.beat] - c.breath).toFixed(3),
  durationSeconds: c.breath,
  // B31 drops into the somber section — let the floor fall out instead of
  // swelling the bed under it
  lift: c.beat === "B31" ? 0 : 1,
}));

// ---- image filename ----
for (const s of ordered) {
  const m = s.assetId.match(/^A(\d+)([a-z]?)$/);
  s.imageFile = `${String(+m[1]).padStart(3, "0")}${m[2]}.jpeg`;
}

// ---- tone profile ----
for (const s of ordered) {
  s.tone = SOMBER_BEATS.has(s.beatId) ? "SOMBER"
    : HOOK_BEATS.has(s.beatId) ? "HOOK"
    : OUTRO_BEATS.has(s.beatId) ? "OUTRO" : "STANDARD";
}

// ---- transitions ----
// chainPos: position of this shot inside a run of consecutive shots sharing
// the same assetId (a KHOÁ / crop-kép chain). Chains cut hard and share one
// continuous camera move.
let chainId = 0;
for (let i = 0; i < ordered.length; i++) {
  const s = ordered[i], prev = ordered[i - 1];
  const sameAsset = prev && prev.assetId === s.assetId;
  if (!sameAsset) chainId++;
  s.chainId = chainId;
}
const chainSize = {};
for (const s of ordered) chainSize[s.chainId] = (chainSize[s.chainId] || 0) + 1;
const chainIndex = {};
for (const s of ordered) {
  chainIndex[s.chainId] = (chainIndex[s.chainId] ?? -1) + 1;
  s.chainPos = chainIndex[s.chainId];
  s.chainLen = chainSize[s.chainId];
}

const MUC_START_BEATS = new Set(["B05", "B11", "B18", "B24", "B31", "B39", "B47", "B53"]);
for (let i = 0; i < ordered.length; i++) {
  const s = ordered[i], prev = ordered[i - 1];
  let t;
  if (!prev) {
    t = { type: "DISSOLVE", frames: 10, direction: null, why: "video open" };
  } else if (s.chainPos > 0) {
    // inside a locked/crop chain — hard cut, the image barely changes
    t = { type: "CUT", frames: 0, direction: null, why: "locked chain step" };
  } else if (s.beatId === "B31") {
    // the whole 1.6s breath IS the dissolve — the somber section bleeds in
    // under the silence instead of arriving on a cut
    t = { type: "DISSOLVE", frames: 46, direction: null, why: "tone shift into somber section" };
  } else if (MUC_START_BEATS.has(s.beatId) && prev.beatId !== s.beatId) {
    // long enough to land inside the inserted silence: picture leads, voice follows
    const br = SECTION_BREATH[s.beatId];
    t = { type: "DISSOLVE", frames: br ? Math.round(br * FPS * 0.62) : 22, direction: null, why: "section boundary" };
  } else if (s.tone === "SOMBER") {
    t = { type: "DISSOLVE", frames: 16, direction: null, why: "somber pacing" };
  } else if (s.isGag) {
    t = { type: "CUT", frames: 0, direction: null, why: "cut into punchline" };
  } else if (s.isMilestone) {
    t = { type: "DISSOLVE", frames: 14, direction: null, why: "tally milestone" };
  } else if (/\b(\d|con số|số liệu|%|phần trăm)/i.test(s.description || "")) {
    t = { type: "CUT", frames: 0, direction: null, why: "stat reveal" };
  } else if (rnd(s.shotId + "hardcut") < 0.22) {
    t = { type: "CUT", frames: 0, direction: null, why: "rhythm variation" };
  } else {
    t = { type: "DISSOLVE", frames: 8, direction: null, why: "default" };
  }
  if (t.frames > 0) t.frames = Math.max(5, t.frames + (hash(s.shotId + "j") % 3) - 1); // jitter
  const ext = Math.min(t.frames / FPS, s.scaledStart);
  s.transition = t;
  s.renderStart = +(s.scaledStart - ext).toFixed(4);
  s.renderDuration = +(s.scaledDuration + ext).toFixed(4);
}

// ---- motion: Hạng A (no character) moves; Hạng B (character) stays near-still ----
for (const s of ordered) {
  const seed = s.shotId;
  const hasChar = s.lumen !== "khong co";
  const somber = s.tone === "SOMBER";

  if (s.chainPos > 0) {
    // continuation of a chain: motion is computed in the component from the
    // chain's own progress, so mark it and carry the chain's parameters
    s.motion = { type: "CHAIN", zoomFrom: 1, zoomTo: 1, panFromX: 0, panToX: 0, rotateTo: 0, overshoot: 0 };
    continue;
  }
  if (s.isGag && !somber) {
    const zoomTo = 1.08 + rnd(seed + "z") * 0.07;
    s.motion = { type: "PUNCH", zoomFrom: 1, zoomTo, panFromX: 0, panToX: 0,
      rotateTo: (rnd(seed + "r") - 0.5) * 2.4, overshoot: 0.03 };
  } else if (somber) {
    // deliberate stillness; at most an imperceptible drift on diagrams
    s.motion = hasChar
      ? { type: "STATIC", zoomFrom: 1, zoomTo: 1, panFromX: 0, panToX: 0, rotateTo: 0, overshoot: 0 }
      : { type: "SLOW", zoomFrom: 1, zoomTo: 1.018, panFromX: 0, panToX: 0, rotateTo: 0, overshoot: 0 };
  } else if (hasChar) {
    // Hạng B — character on screen: hold still, or drift ≤2%
    s.motion = rnd(seed + "still") < 0.55
      ? { type: "STATIC", zoomFrom: 1, zoomTo: 1, panFromX: 0, panToX: 0, rotateTo: 0, overshoot: 0 }
      : { type: "SLOW", zoomFrom: 1, zoomTo: 1 + 0.012 + rnd(seed + "z") * 0.008, panFromX: 0, panToX: 0, rotateTo: 0, overshoot: 0 };
  } else if (s.shotSize === "co1") {
    const dir = rnd(seed + "p") > 0.5 ? 1 : -1;
    s.motion = { type: "DRIFT", zoomFrom: 1.0, zoomTo: 1.03, panFromX: 0, panToX: dir * 26, rotateTo: 0, overshoot: 0 };
  } else {
    // Hạng A diagram — this is where the movement budget goes
    const inward = rnd(seed + "dir") < 0.72;
    const mag = 1.05 + rnd(seed + "z") * 0.09;
    const dir = rnd(seed + "p") > 0.5 ? 1 : -1;
    s.motion = inward
      ? { type: "SLOW", zoomFrom: 1, zoomTo: mag, panFromX: 0, panToX: dir * 12, rotateTo: 0, overshoot: 0 }
      : { type: "SLOW", zoomFrom: mag, zoomTo: 1, panFromX: dir * 12, panToX: 0, rotateTo: 0, overshoot: 0 };
  }
}

// give every chain a single continuous move, stored on the chain's first shot
const chainMove = {};
for (const s of ordered) {
  if (s.chainPos === 0) {
    const hasChar = s.lumen !== "khong co";
    const mag = hasChar ? 1.02 : 1.06 + rnd(s.shotId + "cm") * 0.06;
    chainMove[s.chainId] = { zoomFrom: 1, zoomTo: mag, panToX: (rnd(s.shotId + "cp") > 0.5 ? 1 : -1) * (hasChar ? 6 : 16) };
  }
}
for (const s of ordered) {
  const cm = chainMove[s.chainId];
  s.chainMove = cm ? { ...cm, pos: s.chainPos, len: s.chainLen } : null;
}

// ---- flashes: only on non-somber gag punchlines, never in MỤC 5 ----
// Every flash used to be the identical 0.42-over-5-frames ramp. An identical
// stinger repeated verbatim is one of the loudest "this was scripted" tells,
// so peak and length are jittered per shot.
for (const s of ordered) {
  s.wantsFlash = s.isGag && s.tone !== "SOMBER" && s.chainPos === 0;
  s.flash = s.wantsFlash
    ? { peak: +(0.26 + rnd(s.shotId + "fp") * 0.26).toFixed(3), frames: 4 + (hash(s.shotId + "ff") % 4) }
    : null;
}

// ---- text overlays: scientific terms + citations + key numbers ----
// ON-SCREEN TEXT IS ENGLISH — the audience is American. (Vietnamese is only
// used in this file's own comments and in the manifest's internal notes.)
const TERM = {
  B05: ["Palmaris longus", "forearm tendon · absent in ~1 in 7"],
  B13: ["ABCC11", "the body-odor gene"],
  // plain-latin spellings on purpose: the handwritten face has no Greek delta
  // or arrow glyph, and "delta 32" reads faster for a general audience anyway
  B19: ["CCR5-delta 32", "32 letters of DNA deleted"],
  B25: ["DEC2", "sleep-regulating gene"],
  B27: ["ADRB1", "a second short-sleep mutation"],
  B33: ["SCN9A / Nav1.7", "sodium channel that amplifies pain"],
  B39: ["Torus palatinus", "bony ridge along the palate"],
  B41: ["LRP5", "bone-building switch stuck on"],
  B49: ["Rh-null", "red cells missing every Rh antigen"],
};
const CITE = {
  B06: "LAC+USC · Keck Medical Center",
  B12: "ALSPAC · University of Bristol",
  B15: "J. Investigative Dermatology, 2013",
  B21: "PNAS, 2024",
  B22: "J. Experimental Medicine, 2006 · NIAID",
  B24: "UCSF",
  B26: "UCSF, 2009",
  B28: "iScience, 2025",
  B32: "Nature, 2006 · Cox et al.",
  B40: "NEJM, 2002 · Yale",
  B44: "Osteoporosis International, 2023",
  B51: "Australian Academy of Science",
};
// NOTE: no numeric overlays. The channel's artwork already renders key figures
// as full-frame typography ("117", "43", "155"), so a stat card would just sit
// on top of the same number. Text on screen is reserved for what the picture
// CANNOT say by itself: gene names and study sources.
for (const s of ordered) s.textOverlay = { show: false, kind: null, text: null, sub: null };
function attach(map, kind, pick) {
  for (const [beat, val] of Object.entries(map)) {
    const all = byBeat[beat] || [];
    const list = all.filter((x) => !x.textOverlay.show);
    const target = pick(list, all) || list[0];
    if (!target) continue;
    const [text, sub] = Array.isArray(val) ? val : [val, null];
    target.textOverlay = { show: true, kind, text, sub };
  }
}
// Several beats already have a full-frame typography shot whose whole artwork
// IS the gene name ("khung chữ chốt tên", "gọi tên gen"). Dropping a term card
// on top of that reads "SCN9A" twice in one frame — the same duplication that
// killed the numeric cards. Skip those shots; the card is most useful on the
// shot straight AFTER the name lands, holding the name over the mechanism.
const isNameFrame = (s) => /khung chữ|chốt tên|gọi tên/i.test(s.description || "");
attach(TERM, "term", (l, all) => {
  const free = l.filter((x) => !isNameFrame(x));
  const nameIdx = all.findIndex(isNameFrame);
  const after = nameIdx >= 0 ? free.find((x) => all.indexOf(x) > nameIdx) : null;
  return after || free.find((x) => x.lumen === "khong co") || free[0];
});
attach(CITE, "cite", (l) => l.find((x) => x.lumen === "khong co") || l[0]);

// Hand-placement pass. Previously every term card landed on the exact same
// pixel bottom-left and every citation on the exact same pixel bottom-right,
// with an identical 11-frame in / 10-frame out. Nine identical placements is a
// template. Nudge each one and vary its timing; somber cards stay untilted.
for (const s of ordered) {
  if (!s.textOverlay.show) continue;
  const o = s.textOverlay;
  o.dx = Math.round((rnd(s.shotId + "tx") - 0.5) * 46);
  o.dy = Math.round((rnd(s.shotId + "ty") - 0.5) * 42);
  o.tilt = s.tone === "SOMBER" ? 0 : +((rnd(s.shotId + "tt") - 0.5) * 1.7).toFixed(2);
  o.inFrames = 9 + (hash(s.shotId + "in") % 7);
  o.outFrames = 8 + (hash(s.shotId + "out") % 7);
}

// ---- section labels (discreet lower-third, not a full-screen card) ----
const MUC_LABEL = {
  B05: "1 · The missing cord",
  B11: "2 · The smell that never happens",
  B18: "3 · The missing door",
  B24: "4 · The people who don't need the night",
  B31: "5 · The signal that never arrives",
  B39: "6 · The family with too much bone",
  B47: "7 · Golden blood",
};
// Authored, not generated: each section label gets its own hold, corner and
// tilt. Seven labels that appear at the same pixel for the same 78 frames with
// the same wipe is the single most obvious template tell in the previous cut.
// B31 opens the somber section — it sits dead straight and holds longest.
const SECTION_STYLE = {
  B05: { frames: 84, place: "bl", tilt: -0.5 },
  B11: { frames: 72, place: "tl", tilt: 0.45 },
  B18: { frames: 80, place: "bl", tilt: 0.6 },
  B24: { frames: 94, place: "bl", tilt: -0.35 },
  B31: { frames: 98, place: "tl", tilt: 0 },
  B39: { frames: 76, place: "bl", tilt: 0.5 },
  B47: { frames: 88, place: "tl", tilt: -0.6 },
};
const sectionLabels = Object.entries(MUC_LABEL).map(([beat, label]) => ({
  beat, label, atSeconds: (byBeat[beat] || [])[0]?.renderStart ?? beatStart[beat],
  ...SECTION_STYLE[beat],
}));

// Never let a term/citation card share the frame with a section label — two
// text elements at once is the cluttered, auto-generated look. If a card
// collides with a label window, move it to the next free shot in the beat.
let movedCards = 0, droppedCards = 0;
for (const sl of sectionLabels) {
  const wStart = sl.atSeconds, wEnd = sl.atSeconds + sl.frames / FPS;
  for (const s of ordered) {
    if (!s.textOverlay.show) continue;
    if (s.scaledEnd <= wStart || s.scaledStart >= wEnd) continue;
    const card = s.textOverlay;
    s.textOverlay = { show: false, kind: null, text: null, sub: null };
    const later = (byBeat[s.beatId] || []).find((x) => x.scaledStart >= wEnd && !x.textOverlay.show);
    if (later) { later.textOverlay = card; movedCards++; } else { droppedCards++; }
  }
}

// ---- SFX: contextual only. Absolute silence through the somber section ----
const sfxCues = [];
let cueId = 1;
for (const s of ordered) {
  if (s.tone === "SOMBER") continue;              // MỤC 5: no sound design at all
  if (s.isGag && s.chainPos === 0) {
    const rate = 0.86 + rnd(s.shotId + "pitch") * 0.32;
    sfxCues.push({ id: `SFX${cueId++}`, type: "GAG", file: "pop.wav", atSeconds: s.scaledStart,
      durationSeconds: 0.15 / rate, playbackRate: rate, volume: 0.4, shotId: s.shotId });
  } else if (s.isMilestone && s.chainPos === 0) {
    sfxCues.push({ id: `SFX${cueId++}`, type: "TALLY", file: "chime.wav", atSeconds: s.scaledStart,
      durationSeconds: 0.7, playbackRate: 1.25, volume: 0.26, shotId: s.shotId });
  } else if (s.beatId === "B45" && s.chainPos === 0) {
    sfxCues.push({ id: `SFX${cueId++}`, type: "SUBSCRIBE", file: "chime.wav", atSeconds: s.scaledStart,
      durationSeconds: 0.7, playbackRate: 1, volume: 0.32, shotId: s.shotId });
  }
}
sfxCues.sort((a, b) => a.atSeconds - b.atSeconds);

// ---- music ----
const music = await parseFile(path.join(__dirname, "..", "public", "music", "bed.mp3"));

const data = {
  _meta: {
    video: "Video004 — Rare Genetic Traits You Might Have Without Knowing",
    fps: FPS,
    audioFiles: AUDIO_FILES,
    audioDurations: durations,
    fileOffset,
    totalRealDurationSeconds: +totalDurationFinal.toFixed(3),
    voSegments, breaths,
    totalBreathSeconds: +totalBreath.toFixed(3),
    beatStart, beatEnd,
    alignmentCorrections: corrections,
    beatReport,
    somberBeats: [...SOMBER_BEATS],
    sectionLabels,
    // crossfadeSeconds: the bed is shorter than the video, so it loops. Butting
    // two copies end-to-end leaves an audible restart at every loop point —
    // a dead giveaway that nobody mixed this. Loops now overlap and equal-power
    // crossfade instead.
    music: { file: "bed.mp3", sourceTrack: "Tiptoe - Nat Keefe",
      durationSeconds: music.format.duration,
      duckVolume: 0.15, somberDuckVolume: 0.08,
      rampSeconds: 0.4, edgeFadeSeconds: 1.5, crossfadeSeconds: 1.6 },
    editorialNote:
      "Video004: khong co thanh tien do. Chuyen dong manh chi danh cho khung KHONG nhan vat (Hang A); " +
      "khung co nhan vat gan nhu dung yen (Hang B) theo dung luat skill edit. Chuoi KHOA cat cung va dung " +
      "MOT cu may lien tuc xuyen suot chuoi. Punch-in co overshoot roi settle. MUC 5 (B31-B38) doi grammar: " +
      "tan mo cham, khong flash, khong punch, KHONG SFX. SFX chi o gag/moc tich luy/subscribe.",
  },
  shots: ordered,
  sfxCues,
};

fs.writeFileSync(outManifest, JSON.stringify(data, null, 2), "utf8");

console.log("total duration:", totalDurationFinal.toFixed(2), "s =",
  Math.floor(totalDurationFinal / 60) + ":" + String(Math.round(totalDurationFinal % 60)).padStart(2, "0"),
  `(VO ${totalDuration.toFixed(2)}s + ${totalBreath.toFixed(2)}s of inserted breath)`);
console.log("breaths:", cutPoints.map((c) => `${c.beat} ${c.breath}s ${c.kind}${c.kind === "splice" ? ` in ${c.silence.toFixed(2)}s of silence` : ""}`).join(" | "));
console.log("vo segments:", voSegments.length);
console.log("alignment corrections:", corrections);
const tally = (f) => ordered.reduce((a, s) => { const k = f(s); a[k] = (a[k] || 0) + 1; return a; }, {});
console.log("transition:", tally((s) => s.transition.type));
console.log("motion:", tally((s) => s.motion.type));
console.log("tone:", tally((s) => s.tone));
console.log("chains >1 shot:", Object.values(chainSize).filter((n) => n > 1).length);
console.log("text overlays:", ordered.filter((s) => s.textOverlay.show).length,
  `(moved off label collision: ${movedCards}, dropped: ${droppedCards})`,
  "| section labels:", sectionLabels.length, "| sfx cues:", sfxCues.length);
console.log("shots:", ordered.length);
