import React from "react";
import { Composition } from "remotion";
import { BiyFull, SECTION_GAP_SECONDS, SECTION_PAD_SECONDS } from "./BiyFull";
import { BiySection } from "./BiySection";
import { CANVAS } from "./theme";
import { SECTION_IDS } from "./timeline";
import durations from "./durations.json";

const D = durations as Record<string, number>;

const totalFrames = Math.round(
  SECTION_IDS.reduce(
    (sum, id) => sum + (D[id] + SECTION_PAD_SECONDS + SECTION_GAP_SECONDS) * CANVAS.fps,
    0,
  ),
);

export const Biy2Compositions: React.FC = () => (
  <>
    <Composition
      id="BIY2-FULL"
      component={BiyFull as never}
      durationInFrames={totalFrames}
      {...CANVAS}
      defaultProps={{ durations: D, debug: false } as never}
    />
    {SECTION_IDS.map((id) => (
      <Composition
        key={id}
        id={`BIY2-S${id}`}
        component={BiySection as never}
        durationInFrames={Math.round((D[id] + SECTION_PAD_SECONDS) * CANVAS.fps)}
        {...CANVAS}
        defaultProps={{ section: id, debug: false } as never}
      />
    ))}
  </>
);
