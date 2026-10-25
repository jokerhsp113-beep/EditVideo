import React from "react";
import {handwriting} from "../../../src/design/typography";
import {InkLine} from "../../../src/design/Ink";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { audioGain, layerState, worldPoint } from "./core.mjs";
import type { Asset, CompiledPlan, CompiledScene, Layer } from "./types";
import profile from "../library/profiles/biy-science.json";

const SceneLayer: React.FC<{ layer: Layer; scene: CompiledScene; assets: Map<string, Asset> }> = ({ layer, scene, assets }) => {
  const frame = useCurrentFrame();
  const state = layerState(scene, layer, frame);
  const pivot = layer.pivot ?? { x: 0.5, y: 0.5 };
  const children = scene.layers.filter(l => l.parentId === layer.id).sort((a,b)=>(a.z??0)-(b.z??0));
  if (layer.kind === "connection") {
    const from = worldPoint(scene, layer.fromId!, layer.fromPoint ?? {x:0.5,y:0.5}, frame);
    const to = worldPoint(scene, layer.toId!, layer.toPoint ?? {x:0.5,y:0.5}, frame);
    return <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible",opacity:state.opacity,zIndex:layer.z??0}}>
      <InkLine from={from} to={to} color={layer.stroke??profile.muted} strokeWidth={layer.strokeWidth??4}/>
    </svg>;
  }
  let content: React.ReactNode;
  if (layer.kind === "image") {
    const asset = assets.get(layer.assetId!);
    if (!asset || asset.mediaType !== "image" || asset.status === "rejected") throw new Error(`Unusable image: ${layer.assetId}`);
    content = <Img src={staticFile(asset.path)} style={{width:"100%",height:"100%",objectFit:"contain"}} />;
  } else if (layer.kind === "text") {
    content = <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:layer.align==="left"?"flex-start":layer.align==="right"?"flex-end":"center",fontSize:layer.fontSize,fontWeight:400,lineHeight:1.18,whiteSpace:"pre-wrap",textAlign:layer.align??"center",color:layer.fill??profile.ink}}>{layer.text}</div>;
  } else {
    content = <div style={{width:"100%",height:"100%",background:layer.fill??"transparent",border:layer.stroke?`${layer.strokeWidth??2}px solid ${layer.stroke}`:undefined,borderRadius:layer.kind==="ellipse"?"50%":layer.radius??0,boxSizing:"border-box"}}/>;
  }
  return <div style={{position:"absolute",left:state.x-layer.width/2,top:state.y-layer.height/2,width:layer.width,height:layer.height,zIndex:layer.z??0,opacity:state.opacity,transformOrigin:`${pivot.x*100}% ${pivot.y*100}%`,scale:state.scale,rotate:`${state.rotate}deg`}}>
    {content}
    {children.map(child=><SceneLayer key={child.id} layer={child} scene={scene} assets={assets}/>)}
  </div>;
};

export const SceneView: React.FC<{scene: CompiledScene; plan: CompiledPlan; assets: Map<string,Asset>}> = ({scene,plan,assets}) => {
  const frame=useCurrentFrame();
  const camera=scene.camera;
  const cx=camera?interpolate(frame,[0,Math.max(1,scene.durationFrames-1)],[camera.from.x,camera.to.x],{extrapolateRight:"clamp"}):plan.width/2;
  const cy=camera?interpolate(frame,[0,Math.max(1,scene.durationFrames-1)],[camera.from.y,camera.to.y],{extrapolateRight:"clamp"}):plan.height/2;
  const scale=camera?interpolate(frame,[0,Math.max(1,scene.durationFrames-1)],[camera.from.scale,camera.to.scale],{extrapolateRight:"clamp"}):1;
  return <AbsoluteFill style={{overflow:"hidden",background:profile.background,fontFamily:handwriting}}>
    <AbsoluteFill style={{transformOrigin:"0 0",transform:`translate(${plan.width/2}px, ${plan.height/2}px) scale(${scale}) translate(${-cx}px, ${-cy}px)`}}>
      {scene.layers.filter(l=>!l.parentId).sort((a,b)=>(a.z??0)-(b.z??0)).map(layer=><SceneLayer key={layer.id} layer={layer} scene={scene} assets={assets}/>)}
    </AbsoluteFill>
    {plan.status!=="final"?<div style={{position:"absolute",right:96,bottom:26,fontSize:22,letterSpacing:1,color:profile.muted}}>MOTION STUDY · DRAFT</div>:null}
  </AbsoluteFill>;
};

export const PlanView: React.FC<{plan:CompiledPlan;assets:Map<string,Asset>}> = ({plan,assets}) => {
  const frame=useCurrentFrame();
  const caption=(plan.captions??[]).find(c=>frame*1000/plan.fps>=c.startMs&&frame*1000/plan.fps<c.endMs);
  return <AbsoluteFill>
    {plan.scenes.map(scene=><Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationFrames} name={scene.id}><SceneView scene={scene} plan={plan} assets={assets}/></Sequence>)}
    {plan.audio.map(track=>{
      const asset=assets.get(track.assetId);
      if(!asset||asset.mediaType!=="audio"||asset.status==="rejected") throw new Error(`Unusable audio: ${track.assetId}`);
      return <Sequence key={track.id} from={track.startFrame} durationInFrames={track.durationFrames} name={`${track.role}: ${track.reason}`}>
        <Audio src={staticFile(asset.path)} trimBefore={track.trimBeforeFrames??0} trimAfter={(track.trimBeforeFrames??0)+track.durationFrames} volume={f=>audioGain(track,f-(track.trimBeforeFrames??0),plan.audio,plan.fps)}/>
      </Sequence>;
    })}
    {caption?<div style={{position:"absolute",left:160,right:160,bottom:84,textAlign:"center",fontFamily:handwriting,fontSize:profile.captionSize,fontWeight:400,color:profile.ink,background:"rgba(246,244,239,0.95)",padding:"12px 24px",borderRadius:12}}>{caption.text.trim()}</div>:null}
  </AbsoluteFill>;
};
