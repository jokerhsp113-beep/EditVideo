import React from 'react';
import {Composition} from 'remotion';
import {MedievalEpisode} from './MedievalEpisode';
import {resolveEpisode} from './contracts';
import smoke from './smoke.json';
import styleUpgrade from '../../examples/medieval/style-upgrade-v02.props.json';
import video004V03 from '../../examples/medieval/video004-v03.props.json';
import video004V05 from '../../examples/medieval/video004-v05.props.json';
import video004Final from '../../examples/medieval/video004-final.props.json';
import {Video003RevisionComposition} from './Video003Revision';

export const MedievalCompositions: React.FC = () => <><Composition
  id="MEDIEVAL-EPISODE"
  component={MedievalEpisode}
  defaultProps={{episode:smoke}}
  width={smoke.width} height={smoke.height} fps={smoke.fps} durationInFrames={smoke.durationInFrames}
  calculateMetadata={({props}) => {
    const e = resolveEpisode(props.episode);
    return {width:e.width,height:e.height,fps:e.fps,durationInFrames:e.durationInFrames};
  }}
/><Composition
  id="MEDIEVAL-STYLE-UPGRADE"
  component={MedievalEpisode}
  defaultProps={styleUpgrade}
  width={1920} height={1080} fps={30} durationInFrames={180}
  calculateMetadata={({props}) => {
    const e=resolveEpisode(props.episode);
    return {width:e.width,height:e.height,fps:e.fps,durationInFrames:e.durationInFrames};
  }}
/>
<Composition
  id="VIDEO004-EDIT-V03"
  component={MedievalEpisode}
  defaultProps={video004V03}
  width={video004V03.episode.width} height={video004V03.episode.height}
  fps={video004V03.episode.fps} durationInFrames={video004V03.episode.durationInFrames}
  calculateMetadata={({props}) => {
    const e=resolveEpisode(props.episode);
    return {width:e.width,height:e.height,fps:e.fps,durationInFrames:e.durationInFrames};
  }}
/>
<Composition
  id="VIDEO004-FINAL"
  component={MedievalEpisode}
  defaultProps={video004Final}
  width={video004Final.episode.width} height={video004Final.episode.height}
  fps={video004Final.episode.fps} durationInFrames={video004Final.episode.durationInFrames}
  calculateMetadata={({props}) => {
    const e=resolveEpisode(props.episode);
    return {width:e.width,height:e.height,fps:e.fps,durationInFrames:e.durationInFrames};
  }}
/>
<Composition id="VIDEO004-V05-VARIETY" component={MedievalEpisode} defaultProps={video004V05}
 width={1920} height={1080} fps={30} durationInFrames={video004V05.episode.durationInFrames}/>
<Video003RevisionComposition/></>;
