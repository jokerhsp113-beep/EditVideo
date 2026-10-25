import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia, renderStill} from '@remotion/renderer';
import {projectRoot,readJson,inspectPlan} from './validate-project.mjs';
const args=process.argv.slice(2);
const video=args.includes('--video');
const id=args.find(a=>!a.startsWith('--'))??'ProEditor-Reel';
const output=path.join(projectRoot,'professional-editor/output');
const publicDir=path.resolve(projectRoot,'../public');
const browserCandidates=[
  process.env.PRO_EDITOR_BROWSER_EXECUTABLE,
  process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES,'Google/Chrome/Application/chrome.exe'),
  process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'],'Microsoft/Edge/Application/msedge.exe'),
].filter(Boolean);
const browserExecutable=browserCandidates.find(candidate=>fs.existsSync(candidate));
const catalog=readJson(path.join(projectRoot,'professional-editor/library/asset-catalog.json'));
for(const file of fs.readdirSync(path.join(projectRoot,'professional-editor/examples')).filter(f=>f.endsWith('.json'))) {
  const result=inspectPlan(readJson(path.join(projectRoot,'professional-editor/examples',file)),catalog,publicDir);
  if(result.issues.some(i=>i.severity==='error')) throw new Error(`Fix validation before render: ${file}`);
}
fs.mkdirSync(output,{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(projectRoot,'professional-editor/entry.ts'),publicDir,outDir:path.join(output,'bundle'),rootDir:projectRoot,enableCaching:true});
const composition=await selectComposition({serveUrl,id,browserExecutable});
if(video) {
  const outputLocation=path.join(output,`${id}.mp4`);
  await renderMedia({serveUrl,composition,codec:'h264',crf:18,concurrency:2,outputLocation,overwrite:true,browserExecutable});
  console.log(`Video: ${outputLocation}`);
} else {
  const frames=id==='ProEditor-Reel'?[0,90,180,300,359,360,420,510,630,659,660,750,870,959]:[0,Math.round(composition.durationInFrames/3),Math.round(composition.durationInFrames*2/3),composition.durationInFrames-1];
  const stillDir=path.join(output,'stills');fs.mkdirSync(stillDir,{recursive:true});
  for(const frame of frames) {
    await renderStill({serveUrl,composition,frame,imageFormat:'png',output:path.join(stillDir,`${id}-${String(frame).padStart(4,'0')}.png`),overwrite:true,browserExecutable});
  }
  console.log(`Stills: ${stillDir}`);
}
