"""Inventory media without editing it. Editorial approval is never inferred."""
import argparse
import hashlib
import json
import pathlib
import subprocess
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import datetime, timezone
from PIL import Image

IMAGE_EXT = {'.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'}
AUDIO_EXT = {'.wav', '.mp3', '.m4a', '.ogg', '.flac'}
VIDEO_EXT = {'.mp4', '.webm', '.mov'}


def inspect(public, overrides, ffprobe=None):
    assets = []
    for file in sorted(public.rglob('*')):
        ext = file.suffix.lower()
        if not file.is_file() or ext not in IMAGE_EXT | AUDIO_EXT | VIDEO_EXT:
            continue
        relative = file.relative_to(public).as_posix()
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        item = {
            'id': relative, 'path': relative, 'sha256': digest, 'bytes': file.stat().st_size,
            'mediaType': 'image' if ext in IMAGE_EXT else 'audio' if ext in AUDIO_EXT else 'video',
            'status': 'draft', 'style': 'unclassified', 'tags': [],
            'provenance': {'source': None, 'license': None},
            'review': {'reviewer': None, 'evidence': None}, 'flags': [],
        }
        try:
            if ext == '.svg':
                root = ET.parse(file).getroot()
                if root.tag.rsplit('}', 1)[-1] != 'svg':
                    raise ValueError('Root is not SVG')
                viewbox = root.get('viewBox', '').replace(',', ' ').split()
                if len(viewbox) == 4:
                    item['width'], item['height'] = map(float, viewbox[2:])
                else:
                    item['flags'].append('svg-dimensions-unknown')
                if any('http' in v and key.rsplit('}', 1)[-1] in {'href','src'} for el in root.iter() for key,v in el.attrib.items()):
                    item['flags'].append('external-reference')
            elif ext in IMAGE_EXT:
                with Image.open(file) as im:
                    im.load()
                    item['width'], item['height'] = im.size
                    item['hasAlpha'] = 'A' in im.getbands() or 'transparency' in im.info
                    if item['hasAlpha']:
                        alpha = im.convert('RGBA').getchannel('A')
                        item['alphaBounds'] = alpha.getbbox()
                        if item['alphaBounds'] is None:
                            item['flags'].append('empty-alpha')
                    if min(im.size) < 128:
                        item['flags'].append('small-raster')
            elif ffprobe:
                proc = subprocess.run([str(ffprobe), '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(file)], capture_output=True, text=True, timeout=30)
                if proc.returncode:
                    raise ValueError(proc.stderr.strip()[:200])
                metadata = json.loads(proc.stdout)
                item['durationSeconds'] = float(metadata['format']['duration'])
                audio = next((s for s in metadata['streams'] if s['codec_type']=='audio'), None)
                if audio:
                    item['sampleRate'] = int(audio['sample_rate'])
                    item['channels'] = audio['channels']
                video = next((s for s in metadata['streams'] if s['codec_type']=='video'), None)
                if video:
                    item['width'], item['height'] = video['width'], video['height']
            else:
                item['flags'].append('audio-video-metadata-not-inspected')
        except Exception as error:
            item['flags'].append('unreadable')
            item['inspectionError'] = str(error)
        if relative in {'sfx/pop.wav', 'sfx/chime.wav', 'sfx/whoosh.wav'}:
            item['flags'].append('placeholder')
        custom = overrides.get(relative, {})
        for key in ['style','tags','provenance','pivot','attachmentPoints','capabilities']:
            if key in custom:
                item[key] = custom[key]
        requested = custom.get('status', 'draft')
        if requested == 'rejected':
            item['status'] = 'rejected'
        elif requested == 'approved':
            if custom.get('sha256') == digest and custom.get('review', {}).get('reviewer') and custom.get('review', {}).get('evidence'):
                item['status'] = 'approved'
                item['review'] = custom['review']
            else:
                item['flags'].append('approval-missing-or-content-changed')
        if not item['provenance'].get('source') or not item['provenance'].get('license'):
            item['flags'].append('provenance-unverified')
        assets.append(item)
    return assets


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[2])
    parser.add_argument('--public', type=pathlib.Path)
    parser.add_argument('--output', type=pathlib.Path)
    parser.add_argument('--overrides', type=pathlib.Path)
    parser.add_argument('--ffprobe', type=pathlib.Path)
    args = parser.parse_args()
    project = args.project.resolve()
    # The editor package is nested one level below the Remotion repository,
    # whose public/ directory is the canonical media library.
    public = (args.public or project.parent / 'public').resolve()
    if not public.is_dir():
        parser.error(f'Public directory missing: {public}')
    output = args.output or project / 'professional-editor/library/asset-catalog.json'
    overrides_path = args.overrides or project / 'professional-editor/library/asset-overrides.json'
    overrides = json.loads(overrides_path.read_text(encoding='utf-8')) if overrides_path.exists() else {}
    ffprobe = args.ffprobe
    if ffprobe is None:
        candidates = [
            project / 'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe',
            project.parent / 'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe',
        ]
        ffprobe = next((candidate for candidate in candidates if candidate.exists()), candidates[0])
    assets = inspect(public, overrides, ffprobe if ffprobe.exists() else None)
    hashes = defaultdict(list)
    for asset in assets:
        hashes[asset['sha256']].append(asset['id'])
    catalog = {
        'schemaVersion': 1, 'generatedAt': datetime.now(timezone.utc).isoformat(),
        'scope': 'public/', 'approvalPolicy': 'Technical inspection never grants editorial approval.',
        'summary': {'total':len(assets), 'byType':dict(Counter(a['mediaType'] for a in assets)), 'byStatus':dict(Counter(a['status'] for a in assets)), 'byFlag':dict(Counter(f for a in assets for f in a['flags']))},
        'duplicateGroups': [ids for ids in hashes.values() if len(ids)>1],
        'assets': assets,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(catalog['summary'], ensure_ascii=False))
    print(f'Catalog: {output}')


if __name__ == '__main__':
    main()
