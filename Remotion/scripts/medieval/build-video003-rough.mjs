import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const videoRoot = process.env.VIDEO003_ROOT ?? 'D:\\Youtube\\Medieval Life Explained\\videos\\Video003';
const timelinePath = path.join(videoRoot, '05_EDITING', 'EDIT_TIMELINE_AUDIO_V01.json');
const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
const outputRoot = path.join(projectRoot, 'public', 'medieval', 'video003', 'rough-v01');
const propsPath = path.join(projectRoot, 'examples', 'medieval', 'video003-rough-v01.json');
const sidecarPath = path.join(projectRoot, 'examples', 'medieval', 'video003-rough-v01-map.json');
const fps = Number(process.env.VIDEO003_ROUGH_FPS ?? 15);
if (!Number.isInteger(fps) || fps < 1 || fps > 60) throw new Error('VIDEO003_ROUGH_FPS must be an integer from 1 to 60');
const width = 1280;
const height = 720;
const durationInFrames = Math.ceil(timeline.metadata.total_audio_seconds * fps);
const frame = seconds => Math.round(seconds * fps);
const assets = [];
const assetByPath = new Map();
const fileSha = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');

function register(source, type) {
  if (!fs.existsSync(source)) throw new Error(`Missing source: ${source}`);
  const canonical = fs.realpathSync(source);
  if (assetByPath.has(canonical)) return assetByPath.get(canonical);
  const id = `${type}_${path.parse(source).name}`;
  if (assets.some(asset => asset.id === id)) throw new Error(`Asset ID collision: ${id}`);
  const relative = `medieval/video003/rough-v01/${type}/${path.basename(source)}`;
  const target = path.join(projectRoot, 'public', ...relative.split('/'));
  fs.mkdirSync(path.dirname(target), {recursive: true});
  if (!fs.existsSync(target) || fileSha(source) !== fileSha(target)) fs.copyFileSync(source, target);
  assets.push({id, file: relative, version: 'Video003-audio-edit-v01', status: 'draft', rights: 'unresolved', role: type});
  assetByPath.set(canonical, id);
  return id;
}

function imageLayer(id, assetId, fromFrame, untilFrame, extras = {}) {
  if (untilFrame <= fromFrame) throw new Error(`Empty image layer: ${id}`);
  return {id, kind: 'image', assetId, x: width / 2, y: height / 2, width, height,
    z: 0, fromFrame, untilFrame, ...extras};
}

const shots = [];
const map = [];
for (let i = 0; i < timeline.beats.length; i++) {
  const beat = timeline.beats[i];
  const start = frame(beat.timeline_start);
  const end = i + 1 < timeline.beats.length ? frame(timeline.beats[i + 1].timeline_start) : durationInFrames;
  const length = end - start;
  if (length < 1) throw new Error(`Beat too short after frame rounding: ${beat.id}`);
  const sceneFiles = [...(beat.scene_files ?? []), ...(beat.prop_files ?? []), ...(beat.existing_files ?? [])];
  if (!sceneFiles.length) throw new Error(`No scene selected: ${beat.id}`);
  if (sceneFiles.length > length) throw new Error(`More scene files than frames: ${beat.id}`);
  const layers = [];
  const sceneCuts = [];
  for (let j = 0; j < sceneFiles.length; j++) {
    const a = Math.floor(j * length / sceneFiles.length);
    const b = j + 1 === sceneFiles.length ? length : Math.floor((j + 1) * length / sceneFiles.length);
    const type = sceneFiles[j].includes('\\reused_png\\') ? 'gag' : sceneFiles[j].includes('\\scene_png\\') ? 'scene' : 'image';
    const id = register(sceneFiles[j], type);
    layers.push(imageLayer(`${beat.id}-scene-${j + 1}`, id, a, b));
    sceneCuts.push({assetId: id, fromFrame: start + a, untilFrame: start + b});
  }
  const overlays = [];
  const bindings = beat.overlay_bindings ?? [];
  if (bindings.length) {
    const revealStart = Math.min(length - bindings.length, Math.max(1, Math.floor(length * 0.38)));
    const revealLength = length - revealStart;
    for (let j = 0; j < bindings.length; j++) {
      const a = revealStart + Math.floor(j * revealLength / bindings.length);
      const b = j + 1 === bindings.length ? length : revealStart + Math.floor((j + 1) * revealLength / bindings.length);
      const id = register(bindings[j].preview_png, 'overlay');
      layers.push(imageLayer(`${beat.id}-overlay-${j + 1}`, id, a, b,
        {z: 10, enter: 'fade', enterFrames: Math.min(6, Math.max(1, b - a - 1))}));
      overlays.push({assetId: id, fromFrame: start + a, untilFrame: start + b, variant: bindings[j].variant});
    }
  }
  shots.push({id: beat.id, fromFrame: start, background: '#F4EDE1', layers,
    note: `${beat.paragraph} | ${beat.spoken_span}`});
  map.push({beatId: beat.id, paragraph: beat.paragraph, section: beat.section, spokenSpan: beat.spoken_span,
    fromFrame: start, untilFrame: end, sceneCuts, overlays, status: beat.status});
}

const boundary = frame(timeline.metadata.audio_file_boundaries_seconds[0]);
const audioFiles = ['Audio001.mp3', 'Audio002.mp3'];
const audio = audioFiles.map((name, i) => {
  const source = path.join(videoRoot, 'Audio', name);
  if (!fs.existsSync(source)) throw new Error(`Missing voice: ${source}`);
  const relative = `medieval/video003/rough-v01/audio/${name}`;
  const target = path.join(projectRoot, 'public', ...relative.split('/'));
  fs.mkdirSync(path.dirname(target), {recursive: true});
  if (!fs.existsSync(target) || fileSha(source) !== fileSha(target)) fs.copyFileSync(source, target);
  const fromFrame = i === 0 ? 0 : boundary;
  const endFrame = i === 0 ? boundary : durationInFrames;
  return {id: name.replace('.mp3', ''), file: relative, role: 'voice', fromFrame,
    durationFrames: endFrame - fromFrame, trimBeforeFrames: 0, volume: 1,
    fadeFrames: 0, loop: false, rights: 'unresolved'};
});

const episode = {id: 'Video003-peasant-life-rough-v01', version: 'rough-v01',
  scriptVersion: 'REV09', planVersion: 'STORYBOARD_ACTIVE_V05+EDIT_TIMELINE_AUDIO_V01',
  width, height, fps, durationInFrames, timingBasis: 'audio-aligned', words: [], assets, audio, shots};
fs.mkdirSync(path.dirname(propsPath), {recursive: true});
fs.writeFileSync(propsPath, JSON.stringify({episode}, null, 2) + '\n');
fs.writeFileSync(sidecarPath, JSON.stringify({source: timelinePath, status: 'provisional rough cut; timing and composite require human review', map}, null, 2) + '\n');
console.log(JSON.stringify({propsPath, sidecarPath, shots: shots.length, assets: assets.length,
  overlayReveals: map.reduce((sum, beat) => sum + beat.overlays.length, 0),
  sceneCuts: map.reduce((sum, beat) => sum + beat.sceneCuts.length, 0), durationInFrames,
  seconds: durationInFrames / fps}, null, 2));
