import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {resolveEpisode, sampleTransform, sampleGain} from './contracts';
import type {AudioClip, ResolvedEpisode, ResolvedLayer, ResolvedShot} from './contracts';
import {handwriting} from '../design/typography';
import profile from '../../channel/medieval/production-profile.v1.json';
import {NativeAsset} from './native-assets';
import type {NativeAssetId} from './native-assets';

const LayerView: React.FC<{layer: ResolvedLayer; episode: ResolvedEpisode; layers:ResolvedLayer[]}> = ({layer,episode,layers}) => {
  const frame = useCurrentFrame();
  const local = frame - layer.enterFrame;
  if (local < 0 || frame >= layer.exitFrame) return null;
  const motion = layer.motion;
  const t = motion ? Math.min(1, local / motion.durationFrames) : 0;
  const eased = t * t * (3 - 2 * t);
  const state=sampleTransform({x:layer.x + ((motion?.toX ?? layer.x)-layer.x)*eased,y:layer.y + ((motion?.toY ?? layer.y)-layer.y)*eased,scale:layer.scale + ((motion?.toScale ?? layer.scale)-layer.scale)*eased,rotate:layer.rotate,opacity:layer.opacity??1},layer.keyframes,local);
  const asset = episode.assets.find(a => a.id === layer.assetId);
  const align=layer.align??'center';
  const fontSize=layer.fontSize??(layer.textRole?profile.typography.sizesAt1080[layer.textRole]*episode.height/1080:Math.min(48,layer.height*0.5));
  return <div style={{position:'absolute',left:state.x,top:state.y,width:layer.width,height:layer.height,zIndex:layer.z,transform:`translate(-50%, -50%) rotate(${state.rotate}deg) scale(${state.scale})`,transformOrigin:`${(layer.pivotX??0.5)*100}% ${(layer.pivotY??0.5)*100}%`,opacity:state.opacity*(layer.enter === 'fade' ? Math.min(1,local/layer.enterFrames) : 1)}}>
    {layer.kind === 'image' ? <Img src={staticFile(asset!.file)} style={{width:'100%',height:'100%',objectFit:'contain'}} /> : null}
    {layer.kind === 'rect' ? <div style={{width:'100%',height:'100%',background:layer.color}} /> : null}
    {layer.kind === 'text' ? <div style={{width:'100%',height:'100%',boxSizing:'border-box',padding:layer.padding??0,display:'flex',alignItems:'center',justifyContent:align==='left'?'flex-start':align==='right'?'flex-end':'center',fontFamily:handwriting,fontWeight:400,fontSynthesis:'none',fontSize,lineHeight:layer.lineHeight??1.2,color:layer.color,WebkitTextStroke:'3px #FFF9E8',paintOrder:'stroke fill',textAlign:align,whiteSpace:'pre-wrap'}}>{layer.text}</div> : null}
    {layer.kind === 'native' ? <NativeAsset id={layer.nativeId as NativeAssetId} text={layer.text} frame={local} handwritten/> : null}
    {layer.kind==='group'?layers.filter(l=>l.parentId===layer.id).map(child=><LayerView key={child.id} layer={child} episode={episode} layers={layers}/>):null}
  </div>;
};

const AudioView: React.FC<{clip: AudioClip}> = ({clip}) => {
  const frame = useCurrentFrame();
  const fade = clip.fadeFrames ? Math.min(1,frame/clip.fadeFrames,(clip.durationFrames-1-frame)/clip.fadeFrames) : 1;
  return <Audio src={staticFile(clip.file)} trimBefore={clip.trimBeforeFrames} volume={() => clip.volume*Math.max(0,fade)*sampleGain(clip.gainEnvelope,frame)} loop={clip.loop} />;
};

const ShotView:React.FC<{shot:ResolvedShot;episode:ResolvedEpisode}>=({shot,episode})=>{
  const frame=useCurrentFrame();
  const camera=sampleTransform({x:0,y:0,scale:1,rotate:0,opacity:1},shot.camera?.keyframes,frame);
  return <AbsoluteFill style={{background:shot.background,overflow:'hidden'}}>
    <AbsoluteFill style={{transform:`translate(${camera.x}px, ${camera.y}px) rotate(${camera.rotate}deg) scale(${camera.scale})`,transformOrigin:`${(shot.camera?.pivotX??0.5)*100}% ${(shot.camera?.pivotY??0.5)*100}%`,opacity:camera.opacity}}>
      {shot.layers.filter(l=>!l.parentId&&l.space!=='screen').map(layer=><LayerView key={layer.id} layer={layer} episode={episode} layers={shot.layers}/>)}
    </AbsoluteFill>
    <AbsoluteFill style={{zIndex:1,pointerEvents:'none'}}>
      {shot.layers.filter(l=>!l.parentId&&l.space==='screen').map(layer=><LayerView key={layer.id} layer={layer} episode={episode} layers={shot.layers}/>)}
    </AbsoluteFill>
  </AbsoluteFill>;
};

export const MedievalEpisode: React.FC<{episode: unknown}> = ({episode: input}) => {
  const episode = useMemo(() => resolveEpisode(input), [input]);
  return <AbsoluteFill>
    {episode.shots.map(shot => <Sequence key={shot.id} from={shot.startFrame} durationInFrames={shot.durationInFrames} name={shot.id}>
      <ShotView shot={shot} episode={episode}/>
    </Sequence>)}
    {episode.audio.map(clip => <Sequence key={clip.id} from={clip.fromFrame} durationInFrames={clip.durationFrames} name={clip.id}>
      <AudioView clip={clip}/>
    </Sequence>)}
  </AbsoluteFill>;
};
