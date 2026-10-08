import { COLORS } from "../theme";
import type { SectionTimeline } from "../types";

/**
 * SECTION 02 — THE BRAKE YOU DIDN'T ASK FOR (ALDH2)
 * 2.6–2.12 share one mechanism canvas: same Stick, same Body Window, same liver,
 * same pathway plate — only molecule/enzyme states change.
 */
const MECH = {
  stick: { x: 480, y: 700, h: 620 },
  window: { x: 620, y: 660, w: 400, h: 330 },
  plate: { x: 1280, y: 560, w: 760 },
};
const NODE = { in: 1010, mid: 1280, out: 1550, y: 560 };

export const s02: SectionTimeline = {
  id: "S02 · THE BRAKE",
  title: "The brake you didn't ask for",
  audio: "biy/audio/s02.mp3",
  captions: "biy/captions/s02.json",
  shots: [
    {
      id: "2.1",
      anchor: "The brake you didn't ask for",
      note: "item entry — pedal press on the word 'brake'",
      layers: [
        { id: "brake", src: "s02/asset_brake_pedal_v01", x: 960, y: 590, h: 330, enter: "POP", state: "ACTIVE" },
        { id: "title", kind: "text", text: "THE BRAKE YOU DIDN'T ASK FOR", x: 960, y: 200, enter: "POP", props: { size: 74 } },
        { id: "stick", src: "s02/stick_stand_deadpan_v01", x: 230, y: 850, h: 300, enter: "FADE", state: "ALIVE" },
      ],
    },
    {
      id: "2.2",
      anchor: "Some people take two sips",
      note: "beer pops on the word 'beer'",
      layers: [
        { id: "stick", src: "s02/stick_hold_beer_neutral_v01", x: 700, y: 690, h: 570, enter: "POP", state: "ALIVE" },
        { id: "beer", src: "s02/asset_beer_glass_v01", x: 940, y: 600, h: 240, at: "sips of beer", enter: "POP", z: 20 },
      ],
    },
    {
      id: "2.3",
      anchor: "Face, neck",
      note: "flush spreads face -> neck -> chest (overlay, never a re-rendered body)",
      layers: [
        { id: "stick", src: "s02/stick_hold_beer_miserable_v01", x: 700, y: 690, h: 570, enter: "NONE", state: "ALIVE" },
        { id: "beer", src: "s02/asset_beer_glass_v01", x: 940, y: 600, h: 240, enter: "NONE", z: 20 },
        { id: "f1", kind: "card", x: 700, y: 470, w: 150, h: 150, enter: "FADE", opacity: 0.38, props: { variant: "flush" }, at: "Face" },
        { id: "f2", kind: "card", x: 700, y: 580, w: 90, h: 70, enter: "FADE", opacity: 0.34, props: { variant: "flush" }, at: "neck" },
        { id: "f3", kind: "card", x: 700, y: 680, w: 210, h: 120, enter: "FADE", opacity: 0.3, props: { variant: "flush" }, at: "the whole chest" },
      ],
    },
    {
      id: "2.4",
      anchor: "Heart rate up",
      note: "only the heart icon is ACTIVE",
      layers: [
        { id: "stick", src: "s02/stick_hold_beer_miserable_v01", x: 700, y: 690, h: 570, enter: "NONE", state: "ALIVE" },
        { id: "beer", src: "s02/asset_beer_glass_v01", x: 940, y: 600, h: 240, enter: "NONE", z: 20 },
        { id: "f1", kind: "card", x: 700, y: 470, w: 150, h: 150, enter: "NONE", opacity: 0.38, props: { variant: "flush" } },
        { id: "f3", kind: "card", x: 700, y: 680, w: 210, h: 120, enter: "NONE", opacity: 0.3, props: { variant: "flush" } },
        { id: "hr", src: "s02/asset_heart_rate_icon_v01", x: 1420, y: 330, h: 220, enter: "POP", state: "ACTIVE", z: 25 },
      ],
    },
    {
      id: "2.5",
      anchor: "That's not simply",
      note: "gene + missing step only — no liver yet",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", x: 240, y: 840, h: 300, enter: "FADE", state: "ALIVE" },
        { id: "dna", src: "s02/asset_dna_icon_v01", x: 1050, y: 470, h: 380, enter: "POP" },
        { id: "label", kind: "text", text: "ALDH2", x: 1050, y: 740, enter: "POP", delay: 0.2, props: { size: 92 } },
        { id: "n1", kind: "card", x: 1430, y: 470, w: 120, h: 120, enter: "POP", delay: 0.4, props: { variant: "fineprint" } },
        { id: "n2", kind: "card", x: 1680, y: 470, w: 120, h: 120, enter: "POP", delay: 0.55, opacity: 0.35, props: { variant: "open" } },
        { id: "x", src: "s00/prop_red_x", x: 1680, y: 470, w: 110, at: "missing a step", enter: "DRAW", z: 25 },
      ],
    },
    {
      id: "2.6",
      anchor: "Alcohol gets broken down",
      note: "mechanism canvas opens — persists to 2.12",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", ...MECH.stick, enter: "FADE", state: "ALIVE" },
        {
          id: "bw",
          kind: "bodyWindow",
          x: MECH.window.x,
          y: MECH.window.y,
          w: MECH.window.w,
          h: MECH.window.h,
          enter: "POP",
          props: { plate: "s02/asset_liver_v01", plateScale: 0.75 },
        },
        { id: "plate", src: "s02/asset_mechanism_plate_v01", x: MECH.plate.x, y: MECH.plate.y, w: MECH.plate.w, enter: "SLIDE", delay: 0.3 },
      ],
    },
    {
      id: "2.7",
      anchor: "First into acetaldehyde",
      note: "toxic molecule + warning halo",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", ...MECH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: MECH.window.x, y: MECH.window.y, w: MECH.window.w, h: MECH.window.h, enter: "NONE", props: { plate: "s02/asset_liver_v01", plateScale: 0.75 } },
        { id: "plate", src: "s02/asset_mechanism_plate_v01", x: MECH.plate.x, y: MECH.plate.y, w: MECH.plate.w, enter: "NONE" },
        { id: "mol", src: "s02/asset_acetaldehyde_molecule_v01", x: NODE.mid, y: NODE.y, h: 120, enter: "POP", z: 20 },
        { id: "halo", kind: "warning", x: NODE.mid, y: NODE.y, w: 220, at: "genuinely toxic", enter: "POP", z: 15 },
      ],
    },
    {
      id: "2.8",
      anchor: "Then into something harmless",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", ...MECH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: MECH.window.x, y: MECH.window.y, w: MECH.window.w, h: MECH.window.h, enter: "NONE", props: { plate: "s02/asset_liver_v01", plateScale: 0.75 } },
        { id: "plate", src: "s02/asset_mechanism_plate_v01", x: MECH.plate.x, y: MECH.plate.y, w: MECH.plate.w, enter: "NONE" },
        { id: "mol", src: "s02/asset_acetaldehyde_molecule_v01", x: NODE.mid, y: NODE.y, h: 120, enter: "NONE", z: 20 },
        { id: "halo", kind: "warning", x: NODE.mid, y: NODE.y, w: 220, enter: "NONE", z: 15 },
        { id: "arrow", kind: "arrow", x: NODE.mid + 70, y: NODE.y, w: 150, enter: "DRAW", props: { color: COLORS.teal } },
        { id: "out", src: "s02/asset_output_molecule_v01", x: NODE.out, y: NODE.y, h: 110, enter: "POP", delay: 0.25, z: 20 },
      ],
    },
    {
      id: "2.9",
      anchor: "A L D H two runs that second stage",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", ...MECH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: MECH.window.x, y: MECH.window.y, w: MECH.window.w, h: MECH.window.h, enter: "NONE", props: { plate: "s02/asset_liver_v01", plateScale: 0.75 } },
        { id: "plate", src: "s02/asset_mechanism_plate_v01", x: MECH.plate.x, y: MECH.plate.y, w: MECH.plate.w, enter: "NONE" },
        { id: "mol", src: "s02/asset_acetaldehyde_molecule_v01", x: NODE.mid, y: NODE.y, h: 120, enter: "NONE", z: 20 },
        { id: "out", src: "s02/asset_output_molecule_v01", x: NODE.out, y: NODE.y, h: 110, enter: "NONE", z: 20 },
        { id: "enz", src: "s02/asset_aldh2_enzyme_v01", x: (NODE.mid + NODE.out) / 2, y: NODE.y - 130, h: 150, enter: "POP", state: "ACTIVE", z: 25 },
        { id: "elabel", kind: "text", text: "ALDH2", x: (NODE.mid + NODE.out) / 2, y: NODE.y - 250, enter: "FADE", delay: 0.2, props: { size: 46, color: COLORS.green } },
      ],
    },
    {
      id: "2.10",
      anchor: "stage two slows dramatically",
      note: "state change only — enzyme greys out",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", ...MECH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: MECH.window.x, y: MECH.window.y, w: MECH.window.w, h: MECH.window.h, enter: "NONE", props: { plate: "s02/asset_liver_v01", plateScale: 0.75 } },
        { id: "plate", src: "s02/asset_mechanism_plate_v01", x: MECH.plate.x, y: MECH.plate.y, w: MECH.plate.w, enter: "NONE" },
        { id: "mol", src: "s02/asset_acetaldehyde_molecule_v01", x: NODE.mid, y: NODE.y, h: 120, enter: "NONE", z: 20 },
        { id: "out", src: "s02/asset_output_molecule_v01", x: NODE.out, y: NODE.y, h: 110, enter: "NONE", opacity: 0.35, z: 20 },
        { id: "enz", src: "s02/asset_aldh2_enzyme_v01", x: (NODE.mid + NODE.out) / 2, y: NODE.y - 130, h: 150, enter: "NONE", opacity: 0.4, z: 25 },
      ],
    },
    {
      id: "2.11",
      anchor: "and the acetaldehyde piles up",
      note: "6 copies stack in front of the slowed enzyme",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", ...MECH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: MECH.window.x, y: MECH.window.y, w: MECH.window.w, h: MECH.window.h, enter: "NONE", props: { plate: "s02/asset_liver_v01", plateScale: 0.75 } },
        { id: "plate", src: "s02/asset_mechanism_plate_v01", x: MECH.plate.x, y: MECH.plate.y, w: MECH.plate.w, enter: "NONE" },
        { id: "out", src: "s02/asset_output_molecule_v01", x: NODE.out, y: NODE.y, h: 110, enter: "NONE", opacity: 0.35, z: 20 },
        { id: "enz", src: "s02/asset_aldh2_enzyme_v01", x: (NODE.mid + NODE.out) / 2, y: NODE.y - 130, h: 150, enter: "NONE", opacity: 0.4, z: 25 },
        ...[0, 1, 2, 3, 4, 5].map((i) => ({
          id: `pile${i}`,
          src: "s02/asset_acetaldehyde_molecule_v01",
          x: NODE.mid - (i % 3) * 86,
          y: NODE.y + (i < 3 ? 0 : 92),
          h: 104,
          enter: "POP" as const,
          delay: 0.1 * i,
          z: 20,
        })),
      ],
    },
    {
      id: "2.12",
      anchor: "Your body isn't rejecting",
      push: 4,
      note: "processing beat — whole jammed mechanism, nothing new",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", ...MECH.stick, enter: "NONE", state: "ALIVE" },
        { id: "bw", kind: "bodyWindow", x: MECH.window.x, y: MECH.window.y, w: MECH.window.w, h: MECH.window.h, enter: "NONE", props: { plate: "s02/asset_liver_v01", plateScale: 0.75 } },
        { id: "plate", src: "s02/asset_mechanism_plate_v01", x: MECH.plate.x, y: MECH.plate.y, w: MECH.plate.w, enter: "NONE" },
        { id: "enz", src: "s02/asset_aldh2_enzyme_v01", x: (NODE.mid + NODE.out) / 2, y: NODE.y - 130, h: 150, enter: "NONE", opacity: 0.4, z: 25 },
        ...[0, 1, 2, 3, 4, 5].map((i) => ({
          id: `pile${i}`,
          src: "s02/asset_acetaldehyde_molecule_v01",
          x: NODE.mid - (i % 3) * 86,
          y: NODE.y + (i < 3 ? 0 : 92),
          h: 104,
          enter: "NONE" as const,
          z: 20,
        })),
      ],
    },
    {
      id: "2.13",
      anchor: "Roughly five hundred and sixty million",
      note: "BEAT A giant 560M -> BEAT B map. SCIENCE GATE: BRAKE-POPULATION-560M",
      layers: [
        { id: "stat", kind: "number", text: "560M", x: 960, y: 520, enter: "POP", until: 1.6, props: { size: 300 } },
        { id: "map", src: "s02/asset_world_map_v01", x: 860, y: 560, w: 1300, enter: "FADE", delay: 1.2 },
        { id: "stat2", kind: "text", text: "560M", x: 1640, y: 320, enter: "POP", delay: 1.65, props: { size: 120 } },
        { id: "gate", kind: "text", text: "SOURCE PENDING", x: 1640, y: 430, enter: "FADE", delay: 1.9, props: { size: 32, color: COLORS.orange } },
      ],
    },
    {
      id: "2.14",
      anchor: "carriers are far less likely",
      note: "metaphor canvas — reused in 2.19",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", x: 380, y: 720, h: 500, enter: "POP", state: "ALIVE" },
        { id: "beer", src: "s02/asset_beer_glass_v01", x: 660, y: 650, h: 230, enter: "FADE" },
        { id: "brake", src: "s02/asset_brake_pedal_v01", x: 1340, y: 600, h: 420, enter: "POP", delay: 0.3, state: "ACTIVE" },
      ],
    },
    {
      id: "2.15",
      anchor: "Drinking is unpleasant",
      note: "beer slides away from the character",
      layers: [
        { id: "stick", src: "s02/stick_push_away_v01", x: 380, y: 720, h: 500, enter: "NONE", state: "ALIVE" },
        { id: "beer", src: "s02/asset_beer_glass_v01", x: 660, y: 650, h: 230, enter: "NONE", props: { toX: 840, travel: 1.0 } },
        { id: "brake", src: "s02/asset_brake_pedal_v01", x: 1340, y: 600, h: 420, enter: "NONE" },
      ],
    },
    {
      id: "2.16",
      anchor: "A brake installed at the factory",
      note: "everything recedes; pedal is the only focal point",
      layers: [
        { id: "stick", src: "s02/stick_push_away_v01", x: 380, y: 720, h: 500, enter: "NONE", opacity: 0.3 },
        { id: "beer", src: "s02/asset_beer_glass_v01", x: 840, y: 650, h: 230, enter: "NONE", opacity: 0.3 },
        { id: "brake", src: "s02/asset_brake_pedal_v01", x: 1200, y: 560, h: 480, enter: "NONE", state: "ACTIVE" },
        { id: "ring", kind: "ring", x: 1200, y: 560, w: 620, enter: "DRAW", delay: 0.2, opacity: 0.85 },
        { id: "label", kind: "text", text: "BRAKE", x: 1200, y: 220, enter: "POP", delay: 0.3, props: { size: 110 } },
      ],
    },
    {
      id: "2.17",
      anchor: "Now the part that matters",
      note: "tonal turn — clean Fine Print card",
      layers: [
        { id: "card", kind: "card", text: "FINE PRINT", x: 960, y: 520, w: 1000, h: 400, enter: "POP", props: { variant: "fineprint", color: COLORS.orange } },
        { id: "stick", src: "s02/stick_stand_deadpan_v01", x: 250, y: 860, h: 280, enter: "FADE", state: "ALIVE" },
      ],
    },
    {
      id: "2.18",
      anchor: "it's a recognized carcinogen",
      note: "single-focal warning. SCIENCE GATE: BRAKE-CARCINOGEN",
      layers: [
        { id: "mol", src: "s02/asset_acetaldehyde_molecule_v01", x: 960, y: 520, h: 420, enter: "POP" },
        { id: "halo", kind: "warning", x: 960, y: 520, w: 640, enter: "POP", delay: 0.2, state: "ACTIVE", z: 5 },
      ],
    },
    {
      id: "2.19",
      anchor: "Carriers who drink regularly anyway",
      note: "same metaphor geometry, broken-brake state",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", x: 380, y: 720, h: 500, enter: "FADE", state: "ALIVE" },
        { id: "beer", src: "s02/asset_beer_glass_v01", x: 620, y: 650, h: 230, enter: "FADE" },
        { id: "brake", src: "s02/asset_brake_pedal_broken_v01", x: 1340, y: 600, h: 420, enter: "POP", state: "ACTIVE" },
      ],
    },
    {
      id: "2.20",
      anchor: "have a substantially higher risk",
      note: "EvidenceChip stays blank until the ledger passes",
      layers: [
        { id: "stick", src: "s02/stick_stand_deadpan_v01", x: 380, y: 720, h: 500, enter: "NONE", opacity: 0.5 },
        { id: "brake", src: "s02/asset_brake_pedal_broken_v01", x: 1340, y: 600, h: 420, enter: "NONE", opacity: 0.5 },
        { id: "chip", kind: "card", text: "EVIDENCE\nPENDING", x: 1300, y: 830, w: 620, h: 220, enter: "POP", props: { variant: "open", size: 46, color: COLORS.grey } },
      ],
    },
    {
      id: "2.21",
      anchor: "So this one isn't a superpower",
      note: "compress the section into one icon",
      layers: [
        { id: "light", src: "s02/asset_warning_light_v01", x: 960, y: 500, h: 460, enter: "POP", state: "ACTIVE" },
        { id: "stick", src: "s02/stick_realize_v01", x: 300, y: 830, h: 300, enter: "FADE", delay: 0.4, state: "ALIVE" },
      ],
    },
    {
      id: "2.22",
      anchor: "If you flush",
      push: 4,
      note: "mirror callback — reflection is the same pose, flipped",
      layers: [
        { id: "stick", src: "s02/stick_look_mirror_v01", x: 600, y: 700, h: 570, enter: "FADE", state: "ALIVE" },
        { id: "mirror", src: "s02/asset_mirror_v01", x: 1320, y: 560, h: 620, enter: "FADE" },
        { id: "refl", src: "s02/stick_look_mirror_v01", x: 1320, y: 600, h: 430, enter: "FADE", delay: 0.3, scaleX: -1, opacity: 0.9, z: 20 },
        { id: "flush", kind: "card", x: 1320, y: 470, w: 120, h: 120, enter: "FADE", delay: 0.5, opacity: 0.35, props: { variant: "flush" }, z: 25 },
        { id: "flush2", kind: "card", x: 600, y: 520, w: 130, h: 130, enter: "FADE", delay: 0.5, opacity: 0.32, props: { variant: "flush" }, z: 25 },
      ],
    },
    {
      id: "2.T",
      note: "2 / 7",
      hold: 2.0,
      layers: [
        {
          id: "windows",
          kind: "windows",
          x: 960,
          y: 520,
          enter: "FADE",
          props: {
            open: [1, 2],
            lit: [],
            pulse: 3,
            icons: { 1: "s01/asset_deodorant_v01", 2: "s02/asset_brake_pedal_v01" },
          },
        },
        { id: "done", kind: "text", text: "2 / 7", x: 960, y: 760, enter: "FADE", delay: 0.4, props: { size: 54, color: COLORS.grey } },
      ],
    },
  ],
};
