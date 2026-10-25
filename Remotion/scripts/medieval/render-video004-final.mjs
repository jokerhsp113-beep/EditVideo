import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {preflight} from './preflight.mjs';
import {projectRoot} from './load-contracts.mjs';
const mode=process.argv[2]??'stills';
if(!['stills','full'].includes(mode))throw Error('Use stills/full');
const {props}=await preflight(path.join(projectRoot,'examples/medieval/video004-final.props.json'));
const out=path.join(projectRoot,'out/medieval/video004-final');fs.mkdirSync(out,{recursive:true});
const browserExecutable='C:/Program Files/Google/Chrome/Application/chrome.exe';
const serveUrl=await bundle({entryPoint:path.join(projectRoot,'src/medieval/index.ts'),rootDir:projectRoot,publicDir:path.join(projectRoot,'public'),outDir:path.join(out,'bundle'),rspack:false});
const composition=await selectComposition({serveUrl,id:'MEDIEVAL-EPISODE',inputProps:props,browserExecutable});
if(mode==='stills'){
 for(const second of [2.7,24,63.8,81,201,320,365,437]){
  await renderStill({serveUrl,composition,inputProps:props,browserExecutable,frame:Math.round(second*30),imageFormat:'png',output:path.join(out,`text-check-${second}.png`),overwrite:true,scale:1});
  console.log('still',second);
 }
}else{
 const output=path.join(out,'VIDEO004_FINAL_1080p30.mp4');
 if(fs.existsSync(output))throw Error('Output exists: '+output);
 let previous=-1;const began=Date.now();
 await renderMedia({serveUrl,composition,inputProps:props,browserExecutable,codec:'h264',pixelFormat:'yuv420p',crf:18,x264Preset:'fast',concurrency:6,scale:1,outputLocation:output,overwrite:false,
  onProgress:({progress,renderedFrames})=>{const pct=Math.floor(progress*20)*5;if(pct>previous){previous=pct;console.log(pct+'%',renderedFrames,'frames',Math.round((Date.now()-began)/1000)+'s');}}});
 console.log(output);
}
