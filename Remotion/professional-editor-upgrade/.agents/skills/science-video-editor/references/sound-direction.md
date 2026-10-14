# Sound direction

Read the script and watch the motion before choosing sounds. Each track's `reason` should identify a physical action, perceptual emphasis, environment or narrative need. Silence is a valid decision.

## Roles

Voice carries comprehension. Music supports the arc; ambience establishes a relevant environment; foley suggests a shown action; accents emphasize selected moments. Avoid accenting every layer arrival. A repeated synthesized pop with pitch changes is not a varied sound library.

`public/sfx/pop.wav`, `chime.wav`, and `whoosh.wav`, if present, are flagged as placeholders by this repo's catalog based on the existing generator. Drafts may use them with a warning. Finals cannot.

The new visual studies intentionally have no narration, music or SFX. Do not label them as fully mixed production samples. Replacement audio requires actual source media and a verified usage basis. Do not download or purchase packs without an appropriate task and authorization.

## Mix and verification

Work from speech intelligibility at normal playback level. Trim tails deliberately, fade to prevent abrupt cuts, and lower competing music under voice. Consider timing and frequency masking rather than relying only on scalar volume.

The engine applies frame-based fades and an optional 12 dB voice duck with short attack/release. It does not infer speech pauses from waveforms or perform EQ/compression/limiting. Measure the rendered sum: separately safe tracks can still clip when mixed.

`node professional-editor/tools/analyze-audio.mjs <render-or-audio> <report.json>` measures integrated loudness, range and true peak without changing the source. Its -16 LUFS / -1 dBTP values are internal starting references, not universal platform requirements.

Listen to the complete changed segment, its joins, and the mix on ordinary speakers or headphones when playback is available. If only numerical measurements were obtained, record listening as pending. A silent draft legitimately uses `audio: not-applicable`; a final with audio cannot.
