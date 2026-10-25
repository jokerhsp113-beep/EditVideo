import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import {projectRoot} from './load-contracts.mjs';
import {preflight} from './preflight.mjs';

// Small technical fixture only. Keep the full project's large public directory out of this bundle.
try{
  const revision=process.argv[2]??'v02';
  if(revision!=='v02') throw new Error('Usage: node scripts/medieval/verify-style-render.mjs [v02]; only the current fixture is retained');
  const output=path.join(projectRoot,`out/medieval/style-upgrade-qa-${revision}`);
  const publicDir=path.join(output,'public');
  fs.mkdirSync(path.join(publicDir,'fonts'),{recursive:true});
  for(const font of ['PatrickHand-Regular.ttf','NotoSans-Regular.ttf','NotoSansSymbols2-Regular.ttf','NotoSansMath-Regular.ttf']){
    fs.copyFileSync(path.join(projectRoot,'public/fonts',font),path.join(publicDir,'fonts',font));
  }
  const {props}=await preflight(path.join(projectRoot,'examples/medieval/style-upgrade-v02.props.json'));
  const browserExecutable=process.env.MEDIEVAL_BROWSER_EXECUTABLE??'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const serveUrl=await bundle({entryPoint:path.join(projectRoot,'src/medieval/index.ts'),rootDir:projectRoot,publicDir,outDir:path.join(output,'bundle'),rspack:false});
  const composition=await selectComposition({serveUrl,id:'MEDIEVAL-EPISODE',inputProps:props,browserExecutable});
  for(const frame of [0,24,42,60,90,135,179]){
    await renderStill({serveUrl,composition,inputProps:props,browserExecutable,frame,imageFormat:'png',output:path.join(output,`frame-${frame}.png`),overwrite:false});
  }
  await renderMedia({serveUrl,composition,inputProps:props,browserExecutable,codec:'h264',concurrency:2,outputLocation:path.join(output,`style-upgrade-${revision}.mp4`),overwrite:false});
  const legacy=JSON.parse(fs.readFileSync(path.join(projectRoot,'examples/medieval/smoke-props.json'),'utf8'));
  const oldComposition=await selectComposition({serveUrl,id:'MEDIEVAL-EPISODE',inputProps:legacy,browserExecutable});
  await renderStill({serveUrl,composition:oldComposition,inputProps:legacy,browserExecutable,frame:90,imageFormat:'png',output:path.join(output,'legacy-frame-90.png'),overwrite:false});
  fs.writeFileSync(path.join(output,'RENDER_CHECK.json'),JSON.stringify({newFrames:[0,24,42,60,90,135,179],legacyFrame:90,durationInFrames:composition.durationInFrames,fps:composition.fps,audio:'none; no listening claim',artisticPilot:false,renderPath:'API webpack; CLI not tested by this script'},null,2),{flag:'wx'});
  console.log(`PASS technical render: ${output}`);
}catch(error){console.error(error);process.exitCode=1;}
