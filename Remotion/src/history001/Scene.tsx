import React from 'react';
import {AbsoluteFill, CanvasImage, interpolate, staticFile, useCurrentFrame} from 'remotion';

export type SceneData = {asset_id: string; file: string; from: number; to: number; duration: number; motion: string};

export const Scene: React.FC<{scene: SceneData}> = ({scene}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#f2e7cf', overflow: 'hidden'}}>
      <CanvasImage src={staticFile(scene.file)} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        scale: scene.motion === 'hold' ? 1 : interpolate(frame, [0, Math.max(1, scene.duration - 1)], scene.motion === 'push' ? [1, 1.022] : [1.022, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
      }}/>
    </AbsoluteFill>
  );
};
