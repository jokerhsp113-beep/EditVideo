import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {HistoryVideo001} from './HistoryVideo001';
import timeline from './timeline-v01.json';

const HistoryRoot: React.FC = () => <>
  <Composition id="HistoryVideo001" component={HistoryVideo001} width={1920} height={1080} fps={30} durationInFrames={timeline.durationInFrames}/>
  <Composition id="HistoryVideo001-Opening" component={HistoryVideo001} width={1920} height={1080} fps={30} durationInFrames={1800}/>
</>;
registerRoot(HistoryRoot);
