from pathlib import Path
import json,re,html
ROOT=Path(__file__).resolve().parents[2];P=ROOT/'out/medieval/video005-audit-v02/sources'
catalog=json.loads((P/'incompetech-pieces.txt').read_text(encoding='utf8'))
rows=list(catalog.values()) if isinstance(catalog,dict) else catalog
selected=[r for r in rows if r.get('title') in ['There is Romance','Angevin','Angevin B','Village Consort','Thinking Music','Investigations','Heartwarming','Eternal Hope']]
(P/'MUSIC_CANDIDATES.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2),encoding='utf8')
for r in selected:print(json.dumps(r,ensure_ascii=True))
for name in ['mixkit-door','mixkit-voices','mixkit-laugh','mixkit-cloth','mixkit-water']:
 s=(P/(name+'.txt')).read_text(encoding='utf8');print('PAGE',name)
 cards=[]
 for block in s.split('<div class="item-grid__item">')[1:]:
  title=re.search(r'<h2 class="item-grid-card__title">(.*?)</h2>',block,re.S)
  id=re.search(r'data-audio-player-item-id-value="(\d+)"',block)
  preview=re.search(r'data-audio-player-preview-url-value="([^"]+)"',block)
  if title and id and preview:
   r=dict(title=html.unescape(re.sub('<[^>]+>','',title[1])).strip(),id=int(id[1]),preview=preview[1]);cards.append(r);print(json.dumps(r,ensure_ascii=True))
 (P/(name+'-cards.json')).write_text(json.dumps(cards,ensure_ascii=False,indent=2),encoding='utf8')
