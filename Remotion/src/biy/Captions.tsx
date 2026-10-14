import React, { useMemo } from "react";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, body } from "./theme";

const SWITCH_EVERY_MS = 1100;

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteMs = page.startMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 72 }}>
      <div
        style={{
          fontFamily: body,
          fontWeight: 400,
          fontSize: 52,
          whiteSpace: "pre",
          color: COLORS.ink,
          background: "rgba(255,255,255,0.86)",
          borderRadius: 18,
          padding: "14px 30px",
          maxWidth: 1500,
          textAlign: "center",
        }}
      >
        {page.tokens.map((token, i) => {
          const active = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
          return (
            <span key={`${token.fromMs}-${i}`} style={{ color: active ? COLORS.teal : COLORS.ink }}>
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: SWITCH_EVERY_MS }),
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, index) => {
        const next = pages[index + 1] ?? null;
        const start = (page.startMs / 1000) * fps;
        const end = Math.min(
          next ? (next.startMs / 1000) * fps : Infinity,
          start + (SWITCH_EVERY_MS / 1000) * fps,
        );
        const duration = end - start;
        if (duration <= 0) return null;
        return (
          <Sequence key={index} from={Math.round(start)} durationInFrames={Math.ceil(duration)}>
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
