import fs from 'node:fs';
import path from 'node:path';
import {parseFile} from 'music-metadata';
import {fileURLToPath} from 'node:url';
import {projectRoot, resolveEpisode} from './load-contracts.mjs';

export async function preflight(propsPath, final = false) {
  const props = JSON.parse(fs.readFileSync(propsPath,'utf8'));
  const episode = resolveEpisode(props.episode);
  const publicRoot = fs.realpathSync(path.join(projectRoot,'public'));
  const inspectPath = file => {
    const candidate = path.join(publicRoot,file);
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) throw new Error(`Missing public file: ${file}`);
    const real = fs.realpathSync(candidate);
    const relative = path.relative(publicRoot, real);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`File escapes public directory: ${file}`);
    return real;
  };
  for (const asset of episode.assets) {
    inspectPath(asset.file);
    if (final && (asset.status !== 'inspected' || asset.rights !== 'recorded')) throw new Error(`Final requires inspected assets and recorded rights: ${asset.id}`);
  }
  for (const audio of episode.audio) {
    if (final && audio.rights !== 'recorded') throw new Error(`Final requires recorded audio rights: ${audio.id}`);
    const metadata = await parseFile(inspectPath(audio.file));
    const seconds = metadata.format.duration;
    if (!seconds || !Number.isFinite(seconds)) throw new Error(`Cannot determine audio duration: ${audio.id}`);
    const availableFrames = seconds * episode.fps - audio.trimBeforeFrames;
    if (availableFrames <= 0 || (!audio.loop && availableFrames + 1 < audio.durationFrames)) throw new Error(`Audio range exceeds source: ${audio.id}`);
  }
  if (final && (episode.timingBasis !== 'audio-aligned' || !episode.audio.some(a => a.role === 'voice'))) throw new Error('Final requires audio-aligned narration');
  return {props, episode};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const filename = args.find(a => !a.startsWith('--'));
  if (!filename || args.some(a => a.startsWith('--') && a !== '--final')) {
    console.error('Usage: node scripts/medieval/preflight.mjs props.json [--final]');process.exitCode=1;
  } else {
    try {const {episode} = await preflight(filename,args.includes('--final'));console.log(`PASS ${episode.id}: ${episode.shots.length} shots, ${episode.assets.length} assets; ${episode.timingBasis}. File checks do not replace visual/audio QA or rights evidence.`);}
    catch(error){console.error(error.message);process.exitCode=1;}
  }
}
