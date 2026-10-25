from pathlib import Path
import json,shutil,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v02';AUD=ROOT/'out/medieval/video005-audit-v02'
EP=Path(r'D:\Youtube\Medieval Life Explained\videos\Video005');TARGET=EP/'production/video-draft-v02-20261020';FIN=EP/'final/draft-v02'
assert not TARGET.exists() and not FIN.exists(),'Versioned delivery already exists'
TARGET.mkdir();FIN.mkdir(parents=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
index=EP.parents[1]/'content-system/PROJECT_CONTENT_INDEX.json';shutil.copy2(index,TARGET/'PROJECT_CONTENT_INDEX_BEFORE_V02.json')
for name in ['BUILD_REPORT_V02.json','CHANGE_REGISTER_V02.json','TEXT_LAYOUT_CHECKS_V02.json','LAYOUT_AUDIT_V02.json','SOUND_CUES_V02.json','SOUND_LEVEL_PREP_V02.json','SOUND_SIGNAL_AUDIT_V02.json','MIX_PROVENANCE_V02.json','TIMELINE_V02.json','EXPORT_VERIFICATION_V02.json','MIX_TECHNICAL_ANALYSIS.log','MUSIC_CREDITS_FOR_DESCRIPTION.txt','REVIEW_AND_EDIT_VI.md','AUDIT_AFTER_EDIT_VI.md','REVIEW_MEDIA_V02.html','BEFORE_AFTER_V02.jpg']:
 shutil.copy2(OUT/name,TARGET/name)
for name in ['AUDIT_BEFORE_EDIT_VI.md','MUSIC_AND_SFX_SELECTION_VI.md','MEDIA_SOURCES_V02.json']:shutil.copy2(AUD/name,TARGET/name)
for name in ['export-qa','layout-qa','audio-review']:shutil.copytree(OUT/name,TARGET/name)
shutil.copytree(AUD/'sources',TARGET/'source-evidence')
shutil.copytree(OUT/'public',TARGET/'public')
# Preserve raw music alternatives and SVG sources in addition to referenced prepared clips.
extras=TARGET/'public/medieval/video005-draft-v02';shutil.copytree(ROOT/'public/medieval/video005-draft-v02',extras,dirs_exist_ok=True)
shutil.copy2(ROOT/'examples/medieval/video005-draft-v02.props.json',TARGET/'video005-draft-v02.props.json')
scripts=TARGET/'build-scripts';scripts.mkdir()
for p in (ROOT/'scripts/medieval').glob('*video005*v02*'):shutil.copy2(p,scripts/p.name)
video=FIN/'VIDEO005_DRAFT_V02_1080p30.mp4';shutil.copy2(OUT/video.name,video);assert sha(video)==sha(OUT/video.name)
data=json.loads(index.read_text(encoding='utf-8-sig'));episode=data['episodes']['05-home-privacy'];episode.setdefault('draft_video_history',[]).append(episode.get('draft_video',{}))
episode['draft_video']=dict(version='V02',video=str(video),project_root=str(ROOT),props=str(ROOT/'examples/medieval/video005-draft-v02.props.json'),entry=str(ROOT/'src/medieval/video005/index-v02.tsx'),handoff=str(TARGET),audit_before=str(TARGET/'AUDIT_BEFORE_EDIT_VI.md'),audit_after=str(TARGET/'AUDIT_AFTER_EDIT_VI.md'),music_and_sfx=str(TARGET/'MUSIC_AND_SFX_SELECTION_VI.md'),verification=str(TARGET/'EXPORT_VERIFICATION_V02.json'),duration_s=10775/30,status='Revised review video: 37 visual states repaired, source-verified music/SFX added and level-prepared; exported frames/technical checks complete, direct listening/user approval pending.')
episode['status']='V02 review video: typography/layout/diagrams and soundtrack repaired after located audit. V09 narration and 104-state timeline unchanged. V01 retained.'
data['updated']='2026-10-20';index.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
proof=dict(video=str(video),sha256=sha(video),package=str(TARGET),original_audio_unchanged=sha(EP/'audio/Audio001.mp3')=='0fd3aeafc92b09014f48b2284c69f1fe422530cdec6bbff80653a2748550432b',original_script_unchanged=sha(EP/'SCRIPT_EN_V09.md').upper()=='CD9CE036EC081E9A088666A043B773B497B8B2F88672FC7D5ED896B6C908ED11',files=[dict(file=str(p.relative_to(TARGET)),sha256=sha(p)) for p in TARGET.rglob('*') if p.is_file()])
assert proof['original_audio_unchanged'] and proof['original_script_unchanged'];(TARGET/'DELIVERY_VERIFICATION_V02.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(dict(video=str(video),handoff=str(TARGET))))
