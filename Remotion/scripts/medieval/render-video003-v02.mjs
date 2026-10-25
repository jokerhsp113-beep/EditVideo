import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, renderMedia, selectComposition} from '@remotion/renderer';

const root=path.resolve(import.meta.dirname,'../..');
const {plan}=JSON.parse(fs.readFileSync(path.join(root,'examples/medieval/video003-v02.json'),'utf8'));
const output=path.join(root,'out/medieval/revision-v02');
const publicDir=path.join(output,'public');
const files=new Set([plan.voice,...plan.sfx.map(s=>s.file),...plan.shots.flatMap(s=>s.cuts.map(c=>c.file)),
  'fonts/PatrickHand-Regular.ttf','fonts/NotoSans-Regular.ttf','fonts/NotoSansSymbols2-Regular.ttf','fonts/NotoSansMath-Regular.ttf']);
for(const file of files) {
  const source=path.join(root,'public',file);
  if(!fs.existsSync(source)) throw new Error('Missing file: '+file);
  const target=path.join(publicDir,file);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  if(!fs.existsSync(target)||fs.statSync(source).mtimeMs>fs.statSync(target).mtimeMs||fs.statSync(source).size!==fs.statSync(target).size) fs.copyFileSync(source,target);
}
if(plan.shots[0].start!==0||plan.shots.at(-1).end!==plan.duration) throw new Error('Timeline endpoints invalid');
for(let i=1;i<plan.shots.length;i++) if(plan.shots[i].start!==plan.shots[i-1].end) throw new Error('Shot gap');
for(let i=1;i<plan.overlays.length;i++) if(plan.overlays[i].start<plan.overlays[i-1].end) throw new Error('Competing overlays: '+plan.overlays[i].id);
const browserExecutable=process.env.MEDIEVAL_BROWSER_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const serveUrl=await bundle({entryPoint:path.join(root,'src/medieval/video003-index.ts'),rootDir:root,publicDir,outDir:path.join(output,'bundle'),enableCaching:true});
const composition=await selectComposition({serveUrl,id:'VIDEO003-REVISION',browserExecutable});
if(process.argv.includes('--patch-grain')||process.argv.includes('--patch-overlays')) {
  const variants=process.argv.includes('--patch-grain')?['E09_transfer']:process.argv[process.argv.indexOf('--patch-overlays')+1].split(',');
  for(const variant of variants){
    const overlay=plan.overlays.find(o=>o.variant===variant);
    if(!overlay) throw new Error('Unknown patch overlay '+variant);
    const basename=variant==='E09_transfer'?'grain-state-patch':variant+'-patch';
    await renderMedia({serveUrl,composition,codec:'h264',crf:18,concurrency:4,
      frameRange:[overlay.start,overlay.end-1],
      outputLocation:path.join(output,basename+'.mp4'),overwrite:false,browserExecutable});
    fs.writeFileSync(path.join(output,basename+'.json'),JSON.stringify({start:overlay.start,end:overlay.end,fps:plan.fps,reason:variant+' reviewed geometry/placement'},null,2));
    console.log('PATCH '+variant+' '+overlay.start+'..'+overlay.end);
  }
} else if(process.argv.includes('--video')) {
  const outputLocation=path.join(output,'Video003-revision-v02-720p24.mp4');
  if(fs.existsSync(outputLocation)) throw new Error('Video already exists; choose a new version');
  let last=-1;
  await renderMedia({serveUrl,composition,codec:'h264',crf:18,concurrency:6,outputLocation,
    overwrite:false,browserExecutable,onProgress:p=>{
      const percent=Math.floor(p.progress*100);
      if(percent>=last+5){last=percent;console.log(JSON.stringify({percent,rendered:p.renderedFrames,encoded:p.encodedFrames}));}
    }});
  console.log('VIDEO '+outputLocation);
} else {
  const shift=32.94-32.94/1.07;
  const originalTimes=[.6,3.2,8.5,10.6,14.3,23.5,36.5,80.5,132.2,188,230,254,277.8,281.6,318.5,367.5,380,390,430,455,474,505,516,570];
  const stillDir=path.join(output,'stills');fs.mkdirSync(stillDir,{recursive:true});
  for(const original of originalTimes){
    const seconds=original<=32.94?original/1.07:original-shift;
    await renderStill({serveUrl,composition,frame:Math.round(seconds*plan.fps),imageFormat:'png',
      output:path.join(stillDir,'source-'+String(Math.round(original*10)).padStart(5,'0')+'.png'),
      overwrite:true,browserExecutable});
  }
  console.log('STILLS '+stillDir);
}
