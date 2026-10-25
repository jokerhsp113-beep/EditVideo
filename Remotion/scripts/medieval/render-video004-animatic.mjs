import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {preflight} from './preflight.mjs';
import {projectRoot} from './load-contracts.mjs';

const mode=process.argv[2]??'stills';
if(!['stills','full','review5'].includes(mode)) throw new Error('Use stills, full, or review5');
const outputVersion=process.argv[3]??'v01';
if(!/^v\d{2}$/.test(outputVersion)) throw new Error('Output version must be vNN');
const propsPath=path.join(projectRoot,mode==='review5'?'examples/medieval/video004-animatic-v01-review5.props.json':'examples/medieval/video004-animatic-v01.props.json');
const {props}=await preflight(propsPath);
const browserExecutable=process.env.MEDIEVAL_BROWSER_EXECUTABLE??'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out=path.join(projectRoot,'out/medieval/video004-animatic-v01');
fs.mkdirSync(out,{recursive:true});
const serveUrl=await bundle({
  entryPoint:path.join(projectRoot,'src/medieval/index.ts'),
  rootDir:projectRoot,
  publicDir:path.join(projectRoot,'public'),
  outDir:path.join(out,'bundle'),
  rspack:false,
});
const composition=await selectComposition({serveUrl,id:'MEDIEVAL-EPISODE',inputProps:props,browserExecutable});
if(mode==='stills'){
  const ids=['S001-B01','S005-B02','S009-B04','S010-B03','S015-B01','S017-B01','S021-B03','S027-B02','S028-B02','S032-B02'];
  for(const id of ids){
    const index=props.episode.shots.findIndex(s=>s.id===id);
    if(index<0) throw new Error('Missing '+id);
    const start=props.episode.shots[index].fromFrame;
    const next=props.episode.shots[index+1]?.fromFrame??composition.durationInFrames;
    const frame=Math.min(next-1,start+Math.floor((next-start)/2));
    const output=path.join(out,id+'.png');
    await renderStill({serveUrl,composition,inputProps:props,browserExecutable,frame,imageFormat:'png',output,overwrite:true,scale:0.5});
    console.log(id,frame,output);
  }
} else {
  const output=path.join(out,mode==='review5'?`video004-animatic-${outputVersion}-review5-540p.mp4`:`video004-animatic-${outputVersion}-540p.mp4`);
  if(fs.existsSync(output)) throw new Error('Output exists; use a new version before rerendering');
  let last=-1;
  await renderMedia({serveUrl,composition,inputProps:props,browserExecutable,codec:'h264',concurrency:2,scale:0.5,outputLocation:output,overwrite:false,onProgress:({progress,renderedFrames})=>{
    const pct=Math.floor(progress*20)*5;
    if(pct>last){console.log('render '+pct+'% frames='+renderedFrames);last=pct;}
  }});
  console.log(output);
}
