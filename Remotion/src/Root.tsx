import "./index.css";
import { MyComposition } from "./Composition";
import { BiyCompositions } from "./biy/BiyRoot";
import { Biy2Compositions } from "./biy2/BiyRoot";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <BiyCompositions />
      <Biy2Compositions />
    </>
  );
};
