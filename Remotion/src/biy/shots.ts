import type { Caption } from "@remotion/captions";
import type { ResolvedShot, SectionTimeline, Shot } from "./types";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Flatten captions to single words. One caption can normalise to several words
 * ("Odor-free." -> "odor", "free"), so keep a map back to the caption index.
 */
const flatten = (captions: Caption[]) => {
  const words: string[] = [];
  const owner: number[] = [];
  captions.forEach((c, i) => {
    norm(c.text)
      .split(" ")
      .filter(Boolean)
      .forEach((w) => {
        words.push(w);
        owner.push(i);
      });
  });
  return { words, owner };
};

/** Start time (ms) of the first occurrence of `phrase` in the caption stream. */
export const findPhraseMs = (
  captions: Caption[],
  phrase: string,
  fromMs = 0,
): number | null => {
  const target = norm(phrase).split(" ").filter(Boolean);
  if (target.length === 0) return null;

  const { words, owner } = flatten(captions);
  for (let i = 0; i + target.length <= words.length; i++) {
    if (captions[owner[i]].startMs < fromMs) continue;
    let ok = true;
    for (let k = 0; k < target.length; k++) {
      if (words[i + k] !== target[k]) {
        ok = false;
        break;
      }
    }
    if (ok) return captions[owner[i]].startMs;
  }
  return null;
};

/**
 * Turn authored shots into a timeline with real timings.
 * A shot runs from its anchor phrase until the next shot's anchor.
 * Shots with no anchor use `hold` (seconds) and are appended to the end.
 */
export const resolveShots = (
  timeline: SectionTimeline,
  captions: Caption[],
  audioDurationMs: number,
): ResolvedShot[] => {
  const lastWordEnd = captions.length ? captions[captions.length - 1].endMs : 0;

  const starts: (number | null)[] = [];
  let cursor = 0;
  timeline.shots.forEach((shot: Shot) => {
    if (!shot.anchor) {
      starts.push(null);
      return;
    }
    const ms = findPhraseMs(captions, shot.anchor, cursor);
    if (ms !== null) cursor = ms + 1;
    starts.push(ms);
  });

  // fill unanchored shots: they start where the previous one ends
  const resolved: ResolvedShot[] = [];
  for (let i = 0; i < timeline.shots.length; i++) {
    const shot = timeline.shots[i];
    let startMs = starts[i];
    if (startMs === null) {
      startMs = i === 0 ? 0 : resolved[i - 1].endMs;
    }
    const nextStart = starts.slice(i + 1).find((s) => s !== null) ?? null;
    let endMs: number;
    if (nextStart !== null) {
      endMs = nextStart;
    } else if (shot.hold) {
      endMs = startMs + shot.hold * 1000;
    } else {
      endMs = Math.max(lastWordEnd, audioDurationMs);
    }
    resolved.push({
      ...shot,
      anchorResolved: !shot.anchor || starts[i] !== null,
      startMs,
      endMs: Math.max(endMs, startMs + 200),
      wordMs: (phrase: string) => findPhraseMs(captions, phrase, startMs - 1),
    });
  }

  // the tail shot (x.T) extends to the end of the audio
  const last = resolved[resolved.length - 1];
  if (last && !last.hold) last.endMs = Math.max(last.endMs, audioDurationMs);
  return resolved;
};
