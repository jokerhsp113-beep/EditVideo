import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MedievalEpisode} from '../MedievalEpisode';
import {resolveEpisode} from '../contracts';
import props from '../../../examples/medieval/video005-draft-v01.props.json';

const Video005Root: React.FC = () => <Composition
  id="VIDEO005-DRAFT-V01"
  component={MedievalEpisode}
  defaultProps={props}
  width={1920}
  height={1080}
  fps={30}
  durationInFrames={props.episode.durationInFrames}
  calculateMetadata={({props: input}) => {
    const e=resolveEpisode(input.episode);
    return {width:e.width,height:e.height,fps:e.fps,durationInFrames:e.durationInFrames};
  }}
/>;
registerRoot(Video005Root);
