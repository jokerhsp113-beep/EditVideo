import React, { useCallback, useEffect, useState } from "react";
import type { Caption } from "@remotion/captions";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { LayerView } from "./Layer";
import {
  CaptionStrip,
  GuideReaction,
  HookOverlay,
  RetentionBackground,
  SectionChrome,
} from "./Retention";
import { resolveShots } from "./shots";
import { BOARD, COLORS, body } from "./theme";
import type { ResolvedShot, SectionTimeline } from "./types";
import { TIMELINES } from "./timeline";

const Shot: React.FC<{
  shot: ResolvedShot;
  section: string;
  index: number;
  instant?: boolean;
}> = ({ shot, section, index, instant }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const push = shot.push ?? 0;
  const dur = ((shot.endMs - shot.startMs) / 1000) * fps;

  const enterFrames = shot.layers.map((layer) => {
    let enterMs = shot.startMs + (layer.delay ?? 0) * 1000;
    if (layer.at) {
      const hit = shot.wordMs(layer.at);
      if (hit !== null) enterMs = hit;
    }
    return Math.max(0, Math.round(((enterMs - shot.startMs) / 1000) * fps));
  });

  // §0.10 of the production files: the scene exists before the line does. So
  // the shot's *largest* subject is pulled to frame 0, not merely its earliest
  // — a 90px peg arriving before the cell it sits on would otherwise be the
  // whole of the first frame.
  const isSubject = (i: number) => {
    const k = shot.layers[i].kind;
    return !k || k === "text" || k === "image" || k === "code_window" || !k.startsWith("code_");
  };
  const area = (i: number) => {
    const l = shot.layers[i];
    return (l.w ?? l.h ?? 300) * (l.h ?? l.w ?? 300);
  };
  const candidates = shot.layers.map((_, i) => i).filter(isSubject);
  // What is already there before anyone speaks is the scene. Only when every
  // subject waits for a word does the largest of them get pulled forward —
  // otherwise a reveal authored for "On that one" would be on screen at frame 0.
  const standing = candidates.filter((i) => !shot.layers[i].at && !shot.layers[i].delay);
  const biggest = (xs: number[]) => Math.max(0, ...xs.map(area));
  // ...unless what stands is a detail — a 90px peg waiting for the 520px cell
  // it belongs to is not a scene, it is a speck on a blank board
  const standingIsDetail = standing.length > 0 && biggest(standing) < 0.25 * biggest(candidates);
  const pool =
    standing.length && !standingIsDetail
      ? standing
      : candidates.length
        ? candidates
        : shot.layers.map((_, i) => i);
  const baseIndex = pool.reduce((a, b) => (area(b) > area(a) ? b : a), pool[0]);
  const earliest = enterFrames[baseIndex];

  // Beats: where the production file leaves the picture still, the camera
  // bumps in on a word and the focal subject pulses with it.
  const beatFrames = (shot.beats ?? [])
    .map((phrase) => shot.wordMs(phrase))
    .filter((ms): ms is number => ms !== null)
    .map((ms) => Math.round(((ms - shot.startMs) / 1000) * fps));
  const bump = beatFrames.reduce((acc, b) => {
    const t = frame - b;
    if (t < 0 || t > 22) return acc;
    const up = interpolate(t, [0, 4, 22], [0, 1, 0], { extrapolateRight: "clamp" });
    return Math.max(acc, up);
  }, 0);

  const pushScale = push
    ? interpolate(frame, [0, dur], [1, 1 + push / 100], { extrapolateRight: "clamp" })
    : 1;

  // How the shot arrives. A whip marks a new scene; a zoom-settle from 130%
  // opens each item (chapter reset A in the production files).
  let arriveX = 0;
  let arriveScale = 1;
  if (shot.transition === "whip") {
    const s = spring({ frame, fps, config: { damping: 20, mass: 0.5 } });
    arriveX = interpolate(s, [0, 1], [160, 0]);
  } else if (shot.transition === "zoom") {
    const s = spring({ frame, fps, config: { damping: 16, mass: 0.7 } });
    arriveScale = interpolate(s, [0, 1], [1.3, 1]);
  }

  // Where does the camera bump towards? The focal subject, so it grows in
  // place instead of sliding off towards an edge.
  const focal = shot.layers[baseIndex];
  const origin = focal ? `${focal.x}px ${focal.y}px` : "50% 50%";
  const scale = pushScale * arriveScale * (1 + bump * 0.035);

  const indexOf = new Map(shot.layers.map((l, i) => [l.id, i]));

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${arriveX}px) scale(${scale})`,
        transformOrigin: origin,
      }}
    >
      {shot.layers.map((layer, index) => {
        const isBase = index === baseIndex;
        const enterFrame = isBase ? 0 : enterFrames[index];
        // FADE and DRAW both start invisible, so the base layer is composed
        // instantly whatever the production file asked for.
        const fadesIn = layer.enter === "FADE" || layer.enter === "DRAW";
        const resolved =
          isBase && (instant || fadesIn || earliest > 0)
            ? { ...layer, enter: "NONE" as const }
            : layer;

        // replaced, not overlaid: leave as the replacement arrives
        const successor = layer.exitOn !== undefined ? indexOf.get(layer.exitOn) : undefined;
        const exitFrame =
          successor !== undefined && successor !== baseIndex ? enterFrames[successor] : undefined;

        return (
          <LayerView
            key={layer.id}
            layer={resolved}
            enterFrame={enterFrame}
            exitFrame={exitFrame}
            pulses={isBase ? beatFrames : undefined}
          />
        );
      })}
      <GuideReaction
        shot={shot}
        section={section}
        index={index}
        durationInFrames={Math.max(1, Math.round(dur))}
      />
    </AbsoluteFill>
  );
};

const ShotDebug: React.FC<{ shots: ResolvedShot[]; timeline: SectionTimeline }> = ({
  shots,
  timeline,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const current = shots.find((s) => ms >= s.startMs && ms < s.endMs);
  const missing = shots.filter((s) => !s.anchorResolved);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          fontFamily: body,
          fontSize: 26,
          color: missing.length ? COLORS.red : COLORS.grey,
        }}
      >
        {timeline.id} · {current ? `${current.id} (${(current.startMs / 1000).toFixed(1)}s)` : "—"}
        {missing.length ? ` · UNRESOLVED: ${missing.map((m) => m.id).join(", ")}` : ""}
      </div>
    </AbsoluteFill>
  );
};

export const BiySection: React.FC<{ section: string; debug?: boolean }> = ({
  section,
  debug = false,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender(`captions-${section}`));
  const timeline = TIMELINES[section];

  const load = useCallback(async () => {
    try {
      const res = await fetch(staticFile(`biy2/captions/s${section}.json`));
      setCaptions((await res.json()) as Caption[]);
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [section, continueRender, cancelRender, handle]);

  useEffect(() => {
    load();
  }, [load]);

  if (!captions || !timeline) return <AbsoluteFill style={{ background: COLORS.bg }} />;

  const lead = timeline.leadInMs ?? 200;
  const leadFrames = Math.round((lead / 1000) * fps);
  const shots = resolveShots(timeline, captions, ((durationInFrames - leadFrames) / fps) * 1000);

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Img
        src={staticFile(BOARD)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <RetentionBackground section={section} />
      <Sequence from={leadFrames} name="voiceover">
        <Audio src={staticFile(timeline.audio)} />
      </Sequence>
      {shots.map((shot, index) => {
        // Each shot runs until the NEXT shot's start frame. Rounding start and
        // duration separately leaves one-frame holes between sequences, which
        // render as flashes of bare background.
        const startFrame = (i: number) =>
          i === 0 ? 0 : Math.round((shots[i].startMs / 1000) * fps) + leadFrames;
        const closing = index === shots.length - 1;
        const from = startFrame(index);
        const duration = closing
          ? Math.max(1, durationInFrames - from)
          : Math.max(1, startFrame(index + 1) - from);
        return (
          <Sequence key={shot.id} from={from} durationInFrames={duration} name={shot.id}>
            <Shot shot={shot} section={section} index={index} instant={index === 0} />
          </Sequence>
        );
      })}
      <HookOverlay enabled={section === "00"} />
      <SectionChrome section={section} />
      <CaptionStrip captions={captions} leadFrames={leadFrames} shots={shots} />
      {debug ? <ShotDebug shots={shots} timeline={timeline} /> : null}
    </AbsoluteFill>
  );
};
