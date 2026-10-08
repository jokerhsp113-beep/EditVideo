import { loadFont as loadHeadline } from "@remotion/google-fonts/LuckiestGuy";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";

export const headline = loadHeadline().fontFamily;
export const body = loadBody().fontFamily;

/** Palette from §0 of the production files. */
export const COLORS = {
  bg: "#FFFFF7",
  ink: "#111417",
  red: "#E63946",
  green: "#3BB273",
  teal: "#17BFA6",
  amber: "#FFC53D",
  amberSoft: "#FDE68A",
  grey: "#9AA3A8",
  greyLight: "#D9DDE1",
  greyPale: "#E5E7E9",
  blue: "#BBDDF2",
  skin: "#F0C9A4",
} as const;

export const CANVAS = { width: 1920, height: 1080, fps: 30 } as const;
export const SAFE = { x: 96, y: 54 } as const;

/** Uniform hand-drawn outline weight. Everything code-drawn matches the PNGs. */
export const STROKE = 10;

export const assetPath = (src: string) => `biy2/assets/${src}.png`;

/** The board the whole video is drawn on. */
export const BOARD = "biy2/board.png";
