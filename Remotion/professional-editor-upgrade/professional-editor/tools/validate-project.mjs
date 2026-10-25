import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {compilePlan, validatePlan, validateAssets, worldPoint} from '../engine/core.mjs';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export function inspectPlan(raw, catalog, publicDir) {
  const issues=validatePlan(raw);
  if(issues.some(i=>i.severity==='error')) return {issues};
  const plan=compilePlan(raw);
  issues.push(...validateAssets(plan,catalog.assets));
  const used=new Set([...plan.scenes.flatMap(s=>s.layers.map(l=>l.assetId).filter(Boolean)),...plan.audio.map(t=>t.assetId)]);
  for(const asset of catalog.assets.filter(a=>used.has(a.id))) {
    const full=path.resolve(publicDir,asset.path);
    if(!full.startsWith(path.resolve(publicDir)+path.sep)) {issues.push({severity:'error',code:'ASSET_PATH',location:asset.id,message:'Asset path escapes public directory'});continue;}
    if(!fs.existsSync(full)) {issues.push({severity:'error',code:'ASSET_FILE',location:asset.id,message:'Asset file missing'});continue;}
    const sha=crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    if(sha!==asset.sha256) issues.push({severity:'error',code:'CATALOG_STALE',location:asset.id,message:'Content changed; rebuild catalog and review asset'});
  }
  const sx=96*plan.width/1920,sy=72*plan.height/1080;
  for(const scene of plan.scenes) {
    const frames=new Set([0,scene.durationFrames-1,...scene.actions.flatMap(a=>[a.startFrame,Math.min(scene.durationFrames-1,a.startFrame+a.durationFrames),a.startFrame+Math.floor(a.durationFrames/2)])]);
    for(const layer of scene.layers) {
      if(layer.kind==='connection') continue;
      let outside=false;
      for(const frame of frames) {
        const points=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}].map(p=>worldPoint(scene,layer.id,p,frame));
        if(scene.camera) {
          const t=frame/Math.max(1,scene.durationFrames-1),a=scene.camera.from,b=scene.camera.to;
          const camera={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,scale:a.scale+(b.scale-a.scale)*t};
          points.forEach(p=>{p.x=(p.x-camera.x)*camera.scale+plan.width/2;p.y=(p.y-camera.y)*camera.scale+plan.height/2;});
        }
        if(points.some(p=>p.x<sx||p.x>plan.width-sx||p.y<sy||p.y>plan.height-sy)) outside=true;
      }
      if(outside) issues.push({severity:'warning',code:'SAFE_AREA',location:`${scene.id}/${layer.id}`,message:'Sampled bounds cross safe area; review actual render, including intermediate frames'});
      if(layer.kind==='text') {
        const lines=layer.text.split('\n');
        if(lines.length*layer.fontSize*1.18>layer.height || lines.some(l=>l.length*layer.fontSize*0.56>layer.width)) issues.push({severity:'warning',code:'TEXT_FIT_ESTIMATE',location:`${scene.id}/${layer.id}`,message:'Estimated text overflow; actual browser font metrics must be inspected'});
      }
    }
    if(!scene.actions.length && scene.durationFrames/plan.fps>2.5) issues.push({severity:'warning',code:'STATIC_HOLD_REVIEW',location:scene.id,message:`Static hold is permitted. Review reason: ${scene.holdReason}`});
  }
  return {plan,issues};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);
  const root=args.includes('--project')?path.resolve(args[args.indexOf('--project')+1]):projectRoot;
  const target=args.find(a=>!a.startsWith('--')&&a!==args[args.indexOf('--project')+1]) ?? path.join(root,'professional-editor/examples');
  const files=fs.statSync(target).isDirectory()?fs.readdirSync(target).filter(f=>f.endsWith('.json')).map(f=>path.join(target,f)):[target];
  const catalog=readJson(path.join(root,'professional-editor/library/asset-catalog.json'));
  const publicDir=path.resolve(root,'../public');
  const reports=files.map(file=>({file,...inspectPlan(readJson(file),catalog,publicDir)}));
  const errors=reports.flatMap(r=>r.issues.filter(i=>i.severity==='error'));
  for(const report of reports) console.log(`${path.basename(report.file)}: ${report.issues.filter(i=>i.severity==='error').length} errors, ${report.issues.filter(i=>i.severity==='warning').length} warnings`);
  const reportFile=path.join(root,'professional-editor/reports/validation.json');
  fs.mkdirSync(path.dirname(reportFile),{recursive:true});
  fs.writeFileSync(reportFile,JSON.stringify({generatedAt:new Date().toISOString(),reports:reports.map(({file,issues})=>({file:path.relative(root,file).replaceAll('\\','/'),issues})),limits:['Sampled bounds and estimated text fit are not full visual QA.','No automatic scientific or editorial approval.']},null,2)+'\n');
  for(const e of errors) console.error(`${e.code} ${e.location}: ${e.message}`);
  process.exitCode=errors.length?1:0;
}
