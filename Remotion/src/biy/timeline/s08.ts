import { COLORS } from "../theme";
import type { SectionTimeline } from "../types";

/**
 * SECTION 08 — CLOSE
 * Adds no new factual claim. C.3 reuses the seven established item icons.
 * C.5 keeps the right half clear for the YouTube end screen (x 1120–1810, y 250–850).
 */
const ITEM_ICONS = [
  "s01/asset_deodorant_v01",
  "s02/asset_brake_pedal_v01",
  "s03/asset_door_no_handle_v01",
  "s04/asset_orange_v01",
  "s05/asset_human_skull_profile_v01",
  "s06/asset_volume_knob_v01",
  "s07/asset_rbc_healthy_v01",
];
const TOP = [420, 780, 1140, 1500];
const BOTTOM = [600, 960, 1320];

export const s08: SectionTimeline = {
  id: "S08 · CLOSE",
  title: "Close",
  audio: "biy/audio/s08.mp3",
  captions: "biy/captions/s08.json",
  shots: [
    {
      id: "C.1",
      anchor: "So maybe broken is the wrong word",
      note: "single-focal; the strike lands on 'wrong word'",
      layers: [
        { id: "broken", kind: "text", text: "BROKEN", x: 960, y: 520, enter: "POP", props: { size: 260 } },
        { id: "strike", kind: "strike", x: 960, y: 520, w: 1000, enter: "DRAW", at: "the wrong word", z: 20 },
      ],
    },
    {
      id: "C.2",
      anchor: "There's no perfect version of you",
      note: "drawer must stay visibly empty — no label, no silhouette",
      layers: [
        { id: "drawer", src: "s08/asset_open_empty_drawer_v01", x: 1220, y: 610, h: 520, enter: "SLIDE" },
        { id: "stick", src: "s08/stick_stand_deadpan_v01", x: 420, y: 720, h: 500, enter: "FADE", delay: 0.2, state: "ALIVE" },
      ],
    },
    {
      id: "C.3",
      anchor: "There are only trades",
      note: "seven completed items, neutral treatment (no invented cost/benefit split)",
      layers: [
        ...ITEM_ICONS.map((src, i) => ({
          id: `item${i}`,
          src,
          x: i < 4 ? TOP[i] : BOTTOM[i - 4],
          y: i < 4 ? 420 : 720,
          h: 215,
          enter: "POP" as const,
          delay: 0.06 * i,
        })),
      ],
    },
    {
      id: "C.4",
      anchor: "Your body isn't optimized",
      note: "cleanest frame in the video — icons recede, thesis in two beats",
      layers: [
        ...ITEM_ICONS.map((src, i) => ({
          id: `item${i}`,
          src,
          x: i < 4 ? TOP[i] : BOTTOM[i - 4],
          y: i < 4 ? 300 : 840,
          h: 150,
          enter: "NONE" as const,
          opacity: 0.18,
        })),
        { id: "l1", kind: "text", text: "YOUR BODY ISN'T OPTIMIZED.", x: 960, y: 500, enter: "POP", props: { size: 92 } },
        { id: "l2", kind: "text", text: "IT'S NEGOTIATED.", x: 960, y: 640, enter: "POP", at: "It's negotiated", props: { size: 110, color: COLORS.teal } },
      ],
    },
    {
      id: "C.5",
      anchor: "Next time",
      note: "end screen — keep x >= 1050 clear, pointer aims at the card zone",
      layers: [
        { id: "stick", src: "s08/stick_point_right_awkward_v01", x: 520, y: 700, h: 600, enter: "POP", state: "ALIVE" },
        { id: "next", kind: "text", text: "NEXT", x: 520, y: 260, enter: "FADE", delay: 0.4, props: { size: 64, color: COLORS.grey } },
      ],
    },
    {
      id: "C.T",
      hold: 1.2,
      note: "hard end — no extra gag, do not reopen the progress windows",
      layers: [
        { id: "stick", src: "s08/stick_point_right_awkward_v01", x: 520, y: 700, h: 600, enter: "NONE", state: "ALIVE" },
      ],
    },
  ],
};
