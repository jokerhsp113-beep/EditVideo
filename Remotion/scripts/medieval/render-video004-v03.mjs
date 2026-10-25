import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {preflight} from './preflight.mjs';
import {projectRoot} from './load-contracts.mjs';
const mode=process.argv[2]??'stills';
if(!['stills','opening','full'].includes(mode))throw Error('Use stills/opening/full');
const {props}=await preflight(path.join(projectRoot,'examples/medieval/video004-v03.props.json'));
const out=path.join(projectRoot,'out/medieval/video004-v03');fs.mkdirSync(out,{recursive:true});
const browserExecutable='C:/Program Files/Google/Chrome/Application/chrome.exe';
const serveUrl=await bundle({entryPoint:path.join(projectRoot,'src/medieval/index.ts'),rootDir:projectRoot,publicDir:path.join(projectRoot,'public'),outDir:path.join(out,'bundle'),rspack:false});
const composition=await selectComposition({serveUrl,id:'MEDIEVAL-EPISODE',inputProps:props,browserExecutable});
if(mode==='stills'){
 for(const second of (process.argv[3]?process.argv[3].split(',').map(Number):[0,1.6,2.7,4.3,7.8,10,13.8,14.6,24,32,38,49,81,115,201,236,270,320,361,390,437,457])){
  const frame=Math.round(second*30);
  await renderStill({serveUrl,composition,inputProps:props,browserExecutable,frame,imageFormat:'png',output:path.join(out,`qa-${String(Math.round(second*10)).padStart(4,'0')}.png`),overwrite:true,scale:.5});
  console.log('still',second);
 }
}else{
 const output=path.join(out,mode==='opening'?'video004-v03-opening-45s.mp4':'video004-v03-540p-30fps.mp4');
 if(fs.existsSync(output))throw Error('Output exists: '+output);
 let previous=-1;const began=Date.now();
 await renderMedia({serveUrl,composition,inputProps:props,browserExecutable,codec:'h264',concurrency:6,scale:.5,outputLocation:output,overwrite:false,
  ...(mode==='opening'?{frameRange:[0,1349]}:{}),onProgress:({progress,renderedFrames})=>{const pct=Math.floor(progress*20)*5;if(pct>previous){previous=pct;console.log(pct+'%',renderedFrames,'frames',Math.round((Date.now()-began)/1000)+'s');}}});
 console.log(output);
}
