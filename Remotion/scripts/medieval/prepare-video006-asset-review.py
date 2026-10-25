from pathlib import Path
from PIL import Image
import json,base64,shutil,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video006-assets-v01'
PLAN=Path(r'D:\Youtube\Medieval Life Explained\videos\Video006\production\prompt-plan-v04-20261021')
paths=json.loads((OUT/'CURRENT_GENERATOR_PATHS.json').read_text(encoding='utf-8'))
rasters=OUT/'raster';rasters.mkdir(exist_ok=True)
technical=[]
for id,path in paths.items():
 dst=rasters/f'{id}_v01.png';shutil.copy2(path,dst)
 im=Image.open(dst);alpha=im.getchannel('A') if 'A' in im.getbands() else None
 bbox=alpha.point(lambda p:255 if p>=128 else 0).getbbox() if alpha else (0,0,*im.size)
 footbox=alpha.point(lambda p:255 if p>=128 else 0).crop((0,max(0,bbox[3]-int((bbox[3]-bbox[1])*.08)),im.width,bbox[3])).getbbox() if alpha else bbox
 technical.append({'id':id,'file':str(dst),'generator_original':path,'width':im.width,'height':im.height,'mode':im.mode,'alpha_extrema':alpha.getextrema() if alpha else None,'opaque_bbox_128':bbox,'foot_center_x':(footbox[0]+footbox[2])/2,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'status':'technical-measured; visual acceptance recorded separately'})
reuse=Path(r'D:\Youtube\Medieval Life Explained\videos\Video005\production\assets-generated-v10-20261019\selected\C_TOWER_SELF_AWARE_v01.png')
shutil.copy2(reuse,rasters/'C_SELF_AWARE_v01.png')
by={r['id']:r for r in technical}
im=Image.open(reuse);a=im.getchannel('A');by['C_SELF_AWARE']={'file':str(reuse),'width':im.width,'height':im.height,'opaque_bbox_128':a.point(lambda p:255 if p>=128 else 0).getbbox()}
native=json.loads((OUT/'NATIVE_MANIFEST.json').read_text(encoding='utf-8'));nby={(r['asset_id'],r['state']):r for r in native}
story=json.loads((PLAN/'STORYBOARD_CURRENT.json').read_text(encoding='utf-8-sig'))
def data(path,mime):return 'data:'+mime+';base64,'+base64.b64encode(Path(path).read_bytes()).decode()
review=[];geometry=[];missing=[]
dest=OUT/'composites';dest.mkdir(exist_ok=True)
for shot in story['shots']:
 for state in shot['states']:
  layers=[];screens=[]
  # Native whole-frame diagrams behind C, transparent labels above.
  ordered=sorted(state['layers'],key=lambda l: (0 if l['asset_id'].startswith('N_') and l['asset_id'] not in ['N_SCOPE','N_CASE','N_DESTINATION'] else l['z']))
  for layer in ordered:
   id=layer['asset_id'];x,y,w,h=layer['box_normalized']
   if id.startswith('N_'):
    nr=nby.get((id,state['id']))
    if nr:
     target=screens if id in ['N_SCOPE','N_CASE','N_DESTINATION'] else layers
     target.append(f'<image href="{data(nr["file"],"image/svg+xml")}" x="0" y="0" width="1920" height="1080"/>')
    continue
   if id not in by:missing.append({'state':state['id'],'asset':id});continue
   r=by[id]
   if id.startswith('BG_'):
    layers.append(f'<image href="{data(r["file"],"image/png")}" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>');continue
   # Register delivered character silhouettes to a shared floor, not raw canvas bounds.
   l,t,rr,b=r['opaque_bbox_128']
   family='C_LISTEN' if id.startswith('C_') else 'GUIDE_POINT' if id.startswith('GUIDE_') else 'K_ALONE' if id.startswith('K_') else 'W_OFFER' if id.startswith('W_') else 'HOST_OFFER' if id.startswith('HOST_') else id
   base=by.get(family,r);bb=base['opaque_bbox_128'];scale=h*1080*.9/(bb[3]-bb[1])*(base['width']/r['width']);iw=r['width']*scale;ih=r['height']*scale
   xx=x*1920-r.get('foot_center_x',(l+rr)/2)*scale;floor=(y+h*.43)*1080;yy=floor-b*scale
   layers.append(f'<image href="{data(r["file"],"image/png")}" x="{xx}" y="{yy}" width="{iw}" height="{ih}"/>')
   geometry.append({'state':state['id'],'asset':id,'x_px':xx,'y_px':yy,'width_px':iw,'height_px':ih,'floor_px':floor,'method':'family-fixed uniform scale, measured feet-center and floor; arm extension does not recenter body; source pixels unchanged'})
  # frame_crop is the sole scene crop; no automatic camera pan or additional inherited crop.
  crop=state['frame_crop']
  # Located post-generation staging repair: medium two-shots and reaction closeups.
  if shot['id'] in ['S001','S024','S030','S031','S035','S036'] or state['id']=='S037-B01':crop=[.20,.13,.72,.72]
  if shot['id'] in ['S003','S006','S027','S032'] or state['id']=='S025-B02':crop=[.30,.13,.52,.52]
  cx,cy,cw,ch=crop;vb=f'{cx*1920} {cy*1080} {cw*1920} {ch*1080}'
  svg='<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="#eee4d1"/>'+f'<svg width="1920" height="1080" viewBox="{vb}">'+''.join(layers)+'</svg>'+''.join(screens)+'</svg>'
  path=dest/f'{state["id"]}.svg';path.write_text(svg,encoding='utf-8')
  review.append({'asset_id':'COMPOSITE','state':state['id'],'file':str(path),'cue':state['cue'],'visible_assets':state['visible_assets'],'script':shot['narration'],'meaning':state['visible_meaning'],'actual_preview_crop':crop,'planned_crop':state['frame_crop'],'native_layout':'full-canvas SVG; labels in screen space; do not apply proposed asset box again'})
(OUT/'RASTER_TECHNICAL.json').write_text(json.dumps(technical,indent=2),encoding='utf-8')
(OUT/'COMPOSITE_MANIFEST.json').write_text(json.dumps(review,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'REGISTRATION.json').write_text(json.dumps(geometry,indent=2),encoding='utf-8')
(OUT/'COVERAGE_CHECK.json').write_text(json.dumps({'states':len(review),'required_rasters':32,'generated_rasters':len(paths),'native_families':13,'native_states':len(native),'reuse':1,'missing':missing,'motion_audio_checked':False},indent=2),encoding='utf-8')
print('Prepared',len(review),'composites; missing assets',len({r['asset'] for r in missing}))
