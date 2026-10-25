from pathlib import Path
from PIL import Image,ImageFont,ImageDraw
import json,copy,shutil,math
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v03';OUT.mkdir(parents=True,exist_ok=True)
PUB=ROOT/'public/medieval/video005-draft-v03';PUB.mkdir(parents=True,exist_ok=True)
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8')
base=read(ROOT/'examples/medieval/video005-draft-v02.props.json')['episode'];original=read(ROOT/'examples/medieval/video005-draft-v01.props.json')['episode'];e=copy.deepcopy(base)
e.update(id='VIDEO005-DRAFT-V03',version='draft-v03',planVersion='V12 + V03 full-frame overlay repair')
old={s['id']:s for s in original['shots']};assets={a['id']:a for a in original['assets']+base['assets']};changes=[];checks=[]
fontfile=ROOT/'public/fonts/PatrickHand-Regular.ttf'
def image_layer(id,aid,x,y,w,h,z=0,space='world'):return dict(id=id,kind='image',assetId=aid,x=x,y=y,width=w,height=h,z=z,color='#FFF7E8',fromFrame=0,enter='none',enterFrames=1,scale=1,rotate=0,space=space)
def overlay(sid,value,position='bottom',size=72):
 f=ImageFont.truetype(str(fontfile),size);d=ImageDraw.Draw(Image.new('RGB',(1,1)));lines=[];line=''
 for word in value.split():
  candidate=(line+' '+word).strip()
  if d.textlength(candidate,font=f)>1710:lines.append(line);line=word
  else:line=candidate
 if line:lines.append(line)
 assert len(lines)<=2,(sid,lines)
 h=round(size*1.18*len(lines));y0=108 if position=='top' else 938-h
 bbox=[96,y0,1728,h];assert y0>=72 and y0+h<=940
 # A feathered local dark scrim keeps the actual illustration visible. No paper footer.
 canvas=Image.new('RGBA',(1920,1080));px=canvas.load();top=max(0,y0-46);bottom=min(1080,y0+h+46)
 right=min(1872,math.ceil(96+max(d.textlength(v,font=f) for v in lines)+72))
 for y in range(top,bottom):
  vy=min(1,(y-top)/42,(bottom-1-y)/42)
  for x in range(48,right):
   hx=min(1,(x-48)/48,(right-1-x)/72);px[x,y]=(10,15,20,round(112*max(0,vy)*max(0,hx)))
 file='scrim-'+sid+'.png';canvas.save(PUB/file);aid='SCRIM_'+sid
 assets[aid]=dict(id=aid,file='medieval/video005-draft-v03/'+file,version='v03',status='draft',rights='recorded',role='Native feathered translucent text support, not a replacement background')
 label=dict(id=sid+'-OVERLAY',kind='text',text='\n'.join(lines),x=960,y=y0+h/2,width=1728,height=h,z=102,color='#FFF7E8',fromFrame=0,enter='none',enterFrames=1,scale=1,rotate=0,space='screen',fontSize=size,lineHeight=1.18,align='left',padding=0,textRole='keyLabel')
 checks.append(dict(state=sid,text=value,lines=lines,box=bbox,font_size=size,position=position,max_line_px=max(d.textlength(v,font=f) for v in lines)))
 return [image_layer(sid+'-SCRIM',aid,960,540,1920,1080,101,'screen'),label]
note_ids={r['state'] for r in read(ROOT/'out/medieval/video005-draft-v02/CHANGE_REGISTER_V02.json') if 'after' in r}
for s in e['shots']:
 sid=s['id']
 if sid in note_ids or sid=='V12-S083-T01':
  value=next(l['text'] for l in s['layers'] if l['kind']=='text')
  art=[copy.deepcopy(l) for l in old[sid]['layers'] if l['kind']!='text']
  if sid=='V12-S073-T02':
   removed={r['id'] for r in read(ROOT/'out/medieval/video005-draft-v01/LAYER_LINEAGE_V01.json') if r['source_asset']=='D_TOOLS'};art=[l for l in art if l.get('assetId') not in removed]
  position='top' if sid in ['V12-S071-T01','V12-S083-T01'] else 'bottom'
  s['layers']=art+overlay(sid,value,position,88 if sid=='V12-S083-T01' else 72);s['background']=old[sid]['background']
  changes.append(dict(state=sid,second=s['fromFrame']/30,repair='Restore original full-screen art; ivory filled type, dark outline/shadow and feathered translucent support',position=position))
 elif sid.startswith(('V12-S008-','V12-S078-')):
  value=next(l['text'] for l in s['layers'] if l['kind']=='text');art=next(l for l in s['layers'] if l['kind']=='image');a=assets[art['assetId']];iw,ih=Image.open(ROOT/'public'/a['file']).size;k=max(1920/iw,1080/ih)
  s['layers']=[image_layer(sid+'-FULL',a['id'],960,540,iw*k,ih*k)]+overlay(sid,value,'top',82)
  changes.append(dict(state=sid,second=s['fromFrame']/30,repair='Single subject covers the entire viewport; heading overlays the empty upper area',position='top'))
used={l['assetId'] for s in e['shots'] for l in s['layers'] if l['kind']=='image'};e['assets']=[a for id,a in assets.items() if id in used]
assert e['audio']==base['audio'];assert [s['fromFrame'] for s in e['shots']]==[s['fromFrame'] for s in base['shots']]
save(ROOT/'examples/medieval/video005-draft-v03.props.json',dict(episode=e));save(OUT/'CHANGE_REGISTER_V03.json',changes);save(OUT/'TEXT_OVERLAY_CHECKS_V03.json',checks)
shutil.copy2(ROOT/'out/medieval/video005-draft-v02/TIMELINE_V02.json',OUT/'TIMELINE_V03.json')
save(OUT/'BUILD_REPORT_V03.json',dict(revised_states=len(changes),full_screen_scene_states=len(changes),retained_comparison_and_diagram_layouts=True,audio_manifest_unchanged=True,duration_frames=e['durationInFrames'],style='Patrick Hand; ivory fill #FFF7E8; dark 5px stroke painted behind fill; soft shadow; local feathered scrim max alpha 112/255'))
mini=OUT/'public';mini.mkdir(exist_ok=True)
for rel in {a['file'] for a in e['assets']}|{a['file'] for a in e['audio']}:
 p=mini/rel;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/'public'/rel,p)
if not (mini/'fonts').exists():shutil.copytree(ROOT/'public/fonts',mini/'fonts')
print(json.dumps(dict(revised_states=len(changes),audio_unchanged=True)))
