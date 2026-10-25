from pathlib import Path
from PIL import Image,ImageDraw
import json,shutil,hashlib,html
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video006-assets-v01'
EP=Path(r'D:\Youtube\Medieval Life Explained\videos\Video006');PLAN=EP/'production/prompt-plan-v04-20261021';DEST=EP/'production/assets-generated-v01-20261021'
assert not DEST.exists(),'Destination exists; stop rather than overwrite.'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
script=EP/'SCRIPT_EN_V05.md';expected='89ee99380867505a84b5c1afae2df822b274c4856e490ffa2ea3bf0352f780e9';assert sha(script)==expected
coverage=read(OUT/'COVERAGE_CHECK.json');assert coverage['generated_rasters']==32 and not coverage['missing']
DEST.mkdir(parents=True)
for sub in ['raster','native']:shutil.copytree(OUT/sub,DEST/sub)
(DEST/'composite-preview').mkdir();(DEST/'scripts').mkdir();(DEST/'qa').mkdir()
rows=read(OUT/'COMPOSITE_MANIFEST.json')
for r in rows:
 source=OUT/'composite-preview'/f"{r['state']}.png";assert source.is_file();Image.open(source).convert('RGB').save(DEST/'composite-preview'/f"{r['state']}.jpg",quality=93)
for k in range(0,len(rows),12):
 sheet=Image.new('RGB',(1536,756),'#e4ddce');d=ImageDraw.Draw(sheet)
 for j,r in enumerate(rows[k:k+12]):
  im=Image.open(DEST/'composite-preview'/f"{r['state']}.jpg");im.thumbnail((384,216));x=j%4*384;y=j//4*252;sheet.paste(im,(x,y+30));d.text((x+8,y+7),r['state'],fill='black')
 sheet.save(DEST/'qa'/f'STORYBOARD_QA_{k//12+1}.jpg',quality=93)
for f in ['build-video006-native-v01.py','prepare-video006-asset-review.py','render-video006-review-v01.mjs','deliver-video006-assets-v01.py']:shutil.copy2(ROOT/'scripts/medieval'/f,DEST/'scripts'/f)
shutil.copy2(ROOT/'src/medieval/video006/asset-review.tsx',DEST/'scripts/asset-review.tsx')
for name in ['AUDIT_ASSETS_V01_VI.md','REGISTRATION.json','COVERAGE_CHECK.json','CURRENT_GENERATOR_PATHS.json']:shutil.copy2(OUT/name,DEST/name)
shutil.copy2(PLAN/'PROMPT_PACK_CURRENT.json',DEST/'BASE_PROMPT_PACK_V04.json')
shutil.copy2(PLAN/'STORYBOARD_CURRENT.json',DEST/'BASE_STORYBOARD_V04.json')
pack=read(PLAN/'PROMPT_PACK_CURRENT.json');technical=read(OUT/'RASTER_TECHNICAL.json');native=read(OUT/'NATIVE_MANIFEST.json')
by={a['asset_id']:a for a in pack['prompts']};asset_records=[]
for t in technical:
 id=t['id'];a=by[id];t['file']=str(DEST/'raster'/f'{id}_v01.png');t['status']='inspected-for-static-composite-use; not user-approved';t['base_prompt']=a['prompt_en'];t['selected_dependency_files']={dep:str(DEST/'raster'/f'{dep}_v01.png') for dep in a.get('selected_output_dependency_ids',[])};t['existing_references']=[p.replace('\\\\','\\') for p in a.get('reference_inputs_existing',[])];t['consumers']=a['consuming_states'];t['execution_note']='Built-in imagegen; original reference inspected; existing dependency outputs attached after acceptance. Future/nonexistent wording resolved for execution. Corrections detailed in AUDIT_ASSETS.';asset_records.append(t)
save(DEST/'RASTER_INVENTORY_V01.json',asset_records)
for r in native:r['file']=str(DEST/'native'/Path(r['file']).name);r['status']='built; inspected in consuming static composites';r['renderer_contract']='Full-frame SVG; do not rescale with the old proposed native layer box.'
save(DEST/'NATIVE_MANIFEST_V01.json',native)
for r in rows:
 r['preview']=str(DEST/'composite-preview'/f"{r['state']}.jpg");r['editable_composite_source']=r.pop('file');r['status']='static composite inspected; audio/motion not evaluated'
save(DEST/'STATE_ASSET_MAP_V01.json',rows)
for t in technical:assert sha(Path(t['file']))==t['sha256']
for r in native:assert Path(r['file']).is_file()
source_reuse=Path(r'D:\Youtube\Medieval Life Explained\videos\Video005\production\assets-generated-v10-20261019\selected\C_TOWER_SELF_AWARE_v01.png')
assert sha(DEST/'raster/C_SELF_AWARE_v01.png')==sha(source_reuse)
page=(OUT/'ASSET_REVIEW_V01.html').read_text(encoding='utf-8').replace('.png','.jpg')
(DEST/'ASSET_REVIEW_V01.html').write_text(page,encoding='utf-8')
(DEST/'README_VI.md').write_text('# Video006 — assets V01, script V05 / prompt V04\n\nMở ASSET_REVIEW_V01.html để xem 68 ảnh ghép với cue và đoạn script. Đọc AUDIT_ASSETS_V01_VI.md để xem so sánh expectation, lỗi đã sửa và phần chưa kiểm.\n\n32 raster mới + 1 reuse trong raster/. 13 native families / 48 state SVG trong native/. Preview JPEG trong composite-preview/ chỉ để review, không thay asset nguồn. Toàn bộ selected raster giữ PNG/alpha gốc.\n\nState map và registration ghi crop/tỷ lệ/điểm neo bàn chân thật. Native SVG là full-canvas: không scale lại bằng proposed box cũ. Căn timing/pose switch theo audio thật trước khi dựng; chưa có animation, voice review hoặc final video.\n\nEditable render workspace: D:/Youtube/EditVideo/Remotion/out/medieval/video006-assets-v01. Các script bàn giao chạy tại Remotion project root; không chạy bản copy ngoài project như standalone.\n',encoding='utf-8')
result={'date':'2026-10-21','source_sha256':expected,'selected_new_rasters':32,'backgrounds':7,'new_character_or_group_cutouts':25,'reused_rasters':1,'native_families':13,'native_state_svgs':48,'reviewed_static_states':68,'scope':'Static assets/composites ready for draft animatic; no audio alignment or motion validation','path':str(DEST),'audit':str(DEST/'AUDIT_ASSETS_V01_VI.md'),'review':str(DEST/'ASSET_REVIEW_V01.html'),'inventory':str(DEST/'RASTER_INVENTORY_V01.json'),'state_map':str(DEST/'STATE_ASSET_MAP_V01.json'),'hash_checks':'All 32 selected new raster copies and reuse matched source hashes'}
save(DEST/'DELIVERY_VALIDATION_V01.json',result)
index=EP.parent.parent/'content-system/PROJECT_CONTENT_INDEX.json';idx=read(index)
shutil.copy2(index,DEST/'PROJECT_CONTENT_INDEX_BEFORE_DELIVERY.json')
entry=idx['episodes']['06-medieval-wayfinding'];entry['generated_assets']=result;entry['production_stage']='32 raster outputs + 13 native families/48 states + 1 reuse delivered; 68 static composites inspected/repaired. Ready for draft animatic; actual audio/motion pending.';idx['updated']='2026-10-21';save(index,idx)
print(json.dumps(result,ensure_ascii=True,indent=2))
