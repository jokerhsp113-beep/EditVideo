import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {projectRoot,resolveEpisode} from './load-contracts.mjs';
import {preflight} from './preflight.mjs';
const fixture=()=>JSON.parse(fs.readFileSync(path.join(projectRoot,'src/medieval/smoke.json'),'utf8'));

test('delayed cue stays delayed and static hold has no injected motion',()=>{
  const result=resolveEpisode(fixture());
  assert.equal(result.shots[0].layers.find(l=>l.id==='late').enterFrame,60);
  assert.equal(result.shots[1].layers[0].motion,undefined);
  assert.equal(result.shots[0].durationInFrames,120);
});
test('missing cue fails instead of silently using delay',()=>{
  const f=fixture();f.shots[0].layers[2].at='missing';assert.throws(()=>resolveEpisode(f),/0 hits/);
});
test('repeated cue requires explicit occurrence',()=>{
  const f=fixture();f.words.push({text:'reveal',startMs:3000,endMs:3200});
  assert.throws(()=>resolveEpisode(f),/2 hits/);
  f.shots[0].layers[2].occurrence=2;
  assert.equal(resolveEpisode(f).shots[0].layers[2].enterFrame,90);
});
test('cue cannot resolve in a later shot',()=>{
  const f=fixture();f.words=[{text:'reveal',startMs:4500,endMs:4700}];assert.throws(()=>resolveEpisode(f),/0 hits/);
});
test('duplicate shot IDs and out-of-order starts fail',()=>{
  const f=fixture();f.shots[1].id=f.shots[0].id;assert.throws(()=>resolveEpisode(f),/unique/);
  const g=fixture();g.shots[1].fromFrame=0;assert.throws(()=>resolveEpisode(g),/increase/);
});
test('unregistered image and unknown fields fail',()=>{
  const f=fixture();f.shots[0].layers[0]={...f.shots[0].layers[0],kind:'image',assetId:'C'};assert.throws(()=>resolveEpisode(f),/assetId/);
  const g=fixture();g.shots[0].layers[0].autoPulse=true;assert.throws(()=>resolveEpisode(g),/unknown field/);
});
test('public paths reject traversal and audio bounds are strict',()=>{
  const f=fixture();f.assets=[{id:'C',file:'../C.png',version:'1',status:'draft',rights:'unresolved',role:'guide'}];assert.throws(()=>resolveEpisode(f),/relative public/);
  const g=fixture();g.audio=[{id:'vo',file:'medieval/vo.wav',role:'voice',fromFrame:170,durationFrames:20}];assert.throws(()=>resolveEpisode(g),/audio bounds/);
});
test('no automatic early base reveal to hide an empty initial shot',()=>{
  const f=fixture();f.shots[0].layers=f.shots[0].layers.slice(2);assert.throws(()=>resolveEpisode(f),/initial layer/);
});
test('final preflight rejects estimated technical fixture',async()=>{
  await assert.rejects(()=>preflight(path.join(projectRoot,'examples/medieval/smoke-props.json'),true),/Final requires/);
});
