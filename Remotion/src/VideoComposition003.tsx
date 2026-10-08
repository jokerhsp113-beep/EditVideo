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
import manifestJson from "./data/manifest_shots_video003.json";
import type { Motion, TextOverlay, ChartOverlay, Idle, Transition } from "./VideoComposition";

const { fontFamily: handwrittenFont } = loadHandwrittenFont();
const ACCENT = "#F2CE73";
const PUNCH_FRACTION = 0.25;
const EASE = Easing.inOut(Easing.ease);
// Title cards start at the box-boundary shot's renderStart (see
// add-editorial-treatment-v3.mjs) — i.e. right as that shot's crossfade
// pre-roll begins — so the opaque card hides the whole dissolve instead of
// letting it play visible (two unrelated images ghosted together) before the
// card appears. This also naturally gives the cut a human, slightly-early
// "J-cut" feel rather than landing exactly on the measured word.
const TITLE_CARD_TOTAL_FRAMES = 110; // ~3.7s total — comfortable reading time

export type Shot003 = {
  shotId: string;
  assetId: string;
  beatId: string;
  box: string;
  shotRole: string;
  scriptText: string;
  imageFile: string;
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

type BoxTitleCard = {
  box: string;
  rank: number;
  totalRanks: number;
  title: string;
  pct: string;
  atSeconds: number;
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
  shots: Shot003[];
  sfxCues: SfxCue[];
  boxTitleCards: BoxTitleCard[];
  _meta: {
    audioFiles: string[];
    fileOffset: Record<string, number>;
    totalRealDurationSeconds: number;
    music?: MusicConfig;
  };
};

export const shots: Shot003[] = manifest.shots;
const sfxCues: SfxCue[] = manifest.sfxCues ?? [];
const boxTitleCards: BoxTitleCard[] = manifest.boxTitleCards ?? [];
const music = manifest._meta.music;
const totalDurationSeconds = manifest._meta.totalRealDurationSeconds;
const AUDIO_FILES = manifest._meta.audioFiles;
const FILE_OFFSET = manifest._meta.fileOffset;
const SFX_VOLUME = 0.45;

// ---- text overlay (citation cards) — identical visual language to Video002 ----
const TextOverlayCard: React.FC<{ overlay: TextOverlay; localFrame: number }> = ({
  overlay,
  localFrame,
}) => {
  if (!overlay.show || !overlay.text) return null;
  const enter = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 64,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 24}px)`,
        background: "#ffffff",
        border: "4px solid #111111",
        borderRadius: 16,
        padding: "14px 28px",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontWeight: 800,
        fontSize: 26,
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
  if (!chart || chart.type !== "pie") return null;
  const grow = interpolate(localFrame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
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
          fontSize: 20,
          color: "#111111",
          marginTop: 4,
        }}
      >
        {chart.label}
      </div>
    </div>
  );
};

const ShotLayer: React.FC<{ shot: Shot003 }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInFrames = Math.round(
    (shot.renderStart < shot.scaledStart ? shot.scaledStart - shot.renderStart : 0) * fps,
  );
  const totalFrames = Math.max(1, Math.round(shot.renderDuration * fps));
  const coreFrame = frame - fadeInFrames;
  const coreDurationFrames = Math.max(1, Math.round(shot.scaledDuration * fps));

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

  let translateY = 0;
  if (shot.idle.type !== "NONE") {
    const osc = Math.sin((frame / fps / shot.idle.periodSeconds) * 2 * Math.PI);
    if (shot.idle.axis === "scale") scale *= 1 + osc * shot.idle.amplitude;
    else if (shot.idle.axis === "translateY") translateY = osc * shot.idle.amplitude;
    else if (shot.idle.axis === "rotate") rotate += osc * shot.idle.amplitude;
  }

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
    else clipPath = `inset(${100 - p}% 0 0 0)`;
  }

  const wantsFlash = shot.tag === "GAG" || shot.tag === "HERO";
  const flashOpacity = wantsFlash
    ? interpolate(coreFrame, [0, 5], [0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity, clipPath }}>
      <Img
        src={staticFile(`images_video003/${shot.imageFile}`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
        }}
      />
      {flashOpacity > 0 && <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashOpacity }} />}
      <TextOverlayCard overlay={shot.textOverlay} localFrame={coreFrame} />
      <ChartOverlayWidget chart={shot.chartOverlay} localFrame={coreFrame} />
    </AbsoluteFill>
  );
};

// 9-segment progress bar (8 ranked boxes + the off-chart Bombay bonus box,
// styled distinctly since the script frames it as "on no chart").
const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowSeconds = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", gap: 6, padding: "0 24px" }}>
        {boxTitleCards.map((card) => {
          const reached = nowSeconds >= card.atSeconds;
          const isBonus = card.box === "BOMBAY";
          return (
            <div
              key={card.box}
              style={{
                flex: 1,
                height: 8,
                background: reached ? ACCENT : "rgba(17,17,17,0.12)",
                border: isBonus && !reached ? "1px dashed #111111" : "none",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const BoxTitleCardLayer: React.FC<{ card: BoxTitleCard }> = ({ card }) => {
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
    <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32, transform: `translateX(${slide}px)` }}>
        <div
          style={{
            fontFamily: handwrittenFont,
            fontSize: card.box === "BOMBAY" ? 140 : 200,
            color: "#111111",
            lineHeight: 1,
            transform: "rotate(-3deg)",
          }}
        >
          {card.box === "BOMBAY" ? "?" : String(card.rank).padStart(2, "0")}
        </div>
        <div style={{ width: 6, height: 180, background: ACCENT }} />
        <div style={{ fontFamily: handwrittenFont, fontSize: 60, color: "#111111", maxWidth: 640, lineHeight: 1.15, transform: "rotate(1deg)" }}>
          {card.title}
          <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 22, fontWeight: 700, color: "#666666", marginTop: 14, letterSpacing: 2 }}>
            {card.box === "BOMBAY" ? "OFF THE CHART" : `${card.pct} OF THE WORLD`}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Flat duck: constant quiet level under the (continuous, gapless) narration,
// with only edge fades at the very start/end of the video. Video003's audio
// has its breathing pauses baked in via SSML <break> tags already, so unlike
// Video002 there's no separate silence window to swing the music open into.
function duckVolumeAt(tSeconds: number, cfg: MusicConfig): number {
  let target = cfg.duckVolume;
  if (tSeconds < cfg.edgeFadeSeconds) target *= tSeconds / cfg.edgeFadeSeconds;
  const remaining = totalDurationSeconds - tSeconds;
  if (remaining < cfg.edgeFadeSeconds) target *= Math.max(0, remaining / cfg.edgeFadeSeconds);
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
          <Sequence key={i} from={fromFrame} durationInFrames={durationInFrames} name={`MUSIC_loop${i}`}>
            <Audio src={staticFile(`music/${cfg.file}`)} volume={(f: number) => duckVolumeAt(offsetSeconds + f / fps, cfg)} />
          </Sequence>
        );
      })}
    </>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.14) 100%)" }}
  />
);

export const InsideTheBodyVideo003: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      {shots.map((shot) => (
        <Sequence
          key={shot.shotId}
          from={Math.round(shot.renderStart * fps)}
          durationInFrames={Math.max(1, Math.round(shot.renderDuration * fps))}
          name={`${shot.shotId} (${shot.beatId}) [${shot.transition.type}/${shot.motion.type}]`}
        >
          <ShotLayer shot={shot} />
        </Sequence>
      ))}
      <MusicLayer />
      <Vignette />
      <ProgressBar />
      {boxTitleCards.map((card) => (
        <Sequence
          key={card.box}
          from={Math.max(0, Math.round(card.atSeconds * fps))}
          durationInFrames={TITLE_CARD_TOTAL_FRAMES}
          name={`TITLE_CARD_${card.box}`}
        >
          <BoxTitleCardLayer card={card} />
        </Sequence>
      ))}
      {AUDIO_FILES.map((file) => (
        <Sequence
          key={file}
          from={Math.round(FILE_OFFSET[file] * fps)}
          name={`AUDIO_${file}`}
        >
          <Audio src={staticFile(`audio_video003/${file}`)} />
        </Sequence>
      ))}
      {sfxCues.map((cue) => (
        <Sequence
          key={cue.id}
          from={Math.round(cue.atSeconds * fps)}
          durationInFrames={Math.max(1, Math.round(cue.durationSeconds * fps))}
          name={`SFX_${cue.type}_${cue.shotId}`}
        >
          <Audio src={staticFile(`sfx/${cue.file}`)} volume={SFX_VOLUME} playbackRate={cue.playbackRate} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
