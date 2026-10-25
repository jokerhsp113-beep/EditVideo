import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compilePlan,resolveCue,validatePlan,layerState,worldPoint,audioGain,validateAssets} from '../engine/core.mjs';
const load=name=>JSON.parse(fs.readFileSync(new URL(`../examples/${name}.json`,import.meta.url),'utf8'));
const captions=[{text:'A door',startMs:0,endMs:500},{text:'A door',startMs:1000,endMs:1500}];

test('all actual examples compile with exact composition duration',()=>{
  for(const name of ['mechanism','comparison','evidence']) {
    const p=compilePlan(load(name));assert.equal(p.scenes.at(-1).from+p.scenes.at(-1).durationFrames,p.durationFrames);
  }
});
test('repeated anchors require occurrence; missing anchors fail',()=>{
  assert.throws(()=>resolveCue({anchor:'a door'},captions,30),/Ambiguous/);
  assert.equal(resolveCue({anchor:'a door',occurrence:2,offsetFrames:3},captions,30),33);
  assert.throws(()=>resolveCue({anchor:'missing'},captions,30),/not found/);
  assert.throws(()=>resolveCue({anchor:'a door',occurrence:3},captions,30),/out of range/);
});
test('unicode words and punctuation resolve without stripping Vietnamese',()=>{
  assert.equal(resolveCue({anchor:'tế bào'},[{text:'Tế-bào.',startMs:100,endMs:300}],30),3);
});
test('gaps and overlaps block compilation instead of fallback timings',()=>{
  for(const offset of [-1,1]) {const p=load('mechanism');p.scenes[1].start.frame+=offset;assert.throws(()=>compilePlan(p),/TIMELINE_GAP/);}
});
test('unknown layer kind and unused unknown fields fail',()=>{
  const p=load('mechanism');p.scenes[0].layers[0].kind='magic-sticker';assert.throws(()=>compilePlan(p),/LAYER_KIND/);
  const q=load('mechanism');q.scenes[0].actions[0].speed=5;assert.throws(()=>compilePlan(q),/UNKNOWN_FIELD/);
});
test('parent cycles and nonexistent connection targets fail',()=>{
  const p=load('mechanism');p.scenes[0].layers.find(l=>l.id==='cell').parentId='receptor';assert.throws(()=>compilePlan(p),/PARENT_CYCLE/);
  const q=load('mechanism');q.scenes[0].layers.find(l=>l.id==='callout').toId='missing';assert.throws(()=>compilePlan(q),/CONNECTION/);
});
test('continuity inherits the last rendered state without resetting movement',()=>{
  const p=compilePlan(load('mechanism'));const a=p.scenes[0],b=p.scenes[1];
  const old=a.layers.find(l=>l.id==='virus'),next=b.layers.find(l=>l.id==='virus');
  assert.deepEqual(layerState(a,old,a.durationFrames-1),layerState(b,next,0));
  assert.equal(next.x,1070);assert.equal(b.layers.filter(l=>l.id==='body').length,1);
});
test('motion respects start, destination and parent relationships',()=>{
  const p=compilePlan(load('mechanism')),s=p.scenes[0],virus=s.layers.find(l=>l.id==='virus');
  assert.equal(layerState(s,virus,0).x,905);assert.equal(layerState(s,virus,122).x,1070);
  const point=worldPoint(s,'receptor',{x:0.5,y:0.5},0);assert.equal(point.x,1178);assert.equal(point.y,555);
});
test('attachments follow rotation around normalized pivots',()=>{
  const p=load('evidence');p.scenes[0].layers=[{id:'parent',kind:'rect',x:500,y:500,width:200,height:200,rotate:90},{id:'child',kind:'ellipse',parentId:'parent',x:150,y:100,width:20,height:20}];
  const s=compilePlan(p).scenes[0],pt=worldPoint(s,'child',{x:0.5,y:0.5},0);
  assert.ok(Math.abs(pt.x-500)<1e-8);assert.ok(Math.abs(pt.y-550)<1e-8);
});
test('overlapping position actions fail, distinct opacity action is allowed',()=>{
  const p=load('mechanism');p.scenes[0].actions.push({...p.scenes[0].actions[0],id:'overlap'});assert.throws(()=>compilePlan(p),/ACTION_OVERLAP/);
  const q=load('mechanism');q.scenes[0].actions.push({id:'visible',subject:'virus',type:'reveal',start:{frame:38},durationFrames:20,reason:'Make the subject visible.'});assert.doesNotThrow(()=>compilePlan(q));
});
test('action frames cannot extend outside the scene',()=>{
  const p=load('mechanism');p.scenes[0].actions[0].start.frame=179;assert.throws(()=>compilePlan(p),/ACTION_RANGE/);
});
test('a deliberate static reading scene stays static',()=>{
  const p=compilePlan(load('evidence'));assert.equal(p.scenes[0].actions.length,0);assert.equal(p.scenes[0].camera,undefined);
  const l=p.scenes[0].layers.find(l=>l.id==='headline');assert.deepEqual(layerState(p.scenes[0],l,0),layerState(p.scenes[0],l,299));
});
test('final requires actual reviews and cannot call existing audio inapplicable',()=>{
  const p=load('evidence');p.status='final';assert.throws(()=>compilePlan(p),/FINAL_REVIEW/);
  p.review.visual='passed';p.audio=[{id:'vo',assetId:'vo.wav',role:'voice',startFrame:0,durationFrames:100,gainDb:-3,fadeInFrames:0,fadeOutFrames:0,reason:'Narration'}];
  assert.throws(()=>compilePlan(p),/FINAL_AUDIO/);
});
test('audio ranges and fades are checked; gain fades at actual endpoints',()=>{
  const music={id:'m',assetId:'m.wav',role:'music',startFrame:0,durationFrames:300,gainDb:-12,fadeInFrames:10,fadeOutFrames:10,reason:'Support narration',duckUnderVoice:true};
  assert.equal(audioGain(music,0,[music],30),0);assert.equal(audioGain(music,299,[music],30),0);assert.equal(audioGain(music,-1,[music],30),0);
  const voice={...music,id:'v',role:'voice',startFrame:60,durationFrames:90,duckUnderVoice:false};
  assert.ok(audioGain(music,90,[music,voice],30)<audioGain(music,30,[music,voice],30)*0.3);
  const p=load('evidence');p.audio=[{...music,fadeInFrames:200,fadeOutFrames:200}];assert.throws(()=>compilePlan(p),/AUDIO_RANGE/);
});
test('asset checks reject unknown, wrong type, placeholder final and source overrun',()=>{
  const p=compilePlan(load('evidence'));assert.ok(validateAssets(p,[]).some(i=>i.code==='ASSET_MISSING'));
  const assets=p.scenes.flatMap(s=>s.layers.filter(l=>l.assetId).map(l=>({id:l.assetId,path:l.assetId,sha256:'x',mediaType:'image',status:'draft',flags:[],provenance:{source:null,license:null}})));
  assert.ok(!validateAssets(p,assets).some(i=>i.severity==='error'));
  p.status='final';assert.ok(validateAssets(p,assets).some(i=>i.code==='FINAL_ASSET'));
  p.audio=[{id:'s',assetId:'pop.wav',role:'accent',startFrame:0,durationFrames:30,trimBeforeFrames:30,gainDb:-12,fadeInFrames:0,fadeOutFrames:0,reason:'Accent'}];
  assets.push({id:'pop.wav',path:'pop.wav',mediaType:'audio',status:'draft',flags:['placeholder'],durationSeconds:1,provenance:{source:null,license:null}});
  const issues=validateAssets(p,assets);assert.ok(issues.some(i=>i.code==='PLACEHOLDER'&&i.severity==='error'));assert.ok(issues.some(i=>i.code==='AUDIO_SOURCE_RANGE'));
});
test('malformed input produces issues rather than a broken render',()=>{
  assert.ok(validatePlan(null).length);assert.ok(validatePlan({}).length);
  const p=load('mechanism');p.captions=[{text:'x',startMs:200,endMs:100}];assert.throws(()=>compilePlan(p),/CAPTION_TIMING/);
});
