import {bundle} from '@remotion/bundler';
import {renderStill,openBrowser} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const out=path.join(root,'out/medieval/video006-assets-v01');
const composite=process.argv.includes('--composites');
const rows=JSON.parse(await fs.readFile(path.join(out,composite?'COMPOSITE_MANIFEST.json':'NATIVE_MANIFEST.json'),'utf8'));
const url=await bundle({entryPoint:path.join(root,'src/medieval/video006/asset-review.tsx'),publicDir:path.join(root,'public')});
const browserExecutable='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await openBrowser('chrome',{browserExecutable});
const composition={id:'ASSET-REVIEW',width:1920,height:1080,fps:30,durationInFrames:1,defaultProps:{},props:{}};
const previewDir=composite?'composite-preview':'native-preview';
await fs.mkdir(path.join(out,previewDir),{recursive:true});
try{for(const row of rows){const svg=await fs.readFile(row.file,'utf8');await renderStill({serveUrl:url,composition:{...composition,props:{svg},defaultProps:{svg}},inputProps:{svg},output:path.join(out,previewDir,path.basename(row.file,'.svg')+'.png'),frame:0,imageFormat:'png',puppeteerInstance:browser});}console.log('Rendered '+rows.length+' '+previewDir+' images.');}finally{await browser.close({silent:true});}
