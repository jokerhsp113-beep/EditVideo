export type CaptionWord = { text: string; startMs: number; endMs: number };
export type Cue = { frame: number } | { anchor: string; occurrence?: number; offsetFrames?: number };
export type Layer = {
  id: string;
  kind: "image" | "text" | "rect" | "ellipse" | "connection";
  x: number; y: number; width: number; height: number;
  assetId?: string; text?: string; parentId?: string;
  z?: number; rotate?: number; scale?: number; opacity?: number;
  pivot?: { x: number; y: number };
  fill?: string; stroke?: string; strokeWidth?: number; radius?: number;
  fontSize?: number; weight?: number; align?: "left" | "center" | "right";
  fromId?: string; toId?: string; fromPoint?: { x: number; y: number }; toPoint?: { x: number; y: number };
};
export type Action = {
  id: string; subject: string;
  type: "move" | "approach" | "reject" | "reveal" | "emphasize" | "rotate";
  start: Cue; durationFrames: number; reason: string;
  target?: string; to?: { x: number; y: number }; offset?: { x: number; y: number };
  amount?: number; ease?: "linear" | "smooth" | "out";
};
export type Scene = {
  id: string; purpose: "hook" | "mechanism" | "comparison" | "evidence" | "summary";
  takeaway: string; start: Cue; durationFrames: number; holdReason: string;
  carryFrom?: string; layers: Layer[]; actions: Action[];
  camera?: { from: { x: number; y: number; scale: number }; to: { x: number; y: number; scale: number } };
};
export type AudioTrack = {
  id: string; assetId: string; role: "voice" | "music" | "ambience" | "foley" | "accent";
  startFrame: number; durationFrames: number; trimBeforeFrames?: number;
  gainDb: number; fadeInFrames: number; fadeOutFrames: number;
  duckUnderVoice?: boolean; reason: string;
};
export type EditPlan = {
  schemaVersion: 1; id: string; title: string; status: "draft" | "review" | "final";
  fps: number; width: number; height: number; durationFrames: number;
  profile: "biy-science"; intent: string; captions?: CaptionWord[];
  scenes: Scene[]; audio: AudioTrack[];
  review: { visual: "pending" | "passed"; audio: "pending" | "passed" | "not-applicable"; notes: string[] };
};
export type CompiledAction = Action & { startFrame: number };
export type CompiledScene = Omit<Scene, "actions"> & { from: number; actions: CompiledAction[] };
export type CompiledPlan = Omit<EditPlan, "scenes"> & { scenes: CompiledScene[] };
export type Asset = {
  id: string; path: string; mediaType: "image" | "audio" | "video";
  sha256: string; width?: number; height?: number; durationSeconds?: number;
  status: "draft" | "approved" | "rejected"; style: string;
  provenance: { source: string | null; license: string | null };
  flags: string[];
};
export type LayerState = { x: number; y: number; scale: number; rotate: number; opacity: number };
export type Issue = { severity: "error" | "warning"; code: string; location: string; message: string };
