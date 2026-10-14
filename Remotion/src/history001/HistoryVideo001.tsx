import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import timeline from './timeline-v01.json';
import {Scene} from './Scene';
import {Graphics} from './Graphics';

export const HistoryVideo001: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#f2e7cf'}}>
    {timeline.scenes.map((scene) => <Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration} name={`${scene.id} · ${scene.asset_id}`}>
      <Scene scene={scene}/>
    </Sequence>)}
    <Graphics/>
    <Audio src={staticFile(timeline.audio)}/>
  </AbsoluteFill>
);
