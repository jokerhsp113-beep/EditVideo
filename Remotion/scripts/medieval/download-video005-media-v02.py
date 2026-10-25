from pathlib import Path
import urllib.request,urllib.parse,json,re,hashlib
ROOT=Path(__file__).resolve().parents[2];S=ROOT/'out/medieval/video005-audit-v02/sources';P=ROOT/'public/medieval/video005-draft-v02/audio';P.mkdir(parents=True,exist_ok=True)
def fetch(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=45).read()
catalog=json.loads((S/'incompetech-pieces.txt').read_text(encoding='utf8'));records=[]
for name in ['There is Romance','Heartwarming','Village Consort','Thinking Music','Angevin']:
 r=next(r for r in catalog if r['title']==name);url='https://incompetech.com/music/royalty-free/mp3-royaltyfree/'+urllib.parse.quote(r['filename']);file=P/r['filename']
 if not file.exists():file.write_bytes(fetch(url))
 records.append(dict(kind='music',title=name,author='Kevin MacLeod',isrc=r['isrc'],source_page='https://incompetech.com/music/royalty-free/index.html?isrc='+r['isrc'],download_url=url,file=str(file),license='CC BY 4.0, attribution required',license_source='https://incompetech.com/music/royalty-free/licenses/',sha256=hashlib.sha256(file.read_bytes()).hexdigest(),metadata=r));print('downloaded music',name,flush=True)
cards=[]
for n in ['door','voices','laugh','cloth','water']:
 cards+=json.loads((S/f'mixkit-{n}-cards.json').read_text(encoding='utf8'))
for id in [187,195,337,1898,2981,411,2826]:
 r=next((r for r in cards if r['id']==id),None)
 if not r:continue
 modal='https://mixkit.co/free-sound-effects/download/'+str(id)+'/'
 page=fetch(modal);(S/f'sfx-modal-{id}.txt').write_bytes(page)
 url=re.search(rb'data-download--modal-url-value="([^"]+)"',page)[1].decode();file=P/f'mixkit-{id}.wav'
 if not file.exists():file.write_bytes(fetch(url))
 records.append(dict(kind='sfx',title=r['title'],id=id,source_page=modal,download_url=url,file=str(file),license='Mixkit Sound Effects Free License',license_source='https://mixkit.co/license/#sfxFree',sha256=hashlib.sha256(file.read_bytes()).hexdigest()));print('downloaded sfx',id,r['title'],flush=True)
(S.parent/'MEDIA_SOURCES_V02.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
