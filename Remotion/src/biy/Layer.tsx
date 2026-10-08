import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, assetPath, headline } from "./theme";
import type { Layer } from "./types";
import {
  Arrow,
  BalanceScale,
  BodyWindow,
  Card,
  ComparisonColumns,
  ForceGauge,
  GlowDot,
  OdorLines,
  Ring,
  Slash,
  StickGrid,
  Strike,
  Tether,
  ThoughtBubble,
  WarningHalo,
  WindowProgress,
} from "./Widgets";

const seeded = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h / 997;
};

/** enter animation + attention state, applied to any layer */
const useLayerMotion = (layer: Layer, enterFrame: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - enterFrame;
  const enter = layer.enter ?? "POP";

  let opacity = local < 0 ? 0 : 1;
  let scale = 1;
  let dx = 0;
  let dy = 0;
  let clip: string | undefined;

  if (local >= 0) {
    if (enter === "POP") {
      // never start fully transparent: when every layer of a shot pops at once,
      // a 0-opacity first frame reads as a one-frame white flash
      const s = spring({ frame: local, fps, config: { damping: 14, mass: 0.5 } });
      scale = interpolate(s, [0, 1], [0.82, 1]);
      opacity = interpolate(local, [0, 3], [0.55, 1], { extrapolateRight: "clamp" });
    } else if (enter === "SLIDE") {
      const s = spring({ frame: local, fps, config: { damping: 18, mass: 0.6 } });
      dx = interpolate(s, [0, 1], [90, 0]);
      opacity = interpolate(local, [0, 4], [0.5, 1], { extrapolateRight: "clamp" });
    } else if (enter === "DRAW") {
      const p = interpolate(local, [0, 8], [0, 100], { extrapolateRight: "clamp" });
      clip = `inset(0 ${100 - p}% 0 0)`;
    } else if (enter === "FADE") {
      opacity = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
    }
  }

  // travel: layer walks from its position toward toX/toY over travelSeconds
  const p = (layer.props ?? {}) as { toX?: number; toY?: number; travel?: number };
  if (p.toX !== undefined || p.toY !== undefined) {
    const t = interpolate(local, [0, (p.travel ?? 0.8) * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const ease = t * t * (3 - 2 * t);
    dx += ((p.toX ?? layer.x) - layer.x) * ease;
    dy += ((p.toY ?? layer.y) - layer.y) * ease;
  }

  // attention state
  let rot = 0;
  const state = layer.state ?? "STATIC";
  if (state === "ALIVE") {
    const phase = seeded(layer.id) * Math.PI * 2;
    const cycle = 1.4 + seeded(layer.id) * 0.4;
    const t = (frame / fps) * ((Math.PI * 2) / cycle) + phase;
    rot = Math.sin(t) * 0.35;
    scale *= 1 + Math.sin(t * 0.9) * 0.005;
  } else if (state === "ACTIVE" && local >= 0) {
    const pulse = interpolate(local, [0, 6, 14], [1, 1.06, 1], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    });
    scale *= pulse;
  }

  return {
    opacity: opacity * (layer.opacity ?? 1),
    transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${(layer.rotate ?? 0) + rot}deg) scale(${scale}) scaleX(${layer.scaleX ?? 1})`,
    clipPath: clip,
  };
};

const Inner: React.FC<{ layer: Layer }> = ({ layer }) => {
  const p = (layer.props ?? {}) as Record<string, never>;
  switch (layer.kind ?? "image") {
    case "image":
      return (
        <Img
          src={staticFile(assetPath(layer.src as string))}
          style={{
            height: layer.h ? `${layer.h}px` : undefined,
            width: layer.w ? `${layer.w}px` : undefined,
            display: "block",
          }}
        />
      );
    case "text":
    case "number":
      return (
        <div
          style={{
            fontFamily: headline,
            fontSize: (p as { size?: number }).size ?? (layer.kind === "number" ? 380 : 120),
            color: (p as { color?: string }).color ?? COLORS.ink,
            WebkitTextStroke: (p as { stroke?: number }).stroke
              ? `${(p as { stroke?: number }).stroke}px ${COLORS.ink}`
              : undefined,
            letterSpacing: 2,
            whiteSpace: "pre",
            textAlign: "center",
            lineHeight: 1.05,
          }}
        >
          {layer.text}
        </div>
      );
    case "card":
      return <Card layer={layer} />;
    case "windows":
      return <WindowProgress layer={layer} />;
    case "grid":
      return <StickGrid layer={layer} />;
    case "columns":
      return <ComparisonColumns layer={layer} />;
    case "gauge":
      return <ForceGauge layer={layer} />;
    case "scale":
      return <BalanceScale layer={layer} />;
    case "bodyWindow":
      return <BodyWindow layer={layer} />;
    case "strike":
      return <Strike layer={layer} />;
    case "bubble":
      return <ThoughtBubble layer={layer} />;
    case "odor":
      return <OdorLines layer={layer} />;
    case "slash":
      return <Slash layer={layer} />;
    case "arrow":
      return <Arrow layer={layer} />;
    case "dot":
      return <GlowDot layer={layer} />;
    case "tether":
      return <Tether layer={layer} />;
    case "warning":
      return <WarningHalo layer={layer} />;
    case "ring":
      return <Ring layer={layer} />;
    default:
      return null;
  }
};

export const LayerView: React.FC<{ layer: Layer; enterFrame: number }> = ({ layer, enterFrame }) => {
  const style = useLayerMotion(layer, enterFrame);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < enterFrame) return null;
  if (layer.until !== undefined && frame > enterFrame + layer.until * fps) return null;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: layer.x,
          top: layer.y,
          zIndex: layer.z ?? 10,
          ...style,
        }}
      >
        <Inner layer={layer} />
      </div>
    </AbsoluteFill>
  );
};
