import pathlib,json,copy
ROOT=pathlib.Path(__file__).resolve().parents[2]
base=json.loads((ROOT/'examples/medieval/video004-v03.props.json').read_text(encoding='utf-8'))
data=copy.deepcopy(base);e=data['episode']
e.update(id='video004-final',version='final-v04-text-contrast')
for shot in e['shots']:
 for layer in shot['layers']:
  if layer['kind']=='text':layer['color']='#111820'
assert e['audio']==base['episode']['audio']
assert [(s['id'],s['fromFrame']) for s in e['shots']]==[(s['id'],s['fromFrame']) for s in base['episode']['shots']]
target=ROOT/'examples/medieval/video004-final.props.json'
target.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(target)
