import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {projectRoot,resolveEpisode,phraseFrame} from './load-contracts.mjs';

/** Explicit opt-in: old manifests keep their canvas, palette and layout. */
export function compileProfile(props,profile){
  if(profile.id!=='medieval-life-explained'||!profile.version) throw new Error('Unsupported channel profile');
  const output=structuredClone(props);
  const e=output.episode;
  if(!e || typeof e!=='object') throw new Error('Expected {episode: ...}');
  e.width??=profile.canvas.width;e.height??=profile.canvas.height;e.fps??=profile.canvas.fps;
  const cueLog=[];
  const cue=(object,from,to,name)=>{
    if(typeof object.at!=='string'||!object.at.trim()) throw new Error(`${name}: at must be a phrase`);
    if(object.occurrence!==undefined&&(!Number.isInteger(object.occurrence)||object.occurrence<1)) throw new Error(`${name}: invalid occurrence`);
    if(!Number.isInteger(object.offsetFrames??0)) throw new Error(`${name}: offsetFrames must be integer`);
    const frame=phraseFrame(e.words??[],object.at,e.fps,from,to,object.occurrence)+(object.offsetFrames??0);
    if(frame<from||frame>=to) throw new Error(`${name}: cue offset outside shot`);
    cueLog.push({target:name,phrase:object.at,occurrence:object.occurrence??null,offsetFrames:object.offsetFrames??0,episodeFrame:frame});
    return frame;
  };
  const starts=(e.shots??[]).map(s=>s.fromFrame??phraseFrame(e.words??[],s.anchor,e.fps,0,e.durationInFrames,s.occurrence));
  const resolveFrames=(frames,from,to,origin,name)=>{
    for(const [index,key] of (frames??[]).entries()){
      if(key.at!==undefined){
        if(key.frame!==undefined) throw new Error(`${name}: choose frame or at`);
        key.frame=cue(key,from,to,`${name}/${index}`)-origin;
        delete key.at;delete key.occurrence;delete key.offsetFrames;
      }else if(key.occurrence!==undefined||key.offsetFrames!==undefined) throw new Error(`${name}: occurrence/offset needs at`);
    }
  };
  for(const [shotIndex,shot] of (e.shots??[]).entries()){
    const from=starts[shotIndex],to=starts[shotIndex+1]??e.durationInFrames;
    resolveFrames(shot.camera?.keyframes,from,to,from,`${shot.id}/camera`);
    shot.background??=profile.palette.paper;
    for(const layer of shot.layers??[]){
      const entry=layer.at!==undefined?phraseFrame(e.words??[],layer.at,e.fps,from,to,layer.occurrence)-from:layer.fromFrame??0;
      resolveFrames(layer.keyframes,from,to,from+entry,`${shot.id}/${layer.id}`);
      if(layer.kind==='text'){
        layer.color??=profile.palette.ink;
        if(layer.textRole && layer.fontSize===undefined){
          const size=profile.typography.sizesAt1080[layer.textRole];
          if(!Number.isFinite(size)||size<=0) throw new Error(`Invalid profile text role: ${layer.textRole}`);
          layer.fontSize=size*e.height/1080;
        }
      }
    }
  }
  for(const clip of e.audio??[]){
    if(clip.at!==undefined){
      if(clip.fromFrame!==undefined) throw new Error(`audio ${clip.id}: choose fromFrame or at`);
      const index=e.shots.findIndex(s=>s.id===clip.cueShotId);
      if(index<0) throw new Error(`audio ${clip.id}: cueShotId must name a shot`);
      clip.fromFrame=cue(clip,starts[index],starts[index+1]??e.durationInFrames,`audio/${clip.id}`);
      delete clip.at;delete clip.cueShotId;delete clip.occurrence;delete clip.offsetFrames;
    }else if(['cueShotId','occurrence','offsetFrames'].some(k=>clip[k]!==undefined)) throw new Error(`audio ${clip.id}: cue fields need at`);
  }
  resolveEpisode(e);
  output.build={profileId:profile.id,profileVersion:profile.version,timingBasis:e.timingBasis,
    timingFingerprint:createHash('sha256').update(JSON.stringify({fps:e.fps,words:e.words??[],voice:(e.audio??[]).filter(a=>a.role==='voice')})).digest('hex'),cues:cueLog};
  return output;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const [input,output,...extra]=process.argv.slice(2);
    if(!input||!output||extra.length) throw new Error('Usage: node scripts/medieval/compile-profile.mjs input.json output.json');
    const profile=JSON.parse(fs.readFileSync(path.join(projectRoot,'channel/medieval/production-profile.v1.json'),'utf8'));
    const compiled=compileProfile(JSON.parse(fs.readFileSync(input,'utf8')),profile);
    // Never overwrite a master, source input, or previously compiled version.
    fs.writeFileSync(output,JSON.stringify(compiled,null,2)+'\n',{flag:'wx'});
    console.log(`Compiled profile ${profile.version}: ${output}. Run preflight before rendering.`);
  }catch(error){console.error(error.message);process.exitCode=1;}
}
