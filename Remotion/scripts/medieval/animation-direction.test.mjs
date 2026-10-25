import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {projectRoot,resolveEpisode,phraseFrame} from './load-contracts.mjs';
import {compileProfile} from './compile-profile.mjs';
const read=p=>JSON.parse(fs.readFileSync(path.join(projectRoot,p),'utf8'));
const input=()=>read('examples/medieval/style-upgrade-v02.input.json');
const compile=p=>compileProfile(p,read('channel/medieval/production-profile.v1.json'));

test('compiled action and camera cues have correct coordinate origins and provenance',()=>{
  const p=input();p.episode.shots[0].layers[3].fromFrame=6;
  const out=compile(p);const e=resolveEpisode(out.episode);
  assert.equal(e.shots[0].layers[3].keyframes[1].frame,18);
  assert.equal(e.shots[0].camera.keyframes[1].frame,105);
  assert.equal(out.build.cues.find(c=>c.target==='S001/object/1').episodeFrame,24);
  assert.equal(out.build.profileVersion,'1.2-draft');
  assert.equal(p.episode.shots[0].layers[3].keyframes[1].frame,undefined);
});
test('changed word timings retime action without hand-editing keyframes',()=>{
  const p=input();const before=compile(p);
  p.episode.words[0].startMs=900;
  const after=compile(p);
  assert.equal(after.episode.shots[0].layers[3].keyframes[1].frame,27);
  assert.notEqual(before.build.timingFingerprint,after.build.timingFingerprint);
});
test('ambiguous, missing, overflowing and conflicting cues fail',()=>{
  const missing=input();missing.episode.words[0].text='other';assert.throws(()=>compile(missing),/0 hits/);
  const repeated=input();repeated.episode.words[1].text='prepare';assert.throws(()=>compile(repeated),/2 hits/);
  const conflict=input();conflict.episode.shots[0].camera.keyframes[1].frame=5;assert.throws(()=>compile(conflict),/choose frame or at/);
  const outside=input();outside.episode.shots[0].camera.keyframes[1].offsetFrames=100;assert.throws(()=>compile(outside),/outside shot/);
});
test('action cue cannot precede layer entry or reverse keyframe order',()=>{
  const p=input();p.episode.shots[0].layers[3].fromFrame=30;assert.throws(()=>compile(p),/keyframe.frame/);
  const q=input();q.episode.shots[0].layers[3].keyframes[1].at='land';assert.throws(()=>compile(q),/strictly increase/);
});
test('audio action cues resolve in named shot and stale cue fields are rejected',()=>{
  const p=input();p.episode.audio=[{id:'tap',file:'technical.wav',role:'action',at:'land',cueShotId:'S001',durationFrames:12}];
  const out=compile(p);assert.equal(out.episode.audio[0].fromFrame,60);assert.equal(out.episode.audio[0].at,undefined);
  p.episode.audio[0].cueShotId='missing';assert.throws(()=>compile(p),/cueShotId/);
});
test('screen roots stay explicit; children inherit and cannot override spaces',()=>{
  const e=compile(input()).episode;assert.equal(resolveEpisode(e).shots[0].layers[0].space,'screen');
  e.shots[0].layers[3].space='screen';assert.throws(()=>resolveEpisode(e),/inherit/);
});
test('a multiword cue cannot cross its allowed shot window',()=>{
  assert.throws(()=>phraseFrame([{text:'hello',startMs:900,endMs:950},{text:'world',startMs:1100,endMs:1200}],'hello world',30,0,30),/0 hits/);
});
