import { COLORS } from "../theme";
import type { SectionTimeline } from "../types";

/**
 * SECTION 06 — THE ONE MOST OF US ALREADY BROKE (CASP12)
 * 6.4–6.7 share one bloodstream canvas.
 * 6.16–6.18 keep the frame visibly unfinished: the video refuses to invent a cost.
 */
const BLOOD = {
  stick: { x: 500, y: 700, h: 620 },
  window: { x: 1280, y: 540, w: 700, h: 380 },
};
const BACT = [
  [1120, 520],
  [1240, 570],
  [1360, 510],
  [1480, 565],
  [1170, 600],
  [1300, 470],
  [1430, 610],
  [1520, 500],
  [1080, 570],
  [1250, 640],
  [1400, 545],
  [1540, 590],
];

const bacteria = (count: number, enter: "POP" | "NONE") =>
  BACT.slice(0, count).map(([x, y], i) => ({
    id: `b${i}`,
    src: "s06/asset_bacterium_v01",
    x,
    y,
    h: 60,
    enter,
    delay: enter === "POP" ? 0.05 * i : undefined,
    state: "ALIVE" as const,
    z: 20,
  }));

export const s06: SectionTimeline = {
  id: "S06 · ALREADY BROKE",
  title: "The one most of us already broke",
  audio: "biy/audio/s06.mp3",
  captions: "biy/captions/s06.json",
  shots: [
    {
      id: "6.1",
      anchor: "And one more",
      layers: [
        { id: "stick", src: "s06/stick_stand_deadpan_v01", x: 960, y: 640, h: 560, enter: "POP", state: "ALIVE" },
        { id: "title", kind: "text", text: "THE ONE MOST OF US ALREADY BROKE", x: 960, y: 190, enter: "POP", delay: 0.2, props: { size: 66 } },
      ],
    },
    {
      id: "6.2",
      anchor: "There's a gene called",
      note: "grid duplicated by the editor; majority greyed",
      layers: [
        {
          id: "grid",
          kind: "grid",
          src: "s06/stick_stand_deadpan_v01",
          x: 960,
          y: 560,
          enter: "POP",
          props: { cols: 7, rows: 3, cell: 165, dim: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] },
        },
        { id: "label", kind: "text", text: "CASP12", x: 960, y: 170, enter: "POP", props: { size: 100 } },
      ],
    },
    {
      id: "6.3",
      anchor: "The broken version isn't the exception",
      note: "attention hierarchy inverts — the majority becomes the subject",
      layers: [
        {
          id: "grid",
          kind: "grid",
          src: "s06/stick_stand_deadpan_v01",
          x: 960,
          y: 560,
          enter: "NONE",
          props: { cols: 7, rows: 3, cell: 165, dim: [19, 20], dimOpacity: 0.3 },
        },
        { id: "label", kind: "text", text: "CASP12", x: 960, y: 170, enter: "NONE", props: { size: 100 }, opacity: 0.5 },
        { id: "def", kind: "text", text: "DEFAULT", x: 960, y: 980, enter: "POP", at: "It's the default", props: { size: 76, color: COLORS.teal } },
      ],
    },
    {
      id: "6.4",
      anchor: "When bacteria get into your bloodstream",
      note: "bloodstream canvas — persists to 6.7",
      layers: [
        { id: "stick", src: "s06/stick_stand_deadpan_v01", ...BLOOD.stick, enter: "FADE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: BLOOD.window.x, y: BLOOD.window.y, w: BLOOD.window.w, h: BLOOD.window.h, enter: "POP", props: { plate: "s06/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...bacteria(4, "POP"),
      ],
    },
    {
      id: "6.5",
      anchor: "your immune system raises an alarm",
      layers: [
        { id: "stick", src: "s06/stick_stand_deadpan_v01", ...BLOOD.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: BLOOD.window.x, y: BLOOD.window.y, w: BLOOD.window.w, h: BLOOD.window.h, enter: "NONE", props: { plate: "s06/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...bacteria(4, "NONE"),
        { id: "bell", src: "s06/asset_alarm_bell_v01", x: 1480, y: 230, h: 190, enter: "POP", state: "ACTIVE", z: 25 },
        { id: "waves", kind: "warning", x: 1480, y: 230, w: 260, enter: "POP", delay: 0.2, z: 15 },
      ],
    },
    {
      id: "6.6",
      anchor: "Working Casp twelve turns that alarm down",
      layers: [
        { id: "stick", src: "s06/stick_stand_deadpan_v01", ...BLOOD.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: BLOOD.window.x, y: BLOOD.window.y, w: BLOOD.window.w, h: BLOOD.window.h, enter: "NONE", props: { plate: "s06/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...bacteria(4, "NONE"),
        { id: "bell", src: "s06/asset_alarm_bell_v01", x: 1480, y: 230, h: 190, enter: "NONE", opacity: 0.45, z: 25 },
        { id: "knob", src: "s06/asset_volume_knob_v01", x: 1640, y: 580, h: 180, enter: "POP", state: "ACTIVE", rotate: -30, z: 25 },
        { id: "klabel", kind: "text", text: "CASP12", x: 1640, y: 710, enter: "FADE", delay: 0.3, props: { size: 42, color: COLORS.grey } },
      ],
    },
    {
      id: "6.7",
      anchor: "Which sounds useful",
      note: "bacteria multiply 4 -> 12 while the alarm stays low",
      layers: [
        { id: "stick", src: "s06/stick_stand_deadpan_v01", ...BLOOD.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: BLOOD.window.x, y: BLOOD.window.y, w: BLOOD.window.w, h: BLOOD.window.h, enter: "NONE", props: { plate: "s06/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...bacteria(12, "POP"),
        { id: "knob", src: "s06/asset_volume_knob_v01", x: 1640, y: 580, h: 180, enter: "NONE", rotate: -30, z: 25 },
      ],
    },
    {
      id: "6.8",
      anchor: "A study in Nature compared",
      note: "chip stays blank. SCIENCE GATE: CASP12-NATURE-STUDY",
      layers: [
        { id: "bw", kind: "bodyWindow", x: BLOOD.window.x, y: BLOOD.window.y, w: BLOOD.window.w, h: BLOOD.window.h, enter: "NONE", opacity: 0.3, props: { plate: "s06/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        { id: "chip", kind: "card", text: "EVIDENCE\nPENDING", x: 800, y: 620, w: 660, h: 240, enter: "POP", props: { variant: "open", size: 48, color: COLORS.grey } },
      ],
    },
    {
      id: "6.9",
      anchor: "The working version came with a blunted",
      note: "CODE comparison, equal visual weight",
      layers: [
        {
          id: "cols",
          kind: "columns",
          x: 960,
          y: 540,
          w: 1500,
          h: 560,
          enter: "POP",
          props: { left: { alarm: 1, count: 2 }, right: { alarm: 0.25, count: 2 }, item: "s06/asset_bacterium_v01" },
        },
      ],
    },
    {
      id: "6.10",
      anchor: "and a higher risk of being overwhelmed",
      layers: [
        {
          id: "cols",
          kind: "columns",
          x: 960,
          y: 540,
          w: 1500,
          h: 560,
          enter: "NONE",
          props: { left: { alarm: 1, count: 2 }, right: { alarm: 0.25, count: 10 }, item: "s06/asset_bacterium_v01" },
        },
      ],
    },
    {
      id: "6.11",
      anchor: "Somewhere along the line",
      note: "GAG — knob detaches and rolls",
      layers: [
        { id: "panel", src: "s06/asset_control_panel_v01", x: 1100, y: 500, h: 420, enter: "POP" },
        { id: "knob", src: "s06/asset_volume_knob_v01", x: 1100, y: 780, h: 170, enter: "POP", delay: 0.4, z: 20, props: { toX: 1400, travel: 1.2 } },
      ],
    },
    {
      id: "6.12",
      anchor: "And the people whose alarm got louder",
      layers: [
        { id: "panel", src: "s06/asset_control_panel_v01", x: 1100, y: 500, h: 420, enter: "NONE", opacity: 0.6 },
        { id: "knob", src: "s06/asset_volume_knob_v01", x: 1400, y: 780, h: 170, enter: "NONE", opacity: 0.6, z: 20 },
        { id: "bell", src: "s06/asset_alarm_bell_v01", x: 620, y: 480, h: 260, enter: "POP", state: "ACTIVE" },
        { id: "waves", kind: "warning", x: 620, y: 480, w: 380, enter: "POP", delay: 0.2, z: 15 },
        { id: "check", src: "s00/prop_green_check", x: 760, y: 590, w: 150, enter: "POP", delay: 0.5, z: 25 },
      ],
    },
    {
      id: "6.13",
      anchor: "Today the broken version is close to universal",
      note: "map base; overlay only from the ledger",
      layers: [
        { id: "map", src: "s06/asset_world_map_v01", x: 960, y: 520, w: 1500, enter: "FADE" },
      ],
    },
    {
      id: "6.14",
      anchor: "The working copy survives mainly",
      layers: [
        { id: "map", src: "s06/asset_world_map_v01", x: 960, y: 520, w: 1500, enter: "NONE" },
        { id: "africa", src: "s06/asset_africa_lowfreq_overlay_v01", x: 1010, y: 620, w: 260, enter: "FADE", opacity: 0.85, z: 20 },
      ],
    },
    {
      id: "6.15",
      anchor: "A reminder that the version we call normal",
      push: 4,
      layers: [
        { id: "map", src: "s06/asset_world_map_v01", x: 960, y: 520, w: 1500, enter: "NONE", opacity: 0.55 },
        { id: "africa", src: "s06/asset_africa_lowfreq_overlay_v01", x: 1010, y: 620, w: 260, enter: "NONE", opacity: 0.6, z: 20 },
        { id: "normal", kind: "text", text: "NORMAL", x: 960, y: 520, enter: "POP", props: { size: 150 }, z: 30 },
      ],
    },
    {
      id: "6.16",
      anchor: "Now, I could tell you",
      note: "frame deliberately stops at ~78% — do NOT auto-complete",
      layers: [
        { id: "frame", kind: "card", x: 960, y: 520, w: 1100, h: 420, enter: "NONE", props: { variant: "unfinished" } },
        { id: "stick", src: "s06/stick_skeptical_v01", x: 280, y: 850, h: 300, enter: "FADE", delay: 0.15, state: "ALIVE" },
      ],
    },
    {
      id: "6.17",
      anchor: "but the study I just described",
      layers: [
        { id: "frame", kind: "card", x: 960, y: 520, w: 1100, h: 420, enter: "NONE", props: { variant: "unfinished" } },
        { id: "stick", src: "s06/stick_skeptical_v01", x: 280, y: 850, h: 300, enter: "NONE", state: "ALIVE" },
      ],
    },
    {
      id: "6.18",
      anchor: "it didn't hand us a tidy bill",
      note: "unfinished frame dissolves into an Open Question — no X, no check",
      layers: [
        { id: "open", kind: "card", text: "OPEN QUESTION", x: 960, y: 520, w: 1100, h: 420, enter: "FADE", props: { variant: "open", size: 70, color: COLORS.grey } },
      ],
    },
    {
      id: "6.19",
      anchor: "and I'm not going to invent one",
      note: "direct to viewer — white screen, no props, longer hold",
      layers: [
        { id: "stick", src: "s06/stick_direct_viewer_v01", x: 960, y: 620, h: 720, enter: "POP" },
      ],
    },
    {
      id: "6.20",
      anchor: "So when we say broken gene",
      layers: [
        { id: "broken", kind: "text", text: "BROKEN", x: 960, y: 500, enter: "POP", props: { size: 240 } },
      ],
    },
    {
      id: "6.21",
      anchor: "for this one, you are the mutation",
      push: 5,
      layers: [
        { id: "broken", kind: "text", text: "BROKEN", x: 960, y: 380, enter: "NONE", props: { size: 240 } },
        { id: "arrow", kind: "tether", x: 960, y: 500, enter: "DRAW", delay: 0.2, z: 20, props: { dx: 0, dy: 180 } },
        { id: "stick", src: "s06/stick_blank_disbelief_v01", x: 960, y: 830, h: 380, enter: "POP", delay: 0.4, state: "ALIVE" },
      ],
    },
    {
      id: "6.B",
      anchor: "Every trade so far has had a price",
      note: "bridge into item 7",
      layers: [
        { id: "stick", src: "s06/stick_stand_deadpan_v01", x: 960, y: 640, h: 560, enter: "FADE", state: "ALIVE" },
      ],
    },
    {
      id: "6.T",
      hold: 2.0,
      layers: [
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 520,
          enter: "FADE",
          props: {
            open: [1, 2, 3, 4, 5, 6],
            lit: [],
            pulse: 7,
            icons: {
              1: "s01/asset_deodorant_v01",
              2: "s02/asset_brake_pedal_v01",
              3: "s03/asset_door_no_handle_v01",
              4: "s04/asset_orange_v01",
              5: "s05/asset_human_skull_profile_v01",
              6: "s06/asset_volume_knob_v01",
            },
          },
        },
        { id: "done", kind: "text", text: "6 / 7", x: 960, y: 760, enter: "FADE", delay: 0.4, props: { size: 54, color: COLORS.grey } },
      ],
    },
  ],
};
