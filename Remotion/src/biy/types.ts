export type Enter = "POP" | "DRAW" | "SLIDE" | "FADE" | "NONE";
export type Attention = "STATIC" | "ALIVE" | "ACTIVE";

export type LayerKind =
  | "image"
  | "text"
  | "card"
  | "number"
  | "grid"
  | "windows"
  | "columns"
  | "gauge"
  | "scale"
  | "bodyWindow"
  | "strike"
  | "bubble"
  | "odor"
  | "slash"
  | "arrow"
  | "dot"
  | "tether"
  | "warning"
  | "ring";

export type Layer = {
  id: string;
  kind?: LayerKind;
  /** asset path under public/biy/assets, e.g. "s01/stick_calm_v01" */
  src?: string;
  text?: string;
  x: number;
  y: number;
  /** target height (images) — width is derived from the asset's aspect ratio */
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
  /** seconds after the shot starts; layer disappears then */
  until?: number;
  state?: Attention;
  props?: Record<string, unknown>;
};

export type Shot = {
  id: string;
  /** first words of this shot's narration — resolved against the captions */
  anchor?: string;
  /** seconds; only for shots with no narration of their own (e.g. x.T) */
  hold?: number;
  /** slow camera push, in percent over the shot */
  push?: number;
  layers: Layer[];
  note?: string;
};

export type SectionTimeline = {
  id: string;
  title: string;
  audio: string;
  captions: string;
  /** silence before the narration starts, so the opening beat has room */
  leadInMs?: number;
  shots: Shot[];
};

export type ResolvedShot = Shot & {
  startMs: number;
  endMs: number;
  anchorResolved: boolean;
  /** resolve a phrase inside this shot to ms; null when not found */
  wordMs: (phrase: string) => number | null;
};
