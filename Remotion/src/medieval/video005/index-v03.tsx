import React from 'react';
import {Composition,registerRoot,AbsoluteFill} from 'remotion';
import {MedievalEpisode} from '../MedievalEpisode';
import {resolveEpisode} from '../contracts';
import props from '../../../examples/medieval/video005-draft-v03.props.json';
const Episode:React.FC<{episode:unknown}>=({episode})=><AbsoluteFill className="video005-v03">
<style>{`.video005-v03 div {-webkit-text-stroke:0 !important;text-shadow:none !important}.video005-v03 div[style*="255, 247, 232"],.video005-v03 div[style*="#FFF7E8"] {-webkit-text-stroke:5px #111820 !important;paint-order:stroke fill;text-shadow:0 3px 8px rgba(0,0,0,.8) !important}`}</style>
<MedievalEpisode episode={episode}/></AbsoluteFill>;
const Root:React.FC=()=> <Composition id="VIDEO005-DRAFT-V03" component={Episode} defaultProps={props} width={1920} height={1080} fps={30} durationInFrames={props.episode.durationInFrames} calculateMetadata={({props:p})=>{const e=resolveEpisode(p.episode);return {width:e.width,height:e.height,fps:e.fps,durationInFrames:e.durationInFrames};}}/>;
registerRoot(Root);
