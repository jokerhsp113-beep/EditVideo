import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {preflight} from './preflight.mjs';
import {projectRoot} from './load-contracts.mjs';
const mode=process.argv[2]??'stills';
if(!['stills','full'].includes(mode))throw Error('Use stills/full');
const {props}=await preflight(path.join(projectRoot,'examples/medieval/video004-v05.props.json'));
const out=path.join(projectRoot,'out/medieval/video004-variety-v05');fs.mkdirSync(out,{recursive:true});
const browserExecutable='C:/Program Files/Google/Chrome/Application/chrome.exe';
const serveUrl=await bundle({entryPoint:path.join(projectRoot,'src/medieval/index.ts'),rootDir:projectRoot,publicDir:path.join(projectRoot,'public'),outDir:path.join(out,'bundle'),rspack:false});
const composition=await selectComposition({serveUrl,id:'MEDIEVAL-EPISODE',inputProps:props,browserExecutable});
if(mode==='stills'){
 const inventory=JSON.parse(fs.readFileSync(path.join(out,'ASSET_INVENTORY_V05.json'),'utf8'));
 const qa=[];
 for(const asset of inventory){
  const shots=props.episode.shots;
  const i=shots.findIndex(s=>s.layers.some(l=>l.assetId===asset.id));
  const shot=shots[i];const end=shots[i+1]?.fromFrame??props.episode.durationInFrames;
  const frame=Math.floor((shot.fromFrame+end)/2);
  const output=path.join(out,`qa-${asset.id}.png`);
  await renderStill({serveUrl,composition,inputProps:props,browserExecutable,frame,imageFormat:'png',output,overwrite:true,scale:.5});
  qa.push({asset:asset.id,shot:shot.id,frame,second:frame/30,output});console.log('still',asset.id);
 }
 fs.writeFileSync(path.join(out,'QA_FRAMES_V05.json'),JSON.stringify(qa,null,2));
}else{
 const output=path.join(out,'VIDEO004_V05_VARIETY_1080p30.mp4');
 if(fs.existsSync(output))throw Error('Output exists: '+output);
 let previous=-1;const began=Date.now();
 await renderMedia({serveUrl,composition,inputProps:props,browserExecutable,codec:'h264',pixelFormat:'yuv420p',crf:18,x264Preset:'fast',concurrency:6,scale:1,outputLocation:output,overwrite:false,
  onProgress:({progress,renderedFrames})=>{const pct=Math.floor(progress*20)*5;if(pct>previous){previous=pct;console.log(pct+'%',renderedFrames,'frames',Math.round((Date.now()-began)/1000)+'s');}}});
 console.log(output);
}
