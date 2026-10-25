from pathlib import Path
import json,shutil,hashlib,datetime
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v01'
EP=Path(r'D:\Youtube\Medieval Life Explained\videos\Video005')
TARGET=EP/'production/video-draft-v01-20261020';TARGET.mkdir(exist_ok=False)
FIN=EP/'final/draft-v01';FIN.mkdir(parents=True,exist_ok=False)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
index=EP.parents[1]/'content-system/PROJECT_CONTENT_INDEX.json'
shutil.copy2(index,TARGET/'PROJECT_CONTENT_INDEX_BEFORE_DRAFT_V01.json')
for name in ['TIMELINE_V01.json','LAYER_LINEAGE_V01.json','BUILD_REPORT_V01.json','MIX_PROVENANCE_V01.json','VOICE_SAMPLE_PRESERVATION_V01.json','EXPORT_VERIFICATION_V01.json','MIX_TECHNICAL_ANALYSIS.log','REVIEW_AND_EDIT_VI.md']:
 shutil.copy2(OUT/name,TARGET/name)
shutil.copytree(OUT/'export-qa',TARGET/'export-qa')
shutil.copy2(ROOT/'examples/medieval/video005-draft-v01.props.json',TARGET/'video005-draft-v01.props.json')
shutil.copytree(ROOT/'public/medieval/video005-draft-v01',TARGET/'public/medieval/video005-draft-v01')
shutil.copytree(ROOT/'public/fonts',TARGET/'public/fonts')
for name in ['build-video005-draft-v01.py','render-video005-draft-v01.mjs','assemble-video005-draft-v01.py','verify-video005-draft-v01.py','deliver-video005-draft-v01.py']:
 (TARGET/'build-scripts').mkdir(exist_ok=True);shutil.copy2(ROOT/'scripts/medieval'/name,TARGET/'build-scripts'/name)
video=FIN/'VIDEO005_DRAFT_V01_1080p30.mp4';shutil.copy2(OUT/video.name,video);assert sha(video)==sha(OUT/video.name)
data=json.loads(index.read_text(encoding='utf-8-sig'));episode=data['episodes']['05-home-privacy']
episode['draft_video']=dict(version='V01',video=str(video),project_root=str(ROOT),props=str(ROOT/'examples/medieval/video005-draft-v01.props.json'),handoff=str(TARGET),review=str(TARGET/'REVIEW_AND_EDIT_VI.md'),verification=str(TARGET/'EXPORT_VERIFICATION_V01.json'),duration_s=359.1666666667,status='Complete review draft rendered; exported frames inspected and full decode checked. Music/SFX and ASR timing provisional; full listening/user approval pending. No upload performed.')
episode['status']='V09/V12 assembled into full 1080p30 review video V01 using provided Audio001, 104 states and separate editable audio clips. Original script/audio retained; P027 listening marker remains.'
data['updated']='2026-10-20';index.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
files=[dict(file=str(p.relative_to(TARGET)),sha256=sha(p)) for p in TARGET.rglob('*') if p.is_file()]
proof=dict(video=str(video),sha256=sha(video),package=str(TARGET),files=files,index=str(index),original_audio_unchanged=sha(EP/'audio/Audio001.mp3')=='0fd3aeafc92b09014f48b2284c69f1fe422530cdec6bbff80653a2748550432b')
assert proof['original_audio_unchanged'];(TARGET/'DELIVERY_VERIFICATION_V01.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(dict(video=str(video),handoff=str(TARGET),original_audio_unchanged=True)))
