from pathlib import Path
from PIL import Image,ImageDraw
import json,re,math
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v02'
e=json.loads((ROOT/'examples/medieval/video005-draft-v02.props.json').read_text(encoding='utf8'))['episode'];checks=json.loads((OUT/'TEXT_LAYOUT_CHECKS_V02.json').read_text(encoding='utf8'))
bad=[r for r in checks if r['box'][0]<95.99 or r['box'][1]<71.99 or r['box'][0]+r['box'][2]>1824.01 or r['box'][1]+r['box'][3]>940.01];assert not bad,bad
def intersect(a,b):return max(a[0],b[0])<min(a[0]+a[2],b[0]+b[2])-.1 and max(a[1],b[1])<min(a[1]+a[3],b[1]+b[3])-.1
overlap=[];read_load=[]
for i,s in enumerate(e['shots']):
 text=[l for l in s['layers'] if l['kind']=='text'];art=[l for l in s['layers'] if l['kind']=='image'];bounds=lambda l:[l['x']-l['width']/2,l['y']-l['height']/2,l['width'],l['height']]
 for l in text:
  for a in art:
   if a['assetId'].startswith('SOLAR_DIAGRAM_'):continue # Labels deliberately occupy designated rooms in this semantic diagram.
   if intersect(bounds(l),bounds(a)):overlap.append(dict(state=s['id'],text=l['id'],image=a['id']))
 for k,l in enumerate(text):
  for other in text[k+1:]:
   if intersect(bounds(l),bounds(other)):overlap.append(dict(state=s['id'],text=l['id'],other_text=other['id']))
 end=e['shots'][i+1]['fromFrame'] if i+1<len(e['shots']) else e['durationInFrames'];sec=(end-s['fromFrame'])/30;words=len(re.findall(r"[A-Za-z0-9]+(?:'[A-Za-z]+)?",' '.join(l['text'] for l in text)))
 if text:read_load.append(dict(state=s['id'],seconds=sec,words=words,wpm=words/sec*60,text=[l['text'] for l in text],status='Editorial screening only, not a measured reading-speed or retention guarantee'))
assert not overlap,overlap
report=dict(text_layers=len(checks),safe_box_pass=True,unintended_text_image_or_text_text_overlap=overlap,read_load=read_load,read_load_warning_wpm=220,read_load_note='Screen new information separately from repeated labels; use these values to find overload, not a universal cutoff.')
(OUT/'LAYOUT_AUDIT_V02.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
for r in read_load:
 if r['wpm']>220:print(json.dumps(r,ensure_ascii=True))
changed=json.loads((OUT/'CHANGE_REGISTER_V02.json').read_text(encoding='utf8'));qa=OUT/'layout-qa';qa.mkdir(exist_ok=True)
for k in range(0,len(changed),12):
 batch=changed[k:k+12];sheet=Image.new('RGB',(1440,238*math.ceil(len(batch)/4)),'#D8D3C8');d=ImageDraw.Draw(sheet)
 for j,r in enumerate(batch):
  im=Image.open(OUT/'state-frames'/f"{r['state']}.png").convert('RGB').resize((360,203),Image.Resampling.LANCZOS);x=j%4*360;y=j//4*238;sheet.paste(im,(x,y+30));d.text((x+4,y+5),r['state'],fill='black')
 sheet.save(qa/f'phone-360-{k//12+1:02}.jpg',quality=95)
print('LAYOUT PASS',len(checks),'text layers; changed frames',len(changed))
