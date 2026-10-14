import React from "react";
import {
  AbsoluteFill, Audio, Easing, Img, Sequence,
  interpolate, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import {handwriting} from "./design/typography";
import manifestJson from "./data/manifest_shots_video004.json";

const INK = "#1A1A1A";
const ACCENT = "#F2CE73"; // vàng bơ — chữ ký kênh. Dùng làm gạch nhấn mảnh, KHÔNG dùng làm khung đầy
const PAPER = "#FFFFFF";
const SANS = handwriting;
const HAND = handwriting;

type Motion = {
  type: "STATIC" | "PUNCH" | "SLOW" | "DRIFT" | "CHAIN";
  zoomFrom: number; zoomTo: number; panFromX: number; panToX: number;
  rotateTo: number; overshoot: number;
};
type ChainMove = { zoomFrom: number; zoomTo: number; panToX: number; pos: number; len: number } | null;
type TextOverlay = {
  show: boolean; kind: "term" | "cite" | null; text: string | null; sub: string | null;
  dx?: number; dy?: number; tilt?: number; inFrames?: number; outFrames?: number;
};
type Flash = { peak: number; frames: number } | null;
type SectionLabelCue = { beat: string; label: string; atSeconds: number; frames: number; place: "bl" | "tl"; tilt: number };
type Transition = { type: "CUT" | "DISSOLVE"; frames: number; why: string };

type Shot = {
  shotId: string; assetId: string; beatId: string; imageFile: string;
  shotSize: string; cameraAngle: string; lumen: string; description: string;
  tone: "HOOK" | "STANDARD" | "SOMBER" | "OUTRO";
  scaledStart: number; scaledDuration: number; scaledEnd: number;
  renderStart: number; renderDuration: number;
  transition: Transition; motion: Motion; chainMove: ChainMove;
  textOverlay: TextOverlay; wantsFlash: boolean; flash: Flash; isMilestone: boolean;
};
type SfxCue = { id: string; type: string; file: string; atSeconds: number; durationSeconds: number; playbackRate: number; volume: number; shotId: string };
// one VO file split at its splice points, so the inserted silences are real
type VoSegment = { id: string; file: string; trimBefore: number; trimAfter: number; startSeconds: number };
type Breath = { beat: string; startSeconds: number; durationSeconds: number; lift: number };
type MusicCfg = { file: string; durationSeconds: number; duckVolume: number; somberDuckVolume: number; rampSeconds: number; edgeFadeSeconds: number; crossfadeSeconds: number };

const manifest = manifestJson as unknown as {
  shots: Shot[]; sfxCues: SfxCue[];
  _meta: {
    audioFiles: string[]; fileOffset: Record<string, number>;
    voSegments: VoSegment[]; breaths: Breath[];
    totalRealDurationSeconds: number;
    beatStart: Record<string, number>; beatEnd: Record<string, number>;
    somberBeats: string[];
    sectionLabels: SectionLabelCue[];
    music: MusicCfg;
  };
};

const shots = manifest.shots;
const sfxCues = manifest.sfxCues ?? [];
const M = manifest._meta;
const totalDuration = M.totalRealDurationSeconds;
const somberStart = M.beatStart["B31"];
const somberEnd = M.beatEnd["B38"];

// ─────────────────────────────────────────────────────────────────
// Text overlays.
//
// LEGIBILITY RULE (hard): ink-coloured type is NEVER painted straight onto the
// artwork. The frames are white paper with heavy black line art, so a black
// caption laid over a character or a dense diagram simply disappears. Every
// treatment therefore sits on an opaque paper plate.
//
// The plates are deliberately three DIFFERENT objects — a bordered card, a
// torn strip, a bar with an ink spine — so guaranteeing legibility does not
// turn into one recurring lower-third widget, which is its own tool tell.
// ─────────────────────────────────────────────────────────────────
const PLATE_SHADOW = "none";

const TextCard: React.FC<{ o: TextOverlay; localFrame: number; holdFrames: number }> = ({ o, localFrame, holdFrames }) => {
  if (!o.show || !o.text) return null;
  const fIn = o.inFrames ?? 11;
  const fOut = o.outFrames ?? 10;
  const inn = interpolate(localFrame, [0, fIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const out = interpolate(localFrame, [holdFrames - fOut, holdFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(inn, out);
  if (op <= 0) return null;
  const dx = o.dx ?? 0, dy = o.dy ?? 0, tilt = o.tilt ?? 0;

  if (o.kind === "term") {
    // bordered card, bottom-left, accent spine on the left edge
    return (
      <div style={{
        position: "absolute", left: 88 + dx, bottom: 104 - dy, opacity: op,
        transform: `translateY(${(1 - inn) * 18}px) rotate(${tilt}deg)`, transformOrigin: "left bottom",
        display: "flex", background: PAPER, border: `4px solid ${INK}`, borderRadius: 14,
        overflow: "hidden", boxShadow: PLATE_SHADOW,
      }}>
        <div style={{ width: 12, background: ACCENT }} />
        <div style={{ padding: "14px 30px 16px 22px" }}>
          <div style={{ fontFamily: HAND, fontSize: 46, color: INK, lineHeight: 1.05 }}>{o.text}</div>
          {o.sub && <div style={{ fontFamily: SANS, fontSize: 21, fontWeight: 400, color: "#4A4A4A", marginTop: 6 }}>{o.sub}</div>}
        </div>
      </div>
    );
  }
  // citation — quiet, but on its own paper strip so it survives a dark frame.
  // Borderless with an ink rule across the top: reads as a different object
  // from the term card even though both are white plates.
  return (
    <div style={{
      position: "absolute", right: 92 - dx, bottom: 96 - dy, opacity: op,
      transform: `translateX(${(1 - inn) * 16}px) rotate(${tilt}deg)`, transformOrigin: "right bottom",
      background: PAPER, padding: "11px 20px 12px", borderTop: `3px solid ${INK}`, boxShadow: PLATE_SHADOW,
    }}>
      <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 400, letterSpacing: 1.1, color: "#3A3A3A", textTransform: "uppercase" }}>{o.text}</div>
    </div>
  );
};

const SectionLabel: React.FC<{ cue: SectionLabelCue }> = ({ cue }) => {
  const frame = useCurrentFrame();
  const hold = cue.frames;
  const inn = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [hold - 16, hold], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The plate wipes open and the type follows 3 frames behind, so it reads as
  // the card sliding out from under the words. Any bigger delay and the plate
  // is visibly an empty white box first, which looks like a rendering glitch.
  const plate = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const wipe = interpolate(frame, [3, 21], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const op = Math.min(inn, out);
  const pos = cue.place === "tl" ? { top: 132 } : { bottom: 168 };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 88, ...pos, opacity: op,
        transform: `rotate(${cue.tilt}deg)`, transformOrigin: "left center",
        display: "flex", alignItems: "stretch", background: PAPER, boxShadow: PLATE_SHADOW,
        clipPath: `inset(0 ${(1 - plate) * 100}% 0 0)`,
      }}>
        <div style={{ width: 10, background: INK }} />
        <div style={{ padding: "10px 34px 14px 22px" }}>
          <div style={{ height: 5, width: 150 * wipe, background: ACCENT, marginBottom: 10 }} />
          <div style={{ fontFamily: HAND, fontSize: 58, color: INK, lineHeight: 1.05, whiteSpace: "nowrap", clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>{cue.label}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────
const ShotLayer: React.FC<{ shot: Shot }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const preRoll = Math.round((shot.scaledStart - shot.renderStart) * fps);
  const coreFrame = frame - preRoll;
  const coreFrames = Math.max(1, Math.round(shot.scaledDuration * fps));
  const totalFrames = Math.max(1, Math.round(shot.renderDuration * fps));
  const m = shot.motion;

  let scale = 1, tx = 0, rot = 0;
  const cm = shot.chainMove;
  if (cm && cm.len > 1) {
    // ONE continuous camera move spread across the whole locked chain, so a
    // multi-step diagram build reads as a single push instead of N restarts
    const p0 = cm.pos / cm.len, p1 = (cm.pos + 1) / cm.len;
    const zf = cm.zoomFrom + (cm.zoomTo - cm.zoomFrom) * p0;
    const zt = cm.zoomFrom + (cm.zoomTo - cm.zoomFrom) * p1;
    scale = interpolate(frame, [0, totalFrames], [zf, zt], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    tx = interpolate(frame, [0, totalFrames], [cm.panToX * p0, cm.panToX * p1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (m.type === "PUNCH") {
    // hold a beat, then snap past the target and settle back — hand-keyframed feel
    const hold = 4;
    const punch = Math.max(6, coreFrames * 0.28);
    scale = interpolate(coreFrame, [hold, hold + punch * 0.62, hold + punch], [m.zoomFrom, m.zoomTo * (1 + m.overshoot), m.zoomTo],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    rot = interpolate(coreFrame, [hold, hold + punch], [0, m.rotateTo], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  } else if (m.type !== "STATIC") {
    scale = interpolate(frame, [0, totalFrames], [m.zoomFrom, m.zoomTo], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
    tx = interpolate(frame, [0, totalFrames], [m.panFromX, m.panToX], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
  }

  const opacity = preRoll > 0
    ? interpolate(frame, [0, preRoll], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) })
    : 1;

  // peak + length come from the manifest so no two flashes are the same shape
  const flash = shot.flash
    ? interpolate(coreFrame, [0, shot.flash.frames], [shot.flash.peak, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity }}>
      <Img src={staticFile(`images_video004/${shot.imageFile}`)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale}) translateX(${tx}px) rotate(${rot}deg)` }} />
      {flash > 0 && <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} />}
      <TextCard o={shot.textOverlay} localFrame={coreFrame} holdFrames={coreFrames} />
    </AbsoluteFill>
  );
};

// One unchanging vignette held for nine and a half minutes reads as a filter
// switched on once. This one breathes on a slow ~40s cycle and closes in
// through the somber section, the way a grade would be pushed by hand.
const Vignette: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const breathe = 0.105 + 0.022 * Math.sin((t / 40) * Math.PI * 2);
  const somber = t >= somberStart - 2 && t <= somberEnd + 2 ? 1 : 0;
  const depth = breathe + somber * 0.055;
  const inner = 62 - somber * 7;
  return (
    <AbsoluteFill style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) ${inner}%, rgba(0,0,0,${depth.toFixed(3)}) 100%)`,
    }} />
  );
};

// music: quieter still through the somber section, and it OPENS UP into the
// silences between sections — with no voice to duck against, holding the bed
// down would make the pause read as a dropout instead of a beat of rest.
// The B31 breath is flagged lift:0 on purpose: the floor should fall out there.
function breathLiftAt(t: number) {
  for (const b of M.breaths) {
    if (!b.lift) continue;
    const s = b.startSeconds, e = s + b.durationSeconds;
    if (t < s - 0.35 || t > e + 0.35) continue;
    const up = interpolate(t, [s - 0.35, s + 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
    const down = interpolate(t, [e - 0.2, e + 0.35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
    return Math.min(up, down);
  }
  return 0;
}

function musicVolumeAt(t: number, cfg: MusicCfg) {
  const inSomber = t >= somberStart - cfg.rampSeconds && t <= somberEnd + cfg.rampSeconds;
  let target = inSomber ? cfg.somberDuckVolume : cfg.duckVolume;
  target *= 1 + 0.75 * breathLiftAt(t);
  if (t < cfg.edgeFadeSeconds) target *= t / cfg.edgeFadeSeconds;
  const left = totalDuration - t;
  if (left < cfg.edgeFadeSeconds) target *= Math.max(0, left / cfg.edgeFadeSeconds);
  return Math.max(0, target);
}

const MusicLayer: React.FC = () => {
  const { fps } = useVideoConfig();
  const cfg = M.music;
  const loop = Math.round(cfg.durationSeconds * fps);
  const total = Math.round(totalDuration * fps);
  // Loops overlap and equal-power crossfade instead of butting end to end,
  // which used to leave an audible restart at every loop point.
  const xf = Math.max(1, Math.round(cfg.crossfadeSeconds * fps));
  const step = Math.max(1, loop - xf);
  const n = Math.ceil(total / step);
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const from = i * step;
        const dur = Math.min(loop, total - from);
        if (dur <= 0) return null;
        const off = from / fps;
        const fadeIn = i > 0;
        const fadeOut = from + loop <= total;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} name={`MUSIC_${i}`}>
            <Audio
              src={staticFile(`music/${cfg.file}`)}
              volume={(f: number) => {
                let env = 1;
                if (fadeIn && f < xf) env *= Math.sin((f / xf) * (Math.PI / 2));
                if (fadeOut && f > loop - xf) env *= Math.cos(((f - (loop - xf)) / xf) * (Math.PI / 2));
                return musicVolumeAt(off + f / fps, cfg) * Math.max(0, env);
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};

export const InsideTheBodyVideo004: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff" }}>
      {shots.map((s) => (
        <Sequence key={s.shotId}
          from={Math.round(s.renderStart * fps)}
          durationInFrames={Math.max(1, Math.round(s.renderDuration * fps))}
          name={`${s.shotId} ${s.beatId} [${s.transition.type}/${s.motion.type}]`}>
          <ShotLayer shot={s} />
        </Sequence>
      ))}
      <MusicLayer />
      <Vignette />
      {M.sectionLabels.map((sl) => (
        <Sequence key={sl.beat} from={Math.max(0, Math.round(sl.atSeconds * fps))} durationInFrames={sl.frames} name={`LABEL_${sl.beat}`}>
          <SectionLabel cue={sl} />
        </Sequence>
      ))}
      {M.voSegments.map((v) => (
        <Sequence key={v.id}
          from={Math.round(v.startSeconds * fps)}
          durationInFrames={Math.max(1, Math.round((v.trimAfter - v.trimBefore) * fps))}
          name={`VO_${v.id}`}>
          <Audio src={staticFile(`audio_video004/${v.file}`)}
            trimBefore={Math.round(v.trimBefore * fps)}
            trimAfter={Math.round(v.trimAfter * fps)} />
        </Sequence>
      ))}
      {sfxCues.map((c) => (
        <Sequence key={c.id} from={Math.round(c.atSeconds * fps)}
          durationInFrames={Math.max(1, Math.round(c.durationSeconds * fps))} name={`SFX_${c.type}_${c.shotId}`}>
          <Audio src={staticFile(`sfx/${c.file}`)} volume={() => c.volume} playbackRate={c.playbackRate} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
