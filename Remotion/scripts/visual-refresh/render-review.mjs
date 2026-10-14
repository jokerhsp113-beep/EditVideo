import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const root=path.resolve(import.meta.dirname,'../..');
const output=path.join(root,'professional-editor-upgrade/professional-editor/output/visual-refresh');
fs.mkdirSync(output,{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),rootDir:root,publicDir:path.join(root,'public'),outDir:path.join(output,'bundle')});
const checks=[['BIY-VisualStyle-Review',[0,12,30,89]],['BIY2-S00',[90,300]],['BIY2-S04',[120,450]],['BIY-S01',[180]],['InsideTheBody-Video004',[240]]];
for(const [id,frames] of checks){
  const composition=await selectComposition({serveUrl,id});
  for(const frame of frames) await renderStill({serveUrl,composition,frame,imageFormat:'png',output:path.join(output,`${id}-${frame}.png`),overwrite:true});
  if(id==='BIY-VisualStyle-Review') await renderMedia({serveUrl,composition,codec:'h264',outputLocation:path.join(output,'BIY-VisualStyle-Review.mp4'),concurrency:2,overwrite:true});
}
fs.writeFileSync(path.join(output,'render-results.json'),JSON.stringify({checks,fontSource:'local TTF; rendering waits for both fonts',dimensions:'1920x1080',limits:'Sampled legacy scenes; not a review of every old asset or entire video.'},null,2));
console.log(output);
