import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Video005RevisionV02} from './RevisionV02';
import {resolveEpisode} from '../contracts';
import props from '../../../examples/medieval/video005-draft-v02.props.json';
const Root:React.FC=()=> <Composition id="VIDEO005-DRAFT-V02" component={Video005RevisionV02} defaultProps={props} width={1920} height={1080} fps={30} durationInFrames={props.episode.durationInFrames} calculateMetadata={({props:p})=>{const e=resolveEpisode(p.episode);return {width:e.width,height:e.height,fps:e.fps,durationInFrames:e.durationInFrames};}}/>;
registerRoot(Root);
