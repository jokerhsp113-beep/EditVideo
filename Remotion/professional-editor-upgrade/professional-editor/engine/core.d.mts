import type { Asset, AudioTrack, CaptionWord, CompiledPlan, CompiledScene, Cue, EditPlan, Issue, Layer, LayerState } from "./types";
export function validatePlan(input: unknown): Issue[];
export function parsePlan(input: unknown): EditPlan;
export function resolveCue(cue: Cue, captions: CaptionWord[], fps: number): number;
export function compilePlan(plan: EditPlan): CompiledPlan;
export function layerState(scene: CompiledScene, layer: Layer, frame: number): LayerState;
export function worldPoint(scene: CompiledScene, layerId: string, point: {x: number; y: number}, frame: number): {x: number; y: number};
export function audioGain(track: AudioTrack, frame: number, tracks: AudioTrack[], fps: number): number;
export function validateAssets(plan: CompiledPlan, assets: Asset[]): Issue[];
