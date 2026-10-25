import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import {preflight} from './preflight.mjs';
import {projectRoot} from './load-contracts.mjs';
const mode=process.argv[2]??'stills';
const {props}=await preflight(path.join(projectRoot,'examples/medieval/video005-draft-v02.props.json'));
const old=JSON.parse(fs.readFileSync(path.join(projectRoot,'examples/medieval/video005-draft-v01.props.json'),'utf8'));
const out=path.join(projectRoot,'out/medieval/video005-draft-v02');
const browserExecutable='C:/Program Files/Google/Chrome/Application/chrome.exe';
const serveUrl=await bundle({entryPoint:path.join(projectRoot,'src/medieval/video005/index-v02.tsx'),rootDir:projectRoot,publicDir:path.join(out,'public'),outDir:path.join(out,'bundle'),rspack:false});
const composition=await selectComposition({serveUrl,id:'VIDEO005-DRAFT-V02',inputProps:props,browserExecutable});
const changed=props.episode.shots.filter((s,i)=>JSON.stringify(s)!==JSON.stringify(old.episode.shots[i]));
const dir=path.join(out,'state-frames');fs.mkdirSync(dir,{recursive:true});
const selected=mode==='states'?props.episode.shots:props.episode.shots.filter(s=>(mode==='layout-final'?['S021-T01','S022-T01','S022-T02','S023-T01']:mode==='diagram-final'?['S022-T02','S023-T01']:['S006-T01','S008-T01','S021-T01','S022-T02','S023-T01','S034-T01','S061-T01','S073-T02','S076-T01','S083-T01']).some(id=>s.id.endsWith(id)));
let rendered=0,reused=0;
for(const s of selected){
 const output=path.join(dir,s.id+'.png');
 if(mode==='states'&&!changed.some(x=>x.id===s.id)){
  if(s.layers.some(l=>l.kind==='text'))throw Error('Cannot reuse old outlined text frame');
  fs.copyFileSync(path.join(projectRoot,'out/medieval/video005-draft-v01/state-frames',s.id+'.png'),output);reused++;
 }else {
  await renderStill({serveUrl,composition,inputProps:props,browserExecutable,frame:s.fromFrame,imageFormat:'png',output,overwrite:true,scale:1});rendered++;
 }
 console.log('state',s.id,'rendered',rendered,'unchanged reuse',reused);
}
fs.writeFileSync(path.join(out,mode==='states'?'STATE_RENDER_PROVENANCE_V02.json':'STILL_RENDER_V02.json'),JSON.stringify({mode,rendered,unchanged_frame_reuse:reused,reason:'Unchanged shot objects without runtime text are pixel-identical; V02 scoped CSS only removes text stroke.'},null,2));
