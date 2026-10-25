import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '../..');
const repositoryRoot = path.resolve(packageRoot, '..');
const source = path.join(packageRoot, '.agents/skills/science-video-editor');
const destination = path.join(repositoryRoot, '.agents/skills/science-video-editor');

if (!fs.existsSync(path.join(source, 'SKILL.md'))) {
  throw new Error(`Canonical skill is missing: ${source}`);
}

fs.mkdirSync(path.dirname(destination), {recursive: true});
fs.cpSync(source, destination, {recursive: true, force: true});
console.log(`Synced science-video-editor skill to ${destination}`);
