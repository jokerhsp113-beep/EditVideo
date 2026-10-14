import "./index.css";
import {Composition} from "remotion";
import {VisualStyleReview} from "./design/VisualStyleReview";
import { MyComposition } from "./Composition";
import { BiyCompositions } from "./biy/BiyRoot";
import { Biy2Compositions } from "./biy2/BiyRoot";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="BIY-VisualStyle-Review" component={VisualStyleReview} durationInFrames={90} fps={30} width={1920} height={1080}/>
      <MyComposition />
      <BiyCompositions />
      <Biy2Compositions />
    </>
  );
};
