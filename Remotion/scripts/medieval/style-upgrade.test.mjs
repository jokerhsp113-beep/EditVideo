import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {projectRoot,resolveEpisode,sampleTransform,sampleGain} from './load-contracts.mjs';
import {compileProfile} from './compile-profile.mjs';
const read=p=>JSON.parse(fs.readFileSync(path.join(projectRoot,p),'utf8'));
const profile=()=>read('channel/medieval/production-profile.v1.json');
const props=()=>compileProfile(read('examples/medieval/style-upgrade-v02.input.json'),profile());
const base={x:0,y:0,scale:1,rotate:0,opacity:1};

test('profile compiler applies text hierarchy without mutating input or explicit values',()=>{
  const input=read('examples/medieval/style-upgrade-v02.input.json');const output=compileProfile(input,profile());
  assert.equal(output.episode.width,1920);assert.equal(input.episode.width,undefined);
  assert.equal(output.episode.shots[0].layers[0].fontSize,84);
  input.episode.height=720;input.episode.width=1280;input.episode.fps=24;
  input.episode.shots[0].layers[0].fontSize=51;
  const resized=compileProfile(input,profile());
  assert.equal(resized.episode.shots[0].layers[0].fontSize,51);
  assert.equal(resized.episode.shots[0].layers.at(-1).fontSize,44*720/1080);
  assert.equal(resized.episode.fps,24);
});
test('multi-stage action reaches authored endpoints, holds, and scrubs deterministically',()=>{
  const layer=resolveEpisode(props().episode).shots[0].layers.find(l=>l.id==='object');
  assert.equal(sampleTransform(base,layer.keyframes,42).x,450);
  assert.equal(sampleTransform(base,layer.keyframes,72).y,340);
  assert.equal(sampleTransform(base,layer.keyframes,170).y,340);
  assert.deepEqual(sampleTransform(base,layer.keyframes,20),sampleTransform(base,layer.keyframes,20));
  const keys=[{frame:0,x:0,easing:'linear'},{frame:10,x:100,easing:'hold'}];
  assert.equal(sampleTransform(base,keys,9).x,0);assert.equal(sampleTransform(base,keys,10).x,100);
});
test('cue remains late with groups and camera enabled',()=>{
  const e=resolveEpisode(props().episode);assert.equal(e.shots[0].layers.find(l=>l.id==='result').enterFrame,90);
});
test('keyframe conflicts, order and lifetime are rejected',()=>{
  for(const mutation of [
    l=>l.keyframes.push({frame:180,x:0}),
    l=>l.keyframes.push({frame:0,x:0}),
    l=>l.motion={toX:500,durationFrames:10},
    l=>l.keyframes[0].opacity=2,
  ]){const e=props().episode;mutation(e.shots[0].layers[3]);assert.throws(()=>resolveEpisode(e));}
});
test('groups reject missing parents, cycles and child lifetime outside parent',()=>{
  const missing=props().episode;missing.shots[0].layers[3].parentId='missing';assert.throws(()=>resolveEpisode(missing),/parent/);
  const cycle=props().episode;cycle.shots[0].layers[1].parentId='action-group';assert.throws(()=>resolveEpisode(cycle),/cyclic/);
  const lifetime=props().episode;lifetime.shots[0].layers[1].untilFrame=100;assert.throws(()=>resolveEpisode(lifetime),/lifetime/);
});
test('camera requires reason and keyframes inside its shot',()=>{
  const e=props().episode;e.shots[0].camera.reason='';assert.throws(()=>resolveEpisode(e),/reason/);
  const f=props().episode;f.shots[0].camera.keyframes.push({frame:180,scale:2});assert.throws(()=>resolveEpisode(f),/camera keyframe/);
});
test('audio envelopes use clip-relative time and never amplify above clip volume',()=>{
  const envelope=[{frame:0,gain:1},{frame:10,gain:0.2},{frame:20,gain:1}];
  assert.ok(Math.abs(sampleGain(envelope,5)-0.6)<1e-10);assert.equal(sampleGain(envelope,100),1);
  const e=props().episode;e.audio=[{id:'air',file:'demo.wav',role:'ambience',fromFrame:0,durationFrames:180,loop:true,gainEnvelope:envelope}];
  assert.equal(resolveEpisode(e).audio[0].role,'ambience');
  e.audio[0].gainEnvelope[1].gain=2;assert.throws(()=>resolveEpisode(e),/gain/);
});
test('legacy manifest keeps layout and movement defaults',()=>{
  const old=read('src/medieval/smoke.json');const e=resolveEpisode(old);
  assert.equal(e.shots[0].camera,undefined);assert.equal(e.shots[0].layers[0].fontSize,undefined);
  assert.equal(e.shots[0].layers[1].motion.toX,900);
});
