from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import json, re, difflib, ast, hashlib, shutil, subprocess, math
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
EP=Path(r'D:\Youtube\Medieval Life Explained\videos\Video005')
SRC=EP/'production/assets-reaudit-v12-20261020'
OUT=ROOT/'out/medieval/video005-draft-v01'; OUT.mkdir(parents=True,exist_ok=True)
PUB=ROOT/'public/medieval/video005-draft-v01'; PUB.mkdir(parents=True,exist_ok=True)
FF=Path(r'C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe')
W,H,FPS=1920,1080,30
FONT=SRC/'fonts/PatrickHand-Regular.ttf'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2),encoding='utf8')
S=read(SRC/'STORYBOARD_V12.json'); M=read(SRC/'ASSET_MANIFEST_V12.json'); by={a['id']:a for a in M['assets']}
master=read(EP/'audio-prep/voice_anchor_map_v02.json')['paragraphs']
raw=read(EP/'audio/audit-v01-20261020/ASR_RAW_V01.json')
audio=EP/'audio/Audio001.mp3'; original_hash=hashlib.sha256(audio.read_bytes()).hexdigest()
assert original_hash=='0fd3aeafc92b09014f48b2284c69f1fe422530cdec6bbff80653a2748550432b'
replacements=[('fourteen sixty-three','1463'),('twelve ninety','1290'),('fourteen ninety-four','1494'),('fourteen eighty-eight','1488'),('thirteen forty-one','1341'),('fifteenth-century','15th century'),('forty days','40 days'),('goodnight','good night')]
def norm(t):
 t=t.lower().replace('’',"'")
 for a,b in replacements:t=t.replace(a,b)
 return re.findall(r"[a-z0-9]+(?:'[a-z]+)?",t)
ref=[]; paras={}
for p in master:
 paras[p['id']]={**p,'offset':len(ref)};ref+=norm(p['text'])
asr=[]
for w in raw['words']:
 for t in norm(w['word']):asr.append({**w,'token':t})
i=0
while i<len(asr)-1:
 if asr[i]['token']=='iron' and asr[i+1]['token']=='monger':asr[i:i+2]=[dict(asr[i],token='ironmonger',end=asr[i+1]['end'])]
 i+=1
mapping={};uncertain=[]
for tag,a,b,c,d in difflib.SequenceMatcher(a=ref,b=[w['token'] for w in asr],autojunk=False).get_opcodes():
 if tag=='equal':
  for j,k in zip(range(a,b),range(c,d)):mapping[j]=asr[k]['start']
 else:
  uncertain.append(dict(expected=' '.join(ref[a:b]),recognized=' '.join(w['token'] for w in asr[c:d]),source_s=asr[min(c,len(asr)-1)]['start']))
  for j in range(a,b):mapping[j]=asr[min(c,len(asr)-1)]['start']
# Decode once. Insert quiet gaps without changing speech order or speed (derived PCM16).
pcm=np.frombuffer(subprocess.check_output([str(FF),'-v','error','-i',str(audio),'-f','f32le','-ac','1','-ar','44100','pipe:1']),dtype='<f4').copy();sr=44100
cut2=min(np.arange(349.49,349.88,.01),key=lambda t:float(np.mean(pcm[int((t-.015)*sr):int((t+.015)*sr)]**2)))
inserts=[(4.10,1.25),(float(cut2),1.10)]
def shifted(t):return t+sum(d for c,d in inserts if t>=c)
parts=[];cursor=0
for c,d in inserts:
 k=round(c*sr);parts.extend([pcm[cursor:k],np.zeros(round(d*sr),dtype=np.float32)]);cursor=k
parts.extend([pcm[cursor:],np.zeros(round(.8*sr),dtype=np.float32)])
voice=np.concatenate(parts); totalframes=math.ceil(len(voice)/sr*FPS)
def wav(path,data):
 subprocess.run([str(FF),'-v','error','-y','-f','f32le','-ar',str(sr),'-ac','1','-i','pipe:0','-c:a','pcm_s16le',str(path)],input=np.asarray(data,dtype='<f4').tobytes(),check=True)
wav(PUB/'narration-with-pauses.wav',voice)
# Original draft soft keyboard: procedural additive synthesis, not recorded piano.
t=np.arange(round(4.65*sr))/sr; music=np.zeros_like(t)
for onset,freq in [(0,261.626),(.23,329.628),(.46,391.995),(.69,493.883)]:
 q=np.maximum(0,t-onset);env=(1-np.exp(-q*80))*np.exp(-q*.64)*(t>=onset)
 for n,g in [(1,1),(2,.30),(3,.12),(4,.06)]:music+=g*np.sin(2*np.pi*freq*n*q)*env*np.exp(-q*(n-1)*.25)
music=music/max(abs(music))*.45; music[-220:]*=np.linspace(1,0,220)
wav(PUB/'opening-soft-keyboard-original.wav',music)
shutil.copy2(ROOT/'public/music/bed.mp3',PUB/'existing-bed.mp3')
for name in ['wood','brush','ceramic']:shutil.copy2(ROOT/f'public/medieval/video003/current/audio/{name}.wav',PUB/f'{name}.wav')
# Reuse inspected V11 placement primitive only; no legacy build/export execution.
def img(id):return Image.open(by[id]['actual_path']).convert('RGBA')
tree=ast.parse((EP/'production/assets-audit-v11-20261019/build_v11.py').read_text(encoding='utf8'))
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='place'],type_ignores=[]),'<inspected placement>','exec'),globals())
assets=[];cache={};lineage=[]
def register(id,file,role):
 assets.append(dict(id=id,file='medieval/video005-draft-v01/'+file,version='v01',status='draft',rights='unresolved',role=role));return id
def layerbase(id,x,y,w,h,z):return dict(id=id,x=x,y=y,width=w,height=h,z=z,color='#111820',fromFrame=0,enter='none',enterFrames=1,scale=1,rotate=0)
def cue_time(s,t):
 p=paras[s['paragraph']];tr=t['trigger'];off=tr.get('character_offset',s.get('start') or 0)
 # Character offsets are canonical paragraph offsets, avoiding repeated phrase ambiguity.
 j=p['offset']+len(norm(p['text'][:off]));return shifted(mapping[j])
timeline=[];shots=[]
for s in S['shots']:
 num=int(s['id'][-3:])
 for ti,state in enumerate(s['states']):
  if num==1:sec=0
  elif num==2:sec=3.70
  elif num==3:sec=[4.65,5.03][ti]
  elif num==82:sec=shifted(349.44)
  else:sec=cue_time(s,state)
  frame=round(sec*FPS)
  if timeline:assert frame>timeline[-1]['frame'],(s['id'],state['id'],sec,timeline[-1])
  layers=[]
  for zi,l in enumerate(state['layers']):
   sig=json.dumps(l,sort_keys=True);key=hashlib.sha256(sig.encode()).hexdigest()[:16]
   if key not in cache:
    canvas=Image.new('RGBA',(W,H));place(canvas,l);bb=canvas.getbbox();assert bb
    name=f'layer-{key}.png';canvas.crop(bb).save(PUB/name)
    aid=register('L_'+key,name,'mechanical registered layer; source '+l['asset']);cache[key]=(aid,bb)
    lineage.append(dict(id=aid,source_asset=l['asset'],source_path=by[l['asset']]['actual_path'],placement=l,derived_file=str(PUB/name),bbox=bb))
   aid,bb=cache[key];x0,y0,x1,y1=bb
   layers.append(dict(layerbase(state['id']+f'-L{zi:02}',(x0+x1)/2,(y0+y1)/2,x1-x0,y1-y0,zi),kind='image',assetId=aid))
  text=state.get('overlay_text')
  if text:
   f=ImageFont.truetype(str(FONT),64);d=ImageDraw.Draw(Image.new('RGB',(1,1)));lines=[];line=''
   for word in text.split():
    candidate=(line+' '+word).strip()
    if d.textlength(candidate,font=f)>1760:lines.append(line);line=word
    else:line=candidate
   if line:lines.append(line)
   ht=len(lines)*76
   layers.append(dict(layerbase(state['id']+'-CAPTION',960,H-34-ht/2,1790,ht,100),kind='text',text='\n'.join(lines),space='screen',fontSize=64,lineHeight=1.1875,align='left',padding=0,textRole='scopeNote'))
  shot=dict(id=state['id'],fromFrame=frame,background=state.get('canvas_background','#f5efe4'),layers=layers,note=s['id']+' / '+s['paragraph']+' / '+state['meaning'])
  cx,cy,cw,ch=s['frame_crop']
  if [cx,cy,cw,ch]!=[0,0,1,1]:
   scale=max(1/cw,1/ch)
   shot['camera']=dict(reason='V12 frame_crop applied once to world, before screen caption',pivotX=.5,pivotY=.5,keyframes=[dict(frame=0,scale=scale,x=scale*(.5-cx-cw/2)*W,y=scale*(.5-cy-ch/2)*H,easing='hold')])
  shots.append(shot);timeline.append(dict(state=state['id'],source_shot=s['id'],paragraph=s['paragraph'],frame=frame,second=frame/FPS,trigger=state['trigger'],meaning=state['meaning']))
def clip(id,file,role,start,length,volume,fade=0,trim=0,loop=False):
 return dict(id=id,file='medieval/video005-draft-v01/'+file,role=role,fromFrame=round(start*FPS),durationFrames=round(length*FPS),trimBeforeFrames=round(trim*FPS),volume=volume,fadeFrames=round(fade*FPS),loop=loop,rights='unresolved')
audios=[clip('VOICE','narration-with-pauses.wav','voice',0,(totalframes-1)/FPS,.9),clip('OPENING_KEYBOARD','opening-soft-keyboard-original.wav','music',0,4.65,.23),clip('LATCH','wood.wav','sfx',4.65,.2667,.20)]
# Quiet existing bed only in framing/recap, not under testimony or voyeurism cases.
def para_start(id):return shifted(mapping[paras[id]['offset']])
audios.append(clip('BED_INTRO','existing-bed.mp3','music',para_start('P004'),min(26,para_start('P009')-para_start('P004')),.042,.8,0))
audios.append(clip('BED_END','existing-bed.mp3','music',para_start('P053'),totalframes/FPS-para_start('P053'),.038,1.2,25))
curtain=next(x['second'] for x in timeline if x['source_shot']=='V12-S014')
audios.append(clip('CURTAIN_CLOTH','brush.wav','sfx',curtain,.2667,.11))
words=[dict(text=w['word'].strip(),startMs=round(shifted(w['start'])*1000),endMs=max(round(shifted(w['start'])*1000)+1,round(shifted(w['end'])*1000))) for w in raw['words'] if w['word'].strip()]
episode=dict(id='VIDEO005-DRAFT-V01',version='draft-v01',scriptVersion='V09',planVersion='V12',width=W,height=H,fps=FPS,durationInFrames=totalframes,timingBasis='audio-aligned',words=words,assets=assets,audio=audios,shots=shots)
prop=ROOT/'examples/medieval/video005-draft-v01.props.json';save(prop,dict(episode=episode))
save(OUT/'TIMELINE_V01.json',timeline);save(OUT/'LAYER_LINEAGE_V01.json',lineage)
save(OUT/'BUILD_REPORT_V01.json',dict(duration_s=totalframes/FPS,frames=totalframes,source_audio_sha256=original_hash,silence_insertions=[dict(source_s=c,added_s=d) for c,d in inserts],tail_s=.8,source_shots=85,states=len(shots),derived_layers=len(assets),unique_source_assets=len(set(x['source_asset'] for x in lineage)),asr_discrepancies=uncertain,timing_note='ASR token-derived; not human cue approval',audio_additions=audios[1:],direct_listening=False,layer_policy='Registered PNG per independently editable layer; mechanical derivatives are not extra original assets. No full character rigs.'))
# Small public root keeps the renderer isolated from unrelated historical episode media.
MIN=OUT/'public'; (MIN/'medieval').mkdir(parents=True,exist_ok=True)
if not (MIN/'medieval/video005-draft-v01').exists():shutil.copytree(PUB,MIN/'medieval/video005-draft-v01')
if not (MIN/'fonts').exists():shutil.copytree(ROOT/'public/fonts',MIN/'fonts')
assert hashlib.sha256(audio.read_bytes()).hexdigest()==original_hash
print(json.dumps(dict(props=str(prop),states=len(shots),layers=len(assets),duration_s=totalframes/FPS,cut2=float(cut2))))
