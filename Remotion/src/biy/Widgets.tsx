import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, assetPath, body, headline } from "./theme";
import type { Layer } from "./types";

type P = Record<string, unknown>;
const get = <T,>(layer: Layer, key: string, fallback: T): T =>
  ((layer.props ?? {}) as P)[key] === undefined ? fallback : (((layer.props ?? {}) as P)[key] as T);

/** Highlight ring — drawn to an exact diameter so it fits the thing it circles. */
export const Ring: React.FC<{ layer: Layer }> = ({ layer }) => {
  const d = layer.w ?? 230;
  const dashed = get(layer, "dashed", false);
  const stroke = get(layer, "stroke", dashed ? 8 : 10);
  const color = get(layer, "color", dashed ? COLORS.grey : COLORS.orange);
  const frame = useCurrentFrame();
  const circumference = Math.PI * (d - stroke);
  const draw = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <svg width={d} height={d} style={{ overflow: "visible" }}>
      <circle
        cx={d / 2}
        cy={d / 2}
        r={(d - stroke) / 2}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={dashed ? "14 10" : `${circumference * draw} ${circumference}`}
        transform={`rotate(-90 ${d / 2} ${d / 2})`}
        opacity={dashed ? draw : 1}
      />
    </svg>
  );
};

/** Warning halo — curved arcs around a molecule, max two pulses. */
export const WarningHalo: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 240;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 1 + Math.sin(Math.min((frame / fps) * 4, Math.PI * 2)) * 0.05;
  return (
    <svg width={w} height={w} style={{ overflow: "visible", transform: `scale(${pulse})` }}>
      {[0, 1, 2].map((i) => {
        const r = w * (0.34 + i * 0.09);
        return (
          <path
            key={i}
            d={`M ${w / 2 - r} ${w / 2} A ${r} ${r} 0 0 1 ${w / 2 + r} ${w / 2}`}
            fill="none"
            stroke={COLORS.orange}
            strokeWidth={7}
            strokeLinecap="round"
            opacity={0.9 - i * 0.2}
            transform={`rotate(${i * 22} ${w / 2} ${w / 2})`}
          />
        );
      })}
    </svg>
  );
};

/** Fine Print / Open Question / Clue card, plus the flush overlay patch. */
export const Card: React.FC<{ layer: Layer }> = ({ layer }) => {
  const variant = get(layer, "variant", "fineprint") as "fineprint" | "open" | "unfinished" | "flush";
  if (variant === "flush") {
    return (
      <div
        style={{
          width: layer.w ?? 150,
          height: layer.h ?? 150,
          borderRadius: "50%",
          background: COLORS.flush,
          filter: "blur(6px)",
        }}
      />
    );
  }
  const w = layer.w ?? 950;
  const h = layer.h ?? 420;
  const frame = useCurrentFrame();

  const border =
    variant === "open"
      ? { border: `10px dashed ${COLORS.grey}` }
      : { border: `12px solid ${COLORS.orange}` };

  // "unfinished" draws only ~76% of the border and leaves a visible gap
  const unfinished = variant === "unfinished";
  const perimeter = 2 * (w + h);
  // starts part-drawn: a stroke of length zero would leave the frame empty
  const drawn = interpolate(frame, [0, 24], [perimeter * 0.32, perimeter * 0.78], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {unfinished ? (
        <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
          <rect
            x={8}
            y={8}
            width={w - 16}
            height={h - 16}
            rx={28}
            fill="#fff"
            stroke={COLORS.orange}
            strokeWidth={12}
            strokeDasharray={`${drawn} ${perimeter}`}
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: 28, ...border }} />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: headline,
          fontSize: get(layer, "size", 92),
          color: get(layer, "color", COLORS.ink),
          textAlign: "center",
          whiteSpace: "pre-line",
          padding: 40,
        }}
      >
        {layer.text ?? ""}
      </div>
    </div>
  );
};

/** The 7-window progress system used between items. */
export const WindowProgress: React.FC<{ layer: Layer }> = ({ layer }) => {
  const open = get<number[]>(layer, "open", []);
  const lit = get<number[]>(layer, "lit", []);
  const pulse = get<number | null>(layer, "pulse", null);
  const icons = get<Record<string, string>>(layer, "icons", {});
  const d = get(layer, "d", 190);
  const gap = get(layer, "gap", 40);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", gap, alignItems: "center" }}>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => {
        const isOpen = open.includes(i);
        const isLit = lit.includes(i);
        const pulsing = pulse === i;
        const s = pulsing ? 1 + Math.sin((frame / fps) * 6) * 0.04 : 1;
        return (
          <div
            key={i}
            style={{
              width: d,
              height: d,
              borderRadius: "50%",
              border: `6px solid ${COLORS.ink}`,
              background: isLit ? COLORS.yellow : COLORS.greyLight,
              boxShadow: isLit ? `0 0 0 10px rgba(31,163,163,0.25)` : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${s})`,
              overflow: "hidden",
            }}
          >
            {isOpen && icons[i] ? (
              <Img src={staticFile(assetPath(icons[i]))} style={{ height: d * 0.62 }} />
            ) : (
              <svg width={d * 0.62} height={d * 0.3}>
                <path
                  d={`M4 ${d * 0.22} Q ${d * 0.31} ${isOpen ? -d * 0.06 : d * 0.02} ${d * 0.62 - 4} ${d * 0.22}`}
                  fill="none"
                  stroke={COLORS.ink}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                {!isOpen &&
                  [0.22, 0.5, 0.78].map((f, k) => (
                    <line
                      key={k}
                      x1={d * 0.62 * f}
                      y1={d * 0.2}
                      x2={d * 0.62 * f}
                      y2={d * 0.28}
                      stroke={COLORS.ink}
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  ))}
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};

/** One approved Stick pose duplicated into a population grid (never AI-generated). */
export const StickGrid: React.FC<{ layer: Layer }> = ({ layer }) => {
  const cols = get(layer, "cols", 7);
  const rows = get(layer, "rows", 4);
  const cell = get(layer, "cell", 190);
  const dim = get<number[]>(layer, "dim", []);
  const dimOpacity = get(layer, "dimOpacity", 0.35);
  const src = layer.src as string;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: 18 }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} style={{ height: cell, display: "flex", justifyContent: "center" }}>
          <Img
            src={staticFile(assetPath(src))}
            style={{
              height: cell,
              opacity: dim.includes(i) ? dimOpacity : 1,
              filter: dim.includes(i) ? "grayscale(1)" : undefined,
            }}
          />
        </div>
      ))}
    </div>
  );
};

/** Two equal panels: alarm amplitude left/right + item counts. */
export const ComparisonColumns: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 1500;
  const h = layer.h ?? 620;
  const left = get(layer, "left", { alarm: 1, count: 2 }) as { alarm: number; count: number };
  const right = get(layer, "right", { alarm: 0.25, count: 9 }) as { alarm: number; count: number };
  const itemSrc = get(layer, "item", "") as string;
  const frame = useCurrentFrame();

  const panel = (side: { alarm: number; count: number }, key: string) => (
    <div
      key={key}
      style={{
        width: w / 2 - 20,
        height: h,
        border: `6px solid ${COLORS.ink}`,
        borderRadius: 24,
        background: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg width={w / 2 - 20} height={140} style={{ position: "absolute", top: 24 }}>
        {[0, 1, 2].map((i) => {
          const amp = side.alarm * (34 + i * 18);
          const x = (w / 2 - 20) / 2;
          return (
            <path
              key={i}
              d={`M ${x - 30 - i * 26} ${90 - amp * 0.4} Q ${x} ${90 - amp} ${x + 30 + i * 26} ${90 - amp * 0.4}`}
              fill="none"
              stroke={COLORS.orange}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={0.35 + side.alarm * 0.65}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 30,
          right: 30,
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          justifyContent: "center",
        }}
      >
        {itemSrc
          ? Array.from({ length: side.count }).map((_, i) => (
              <Img
                key={i}
                src={staticFile(assetPath(itemSrc))}
                style={{
                  height: 62,
                  opacity: interpolate(frame, [i * 2, i * 2 + 6], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              />
            ))
          : null}
      </div>
    </div>
  );

  return <div style={{ display: "flex", gap: 40, width: w }}>{[panel(left, "l"), panel(right, "r")]}</div>;
};

/** Comparative bars — no numeric values, per the production spec. */
export const ForceGauge: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 1100;
  const top = get(layer, "top", 0.95);
  const bottom = get(layer, "bottom", 0.35);
  const labels = get<[string, string]>(layer, "labels", ["CHIMP", "HUMAN"]);
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const bar = (value: number, label: string, color: string, key: string) => (
    <div key={key} style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div style={{ fontFamily: body, fontWeight: 700, fontSize: 40, width: 200, color: COLORS.ink }}>{label}</div>
      <div style={{ width: w, height: 70, borderRadius: 14, background: COLORS.greyLight, border: `5px solid ${COLORS.ink}` }}>
        <div style={{ width: `${value * grow * 100}%`, height: "100%", background: color, borderRadius: 9 }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {bar(top, labels[0], COLORS.teal, "top")}
      {bar(bottom, labels[1], COLORS.red, "bottom")}
    </div>
  );
};

/** Balance scale whose pans move independently; never settles flat.
 *  `held: true` drops the post and base so a character can hold the beam. */
export const BalanceScale: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 760;
  const held = get(layer, "held", false);
  const tilt = get(layer, "tilt", 0); // -1..1
  const wobble = get(layer, "wobble", false);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = wobble ? tilt + Math.sin((frame / fps) * 1.6) * 0.12 : tilt;
  const dy = t * (held ? 34 : 60);
  // when held, the beam sits at the vertical centre of the box so the layer's
  // y is literally the height of the character's hands
  const h = held ? 380 : w * 0.72;
  const beamY = held ? h / 2 : 60;

  // pans scale with the beam so a held scale reads at any size
  const hang = held ? w * 0.075 : 70;
  const panW = held ? w * 0.11 : 160;
  const panDepth = held ? w * 0.07 : 70;

  const pan = (x: number, y: number, key: string) => (
    <g key={key}>
      <line x1={x} y1={y} x2={x} y2={y + hang} stroke={COLORS.ink} strokeWidth={7} />
      <path
        d={`M ${x - panW / 2} ${y + hang} Q ${x} ${y + hang + panDepth} ${x + panW / 2} ${y + hang} Z`}
        fill={COLORS.greyLight}
        stroke={COLORS.ink}
        strokeWidth={8}
      />
    </g>
  );

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      {held ? null : (
        <>
          <line x1={w / 2} y1={40} x2={w / 2} y2={w * 0.62} stroke={COLORS.ink} strokeWidth={10} strokeLinecap="round" />
          <line x1={w * 0.26} y1={w * 0.62} x2={w * 0.74} y2={w * 0.62} stroke={COLORS.ink} strokeWidth={10} strokeLinecap="round" />
        </>
      )}
      <line
        x1={w * 0.04}
        y1={beamY + dy}
        x2={w * 0.96}
        y2={beamY - dy}
        stroke={COLORS.ink}
        strokeWidth={held ? 8 : 10}
        strokeLinecap="round"
      />
      {pan(w * 0.04, beamY + dy, "l")}
      {pan(w * 0.96, beamY - dy, "r")}
    </svg>
  );
};

/** Rounded cutaway aperture with an anatomy plate masked inside. */
export const BodyWindow: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 520;
  const h = layer.h ?? 420;
  const plate = get(layer, "plate", "") as string;
  const plateScale = get(layer, "plateScale", 1);
  const plateY = get(layer, "plateY", 0);

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 42,
        border: `6px solid ${COLORS.ink}`,
        background: "#fff",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 0 10px #fff",
      }}
    >
      {plate ? (
        <Img
          src={staticFile(assetPath(plate))}
          style={{ width: w * plateScale, transform: `translateY(${plateY}px)` }}
        />
      ) : null}
    </div>
  );
};

/** Empty thought bubble — the prop it contains is composited as its own layer. */
export const ThoughtBubble: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 520;
  const h = layer.h ?? 360;
  return (
    <svg width={w} height={h * 1.35} style={{ overflow: "visible" }}>
      <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 8} ry={h / 2 - 8} fill="#fff" stroke={COLORS.ink} strokeWidth={6} />
      <circle cx={w * 0.28} cy={h * 0.98} r={22} fill="#fff" stroke={COLORS.ink} strokeWidth={6} />
      <circle cx={w * 0.19} cy={h * 1.16} r={13} fill="#fff" stroke={COLORS.ink} strokeWidth={5} />
    </svg>
  );
};

/** Exactly three curved odour lines. */
export const OdorLines: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 180;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 2;
  return (
    <svg width={w} height={w * 1.1} style={{ overflow: "visible" }}>
      {[0, 1, 2].map((i) => {
        const x = w * (0.22 + i * 0.28);
        const drift = Math.sin(t + i) * 5;
        return (
          <path
            key={i}
            d={`M ${x} ${w} C ${x - 18 + drift} ${w * 0.7}, ${x + 18 + drift} ${w * 0.45}, ${x} ${w * 0.12}`}
            fill="none"
            stroke={COLORS.grey}
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** Single diagonal slash (a softer negation than the full X). */
export const Slash: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 250;
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 7], [0, 1], { extrapolateRight: "clamp" });
  return (
    <svg width={w} height={w} style={{ overflow: "visible" }}>
      <line
        x1={w * 0.1}
        y1={w * 0.1}
        x2={w * 0.1 + w * 0.8 * p}
        y2={w * 0.1 + w * 0.8 * p}
        stroke={COLORS.red}
        strokeWidth={16}
        strokeLinecap="round"
      />
    </svg>
  );
};

/** Connector arrow, drawn on. */
export const Arrow: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 200;
  const color = get(layer, "color", COLORS.ink);
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const x2 = w * p;
  return (
    <svg width={w} height={60} style={{ overflow: "visible" }}>
      <line x1={0} y1={30} x2={Math.max(x2 - 18, 0)} y2={30} stroke={color} strokeWidth={7} strokeLinecap="round" />
      {p > 0.75 ? (
        <polygon points={`${w},30 ${w - 26},14 ${w - 26},46`} fill={color} />
      ) : null}
    </svg>
  );
};

/** Teal dot with halo — travels along the inheritance chain. */
export const GlowDot: React.FC<{ layer: Layer }> = ({ layer }) => {
  const d = layer.w ?? 36;
  return (
    <svg width={d * 2.2} height={d * 2.2} style={{ overflow: "visible" }}>
      <circle cx={d * 1.1} cy={d * 1.1} r={d * 0.95} fill={COLORS.teal} opacity={0.18} />
      <circle cx={d * 1.1} cy={d * 1.1} r={d / 2} fill={COLORS.teal} />
    </svg>
  );
};

/** Tether line drawn from a window into the chest. */
export const Tether: React.FC<{ layer: Layer }> = ({ layer }) => {
  const dx = get(layer, "dx", 0);
  const dy = get(layer, "dy", 240);
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <svg width={1} height={1} style={{ overflow: "visible" }}>
      <path
        d={`M 0 0 Q ${dx * 0.25} ${dy * 0.7} ${dx} ${dy}`}
        fill="none"
        stroke={COLORS.teal}
        strokeWidth={5}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
    </svg>
  );
};

/** Light strike-through for the CLOSE section. */
export const Strike: React.FC<{ layer: Layer }> = ({ layer }) => {
  const w = layer.w ?? 700;
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 9], [0, 1], { extrapolateRight: "clamp" });
  return (
    <svg width={w} height={60}>
      <line
        x1={10}
        y1={44}
        x2={10 + (w - 20) * p}
        y2={18}
        stroke={COLORS.red}
        strokeWidth={12}
        strokeLinecap="round"
      />
    </svg>
  );
};
