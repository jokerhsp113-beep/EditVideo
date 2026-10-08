import React, { useCallback, useEffect, useState } from "react";
import type { Caption } from "@remotion/captions";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { Captions } from "./Captions";
import { LayerView } from "./Layer";
import { resolveShots } from "./shots";
import { COLORS, body } from "./theme";
import type { ResolvedShot, SectionTimeline } from "./types";
import { TIMELINES } from "./timeline";

const Shot: React.FC<{ shot: ResolvedShot; captionsEnd: number; instant?: boolean }> = ({
  shot,
  instant,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const push = shot.push ?? 0;
  const baseIndex = shot.layers.findIndex((l) => !l.at && !l.delay);
  const dur = ((shot.endMs - shot.startMs) / 1000) * fps;
  const scale = push ? interpolate(frame, [0, dur], [1, 1 + push / 100], { extrapolateRight: "clamp" }) : 1;

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {shot.layers.map((layer, index) => {
        let enterMs = shot.startMs + (layer.delay ?? 0) * 1000;
        if (layer.at) {
          const hit = shot.wordMs(layer.at);
          if (hit !== null) enterMs = hit;
        }
        const enterFrame = Math.round(((enterMs - shot.startMs) / 1000) * fps);

        // A shot must have something on screen on its own first frame. The base
        // layer (first one that neither waits for a phrase nor has a delay) is
        // therefore composed instantly — FADE and DRAW both start invisible and
        // would otherwise flash white for a frame or two at every cut.
        const isBase = index === baseIndex;
        const fadesIn = layer.enter === "FADE" || layer.enter === "DRAW";
        const resolved =
          isBase && (instant || fadesIn) ? { ...layer, enter: "NONE" as const } : layer;

        return <LayerView key={layer.id} layer={resolved} enterFrame={Math.max(0, enterFrame)} />;
      })}
    </AbsoluteFill>
  );
};

const ShotDebug: React.FC<{ shots: ResolvedShot[]; timeline: SectionTimeline }> = ({ shots, timeline }) => {
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

export const BiySection: React.FC<{
  section: string;
  showCaptions?: boolean;
  debug?: boolean;
}> = ({ section, showCaptions = false, debug = false }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender(`captions-${section}`));
  const timeline = TIMELINES[section];

  const load = useCallback(async () => {
    try {
      const res = await fetch(staticFile(`biy/captions/s${section}.json`));
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

  // narration starts after a short pad: the ElevenLabs files have ~0.05s of
  // lead-in, which is not enough room for the opening beat of a section.
  const lead = timeline.leadInMs ?? 300;
  const leadFrames = Math.round((lead / 1000) * fps);
  const shots = resolveShots(timeline, captions, ((durationInFrames - leadFrames) / fps) * 1000);

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Sequence from={leadFrames} name="voiceover">
        <Audio src={staticFile(timeline.audio)} />
      </Sequence>
      {shots.map((shot, index) => {
        // Each shot runs until the NEXT shot's start frame. Rounding start and
        // duration separately leaves one-frame holes between sequences, which
        // render as white flashes.
        const startFrame = (i: number) =>
          i === 0 ? 0 : Math.round((shots[i].startMs / 1000) * fps) + leadFrames;
        const closing = index === shots.length - 1;
        const from = startFrame(index);
        const duration = closing
          ? Math.max(1, durationInFrames - from) // hold through the gap between items
          : Math.max(1, startFrame(index + 1) - from);
        return (
          <Sequence key={shot.id} from={from} durationInFrames={duration} name={shot.id}>
            <Shot shot={shot} captionsEnd={captions[captions.length - 1].endMs} instant={index === 0} />
          </Sequence>
        );
      })}
      {showCaptions ? (
        <Sequence from={leadFrames} name="captions">
          <Captions captions={captions} />
        </Sequence>
      ) : null}
      {debug ? <ShotDebug shots={shots} timeline={timeline} /> : null}
    </AbsoluteFill>
  );
};
