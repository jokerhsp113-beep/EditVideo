import { loadFont as loadHeadline } from "@remotion/google-fonts/LuckiestGuy";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";

export const headline = loadHeadline().fontFamily;
export const body = loadBody().fontFamily;

export const COLORS = {
  bg: "#FFFFFF",
  ink: "#111417",
  red: "#E63946",
  green: "#3BB273",
  teal: "#1FA3A3",
  orange: "#FF8C42",
  yellow: "#FFD23F",
  grey: "#9AA3A8",
  greyLight: "#F2F4F6",
  flush: "#E56B6F",
} as const;

export const CANVAS = { width: 1920, height: 1080, fps: 30 } as const;
export const SAFE = { x: 96, y: 54 } as const;

/** Stick figure heights from the production files. */
export const STICK = { S: 300, M: 560, L: 820 } as const;

export const assetPath = (src: string) => `biy/assets/${src}.png`;
