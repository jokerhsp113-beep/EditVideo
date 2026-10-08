import { COLORS } from "../theme";
import type { SectionTimeline } from "../types";

/**
 * SECTION 01 — ODOR-FREE (ABCC11)
 * Shot plan from 01-odor-free-production-ready-v2.3-zero-data.md
 * 1.7–1.11 deliberately share one anatomy canvas: same Stick, same Body Window,
 * same plate — only overlays change state.
 */
const ANATOMY = {
  stick: { x: 640, y: 700, h: 620 },
  window: { x: 1290, y: 520, w: 620, h: 470 },
};

export const s01: SectionTimeline = {
  id: "S01 · ODOR-FREE",
  title: "Odor-free",
  audio: "biy/audio/s01.mp3",
  captions: "biy/captions/s01.json",
  shots: [
    {
      id: "1.1",
      anchor: "Odor-free",
      note: "item entry — title beat",
      layers: [
        { id: "deo", src: "s01/asset_deodorant_v01", x: 960, y: 590, h: 300, enter: "POP" },
        { id: "x", src: "s00/prop_red_x", x: 960, y: 590, w: 230, enter: "DRAW", delay: 0.25, z: 20 },
        { id: "title", kind: "text", text: "ODOR-FREE", x: 960, y: 210, enter: "POP", props: { size: 110 } },
        { id: "stick", src: "s01/stick_stand_deadpan_v01", x: 250, y: 850, h: 300, enter: "FADE", state: "ALIVE" },
      ],
    },
    {
      id: "1.2",
      anchor: "You're halfway to work",
      note: "walking pose + thought bubble; slash on 'forgot deodorant'",
      layers: [
        { id: "stick", src: "s01/stick_walk_remember_v01", x: 650, y: 700, h: 560, enter: "POP", state: "ALIVE" },
        { id: "bubble", kind: "bubble", x: 1250, y: 350, w: 520, h: 360, at: "you remember", enter: "POP" },
        { id: "deo", src: "s01/asset_deodorant_v01", x: 1250, y: 330, h: 210, at: "forgot deodorant", enter: "POP", z: 20 },
        { id: "slash", kind: "slash", x: 1250, y: 330, w: 250, at: "forgot deodorant", enter: "DRAW", delay: 0.2, z: 30 },
      ],
    },
    {
      id: "1.3",
      anchor: "or you're nine hours",
      note: "hard reset — airplane seat",
      layers: [
        { id: "seat", src: "s01/asset_airplane_seat_v01", x: 1120, y: 620, h: 620, enter: "SLIDE" },
        { id: "stick", src: "s01/stick_sit_exhausted_v01", x: 1070, y: 625, h: 430, enter: "FADE", delay: 0.2, state: "ALIVE", z: 20 },
      ],
    },
    {
      id: "1.4",
      anchor: "or you just pulled",
      note: "gym bag + exactly three odour lines",
      layers: [
        { id: "stick", src: "s01/stick_smell_bag_v01", x: 620, y: 690, h: 540, enter: "POP", state: "ALIVE" },
        { id: "bag", src: "s01/asset_gym_bag_open_v01", x: 1270, y: 720, w: 470, enter: "SLIDE", at: "gym bag" },
        { id: "odor", kind: "odor", x: 1230, y: 400, w: 180, at: "gym bag", delay: 0.3, z: 20 },
      ],
    },
    {
      id: "1.5",
      anchor: "For some people",
      note: "compression payoff — one green check, problem props recede",
      layers: [
        { id: "stick", src: "s01/stick_calm_v01", x: 960, y: 660, h: 580, enter: "POP", state: "ALIVE" },
        { id: "deo", src: "s01/asset_deodorant_v01", x: 380, y: 340, h: 190, opacity: 0.35, enter: "FADE" },
        { id: "seat", src: "s01/asset_airplane_seat_v01", x: 1560, y: 330, h: 260, opacity: 0.35, enter: "FADE" },
        { id: "bag", src: "s01/asset_gym_bag_open_v01", x: 1580, y: 790, w: 300, opacity: 0.35, enter: "FADE" },
        { id: "check", src: "s00/prop_green_check", x: 960, y: 330, w: 220, at: "none of that", enter: "POP", state: "ACTIVE", z: 30 },
      ],
    },
    {
      id: "1.6",
      anchor: "Because a gene called",
      note: "gene reveal only — no anatomy yet",
      layers: [
        { id: "stick", src: "s01/stick_stand_deadpan_v01", x: 220, y: 850, h: 300, enter: "FADE", state: "ALIVE" },
        { id: "dna", src: "s01/asset_dna_icon_v01", x: 1120, y: 520, h: 420, enter: "POP" },
        { id: "label", kind: "text", text: "ABCC11", x: 1120, y: 810, enter: "POP", delay: 0.2, props: { size: 96 } },
        { id: "x", src: "s00/prop_red_x", x: 1120, y: 520, w: 230, at: "stopped working", enter: "DRAW", z: 20 },
      ],
    },
    {
      id: "1.7",
      anchor: "Fresh sweat is almost",
      note: "anatomy canvas opens — plate only, no molecule/pump/bacteria",
      layers: [
        { id: "stick", src: "s01/stick_stand_deadpan_v01", ...ANATOMY.stick, enter: "FADE", state: "ALIVE" },
        {
          id: "bw",
          kind: "bodyWindow",
          x: ANATOMY.window.x,
          y: ANATOMY.window.y,
          w: ANATOMY.window.w,
          h: ANATOMY.window.h,
          enter: "POP",
          props: { plate: "s01/asset_skin_cutaway_plate_v01", plateScale: 0.92 },
        },
      ],
    },
    {
      id: "1.8",
      anchor: "What the bacteria on your skin",
      note: "three molecule copies travel up the duct — same canvas",
      layers: [
        { id: "stick", src: "s01/stick_stand_deadpan_v01", ...ANATOMY.stick, enter: "NONE", state: "ALIVE" },
        {
          id: "bw",
          kind: "bodyWindow",
          x: ANATOMY.window.x,
          y: ANATOMY.window.y,
          w: ANATOMY.window.w,
          h: ANATOMY.window.h,
          enter: "NONE",
          props: { plate: "s01/asset_skin_cutaway_plate_v01", plateScale: 0.92 },
        },
        { id: "m1", src: "s01/asset_molecule_v01", x: 1290, y: 600, h: 74, at: "one specific molecule", enter: "POP", z: 20 },
        { id: "m2", src: "s01/asset_molecule_v01", x: 1290, y: 520, h: 74, at: "one specific molecule", delay: 0.25, enter: "POP", z: 20 },
        { id: "m3", src: "s01/asset_molecule_v01", x: 1290, y: 440, h: 74, at: "one specific molecule", delay: 0.5, enter: "POP", z: 20 },
      ],
    },
    {
      id: "1.9",
      anchor: "and A B C C eleven is the pump",
      note: "pump integrates into the duct",
      layers: [
        { id: "stick", src: "s01/stick_stand_deadpan_v01", ...ANATOMY.stick, enter: "NONE", state: "ALIVE" },
        {
          id: "bw",
          kind: "bodyWindow",
          x: ANATOMY.window.x,
          y: ANATOMY.window.y,
          w: ANATOMY.window.w,
          h: ANATOMY.window.h,
          enter: "NONE",
          props: { plate: "s01/asset_skin_cutaway_plate_v01", plateScale: 0.92 },
        },
        { id: "m1", src: "s01/asset_molecule_v01", x: 1290, y: 600, h: 74, enter: "NONE", z: 20 },
        { id: "m2", src: "s01/asset_molecule_v01", x: 1290, y: 520, h: 74, enter: "NONE", z: 20 },
        { id: "m3", src: "s01/asset_molecule_v01", x: 1290, y: 440, h: 74, enter: "NONE", z: 20 },
        { id: "pump", src: "s01/asset_pump_v01", x: 1470, y: 520, h: 150, enter: "POP", state: "ACTIVE", z: 25 },
        { id: "plabel", kind: "text", text: "ABCC11", x: 1470, y: 660, enter: "FADE", delay: 0.2, props: { size: 46, color: COLORS.teal } },
      ],
    },
    {
      id: "1.10",
      anchor: "Switch it off",
      note: "state change only — pump greys out",
      layers: [
        { id: "stick", src: "s01/stick_stand_deadpan_v01", ...ANATOMY.stick, enter: "NONE", state: "ALIVE" },
        {
          id: "bw",
          kind: "bodyWindow",
          x: ANATOMY.window.x,
          y: ANATOMY.window.y,
          w: ANATOMY.window.w,
          h: ANATOMY.window.h,
          enter: "NONE",
          props: { plate: "s01/asset_skin_cutaway_plate_v01", plateScale: 0.92 },
        },
        { id: "m1", src: "s01/asset_molecule_v01", x: 1290, y: 600, h: 74, enter: "NONE", z: 20 },
        { id: "m2", src: "s01/asset_molecule_v01", x: 1290, y: 520, h: 74, enter: "NONE", opacity: 0.65, z: 20 },
        { id: "m3", src: "s01/asset_molecule_v01", x: 1290, y: 440, h: 74, enter: "NONE", opacity: 0.3, z: 20 },
        { id: "pump", src: "s01/asset_pump_v01", x: 1470, y: 520, h: 150, enter: "NONE", opacity: 0.45, z: 25 },
        { id: "px", src: "s00/prop_red_x", x: 1470, y: 520, w: 120, enter: "DRAW", z: 30 },
      ],
    },
    {
      id: "1.11",
      anchor: "and that molecule never reaches",
      note: "dead end below the skin surface",
      layers: [
        { id: "stick", src: "s01/stick_stand_deadpan_v01", ...ANATOMY.stick, enter: "NONE", state: "ALIVE" },
        {
          id: "bw",
          kind: "bodyWindow",
          x: ANATOMY.window.x,
          y: ANATOMY.window.y,
          w: ANATOMY.window.w,
          h: ANATOMY.window.h,
          enter: "NONE",
          props: { plate: "s01/asset_skin_cutaway_plate_v01", plateScale: 0.92 },
        },
        { id: "m1", src: "s01/asset_molecule_v01", x: 1290, y: 620, h: 74, enter: "NONE", z: 20 },
        { id: "m2", src: "s01/asset_molecule_v01", x: 1290, y: 555, h: 74, enter: "NONE", opacity: 0.65, z: 20 },
        { id: "m3", src: "s01/asset_molecule_v01", x: 1290, y: 495, h: 74, enter: "NONE", opacity: 0.3, z: 20 },
        { id: "pump", src: "s01/asset_pump_v01", x: 1470, y: 520, h: 150, enter: "NONE", opacity: 0.45, z: 25 },
        { id: "px", src: "s00/prop_red_x", x: 1470, y: 520, w: 120, enter: "NONE", z: 30 },
      ],
    },
    {
      id: "1.12",
      anchor: "The bacteria show up",
      note: "GAG — pattern interrupt; bacteria arrive, stop, retreat",
      layers: [
        { id: "kitchen", src: "s01/asset_empty_kitchen_plate_v01", x: 1120, y: 540, w: 780, enter: "POP" },
        { id: "b1", src: "s01/asset_bacterium_v01", x: 120, y: 720, h: 110, enter: "FADE", delay: 0.35, state: "ALIVE", props: { toX: 620, travel: 1.1 } },
        { id: "b2", src: "s01/asset_bacterium_v01", x: 30, y: 790, h: 100, enter: "FADE", delay: 0.55, state: "ALIVE", props: { toX: 470, travel: 1.1 } },
        { id: "b3", src: "s01/asset_bacterium_v01", x: -60, y: 700, h: 92, enter: "FADE", delay: 0.75, state: "ALIVE", props: { toX: 330, travel: 1.1 } },
      ],
    },
    {
      id: "1.13",
      anchor: "Around eighty to ninety percent",
      note: "BEAT A giant stat, BEAT B map",
      layers: [
        { id: "stat", kind: "number", text: "80–90%", x: 960, y: 520, enter: "POP", until: 1.4, props: { size: 300 } },
        { id: "map", src: "s01/asset_east_asia_map_v01", x: 770, y: 590, w: 980, enter: "FADE", delay: 1.05 },
        { id: "stat2", kind: "text", text: "80–90%", x: 1500, y: 400, enter: "POP", delay: 1.45, props: { size: 130 } },
        { id: "note", kind: "text", text: "EAST ASIAN ANCESTRY", x: 1500, y: 520, enter: "FADE", delay: 1.7, props: { size: 40, color: COLORS.grey } },
      ],
    },
    {
      id: "1.14",
      anchor: "But here's the part",
      note: "back from population statistic to YOU",
      layers: [
        { id: "stick", src: "s01/stick_point_ear_v01", x: 700, y: 640, h: 700, enter: "POP", state: "ALIVE" },
      ],
    },
    {
      id: "1.15",
      anchor: "The same switch decides",
      note: "dry vs wet comparison at equal size",
      layers: [
        { id: "stick", src: "s01/stick_point_ear_v01", x: 430, y: 700, h: 560, enter: "NONE", state: "ALIVE" },
        { id: "dry", src: "s01/asset_earwax_dry_v01", x: 1110, y: 580, w: 260, at: "dry and flaky", enter: "POP" },
        { id: "dryl", kind: "text", text: "DRY", x: 1110, y: 800, at: "dry and flaky", enter: "FADE", props: { size: 62 } },
        { id: "wet", src: "s01/asset_earwax_wet_v01", x: 1510, y: 580, w: 260, at: "wet and sticky", enter: "POP" },
        { id: "wetl", kind: "text", text: "WET", x: 1510, y: 800, at: "wet and sticky", enter: "FADE", props: { size: 62, color: COLORS.grey } },
      ],
    },
    {
      id: "1.16",
      anchor: "That's a clue, not a test",
      note: "clean card reset — intentional visual silence",
      layers: [
        { id: "card", kind: "card", text: "CLUE ≠ TEST", x: 960, y: 540, w: 950, h: 420, enter: "POP", props: { variant: "fineprint" } },
      ],
    },
    {
      id: "1.17",
      anchor: "And nobody has found",
      note: "NO BILL — card turns into a question",
      layers: [
        { id: "card", kind: "card", text: "?", x: 960, y: 540, w: 950, h: 420, enter: "NONE", props: { variant: "open", size: 170, color: COLORS.grey } },
        { id: "stick", src: "s01/stick_confused_small_v01", x: 280, y: 830, h: 320, enter: "FADE", state: "ALIVE" },
      ],
    },
    {
      id: "1.18",
      anchor: "Keep that in mind",
      push: 5,
      note: "hold — no new icon, deliberate processing pause",
      layers: [
        { id: "card", kind: "card", text: "?", x: 960, y: 540, w: 950, h: 420, enter: "NONE", props: { variant: "open", size: 170, color: COLORS.grey } },
        { id: "stick", src: "s01/stick_confused_small_v01", x: 280, y: 830, h: 320, enter: "NONE", state: "ALIVE" },
      ],
    },
    {
      id: "1.19",
      anchor: "So next time you forget",
      note: "callback — sniff test",
      layers: [
        { id: "stick", src: "s01/stick_sniff_test_v01", x: 900, y: 640, h: 700, enter: "POP", state: "ALIVE" },
        { id: "deo", src: "s01/asset_deodorant_v01", x: 1560, y: 330, h: 220, at: "forget deodorant", enter: "POP" },
        { id: "q", kind: "text", text: "?", x: 1700, y: 300, at: "run the sniff test", enter: "POP", props: { size: 90, color: COLORS.grey } },
      ],
    },
    {
      id: "1.T",
      note: "progress — win_1 stays open from here on",
      hold: 2.0,
      layers: [
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 520,
          enter: "FADE",
          props: {
            open: [1],
            lit: [],
            pulse: 2,
            icons: { 1: "s01/asset_deodorant_v01" },
          },
        },
        { id: "done", kind: "text", text: "1 / 7", x: 960, y: 760, enter: "FADE", delay: 0.4, props: { size: 54, color: COLORS.grey } },
      ],
    },
  ],
};
