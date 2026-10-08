import { Composition } from "remotion";
import { InsideTheBodyVideo } from "./VideoComposition";
import { InsideTheBodyVideo003 } from "./VideoComposition003";
import { InsideTheBodyVideo004 } from "./VideoComposition004";
import manifestJson from "./data/manifest_shots.json";
import manifestJson003 from "./data/manifest_shots_video003.json";
import manifestJson004 from "./data/manifest_shots_video004.json";

const FPS = 30;
const totalRealDurationSeconds = (
  manifestJson as unknown as { _meta: { totalRealDurationSeconds: number } }
)._meta.totalRealDurationSeconds;
const totalRealDurationSeconds003 = (
  manifestJson003 as unknown as { _meta: { totalRealDurationSeconds: number } }
)._meta.totalRealDurationSeconds;
const totalRealDurationSeconds004 = (
  manifestJson004 as unknown as { _meta: { totalRealDurationSeconds: number } }
)._meta.totalRealDurationSeconds;

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="InsideTheBody-Video002"
        component={InsideTheBodyVideo}
        durationInFrames={Math.ceil(totalRealDurationSeconds * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="InsideTheBody-Video003"
        component={InsideTheBodyVideo003}
        durationInFrames={Math.ceil(totalRealDurationSeconds003 * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="InsideTheBody-Video004"
        component={InsideTheBodyVideo004}
        durationInFrames={Math.ceil(totalRealDurationSeconds004 * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
