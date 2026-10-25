import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseFile} from 'music-metadata';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '../..');
const publicDir = path.resolve(packageRoot, '../public');
const catalogPath = path.join(packageRoot, 'professional-editor/library/asset-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

for (const asset of catalog.assets.filter(item => item.mediaType === 'audio')) {
  const fullPath = path.resolve(publicDir, asset.path);
  try {
    const metadata = await parseFile(fullPath);
    asset.durationSeconds = metadata.format.duration;
    if (metadata.format.sampleRate) asset.sampleRate = metadata.format.sampleRate;
    if (metadata.format.numberOfChannels) asset.channels = metadata.format.numberOfChannels;
    asset.flags = asset.flags.filter(flag => flag !== 'unreadable');
    delete asset.inspectionError;
  } catch (error) {
    if (!asset.flags.includes('unreadable')) asset.flags.push('unreadable');
    asset.inspectionError = error instanceof Error ? error.message : String(error);
  }
}

const count = key => catalog.assets.reduce((total, asset) => total + (asset[key] ? 1 : 0), 0);
const counts = values => Object.fromEntries([...new Set(values)].map(value => [value, values.filter(item => item === value).length]));
catalog.summary = {
  total: catalog.assets.length,
  byType: counts(catalog.assets.map(asset => asset.mediaType)),
  byStatus: counts(catalog.assets.map(asset => asset.status)),
  byFlag: counts(catalog.assets.flatMap(asset => asset.flags)),
};
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
console.log(`Audio metadata inspected: ${count('durationSeconds')}/${catalog.assets.filter(asset => asset.mediaType === 'audio').length}`);
