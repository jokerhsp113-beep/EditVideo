import { COLORS } from "../theme";
import type { SectionTimeline } from "../types";

/**
 * SECTION 00 — COLD OPEN
 *
 * Shot 0.P (the silent payoff preview from the production file) is CUT.
 * It was 0.9s of dead air before the first word: retention is measured from
 * frame 0, and running it under the opening line would break semantic sync
 * ("broken genes" over a deodorant bottle). The same payoff is delivered
 * properly by item 1 at ~0:24.
 * Shot plan from 00-cold-open-production-ready-v2.3-zero-data.md
 *
 * PROVISIONAL config (file 00 §1 leaves these null until the science gate passes):
 *   FP_WINDOW = 2 (ALDH2, the item with an evidence-backed cost)
 *   NB_WINDOW = 1 (ABCC11, "no bill anyone has found")
 *   LIT_WINDOWS = [4, 5, 6] (GULO, MYH16, CASP12)
 */
const FP_WINDOW = 2;
const NB_WINDOW = 1;
const LIT_WINDOWS = [4, 5, 6];

const WIN_D = 190;
const WIN_X = [270, 500, 730, 960, 1190, 1420, 1650];

export const s00: SectionTimeline = {
  id: "S00 · COLD OPEN",
  title: "Cold open",
  audio: "biy/audio/s00.mp3",
  captions: "biy/captions/s00.json",
  leadInMs: 200,
  shots: [
    {
      id: "0.1",
      anchor: "We talk about broken genes",
      note: "thesis grounded by DNA; X lands on 'mistakes'",
      layers: [
        { id: "stick", src: "s00/stick_stand_deadpan_v01", x: 960, y: 640, h: 560, state: "ALIVE", enter: "NONE" },
        { id: "dna1", src: "s00/asset_dna_icon_v01", x: 560, y: 560, h: 200, opacity: 0.6, enter: "NONE" },
        { id: "dna2", src: "s00/asset_dna_icon_v01", x: 1340, y: 380, h: 200, opacity: 0.6, at: "broken genes", delay: 0.1 },
        { id: "dna3", src: "s00/asset_dna_icon_v01", x: 1360, y: 760, h: 200, opacity: 0.6, at: "genes as if" },
        { id: "x", src: "s00/prop_red_x", x: 1340, y: 380, w: 130, enter: "DRAW", at: "mistakes", z: 20 },
      ],
    },
    {
      id: "0.3",
      anchor: "But biology",
      note: "single-focal: PERFECT + sparkles, sparkles stop on 'reward'",
      layers: [
        { id: "stick", src: "s00/stick_skeptical_v01", x: 300, y: 830, h: 300, state: "ALIVE", enter: "FADE" },
        { id: "perfect", kind: "text", text: "PERFECT", x: 1010, y: 470, enter: "POP", props: { size: 210 } },
        { id: "sp1", src: "s00/prop_sparkle_4point", x: 640, y: 340, w: 90, until: 2.2 },
        { id: "sp2", src: "s00/prop_sparkle_4point", x: 1400, y: 330, w: 70, delay: 0.15, until: 2.0 },
        { id: "sp3", src: "s00/prop_sparkle_4point", x: 1290, y: 620, w: 60, delay: 0.3, until: 1.8 },
      ],
    },
    {
      id: "0.4",
      anchor: "It rewards whatever",
      note: "inheritance chain; dot travels on 'passed on'",
      layers: [
        { id: "perfect", kind: "text", text: "PERFECT", x: 960, y: 230, props: { size: 120 }, opacity: 0.55, enter: "FADE" },
        { id: "px", src: "s00/prop_red_x", x: 960, y: 230, w: 120, enter: "DRAW", z: 20 },
        { id: "s1", src: "s00/stick_stand_deadpan_v01", x: 560, y: 690, h: 300, enter: "POP", delay: 0.25 },
        { id: "a1", kind: "arrow", x: 700, y: 660, w: 160, enter: "DRAW", delay: 0.5 },
        { id: "s2", src: "s00/stick_stand_deadpan_v01", x: 960, y: 690, h: 300, enter: "POP", delay: 0.7 },
        { id: "a2", kind: "arrow", x: 1100, y: 660, w: 160, enter: "DRAW", delay: 0.95 },
        { id: "s3", src: "s00/stick_stand_deadpan_v01", x: 1360, y: 690, h: 300, enter: "POP", delay: 1.15 },
        { id: "dot", kind: "dot", x: 530, y: 640, w: 36, at: "survives long enough", z: 30, props: { toX: 1330, travel: 1.6 } },
      ],
    },
    {
      id: "0.5",
      anchor: "So here are seven",
      note: "BEAT A giant 7 → BEAT B seven closed windows",
      layers: [
        { id: "seven", kind: "number", text: "7", x: 960, y: 500, enter: "POP", until: 1.1, props: { size: 460 } },
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 460,
          delay: 1.1,
          enter: "POP",
          props: { open: [], lit: [], pulse: null, icons: {} },
        },
        { id: "caption", kind: "text", text: "SEVEN TIMES LOSING A FUNCTION HELPED", x: 960, y: 760, delay: 1.35, enter: "FADE", props: { size: 46, color: COLORS.grey } },
      ],
    },
    {
      id: "0.6",
      anchor: "Sometimes with a price",
      note: "FP window ring + FINE PRINT",
      layers: [
        { id: "windows", kind: "windows", x: 960, y: 460, enter: "NONE", props: { open: [], lit: [], icons: {} } },
        { id: "ring", kind: "ring", x: WIN_X[FP_WINDOW - 1], y: 460, w: WIN_D + 34, enter: "DRAW", z: 20 },
        { id: "fp", kind: "text", text: "FINE PRINT", x: WIN_X[FP_WINDOW - 1], y: 640, enter: "POP", delay: 0.2, props: { size: 56, color: COLORS.orange } },
      ],
    },
    {
      id: "0.7",
      anchor: "Sometimes with no bill",
      note: "NB window dashed ring + grey ?",
      layers: [
        { id: "windows", kind: "windows", x: 960, y: 460, enter: "NONE", props: { open: [], lit: [], icons: {} } },
        { id: "ringfp", kind: "ring", x: WIN_X[FP_WINDOW - 1], y: 460, w: WIN_D + 34, enter: "NONE", opacity: 0.4, z: 20 },
        { id: "ringnb", kind: "ring", x: WIN_X[NB_WINDOW - 1], y: 460, w: WIN_D + 34, enter: "DRAW", props: { dashed: true }, z: 20 },
        { id: "q", kind: "text", text: "?", x: WIN_X[NB_WINDOW - 1], y: 650, enter: "POP", delay: 0.25, props: { size: 110, color: COLORS.grey } },
        { id: "stick", src: "s00/stick_skeptical_v01", x: 1720, y: 830, h: 300, enter: "FADE", state: "ALIVE" },
      ],
    },
    {
      id: "0.8",
      anchor: "And three of them",
      push: 5,
      note: "viewer ownership reveal — 3 lit windows tether into the chest",
      layers: [
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 300,
          enter: "NONE",
          props: { open: [], lit: LIT_WINDOWS, icons: {} },
        },
        { id: "stick", src: "s00/stick_realize_v01", x: 960, y: 760, h: 520, enter: "FADE", state: "ALIVE" },
        { id: "t1", kind: "tether", x: WIN_X[3], y: 390, at: "almost everyone", z: 5, props: { dx: 0, dy: 280 } },
        { id: "t2", kind: "tether", x: WIN_X[4], y: 390, at: "almost everyone", z: 5, props: { dx: -230, dy: 280 } },
        { id: "t3", kind: "tether", x: WIN_X[5], y: 390, at: "almost everyone", z: 5, props: { dx: -460, dy: 280 } },
        { id: "aperture", src: "s00/prop_aperture_ring", x: 960, y: 690, w: 90, at: "watching this", state: "ACTIVE", z: 30 },
      ],
    },
    {
      id: "0.T",
      note: "item transition — win_1 opens on the deodorant",
      hold: 2.2,
      layers: [
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 470,
          enter: "FADE",
          props: { open: [1], lit: [], pulse: 1, icons: { 1: "s00/asset_deodorant_v01" } },
        },
        { id: "title", kind: "text", text: "ODOR-FREE", x: 960, y: 720, enter: "POP", delay: 0.8, props: { size: 96 } },
      ],
    },
  ],
};
