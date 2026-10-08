import { COLORS } from "../theme";
import type { SectionTimeline } from "../types";

/**
 * SECTION 04 — THE VITAMIN YOU CAN'T MAKE (GULO)
 * 4.6–4.10 share one liver/pathway canvas.
 * 4.11 grid is editor duplication of one approved pose — never a generated crowd.
 */
const PATH = {
  stick: { x: 470, y: 700, h: 620 },
  window: { x: 610, y: 660, w: 380, h: 320 },
  plate: { x: 1300, y: 540, w: 900 },
};
const NODES = [1000, 1195, 1400, 1600];

export const s04: SectionTimeline = {
  id: "S04 · THE VITAMIN",
  title: "The vitamin you can't make",
  audio: "biy/audio/s04.mp3",
  captions: "biy/captions/s04.json",
  shots: [
    {
      id: "4.1",
      anchor: "Now it gets stranger",
      push: 4,
      layers: [
        { id: "stick", src: "s04/stick_skeptical_v01", x: 960, y: 640, h: 620, enter: "POP", state: "ALIVE" },
        { id: "title", kind: "text", text: "THE VITAMIN YOU CAN'T MAKE", x: 960, y: 200, enter: "POP", delay: 0.2, props: { size: 78 } },
      ],
    },
    {
      id: "4.2",
      anchor: "A dog has never eaten",
      layers: [
        { id: "dog", src: "s04/asset_dog_v01", x: 1150, y: 600, h: 330, enter: "POP" },
        { id: "orange", src: "s04/asset_orange_v01", x: 700, y: 760, h: 200, enter: "POP", at: "eaten an orange", z: 20 },
        { id: "x", src: "s00/prop_red_x", x: 700, y: 760, w: 200, enter: "DRAW", at: "never had scurvy", z: 25 },
        { id: "stick", src: "s04/stick_skeptical_v01", x: 260, y: 820, h: 300, enter: "FADE", state: "ALIVE" },
      ],
    },
    {
      id: "4.3",
      anchor: "Neither has a cat",
      note: "animals are independent props, never a re-rendered frame",
      layers: [
        { id: "dog", src: "s04/asset_dog_v01", x: 420, y: 600, h: 230, enter: "NONE" },
        { id: "cat", src: "s04/asset_cat_v01", x: 800, y: 610, h: 190, enter: "POP", at: "a cat" },
        { id: "cow", src: "s04/asset_cow_v01", x: 1190, y: 600, h: 220, enter: "POP", at: "a cow" },
        { id: "rat", src: "s04/asset_rat_v01", x: 1580, y: 630, h: 130, enter: "POP", at: "a rat" },
      ],
    },
    {
      id: "4.4",
      anchor: "They make their own vitamin C",
      note: "same liver icon overlaid on each animal, one after another",
      layers: [
        { id: "dog", src: "s04/asset_dog_v01", x: 420, y: 600, h: 230, enter: "NONE" },
        { id: "cat", src: "s04/asset_cat_v01", x: 800, y: 610, h: 190, enter: "NONE" },
        { id: "cow", src: "s04/asset_cow_v01", x: 1190, y: 600, h: 220, enter: "NONE" },
        { id: "rat", src: "s04/asset_rat_v01", x: 1580, y: 630, h: 130, enter: "NONE" },
        { id: "l1", src: "s04/asset_liver_v01", x: 420, y: 595, h: 85, enter: "POP", state: "ACTIVE", z: 20 },
        { id: "l2", src: "s04/asset_liver_v01", x: 800, y: 605, h: 72, enter: "POP", delay: 0.25, state: "ACTIVE", z: 20 },
        { id: "l3", src: "s04/asset_liver_v01", x: 1190, y: 595, h: 82, enter: "POP", delay: 0.5, state: "ACTIVE", z: 20 },
        { id: "l4", src: "s04/asset_liver_v01", x: 1580, y: 625, h: 58, enter: "POP", delay: 0.75, state: "ACTIVE", z: 20 },
      ],
    },
    {
      id: "4.5",
      anchor: "You can't",
      note: "single-focal personal beat",
      layers: [
        { id: "stick", src: "s04/stick_blank_disbelief_v01", x: 960, y: 620, h: 700, enter: "POP", state: "ALIVE" },
      ],
    },
    {
      id: "4.6",
      anchor: "The assembly line runs four steps",
      note: "pathway canvas opens — persists to 4.10",
      layers: [
        { id: "four", kind: "number", text: "4", x: 960, y: 500, enter: "POP", until: 0.9, props: { size: 400 } },
        { id: "stick", src: "s04/stick_skeptical_v01", ...PATH.stick, enter: "FADE", delay: 0.7, state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: PATH.window.x, y: PATH.window.y, w: PATH.window.w, h: PATH.window.h, enter: "POP", delay: 0.75, props: { plate: "s04/asset_liver_v01", plateScale: 0.7 } },
        { id: "plate", src: "s04/asset_four_step_plate_v01", x: PATH.plate.x, y: PATH.plate.y, w: PATH.plate.w, enter: "SLIDE", delay: 1.0 },
      ],
    },
    {
      id: "4.7",
      anchor: "You have the first three",
      layers: [
        { id: "stick", src: "s04/stick_skeptical_v01", ...PATH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: PATH.window.x, y: PATH.window.y, w: PATH.window.w, h: PATH.window.h, enter: "NONE", props: { plate: "s04/asset_liver_v01", plateScale: 0.7 } },
        { id: "plate", src: "s04/asset_four_step_plate_v01", x: PATH.plate.x, y: PATH.plate.y, w: PATH.plate.w, enter: "NONE" },
        ...[0, 1, 2].map((i) => ({
          id: `enz${i}`,
          src: "s04/asset_enzyme_v01",
          x: NODES[i],
          y: 540,
          h: 96,
          enter: "POP" as const,
          delay: 0.2 * i,
          z: 20,
        })),
      ],
    },
    {
      id: "4.8",
      anchor: "The fourth enzyme is built",
      layers: [
        { id: "stick", src: "s04/stick_skeptical_v01", ...PATH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: PATH.window.x, y: PATH.window.y, w: PATH.window.w, h: PATH.window.h, enter: "NONE", props: { plate: "s04/asset_liver_v01", plateScale: 0.7 } },
        { id: "plate", src: "s04/asset_four_step_plate_v01", x: PATH.plate.x, y: PATH.plate.y, w: PATH.plate.w, enter: "NONE" },
        ...[0, 1, 2].map((i) => ({
          id: `enz${i}`,
          src: "s04/asset_enzyme_v01",
          x: NODES[i],
          y: 540,
          h: 96,
          enter: "NONE" as const,
          z: 20,
        })),
        { id: "label", kind: "text", text: "GULO", x: NODES[3], y: 320, enter: "POP", at: "a gene called", props: { size: 90 } },
        { id: "ring", kind: "ring", x: NODES[3], y: 540, w: 190, enter: "DRAW", at: "a gene called", delay: 0.2, opacity: 0.85, z: 15 },
      ],
    },
    {
      id: "4.9",
      anchor: "And in humans it isn't switched off",
      note: "wrecked, not switched off — fragments, not a grey enzyme, no red X",
      layers: [
        { id: "stick", src: "s04/stick_blank_disbelief_v01", ...PATH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: PATH.window.x, y: PATH.window.y, w: PATH.window.w, h: PATH.window.h, enter: "NONE", props: { plate: "s04/asset_liver_v01", plateScale: 0.7 } },
        { id: "plate", src: "s04/asset_four_step_plate_v01", x: PATH.plate.x, y: PATH.plate.y, w: PATH.plate.w, enter: "NONE" },
        ...[0, 1, 2].map((i) => ({
          id: `enz${i}`,
          src: "s04/asset_enzyme_v01",
          x: NODES[i],
          y: 540,
          h: 96,
          enter: "NONE" as const,
          z: 20,
        })),
        { id: "frag", src: "s04/asset_broken_enzyme_fragments_v01", x: NODES[3], y: 540, h: 120, enter: "POP", at: "It's wrecked", state: "ACTIVE", z: 25 },
        { id: "label", kind: "text", text: "GULO", x: NODES[3], y: 320, enter: "NONE", props: { size: 90 } },
      ],
    },
    {
      id: "4.10",
      anchor: "A pile of broken fragments",
      push: 4,
      note: "deep-time hold; no dates on screen until the source passes",
      layers: [
        { id: "stick", src: "s04/stick_blank_disbelief_v01", ...PATH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: PATH.window.x, y: PATH.window.y, w: PATH.window.w, h: PATH.window.h, enter: "NONE", props: { plate: "s04/asset_liver_v01", plateScale: 0.7 } },
        { id: "plate", src: "s04/asset_four_step_plate_v01", x: PATH.plate.x, y: PATH.plate.y, w: PATH.plate.w, enter: "NONE" },
        ...[0, 1, 2].map((i) => ({
          id: `enz${i}`,
          src: "s04/asset_enzyme_v01",
          x: NODES[i],
          y: 540,
          h: 96,
          enter: "NONE" as const,
          z: 20,
        })),
        { id: "frag", src: "s04/asset_broken_enzyme_fragments_v01", x: NODES[3], y: 540, h: 120, enter: "NONE", z: 25 },
      ],
    },
    {
      id: "4.11",
      anchor: "Not most people",
      note: "4x7 grid built by duplicating ONE approved pose",
      layers: [
        {
          id: "grid",
          kind: "grid",
          src: "s04/stick_skeptical_v01",
          x: 960,
          y: 520,
          enter: "POP",
          props: { cols: 7, rows: 3, cell: 170 },
        },
      ],
    },
    {
      id: "4.12",
      anchor: "Every chimpanzee",
      layers: [
        { id: "grid", kind: "grid", src: "s04/stick_skeptical_v01", x: 960, y: 420, enter: "NONE", opacity: 0.85, props: { cols: 7, rows: 3, cell: 140 } },
        { id: "chimp", src: "s04/asset_chimp_silhouette_v01", x: 620, y: 850, h: 260, enter: "POP", at: "Every chimpanzee" },
        { id: "gorilla", src: "s04/asset_gorilla_silhouette_v01", x: 960, y: 850, h: 280, enter: "POP", at: "gorilla" },
        { id: "orangutan", src: "s04/asset_orangutan_silhouette_v01", x: 1300, y: 850, h: 270, enter: "POP", at: "orangutan too" },
      ],
    },
    {
      id: "4.13",
      anchor: "Whatever happened, happened",
      note: "branches converge on one root; no dates",
      layers: [
        { id: "grid", kind: "grid", src: "s04/stick_skeptical_v01", x: 960, y: 380, enter: "NONE", opacity: 0.35, props: { cols: 7, rows: 2, cell: 120 } },
        { id: "chimp", src: "s04/asset_chimp_silhouette_v01", x: 620, y: 640, h: 200, enter: "NONE", opacity: 0.35 },
        { id: "gorilla", src: "s04/asset_gorilla_silhouette_v01", x: 960, y: 640, h: 210, enter: "NONE", opacity: 0.35 },
        { id: "orangutan", src: "s04/asset_orangutan_silhouette_v01", x: 1300, y: 640, h: 200, enter: "NONE", opacity: 0.35 },
        { id: "t1", kind: "tether", x: 620, y: 740, enter: "DRAW", z: 20, props: { dx: 340, dy: 200 } },
        { id: "t2", kind: "tether", x: 960, y: 740, enter: "DRAW", z: 20, props: { dx: 0, dy: 200 } },
        { id: "t3", kind: "tether", x: 1300, y: 740, enter: "DRAW", z: 20, props: { dx: -340, dy: 200 } },
        { id: "root", kind: "dot", x: 960, y: 940, w: 40, enter: "POP", delay: 0.5, z: 25 },
      ],
    },
    {
      id: "4.14",
      anchor: "And the bill for this one",
      layers: [
        { id: "card", kind: "card", text: "FINE PRINT", x: 960, y: 520, w: 1100, h: 420, enter: "POP", props: { variant: "fineprint" } },
      ],
    },
    {
      id: "4.15",
      anchor: "Take away fresh food",
      layers: [
        { id: "stick", src: "s04/stick_slumped_exhausted_v01", x: 960, y: 620, h: 700, enter: "POP", state: "ALIVE" },
      ],
    },
    {
      id: "4.16",
      anchor: "Bleeding gums",
      note: "exactly three muted marks — no wounds drawn",
      layers: [
        { id: "stick", src: "s04/stick_mild_pain_v01", x: 960, y: 620, h: 700, enter: "NONE", state: "ALIVE" },
        { id: "m1", kind: "card", x: 960, y: 430, w: 56, h: 26, enter: "FADE", opacity: 0.55, props: { variant: "flush" }, at: "Bleeding gums", z: 20 },
        { id: "m2", kind: "card", x: 1080, y: 640, w: 40, h: 40, enter: "FADE", opacity: 0.5, props: { variant: "flush" }, at: "wounds reopening", z: 20 },
        { id: "m3", kind: "card", x: 860, y: 760, w: 70, h: 24, enter: "FADE", opacity: 0.45, props: { variant: "flush" }, at: "old scars", z: 20 },
      ],
    },
    {
      id: "4.17",
      anchor: "Scurvy killed sailors",
      note: "history gag — barrel tips, oranges roll out, sailor recovers",
      layers: [
        { id: "ship", src: "s04/asset_sailing_ship_v01", x: 960, y: 560, w: 1150, enter: "SLIDE" },
        { id: "barrel", src: "s04/asset_wood_barrel_tipped_v01", x: 700, y: 700, h: 160, enter: "POP", delay: 0.5, z: 20 },
        { id: "o1", src: "s04/asset_orange_v01", x: 790, y: 745, h: 70, enter: "POP", delay: 0.7, z: 25, props: { toX: 900, travel: 1.0 } },
        { id: "o2", src: "s04/asset_orange_v01", x: 790, y: 760, h: 62, enter: "POP", delay: 0.85, z: 25, props: { toX: 990, travel: 1.1 } },
        { id: "o3", src: "s04/asset_orange_v01", x: 790, y: 735, h: 58, enter: "POP", delay: 1.0, z: 25, props: { toX: 1080, travel: 1.2 } },
        { id: "sailor", src: "s04/stick_sailor_recover_v01", x: 1230, y: 660, h: 240, enter: "FADE", delay: 1.2, state: "ALIVE", z: 25 },
      ],
    },
    {
      id: "4.18",
      anchor: "So was it an upgrade at all",
      layers: [
        { id: "card", kind: "card", text: "OPEN QUESTION", x: 960, y: 520, w: 1100, h: 400, enter: "POP", props: { variant: "open", size: 76, color: COLORS.grey } },
        { id: "stick", src: "s04/stick_skeptical_v01", x: 280, y: 850, h: 300, enter: "FADE", delay: 0.3, state: "ALIVE" },
      ],
    },
    {
      id: "4.19",
      anchor: "Our ancestors may simply have eaten",
      layers: [
        { id: "stick", src: "s04/stick_ancestor_neutral_v01", x: 560, y: 660, h: 640, enter: "POP", state: "ALIVE" },
        { id: "tree", src: "s04/asset_fruit_tree_v01", x: 1330, y: 580, h: 700, enter: "FADE", delay: 0.2 },
        { id: "o1", src: "s04/asset_orange_v01", x: 1230, y: 800, h: 80, enter: "POP", delay: 0.8, z: 20 },
        { id: "o2", src: "s04/asset_orange_v01", x: 1420, y: 840, h: 70, enter: "POP", delay: 1.0, z: 20 },
      ],
    },
    {
      id: "4.20",
      anchor: "And a gene that costs nothing",
      note: "the pathway fades out as a metaphor, not as molecular proof",
      layers: [
        { id: "stick", src: "s04/stick_ancestor_neutral_v01", x: 560, y: 660, h: 640, enter: "NONE", state: "ALIVE" },
        { id: "tree", src: "s04/asset_fruit_tree_v01", x: 1330, y: 580, h: 700, enter: "NONE" },
        { id: "inset", src: "s04/asset_four_step_plate_v01", x: 960, y: 890, w: 560, enter: "FADE", opacity: 0.4, z: 20 },
      ],
    },
    {
      id: "4.21",
      anchor: "Which makes this one different",
      note: "empty scale — not a trade",
      layers: [
        { id: "scale", kind: "scale", x: 960, y: 460, w: 760, enter: "POP", props: { tilt: 0.05 } },
      ],
    },
    {
      id: "4.22",
      anchor: "A loss we got away with",
      layers: [
        { id: "scale", kind: "scale", x: 760, y: 460, w: 620, enter: "NONE", opacity: 0.35, props: { tilt: 0.05 } },
        { id: "ship", src: "s04/asset_sailing_ship_v01", x: 1250, y: 620, w: 1000, enter: "SLIDE", at: "we got on boats" },
      ],
    },
    {
      id: "4.B",
      anchor: "We all lost that one",
      note: "bridge into item 5",
      layers: [
        { id: "stick", src: "s04/stick_blank_disbelief_v01", x: 960, y: 640, h: 620, enter: "POP", state: "ALIVE" },
      ],
    },
    {
      id: "4.T",
      hold: 2.0,
      layers: [
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 520,
          enter: "FADE",
          props: {
            open: [1, 2, 3, 4],
            lit: [],
            pulse: 5,
            icons: {
              1: "s01/asset_deodorant_v01",
              2: "s02/asset_brake_pedal_v01",
              3: "s03/asset_door_no_handle_v01",
              4: "s04/asset_orange_v01",
            },
          },
        },
        { id: "done", kind: "text", text: "4 / 7", x: 960, y: 760, enter: "FADE", delay: 0.4, props: { size: 54, color: COLORS.grey } },
      ],
    },
  ],
};
