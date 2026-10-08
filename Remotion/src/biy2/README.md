# BIY Video002 — pipeline

Nine narrated sections, 181 shots, built from the production markdown in
`C:\Work\Youtube\Built Into You\Video002\Create_data`. Nothing here has a
hand-written timecode: every shot is anchored to a phrase in the narration and
resolved at render time against word-level captions.

## Build order

```bash
python scripts/biy2/build_assets.py     # JPEG -> keyed PNG in public/biy2/assets
python scripts/biy2/tighten_vo.py       # shorter pauses + 1.07x tempo -> audio_tight/
python scripts/biy2/make_captions.py    # word timings -> public/biy2/captions/sNN.json
python scripts/biy2/build_timeline.py   # production .md -> src/biy2/timeline/sNN.ts
python scripts/biy2/check_timeline.py   # every anchor exists in the recording
python scripts/biy2/check_layout.py     # safe area, stray marks, overlaps, thin shots
npx remotion render BIY2-FULL out/biy2/BIY2-V002-full.mp4
python scripts/biy2/check_ink.py out/biy2/BIY2-V002-full.mp4
```

Re-recording the voiceover only means re-running `make_captions.py`. The
timeline does not change.

## Things that will bite you

**The generator stamps a sparkle into the bottom-right corner of every source
JPEG.** It keys as real content and then defeats the autocrop, which is how
every asset in Video001 ended up 22% too small. `build_assets.py` blanks that
corner before keying. Do not remove that step.

**Four B-numbers name two different assets.** B11 is the receipt in section 00
and a rain cloud in 01; B37, B68 and B69 collide the same way. The asset library
is therefore keyed by name, never by code, and `build_assets.py` reads the
declarations out of the markdown to get the names.

**Production x,y are not always frame coordinates.** The cold open and several
mechanism beats were written for a camera sliding across a canvas wider than
1920px. `compose()` in `build_timeline.py` recentres those shots, scales up
beats that would otherwise be a speck, pulls apart stacked subjects and snaps
verdict marks onto whatever they are judging.

**The layer that enters first is not always the subject.** A trail of dots or a
tick mark can carry the smallest enter time; if it were treated as the shot's
base layer the first frame would look empty. `BiySection.tsx` picks the first
*subject* and pulls that to frame 0.

**A shot runs until the next shot's start frame.** Rounding start and duration
separately leaves one-frame holes between sequences, which render as flashes of
bare background.

**The production files describe one continuous scene per section, not a series
of separate frames.** Cue sheets routinely open with `SHOT START | giữ` or
`không clear`, meaning the previous beat is still on screen. Rebuilding every
shot from nothing leaves those continuations showing one arrow on an empty
background — section 01 was blank for four seconds because of it.
`carry_forward()` gives a shot that draws less than 5% of the frame on its own
the previous shot's subjects, underneath and already composed.

**A widget with nothing written in it draws nothing, but still counts as the
shot's first layer** — so the renderer holds an empty frame waiting for it.
Cards, chips and labels with no wording are dropped when the timeline is built.
Their wording arrives as `props.text`; `words()` in Widgets.tsx is the single
place that reads it, because an earlier version read `props.value` and silently
rendered every labelled chip as nothing.

## Pace

ElevenLabs left 291 pauses over 0.25s — 161s of silence. `tighten_vo.py` cuts
every silent run to a 0.24s breath and speeds the result to 1.07× with WSOLA
(tempo, not pitch). The original mp3s are never touched. Every cut is logged
and the Whisper word timings are carried through the same edit, so nothing is
re-transcribed; checked against a fresh transcription the error is 11ms median.
Each join overlaps by one 12ms crossfade — leave that out of the remap and the
timings drift ~0.3s by the end of a two-minute chunk.

`check_pace.py` measures the picture the same way: every moment something new
arrives, and every stretch past 2.5s where nothing does.

## Direction (`direct.py`)

Runs after layout, with the real word timings:

- **swap** — artwork that arrives on top of other artwork *replaces* it (the old
  one shrinks out as the new one pops in). Code widgets never trigger a swap:
  rays landing on the sun annotate it; treating that as a replacement deleted
  the sun.
- **connect** — `code_arrow` is re-drawn to the exact gap between the two
  subjects either side of it; up/down arrows attach to the top edge of their
  target; rings are sized to what they encircle and kept on screen; carrier
  dots become marked people in the crowd grid instead of a dot in its middle.
- **beats** — wherever the production file leaves more than ~2s with nothing
  new, the camera bumps in 3.5% on a real word and the focal subject pulses.
- **cuts** — a whip only on a genuine change of scene (nothing in common with
  the previous shot); a zoom-settle from 130% opens each item.

The shot's base layer (pulled to frame 0) is the largest subject that does not
wait for a word — §0.10, the scene exists before the line. Only if everything
waits is the largest subject pulled forward.

## Widgets

`Widgets.tsx` draws the 60-odd `code_*` assets the production files specify.
Five of them shipped as real PNGs instead (`code_mark_x`, `code_mark_tick`,
`code_mark_tick_grey`, `code_price_tag`, `code_window_*`); `Layer.tsx` routes
those to the artwork so the marks match the rest of the frame. Anything the
registry does not know renders as a visible red stub — a missing widget must
never read as an empty frame.
