import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {preflight} from './preflight.mjs';
import {projectRoot} from './load-contracts.mjs';
const mode=process.argv[2]??'stills';
const {props}=await preflight(path.join(projectRoot,'examples/medieval/video005-draft-v01.props.json'));
const out=path.join(projectRoot,'out/medieval/video005-draft-v01');
const browserExecutable='C:/Program Files/Google/Chrome/Application/chrome.exe';
const serveUrl=await bundle({entryPoint:path.join(projectRoot,'src/medieval/index.ts'),rootDir:projectRoot,publicDir:path.join(out,'public'),outDir:path.join(out,'bundle'),rspack:false});
const composition=await selectComposition({serveUrl,id:'MEDIEVAL-EPISODE',inputProps:props,browserExecutable});
if(mode==='states'){
 const dir=path.join(out,'state-frames');fs.mkdirSync(dir,{recursive:true});
 for(const [i,s] of props.episode.shots.entries()){
  const output=path.join(dir,s.id+'.png');
  if(!fs.existsSync(output))await renderStill({serveUrl,composition,inputProps:props,browserExecutable,frame:s.fromFrame,imageFormat:'png',output,overwrite:false,scale:1});
  console.log('state',i+1,props.episode.shots.length,s.id);
 }
}else if(mode==='stills'){
 const selected=['S001-T01','S003-T02','S004-T02','S014-T02','S027-T01','S034-T01','S047-T02','S061-T01','S073-T02','S082-T01','S085-T01'];
 for(const id of selected){
  const s=props.episode.shots.find(s=>s.id.endsWith(id));if(!s)continue;
  await renderStill({serveUrl,composition,inputProps:props,browserExecutable,frame:s.fromFrame+2,imageFormat:'png',output:path.join(out,`qa-${id}.png`),overwrite:true,scale:.5});console.log('still',id);
 }
}else if(mode==='full'){
 const outputLocation=path.join(out,'VIDEO005_DRAFT_V01_RENDER_1080p30.mp4');
 if(fs.existsSync(outputLocation))throw Error('Output already exists');
 let previous=-1;const start=Date.now();
 await renderMedia({serveUrl,composition,inputProps:props,browserExecutable,codec:'h264',pixelFormat:'yuv420p',crf:18,x264Preset:'fast',concurrency:6,outputLocation,overwrite:false,onProgress:({progress,renderedFrames})=>{const pct=Math.floor(progress*100);if(pct>=previous+2){previous=pct;console.log(`${pct}% ${renderedFrames} frames ${Math.round((Date.now()-start)/1000)}s`);}}});
 console.log(outputLocation);
}else throw Error('Use stills/full');
