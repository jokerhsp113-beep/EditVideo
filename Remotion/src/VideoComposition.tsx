import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadHandwrittenFont } from "@remotion/google-fonts/PatrickHand";
import manifestJson from "./data/manifest_shots.json";

const { fontFamily: handwrittenFont } = loadHandwrittenFont();

export type Motion = {
  type: "STATIC" | "PUNCH" | "PULL" | "DRIFT" | "SLOW";
  zoomFrom: number;
  zoomTo: number;
  panFromX: number;
  panToX: number;
  rotateTo: number;
};

export type TextOverlay = {
  show: boolean;
  kind: "citation" | "gene" | null;
  text: string | null;
};

export type ChartOverlay =
  | { type: "pie"; sliverDegrees: number; label: string }
  | { type: "bar"; barHeightPct: number; label: string }
  | null;

export type Idle = {
  type: "BREATHE" | "BOB" | "SWAY" | "NONE";
  amplitude: number;
  periodSeconds: number;
  axis: "scale" | "translateY" | "rotate" | "none";
};

export type Transition = {
  type: "CUT" | "DISSOLVE" | "WIPE";
  frames: number;
  direction: "left" | "right" | "up" | "down" | null;
};

export type Shot = {
  shotId: string;
  assetId: string;
  beatId: string;
  beatRole: string;
  section: string;
  scriptText: string;
  imageFile: string;
  audioFile: string;
  audioPlaybackRate: number;
  shotSize: string;
  cameraAngle: string;
  lumen: string;
  tag: string;
  scaledStart: number;
  scaledDuration: number;
  scaledEnd: number;
  fadeInFrames: number;
  renderStart: number;
  renderDuration: number;
  motion: Motion;
  textOverlay: TextOverlay;
  idle: Idle;
  transition: Transition;
  chartOverlay: ChartOverlay;
};

type MucTitleCard = {
  section: string;
  rank: number;
  totalRanks: number;
  title: string;
  atSeconds: number;
};

type SectionBound = {
  start: number;
  end: number;
  audioFile: string;
  audioDurationInFramesForSequence: number;
};

type SfxCue = {
  id: string;
  type: string;
  file: string;
  atSeconds: number;
  durationSeconds: number;
  playbackRate: number;
  shotId: string;
};

type MusicConfig = {
  file: string;
  durationSeconds: number;
  duckVolume: number;
  openVolume: number;
  rampSeconds: number;
  edgeFadeSeconds: number;
};

const manifest = manifestJson as unknown as {
  shots: Shot[];
  sfxCues: SfxCue[];
  mucTitleCards: MucTitleCard[];
  _meta: {
    playbackRate: number;
    sectionBounds: Record<string, SectionBound>;
    totalRealDurationSeconds: number;
    music?: MusicConfig;
  };
};

export const shots: Shot[] = manifest.shots;
const sectionBounds = manifest._meta.sectionBounds;
const playbackRate = manifest._meta.playbackRate;
const sfxCues: SfxCue[] = manifest.sfxCues ?? [];
const mucTitleCards: MucTitleCard[] = manifest.mucTitleCards ?? [];
const music = manifest._meta.music;
const totalDurationSeconds = manifest._meta.totalRealDurationSeconds;
const SFX_VOLUME = 0.45;
const ACCENT = "#F2CE73";

const PUNCH_FRACTION = 0.25; // punch-in reaches its target zoom within the
// first quarter of the shot's *official* (non-pre-roll) duration, then holds
const EASE = Easing.inOut(Easing.ease);

const TextOverlayCard: React.FC<{ overlay: TextOverlay; localFrame: number }> = ({
  overlay,
  localFrame,
}) => {
  if (!overlay.show || !overlay.text) return null;
  const enter = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isGene = overlay.kind === "gene";
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 64,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 24}px)`,
        background: isGene ? "#F2CE73" : "#ffffff",
        border: "4px solid #111111",
        borderRadius: 16,
        padding: isGene ? "10px 28px" : "14px 28px",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontWeight: 800,
        fontSize: isGene ? 36 : 28,
        letterSpacing: isGene ? 2 : 0,
        color: "#111111",
        boxShadow: "6px 6px 0px rgba(0,0,0,0.15)",
      }}
    >
      {overlay.text}
    </div>
  );
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function pieSlicePath(cx: number, cy: number, r: number, degrees: number) {
  if (degrees <= 0) return "";
  const end = polarToCartesian(cx, cy, r, degrees);
  const start = polarToCartesian(cx, cy, r, 0);
  const largeArc = degrees > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

const ChartOverlayWidget: React.FC<{ chart: ChartOverlay; localFrame: number }> = ({
  chart,
  localFrame,
}) => {
  if (!chart) return null;
  const grow = interpolate(localFrame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  if (chart.type === "pie") {
    const degrees = chart.sliverDegrees * grow;
    return (
      <div style={{ position: "absolute", right: 56, bottom: 56, textAlign: "center" }}>
        <svg width={140} height={140} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={45} fill="#ffffff" stroke="#111111" strokeWidth={4} />
          <path d={pieSlicePath(50, 50, 45, degrees)} fill={ACCENT} stroke="#111111" strokeWidth={2} />
        </svg>
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: "#111111",
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {chart.label}
        </div>
      </div>
    );
  }

  // bar
  const heightPct = Math.min(100, chart.barHeightPct * grow);
  const overflowPct = Math.max(0, chart.barHeightPct * grow - 100);
  return (
    <div
      style={{
        position: "absolute",
        right: 80,
        bottom: 56,
        width: 60,
        height: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          fontWeight: 800,
          fontSize: 16,
          color: "#111111",
          marginBottom: Math.max(0, 40 - overflowPct * 2),
        }}
      >
        {chart.label}
      </div>
      <div
        style={{
          width: "100%",
          flex: 1,
          border: "4px solid #111111",
          borderBottom: "none",
          background: "#ffffff",
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          overflow: "visible",
        }}
      >
        <div
          style={{
            width: "100%",
            height: `${heightPct}%`,
            background: ACCENT,
            border: "3px solid #111111",
            borderBottom: "none",
          }}
        />
      </div>
    </div>
  );
};

const ShotLayer: React.FC<{ shot: Shot; index: number }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInFrames = Math.round(
    (shot.renderStart < shot.scaledStart
      ? shot.scaledStart - shot.renderStart
      : 0) * fps,
  );
  const totalFrames = Math.max(1, Math.round(shot.renderDuration * fps));
  // frame relative to the shot's *official* start (0 = scaledStart), so
  // punch-in timing lines up with the beat, not with the crossfade pre-roll.
  const coreFrame = frame - fadeInFrames;
  const coreDurationFrames = Math.max(
    1,
    Math.round(shot.scaledDuration * fps),
  );

  const { motion } = shot;
  let scale: number;
  let translateX: number;
  let rotate: number;

  if (motion.type === "PUNCH") {
    const punchFrames = Math.max(1, coreDurationFrames * PUNCH_FRACTION);
    scale = interpolate(coreFrame, [0, punchFrames], [motion.zoomFrom, motion.zoomTo], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    rotate = interpolate(coreFrame, [0, punchFrames], [0, motion.rotateTo], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    translateX = 0;
  } else {
    scale = interpolate(frame, [0, totalFrames], [motion.zoomFrom, motion.zoomTo], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    });
    translateX = interpolate(frame, [0, totalFrames], [motion.panFromX, motion.panToX], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    });
    rotate = 0;
  }

  // Idle motion — varied per-shot (see buildIdle in add-editorial-treatment.mjs):
  // BREATHE pulses scale, BOB sways vertically, SWAY rotates gently, NONE does
  // nothing. Never the same single formula on every shot.
  let translateY = 0;
  if (shot.idle.type !== "NONE") {
    const osc = Math.sin(
      (frame / fps / shot.idle.periodSeconds) * 2 * Math.PI,
    );
    if (shot.idle.axis === "scale") {
      scale *= 1 + osc * shot.idle.amplitude;
    } else if (shot.idle.axis === "translateY") {
      translateY = osc * shot.idle.amplitude;
    } else if (shot.idle.axis === "rotate") {
      rotate += osc * shot.idle.amplitude;
    }
  }

  // Transition in: this shot always sits on top of whatever is already
  // showing (the previous shot needs no change at all), so however this shot
  // reveals itself over `fadeInFrames` is the entire transition.
  //   - CUT: reveal instantly (frames is 0 anyway) — a snap edit.
  //   - DISSOLVE: opacity 0->1 — composite = x*this + (1-x)*prev.
  //   - WIPE: opacity is always 1, but a hard clip-path edge slides across —
  //     wherever it hasn't reached yet, the previous shot shows through.
  const revealProgress =
    fadeInFrames > 0
      ? interpolate(frame, [0, fadeInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        })
      : 1;

  const isWipe = shot.transition.type === "WIPE";
  const opacity = isWipe ? 1 : revealProgress;
  let clipPath: string | undefined;
  if (isWipe) {
    const p = revealProgress * 100;
    const dir = shot.transition.direction;
    if (dir === "right") clipPath = `inset(0 ${100 - p}% 0 0)`;
    else if (dir === "left") clipPath = `inset(0 0 0 ${100 - p}%)`;
    else if (dir === "down") clipPath = `inset(0 0 ${100 - p}% 0)`;
    else clipPath = `inset(${100 - p}% 0 0 0)`; // up
  }

  // Impact flash: a quick white pulse right on the beat for gags and the
  // hero payoff reveal, for a bit of "snap" instead of a plain cut.
  const wantsFlash = shot.tag === "GAG" || shot.shotId === "S114a";
  const flashOpacity = wantsFlash
    ? interpolate(coreFrame, [0, 5], [0.55, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity, clipPath }}>
      <Img
        src={staticFile(`images/${shot.imageFile}`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
        }}
      />
      {flashOpacity > 0 && (
        <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashOpacity }} />
      )}
      <TextOverlayCard overlay={shot.textOverlay} localFrame={coreFrame} />
      <ChartOverlayWidget chart={shot.chartOverlay} localFrame={coreFrame} />
    </AbsoluteFill>
  );
};

// Thin 7-segment progress bar pinned to the top edge — one segment per mục,
// filling glow-yellow the moment that mục starts and staying filled (matches
// the script's own "TÍCH LUỸ" / rising-rarity hook: the viewer should always
// be able to see how many upgrades have been "installed" so far).
const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowSeconds = frame / fps;
  const gap = 6;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          gap,
          padding: "0 24px",
          paddingTop: 0,
        }}
      >
        {mucTitleCards.map((card) => {
          const reached = nowSeconds >= card.atSeconds;
          return (
            <div
              key={card.section}
              style={{
                flex: 1,
                height: 8,
                background: reached ? ACCENT : "rgba(17,17,17,0.12)",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Card Sequence starts at the section-boundary shot's renderStart (i.e. right
// as its crossfade pre-roll begins — see add-editorial-treatment.mjs), so the
// enter ramp only needs to outrun that crossfade (SECTION_TRANSITION_FRAMES =
// 20 frames) before going fully opaque, then it holds long enough to actually
// read the title before releasing to reveal the now-settled new section.
const TITLE_CARD_TOTAL_FRAMES = 110; // ~3.7s total — comfortable reading time
const MucTitleCardLayer: React.FC<{ card: MucTitleCard }> = ({ card }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const exit = interpolate(frame, [90, TITLE_CARD_TOTAL_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const opacity = Math.min(enter, exit);
  const slide = (1 - enter) * 60;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        opacity,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          transform: `translateX(${slide}px)`,
        }}
      >
        <div
          style={{
            fontFamily: handwrittenFont,
            fontWeight: 400,
            fontSize: 240,
            color: "#111111",
            lineHeight: 1,
            transform: "rotate(-3deg)",
          }}
        >
          {String(card.rank).padStart(2, "0")}
        </div>
        <div
          style={{
            width: 6,
            height: 180,
            background: ACCENT,
          }}
        />
        <div
          style={{
            fontFamily: handwrittenFont,
            fontWeight: 400,
            fontSize: 64,
            color: "#111111",
            maxWidth: 640,
            lineHeight: 1.15,
            transform: "rotate(1deg)",
          }}
        >
          {card.title}
          <div
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#666666",
              marginTop: 14,
              letterSpacing: 2,
            }}
          >
            UPGRADE {card.rank} OF {card.totalRanks}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Background-music bed with automatic ducking: quiet under narration, opens
// up during the silence gaps between sections, and fades at the very start
// and end of the video. `music` is undefined until a track has been wired in
// via scripts/add-music-config.mjs, so this whole layer is a no-op until then.
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function duckVolumeAt(tSeconds: number, cfg: MusicConfig): number {
  const { duckVolume, openVolume, rampSeconds, edgeFadeSeconds } = cfg;
  let target = openVolume;
  for (const b of Object.values(sectionBounds)) {
    if (tSeconds >= b.start - rampSeconds && tSeconds <= b.end + rampSeconds) {
      if (tSeconds < b.start) {
        const f = clamp01((tSeconds - (b.start - rampSeconds)) / rampSeconds);
        target = openVolume + (duckVolume - openVolume) * f;
      } else if (tSeconds > b.end) {
        const f = clamp01((tSeconds - b.end) / rampSeconds);
        target = duckVolume + (openVolume - duckVolume) * f;
      } else {
        target = duckVolume;
      }
      break;
    }
  }
  if (tSeconds < edgeFadeSeconds) target *= tSeconds / edgeFadeSeconds;
  const remaining = totalDurationSeconds - tSeconds;
  if (remaining < edgeFadeSeconds) target *= Math.max(0, remaining / edgeFadeSeconds);
  return Math.max(0, target);
}

const MusicLayer: React.FC = () => {
  const { fps } = useVideoConfig();
  if (!music) return null;
  const cfg = music;
  const loopFrames = Math.round(cfg.durationSeconds * fps);
  const totalFrames = Math.round(totalDurationSeconds * fps);
  const numLoops = Math.ceil(totalFrames / loopFrames);

  return (
    <>
      {Array.from({ length: numLoops }).map((_, i) => {
        const fromFrame = i * loopFrames;
        const durationInFrames = Math.min(loopFrames, totalFrames - fromFrame);
        if (durationInFrames <= 0) return null;
        const offsetSeconds = fromFrame / fps;
        return (
          <Sequence
            key={i}
            from={fromFrame}
            durationInFrames={durationInFrames}
            name={`MUSIC_loop${i}`}
          >
            <Audio
              src={staticFile(`music/${cfg.file}`)}
              volume={(f: number) => duckVolumeAt(offsetSeconds + f / fps, cfg)}
            />
          </Sequence>
        );
      })}
    </>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.14) 100%)",
    }}
  />
);

export const InsideTheBodyVideo: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      {shots.map((shot, index) => (
        <Sequence
          key={shot.shotId}
          from={Math.round(shot.renderStart * fps)}
          durationInFrames={Math.max(
            1,
            Math.round(shot.renderDuration * fps),
          )}
          name={`${shot.shotId} (${shot.beatId}) [${shot.transition.type}/${shot.motion.type}]`}
        >
          <ShotLayer shot={shot} index={index} />
        </Sequence>
      ))}
      <MusicLayer />
      <Vignette />
      <ProgressBar />
      {mucTitleCards.map((card) => (
        <Sequence
          key={card.section}
          from={Math.max(0, Math.round(card.atSeconds * fps))}
          durationInFrames={TITLE_CARD_TOTAL_FRAMES}
          name={`TITLE_CARD_${card.section}`}
        >
          <MucTitleCardLayer card={card} />
        </Sequence>
      ))}
      {Object.entries(sectionBounds).map(([section, bound]) => (
        <Sequence
          key={section}
          from={Math.round(bound.start * fps)}
          durationInFrames={bound.audioDurationInFramesForSequence}
          name={`AUDIO_${section}`}
        >
          <Audio
            src={staticFile(`audio/${bound.audioFile}`)}
            playbackRate={playbackRate}
          />
        </Sequence>
      ))}
      {sfxCues.map((cue) => (
        <Sequence
          key={cue.id}
          from={Math.round(cue.atSeconds * fps)}
          durationInFrames={Math.max(1, Math.round(cue.durationSeconds * fps))}
          name={`SFX_${cue.type}_${cue.shotId}`}
        >
          <Audio
            src={staticFile(`sfx/${cue.file}`)}
            volume={SFX_VOLUME}
            playbackRate={cue.playbackRate}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
