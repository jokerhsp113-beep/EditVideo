import React from "react";
import { AbsoluteFill, Composition, Folder, Sequence } from "remotion";
import { compilePlan, parsePlan, validateAssets } from "./core.mjs";
import { PlanView } from "./SceneView";
import type { Asset, CompiledPlan } from "./types";
import mechanism from "../examples/mechanism.json";
import comparison from "../examples/comparison.json";
import evidence from "../examples/evidence.json";
import catalog from "../library/asset-catalog.json";

const assets=new Map<string,Asset>((catalog.assets as Asset[]).map(a=>[a.id,a]));
const plans=[mechanism,comparison,evidence].map(raw=>{
  const plan=compilePlan(parsePlan(raw));
  const errors=validateAssets(plan,[...assets.values()]).filter(i=>i.severity==="error");
  if(errors.length) throw new Error(errors.map(e=>`${e.code}: ${e.message}`).join("\n"));
  return plan;
});
const Example:React.FC<{plan:CompiledPlan}>=({plan})=><PlanView plan={plan} assets={assets}/>;
const Reel:React.FC=()=>{
  let cursor=0;
  return <AbsoluteFill>{plans.map(plan=>{
    const from=cursor;cursor+=plan.durationFrames;
    return <Sequence key={plan.id} from={from} durationInFrames={plan.durationFrames} name={plan.title}><Example plan={plan}/></Sequence>;
  })}</AbsoluteFill>;
};
export const ProfessionalEditorCompositions:React.FC=()=> <Folder name="Professional-Editor">
  {plans.map(plan=><Composition key={plan.id} id={`ProEditor-${plan.id}`} component={Example} defaultProps={{plan}} durationInFrames={plan.durationFrames} fps={plan.fps} width={plan.width} height={plan.height}/>)}
  <Composition id="ProEditor-Reel" component={Reel} durationInFrames={plans.reduce((sum,p)=>sum+p.durationFrames,0)} fps={30} width={1920} height={1080}/>
</Folder>;
