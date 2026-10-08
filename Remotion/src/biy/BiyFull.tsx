import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { BiySection } from "./BiySection";
import { CANVAS, COLORS } from "./theme";
import durations from "../../public/biy/audio.json";
import { TIMELINES } from "./timeline";

/** the breath between items now lives inside the section tail, where the
 *  progress-window beat is still on screen — the timeline never goes blank */
export const SECTION_GAP_SECONDS = 0;
export const SECTION_PAD_SECONDS = 1.1;

export const sectionFrames = (section: string) => {
  const lead = (TIMELINES[section].leadInMs ?? 300) / 1000;
  const seconds =
    (durations as Record<string, number>)[section] + lead + SECTION_PAD_SECONDS;
  return Math.ceil(seconds * CANVAS.fps);
};

export const fullVideoFrames = () =>
  Object.keys(TIMELINES).reduce(
    (total, section, i) =>
      total + sectionFrames(section) + (i === 0 ? 0 : Math.round(SECTION_GAP_SECONDS * CANVAS.fps)),
    0,
  );

export const BiyFull: React.FC<{ showCaptions?: boolean; debug?: boolean }> = ({
  showCaptions = false,
  debug = false,
}) => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {Object.keys(TIMELINES).map((section, i) => {
        const from = cursor + (i === 0 ? 0 : Math.round(SECTION_GAP_SECONDS * CANVAS.fps));
        const duration = sectionFrames(section);
        cursor = from + duration;
        return (
          <Sequence key={section} from={from} durationInFrames={duration} name={`S${section}`}>
            <BiySection section={section} showCaptions={showCaptions} debug={debug} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
