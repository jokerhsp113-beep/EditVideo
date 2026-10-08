import { COLORS } from "../theme";
import type { SectionTimeline } from "../types";

/**
 * SECTION 05 — THE MUSCLE WE ALL GAVE UP (MYH16)
 * 5.4–5.9 keep one skull comparison geometry. The skull-expansion hypothesis is
 * always dashed/ghosted — never drawn as a causal fact.
 */
const SKULL = { chimpX: 600, humanX: 1330, y: 540, h: 560 };

export const s05: SectionTimeline = {
  id: "S05 · THE MUSCLE",
  title: "The muscle we all gave up",
  audio: "biy/audio/s05.mp3",
  captions: "biy/captions/s05.json",
  shots: [
    {
      id: "5.1",
      anchor: "The muscle we all gave up",
      layers: [
        { id: "title", kind: "text", text: "THE MUSCLE WE ALL GAVE UP", x: 960, y: 240, enter: "POP", props: { size: 86 } },
        { id: "stick", src: "s05/stick_touch_temples_v01", x: 960, y: 690, h: 520, enter: "FADE", delay: 0.3, state: "ALIVE" },
      ],
    },
    {
      id: "5.2",
      anchor: "Put your fingers on your temples",
      note: "genuine self-test — hold long enough for the viewer to do it",
      layers: [
        { id: "stick", src: "s05/stick_touch_temples_v01", x: 860, y: 620, h: 720, enter: "POP", state: "ALIVE" },
        { id: "card", kind: "card", text: "TRY IT", x: 1560, y: 300, w: 480, h: 190, enter: "POP", delay: 0.3, props: { variant: "fineprint", size: 72 } },
      ],
    },
    {
      id: "5.3",
      anchor: "Feel that move",
      layers: [
        { id: "stick", src: "s05/stick_touch_temples_realize_v01", x: 860, y: 620, h: 720, enter: "NONE", state: "ALIVE" },
        { id: "v1", kind: "warning", x: 700, y: 430, w: 150, enter: "POP", z: 20 },
        { id: "v2", kind: "warning", x: 1010, y: 430, w: 150, enter: "POP", z: 20 },
      ],
    },
    {
      id: "5.4",
      anchor: "In a chimpanzee",
      note: "anchor geometry for 5.4–5.9",
      layers: [
        { id: "chimp", src: "s05/asset_chimp_skull_profile_v01", x: SKULL.chimpX, y: SKULL.y, h: SKULL.h, enter: "POP" },
        { id: "tl", src: "s05/asset_temporalis_large_v01", x: SKULL.chimpX + 40, y: SKULL.y - 40, h: 210, enter: "FADE", delay: 0.3, state: "ACTIVE", opacity: 0.9, z: 20 },
      ],
    },
    {
      id: "5.5",
      anchor: "It runs up the side",
      layers: [
        { id: "chimp", src: "s05/asset_chimp_skull_profile_v01", x: SKULL.chimpX, y: SKULL.y, h: SKULL.h, enter: "NONE" },
        { id: "tl", src: "s05/asset_temporalis_large_v01", x: SKULL.chimpX + 40, y: SKULL.y - 40, h: 210, enter: "NONE", opacity: 0.9, z: 20 },
        { id: "trace", kind: "arrow", x: SKULL.chimpX - 90, y: SKULL.y - 190, w: 220, enter: "DRAW", rotate: -55, props: { color: COLORS.teal }, z: 25 },
      ],
    },
    {
      id: "5.6",
      anchor: "In you, it's a fraction",
      layers: [
        { id: "chimp", src: "s05/asset_chimp_skull_profile_v01", x: SKULL.chimpX, y: SKULL.y, h: SKULL.h, enter: "NONE" },
        { id: "tl", src: "s05/asset_temporalis_large_v01", x: SKULL.chimpX + 40, y: SKULL.y - 40, h: 210, enter: "NONE", opacity: 0.9, z: 20 },
        { id: "human", src: "s05/asset_human_skull_profile_v01", x: SKULL.humanX, y: SKULL.y, h: SKULL.h, enter: "POP" },
        { id: "ts", src: "s05/asset_temporalis_small_v01", x: SKULL.humanX + 10, y: SKULL.y - 20, h: 125, enter: "FADE", delay: 0.3, state: "ACTIVE", opacity: 0.9, z: 20 },
      ],
    },
    {
      id: "5.7",
      anchor: "One reason is a gene called",
      layers: [
        { id: "chimp", src: "s05/asset_chimp_skull_profile_v01", x: SKULL.chimpX, y: SKULL.y, h: SKULL.h, enter: "NONE" },
        { id: "tl", src: "s05/asset_temporalis_large_v01", x: SKULL.chimpX + 40, y: SKULL.y - 40, h: 210, enter: "NONE", opacity: 0.9, z: 20 },
        { id: "human", src: "s05/asset_human_skull_profile_v01", x: SKULL.humanX, y: SKULL.y, h: SKULL.h, enter: "NONE" },
        { id: "ts", src: "s05/asset_temporalis_small_v01", x: SKULL.humanX + 10, y: SKULL.y - 20, h: 125, enter: "NONE", opacity: 0.9, z: 20 },
        { id: "label", kind: "text", text: "MYH16", x: 960, y: 180, enter: "POP", props: { size: 100 } },
      ],
    },
    {
      id: "5.8",
      anchor: "In every other primate it works",
      layers: [
        { id: "chimp", src: "s05/asset_chimp_skull_profile_v01", x: SKULL.chimpX, y: SKULL.y, h: SKULL.h, enter: "NONE" },
        { id: "tl", src: "s05/asset_temporalis_large_v01", x: SKULL.chimpX + 40, y: SKULL.y - 40, h: 210, enter: "NONE", opacity: 0.9, z: 20 },
        { id: "human", src: "s05/asset_human_skull_profile_v01", x: SKULL.humanX, y: SKULL.y, h: SKULL.h, enter: "NONE", opacity: 0.6 },
        { id: "ts", src: "s05/asset_temporalis_small_v01", x: SKULL.humanX + 10, y: SKULL.y - 20, h: 125, enter: "NONE", opacity: 0.6, z: 20 },
        { id: "label", kind: "text", text: "MYH16", x: 960, y: 180, enter: "NONE", props: { size: 100 } },
        { id: "check", src: "s00/prop_green_check", x: SKULL.chimpX, y: 880, w: 160, enter: "POP", z: 25 },
      ],
    },
    {
      id: "5.9",
      anchor: "In every human being alive",
      note: "no nucleotide letters are ever drawn",
      layers: [
        { id: "chimp", src: "s05/asset_chimp_skull_profile_v01", x: SKULL.chimpX, y: SKULL.y, h: SKULL.h, enter: "NONE", opacity: 0.6 },
        { id: "tl", src: "s05/asset_temporalis_large_v01", x: SKULL.chimpX + 40, y: SKULL.y - 40, h: 210, enter: "NONE", opacity: 0.5, z: 20 },
        { id: "human", src: "s05/asset_human_skull_profile_v01", x: SKULL.humanX, y: SKULL.y, h: SKULL.h, enter: "NONE" },
        { id: "ts", src: "s05/asset_temporalis_small_v01", x: SKULL.humanX + 10, y: SKULL.y - 20, h: 125, enter: "NONE", opacity: 0.9, z: 20 },
        { id: "dna", src: "s05/asset_dna_missing_pair_v01", x: SKULL.humanX, y: 880, h: 260, enter: "POP", at: "two missing letters", z: 25 },
        { id: "x", src: "s00/prop_red_x", x: SKULL.humanX + 240, y: 880, w: 120, enter: "DRAW", at: "two missing letters", delay: 0.3, z: 25 },
      ],
    },
    {
      id: "5.10",
      anchor: "Your bite is dramatically weaker",
      note: "comparative bars, never numeric force values",
      layers: [
        { id: "gauge", kind: "gauge", x: 620, y: 480, w: 900, enter: "POP", props: { top: 0.95, bottom: 0.32, labels: ["CHIMP", "HUMAN"] } },
        { id: "stick", src: "s05/stick_awkward_smile_v01", x: 300, y: 860, h: 280, enter: "FADE", delay: 0.5, state: "ALIVE" },
      ],
    },
    {
      id: "5.11",
      anchor: "That's the bill",
      layers: [
        { id: "gauge", kind: "gauge", x: 620, y: 480, w: 900, enter: "NONE", opacity: 0.4, props: { top: 0.95, bottom: 0.32, labels: ["CHIMP", "HUMAN"] } },
        { id: "card", kind: "card", text: "FINE PRINT", x: 1180, y: 800, w: 700, h: 220, enter: "POP", props: { variant: "fineprint", size: 64 } },
      ],
    },
    {
      id: "5.12",
      anchor: "And we've been paying it with knives",
      note: "technology gag — cooking, never violence",
      layers: [
        { id: "chimp", src: "s05/asset_chimp_sitting_v01", x: 560, y: 640, h: 520, enter: "POP", state: "ALIVE" },
        { id: "nut", src: "s05/asset_hard_nut_v01", x: 790, y: 560, h: 120, enter: "POP", delay: 0.2, z: 20 },
        { id: "stick", src: "s05/stick_hold_knife_neutral_v01", x: 1350, y: 650, h: 600, enter: "POP", delay: 0.4, state: "ALIVE" },
        { id: "knife", src: "s05/asset_kitchen_knife_v01", x: 1520, y: 800, h: 180, enter: "POP", at: "knives and fire", z: 20 },
        { id: "fire", src: "s05/asset_fire_small_v01", x: 1720, y: 700, h: 190, enter: "POP", at: "and fire", z: 20 },
      ],
    },
    {
      id: "5.13",
      anchor: "A famous hypothesis links",
      note: "ghost outline + dashed connector — OPEN, never causal",
      layers: [
        { id: "human", src: "s05/asset_human_skull_profile_v01", x: 900, y: 560, h: 620, enter: "POP" },
        { id: "ts", src: "s05/asset_temporalis_small_v01", x: 930, y: 490, h: 120, enter: "FADE", opacity: 0.85, z: 20 },
        { id: "ghost", kind: "card", x: 905, y: 400, w: 520, h: 330, enter: "FADE", delay: 0.4, opacity: 0.4, props: { variant: "open" }, z: 5 },
        { id: "conn", kind: "tether", x: 890, y: 500, enter: "DRAW", delay: 0.6, z: 25, props: { dx: 260, dy: -120 } },
      ],
    },
    {
      id: "5.14",
      anchor: "It's also still disputed",
      layers: [
        { id: "human", src: "s05/asset_human_skull_profile_v01", x: 760, y: 560, h: 560, enter: "NONE", opacity: 0.6 },
        { id: "ghost", kind: "card", x: 765, y: 410, w: 470, h: 300, enter: "NONE", opacity: 0.3, props: { variant: "open" }, z: 5 },
        { id: "card", kind: "card", text: "OPEN QUESTION", x: 1420, y: 560, w: 700, h: 280, enter: "POP", props: { variant: "open", size: 58, color: COLORS.grey } },
      ],
    },
    {
      id: "5.15",
      anchor: "The part nobody disputes",
      note: "exact reuse of the 5.2 pose — callback, no new asset",
      layers: [
        { id: "stick", src: "s05/stick_touch_temples_v01", x: 960, y: 620, h: 720, enter: "POP", state: "ALIVE" },
        { id: "v1", kind: "warning", x: 800, y: 430, w: 130, enter: "POP", at: "You are carrying", z: 20 },
        { id: "v2", kind: "warning", x: 1110, y: 430, w: 130, enter: "POP", at: "You are carrying", z: 20 },
      ],
    },
    {
      id: "5.16",
      anchor: "So is everyone you have ever met",
      layers: [
        {
          id: "grid",
          kind: "grid",
          src: "s05/stick_touch_temples_v01",
          x: 960,
          y: 520,
          enter: "POP",
          props: { cols: 7, rows: 3, cell: 170 },
        },
      ],
    },
    {
      id: "5.T",
      hold: 2.0,
      layers: [
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 520,
          enter: "FADE",
          props: {
            open: [1, 2, 3, 4, 5],
            lit: [],
            pulse: 6,
            icons: {
              1: "s01/asset_deodorant_v01",
              2: "s02/asset_brake_pedal_v01",
              3: "s03/asset_door_no_handle_v01",
              4: "s04/asset_orange_v01",
              5: "s05/asset_human_skull_profile_v01",
            },
          },
        },
        { id: "done", kind: "text", text: "5 / 7", x: 960, y: 760, enter: "FADE", delay: 0.4, props: { size: 54, color: COLORS.grey } },
      ],
    },
  ],
};
