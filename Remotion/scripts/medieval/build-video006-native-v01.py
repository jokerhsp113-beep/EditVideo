from pathlib import Path
import json,html,shutil,base64
from PIL import ImageFont
ROOT=Path(__file__).resolve().parents[2]
PLAN=Path(r'D:\Youtube\Medieval Life Explained\videos\Video006\production\prompt-plan-v04-20261021')
OUT=ROOT/'out/medieval/video006-assets-v01';N=OUT/'native';N.mkdir(parents=True,exist_ok=True)
pack=json.loads((PLAN/'PROMPT_PACK_CURRENT.json').read_text(encoding='utf-8-sig'))
FONT=base64.b64encode((ROOT/'public/fonts/PatrickHand-Regular.ttf').read_bytes()).decode()
INK='#292a2b';RED='#a74638';BLUE='#476b82';GOLD='#c29c57'
def text(x,y,s,size=60,fill=INK,anchor='middle'):
 contrast=' stroke="#111820" stroke-width="5" paint-order="stroke fill"' if fill=='#fff7e8' else ''
 return f'<text x="{x}" y="{y}" fill="{fill}"{contrast} font-family="Patrick Hand" font-size="{size}" text-anchor="{anchor}">{html.escape(str(s))}</text>'
def line(points,color=INK,dash=False,width=9):
 return f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"'+(' stroke-dasharray="18 18"' if dash else '')+'/>'
def circle(x,y,r=20,color=BLUE):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" stroke="{INK}" stroke-width="5"/>'
def house(x,y,towers=False):
 s=f'<path d="M{x-55},{y+50} V{y-25} L{x},{y-70} L{x+55},{y-25} V{y+50} Z" fill="#d8c29b" stroke="{INK}" stroke-width="6"/>'
 if towers:
  for dx in [-55,55]:s+=f'<path d="M{x+dx-14},{y+25} V{y-85} L{x+dx},{y-125} L{x+dx+14},{y-85} V{y+25} Z" fill="#c3af8b" stroke="{INK}" stroke-width="5"/>'
 return s
def graphic(a,c):
 id=a['asset_id'];v=c.get('variant','');s='';panel=id not in ['N_SCOPE','N_CASE','N_DESTINATION']
 if panel:s='<rect width="1920" height="1080" fill="#eee4d1"/>'
 if id in ['N_SCOPE','N_CASE','N_DESTINATION']:
  title=c.get('text','');pos=c.get('position',c.get('layout',''));y=825 if 'lower' in pos else 125
  x=1820 if 'right' in pos else 100;anchor='end' if x>1000 else 'start'
  f=ImageFont.truetype(str(ROOT/'public/fonts/PatrickHand-Regular.ttf'),62)
  width=min(1800,max(f.getlength(title),f.getlength(c.get('scope',''))*.75)+110)
  rx=x-width+45 if anchor=='end' else x-45
  s+=f'<defs><radialGradient id="scrim"><stop offset="0" stop-color="#111820" stop-opacity=".72"/><stop offset=".72" stop-color="#111820" stop-opacity=".55"/><stop offset="1" stop-color="#111820" stop-opacity="0"/></radialGradient></defs><rect x="{rx}" y="{y-95}" width="{width}" height="{180 if c.get("scope") else 130}" fill="url(#scrim)"/>'
  s+=text(x,y,title,62,'#fff7e8',anchor)
  if c.get('scope'):s+=text(x,y+65,c['scope'],46,'#fff7e8',anchor)
 elif id=='N_DIALOGUE':
  s+=text(960,160,c.get('title','Teaching dialogue'),88)+text(960,245,c.get('subtitle','Teaching dialogue'),56)
  if 'S008' not in CURRENT_STATE:
   s+=line('960,350 960,860','#998c75',width=4)+text(500,430,'French',78)+text(1420,430,'English',78)
  # No invented historical transcript or counterfeit page.
 elif id=='N_LOCAL_ROUTE':
  s+=text(1600,1020,'Model route',50)
  points=[(230,907),(1190,907),(1190,648),(1190,410),(576,410),(576,216)]
  n=1 if v=='gate-only' else 2 if v=='right-from-gate' else 4 if v=='cross-bridge' else 5 if v=='left-after-bridge' else 6
  if n>1:s+=line(' '.join(f'{x},{y}' for x,y in points[:n]),GOLD,width=22)
  s+=f'<path d="M180 950 V850 Q230 800 280 850 V950" fill="none" stroke="{INK}" stroke-width="12"/>'
  if n>=4:
   s+=line('1020,648 1370,648','#78a1ac',width=65)+f'<rect x="1145" y="588" width="90" height="120" fill="#bc9e70" stroke="{INK}" stroke-width="7"/>'
   s+=line('1160,590 1160,707',INK,width=4)+line('1220,590 1220,707',INK,width=4)
  if n>=6:s+=house(576,216,True)+house(800,140)+text(970,165,'Lodging',50)
  x,y=points[max(0,n-1)];s+=circle(x,y,25)
 elif id in ['N_SCALE','N_SUMMARY']:
  s+=line('260,450 780,450 1300,450 1680,450',BLUE,width=12)
  for x in [260,780,1300,1680]:s+=circle(x,450,38)
  s+=f'<rect x="480" y="630" width="620" height="270" rx="30" fill="#f8f0df" stroke="{INK}" stroke-width="5"/>'+line('780,488 780,630',INK,dash=True,width=4)+line('570,820 750,820 750,700 970,700',GOLD,width=14)
  if id=='N_SUMMARY':s+=circle(1490,710,27)+circle(1575,710,27)+line('1490,740 1490,850',INK)+line('1575,740 1575,850',INK)+line('1300,488 1510,660',BLUE,dash=True,width=4)
 elif id=='N_GOUGH':
  s+=text(960,135,c.get('title','Gough Map'),90)+text(960,225,c.get('scope','Schematic — not a facsimile'),50)
  pts=[(400,450),(800,400),(1150,550),(1500,390),(1400,800),(750,780)]
  for i,j in [(0,1),(1,2),(2,3),(2,4),(4,5),(5,0)]:
   if v=='partial-network' and (i,j)==(5,0):continue
   s+=line(f'{pts[i][0]},{pts[i][1]} {pts[j][0]},{pts[j][1]}',RED,width=12)
  for x,y in pts:s+=circle(x,y,25,GOLD)
  for i,label in enumerate(c.get('labels',[])):s+=text(960,950,label,64)
 elif id=='N_ITINERARY':
  s+=text(960,160,c.get('title',"Wey's recorded itinerary"),82)+text(960,250,c.get('scope','Format summary, not a reproduced page'),48)
  s+=line('400,550 960,550 1520,550',BLUE,width=10)
  for x,label in zip([400,960,1520],c.get('nodes',['Calais','Rome','Venice'])):s+=circle(x,550,25)+text(x,675,label,84)
 elif id=='N_DETOUR':
  s+=text(960,100,'1462',82)+text(960,175,'Route schematic — not a surveyed path',48)
  pts=[(270,470),(750,470),(1260,470),(1670,470)]
  labels=['Rhine route','Basel','Alps','Venice']
  first=v in ['first-diversion','second-diversion-east','same-destination-changed-route'];second=v in ['second-diversion-east','same-destination-changed-route']
  s+=line('270,470 750,470',INK,dash=first)+line('750,470 1260,470',INK,dash=second)+line('1260,470 1670,470',BLUE)
  if first:s+=line('270,470 350,790 750,790 750,470',BLUE)+text(500,875,'Another route',52)
  if second:s+=line('750,470 950,650 1320,650 1260,470',GOLD)+text(1160,740,'Eastward detour',54)
  for (x,y),label in zip(pts,labels):s+=circle(x,y,24)+text(x,y-70,label,62)
 elif id=='N_COMPANY':
  s+=line('500,850 850,550 600,260',BLUE,width=12)+line('500,850 850,550 1330,250',GOLD,width=12)+circle(600,260,55)+circle(1330,250,55,GOLD)
 elif id=='N_WORDLIST':
  s+=text(960,150,c.get('title',"Wey's vocabulary notes"),84)+text(960,245,c.get('scope','Editorial summary'),52)
  items=c.get('items',[])
  if len(items)==1:s+=text(960,590,items[0],108)
  else:
   for i,item in enumerate(items):s+=text(960,440+i*155,item,92)
 elif id=='N_CASE_SEPARATION':
  s+=text(960,170,c.get('label','Different travelers'),84)+line('960,300 960,880','#998c75',width=5)
  s+=text(490,570,c.get('left',"Kempe’s account"),78)+text(1430,570,c.get('right',"Wey's notes"),78)
 # Native SVGs are full-canvas overlays. Apply planned combined-layout placement
 # here, rather than shrinking the entire canvas a second time in a compositor.
 if id=='N_LOCAL_ROUTE' and CURRENT_STATE in ['S004-B02','S008-B01','S015-B02']:
  s=s.replace('<rect width="1920" height="1080" fill="#eee4d1"/>','')
  dx,dy,k={'S004-B02':(930,290,.48),'S008-B01':(650,240,.63),'S015-B02':(500,550,.42)}[CURRENT_STATE]
  s=f'<g transform="translate({dx} {dy}) scale({k})">{s}</g>'
 if id=='N_DIALOGUE' and CURRENT_STATE in ['S004-B02','S008-B01']:
  s=s.replace('<rect width="1920" height="1080" fill="#eee4d1"/>','')
  s='<rect width="1920" height="1080" fill="#eee4d1"/>'+f'<g transform="translate(-50 170) scale(.55)">{s}</g>'
 if id=='N_ITINERARY' and CURRENT_STATE=='S015-B02':
  s=s.replace('<rect width="1920" height="1080" fill="#eee4d1"/>','')
  s='<rect width="1920" height="1080" fill="#eee4d1"/>'+f'<g transform="translate(190 0) scale(.8)">{s}</g>'
 if id in ['N_GOUGH','N_DETOUR'] and CURRENT_STATE in ['S014-B01','S019-B01']:
  s=s.replace('<rect width="1920" height="1080" fill="#eee4d1"/>','')
  s='<rect width="1920" height="1080" fill="#eee4d1"/>'+f'<g transform="translate(580 190) scale(.67)">{s}</g>'
 if id=='N_DIALOGUE' and CURRENT_STATE=='S004-B02':
  s='<rect width="1920" height="1080" fill="#eee4d1"/>'+text(480,200,'Caxton · c.1483',82)+text(480,295,'Teaching dialogue',60)+line('480,390 480,850','#998c75',width=4)+text(235,480,'French',72)+text(725,480,'English',72)
 if id=='N_LOCAL_ROUTE' and CURRENT_STATE=='S004-B02':
  s=f'<path d="M1310 810 V510 Q1450 310 1590 510 V810" fill="#d8c29b" stroke="{INK}" stroke-width="16"/><path d="M1380 810 V555 Q1450 460 1520 555 V810" fill="#77705e" stroke="{INK}" stroke-width="10"/>'+text(1450,930,'Model route',54)
 if id=='N_SCOPE' and CURRENT_STATE=='S008-B02':
  s=text(1520,145,'Model route',64)
 if id=='N_SCOPE' and CURRENT_STATE in ['S020-B02','S034-B02']:
  s=text(100,285 if CURRENT_STATE=='S020-B02' else 125,c.get('text',''),54 if CURRENT_STATE=='S020-B02' else 62,INK,'start')
 if id=='N_LOCAL_ROUTE' and CURRENT_STATE=='S008-B02':
  s=s.replace(text(1600,1020,'Model route',50),'')
 return s
records=[]
for a in pack['prompts']:
 if not a['asset_id'].startswith('N_'):continue
 for state in a['state_content']:
  CURRENT_STATE=state['state'];c=state['content'];svg=graphic(a,c)
  output=N/f"{a['asset_id']}__{CURRENT_STATE}.svg"
  output.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><style>@font-face{font-family:"Patrick Hand";src:url(data:font/ttf;base64,'+FONT+')}</style></defs>'+svg+'</svg>',encoding='utf-8')
  records.append({'asset_id':a['asset_id'],'state':CURRENT_STATE,'file':str(output),'content':c,'cue':state['cue'],'status':'built-uninspected','format':'editable SVG text/paths, not historical facsimile'})
(OUT/'NATIVE_MANIFEST.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print('Built',len(records),'native state SVGs for',len({r['asset_id'] for r in records}),'asset families')
