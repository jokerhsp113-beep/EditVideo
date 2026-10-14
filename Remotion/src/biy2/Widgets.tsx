import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, STROKE, body, headline } from "./theme";
import {InkArrow, InkLine, dashPattern} from "../design/Ink";
import type { Layer } from "./types";

/* ------------------------------------------------------------------ helpers */

const p = (layer: Layer) => (layer.props ?? {}) as Record<string, unknown>;
const num = (layer: Layer, key: string, fallback: number) => {
  const v = p(layer)[key];
  return typeof v === "number" ? v : fallback;
};
const str = (layer: Layer, key: string, fallback: string) => {
  const v = p(layer)[key];
  return typeof v === "string" ? v : fallback;
};
const flag = (layer: Layer, key: string) => p(layer)[key] === true;
/** Wording for a widget, wherever the timeline happened to put it. */
const words = (layer: Layer) =>
  str(layer, "value", str(layer, "text", layer.text ?? ""));

/** Every widget draws into a box the layer declares; these are the defaults. */
const size = (layer: Layer, w: number, h: number) => ({
  w: layer.w ?? w,
  h: layer.h ?? (layer.w ? (layer.w * h) / w : h),
});

const Svg: React.FC<{
  w: number;
  h: number;
  vw?: number;
  vh?: number;
  children: React.ReactNode;
}> = ({ w, h, vw, vh, children }) => (
  <svg
    width={w}
    height={h}
    viewBox={`0 0 ${vw ?? w} ${vh ?? h}`}
    style={{ display: "block", overflow: "visible" }}
  >
    {children}
  </svg>
);

const ink = {
  stroke: COLORS.ink,
  strokeWidth: STROKE,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 0..1 over `seconds` from the moment the layer entered. */
const useGrow = (seconds: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [0, seconds * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return t * t * (3 - 2 * t);
};

/* -------------------------------------------------------------- primitives */

const Bar: React.FC<{
  layer: Layer;
  fill: string;
  level: number;
  threshold?: number;
  label?: string;
}> = ({ layer, fill, level, threshold, label }) => {
  const { w, h } = size(layer, 120, 420);
  const g = useGrow(0.6);
  const filled = Math.max(0, Math.min(1, level)) * g;
  return (
    <Svg w={w} h={h + (label ? 46 : 0)} vw={120} vh={420 + (label ? 46 : 0)}>
      <rect
        x={5}
        y={420 - 420 * filled + 5}
        width={110}
        height={Math.max(0, 420 * filled - 10)}
        rx={16}
        fill={fill}
      />
      <rect x={5} y={5} width={110} height={410} rx={16} fill="none" {...ink} strokeWidth={8} />
      {threshold !== undefined ? (
        <line
          x1={-14}
          x2={134}
          y1={420 - 420 * threshold}
          y2={420 - 420 * threshold}
          stroke={COLORS.red}
          strokeWidth={8}
          strokeDasharray={dashPattern(8)}
          strokeLinecap="round"
        />
      ) : null}
      {label ? (
        <text
          x={60}
          y={456}
          textAnchor="middle"
          fontFamily={body}
          fontWeight={400}
          fontSize={36}
          fill={COLORS.ink}
        >
          {label}
        </text>
      ) : null}
    </Svg>
  );
};

const Burst: React.FC<{ layer: Layer; color: string; spokes: number; len: number }> = ({
  layer,
  color,
  spokes,
  len,
}) => {
  const { w } = size(layer, len * 2 + 40, len * 2 + 40);
  const g = useGrow(0.35);
  const c = len + 20;
  return (
    <Svg w={w} h={w} vw={c * 2} vh={c * 2}>
      {Array.from({ length: spokes }).map((_, i) => {
        const a = (i / spokes) * Math.PI * 2 - Math.PI / 2;
        const r0 = 26;
        const r1 = 26 + len * g;
        return (
          <line
            key={i}
            x1={c + Math.cos(a) * r0}
            y1={c + Math.sin(a) * r0}
            x2={c + Math.cos(a) * r1}
            y2={c + Math.sin(a) * r1}
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
};

const Patch: React.FC<{ layer: Layer; color: string; alpha: number; r: number }> = ({
  layer,
  color,
  alpha,
  r,
}) => {
  const { w } = size(layer, r * 2, r * 2);
  return (
    <Svg w={w} h={w} vw={r * 2} vh={r * 2}>
      <circle cx={r} cy={r} r={r} fill={color} opacity={alpha} />
    </Svg>
  );
};

const DashedBox: React.FC<{ layer: Layer; color: string; dash: string; radius: number }> = ({
  layer,
  color,
  radius,
}) => {
  const { w, h } = size(layer, 700, 420);
  return (
    <Svg w={w} h={h} vw={w} vh={h}>
      <rect
        x={6}
        y={6}
        width={w - 12}
        height={h - 12}
        rx={radius}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={dashPattern(5)}
        strokeLinecap="round"
      />
    </Svg>
  );
};

const Card: React.FC<{
  layer: Layer;
  fill: string;
  text?: string;
  sub?: string;
  border?: string;
}> = ({ layer, fill, text, sub, border }) => {
  const { w, h } = size(layer, 520, 200);
  // the production files leave a card's wording to the editor; an unfilled
  // card is a blank rectangle, which reads as a mistake rather than a beat
  if (!text && !sub) return null;
  return (
    <Svg w={w} h={h} vw={w} vh={h}>
      <rect
        x={5}
        y={5}
        width={w - 10}
        height={h - 10}
        rx={28}
        fill={fill}
        stroke={border ?? COLORS.ink}
        strokeWidth={8}
      />
      {text ? (
        <text
          x={w / 2}
          y={sub ? h / 2 - 4 : h / 2 + 16}
          textAnchor="middle"
          fontFamily={body}
          fontWeight={400}
          fontSize={Math.min(54, h * 0.32)}
          fill={COLORS.ink}
        >
          {text}
        </text>
      ) : null}
      {sub ? (
        <text
          x={w / 2}
          y={h / 2 + 52}
          textAnchor="middle"
          fontFamily={body}
          fontSize={Math.min(32, h * 0.2)}
          fill={COLORS.grey}
        >
          {sub}
        </text>
      ) : null}
    </Svg>
  );
};

const ArrowShape: React.FC<{layer: Layer; color: string; dir: "up" | "down" | "right" | "steep"; curved?: boolean}> = ({layer,color,dir,curved}) => {
  const {w,h}=size(layer,140,260);
  const g=useGrow(0.4);
  const points={up:[{x:70,y:236},{x:70,y:24}], down:[{x:70,y:24},{x:70,y:236}], right:[{x:20,y:130},{x:246,y:130}], steep:[{x:24,y:236},{x:236,y:30}]} as const;
  const [from,to]=curved?[{x:30,y:236},{x:200,y:50}]:points[dir];
  const vw=dir==="right"||dir==="steep"||curved?270:140;
  return <Svg w={w} h={h} vw={vw} vh={260}><InkArrow from={from} to={to} color={color} strokeWidth={7} progress={g} bend={curved?-55:undefined}/></Svg>;
};

/** An arrow drawn to the exact span between the two things it connects. */
const Connector: React.FC<{layer: Layer}> = ({layer}) => {
  const w=layer.w??400, h=layer.h??90;
  const g=useGrow(0.35);
  return <Svg w={w} h={h}><InkArrow from={{x:12,y:h/2}} to={{x:w-12,y:h/2}} color={str(layer,"color",COLORS.ink)} strokeWidth={6} progress={g}/></Svg>;
};

const ThresholdBar: React.FC<{layer: Layer}> = ({layer}) => {
  const level=useGrow(0.8);
  return <Bar layer={layer} fill={COLORS.teal} level={level} threshold={num(layer,"threshold",0.7)}/>;
};

/* ------------------------------------------------------------ the registry */

const Label: React.FC<{ layer: Layer }> = ({ layer }) => {
  const s = num(layer, "size", layer.h ? layer.h * 0.7 : 64);
  const text = words(layer);
  if (!text) return null;
  return (
    <div
      style={{
        fontFamily: headline,
        fontSize: s,
        color: str(layer, "color", COLORS.ink),
        letterSpacing: 0.3,
        whiteSpace: "pre",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
};

const EvidenceChip: React.FC<{ layer: Layer }> = ({ layer }) => {
  const { w, h } = size(layer, 420, 92);
  const dashed = str(layer, "certainty", "solid") === "dashed";
  const value = words(layer);
  if (!value) return null;
  return (
    <Svg w={w} h={h} vw={w} vh={h}>
      <rect
        x={4}
        y={4}
        width={w - 8}
        height={h - 8}
        rx={h / 2}
        fill="#FFFFFF"
        stroke={COLORS.grey}
        strokeWidth={5}
        strokeDasharray={dashed ? dashPattern(5) : undefined}
        strokeLinecap="round"
      />
      <text
        x={w / 2}
        y={h / 2 + 12}
        textAnchor="middle"
        fontFamily={body}
        fontWeight={400}
        fontSize={h * 0.42}
        fill={COLORS.ink}
      >
        {value}
      </text>
    </Svg>
  );
};

const CrowdGrid: React.FC<{ layer: Layer }> = ({ layer }) => {
  const total = num(layer, "total", num(layer, "count", 30));
  const cols = num(layer, "columns", 10);
  // size the people from the box the layer was given, not the other way round:
  // a grid drawn at the production file's `d` is a smudge at 1080p
  const box = layer.w ?? 1020;
  const d = num(layer, "d", Math.max(34, (box / cols) * 0.62));
  const gap = num(layer, "gap", Math.max(14, (box / cols) * 0.38));
  const hi = (p(layer).highlighted as number[]) ?? [];
  const carriers = (p(layer).carrierDots as number[]) ?? [];
  const genePairs = Boolean(p(layer).genePairs);
  const missingGeneAt = num(layer, "missingGeneAt", total - 1);
  const rows = Math.ceil(total / cols);
  const w = cols * (d + gap);
  const h = rows * (d * 1.9 + gap);
  return (
    <Svg w={layer.w ?? w} h={layer.h ?? h} vw={w} vh={h}>
      {Array.from({ length: total }).map((_, i) => {
        const cx = (i % cols) * (d + gap) + d / 2 + gap / 2;
        const cy = Math.floor(i / cols) * (d * 1.9 + gap) + d / 2 + gap / 2;
        const on = hi.includes(i);
        return (
          <g key={i} stroke={COLORS.ink} strokeWidth={5} fill={on ? COLORS.amber : "#FFFFFF"}>
            <circle cx={cx} cy={cy} r={d * 0.34} />
            <line x1={cx} y1={cy + d * 0.34} x2={cx} y2={cy + d} strokeLinecap="round" />
            <line x1={cx - d * 0.34} y1={cy + d * 0.62} x2={cx + d * 0.34} y2={cy + d * 0.62} />
            {carriers.includes(i) ? (
              <circle cx={cx} cy={cy + d * 0.62} r={9} fill="none" stroke={COLORS.teal} />
            ) : null}
            {genePairs ? (
              <g strokeWidth={3}>
                <circle cx={cx - d * 0.16} cy={cy + d * 0.6} r={d * 0.1} fill={COLORS.teal} />
                <circle
                  cx={cx + d * 0.16}
                  cy={cy + d * 0.6}
                  r={d * 0.1}
                  fill={i === missingGeneAt ? "#FFFFFF" : COLORS.amber}
                  stroke={i === missingGeneAt ? COLORS.red : COLORS.ink}
                />
              </g>
            ) : null}
          </g>
        );
      })}
    </Svg>
  );
};

const Windows: React.FC<{ layer: Layer }> = ({ layer }) => {
  const d = layer.w ?? layer.h ?? 132;
  const state = str(layer, "state", "open");
  const fill = state === "lit" ? COLORS.amberSoft : COLORS.greyLight;
  return (
    <Svg w={d} h={d} vw={132} vh={132}>
      {state === "lit" ? <circle cx={66} cy={66} r={62} fill={COLORS.teal} opacity={0.25} /> : null}
      <circle cx={66} cy={66} r={56} fill={fill} stroke={COLORS.ink} strokeWidth={8} />
      {state === "open" ? (
        <path d="M18 66 Q42 46 66 66 T114 66" fill="none" stroke={COLORS.ink} strokeWidth={7} />
      ) : (
        <path d="M18 70 Q42 56 66 70 T114 70" fill="none" stroke={COLORS.ink} strokeWidth={7} />
      )}
    </Svg>
  );
};

const BodyWindow: React.FC<{ layer: Layer }> = ({ layer }) => {
  const { w, h } = size(layer, 760, 620);
  const g = useGrow(0.6);
  return (
    <Svg w={w} h={h} vw={w} vh={h}>
      <rect
        x={6}
        y={h / 2 - (h / 2 - 6) * g}
        width={w - 12}
        height={(h - 12) * g}
        rx={48}
        fill="none"
        stroke={COLORS.ink}
        strokeWidth={STROKE}
      />
    </Svg>
  );
};

const Ticks: React.FC<{ layer: Layer; count: number; d: number; color: string }> = ({
  layer,
  count,
  d,
  color,
}) => {
  const gap = d * 1.9;
  const w = count * gap;
  const g = useGrow(0.5);
  return (
    <Svg w={layer.w ?? w} h={layer.h ?? d * 2} vw={w} vh={d * 2}>
      <line x1={gap / 2} y1={d} x2={w - gap / 2} y2={d} stroke={COLORS.grey} strokeWidth={5} />
      {Array.from({ length: count }).map((_, i) => (
        <circle
          key={i}
          cx={gap / 2 + i * ((w - gap) / Math.max(1, count - 1))}
          cy={d}
          r={i / count <= g ? d * 0.5 : 0}
          fill={color}
          stroke={COLORS.ink}
          strokeWidth={5}
        />
      ))}
    </Svg>
  );
};

const Ring: React.FC<{ layer: Layer; color: string; dashed?: boolean; width?: number }> = ({
  layer,
  color,
  dashed,
  width,
}) => {
  const d = layer.w ?? layer.h ?? 200;
  const g = useGrow(0.4);
  const r = d / 2 - (width ?? 8);
  const c = 2 * Math.PI * r;
  return (
    <Svg w={d} h={d} vw={d} vh={d}>
      <circle
        cx={d / 2}
        cy={d / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={width ?? 8}
        strokeDasharray={dashed ? dashPattern(width ?? 8) : `${c * g} ${c}`}
        opacity={dashed ? g : 1}
        strokeLinecap="round"
        transform={`rotate(-90 ${d / 2} ${d / 2})`}
      />
    </Svg>
  );
};

const Tag: React.FC<{ layer: Layer; fill: string; text?: string }> = ({ layer, fill, text }) => {
  const { w, h } = size(layer, 230, 130);
  return (
    <Svg w={w} h={h} vw={230} vh={130}>
      <path
        d="M14 22 H186 L216 65 L186 108 H14 Z"
        fill={fill}
        stroke={COLORS.ink}
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <circle cx={178} cy={65} r={9} fill={COLORS.ink} />
      {text ? (
        <text
          x={96}
          y={80}
          textAnchor="middle"
          fontFamily={body}
          fontWeight={400}
          fontSize={42}
          fill="#FFFFFF"
        >
          {text}
        </text>
      ) : null}
    </Svg>
  );
};

const TagPair: React.FC<{ layer: Layer }> = ({ layer }) => {
  const gap = num(layer, "gap", 60);
  const { w } = size(layer, 520, 130);
  const tw = (w - gap) / 2;
  return (
    <div style={{ display: "flex", gap, alignItems: "center" }}>
      <Tag layer={{ ...layer, w: tw, h: undefined }} fill={COLORS.teal} />
      <Tag layer={{ ...layer, w: tw, h: undefined }} fill={COLORS.red} />
    </div>
  );
};

const Line: React.FC<{ layer: Layer; color: string; dashed?: boolean; vertical?: boolean }> = ({
  layer,
  color,
  dashed,
  vertical,
}) => {
  const w = layer.w ?? (vertical ? 8 : 700);
  const h = layer.h ?? (vertical ? 500 : 8);
  const g = useGrow(0.45);
  return (
    <Svg w={w} h={Math.max(h, 8)} vw={w} vh={Math.max(h, 8)}>
      <InkLine from={{x:4,y:vertical?4:h/2}} to={{x:vertical?4:w-4,y:vertical?h-4:h/2}} color={color} strokeWidth={vertical?Math.max(4,w):Math.max(4,h)} progress={g} dashed={dashed} bend={vertical?0:undefined}/>

    </Svg>
  );
};

const Drops: React.FC<{ layer: Layer }> = ({ layer }) => {
  const count = num(layer, "count", 3);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const interval = num(layer, "interval", 0.28) * fps;
  const { w, h } = size(layer, 90, 360);
  return (
    <Svg w={w} h={h} vw={90} vh={360}>
      {Array.from({ length: count }).map((_, i) => {
        const local = frame - i * interval;
        if (local < 0) return null;
        const y = interpolate(local, [0, 0.9 * fps], [40, 320], { extrapolateRight: "clamp" });
        return (
          <path
            key={i}
            d={`M45 ${y - 26} C26 ${y - 2} 22 ${y + 22} 45 ${y + 22} C68 ${y + 22} 64 ${y - 2} 45 ${
              y - 26
            } Z`}
            fill={COLORS.red}
            stroke={COLORS.ink}
            strokeWidth={6}
          />
        );
      })}
    </Svg>
  );
};

const Blob: React.FC<{ layer: Layer; color: string; dots: number }> = ({ layer, color, dots }) => {
  const { w, h } = size(layer, 220, 200);
  return (
    <Svg w={w} h={h} vw={220} vh={200}>
      {Array.from({ length: dots }).map((_, i) => {
        const a = (i / dots) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={110 + Math.cos(a) * 44}
            cy={100 + Math.sin(a) * 38}
            r={40}
            fill={color}
            stroke={COLORS.ink}
            strokeWidth={7}
          />
        );
      })}
    </Svg>
  );
};

const Plate: React.FC<{ layer: Layer }> = ({ layer }) => {
  const share = num(layer, "fatShare", 0.8);
  const d = layer.w ?? layer.h ?? 300;
  const r = d / 2 - 8;
  const a = share * Math.PI * 2 - Math.PI / 2;
  const large = share > 0.5 ? 1 : 0;
  return (
    <Svg w={d} h={d} vw={d} vh={d}>
      <circle cx={d / 2} cy={d / 2} r={r} fill="#FFFFFF" stroke={COLORS.ink} strokeWidth={8} />
      <path
        d={`M${d / 2} ${d / 2} L${d / 2} ${d / 2 - r} A${r} ${r} 0 ${large} 1 ${
          d / 2 + Math.cos(a) * r
        } ${d / 2 + Math.sin(a) * r} Z`}
        fill={COLORS.amber}
        stroke={COLORS.ink}
        strokeWidth={8}
      />
    </Svg>
  );
};

const Gear: React.FC<{ layer: Layer }> = ({ layer }) => {
  const d = layer.w ?? layer.h ?? 240;
  const frame = useCurrentFrame();
  const teeth = 8;
  return (
    <Svg w={d} h={d} vw={240} vh={240}>
      <g transform={`rotate(${frame * 0.6} 120 120)`}>
        {Array.from({ length: teeth }).map((_, i) => (
          <rect
            key={i}
            x={108}
            y={6}
            width={24}
            height={34}
            rx={7}
            fill={COLORS.teal}
            stroke={COLORS.ink}
            strokeWidth={7}
            transform={`rotate(${(i * 360) / teeth} 120 120)`}
          />
        ))}
        <circle cx={120} cy={120} r={84} fill={COLORS.teal} stroke={COLORS.ink} strokeWidth={STROKE} />
        <circle cx={120} cy={120} r={28} fill={COLORS.bg} stroke={COLORS.ink} strokeWidth={STROKE} />
      </g>
    </Svg>
  );
};

const Moon: React.FC<{ layer: Layer }> = ({ layer }) => {
  const { w, h } = size(layer, 300, 260);
  return (
    <Svg w={w} h={h} vw={300} vh={260}>
      <path
        d="M150 30 A100 100 0 1 0 150 230 A78 78 0 1 1 150 30 Z"
        fill={COLORS.amberSoft}
        stroke={COLORS.ink}
        strokeWidth={8}
      />
      {[0, 1, 2].map((i) => (
        <text
          key={i}
          x={224 + i * 22}
          y={92 - i * 30}
          fontFamily={body}
          fontWeight={400}
          fontSize={52 - i * 14}
          fill={COLORS.grey}
        >
          z
        </text>
      ))}
    </Svg>
  );
};

const Shelf: React.FC<{ layer: Layer }> = ({ layer }) => {
  const { w, h } = size(layer, 1200, 60);
  return (
    <Svg w={w} h={h} vw={w} vh={h}>
      <rect
        x={5}
        y={5}
        width={w - 10}
        height={h - 10}
        rx={16}
        fill={COLORS.greyLight}
        stroke={COLORS.ink}
        strokeWidth={STROKE}
      />
      <rect x={20} y={14} width={w - 60} height={9} rx={5} fill="#FFFFFF" opacity={0.75} />
    </Svg>
  );
};

const Holes: React.FC<{ layer: Layer }> = ({ layer }) => {
  const count = num(layer, "count", 6);
  const { w, h } = size(layer, 340, 260);
  const g = useGrow(0.5);
  return (
    <Svg w={w} h={h} vw={340} vh={260}>
      {Array.from({ length: count }).map((_, i) => {
        if (i / count > g) return null;
        const c = ((i * 97) % 53) / 53;
        const r = ((i * 61) % 41) / 41;
        return <circle key={i} cx={50 + c * 240} cy={44 + r * 170} r={14} fill={COLORS.ink} />;
      })}
    </Svg>
  );
};

const Slider: React.FC<{ layer: Layer }> = ({ layer }) => {
  const pos = num(layer, "position", 0.5);
  const { w, h } = size(layer, 110, 420);
  const g = useGrow(0.5);
  const y = 40 + (340 - 40) * (1 - pos * g);
  return (
    <Svg w={w} h={h} vw={110} vh={420}>
      <rect x={42} y={20} width={26} height={380} rx={13} fill={COLORS.greyLight} {...ink} strokeWidth={7} />
      <rect x={10} y={y} width={90} height={62} rx={18} fill={COLORS.red} {...ink} strokeWidth={8} />
    </Svg>
  );
};

const Chart: React.FC<{ layer: Layer; drop: boolean }> = ({ layer, drop }) => {
  const { w, h } = size(layer, 560, 260);
  const g = useGrow(0.7);
  const d = drop ? "M20 120 L300 120 L420 128 L540 232" : "M20 120 L540 118";
  return (
    <Svg w={w} h={h} vw={560} vh={260}>
      <line x1={20} y1={240} x2={540} y2={240} stroke={COLORS.grey} strokeWidth={5} />
      <path
        d={d}
        fill="none"
        stroke={drop ? COLORS.red : COLORS.teal}
        strokeWidth={9}
        strokeLinecap="round"
        style={{ clipPath: `inset(0 ${100 - g * 100}% 0 0)` }}
      />
    </Svg>
  );
};

const Flame: React.FC<{ layer: Layer }> = ({ layer }) => {
  const { w, h } = size(layer, 280, 240);
  const frame = useCurrentFrame();
  return (
    <Svg w={w} h={h} vw={280} vh={240}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = -Math.PI / 2 + (i - 2) * 0.42;
        const len = 92 + Math.sin(frame * 0.2 + i) * 12;
        return (
          <path
            key={i}
            d={`M140 190 Q${140 + Math.cos(a) * len * 0.5} ${190 + Math.sin(a) * len * 0.9} ${
              140 + Math.cos(a) * len
            } ${190 + Math.sin(a) * len} Q${140 + Math.cos(a) * len * 0.62} ${
              190 + Math.sin(a) * len * 0.5
            } 140 190 Z`}
            fill={COLORS.amber}
            stroke={COLORS.ink}
            strokeWidth={6}
          />
        );
      })}
    </Svg>
  );
};

const Split: React.FC<{ layer: Layer }> = ({ layer }) => {
  const { w, h } = size(layer, 1920, 1080);
  const g = useGrow(0.8);
  return (
    <Svg w={w} h={h} vw={w} vh={h}>
      <rect x={0} y={0} width={w / 2} height={h} fill={COLORS.greyLight} />
      <rect x={w / 2} y={0} width={(w / 2) * g} height={h} fill={COLORS.amber} opacity={0.55} />
    </Svg>
  );
};

const Steps: React.FC<{ layer: Layer }> = ({ layer }) => {
  const n = num(layer, "step", 1);
  const d = layer.w ?? layer.h ?? 96;
  return (
    <Svg w={d} h={d} vw={96} vh={96}>
      <circle cx={48} cy={48} r={42} fill={COLORS.bg} stroke={COLORS.ink} strokeWidth={8} />
      {Array.from({ length: n }).map((_, i) => (
        <circle key={i} cx={48 + (i - (n - 1) / 2) * 24} cy={48} r={9} fill={COLORS.ink} />
      ))}
    </Svg>
  );
};

const Pile: React.FC<{ layer: Layer }> = ({ layer }) => {
  const count = num(layer, "count", 7);
  const { w, h } = size(layer, 360, 300);
  const g = useGrow(0.6);
  return (
    <Svg w={w} h={h} vw={360} vh={300}>
      {Array.from({ length: count }).map((_, i) => {
        if (i / count > g) return null;
        const c = ((i * 83) % 47) / 47;
        const r = ((i * 59) % 37) / 37;
        return (
          <circle
            key={i}
            cx={70 + c * 220}
            cy={70 + r * 170}
            r={34}
            fill={COLORS.red}
            stroke={COLORS.ink}
            strokeWidth={7}
          />
        );
      })}
    </Svg>
  );
};

const Waves: React.FC<{ layer: Layer; color: string; count: number }> = ({
  layer,
  color,
  count,
}) => {
  const { w, h } = size(layer, 200, 180);
  const frame = useCurrentFrame();
  return (
    <Svg w={w} h={h} vw={200} vh={180}>
      {Array.from({ length: count }).map((_, i) => {
        const off = Math.sin(frame * 0.18 + i) * 8;
        const x = 40 + i * 60;
        return (
          <path
            key={i}
            d={`M${x} 160 Q${x - 22 + off} 112 ${x} 74 Q${x + 22 + off} 36 ${x} 8`}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
};

const LetterBlocks: React.FC<{ layer: Layer }> = ({ layer }) => {
  const total = num(layer, "total", 32);
  const hi = (p(layer).highlighted as number[]) ?? [];
  const { w, h } = size(layer, 1100, 90);
  const bw = w / total;
  return (
    <Svg w={w} h={h} vw={w} vh={h}>
      {Array.from({ length: total }).map((_, i) => (
        <rect
          key={i}
          x={i * bw + 3}
          y={6}
          width={bw - 6}
          height={h - 12}
          rx={6}
          fill={hi.includes(i) ? COLORS.red : COLORS.greyLight}
          stroke={COLORS.ink}
          strokeWidth={4}
        />
      ))}
    </Svg>
  );
};

const TwoBars: React.FC<{ layer: Layer }> = ({ layer }) => {
  const a = num(layer, "thresholdA", 0.75);
  const b = num(layer, "thresholdB", 0.4);
  const { w } = size(layer, 320, 440);
  const g = useGrow(1);
  return (
    <div style={{ display: "flex", gap: w * 0.18, alignItems: "flex-end" }}>
      <Bar layer={{ ...layer, w: w * 0.34, h: 440 }} fill={COLORS.teal} level={g} threshold={a} />
      <Bar layer={{ ...layer, w: w * 0.34, h: 440 }} fill={COLORS.amber} level={g} threshold={b} />
    </div>
  );
};

const Ruler: React.FC<{ layer: Layer }> = ({ layer }) => {
  const props = (layer.props ?? {}) as { orientation?: string };
  const horizontal = layer.kind === "code_gate_width_ruler" || props.orientation === "horizontal";
  const { w, h } = size(layer, horizontal ? 320 : 104, horizontal ? 92 : 320);
  const a = num(layer, "a", 0.15);
  const b = num(layer, "b", 0.85);
  const g = useGrow(0.45);
  if (horizontal) {
    const x0 = 320 * a;
    const x1 = x0 + (320 * b - x0) * g;
    return (
      <Svg w={w} h={h} vw={320} vh={92}>
        <line x1={x0} y1={46} x2={x1} y2={46} stroke={COLORS.ink} strokeWidth={7} strokeLinecap="round" />
        <path d={`M ${x0 + 18} 25 L ${x0} 46 L ${x0 + 18} 67`} fill="none" stroke={COLORS.red} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${x1 - 18} 25 L ${x1} 46 L ${x1 - 18} 67`} fill="none" stroke={COLORS.red} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={x0 + (x1 - x0) * t} y1={35} x2={x0 + (x1 - x0) * t} y2={57} stroke={COLORS.ink} strokeWidth={5} strokeLinecap="round" />
        ))}
      </Svg>
    );
  }
  const y0 = 320 * a;
  const y1 = y0 + (320 * b - y0) * g;
  return (
    <Svg w={w} h={h} vw={104} vh={320}>
      <line x1={52} y1={y0} x2={52} y2={y1} stroke={COLORS.ink} strokeWidth={7} strokeLinecap="round" />
      <path d={`M 29 ${y0 + 18} L 52 ${y0} L 75 ${y0 + 18}`} fill="none" stroke={COLORS.red} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M 29 ${y1 - 18} L 52 ${y1} L 75 ${y1 - 18}`} fill="none" stroke={COLORS.red} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={40} y1={y0 + (y1 - y0) * t} x2={64} y2={y0 + (y1 - y0) * t} stroke={COLORS.ink} strokeWidth={5} strokeLinecap="round" />
      ))}
    </Svg>
  );
};

const DashedLink: React.FC<{ layer: Layer }> = ({ layer }) => {
  const { w, h } = size(layer, 720, 90);
  const g = useGrow(0.45);
  const end = 20 + (w - 40) * g;
  return (
    <Svg w={w} h={h} vw={w} vh={h}>
      <InkLine from={{x:20,y:h/2}} to={{x:end,y:h/2}} color={COLORS.teal} strokeWidth={6} dashed/>

      <circle cx={20} cy={h / 2} r={9} fill={COLORS.amber} stroke={COLORS.ink} strokeWidth={5} />
      <circle cx={end} cy={h / 2} r={9} fill={COLORS.red} stroke={COLORS.ink} strokeWidth={5} />
    </Svg>
  );
};

const PinDot: React.FC<{ layer: Layer }> = ({ layer }) => {
  const { w, h } = size(layer, 150, 150);
  const g = useGrow(0.5);
  return (
    <Svg w={w} h={h} vw={150} vh={150}>
      <circle cx={75} cy={75} r={62 * g} fill="none" stroke={COLORS.teal} strokeWidth={6} opacity={0.32} />
      <circle cx={75} cy={75} r={36 * g} fill="none" stroke={COLORS.teal} strokeWidth={7} opacity={0.62} />
      <circle cx={75} cy={75} r={15 * g} fill={COLORS.red} stroke={COLORS.ink} strokeWidth={5} />
    </Svg>
  );
};

const CopyCards: React.FC<{ layer: Layer }> = ({ layer }) => {
  const { w, h } = size(layer, 620, 300);
  const cw = (w - 40) / 2;
  const figure = (cx: number, cy: number, s: number) => (
    <g stroke={COLORS.ink} strokeWidth={5} fill="#FFFFFF">
      <circle cx={cx} cy={cy - s * 0.5} r={s * 0.28} />
      <line x1={cx} y1={cy - s * 0.22} x2={cx} y2={cy + s * 0.4} strokeLinecap="round" />
      <line x1={cx - s * 0.3} y1={cy + s * 0.05} x2={cx + s * 0.3} y2={cy + s * 0.05} />
    </g>
  );
  return (
    <Svg w={w} h={h} vw={w} vh={h}>
      <rect x={4} y={4} width={cw} height={h - 8} rx={26} fill="#FFFFFF" {...ink} strokeWidth={8} />
      <rect
        x={cw + 36}
        y={4}
        width={cw}
        height={h - 8}
        rx={26}
        fill="#FFFFFF"
        {...ink}
        strokeWidth={8}
      />
      {figure(cw / 2 + 4, h / 2, h * 0.5)}
      {figure(cw + 36 + cw * 0.33, h / 2, h * 0.5)}
      {figure(cw + 36 + cw * 0.67, h / 2, h * 0.5)}
    </Svg>
  );
};

const Stub: React.FC<{ layer: Layer }> = ({ layer }) => (
  <div
    style={{
      width: layer.w ?? 240,
      height: layer.h ?? 120,
      border: `6px dashed ${COLORS.red}`,
      borderRadius: 18,
      color: COLORS.red,
      fontFamily: body,
      fontSize: 22,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: 8,
    }}
  >
    {layer.kind}
  </div>
);

/* --------------------------------------------------------------- dispatch */

export const WIDGETS: Record<string, React.FC<{ layer: Layer }>> = {
  code_label: Label,
  code_evidence_chip: EvidenceChip,
  code_crowd_grid: CrowdGrid,
  code_window: Windows,
  code_body_window: BodyWindow,
  code_tag_pair: TagPair,
  code_copy_cards: CopyCards,
  code_letter_blocks: LetterBlocks,
  code_dna_letter_strip: LetterBlocks,
  code_two_bars_race: TwoBars,
  code_ruler_marker: Ruler,
  code_gate_width_ruler: Ruler,
  code_dashed_link: DashedLink,
  code_pin_dot: PinDot,
  code_gear: Gear,
  code_moon_sleep: Moon,
  code_shelf_line: Shelf,
  code_pore_holes: Holes,
  code_brake_slider: Slider,
  code_calorie_plate: Plate,
  code_fuel_glow: Flame,
  code_sky_split: Split,
  code_step_marker: Steps,
  code_molecule_pile: Pile,
  code_bleed_drops: Drops,

  code_threshold_bar: ThresholdBar,
  code_clotting_bar: (x) => <Bar {...x} fill={COLORS.red} level={num(x.layer, "level", 0.6)} />,
  code_vwf_bar: (x) => <Bar {...x} fill={COLORS.red} level={num(x.layer, "level", 0.4)} label="vWF" />,
  code_hdl_bar: (x) => <Bar {...x} fill={COLORS.green} level={num(x.layer, "level", 0.75)} />,

  code_alarm_burst: (x) => <Burst {...x} color={COLORS.teal} spokes={8} len={120} />,
  code_inflammation_burst: (x) => <Burst {...x} color={COLORS.amber} spokes={10} len={140} />,
  code_spread_rings: (x) => <Ring {...x} color={COLORS.teal} width={7} />,
  code_shield_ring: (x) => <Ring {...x} color={COLORS.green} />,
  code_carrier_dot: (x) => <Ring {...x} color={COLORS.teal} width={4} />,
  code_trigger_box: (x) => <DashedBox {...x} color={COLORS.ink} dash="18 14" radius={26} />,
  code_dashed_outline: (x) => <DashedBox {...x} color={COLORS.grey} dash="18 12" radius={40} />,
  code_room_outline: (x) => <DashedBox {...x} color={COLORS.grey} dash="18 12" radius={28} />,

  code_patch_red: (x) => <Patch {...x} color={COLORS.red} alpha={0.7} r={46} />,
  code_flush_cheeks: (x) => <Patch {...x} color={COLORS.red} alpha={0.65} r={38} />,
  code_bruise_patch: (x) => <Patch {...x} color={COLORS.blue} alpha={0.6} r={42} />,
  code_heat_gradient: (x) => <Patch {...x} color={COLORS.teal} alpha={0.45} r={260} />,
  code_tsetse_belt: (x) => (
    <div
      style={{
        width: x.layer.w ?? 900,
        height: x.layer.h ?? 150,
        background: COLORS.teal,
        opacity: 0.4,
        borderRadius: 10,
      }}
    />
  ),

  code_hypothesis_card: (x) => <Card {...x} fill={COLORS.greyPale} text={words(x.layer)} />,
  code_defect_label: (x) => <Card {...x} fill={COLORS.greyLight} text={words(x.layer)} />,
  code_nego_table: (x) => <Card {...x} fill={COLORS.greyPale} text={x.layer.text} />,
  code_price_tag: (x) => <Tag {...x} fill={COLORS.red} text={words(x.layer)} />,

  code_arrow: (x) =>
    p(x.layer).span ? <Connector {...x} /> : <ArrowShape {...x} color={COLORS.ink} dir="right" />,
  code_vitd_arrow: (x) => <ArrowShape {...x} color={COLORS.green} dir="up" curved />,
  code_uv_arrow: (x) => <ArrowShape {...x} color={COLORS.red} dir="down" />,
  code_risk_arrow: (x) => <ArrowShape {...x} color={COLORS.green} dir="down" />,
  code_selection_arrow: (x) => <ArrowShape {...x} color={COLORS.red} dir="steep" />,

  code_divider_line: (x) => <Line {...x} color={COLORS.grey} vertical />,
  code_supply_line: (x) => <Line {...x} color={COLORS.teal} dashed={flag(x.layer, "broken")} />,
  code_timeline_blurred: (x) => <Line {...x} color={COLORS.grey} dashed />,
  code_adhesion_bridge: (x) => <Line {...x} color={COLORS.red} />,
  code_gap_marker: (x) => <Line {...x} color={COLORS.ink} vertical />,
  code_trail_dots: (x) => <Ticks {...x} count={4} d={12} color={COLORS.grey} />,
  code_repeat_ticks: (x) => <Ticks {...x} count={5} d={28} color={COLORS.amber} />,
  code_tan_row: (x) => <Ticks {...x} count={5} d={34} color="#C8A882" />,
  code_signal_pulse: (x) => <Ticks {...x} count={3} d={22} color={COLORS.teal} />,
  code_ray: (x) => <Burst {...x} color={COLORS.amber} spokes={3} len={90} />,

  code_heat_lines: (x) => <Waves {...x} color={COLORS.red} count={3} />,
  code_clot_shape: (x) => <Blob {...x} color={COLORS.red} dots={6} />,
  code_clump_cluster: (x) => <Blob {...x} color={COLORS.red} dots={5} />,
  code_coat_shape: (x) => <Blob {...x} color={COLORS.teal} dots={4} />,
  code_glucose_line: (x) => <Chart {...x} drop={p(x.layer).drop !== false} />,
  code_bounce_path: (x) => <Chart {...x} drop={false} />,
  code_icon_trio: (x) => <CopyCards {...x} />,
  code_chapter_reset: () => null,
};

export const Widget: React.FC<{ layer: Layer }> = ({ layer }) => {
  const C = WIDGETS[layer.kind as string];
  return C ? <C layer={layer} /> : <Stub layer={layer} />;
};
