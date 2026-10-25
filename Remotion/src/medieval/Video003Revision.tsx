import React from 'react';
import {AbsoluteFill, Audio, Composition, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {handwriting} from '../design/typography';
import {InkArrow} from '../design/Ink';
import defaultProps from '../../examples/medieval/video003-v02.json';

type Card = {x:number; y:number; width:number; height:number; lines:string[]; size:number};
type Arrow = {x1:number; y1:number; x2:number; y2:number; color:string};
type Definition = {cards:Card[]; arrows:Arrow[]; raw:string; particles?:{x1:number;y1:number;x2:number;y2:number}[]};
type Overlay = {id:string; variant:string; start:number; end:number; cardDelays?:number[]; arrowDelays?:number[]};
type Cut = {file:string; start:number; end:number; scale:number; x:number; y:number; motion:number};
type Shot = {id:string; start:number; end:number; cuts:Cut[]};
type Sfx = {start:number; file:string; duration:number; volume:number};
type Plan = {fps:number; width:number; height:number; duration:number; voice:string;
  shots:Shot[]; overlays:Overlay[]; definitions:Record<string,Definition>; sfx:Sfx[]};
const clamp = (v:number) => Math.max(0,Math.min(1,v));

const HandOverlay: React.FC<{overlay:Overlay; definition:Definition; fps:number}> = ({overlay,definition,fps}) => {
  const global = useCurrentFrame();
  const frame = global-overlay.start;
  const reveal = clamp(frame/(fps*.14));
  const grain = clamp((frame-fps*.15)/(fps*.75));
  const easeGrain = grain*grain*(3-2*grain);
  return <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position:'absolute',inset:0,overflow:'hidden',fontFamily:handwriting,fontWeight:400,fontSynthesis:'none'}}>
    <g opacity={reveal} dangerouslySetInnerHTML={{__html:definition.raw}}/>
    {definition.particles?.map((p,i)=><ellipse key={'grain-'+i}
      cx={p.x1+(p.x2-p.x1)*easeGrain}
      cy={p.y1+(p.y2-p.y1)*easeGrain-Math.sin(Math.PI*easeGrain)*165}
      rx={11} ry={6} fill="#efd079" stroke="#694b22" strokeWidth={2} opacity={reveal}/>)}
    {definition.arrows.map((a,i)=>{
      const progress=clamp((frame-(overlay.arrowDelays?.[i] ?? 0)-fps*.12)/(fps*.35));
      return <g key={'arrow-'+i}>
      <InkArrow from={{x:a.x1,y:a.y1}} to={{x:a.x2,y:a.y2}} color="#fff5df" strokeWidth={17} progress={progress}/>
      <InkArrow from={{x:a.x1,y:a.y1}} to={{x:a.x2,y:a.y2}} color={a.color} strokeWidth={9} progress={progress}/>
    </g>;})}
    {definition.cards.map((c,i)=>{
      const delay=overlay.cardDelays?.[i] ?? 0;
      const opacity=clamp((frame-delay)/(fps*.14));
      if(frame<delay) return null;
      return <g key={'card-'+i} opacity={opacity}>
        <rect x={c.x} y={c.y} width={c.width} height={c.height} rx={14} fill="#fff5df" stroke="#443325" strokeWidth={3}/>
        <text x={c.x+24} y={c.y+15+c.size*.91} fontSize={c.size} fill="#30291f">
          {c.lines.map((line,j)=><tspan key={j} x={c.x+24} dy={j===0 ? 0 : c.size*1.12}>{line}</tspan>)}
        </text>
      </g>;
    })}
  </svg>;
};

export const Video003Revision: React.FC<{plan:Plan}> = ({plan}) => {
  const frame=useCurrentFrame();
  const shot=plan.shots.find(s=>frame>=s.start && frame<s.end);
  const cut=shot?.cuts.find(c=>frame>=c.start && frame<c.end);
  const t=cut ? clamp((frame-cut.start)/Math.max(1,cut.end-cut.start-1)) : 0;
  const eased=t*t*(3-2*t);
  const scale=cut ? cut.scale+cut.motion*eased : 1;
  return <AbsoluteFill style={{background:'#f4ede1',overflow:'hidden'}}>
    {cut ? <Img key={cut.file} src={staticFile(cut.file)} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',transform:'scale('+scale+')',transformOrigin:cut.x+'% '+cut.y+'%'}}/> : null}
    {plan.overlays.filter(o=>frame>=o.start && frame<o.end).map(o=><HandOverlay key={o.id} overlay={o} definition={plan.definitions[o.variant]} fps={plan.fps}/>)}
    <Audio src={staticFile(plan.voice)}/>
    {plan.sfx.map((s,i)=><Sequence key={'sfx-'+i} from={s.start} durationInFrames={s.duration}>
      <Audio src={staticFile(s.file)} volume={()=>s.volume}/>
    </Sequence>)}
  </AbsoluteFill>;
};

export const Video003RevisionComposition: React.FC = () => <Composition id="VIDEO003-REVISION" component={Video003Revision}
  defaultProps={defaultProps as {plan:Plan}} width={1280} height={720} fps={24} durationInFrames={1}
  calculateMetadata={({props})=>({width:props.plan.width,height:props.plan.height,fps:props.plan.fps,durationInFrames:props.plan.duration})}/>;
