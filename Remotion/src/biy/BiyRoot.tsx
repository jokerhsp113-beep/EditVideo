import React from "react";
import { Composition, Folder } from "remotion";
import { BiyFull, fullVideoFrames, sectionFrames } from "./BiyFull";
import { BiySection } from "./BiySection";
import { CANVAS } from "./theme";
import { TIMELINES } from "./timeline";

export const BiyCompositions: React.FC = () => {
  return (
    <Folder name="BuiltIntoYou-V001">
      <Composition
        id="BIY-FULL"
        component={BiyFull}
        durationInFrames={fullVideoFrames()}
        fps={CANVAS.fps}
        width={CANVAS.width}
        height={CANVAS.height}
        defaultProps={{ showCaptions: false, debug: false }}
      />
      {Object.keys(TIMELINES).map((section) => (
        <Composition
          key={section}
          id={`BIY-S${section}`}
          component={BiySection}
          durationInFrames={sectionFrames(section)}
          fps={CANVAS.fps}
          width={CANVAS.width}
          height={CANVAS.height}
          defaultProps={{ section, showCaptions: false, debug: false }}
        />
      ))}
    </Folder>
  );
};
