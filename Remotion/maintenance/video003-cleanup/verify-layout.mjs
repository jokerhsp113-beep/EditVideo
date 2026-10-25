import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
const root=path.resolve(import.meta.dirname,'../..');
const temp=path.join(import.meta.dirname,'verify-temp');
const props=JSON.parse(fs.readFileSync(path.join(root,'examples/medieval/video003-v02.json'),'utf8'));
const frame=Math.round(21.5*props.plan.fps);
const shot=props.plan.shots.find(s=>frame>=s.start&&frame<s.end);
const cut=shot.cuts.find(c=>frame>=c.start&&frame<c.end);
props.plan.sfx=[];
const files=[cut.file,props.plan.voice,...['PatrickHand-Regular.ttf','NotoSans-Regular.ttf','NotoSansSymbols2-Regular.ttf','NotoSansMath-Regular.ttf'].map(name=>'fonts/'+name)];
for(const file of files){
  const dest=path.join(temp,'public',file);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(path.join(root,'public',file),dest);
}
const browserExecutable='C:/Program Files/Google/Chrome/Application/chrome.exe';
const serveUrl=await bundle({entryPoint:path.join(root,'src/medieval/video003-index.ts'),rootDir:root,publicDir:path.join(temp,'public'),outDir:path.join(temp,'bundle')});
const composition=await selectComposition({serveUrl,id:'VIDEO003-REVISION',inputProps:props,browserExecutable});
await renderStill({serveUrl,composition,frame,inputProps:props,imageFormat:'png',output:path.join(import.meta.dirname,'CURRENT_LAYOUT_CHECK.png'),browserExecutable,overwrite:false});
console.log('PASS: native text and current/ image paths render after cleanup');
