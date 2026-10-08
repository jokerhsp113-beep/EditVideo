import { COLORS } from "../theme";
import type { SectionTimeline } from "../types";

/**
 * SECTION 03 — IRON GUT (FUT2)
 * 3.7–3.10 are one gut canvas, reused again in 3.16–3.17.
 * 3.11 / 3.13 / 3.18 share one door grammar. 3.18 never uses a red X.
 */
const GUT = {
  stick: { x: 560, y: 700, h: 620 },
  window: { x: 1300, y: 560, w: 620, h: 430 },
};
const GLYCAN_X = [1080, 1160, 1240, 1320, 1400, 1480, 1560];

const glycanRow = (enter: "POP" | "NONE", opacity = 1) =>
  GLYCAN_X.map((x, i) => ({
    id: `gly${i}`,
    src: "s03/asset_glycan_stalk_v01",
    x,
    y: 500,
    h: 70,
    enter,
    delay: enter === "POP" ? 0.06 * i : undefined,
    opacity,
    z: 20,
  }));

export const s03: SectionTimeline = {
  id: "S03 · IRON GUT",
  title: "Iron gut",
  audio: "biy/audio/s03.mp3",
  captions: "biy/captions/s03.json",
  shots: [
    {
      id: "3.1",
      anchor: "Iron gut",
      layers: [
        { id: "title", kind: "text", text: "IRON GUT", x: 960, y: 260, enter: "POP", props: { size: 130 } },
        { id: "plate", src: "s03/asset_gut_lining_plate_v01", x: 1180, y: 640, w: 520, enter: "FADE", delay: 0.3, opacity: 0.85 },
        { id: "stick", src: "s03/stick_stand_deadpan_v01", x: 300, y: 780, h: 340, enter: "FADE", state: "ALIVE" },
      ],
    },
    {
      id: "3.2",
      anchor: "A cruise ship",
      layers: [
        { id: "stick", src: "s03/stick_stand_deadpan_v01", x: 270, y: 820, h: 300, enter: "FADE", state: "ALIVE" },
        { id: "ship", src: "s03/asset_cruise_ship_v01", x: 1180, y: 620, w: 980, enter: "SLIDE" },
      ],
    },
    {
      id: "3.3",
      anchor: "A daycare in February",
      note: "one approved Stick pose duplicated — never a generated crowd",
      layers: [
        { id: "shelf", src: "s03/asset_daycare_shelf_v01", x: 360, y: 560, w: 420, enter: "FADE" },
        { id: "table", src: "s03/asset_child_table_v01", x: 1040, y: 680, w: 450, enter: "FADE", delay: 0.1 },
        { id: "blocks", src: "s03/asset_toy_blocks_v01", x: 1260, y: 780, w: 250, enter: "POP", delay: 0.2 },
        { id: "k1", src: "s03/stick_stand_deadpan_v01", x: 620, y: 680, h: 260, enter: "POP", delay: 0.25, state: "ALIVE" },
        { id: "k2", src: "s03/stick_stand_deadpan_v01", x: 970, y: 680, h: 260, enter: "POP", delay: 0.35, state: "ALIVE" },
        { id: "k3", src: "s03/stick_stand_deadpan_v01", x: 1390, y: 680, h: 260, enter: "POP", delay: 0.45, state: "ALIVE" },
      ],
    },
    {
      id: "3.4",
      anchor: "A house where everyone",
      note: "four sick copies desaturated, one healthy at full contrast",
      layers: [
        { id: "couch", src: "s03/asset_couch_simple_v01", x: 960, y: 760, w: 900, opacity: 0.3, enter: "FADE" },
        { id: "s1", src: "s03/stick_slumped_sick_v01", x: 420, y: 650, h: 300, opacity: 0.5, enter: "FADE" },
        { id: "s2", src: "s03/stick_slumped_sick_v01", x: 720, y: 650, h: 300, opacity: 0.5, enter: "FADE", delay: 0.1 },
        { id: "s3", src: "s03/stick_slumped_sick_v01", x: 1200, y: 650, h: 300, opacity: 0.5, enter: "FADE", delay: 0.2 },
        { id: "s4", src: "s03/stick_slumped_sick_v01", x: 1500, y: 650, h: 300, opacity: 0.5, enter: "FADE", delay: 0.3 },
        { id: "well", src: "s03/stick_upright_awkward_v01", x: 960, y: 620, h: 340, enter: "POP", at: "except one person", state: "ALIVE", z: 20 },
      ],
    },
    {
      id: "3.5",
      anchor: "Sometimes that person just got lucky",
      layers: [
        { id: "couch", src: "s03/asset_couch_simple_v01", x: 960, y: 760, w: 900, opacity: 0.3, enter: "NONE" },
        { id: "s1", src: "s03/stick_slumped_sick_v01", x: 420, y: 650, h: 300, opacity: 0.5, enter: "NONE" },
        { id: "s2", src: "s03/stick_slumped_sick_v01", x: 720, y: 650, h: 300, opacity: 0.5, enter: "NONE" },
        { id: "s3", src: "s03/stick_slumped_sick_v01", x: 1200, y: 650, h: 300, opacity: 0.5, enter: "NONE" },
        { id: "s4", src: "s03/stick_slumped_sick_v01", x: 1500, y: 650, h: 300, opacity: 0.5, enter: "NONE" },
        { id: "well", src: "s03/stick_upright_awkward_v01", x: 960, y: 620, h: 340, enter: "NONE", state: "ALIVE", z: 20 },
        { id: "luck", kind: "text", text: "LUCK?", x: 960, y: 330, enter: "POP", props: { size: 96 } },
      ],
    },
    {
      id: "3.6",
      anchor: "And occasionally, luck isn't",
      note: "the X goes over the WORD, never over the person",
      layers: [
        { id: "well", src: "s03/stick_upright_awkward_v01", x: 960, y: 620, h: 340, enter: "NONE", state: "ALIVE", z: 20 },
        { id: "s1", src: "s03/stick_slumped_sick_v01", x: 420, y: 650, h: 300, opacity: 0.5, enter: "NONE" },
        { id: "s4", src: "s03/stick_slumped_sick_v01", x: 1500, y: 650, h: 300, opacity: 0.5, enter: "NONE" },
        { id: "luck", kind: "text", text: "LUCK?", x: 960, y: 330, enter: "NONE", props: { size: 96 } },
        { id: "x", src: "s00/prop_red_x", x: 960, y: 330, w: 260, enter: "DRAW", at: "isn't the whole explanation", z: 30 },
      ],
    },
    {
      id: "3.7",
      anchor: "Norovirus can't push",
      note: "gut canvas opens; virus waits outside",
      layers: [
        { id: "stick", src: "s03/stick_stand_deadpan_v01", ...GUT.stick, enter: "FADE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: GUT.window.x, y: GUT.window.y, w: GUT.window.w, h: GUT.window.h, enter: "POP", props: { plate: "s03/asset_gut_lining_plate_v01", plateScale: 0.95, plateY: 60 } },
        { id: "virus", src: "s03/asset_norovirus_v01", x: 1320, y: 250, h: 170, enter: "POP", delay: 0.4, state: "ALIVE", z: 25 },
      ],
    },
    {
      id: "3.8",
      anchor: "It has to grab onto",
      note: "glycan row appears left to right",
      layers: [
        { id: "stick", src: "s03/stick_stand_deadpan_v01", ...GUT.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: GUT.window.x, y: GUT.window.y, w: GUT.window.w, h: GUT.window.h, enter: "NONE", props: { plate: "s03/asset_gut_lining_plate_v01", plateScale: 0.95, plateY: 60 } },
        { id: "virus", src: "s03/asset_norovirus_v01", x: 1320, y: 250, h: 170, enter: "NONE", state: "ALIVE", z: 25 },
        ...glycanRow("POP"),
      ],
    },
    {
      id: "3.9",
      anchor: "And a gene called F U T two",
      layers: [
        { id: "stick", src: "s03/stick_stand_deadpan_v01", ...GUT.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: GUT.window.x, y: GUT.window.y, w: GUT.window.w, h: GUT.window.h, enter: "NONE", props: { plate: "s03/asset_gut_lining_plate_v01", plateScale: 0.95, plateY: 60 } },
        ...glycanRow("NONE"),
        { id: "label", kind: "text", text: "FUT2", x: 470, y: 300, enter: "POP", props: { size: 88 } },
        { id: "arrow", kind: "arrow", x: 720, y: 330, w: 280, enter: "DRAW", delay: 0.3 },
      ],
    },
    {
      id: "3.10",
      anchor: "In people whose F U T two is switched off",
      note: "overlay/state change only — the epithelium never re-renders",
      layers: [
        { id: "stick", src: "s03/stick_stand_deadpan_v01", ...GUT.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: GUT.window.x, y: GUT.window.y, w: GUT.window.w, h: GUT.window.h, enter: "NONE", props: { plate: "s03/asset_gut_lining_plate_v01", plateScale: 0.95, plateY: 60 } },
        ...glycanRow("NONE", 0.12),
        { id: "label", kind: "text", text: "FUT2", x: 470, y: 300, enter: "NONE", props: { size: 88 }, opacity: 0.5 },
        { id: "x", src: "s00/prop_red_x", x: 470, y: 300, w: 210, enter: "DRAW", z: 30 },
        { id: "virus", src: "s03/asset_norovirus_v01", x: 1320, y: 250, h: 170, enter: "NONE", state: "ALIVE", z: 25 },
      ],
    },
    {
      id: "3.11",
      anchor: "The virus arrives at a door",
      note: "GAG — must read with the sound off",
      layers: [
        { id: "door", src: "s03/asset_door_no_handle_v01", x: 1200, y: 570, h: 620, enter: "POP" },
        { id: "virus", src: "s03/asset_norovirus_v01", x: 300, y: 560, h: 180, enter: "FADE", delay: 0.3, state: "ALIVE", props: { toX: 800, travel: 1.2 } },
      ],
    },
    {
      id: "3.12",
      anchor: "Danish researchers followed",
      note: "EvidenceChip stays blank. SCIENCE GATE: IRON-DANISH-OUTBREAK-STUDY",
      layers: [
        { id: "door", src: "s03/asset_door_no_handle_v01", x: 1200, y: 520, h: 560, enter: "NONE", opacity: 0.35 },
        { id: "virus", src: "s03/asset_norovirus_v01", x: 800, y: 520, h: 170, enter: "NONE", opacity: 0.35 },
        { id: "chip", kind: "card", text: "EVIDENCE\nPENDING", x: 1180, y: 830, w: 640, h: 210, enter: "POP", props: { variant: "open", size: 46, color: COLORS.grey } },
      ],
    },
    {
      id: "3.13",
      anchor: "A gene that quit",
      note: "payoff — three viruses queue at a door that never opens",
      layers: [
        { id: "door", src: "s03/asset_door_no_handle_v01", x: 1250, y: 560, h: 640, enter: "FADE" },
        { id: "v1", src: "s03/asset_norovirus_v01", x: 300, y: 560, h: 180, enter: "FADE", state: "ALIVE", props: { toX: 830, travel: 1.0 } },
        { id: "v2", src: "s03/asset_norovirus_v01", x: 170, y: 640, h: 160, enter: "FADE", delay: 0.2, state: "ALIVE", props: { toX: 660, travel: 1.0 } },
        { id: "v3", src: "s03/asset_norovirus_v01", x: 40, y: 520, h: 150, enter: "FADE", delay: 0.4, state: "ALIVE", props: { toX: 500, travel: 1.0 } },
      ],
    },
    {
      id: "3.14",
      anchor: "About one in five",
      note: "BEAT A giant stat -> BEAT B map. SCIENCE GATE: IRON-EUROPE-1IN5",
      layers: [
        { id: "stat", kind: "number", text: "1 IN 5", x: 960, y: 520, enter: "POP", until: 1.5, props: { size: 300 } },
        { id: "map", src: "s03/asset_europe_map_v01", x: 800, y: 560, w: 900, enter: "FADE", delay: 1.15 },
        { id: "stat2", kind: "text", text: "1 IN 5", x: 1560, y: 400, enter: "POP", delay: 1.55, props: { size: 130 } },
        { id: "gate", kind: "text", text: "SOURCE PENDING", x: 1560, y: 520, enter: "FADE", delay: 1.8, props: { size: 32, color: COLORS.orange } },
      ],
    },
    {
      id: "3.15",
      anchor: "The fine print is real",
      note: "semantic event for 'there are two'",
      layers: [
        { id: "two", kind: "number", text: "2", x: 960, y: 500, enter: "POP", until: 1.2, props: { size: 420 } },
        { id: "card", kind: "card", text: "FINE PRINT", x: 960, y: 520, w: 1000, h: 400, enter: "POP", delay: 0.95, props: { variant: "fineprint" } },
        { id: "slot1", kind: "text", text: "1", x: 700, y: 820, enter: "FADE", delay: 1.5, props: { size: 70, color: COLORS.grey } },
        { id: "slot2", kind: "text", text: "2", x: 1220, y: 820, enter: "FADE", delay: 1.6, props: { size: 70, color: COLORS.grey } },
      ],
    },
    {
      id: "3.16",
      anchor: "Non-secretors carry a higher risk",
      note: "back to the exact gut canvas; no disease iconography",
      layers: [
        { id: "stick", src: "s03/stick_mild_pain_v01", ...GUT.stick, enter: "FADE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: GUT.window.x, y: GUT.window.y, w: GUT.window.w, h: GUT.window.h, enter: "FADE", props: { plate: "s03/asset_gut_lining_plate_v01", plateScale: 0.95, plateY: 60 } },
        ...glycanRow("NONE"),
        { id: "b1", src: "s03/asset_bacterium_beneficial_v01", x: 1150, y: 380, h: 90, enter: "POP", delay: 0.3, state: "ALIVE", z: 25 },
        { id: "b2", src: "s03/asset_bacterium_beneficial_v01", x: 1330, y: 340, h: 90, enter: "POP", delay: 0.45, state: "ALIVE", z: 25 },
        { id: "b3", src: "s03/asset_bacterium_beneficial_v01", x: 1500, y: 390, h: 90, enter: "POP", delay: 0.6, state: "ALIVE", z: 25 },
        { id: "slot", kind: "text", text: "1", x: 300, y: 250, enter: "FADE", props: { size: 64, color: COLORS.grey } },
        { id: "slot2", kind: "text", text: "2", x: 400, y: 250, enter: "FADE", at: "type one diabetes", props: { size: 64, color: COLORS.grey } },
      ],
    },
    {
      id: "3.17",
      anchor: "That sugar coating isn't only",
      note: "relationship, not microbiome collapse — bacteria fade, never die",
      layers: [
        { id: "stick", src: "s03/stick_mild_pain_v01", ...GUT.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: GUT.window.x, y: GUT.window.y, w: GUT.window.w, h: GUT.window.h, enter: "NONE", props: { plate: "s03/asset_gut_lining_plate_v01", plateScale: 0.95, plateY: 60 } },
        ...glycanRow("NONE", 0.15),
        { id: "b1", src: "s03/asset_bacterium_beneficial_v01", x: 1150, y: 380, h: 90, enter: "NONE", opacity: 0.4, z: 25 },
        { id: "b2", src: "s03/asset_bacterium_beneficial_v01", x: 1330, y: 340, h: 90, enter: "NONE", opacity: 0.4, z: 25 },
        { id: "b3", src: "s03/asset_bacterium_beneficial_v01", x: 1500, y: 390, h: 90, enter: "NONE", opacity: 0.4, z: 25 },
      ],
    },
    {
      id: "3.18",
      anchor: "And against several other",
      note: "OPEN / strain-specific — dashed treatment, never a red X",
      layers: [
        { id: "door", src: "s03/asset_door_open_handle_v01", x: 1250, y: 560, h: 640, enter: "POP" },
        { id: "variant", src: "s03/asset_norovirus_variant_v01", x: 420, y: 560, h: 180, enter: "FADE", delay: 0.3, state: "ALIVE", props: { toX: 1150, travel: 1.4 } },
        { id: "open", kind: "card", text: "STRAIN-SPECIFIC", x: 620, y: 880, w: 640, h: 150, enter: "FADE", delay: 0.6, props: { variant: "open", size: 42, color: COLORS.grey } },
      ],
    },
    {
      id: "3.19",
      anchor: "So if you're ever the only",
      layers: [
        { id: "table", src: "s03/asset_small_table_v01", x: 980, y: 690, w: 620, enter: "FADE" },
        { id: "chair", src: "s03/asset_chair_simple_v01", x: 690, y: 690, h: 500, enter: "FADE" },
        { id: "stick", src: "s03/stick_seated_eating_v01", x: 720, y: 600, h: 430, enter: "POP", delay: 0.2, state: "ALIVE", z: 20 },
        { id: "bowl", src: "s03/asset_bowl_plain_v01", x: 980, y: 575, w: 210, enter: "POP", delay: 0.4, z: 25 },
      ],
    },
    {
      id: "3.T",
      hold: 2.0,
      layers: [
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 520,
          enter: "FADE",
          props: {
            open: [1, 2, 3],
            lit: [],
            pulse: 4,
            icons: {
              1: "s01/asset_deodorant_v01",
              2: "s02/asset_brake_pedal_v01",
              3: "s03/asset_door_no_handle_v01",
            },
          },
        },
        { id: "done", kind: "text", text: "3 / 7", x: 960, y: 760, enter: "FADE", delay: 0.4, props: { size: 54, color: COLORS.grey } },
      ],
    },
  ],
};
