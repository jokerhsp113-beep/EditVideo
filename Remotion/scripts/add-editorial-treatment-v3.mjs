// Video003 editorial pass: motion, idle motion, citation/percentage overlays,
// and per-box title cards. Same design philosophy as Video002's
// add-editorial-treatment.mjs (role-aware + deterministic per-shot variety,
// never one fixed formula) but keyed off `tag`/`shotRole`/`box` since this
// video's beat granularity is coarse (one beat = one whole box) rather than
// Video002's one-beat-per-clause structure.
//
// Run with: node scripts/add-editorial-treatment-v3.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "src", "data", "manifest_shots_video003.json");
const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function rand01(seed) {
  return (hash(seed) % 10000) / 10000;
}

// ---- motion treatment (same 5 types as Video002) ----
function buildMotion(shot) {
  const seed = shot.shotId;
  const twoChar = (shot.lumen || "").includes("HAI NHAN VAT");

  if (shot.tag === "HERO" || shot.tag === "SUBSCRIBE" || shot.tag === "COMMENT_BAIT") {
    return { type: "STATIC", zoomFrom: 1.0, zoomTo: 1.0, panFromX: 0, panToX: 0, rotateTo: 0 };
  }
  if (shot.tag === "GAG") {
    const zoomTo = 1.1 + rand01(seed + "z") * 0.12;
    const rotateTo = (rand01(seed + "r") - 0.5) * 4;
    return { type: "PUNCH", zoomFrom: 1.0, zoomTo, panFromX: 0, panToX: 0, rotateTo };
  }
  if (shot.shotRole === "NUMBER") {
    const zoomTo = 1.06 + rand01(seed + "z") * 0.08;
    return { type: "PUNCH", zoomFrom: 1.0, zoomTo, panFromX: 0, panToX: 0, rotateTo: 0 };
  }
  if (shot.shotSize === "co1") {
    const dir = rand01(seed + "p") > 0.5 ? 1 : -1;
    return { type: "DRIFT", zoomFrom: 1.0, zoomTo: 1.0, panFromX: 0, panToX: dir * 25, rotateTo: 0 };
  }
  if (shot.tag === "POP_IN" || shot.tag === "KHOA") {
    const zoomTo = 1.0 + rand01(seed + "z") * 0.03;
    return { type: "SLOW", zoomFrom: 1.0, zoomTo, panFromX: 0, panToX: 0, rotateTo: 0 };
  }
  if (twoChar) {
    if (rand01(seed + "mode") > 0.5) {
      const dir = rand01(seed + "p") > 0.5 ? 1 : -1;
      return { type: "DRIFT", zoomFrom: 1.0, zoomTo: 1.0, panFromX: 0, panToX: dir * 18, rotateTo: 0 };
    }
    const zoomTo = 1.02 + rand01(seed + "z") * 0.04;
    return { type: "SLOW", zoomFrom: 1.0, zoomTo, panFromX: 0, panToX: 0, rotateTo: 0 };
  }
  if (rand01(seed + "static") < 0.12) {
    return { type: "STATIC", zoomFrom: 1.0, zoomTo: 1.0, panFromX: 0, panToX: 0, rotateTo: 0 };
  }
  const zoomingIn = rand01(seed + "dir") < 0.7;
  const magnitude = 1.02 + rand01(seed + "z") * 0.08;
  const dir = rand01(seed + "p") > 0.5 ? 1 : -1;
  return zoomingIn
    ? { type: "SLOW", zoomFrom: 1.0, zoomTo: magnitude, panFromX: 0, panToX: dir * 10, rotateTo: 0 }
    : { type: "SLOW", zoomFrom: magnitude, zoomTo: 1.0, panFromX: 0, panToX: dir * 10, rotateTo: 0 };
}

// ---- idle motion (same 4 types as Video002) ----
function buildIdle(shot) {
  const seed = shot.shotId;
  const twoChar = (shot.lumen || "").includes("HAI NHAN VAT");
  const isPartial = shot.lumen === "ban phan";

  let type;
  if (isPartial) type = "NONE";
  else if (shot.tag === "GAG") type = "NONE";
  else if (shot.tag === "HERO") type = "SWAY";
  else if (shot.tag === "SUBSCRIBE" || shot.tag === "COMMENT_BAIT") type = "BOB";
  else if (shot.shotRole === "COST") type = rand01(seed + "idle") < 0.5 ? "NONE" : "BREATHE";
  else if (shot.tag === "POP_IN" || shot.tag === "KHOA") type = "BREATHE";
  else if (twoChar) type = "SWAY";
  else {
    const r = rand01(seed + "idlepool");
    type = r < 0.4 ? "BREATHE" : r < 0.6 ? "BOB" : r < 0.8 ? "SWAY" : "NONE";
  }

  if (type === "NONE") return { type, amplitude: 0, periodSeconds: 0, axis: "none" };
  if (type === "BREATHE")
    return { type, amplitude: 0.01 + rand01(seed + "ia") * 0.006, periodSeconds: 2.2 + rand01(seed + "ip") * 0.9, axis: "scale" };
  if (type === "BOB")
    return { type, amplitude: 4 + rand01(seed + "ia") * 4, periodSeconds: 1.7 + rand01(seed + "ip") * 0.7, axis: "translateY" };
  return { type, amplitude: 0.6 + rand01(seed + "ia") * 0.7, periodSeconds: 3.0 + rand01(seed + "ip") * 1.2, axis: "rotate" };
}

// ---- citations (from the script's own NGUỒN lines, one per box beat) ----
const CITATIONS = {
  B04: "Landsteiner · ABO codominance",
  B05: "Yin & Flegel · J Transl Med, 2021",
  B06: "Landsteiner's law",
  B07: "Sequence diversity of Rh, 2018",
  B08: "Itou et al. · 261delG, 2013",
  B09: "CDC · norovirus HBGA binding",
  B10: "Transfusion, 2004 · Martinko et al.",
  B11: "Rowe et al. · PNAS, 2007",
  B14: "Bombay phenotype · FUT1",
};

// ---- percentage chart overlays (real published rarity per box, not illustrative) ----
const BOX_PERCENT = {
  B04: 0.6, B05: 2, B06: 3, B07: 6, B08: 7, B09: 9, B10: 34, B11: 37,
};

const BOX_TITLES = {
  BOX1_AB_NEG: { rank: 1, title: "AB Negative", pct: "0.6%" },
  BOX2_B_NEG: { rank: 2, title: "B Negative", pct: "2%" },
  BOX3_AB_POS: { rank: 3, title: "AB Positive", pct: "3%" },
  BOX4_A_NEG: { rank: 4, title: "A Negative", pct: "6%" },
  BOX5_O_NEG: { rank: 5, title: "O Negative", pct: "7%" },
  BOX6_B_POS: { rank: 6, title: "B Positive", pct: "9%" },
  BOX7_A_POS: { rank: 7, title: "A Positive", pct: "34%" },
  BOX8_O_POS: { rank: 8, title: "O Positive", pct: "37%" },
  BOMBAY: { rank: 9, title: "The Bombay Phenotype", pct: "~0.0001%" },
};

const byBeat = {};
for (const s of data.shots) (byBeat[s.beatId] = byBeat[s.beatId] || []).push(s);

const motionTally = {};
const idleTally = {};
let citationCount = 0;
let chartCount = 0;

for (const shot of data.shots) {
  shot.motion = buildMotion(shot);
  motionTally[shot.motion.type] = (motionTally[shot.motion.type] || 0) + 1;
  shot.idle = buildIdle(shot);
  idleTally[shot.idle.type] = (idleTally[shot.idle.type] || 0) + 1;
  shot.textOverlay = { show: false, kind: null, text: null };
  shot.chartOverlay = null;
}

// Attach citation to the first POP_IN (mechanism-layer) shot of each cited beat.
for (const [beatId, text] of Object.entries(CITATIONS)) {
  const shots = byBeat[beatId] || [];
  const target = shots.find((s) => s.tag === "POP_IN") || shots[0];
  if (target) {
    target.textOverlay = { show: true, kind: "citation", text };
    citationCount++;
  }
}

// Attach a real-percentage pie chart to the shot that reveals that box's number.
for (const [beatId, pct] of Object.entries(BOX_PERCENT)) {
  const shots = byBeat[beatId] || [];
  const target = shots.find((s) => s.shotRole === "NUMBER") || shots[1] || shots[0];
  if (target) {
    target.chartOverlay = { type: "pie", sliverDegrees: (pct / 100) * 360, label: `${pct}%` };
    chartCount++;
  }
}

// ---- title cards: one per box, handwritten style, timed to that box's first shot ----
const firstShotByBox = {};
for (const shot of data.shots) {
  if (!(shot.box in firstShotByBox)) firstShotByBox[shot.box] = shot;
}
// IMPORTANT: use renderStart (the pre-roll point where that shot's crossfade
// already begins), not scaledStart — otherwise the box-boundary dissolve
// plays fully visible (two unrelated images ghosted together) for ~0.67s
// BEFORE the opaque title card appears to cover it. Starting the card exactly
// at renderStart means the crossfade happens entirely hidden behind the card.
data.boxTitleCards = Object.entries(BOX_TITLES).map(([box, info]) => ({
  box,
  rank: info.rank,
  totalRanks: 9,
  title: info.title,
  pct: info.pct,
  atSeconds: firstShotByBox[box] ? firstShotByBox[box].renderStart : null,
})).filter((c) => c.atSeconds !== null);

data._meta.editorialNote =
  "Video003: motion/idle dung chung logic voi Video002 (role-aware, khong 1 cong thuc). " +
  "textOverlay = trich dan NGUON that tu script (9 beat co nguon). chartOverlay = pie chart voi PHAN TRAM THAT cong bo trong script (khong phai minh hoa uoc luong nhu Video002). " +
  "boxTitleCards = 8 o mau + Bombay, font viet tay, dung vi tri scaledStart cua shot dau tien trong box.";

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
console.log("Motion tally:", motionTally);
console.log("Idle tally:", idleTally);
console.log("Citations:", citationCount, "| Chart overlays:", chartCount, "| Title cards:", data.boxTitleCards.length);
