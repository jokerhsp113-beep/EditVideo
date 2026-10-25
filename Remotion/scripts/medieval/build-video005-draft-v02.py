from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,copy,shutil,hashlib,html,subprocess,math
import numpy as np
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'out/medieval/video005-draft-v01';OUT=ROOT/'out/medieval/video005-draft-v02';OUT.mkdir(parents=True,exist_ok=True)
PUB=ROOT/'public/medieval/video005-draft-v02';PUB.mkdir(parents=True,exist_ok=True)
SRC=Path(r'D:\Youtube\Medieval Life Explained\videos\Video005\production\assets-reaudit-v12-20261020')
FONT=ROOT/'public/fonts/PatrickHand-Regular.ttf';INK='#30291F';PAPER='#F4EDE1';W,H=1920,1080
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8')
e=copy.deepcopy(read(ROOT/'examples/medieval/video005-draft-v01.props.json')['episode']);old=copy.deepcopy(e);e.update(id='VIDEO005-DRAFT-V02',version='draft-v02',planVersion='V12 + V02 production repair')
by={a['id']:a for a in read(SRC/'ASSET_MANIFEST_V12.json')['assets']};plan=read(SRC/'STORYBOARD_V12.json');states={t['id']:t for s in plan['shots'] for t in s['states']}
shots={s['id']:s for s in e['shots']};assets={a['id']:a for a in e['assets']};changes=[];checks=[];placements=[]
def layer(id,kind,x,y,w,h,z=0,**kw):return dict(id=id,kind=kind,x=x,y=y,width=w,height=h,z=z,color=INK,fromFrame=0,enter='none',enterFrames=1,scale=1,rotate=0,**kw)
def text(id,value,x,y,w,h,size=68,z=20,align='left'):
 f=ImageFont.truetype(str(FONT),size);d=ImageDraw.Draw(Image.new('RGB',(1,1)))
 widths=[d.textlength(line,font=f) for line in value.split('\n')];assert max(widths)<=w-8,(id,value,max(widths),w)
 checks.append(dict(id=id,text=value,font_size=size,box=[x-w/2,y-h/2,w,h],max_line_px=max(widths),fits=True))
 return layer(id,'text',x,y,w,h,z,text=value,fontSize=size,lineHeight=1.12,align=align,padding=0,space='screen',textRole='keyLabel')
def register(id,file,role):
 assets[id]=dict(id=id,file=file,version='v02',status='draft',rights='unresolved',role=role);return id
def source(id):
 aid='SRC_'+id
 if aid not in assets:
  src=Path(by[id]['actual_path']);name='source-'+id+src.suffix;shutil.copy2(src,PUB/name);register(aid,'medieval/video005-draft-v02/'+name,'Original source art '+id)
 return aid
def picture(id,asset,box,z=0):
 x,y,w,h=box;path=ROOT/'public'/assets[asset]['file'];iw,ih=Image.open(path).size;sc=min(w/iw,h/ih);ww=iw*sc;hh=ih*sc
 placements.append(dict(id=id,box=[x+(w-ww)/2,y+(h-hh)/2,ww,hh],role='art'))
 return layer(id,'image',x+w/2,y+h/2,ww,hh,z,assetId=asset)
def replace(sid,layers,reason):
 shot=shots[sid];shot['layers']=layers;shot['background']=PAPER;shot.pop('camera',None);changes.append(dict(state=sid,second=shot['fromFrame']/30,change=reason))
def change_key(id):return 'V12-'+id
# All source qualifiers remain in narration. On-screen notes become short, readable phrases.
notes={
'S006-T01':'English examples from the late 1200s to the 1400s',
'S012-T01':'Falcon-decorated hangings recorded in 1463',
'S020-T01':'Not every household owned an elaborate bed',
'S027-T01':'An illustration, not a measured reconstruction',
'S037-T01':'A visit recalled in testimony from 1494',
'S039-T01':'The testimony does not explain how the room was kept apart',
'S044-T01':'An elite service manual from the 1400s',
'S057-T01':"A friend's testimony, London, 1488",
'S057-T02':'An illustration of what the friend reported',
'S058-T02':'Later testimony, not a courtroom scene',
'S061-T01':'The testimony does not show Alice arranged a listener',
'S062-T01':'A concern reported by Richard, not a sighting',
'S063-T01':"Richard's account, not independent confirmation",
'S065-T01':'Her concern, as Richard reported it',
'S068-T01':'A complaint recorded in London in 1341',
'S071-T01':'An illustration of the 1341 complaint',
'S072-T01':'A promise to remove it within 40 days',
'S073-T02':'Removal was promised, not confirmed',
'S074-T01':'An illustration, not a recorded meeting'}
for id,value in notes.items():
 sid=change_key(id);shot=shots[sid];art=[copy.deepcopy(l) for l in shot['layers'] if l['kind']!='text']
 if id=='S073-T02':
  # The tool chart added no explanation. Keep the standing tower and C's reaction.
  ids={line['id'] for line in read(BASE/'LAYER_LINEAGE_V01.json') if line['source_asset']=='D_TOOLS'}
  art=[l for l in art if l.get('assetId') not in ids]
 for l in art:l.update(x=960+(l['x']-960)*.78,y=l['y']*.78,width=l['width']*.78,height=l['height']*.78)
 art.append(text(sid+'-NOTE',value,960,894,1728,88,64))
 replace(sid,art,'Short qualifier in a reserved paper footer; original art uniformly fitted above; solid ink type, no outline')
 changes[-1].update(before=states[sid].get('overlay_text'),after=value)
# Later is a time jump, not a source qualifier: give it an independent header.
sid=change_key('S083-T01');art=[copy.deepcopy(l) for l in shots[sid]['layers'] if l['kind']!='text']
for l in art:l.update(x=960+(l['x']-960)*.80,y=188+l['y']*.80,width=l['width']*.80,height=l['height']*.80)
replace(sid,art+[text(sid+'-LATER','Later',400,124,608,104,88)],'Time-jump label moved above picture, away from hands/player controls')
# Eliminate competing thumbnails for See/Hear/Join; each cue has one clear subject.
for shotnum in ['008','078']:
 for ti,heading in enumerate(['Out of sight','Still within earshot','Choosing company'],1):
  sid=change_key(f'S{shotnum}-T{ti:02}');st=states[sid];focus=next(l for l in st['layers'] if l.get('emphasis'))
  layers=[text(sid+'-HEAD',heading,960,127,1728,110,82),picture(sid+'-ART',source(focus['asset']),[80,200,1760,840])]
  replace(sid,layers,'One scene and one semantic heading on each spoken cue; no competing small panels')
# Existing two-way contrasts are valid ideas, but need common geometry and concise headings.
comparisons={
'S021-T01':('Who gets to use the room?',['SOLAR_HALL_CONTINUES','SOLAR_ACCESS_THRESHOLD'],['Shared hall','Upstairs retreat']),
'S034-T01':('Privacy through cooperation',None,['Time together','Invite the household']),
'S052-T01':('Which company do you want?',None,['Nobody inside','One trusted helper']),
'S064-T01':('Whose account survives?',None,["The men's accounts","Not Alice's own account"]),
'S066-T01':('Two different needs',None,['Time together','Leaving unnoticed']),
'S075-T01':('Who could help?',None,['Seeking support','A possible remedy']),
'S077-T01':('Space was only part of it',None,['Access to a room','Support from others'])}
for id,(heading,ids,labels) in comparisons.items():
 sid=change_key(id);ids=ids or [l['asset'] for l in states[sid]['layers']]
 layers=[text(sid+'-HEAD',heading,960,128,1728,112,80)]
 for i,(aid,label) in enumerate(zip(ids,labels)):
  x=96+i*904;layers.append(text(sid+f'-LABEL{i}',label,x+412,250,824,90,64))
  layers.append(picture(sid+f'-ART{i}',source(aid),[x,315,824,530]))
 if id=='S075-T01':layers.append(text(sid+'-CAUTION','Support was not guaranteed',960,894,1728,88,64))
 replace(sid,layers,'Two equal, readable pictures; labels and source art occupy separate regions; no decorative frame or connector')
# Four mechanisms: plain labels with enough space, not long claims pasted onto pictures.
sid=change_key('S076-T01');layers=[text(sid+'-HEAD','Four ways to make a boundary',960,124,1728,100,80)]
for i,(aid,label) in enumerate(zip([l['asset'] for l in states[sid]['layers']],['Screen','Withdraw','Choose company','Challenge intrusion'])):
 x=96+(i%2)*904;y=236+(i//2)*400
 layers.append(text(sid+f'-LABEL{i}',label,x+412,y,824,80,64))
 layers.append(picture(sid+f'-ART{i}',source(aid),[x,y+56,824,296]))
replace(sid,layers,'Four short mechanism labels with separate image cells and no text over illustration')
# A deliberately simple house section, not the old disconnected rectangles or a measured plan.
class Drawing:
 def __init__(self):self.im=Image.new('RGBA',(W,H),PAPER);self.d=ImageDraw.Draw(self.im);self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
 def line(self,points,color=INK,width=8):
  self.d.line(points,fill=color,width=width,joint='curve');self.svg.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in points)+f'" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>')
 def rect(self,box,fill,outline=INK,width=7):
  self.d.rectangle(box,fill=fill,outline=outline,width=width);x,y,xx,yy=box;self.svg.append(f'<rect x="{x}" y="{y}" width="{xx-x}" height="{yy-y}" fill="{fill}" stroke="{outline}" stroke-width="{width}"/>')
 def polygon(self,pts,fill):
  self.d.polygon(pts,fill=fill);self.svg.append('<polygon points="'+' '.join(f'{x},{y}' for x,y in pts)+f'" fill="{fill}"/>')
 def out(self,name):
  self.im.save(PUB/(name+'.png'));(PUB/(name+'.svg')).write_text(''.join(self.svg)+'</svg>',encoding='utf8');return register(name,'medieval/video005-draft-v02/'+name+'.png','Editable simplified architectural diagram; SVG source supplied')
for id,phase in [('S022-T01','rooms'),('S022-T02','withdraw'),('S023-T01','stairs')]:
 sid=change_key(id);d=Drawing()
 # Hall lower down; solar above. Solid outer walls and roof give the boxes a spatial job.
 d.polygon([(620,300),(1110,205),(1640,300)],'#C39B70');d.line([(620,300),(1110,205),(1640,300)])
 d.rect((620,300,1640,850),'#D8C5A7');d.rect((645,325,1615,550),'#C9D8DA' if phase!='rooms' else '#E6D9BD')
 d.rect((645,580,1615,825),'#E6D9BD');d.line([(620,565),(1640,565)],INK,13)
 if phase in ['withdraw','stairs']:
  # Openings and a route connect the actual two levels; no unrelated floating icon.
  d.rect((615,404,653,480),'#C9D8DA','#C9D8DA',1)
  d.rect((615,702,653,778),'#E6D9BD','#E6D9BD',1)
  d.line([(705,740),(480,740)],'#A45D3B',12)
  d.line([(480,440),(700,440)],'#A45D3B',12)
  d.polygon([(710,440),(675,418),(675,462)],'#A45D3B')
  if phase=='withdraw':d.line([(480,740),(480,440)],'#A45D3B',12)
 if phase=='stairs':
  # Stylized spiral steps are the connector, not a second disconnected diagram.
  d.line([(480,765),(480,420)],'#79694F',9)
  for y in range(450,740,48):d.line([(425,y),(535,y+19),(435,y+39)],'#79694F',7)
  d.line([(350,730),(350,465)],'#A45D3B',10);d.polygon([(350,445),(330,478),(370,478)],'#A45D3B')
 aid=d.out('SOLAR_DIAGRAM_'+phase.upper())
 layers=[picture(sid+'-DRAW',aid,[0,0,W,H]),text(sid+'-HEAD','Old Soar, around 1290',960,124,1728,104,82),text(sid+'-SOLAR','Solar',1100,421,550,100,82,align='center'),text(sid+'-HALL','Shared hall',1110,696,700,100,82,align='center'),text(sid+'-SCOPE','Conceptual section',960,894,1728,88,62)]
 if phase=='withdraw':layers.append(text(sid+'-ROUTE','Withdrawal',276,340,360,84,58))
 if phase=='stairs':layers.append(text(sid+'-STAIR','Spiral stair',291,340,390,84,60))
 replace(sid,layers,'Redrawn as a simplified two-level house; route/stair in left gutter never crosses room labels; not a measured reconstruction')
# Keep only assets actually used in this version, and preserve original sources outside it.
used={l['assetId'] for s in e['shots'] for l in s['layers'] if l['kind']=='image'};e['assets']=[a for id,a in assets.items() if id in used]
# New soundtrack. Metadata and license evidence are separate from unperformed listening approval.
media=read(ROOT/'out/medieval/video005-audit-v02/MEDIA_SOURCES_V02.json');media_by={str(r.get('id',r['title'])):r for r in media}
cue_register=[];audio=[copy.deepcopy(old['audio'][0])]
def add(id,title,role,start,duration,volume,trim=0,fade=.06,filter=None,reason=''):
 r=media_by[str(title)];sourcefile=Path(r['file']);rel=sourcefile.relative_to(ROOT/'public').as_posix()
 # Derive filtered ambience as a distinct file; raw recordings remain available for review.
 if filter:
  file=PUB/'audio'/f'{id.lower()}-filtered.wav';ff=r'C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe'
  subprocess.run([ff,'-v','error','-y','-i',str(sourcefile),'-af',filter,'-c:a','pcm_s16le',str(file)],check=True);rel=file.relative_to(ROOT/'public').as_posix()
 a=dict(id=id,file=rel,role=role,fromFrame=round(start*30),durationFrames=round(duration*30),trimBeforeFrames=round(trim*30),volume=volume,fadeFrames=round(fade*30),loop=False,rights='recorded')
 assert a['fromFrame']+a['durationFrames']<=e['durationInFrames'];assert a['fadeFrames']*2<=a['durationFrames']
 audio.append(a);cue_register.append(dict(**a,title=r['title'],source_page=r['source_page'],reason=reason,review_status='Source and cue checked; direct listening pending'))
def time(id):return shots[change_key(id)]['fromFrame']/30
add('PIANO_OPEN','There is Romance','music',0,140/30,.20,trim=0,fade=0,reason='Romantic expectation; hard cut at latch with 5ms source edge taper to prevent click')
# Apply a tiny sample fade only at the hard cut, without a slow editorial fade.
ff=r'C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe';cut=PUB/'audio/piano-opening-cut.wav'
subprocess.run([ff,'-v','error','-y','-i',str(PUB/'audio/There is Romance.mp3'),'-t',str(140/30),'-af',f'afade=t=in:st=0:d=0.005,afade=t=out:st={140/30-.005}:d=0.005','-c:a','pcm_s16le',str(cut)],check=True);audio[-1]['file']='medieval/video005-draft-v02/audio/piano-opening-cut.wav';cue_register[-1]['file']=audio[-1]['file']
for id,start,end,trim in [('BED_INTRO',14.2,30.6,0),('BED_CURTAIN',33,73.9,17),('BED_SOLAR',78.4,121.8,60),('BED_COOPERATION',127.3,157.5,105),('BED_BATH',163.4,198.0,140),('BED_RECAP',325.77,343.5,20)]:
 add(id,'Village Consort','music',start,end-start,.065,trim=trim,fade=.7,reason='Low non-diegetic period-flavoured bed for explanatory scenes; not a historically authenticated performance')
add('C_BATH_ASIDE','Thinking Music','music',198,8.1,.065,trim=19,fade=.25,reason="C's independence aside, not a musical judgment of historical people")
add('C_TOOLS_WISH','Thinking Music','music',308.9,4.7,.06,trim=40,fade=.2,reason="Brief C reaction only; not under the woman's complaint")
add('PIANO_CALLBACK','There is Romance','music',344.2,e['durationInFrames']/30-344.2,.15,trim=12,fade=.55,reason='Opening melody returns after negotiated privacy and family invitation')
add('LATCH_RELEASE',187,'sfx',140/30,.34,.25,trim=0,fade=.03,reason='Visible hand releases latch; generic metal mechanism, not a claim of authentic period recording')
add('WOODEN_DOOR_OPEN',195,'sfx',4.85,.65,.28,trim=.12,fade=.06,reason='Wooden door reveals the interruption, ending before father narration')
add('FLOOR_APPROACH',337,'sfx',4.30,.31,.14,trim=.10,fade=.03,reason='A small off-screen floor creak precedes the interruption; no invented walking cycle')
add('COUPLE_RECOIL_CLOTH',1898,'sfx',5.05,.40,.12,trim=.20,fade=.03,reason='Soft clothing rustle with the couple recoil pose, not a second duplicated floor creak')
add('CURTAIN_RUSTLE',1898,'sfx',time('S014-T01'),.7,.19,trim=0,fade=.05,reason='Cloth texture on curtain grip/closed-state cut')
for id,start,dur,trim in [('MURMUR_OUTSIDE_CURTAIN',time('S011-T01'),8,4),('MURMUR_HALL',time('S024-T01'),4.1,18),('MURMUR_INVITATION',time('S036-T02'),3.4,8),('MURMUR_FAMILY_END',time('S084-T01'),2.2,12)]:
 add(id,2981,'ambience',start,dur,.065,trim=trim,fade=.25,filter='highpass=f=170,lowpass=f=1350',reason='Quiet indistinct indoor voices where a household group is visible; no invented quoted dialogue')
add('ROSEWATER_POUR',2826,'sfx',time('S047-T02'),1.6,.15,trim=.45,fade=.12,filter='lowpass=f=4200',reason='Candidate short pouring excerpt; listen to check for unwanted glass-contact sounds. No glass is implied in the illustration.')
add('FATHER_LIGHT_CHUCKLE',411,'sfx',358.42,.58,.08,trim=.10,fade=.07,reason='Optional quiet in-scene chuckle on the smiling father/bread payoff; no crowd laugh track')
# Different libraries have radically different recording levels. Prepare the selected
# excerpt, then expose an ordinary editable gain; do not reuse a blind gain for all files.
level_rows=[];sr=44100
for a in audio[1:]:
 p=ROOT/'public'/a['file'];data=np.frombuffer(subprocess.check_output([ff,'-v','error','-i',str(p),'-f','f32le','-ar',str(sr),'-ac','2','pipe:1']),dtype='<f4').reshape(-1,2).copy()
 lo=round(a['trimBeforeFrames']/30*sr);count=round(a['durationFrames']/30*sr);clip=data[lo:lo+count];assert len(clip)>=count-sr/30,(a['id'],'source excerpt too short')
 if len(clip)<count:clip=np.pad(clip,((0,count-len(clip)),(0,0)))
 rms=math.sqrt(float(np.mean(clip.astype(float)**2)));peak=float(np.max(abs(clip)));assert rms>1e-6,(a['id'],'selected source is effectively silent')
 target=-36 if a['role']=='music' else -40 if a['role']=='ambience' else -32
 target={'PIANO_OPEN':-32,'PIANO_CALLBACK':-34,'LATCH_RELEASE':-27,'WOODEN_DOOR_OPEN':-27,'FLOOR_APPROACH':-33,'COUPLE_RECOIL_CLOTH':-32,'CURTAIN_RUSTLE':-31,'ROSEWATER_POUR':-32,'FATHER_LIGHT_CHUCKLE':-34}.get(a['id'],target)
 factor=min(.1/rms,.70/peak);prepared=clip*factor;prepared_rms=rms*factor;volume=10**(target/20)/prepared_rms;assert 0<volume<=1,(a['id'],volume)
 file=PUB/'audio'/f"{a['id'].lower()}-prepared.wav"
 subprocess.run([ff,'-v','error','-y','-f','f32le','-ar',str(sr),'-ac','2','-i','pipe:0','-c:a','pcm_s24le',str(file)],input=prepared.astype('<f4').tobytes(),check=True)
 level_rows.append(dict(id=a['id'],source=str(p),source_trim_frames=a['trimBeforeFrames'],source_rms_dbfs=20*math.log10(rms),preparation_gain=factor,mix_target_rms_dbfs=target,prepared_file=str(file),editable_volume=volume))
 a.update(file=file.relative_to(ROOT/'public').as_posix(),trimBeforeFrames=0,volume=volume)
 cue=next(c for c in cue_register if c['id']==a['id']);cue.update(file=a['file'],trimBeforeFrames=0,volume=volume)
save(OUT/'SOUND_LEVEL_PREP_V02.json',level_rows)
e['audio']=audio
save(ROOT/'examples/medieval/video005-draft-v02.props.json',dict(episode=e));save(OUT/'CHANGE_REGISTER_V02.json',changes);save(OUT/'TEXT_LAYOUT_CHECKS_V02.json',checks);save(OUT/'ART_PLACEMENTS_V02.json',placements);save(OUT/'SOUND_CUES_V02.json',cue_register)
save(OUT/'BUILD_REPORT_V02.json',dict(version='V02',unchanged_duration_frames=e['durationInFrames'],states=len(e['shots']),changed_states=len(changes),on_screen_source_notes=len(notes),source_script_sha256=hashlib.sha256(Path(r'D:\Youtube\Medieval Life Explained\videos\Video005\SCRIPT_EN_V09.md').read_bytes()).hexdigest(),voice_file_unchanged=audio[0]==old['audio'][0],new_music_sources=5,new_sfx_sources=7,applied_music=['There is Romance','Village Consort','Thinking Music'],direct_listening=False,scope='Native layout/text/sound revision; no new AI art and no narration rewrite'))
# Reusable isolated public root contains exactly referenced media plus fonts.
mini=OUT/'public';mini.mkdir(exist_ok=True)
for rel in {a['file'] for a in e['assets']}|{a['file'] for a in e['audio']}:
 dest=mini/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/'public'/rel,dest)
if not (mini/'fonts').exists():shutil.copytree(ROOT/'public/fonts',mini/'fonts')
print(json.dumps(dict(props='examples/medieval/video005-draft-v02.props.json',changed_states=len(changes),text_checks=len(checks),audio_clips=len(audio))))
