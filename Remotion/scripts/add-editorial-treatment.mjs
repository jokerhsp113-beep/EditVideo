// Adds editorial fields to manifest_shots.json:
//   - beatRole: the shot's storytelling function (NAME/SCENE/NUMBER/MECHANISM/
//     REWARD/COST/BRIDGE/...), derived from the base beat number — this is
//     what lets motion choices be purposeful instead of index%2 alternation.
//   - motion: {type, zoomFrom, zoomTo, panFromX, panToX, rotateTo, punch}
//     — a varied, role-aware camera treatment per shot.
//   - textOverlay: source-citation / gene-name cards for the handful of shots
//     carrying information that's genuinely hard to catch by ear alone.
//
// Re-run after build-manifest-timing.mjs. Safe to re-run any time — it only
// adds/overwrites these three fields, everything else in the manifest is left
// untouched.
//
// Run with: node scripts/add-editorial-treatment.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "src", "data", "manifest_shots.json");
const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// ---- beatRole: base beat number -> storytelling function -------------------
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

// ---- deterministic pseudo-randomness (stable across re-runs, unlike Math.random) ----
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function rand01(seed) {
  return (hash(seed) % 10000) / 10000;
}

// ---- text overlays: only where the info is genuinely hard to catch by ear ----
const CITATIONS = {
  S13: "Dr. Gabriele Jordan · Newcastle University",
  S22: "Dr. Lore Thaler · Durham University",
  S38: "Ilardo et al. · Cell, 2018",
  S54: "Boyden et al. · NEJM, 2002",
  S70: "NTRK1 gene research",
  S86: "James McGaugh · UC Irvine",
  S102: "Schuelke et al. · NEJM, 2004",
};
const GENE_LABELS = {
  S55: "LRP5",
  S71: "NTRK1",
  S103: "MYOSTATIN",
};

// Animated chart overlays — a small corner widget that replaces the flat,
// static pie/bar prop baked into these shots' source image with a live-drawn
// SVG. Pie sliver sizes are illustrative (matching the script's own rising-
// rarity axis, not claimed as exact published percentages) since the script
// itself only ever says "a tiny handful" / "fewer than a few hundred", never
// a precise number.
const CHART_OVERLAYS = {
  S11: { type: "pie", sliverDegrees: 18, label: "rare" },
  S69: { type: "pie", sliverDegrees: 8, label: "rarer" },
  S85: { type: "pie", sliverDegrees: 5, label: "rarer still" },
  S101: { type: "pie", sliverDegrees: 2, label: "rarest" },
  S42: { type: "bar", barHeightPct: 130, label: "+50%" },
  S58: { type: "bar", barHeightPct: 145, label: "off the chart" },
};

// ---- motion treatment: role-aware, varied, not a mechanical formula --------
function buildMotion(shot) {
  const seed = shot.shotId;
  const twoChar = (shot.lumen || "").includes("HAI NHAN VAT");

  // 1) Hold still: payoff / CTA moments should not compete with the message.
  if (
    shot.tag === "HERO" ||
    shot.tag === "SUBSCRIBE" ||
    shot.tag === "COMMENT_BAIT" ||
    shot.shotId === "S90" // "BRAIN: NEVER DELETES" text-card gag
  ) {
    return { type: "STATIC", zoomFrom: 1.0, zoomTo: 1.0, panFromX: 0, panToX: 0, rotateTo: 0 };
  }

  // 2) Gags: fast punch-in with a tiny comedic tilt, always zooming IN.
  if (shot.tag === "GAG") {
    const zoomTo = 1.1 + rand01(seed + "z") * 0.12; // 1.10-1.22, varies per gag
    const rotateTo = (rand01(seed + "r") - 0.5) * 4; // -2..+2 deg
    return { type: "PUNCH", zoomFrom: 1.0, zoomTo, panFromX: 0, panToX: 0, rotateTo };
  }

  // 3) Statistic reveals: medium punch-in to land the number.
  if (shot.beatRole === "NUMBER") {
    const zoomTo = 1.06 + rand01(seed + "z") * 0.08; // 1.06-1.14
    return { type: "PUNCH", zoomFrom: 1.0, zoomTo, panFromX: 0, panToX: 0, rotateTo: 0 };
  }

  // 4) Reward beats: pull back — "opening up" to enjoy the new power.
  if (shot.beatRole === "REWARD") {
    const zoomFrom = 1.08 + rand01(seed + "z") * 0.06; // 1.08-1.14
    return { type: "PULL", zoomFrom, zoomTo: 1.0, panFromX: 0, panToX: 0, rotateTo: 0 };
  }

  // 5) Wide establishing shots: drift, no zoom — let the wide framing breathe.
  if (shot.shotSize === "co1") {
    const dir = rand01(seed + "p") > 0.5 ? 1 : -1;
    return { type: "DRIFT", zoomFrom: 1.0, zoomTo: 1.0, panFromX: 0, panToX: dir * 25, rotateTo: 0 };
  }

  // 6) Diagram builds (pop-in / locked reuse): minimal zoom so labels/pointers stay legible.
  if (shot.tag === "POP_IN" || shot.tag === "KHOA") {
    const zoomTo = 1.0 + rand01(seed + "z") * 0.03; // 1.00-1.03
    return { type: "SLOW", zoomFrom: 1.0, zoomTo, panFromX: 0, panToX: 0, rotateTo: 0 };
  }

  // 7) Two-character interaction shots: alternate drift vs. gentle push for variety.
  if (twoChar) {
    if (rand01(seed + "mode") > 0.5) {
      const dir = rand01(seed + "p") > 0.5 ? 1 : -1;
      return { type: "DRIFT", zoomFrom: 1.0, zoomTo: 1.0, panFromX: 0, panToX: dir * 18, rotateTo: 0 };
    }
    const zoomTo = 1.02 + rand01(seed + "z") * 0.04;
    return { type: "SLOW", zoomFrom: 1.0, zoomTo, panFromX: 0, panToX: 0, rotateTo: 0 };
  }

  // 8) Default talking/explanation shots: gentle push, ~70% in / 30% out, with
  // ~12% chance of being fully static for pacing (not everything should move).
  if (rand01(seed + "static") < 0.12) {
    return { type: "STATIC", zoomFrom: 1.0, zoomTo: 1.0, panFromX: 0, panToX: 0, rotateTo: 0 };
  }
  const zoomingIn = rand01(seed + "dir") < 0.7;
  const magnitude = 1.02 + rand01(seed + "z") * 0.08; // 1.02-1.10
  const dir = rand01(seed + "p") > 0.5 ? 1 : -1;
  return zoomingIn
    ? { type: "SLOW", zoomFrom: 1.0, zoomTo: magnitude, panFromX: 0, panToX: dir * 10, rotateTo: 0 }
    : { type: "SLOW", zoomFrom: magnitude, zoomTo: 1.0, panFromX: 0, panToX: dir * 10, rotateTo: 0 };
}

// ---- idle motion: varied per-shot "alive" treatment, not one fixed formula ----
// type: BREATHE (scale pulse) | BOB (vertical sway) | SWAY (slow rotation) | NONE
const IDLE_POOL = ["BREATHE", "BOB", "SWAY", "NONE"];
function buildIdle(shot) {
  const seed = shot.shotId;
  const twoChar = (shot.lumen || "").includes("HAI NHAN VAT");
  const isPartial = shot.lumen === "ban phan";

  let type;
  if (isPartial) {
    type = "NONE"; // an isolated floating paw shouldn't "breathe"
  } else if (shot.tag === "GAG") {
    type = "NONE"; // the punch-in + tilt already carries all the energy
  } else if (shot.tag === "HERO") {
    type = "SWAY"; // slow, dignified — not comedic
  } else if (shot.tag === "SUBSCRIBE" || shot.tag === "COMMENT_BAIT") {
    type = "BOB"; // a little more inviting/bouncy for a CTA
  } else if (shot.beatRole === "REWARD") {
    type = "BOB"; // celebratory
  } else if (shot.beatRole === "COST") {
    type = rand01(seed + "idle") < 0.5 ? "NONE" : "BREATHE"; // calmer, more serious beat
  } else if (shot.beatRole === "MECHANISM") {
    type = "BREATHE"; // minimal, don't fight the explanation
  } else if (twoChar) {
    type = "SWAY";
  } else {
    // default pool, weighted: BREATHE 40 / BOB 20 / SWAY 20 / NONE 20
    const r = rand01(seed + "idlepool");
    type = r < 0.4 ? "BREATHE" : r < 0.6 ? "BOB" : r < 0.8 ? "SWAY" : "NONE";
  }

  if (type === "NONE") {
    return { type, amplitude: 0, periodSeconds: 0, axis: "none" };
  }
  if (type === "BREATHE") {
    return {
      type,
      amplitude: 0.01 + rand01(seed + "ia") * 0.006, // 1.0%-1.6%
      periodSeconds: 2.2 + rand01(seed + "ip") * 0.9, // 2.2-3.1s
      axis: "scale",
    };
  }
  if (type === "BOB") {
    return {
      type,
      amplitude: 4 + rand01(seed + "ia") * 4, // 4-8px
      periodSeconds: 1.7 + rand01(seed + "ip") * 0.7, // 1.7-2.4s
      axis: "translateY",
    };
  }
  // SWAY
  return {
    type,
    amplitude: 0.6 + rand01(seed + "ia") * 0.7, // 0.6-1.3deg
    periodSeconds: 3.0 + rand01(seed + "ip") * 1.2, // 3.0-4.2s
    axis: "rotate",
  };
}

const MUC_TITLES = {
  MUC1_TETRACHROMACY: { rank: 1, title: "Tetrachromacy" },
  MUC2_ECHOLOCATION: { rank: 2, title: "Human Echolocation" },
  MUC3_BAJAU: { rank: 3, title: "The Free-Diver's Spleen" },
  MUC4_XUONG_LRP5: { rank: 4, title: "Unbreakable Bones" },
  MUC5_CIPA: { rank: 5, title: "Congenital Insensitivity to Pain" },
  MUC6_HSAM: { rank: 6, title: "Superior Autobiographical Memory" },
  MUC7_MYOSTATIN: { rank: 7, title: "Myostatin-Related Muscle Hypertrophy" },
};

let citationCount = 0;
let geneCount = 0;
const motionTally = {};
const idleTally = {};

for (const shot of data.shots) {
  const base = baseBeatNumber(shot.beatId);
  shot.beatRole = base !== null ? ROLE_BY_BASE_BEAT[base] ?? "OTHER" : "OTHER";

  shot.motion = buildMotion(shot);
  motionTally[shot.motion.type] = (motionTally[shot.motion.type] || 0) + 1;

  shot.idle = buildIdle(shot);
  idleTally[shot.idle.type] = (idleTally[shot.idle.type] || 0) + 1;

  if (CITATIONS[shot.shotId]) {
    shot.textOverlay = { show: true, kind: "citation", text: CITATIONS[shot.shotId] };
    citationCount++;
  } else if (GENE_LABELS[shot.shotId]) {
    shot.textOverlay = { show: true, kind: "gene", text: GENE_LABELS[shot.shotId] };
    geneCount++;
  } else {
    shot.textOverlay = { show: false, kind: null, text: null };
  }

  shot.chartOverlay = CHART_OVERLAYS[shot.shotId] ?? null;
}
const chartCount = Object.keys(CHART_OVERLAYS).length;

// ---- mục title cards: rank + title, timed to the start of each mục's NAME beat ----
const firstShotBySection = {};
for (const shot of data.shots) {
  if (!(shot.section in firstShotBySection)) firstShotBySection[shot.section] = shot;
}
// IMPORTANT: use renderStart, not scaledStart — otherwise the section-
// boundary dissolve plays fully visible (two unrelated images ghosted
// together) for ~0.67s BEFORE the opaque title card appears to cover it.
data.mucTitleCards = Object.entries(MUC_TITLES).map(([section, info]) => ({
  section,
  rank: info.rank,
  totalRanks: Object.keys(MUC_TITLES).length,
  title: info.title,
  atSeconds: firstShotBySection[section].renderStart,
}));

data._meta.editorialNote =
  "beatRole = vai tro ke chuyen cua shot (suy tu so beat goc, xem ROLE_BY_BASE_BEAT trong script). " +
  "motion = kieu chuyen dong camera theo vai tro (STATIC/PUNCH/PULL/DRIFT/SLOW), khong con la cong thuc chan/le. " +
  "textOverlay = the trich dan nguon nghien cuu (7 shot) + nhan ten gen (3 shot) - chi dat o cho thong tin kho nghe ro bang tai.";

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
console.log("Motion treatment tally:", motionTally);
console.log("Idle treatment tally:", idleTally);
console.log("Citation overlays:", citationCount, "| Gene-label overlays:", geneCount, "| Chart overlays:", chartCount);
console.log("Mục title cards:", data.mucTitleCards.length);
