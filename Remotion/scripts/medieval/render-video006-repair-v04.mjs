import {bundle} from '@remotion/bundler';
import {renderStill,openBrowser} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
const out='C:/Users/huutr/Documents/ChatGPT/Medieval 2/video006_asset_repair_v04/native';
const url=await bundle({entryPoint:path.join(process.cwd(),'src/medieval/video006/asset-review.tsx'),publicDir:path.join(process.cwd(),'public')});
const browser=await openBrowser('chrome',{browserExecutable:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{for(const id of ['N_TEACHING_QUESTIONS','N_WEY_ROUTE_LIST']){const svg=await fs.readFile(path.join(out,id+'_v04.svg'),'utf8');const props={svg};await renderStill({serveUrl:url,composition:{id:'ASSET-REVIEW',width:1920,height:1080,fps:30,durationInFrames:1,defaultProps:props,props},inputProps:props,output:path.join(out,id+'_v04.png'),frame:0,imageFormat:'png',puppeteerInstance:browser});console.log(id);}}finally{await browser.close({silent:true});}
