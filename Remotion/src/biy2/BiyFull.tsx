import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { BiySection } from "./BiySection";
import { COLORS } from "./theme";
import { SECTION_IDS } from "./timeline";

/** the breath between items lives inside each section's own tail, where the
 *  last beat is still on screen — the timeline never goes blank */
export const SECTION_GAP_SECONDS = 0;
export const SECTION_PAD_SECONDS = 0.45;

export const BiyFull: React.FC<{ durations: Record<string, number>; debug?: boolean }> = ({
  durations,
  debug,
}) => {
  const { fps } = useVideoConfig();
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {SECTION_IDS.map((id) => {
        const frames = Math.round((durations[id] + SECTION_PAD_SECONDS) * fps);
        const from = cursor;
        cursor += frames + Math.round(SECTION_GAP_SECONDS * fps);
        return (
          <Sequence key={id} from={from} durationInFrames={frames} name={`section-${id}`}>
            <BiySection section={id} debug={debug} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
