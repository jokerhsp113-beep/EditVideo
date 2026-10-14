import React, { useMemo } from "react";
import type { Caption } from "@remotion/captions";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ResolvedShot } from "./types";
import { COLORS, body, headline } from "./theme";

const META: Record<string, { n: string; title: string; accent: string }> = {
  "00": { n: "HOOK", title: "HIDDEN SETTINGS", accent: "#FFBE2E" },
  "01": { n: "01", title: "SKIN & SUNLIGHT", accent: "#F5A623" },
  "02": { n: "02", title: "ALCOHOL RESPONSE", accent: "#F06449" },
  "03": { n: "03", title: "IMMUNE DEFENSE", accent: "#E63946" },
  "04": { n: "04", title: "INFECTION RESISTANCE", accent: "#1FB8A8" },
  "05": { n: "05", title: "BLOOD & CLOTTING", accent: "#E63946" },
  "06": { n: "06", title: "ENERGY & METABOLISM", accent: "#FFBE2E" },
  "07": { n: "07", title: "SURVIVAL TRADE-OFFS", accent: "#1FB8A8" },
  "08": { n: "END", title: "THE RECEIPT", accent: "#E63946" },
};

export const RetentionBackground: React.FC<{ section: string }> = ({ section }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const meta = META[section] ?? META["00"];
  const drift = Math.sin((frame / fps) * 0.5) * 24;
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      <div style={{
        position: "absolute", width: 620, height: 620, borderRadius: 999,
        left: -270 + drift, top: -300, background: meta.accent, opacity: 0.055,
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: 999,
        right: -250 - drift, bottom: -270, background: COLORS.teal, opacity: 0.045,
      }} />
      <div style={{
        position: "absolute", left: 0, top: 0, height: 8,
        width: `${interpolate(frame, [0, 2.2 * fps], [0, 100], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        })}%`, background: meta.accent, opacity: 0.9,
      }} />
    </AbsoluteFill>
  );
};

export const SectionChrome: React.FC<{ section: string }> = ({ section }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const meta = META[section] ?? META["00"];
  const reveal = spring({ frame, fps, config: { damping: 22, mass: 0.55 } });
  if (section === "00" || section === "08") return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 80 }}>
      <div style={{
        position: "absolute", left: 72, top: 38, display: "flex", alignItems: "center",
        gap: 14, opacity: 0.82, translate: `${interpolate(reveal, [0, 1], [-28, 0])}px 0`,
      }}>
        <div style={{
          fontFamily: headline, fontSize: 27, lineHeight: 1, color: COLORS.ink,
          background: meta.accent, border: `4px solid ${COLORS.ink}`, borderRadius: 12,
          padding: "8px 13px 6px", boxShadow: "none",
        }}>{meta.n}</div>
        <div style={{ fontFamily: headline, fontSize: 30, letterSpacing: 0.3, color: COLORS.ink }}>
          {meta.title}
        </div>
      </div>
      <div style={{
        position: "absolute", right: 72, top: 48, fontFamily: body, fontWeight: 400,
        fontSize: 20, letterSpacing: 0.5, color: COLORS.grey, opacity: 0.62,
      }}>BUILT INTO YOU</div>
    </AbsoluteFill>
  );
};

export const HookOverlay: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled || frame > 5.2 * fps) return null;
  const pop = spring({ frame, fps, config: { damping: 17, mass: 0.55 } });
  const leave = interpolate(frame, [4.2 * fps, 5.2 * fps], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 90, opacity: leave }}>
      <div style={{
        position: "absolute", left: 96, top: 118, width: 720,
        scale: interpolate(pop, [0, 1], [0.88, 1], { extrapolateRight: "clamp" }),
        transformOrigin: "left top",
      }}>
        <div style={{
          display: "inline-block", fontFamily: body, fontWeight: 400, fontSize: 25,
          letterSpacing: 0.5, color: COLORS.red, marginBottom: 8,
        }}>THE ANSWER IS ALREADY INSIDE YOU</div>
        <div style={{
          fontFamily: headline, fontSize: 88, lineHeight: 0.93, letterSpacing: 1,
          color: COLORS.ink, textShadow: "none",
        }}>YOUR BODY CAME<br />WITH SETTINGS</div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {["PAIN", "IMMUNITY", "BLOOD", "METABOLISM"].map((word, i) => (
            <div key={word} style={{
              opacity: interpolate(frame, [(0.45 + i * 0.18) * fps, (0.7 + i * 0.18) * fps], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              }),
              fontFamily: body, fontWeight: 400, fontSize: 21, color: COLORS.ink,
              border: `3px solid ${COLORS.ink}`, borderRadius: 999, padding: "7px 13px 6px",
              background: i % 2 ? COLORS.teal : "#FFBE2E",
            }}>{word}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

type CaptionPage = { startMs: number; endMs: number; items: Caption[] };

const captionPages = (captions: Caption[]): CaptionPage[] => {
  const pages: CaptionPage[] = [];
  let items: Caption[] = [];
  const flush = () => {
    if (!items.length) return;
    pages.push({ startMs: items[0].startMs, endMs: items[items.length - 1].endMs, items });
    items = [];
  };
  for (const c of captions) {
    items.push(c);
    const words = items.reduce((n, x) => n + x.text.trim().split(/\s+/).length, 0);
    if (words >= 6 || /[.!?]$/.test(c.text.trim()) || c.endMs - items[0].startMs > 1450) flush();
  }
  flush();
  return pages;
};

export const CaptionStrip: React.FC<{
  captions: Caption[];
  leadFrames: number;
  shots: ResolvedShot[];
}> = ({ captions, leadFrames, shots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pages = useMemo(() => captionPages(captions), [captions]);
  const ms = ((frame - leadFrames) / fps) * 1000;
  const page = pages.find((p) => ms >= p.startMs && ms <= p.endMs + 90);
  if (!page || frame < leadFrames) return null;
  const activeShot = shots.find((s) => ms >= s.startMs && ms < s.endMs) ?? shots[shots.length - 1];
  const line = page.items.map((c) => c.text.trim()).join(" ");
  const captionWidth = Math.min(1520, Math.max(330, line.length * 24 + 70));
  const captionHeight = 82;

  // Captions normally sit at the bottom. Some authored shots deliberately use
  // that lane for a comparison, a ruler or a character's feet. Score six safe
  // placements against the active shot and use the clearest one. This keeps the
  // words readable without hiding the diagram they explain.
  const boxes = (activeShot?.layers ?? []).flatMap((layer) => {
    const size = Number((layer.props ?? {}).size ?? 0);
    const h = layer.h ?? (layer.kind === "text" ? Math.max(80, size * 1.12) : layer.w ?? 300);
    const w = layer.w ?? (layer.kind === "text"
      ? Math.max(180, (layer.text?.length ?? 6) * Math.max(54, size) * 0.56)
      : h * 1.15);
    const positions = [[layer.x, layer.y]];
    const toX = (layer.props ?? {}).toX;
    const toY = (layer.props ?? {}).toY;
    if (typeof toX === "number" || typeof toY === "number") {
      positions.push([
        typeof toX === "number" ? toX : layer.x,
        typeof toY === "number" ? toY : layer.y,
      ]);
    }
    return positions.map(([x, y]) => ({
      l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2,
    }));
  });
  const candidates = [
    { x: (1920 - captionWidth) / 2, y: 1080 - 34 - captionHeight, bias: 0 },
    { x: 72, y: 1080 - 34 - captionHeight, bias: 0.08 },
    { x: 1920 - 72 - captionWidth, y: 1080 - 34 - captionHeight, bias: 0.08 },
    { x: (1920 - captionWidth) / 2, y: 116, bias: 0.18 },
    { x: 72, y: 116, bias: 0.25 },
    { x: 1920 - 72 - captionWidth, y: 116, bias: 0.25 },
  ];
  const score = (candidate: typeof candidates[number]) => boxes.reduce((total, box) => {
    const pad = 22;
    const overlapX = Math.max(0, Math.min(candidate.x + captionWidth, box.r + pad) - Math.max(candidate.x, box.l - pad));
    const overlapY = Math.max(0, Math.min(candidate.y + captionHeight, box.b + pad) - Math.max(candidate.y, box.t - pad));
    return total + (overlapX * overlapY) / (captionWidth * captionHeight);
  }, candidate.bias);
  const placement = candidates.reduce((best, candidate) => score(candidate) < score(best) ? candidate : best);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 110 }}>
      <div style={{
        position: "absolute", left: placement.x, top: placement.y,
        width: captionWidth, boxSizing: "border-box", padding: "11px 24px 12px", borderRadius: 18,
        background: "rgba(255,252,241,0.92)", border: `3px solid rgba(25,25,25,0.72)`,
        boxShadow: "none", whiteSpace: "nowrap",
        fontFamily: body, fontWeight: 400, fontSize: 43, lineHeight: 1.05,
        color: COLORS.ink, textAlign: "center",
      }}>
        {page.items.map((c, i) => {
          const active = ms >= c.startMs && ms <= c.endMs + 35;
          return <React.Fragment key={`${c.startMs}-${i}`}>
            <span style={{ color: active ? COLORS.red : COLORS.ink, scale: active ? 1.06 : 1, display: "inline-block" }}>
              {c.text.trim()}
            </span>{i < page.items.length - 1 ? " " : ""}
          </React.Fragment>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const REACTIONS = ["stick_curious_v01.png", "stick_surprised_v01.png", "stick_aha_v01.png"];

export const GuideReaction: React.FC<{
  shot: ResolvedShot;
  section: string;
  index: number;
  durationInFrames: number;
}> = ({ shot, section, index, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hasCharacter = shot.layers.some((l) => l.src?.startsWith("stick_"));
  const eligible = shot.guideReaction === true && !hasCharacter && durationInFrames >= 5.2 * fps && index % 4 === 2;
  if (!eligible) return null;
  const start = Math.min(Math.round(durationInFrames * 0.32), Math.round(2.1 * fps));
  const end = Math.max(start + 24, Math.round(durationInFrames * 0.82));
  if (frame < start || frame > end + 8) return null;
  const avgX = shot.layers.length
    ? shot.layers.reduce((n, l) => n + l.x, 0) / shot.layers.length
    : 960;
  const onLeft = avgX > 980;
  const enter = spring({ frame: frame - start, fps, config: { damping: 16, mass: 0.5 } });
  const exit = interpolate(frame, [end, end + 8], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const seed = Number(section) * 17 + index;
  const file = REACTIONS[Math.abs(seed) % REACTIONS.length];
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 62 }}>
      <div style={{
        position: "absolute", left: onLeft ? 95 : undefined, right: onLeft ? undefined : 95,
        bottom: 125, width: 265, height: 430, overflow: "hidden",
        opacity: exit, translate: `0 ${interpolate(enter, [0, 1], [80, 0])}px`,
        rotate: `${Math.sin((frame - start) / 12) * 0.8}deg`,
      }}>
        <div style={{
          position: "absolute", width: 235, height: 235, borderRadius: 999,
          left: 15, top: 44, background: META[section]?.accent ?? "#FFBE2E", opacity: 0.18,
        }} />
        <Img src={staticFile(`biy2/reactions/${file}`)} style={{
          position: "absolute", width: 265, height: 430, objectFit: "contain", objectPosition: "center bottom",
        }} />
      </div>
    </AbsoluteFill>
  );
};
