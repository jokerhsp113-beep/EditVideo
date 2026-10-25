import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {preflight} from './preflight.mjs';
import {projectRoot} from './load-contracts.mjs';

try {
  const args=process.argv.slice(2);
  const props=args[0], output=args[1];
  if (!props || !output || args.slice(2).some(a=>a!=='--final')) throw new Error('Usage: node scripts/medieval/render.mjs props.json out/medieval/name.mp4 [--final]');
  await preflight(props,args.includes('--final'));
  const outputRoot=path.resolve(projectRoot,'out/medieval');
  const target=path.resolve(projectRoot,output);
  const rel=path.relative(outputRoot,target);
  if (rel.startsWith('..') || path.isAbsolute(rel) || path.extname(target)!=='.mp4') throw new Error('Output must be an MP4 under out/medieval');
  if (fs.existsSync(target)) throw new Error('Output exists; choose a new version filename');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const realParent=fs.realpathSync(path.dirname(target));
  const realRoot=fs.realpathSync(outputRoot);
  const realRel=path.relative(realRoot,realParent);
  if (realRel.startsWith('..') || path.isAbsolute(realRel)) throw new Error('Output directory escapes through a symlink');
  const browser=process.env.MEDIEVAL_BROWSER_EXECUTABLE;
  if (browser && (!fs.existsSync(browser) || !fs.statSync(browser).isFile())) throw new Error('MEDIEVAL_BROWSER_EXECUTABLE must point to an existing browser');
  const browserArgs=browser ? [`--browser-executable=${browser}`] : [];
  const result=spawnSync(process.execPath,[path.join(projectRoot,'node_modules/@remotion/cli/remotion-cli.js'),'render','src/medieval/index.ts','MEDIEVAL-EPISODE',target,`--props=${path.resolve(props)}`,'--codec=h264',...browserArgs],{cwd:projectRoot,stdio:'inherit'});
  if(result.error) throw result.error;
  process.exitCode=result.status ?? 1;
}catch(error){console.error(error.message);process.exitCode=1;}
