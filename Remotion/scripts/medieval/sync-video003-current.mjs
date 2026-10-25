import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..');
const master=process.env.VIDEO003_ROOT ?? 'D:/Youtube/Medieval Life Explained/videos/Video003';
const props=JSON.parse(fs.readFileSync(path.join(master,'02_PLAN/EDIT_PLAN_APPROVED.json'),'utf8'));
const files=new Set([props.plan.voice,...props.plan.sfx.map(s=>s.file),...props.plan.shots.flatMap(s=>s.cuts.map(c=>c.file))]);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const file of files){
  if(!file.startsWith('medieval/video003/current/')) throw new Error('Unexpected runtime path: '+file);
  const name=path.basename(file);
  const source=file.includes('/scene/')?path.join(master,'03_ASSETS/scene_png',name):
    file.includes('/gag/')?path.join(master,'03_ASSETS/reused_png',name):
    name==='narration-v02.wav'?path.join(master,'Audio',name):path.join(master,'Audio/sfx',name);
  const target=path.join(root,'public',file);
  if(!fs.existsSync(source)) throw new Error('Missing master file '+source);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  if(!fs.existsSync(target)||hash(source)!==hash(target)) fs.copyFileSync(source,target);
  if(hash(source)!==hash(target)) throw new Error('Staging hash mismatch '+file);
}
fs.writeFileSync(path.join(root,'examples/medieval/video003-v02.json'),JSON.stringify(props,null,2)+'\n');
console.log(JSON.stringify({master,stagedMedia:files.size,shots:props.plan.shots.length,overlays:props.plan.overlays.length}));
