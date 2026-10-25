import React from 'react';
import {AbsoluteFill} from 'remotion';
import {MedievalEpisode} from '../MedievalEpisode';

export const Video005RevisionV02:React.FC<{episode:unknown}>=({episode})=><AbsoluteFill className="video005-revision-v02">
  <style>{`.video005-revision-v02 div {-webkit-text-stroke:0 !important;text-shadow:none !important;}`}</style>
  <MedievalEpisode episode={episode}/>
</AbsoluteFill>;
