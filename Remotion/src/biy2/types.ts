export type Enter = "POP" | "DRAW" | "SLIDE" | "FADE" | "NONE";
export type Attention = "STATIC" | "ALIVE" | "ACTIVE";

/**
 * `kind` is either a built-in ("image", "text") or the name of a code asset as
 * the production files spell it (`code_threshold_bar`). Widgets.tsx owns the
 * registry; anything it does not know renders as a visible red stub so a
 * missing widget can never read as a blank frame.
 */
export type Layer = {
  id: string;
  kind?: string;
  /** asset name under public/biy2/assets, without the .png */
  src?: string;
  text?: string;
  x: number;
  y: number;
  h?: number;
  w?: number;
  z?: number;
  rotate?: number;
  opacity?: number;
  scaleX?: number;
  enter?: Enter;
  /** phrase in the narration this layer enters on; overrides `delay` */
  at?: string;
  /** seconds after the shot starts */
  delay?: number;
  /** seconds after the layer enters; it disappears then */
  until?: number;
  state?: Attention;
  /** id of the layer whose arrival replaces this one — it leaves as that enters */
  exitOn?: string;
  props?: Record<string, unknown>;
};

export type Shot = {
  id: string;
  /** first words of this shot's narration — resolved against the captions */
  anchor?: string;
  /** seconds; only for shots with no narration of their own (x.T tails) */
  hold?: number;
  /** slow camera push, in percent over the shot */
  push?: number;
  /** phrases where the camera punches in and the focal subject pulses */
  beats?: string[];
  /** how the shot arrives: a whip for a new scene, a zoom-settle for a new item */
  transition?: "whip" | "zoom";
  layers: Layer[];
  note?: string;
};

export type SectionTimeline = {
  id: string;
  title: string;
  audio: string;
  captions: string;
  leadInMs?: number;
  shots: Shot[];
};

export type ResolvedShot = Shot & {
  startMs: number;
  endMs: number;
  anchorResolved: boolean;
  wordMs: (phrase: string) => number | null;
};
