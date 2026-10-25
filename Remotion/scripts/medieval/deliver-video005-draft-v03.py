from pathlib import Path
import json,shutil,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v03';EP=Path(r'D:\Youtube\Medieval Life Explained\videos\Video005');TARGET=EP/'production/video-draft-v03-20261020';FIN=EP/'final/draft-v03'
assert not TARGET.exists() and not FIN.exists();TARGET.mkdir();FIN.mkdir(parents=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
index=EP.parents[1]/'content-system/PROJECT_CONTENT_INDEX.json';shutil.copy2(index,TARGET/'PROJECT_CONTENT_INDEX_BEFORE_V03.json')
for name in ['BUILD_REPORT_V03.json','CHANGE_REGISTER_V03.json','TEXT_OVERLAY_CHECKS_V03.json','FULL_FRAME_AUDIT_V03.json','TIMELINE_V03.json','AUDIO_BITSTREAM_UNCHANGED_V03.json','EXPORT_VERIFICATION_V03.json','STATE_RENDER_PROVENANCE_V03.json','REVIEW_AND_AUDIT_VI.md']:
 shutil.copy2(OUT/name,TARGET/name)
for p in OUT.glob('phone-check-*.jpg'):shutil.copy2(p,TARGET/p.name)
shutil.copytree(OUT/'export-qa',TARGET/'export-qa');shutil.copytree(OUT/'public',TARGET/'public')
shutil.copy2(ROOT/'examples/medieval/video005-draft-v03.props.json',TARGET/'video005-draft-v03.props.json')
scripts=TARGET/'build-scripts';scripts.mkdir()
for p in (ROOT/'scripts/medieval').glob('*video005*v03*'):shutil.copy2(p,scripts/p.name)
video=FIN/'VIDEO005_DRAFT_V03_1080p30.mp4';shutil.copy2(OUT/video.name,video);assert sha(video)==sha(OUT/video.name)
data=json.loads(index.read_text(encoding='utf-8-sig'));episode=data['episodes']['05-home-privacy'];episode.setdefault('draft_video_history',[]).append(episode['draft_video'])
episode['draft_video']=dict(version='V03',video=str(video),project_root=str(ROOT),props=str(ROOT/'examples/medieval/video005-draft-v03.props.json'),entry=str(ROOT/'src/medieval/video005/index-v03.tsx'),handoff=str(TARGET),audit=str(TARGET/'REVIEW_AND_AUDIT_VI.md'),verification=str(TARGET/'EXPORT_VERIFICATION_V03.json'),duration_s=10775/30,status='26 illustration states restored full-screen with ivory/dark-outline text overlay; layouts checked in exported frames; V02 AAC audio bitstream preserved exactly.')
episode['visual_text_preference']='Full-screen scene art with readable overlaid text; change contrast/position instead of shrinking illustrations into a paper footer. Purposeful diagrams and comparisons may retain separate layouts.'
episode['status']='V03 current review video: full-screen scene art restored in 26 states; V02 music/SFX/voice retained; earlier drafts preserved.';data['updated']='2026-10-20';index.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
proof=dict(video=str(video),sha256=sha(video),package=str(TARGET),source_audio_unchanged=sha(EP/'audio/Audio001.mp3')=='0fd3aeafc92b09014f48b2284c69f1fe422530cdec6bbff80653a2748550432b',files=[dict(file=str(p.relative_to(TARGET)),sha256=sha(p)) for p in TARGET.rglob('*') if p.is_file()]);assert proof['source_audio_unchanged'];(TARGET/'DELIVERY_VERIFICATION_V03.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(dict(video=str(video),handoff=str(TARGET))))
