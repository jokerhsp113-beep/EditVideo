import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import timeline from './timeline-v01.json';

export const Graphics: React.FC = () => {
  const frame = useCurrentFrame();
  const stageScene = timeline.scenes.find((s) => s.asset_id === 'G01');
  const stageCue = timeline.overlays.find((s) => s.asset_id === 'G01');
  const inset = timeline.overlays.find((s) => s.asset_id === 'G02');
  return <>
    {stageScene && stageCue && frame >= stageScene.from && frame < stageCue.from ?
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 340, backgroundColor: '#f2e7cf'}}/> : null}
    {inset && frame >= inset.from && frame < inset.to ?
      <Img src={staticFile(inset.file)} style={{position: 'absolute', width: 470, height: 274, right: 85, top: 55}}/> : null}
    {frame >= timeline.orientation.from && frame < timeline.orientation.to ?
      <div style={{position: 'absolute', left: 100, bottom: 85, color: '#fff8e9', fontFamily: 'Georgia, serif', backgroundColor: 'rgba(42, 32, 24, .85)', padding: '18px 28px', borderLeft: '4px solid #c6a66c'}}>
        <div style={{fontSize: 38, letterSpacing: 1}}>Gion, Kyoto · c. 1895</div>
        <div style={{fontSize: 27, marginTop: 8}}>Maiko · Geisha apprentice</div>
      </div> : null}
    {frame >= timeline.durationInFrames - 12 ? <AbsoluteFill style={{backgroundColor: '#201912', opacity: (frame - (timeline.durationInFrames - 12))/12}}/> : null}
  </>;
};
