# Runtime and timing

The version-1 contract lives in `professional-editor/engine/types.ts` and `edit-plan.schema.json`. The executable compiler is `core.mjs`, shared by the CLI and renderer; use `compilePlan` rather than duplicating anchor/timing logic.

## Supported features

- Frame cues are integer positions. Scene frame cues are global; action frame cues are local to the scene.
- Anchor cues refer to the plan's word captions in global time. Repeated phrases require an explicit one-based occurrence. Offsets are integer frames. Missing or ambiguous anchors fail validation.
- Scenes are contiguous with explicit duration. No implicit scene overlap, gap fill or timing fallback is permitted.
- `carryFrom` names the previous scene. It carries layer states at its last displayed frame; a supplied layer of the same ID replaces the inherited definition.
- Layers support image, text, rectangle, ellipse and attached connection; parent coordinates are measured from the parent's top-left content box. Pivot points are normalized 0..1. Parent cycles fail validation.
- `approach` targets a stationary layer in the same parent coordinate system. For moving targets, author an explicit move or extend the engine with tests; do not claim pursuit is supported.
- Position actions for one subject cannot overlap. Action types are move, approach, reject, reveal, emphasize and rotate. Entrances and camera movement are explicit, with no automatic pop, wobble or pulse.
- Camera endpoints use a centre point and scale. Connection endpoints follow parent transforms, pivot, rotation and scale.
- Audio tracks have explicit trim, range, role, fade and gain. Music/ambience may duck under voice. This simple envelope is not a mastering chain or an automatic loudness limiter.

## Production changes

Preserve narration timing when using anchor cues. After trimming or retiming narration, regenerate or remap captions and revalidate. Never merely reuse captions from the old recording.

Legacy `biy`, `biy2` and `VideoComposition*` remain available. The new engine does not transparently implement every legacy `code_*` widget. Migrate one reviewed scene at a time by retaining its intent, matching source timings, and implementing required widgets explicitly. Do not silently drop unknown layers.

New engine changes require meaningful tests for boundaries, continuity, anchors, geometry or audio. Keep all animation frame-driven. No CSS transitions, wall-clock timing or unseeded randomness.

The example preview CLI supports the registered demo IDs. Custom projects can be registered as another Composition using `compilePlan` and `PlanView`, then rendered through the normal Remotion entrypoint. See the repo README.
