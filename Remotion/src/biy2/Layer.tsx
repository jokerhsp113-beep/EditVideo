import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, assetPath, headline } from "./theme";
import type { Layer } from "./types";
import { Widget } from "./Widgets";

/**
 * Code assets that shipped as rendered PNGs (C1-C5) rather than as drawings.
 * Using the real artwork keeps the marks identical to the rest of the frame.
 */
const IMAGE_CODES: Record<string, string> = {
  code_mark_x: "code_mark_x",
  code_mark_tick: "code_mark_tick",
  code_mark_tick_grey: "code_mark_tick_grey",
  code_price_tag: "code_price_tag",
};

const seeded = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h / 997;
};

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
      // a 0-opacity first frame reads as a one-frame flash of bare background
      const s = spring({ frame: local, fps, config: { damping: 14, mass: 0.5 } });
      scale = interpolate(s, [0, 1], [0.82, 1]);
      opacity = interpolate(local, [0, 3], [0.55, 1], { extrapolateRight: "clamp" });
    } else if (enter === "SLIDE") {
      const s = spring({ frame: local, fps, config: { damping: 18, mass: 0.6 } });
      dx = interpolate(s, [0, 1], [90, 0]);
      opacity = interpolate(local, [0, 4], [0.5, 1], { extrapolateRight: "clamp" });
    } else if (enter === "DRAW") {
      const g = interpolate(local, [0, 8], [0, 100], { extrapolateRight: "clamp" });
      clip = `inset(0 ${100 - g}% 0 0)`;
    } else if (enter === "FADE") {
      opacity = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
    }
  }

  const props = (layer.props ?? {}) as { toX?: number; toY?: number; travel?: number };
  if (props.toX !== undefined || props.toY !== undefined) {
    const t = interpolate(local, [0, (props.travel ?? 0.8) * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const ease = t * t * (3 - 2 * t);
    dx += ((props.toX ?? layer.x) - layer.x) * ease;
    dy += ((props.toY ?? layer.y) - layer.y) * ease;
  }

  let rot = 0;
  const state = layer.state ?? "STATIC";
  if (state === "ALIVE") {
    const phase = seeded(layer.id) * Math.PI * 2;
    const cycle = 1.4 + seeded(layer.id) * 0.4;
    const t = (frame / fps) * ((Math.PI * 2) / cycle) + phase;
    rot = Math.sin(t) * 0.35;
    scale *= 1 + Math.sin(t * 0.9) * 0.005;
  } else if (state === "ACTIVE" && local >= 0) {
    scale *= interpolate(local, [0, 6, 14], [1, 1.06, 1], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    });
  }

  return {
    opacity: opacity * (layer.opacity ?? 1),
    transform:
      `translate(-50%, -50%) translate(${dx}px, ${dy}px) ` +
      `rotate(${(layer.rotate ?? 0) + rot}deg) scale(${scale}) scaleX(${layer.scaleX ?? 1})`,
    clipPath: clip,
  };
};

const Inner: React.FC<{ layer: Layer }> = ({ layer }) => {
  const kind = layer.kind ?? "image";

  if (kind === "image" || layer.src) {
    return (
      <Img
        src={staticFile(assetPath(layer.src as string))}
        style={{
          height: layer.h ? `${layer.h}px` : undefined,
          width: layer.h ? undefined : `${layer.w ?? 300}px`,
          display: "block",
        }}
      />
    );
  }

  if (kind === "text") {
    const props = (layer.props ?? {}) as { size?: number; color?: string };
    return (
      <div
        style={{
          fontFamily: headline,
          fontSize: props.size ?? (layer.h ? layer.h * 0.8 : 110),
          color: props.color ?? COLORS.ink,
          letterSpacing: 2,
          whiteSpace: "pre",
          textAlign: "center",
          lineHeight: 1.05,
        }}
      >
        {layer.text}
      </div>
    );
  }

  if (kind === "code_window") {
    const state = ((layer.props ?? {}) as { state?: string }).state ?? "open";
    const d = layer.w ?? layer.h ?? 132;
    return (
      <Img
        src={staticFile(assetPath(`code_window_${state}`))}
        style={{ width: d, height: d, display: "block" }}
      />
    );
  }

  if (IMAGE_CODES[kind]) {
    return (
      <Img
        src={staticFile(assetPath(IMAGE_CODES[kind]))}
        style={{
          height: layer.h ? `${layer.h}px` : undefined,
          width: layer.h ? undefined : `${layer.w ?? 140}px`,
          display: "block",
        }}
      />
    );
  }

  return <Widget layer={layer} />;
};

const EXIT_FRAMES = 7;

export const LayerView: React.FC<{
  layer: Layer;
  enterFrame: number;
  /** frame at which something else replaces this layer */
  exitFrame?: number;
  /** frames on which this layer pulses with the camera beat */
  pulses?: number[];
}> = ({ layer, enterFrame, exitFrame, pulses }) => {
  const style = useLayerMotion(layer, enterFrame);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < enterFrame) return null;
  if (layer.until !== undefined && frame > enterFrame + layer.until * fps) return null;

  // Replaced, not overlaid: shrink and fade out while the successor pops in.
  let exitOpacity = 1;
  let exitScale = 1;
  if (exitFrame !== undefined && exitFrame > enterFrame && frame >= exitFrame) {
    const t = (frame - exitFrame) / EXIT_FRAMES;
    if (t >= 1) return null;
    exitOpacity = 1 - t;
    exitScale = 1 - 0.12 * t;
  }

  // Beat pulse on the focal subject, in step with the camera bump.
  let pulse = 1;
  for (const b of pulses ?? []) {
    const t = frame - b;
    if (t >= 0 && t <= 14) {
      pulse = Math.max(pulse, interpolate(t, [0, 5, 14], [1, 1.07, 1]));
    }
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: layer.x,
          top: layer.y,
          zIndex: layer.z ?? 10,
          ...style,
          opacity: style.opacity * exitOpacity,
          transform: `${style.transform} scale(${exitScale * pulse})`,
        }}
      >
        <Inner layer={layer} />
      </div>
    </AbsoluteFill>
  );
};
