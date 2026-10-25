import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = fs.readFileSync(path.join(projectRoot, 'src/medieval/contracts.ts'), 'utf8');
// Same pure resolver used by Studio and preflight; no hand-maintained second schema.
const compiled = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText;
export const {resolveEpisode,sampleTransform,sampleGain,phraseFrame} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
