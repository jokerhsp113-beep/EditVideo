# Medieval Life Explained renderer

## Channel editing upgrade (2026-10-17)

See `channel/medieval/SETUP_AND_UPGRADE_VI.md` for current setup, commands and field semantics, and `channel/medieval/CURRENT_STATE_AND_QA_VI.md` for consolidated status. The generic renderer supports text roles/profile sizing, explicit text layout, keyframes/pivots, parent groups, shot camera transforms, fixed screen overlays and authored audio gain envelopes. `compile-profile.mjs` applies opt-in defaults and compiles action/camera/audio cues; explicit values are preserved. The compiler and wrapper refuse overwrite. `examples/medieval/style-upgrade-v02.input.json` is the current six-second technical demo, not a history episode or artistic pilot. No approved episode is changed. Original minimal-manifest descriptions below describe the baseline; the setup guide and contracts.ts describe the extensions.

Independent composition MEDIEVAL-EPISODE. Existing BIY/InsideTheBody compositions are preserved. Default is a six-second technical fixture, not approved C art or publishable history content.

## Pipeline

Script/claim ledger → video-plan → visual-assets inventory → episode adapter → preflight → draft render → visual/audio QA → final render review. This update supplies a documented normalized manifest and renderer; it does not parse arbitrary storyboard prose automatically. Preserve source claim IDs, reference lineage and QA in an episode sidecar. Renderer input is strictly validated; extra unknown keys fail rather than get silently ignored.

## Commands

```console
node --test scripts/medieval/contracts.test.mjs
node scripts/medieval/preflight.mjs examples/medieval/smoke-props.json
node scripts/medieval/render.mjs examples/medieval/smoke-props.json out/medieval/smoke-v01.mp4
```

Props shape is `{ "episode": ... }`. In Studio, replace episode props; calculateMetadata updates width/height/fps/duration. CLI final preflight adds `--final`; this requires inspected assets, recorded rights status and audio-aligned narration. Status fields are declarations, not proof: preserve actual QA/license evidence in sidecar. Direct Remotion CLI bypasses file/rights/audio preflight, so use the wrapper for delivery renders. Manifest/cue validation still occurs in the renderer.

The wrapper uses src/medieval/index.ts to avoid legacy font loads. MEDIEVAL-EPISODE is also registered in the main Studio root. Set MEDIEVAL_BROWSER_EXECUTABLE to an existing Chromium executable if the default headless download is unavailable. Existing compositions and package versions are not changed.

## Manifest fields

contracts.ts is the single schema/resolver. Required episode identifiers: id, version, scriptVersion, planVersion; canvas and durationInFrames; timingBasis; shots. words/assets/audio may be empty for technical drafts.

Assets: id, relative public file, version, status draft/inspected, rights recorded/unresolved, role. Copy selected images to public/medieval/<episode>/assets/ and map existing asset IDs to their actual paths. Preserve PNG alpha; never pass them through BIY JPEG key/crop scripts by default. Width/height on a layer define its contain box; set crop/baseline consistently across pose swaps and inspect composites. Native text overlays remain editable. No generated rig is assumed.

Shots: id; exactly one of fromFrame (episode frames) or anchor; optional occurrence (1-based); background; nonempty layers. Start at frame zero, increase strictly. Next shot start determines previous shot end; final shot ends at episode duration. An initial layer must be authored explicitly. No layer is pulled early.

Layers: id; kind image/text/rect; x/y center coordinates in canvas pixels; width/height contain box. Images need assetId; text needs text. z, color, scale, rotate optional. Entry is fromFrame (shot-relative frames) or at (phrase in that shot's caption window). Optional occurrence resolves ambiguity. untilFrame is shot-relative exclusive end. enter none/fade and enterFrames; optional motion toX/toY/toScale + durationFrames. No injected pop, pulse, zoom, mascot, subtitle strip or biological hook. For pose swaps, end old layer and start new layer on the same frame. A fade may intentionally start transparent; keep another layer for orientation.

Word timings: text/startMs/endMs correspond to actual chosen narration timeline including inserted pauses. Estimated words are permitted only in clearly marked drafts. Ambiguous or missing cues fail; no fallback. Cues cannot look ahead into another shot. If audio changes, regenerate words/duration and preflight.

Audio clips: id/file/role voice/music/sfx, fromFrame (episode), durationFrames, trimBeforeFrames (source), volume [0,1], fadeFrames, loop (music only), rights recorded/unresolved. Final preflight requires recorded audio rights too. No automatic VO speed-up, pause removal or beat-based ducking. Author music volumes explicitly. Looping may have audible seams; supply an edited seamless loop or separate authored clips. SFX and music rights remain separate from image rights.

## Channel visual/edit direction

Use inspected C references and episode-specific historical art. Recurring guide costume differs from sourced historical costume. Warm background/muted blue here are provisional defaults; tune to selected art. Following the Video003 typography review, editable channel text now uses the bundled Patrick Hand font and waits for its local font loader; do not use text baked into old Arial PNGs. Match ordinary-action scenes, object mechanisms, maps/evidence and reactions to the script. Quiet explanatory holds are valid. Learn these explanatory functions from competitor analysis, not their specific drawings/jokes/brand.

Full-frame colored backgrounds, cutouts and diagrams can coexist. Detailed character joint animation, automatic paragraph-to-shot adaptation, automatic caption generation and a generic widget catalogue are not supplied in this module. Do not call its technical fixture a finished channel video.

## Video003 revision v02

VIDEO003-REVISION is registered in the channel Studio alongside the generic renderer. Its native SVG cards use measured Patrick Hand text, explicit word cues, outlined InkArrow connectors and selected camera/diagram motion. It preserves the original narration words while using a 7% tempo increase only in the first 32.94 source seconds. The nine authored sound cues and their rationale are recorded in examples/medieval/video003-v02-audit.json.

The approved master is D:/Youtube/Medieval Life Explained/videos/Video003/02_PLAN/EDIT_PLAN_APPROVED.json. The approved video is in that episode's 06_PUBLISH folder. Run node scripts/medieval/sync-video003-current.mjs to stage its 118 images and five edited audio files into public/medieval/video003/current and refresh the Studio props. The compiler scripts/medieval/build-video003-v02.py can regenerate the same native plan from retained source timing, ASR and 13 SVG geometry inputs; the cleanup rebuild was checked against the approved plan for exact equality. Render with node scripts/medieval/render-video003-v02.mjs --video. The older rough cuts and caches are outside the active master in a recoverable cleanup holding folder, awaiting permanent-deletion approval.
