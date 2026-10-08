import { COLORS } from "../theme";
import type { SectionTimeline } from "../types";

/**
 * SECTION 07 — THE CELL THAT DESTROYS ITSELF (G6PD)
 * 7.4–7.9 keep one vessel/RBC geometry; only the infected cell changes.
 * The parasite is ALWAYS the ring-stage asset — never a crescent.
 */
const RBC = {
  stick: { x: 470, y: 700, h: 620 },
  window: { x: 1260, y: 540, w: 720, h: 400 },
  cells: [
    [1080, 540],
    [1280, 500],
    [1450, 570],
    [1620, 520],
  ],
};

const cellRow = (src: string, enter: "POP" | "NONE", skip = -1) =>
  RBC.cells.map(([x, y], i) => ({
    id: `c${i}`,
    src,
    x,
    y,
    h: 110,
    enter: i === skip ? ("NONE" as const) : enter,
    delay: enter === "POP" ? 0.08 * i : undefined,
    opacity: i === skip ? 0 : 1,
    z: 20,
  }));

export const s07: SectionTimeline = {
  id: "S07 · THE CELL",
  title: "The cell that destroys itself",
  audio: "biy/audio/s07.mp3",
  captions: "biy/captions/s07.json",
  shots: [
    {
      id: "7.1",
      anchor: "The cell that destroys itself",
      layers: [
        { id: "title", kind: "text", text: "THE CELL THAT DESTROYS ITSELF", x: 960, y: 250, enter: "POP", props: { size: 78 } },
        { id: "rbc", src: "s07/asset_rbc_healthy_v01", x: 960, y: 640, h: 260, enter: "POP", delay: 0.3, state: "ALIVE" },
      ],
    },
    {
      id: "7.2",
      anchor: "the deadliest thing in your environment",
      layers: [
        { id: "pred", src: "s07/asset_predator_generic_v01", x: 1150, y: 560, h: 520, enter: "POP" },
        { id: "x", src: "s00/prop_red_x", x: 1150, y: 560, w: 380, enter: "DRAW", at: "wasn't a predator", z: 25 },
        { id: "stick", src: "s07/stick_stand_deadpan_v01", x: 330, y: 800, h: 320, enter: "FADE", state: "ALIVE" },
      ],
    },
    {
      id: "7.3",
      anchor: "It was a parasite carried by a mosquito",
      note: "scale contrast is the pattern interrupt — keep the mosquito tiny",
      layers: [
        { id: "mos", src: "s07/asset_mosquito_v01", x: 960, y: 520, h: 150, enter: "POP", state: "ALIVE" },
        { id: "stick", src: "s07/stick_blank_disbelief_v01", x: 400, y: 840, h: 260, enter: "FADE", delay: 0.4, state: "ALIVE" },
      ],
    },
    {
      id: "7.4",
      anchor: "G six P D is an enzyme",
      note: "RBC canvas opens — persists to 7.9",
      layers: [
        { id: "stick", src: "s07/stick_stand_deadpan_v01", ...RBC.stick, enter: "FADE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "POP", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...cellRow("s07/asset_rbc_healthy_v01", "POP"),
        { id: "label", kind: "text", text: "G6PD", x: 1260, y: 830, enter: "FADE", delay: 0.4, props: { size: 70 } },
      ],
    },
    {
      id: "7.5",
      anchor: "Reduce it, and those cells become fragile",
      note: "same positions, fragile state swapped in",
      layers: [
        { id: "stick", src: "s07/stick_stand_deadpan_v01", ...RBC.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "NONE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...cellRow("s07/asset_rbc_fragile_v01", "POP"),
        { id: "label", kind: "text", text: "G6PD", x: 1260, y: 830, enter: "NONE", opacity: 0.45, props: { size: 70 } },
        { id: "x", src: "s00/prop_red_x", x: 1260, y: 830, w: 130, enter: "DRAW", z: 25 },
      ],
    },
    {
      id: "7.6",
      anchor: "Which is exactly the problem",
      note: "ring-stage parasite enters exactly one cell",
      layers: [
        { id: "stick", src: "s07/stick_stand_deadpan_v01", ...RBC.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "NONE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...cellRow("s07/asset_rbc_fragile_v01", "NONE"),
        { id: "ring", src: "s07/asset_malaria_ring_stage_v01", x: RBC.cells[1][0], y: RBC.cells[1][1], h: 70, enter: "POP", at: "malaria parasite", state: "ACTIVE", z: 30 },
      ],
    },
    {
      id: "7.7",
      anchor: "A parasite inside a G six P D deficient",
      layers: [
        { id: "stick", src: "s07/stick_stand_deadpan_v01", ...RBC.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "NONE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...cellRow("s07/asset_rbc_fragile_v01", "NONE"),
        { id: "ring", src: "s07/asset_malaria_ring_stage_v01", x: RBC.cells[1][0], y: RBC.cells[1][1], h: 70, enter: "NONE", z: 30 },
        { id: "stress", kind: "warning", x: RBC.cells[1][0], y: RBC.cells[1][1], w: 230, enter: "POP", at: "creates stress", z: 25 },
      ],
    },
    {
      id: "7.8",
      anchor: "The cell gets damaged and cleared early",
      layers: [
        { id: "stick", src: "s07/stick_stand_deadpan_v01", ...RBC.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.h, h: RBC.window.h, enter: "NONE", opacity: 0, props: {} },
        { id: "bw2", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "NONE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...cellRow("s07/asset_rbc_fragile_v01", "NONE", 1),
        { id: "frag", src: "s07/asset_rbc_fragments_v01", x: RBC.cells[1][0], y: RBC.cells[1][1], h: 130, enter: "POP", z: 25 },
        { id: "ring", src: "s07/asset_malaria_ring_stage_v01", x: RBC.cells[1][0] + 30, y: RBC.cells[1][1] + 20, h: 60, enter: "NONE", opacity: 0.8, z: 30 },
      ],
    },
    {
      id: "7.9",
      anchor: "And the parasite goes with it",
      layers: [
        { id: "stick", src: "s07/stick_stand_deadpan_v01", ...RBC.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw2", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "NONE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...cellRow("s07/asset_rbc_fragile_v01", "NONE", 1),
        { id: "frag", src: "s07/asset_rbc_fragments_v01", x: RBC.cells[1][0], y: RBC.cells[1][1], h: 130, enter: "NONE", z: 25 },
        { id: "ring", src: "s07/asset_malaria_ring_stage_v01", x: RBC.cells[1][0] + 30, y: RBC.cells[1][1] + 20, h: 60, enter: "NONE", opacity: 0.18, z: 30 },
      ],
    },
    {
      id: "7.10",
      anchor: "Your body doesn't kill the invader",
      note: "GAG — building collapses inward, no fire, no explosion",
      layers: [
        { id: "build", src: "s07/asset_building_simple_v01", x: 960, y: 560, h: 620, enter: "POP" },
        { id: "intruder", src: "s07/asset_intruder_v01", x: 960, y: 660, h: 130, enter: "FADE", delay: 0.3, z: 20 },
        { id: "collapse", src: "s07/asset_building_simple_v01", x: 960, y: 640, h: 400, enter: "POP", at: "It demolishes the building", z: 25, props: { toY: 700, travel: 0.6 } },
      ],
    },
    {
      id: "7.11",
      anchor: "G six P D deficiency is one of the most common",
      note: "the 400M figure is now in the narration — giant stat then map",
      layers: [
        { id: "map", src: "s07/asset_world_map_v01", x: 960, y: 540, w: 1500, enter: "FADE", opacity: 0.9 },
        { id: "stat", kind: "number", text: "400M", x: 960, y: 520, enter: "POP", at: "four hundred million", until: 2.2, props: { size: 300 }, z: 30 },
      ],
    },
    {
      id: "7.12",
      anchor: "Its distribution overlaps strongly",
      layers: [
        { id: "map", src: "s07/asset_world_map_v01", x: 960, y: 540, w: 1500, enter: "NONE" },
        { id: "g6pd", src: "s07/asset_g6pd_distribution_overlay_v01", x: 960, y: 560, w: 1100, enter: "FADE", opacity: 0.55, z: 20 },
        { id: "mal", src: "s07/asset_malaria_history_overlay_v01", x: 960, y: 560, w: 1150, enter: "FADE", delay: 0.6, opacity: 0.45, z: 21 },
      ],
    },
    {
      id: "7.13",
      anchor: "And here is where the bill",
      note: "largest Fine Print card in the whole video",
      layers: [
        { id: "card", kind: "card", text: "FINE PRINT", x: 960, y: 520, w: 1500, h: 560, enter: "POP", props: { variant: "fineprint", size: 120 } },
      ],
    },
    {
      id: "7.14",
      anchor: "Those fragile red cells are fragile",
      note: "exact 7.5 canvas reused",
      layers: [
        { id: "stick", src: "s07/stick_stand_deadpan_v01", ...RBC.stick, enter: "FADE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "FADE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...cellRow("s07/asset_rbc_fragile_v01", "POP"),
      ],
    },
    {
      id: "7.15",
      anchor: "Certain medications",
      note: "triggers enter one by one, on their own phrase",
      layers: [
        { id: "stick", src: "s07/stick_stand_deadpan_v01", ...RBC.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "NONE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...cellRow("s07/asset_rbc_fragile_v01", "NONE"),
        { id: "pill", src: "s07/asset_capsule_v01", x: 700, y: 300, h: 130, enter: "POP", at: "Certain medications", z: 25 },
        { id: "bact", src: "s07/asset_bacterium_v01", x: 960, y: 250, h: 110, enter: "POP", at: "certain infections", z: 25 },
        { id: "fava", src: "s07/asset_fava_bean_v01", x: 1230, y: 290, h: 130, enter: "POP", at: "fava beans", z: 25 },
      ],
    },
    {
      id: "7.16",
      anchor: "can push them to break down",
      layers: [
        { id: "stick", src: "s07/stick_mild_panic_v01", ...RBC.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "NONE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        { id: "pill", src: "s07/asset_capsule_v01", x: 700, y: 300, h: 130, enter: "NONE", opacity: 0.4, z: 25 },
        { id: "bact", src: "s07/asset_bacterium_v01", x: 960, y: 250, h: 110, enter: "NONE", opacity: 0.4, z: 25 },
        { id: "fava", src: "s07/asset_fava_bean_v01", x: 1230, y: 290, h: 130, enter: "NONE", opacity: 0.4, z: 25 },
        ...RBC.cells.map(([x, y], i) => ({
          id: `f${i}`,
          src: "s07/asset_rbc_fragments_v01",
          x,
          y,
          h: 120,
          enter: "POP" as const,
          delay: 0.1 * i,
          z: 22,
        })),
      ],
    },
    {
      id: "7.17",
      anchor: "The word for that is hemolytic",
      note: "US spelling on screen, to match the voiceover",
      layers: [
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "NONE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...RBC.cells.map(([x, y], i) => ({
          id: `f${i}`,
          src: "s07/asset_rbc_fragments_v01",
          x,
          y,
          h: 120,
          enter: "NONE" as const,
          z: 22,
        })),
        { id: "label", kind: "text", text: "HEMOLYTIC ANEMIA", x: 620, y: 520, enter: "POP", props: { size: 62 } },
      ],
    },
    {
      id: "7.18",
      anchor: "And for someone who doesn't know",
      push: 3,
      note: "serious beat — no new icon, no red flash",
      layers: [
        { id: "bw", kind: "bodyWindow", x: RBC.window.x, y: RBC.window.y, w: RBC.window.w, h: RBC.window.h, enter: "NONE", props: { plate: "s07/asset_blood_vessel_plate_v01", plateScale: 0.95 } },
        ...RBC.cells.map(([x, y], i) => ({
          id: `f${i}`,
          src: "s07/asset_rbc_fragments_v01",
          x,
          y,
          h: 120,
          enter: "NONE" as const,
          z: 22,
        })),
        { id: "label", kind: "text", text: "HEMOLYTIC ANEMIA", x: 620, y: 520, enter: "NONE", props: { size: 62 } },
      ],
    },
    {
      id: "7.19",
      anchor: "Even the protection is uneven",
      layers: [
        { id: "card", kind: "card", text: "OPEN QUESTION", x: 960, y: 520, w: 1100, h: 400, enter: "POP", props: { variant: "open", size: 70, color: COLORS.grey } },
      ],
    },
    {
      id: "7.20",
      anchor: "Research has found deficiency lowering",
      layers: [
        { id: "scale", kind: "scale", x: 960, y: 420, w: 800, enter: "POP", props: { tilt: 0.55 } },
      ],
    },
    {
      id: "7.21",
      anchor: "while appearing to raise another",
      layers: [
        { id: "scale", kind: "scale", x: 960, y: 420, w: 800, enter: "NONE", props: { tilt: -0.45 } },
      ],
    },
    {
      id: "7.22",
      anchor: "There is no clean answer",
      note: "never settles level",
      layers: [
        { id: "scale", kind: "scale", x: 960, y: 420, w: 800, enter: "NONE", props: { tilt: 0.1, wobble: true } },
      ],
    },
    {
      id: "7.23",
      anchor: "Every other gene in this video",
      note: "six prior icons, each with a face-down invoice",
      layers: [
        ...[
          "s01/asset_deodorant_v01",
          "s02/asset_brake_pedal_v01",
          "s03/asset_door_no_handle_v01",
          "s04/asset_orange_v01",
          "s05/asset_human_skull_profile_v01",
          "s06/asset_volume_knob_v01",
        ].flatMap((src, i) => {
          const x = 460 + (i % 3) * 400;
          const y = i < 3 ? 400 : 720;
          return [
            { id: `icon${i}`, src, x, y, h: 210, enter: "POP" as const, delay: 0.05 * i },
            {
              id: `inv${i}`,
              kind: "card" as const,
              x: x + 90,
              y: y + 90,
              w: 150,
              h: 100,
              enter: "FADE" as const,
              delay: 0.05 * i + 0.08,
              opacity: 0.5,
              props: { variant: "open" },
              z: 5,
            },
          ];
        }),
      ],
    },
    {
      id: "7.24",
      anchor: "This one hands you the invoice",
      layers: [
        ...[
          "s01/asset_deodorant_v01",
          "s02/asset_brake_pedal_v01",
          "s03/asset_door_no_handle_v01",
          "s04/asset_orange_v01",
          "s05/asset_human_skull_profile_v01",
          "s06/asset_volume_knob_v01",
        ].map((src, i) => ({
          id: `icon${i}`,
          src,
          x: 460 + (i % 3) * 400,
          y: i < 3 ? 400 : 720,
          h: 170,
          enter: "NONE" as const,
          opacity: 0.35,
        })),
        { id: "seventh", src: "s07/asset_rbc_healthy_v01", x: 1560, y: 560, h: 240, enter: "POP", state: "ACTIVE", z: 25 },
        { id: "invoice", kind: "card", text: "INVOICE", x: 1560, y: 800, w: 380, h: 170, enter: "POP", delay: 0.2, props: { variant: "fineprint", size: 52 }, z: 25 },
      ],
    },
    {
      id: "7.25",
      anchor: "Evolution didn't build a perfect defense",
      note: "hero composition — Stick holds the scale",
      layers: [
        { id: "stick", src: "s07/stick_hold_scale_v01", x: 960, y: 660, h: 700, enter: "POP", state: "ALIVE" },
        { id: "pans", kind: "scale", x: 960, y: 620, w: 980, enter: "FADE", delay: 0.3, props: { tilt: 0.18, held: true }, z: 5 },
      ],
    },
    {
      id: "7.26",
      anchor: "It struck a bargain",
      layers: [
        { id: "stick", src: "s07/stick_hold_scale_v01", x: 960, y: 660, h: 700, enter: "NONE", state: "ALIVE" },
        { id: "pans", kind: "scale", x: 960, y: 620, w: 980, enter: "NONE", props: { tilt: 0.18, wobble: true, held: true }, z: 5 },
      ],
    },
    {
      id: "7.T",
      hold: 2.4,
      note: "7 / 7 — all windows open, one completion ring, no next-item pulse",
      layers: [
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 520,
          enter: "FADE",
          props: {
            open: [1, 2, 3, 4, 5, 6, 7],
            lit: [],
            pulse: null,
            icons: {
              1: "s01/asset_deodorant_v01",
              2: "s02/asset_brake_pedal_v01",
              3: "s03/asset_door_no_handle_v01",
              4: "s04/asset_orange_v01",
              5: "s05/asset_human_skull_profile_v01",
              6: "s06/asset_volume_knob_v01",
              7: "s07/asset_rbc_healthy_v01",
            },
          },
        },
        { id: "done", kind: "text", text: "7 / 7", x: 960, y: 760, enter: "POP", delay: 0.5, props: { size: 64, color: COLORS.teal } },
      ],
    },
  ],
};
