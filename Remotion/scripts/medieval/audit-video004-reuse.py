"""Measure actual image exposure, separating scenery/poses from full cutaways."""
import json,pathlib,collections,sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'out/medieval/video004-variety-v05';OUT.mkdir(parents=True,exist_ok=True)
e=json.loads((ROOT/(sys.argv[1] if len(sys.argv)>1 else 'examples/medieval/video004-final.props.json')).read_text(encoding='utf-8'))['episode']
assets={a['id']:a for a in e['assets']};exposures=collections.defaultdict(list)
shots=[]
for i,s in enumerate(e['shots']):
 end=e['shots'][i+1]['fromFrame'] if i+1<len(e['shots']) else e['durationInFrames']
 ids=[l['assetId'] for l in s['layers'] if l.get('assetId')]
 record={'id':s['id'],'start':s['fromFrame']/e['fps'],'end':end/e['fps'],'seconds':(end-s['fromFrame'])/e['fps'],'images':ids,'cue':s.get('note',''),'fullCutaway':len(s['layers'])==1 and len(ids)==1}
 shots.append(record)
 for id in set(ids):exposures[id].append(record)
stats=[]
for id,items in exposures.items():
 role='background' if id.startswith('BG_') else 'narrator-pose' if id.startswith('C_') else 'cutaway' if any(x['fullCutaway'] for x in items) else 'prop-or-group'
 runs=[]
 for x in items:
  if runs and abs(runs[-1]['end']-x['start'])<.01:runs[-1]['end']=x['end']
  else:runs.append({'start':x['start'],'end':x['end']})
 stats.append({'id':id,'role':role,'uses':len(items),'totalSeconds':round(sum(x['seconds'] for x in items),2),'longestContinuousSeconds':round(max(x['end']-x['start'] for x in runs),2),'file':assets[id]['file'],'shots':items})
stats.sort(key=lambda x:x['totalSeconds'],reverse=True)
same=[]
for i,s in enumerate(e['shots'][1:],1):
 if s['layers']==e['shots'][i-1]['layers']:same.append([e['shots'][i-1]['id'],s['id']])
report={'durationSeconds':e['durationInFrames']/e['fps'],'shots':len(shots),'distinctImages':len(exposures),'identicalAdjacentCompositions':same,'assets':stats}
(OUT/(sys.argv[2] if len(sys.argv)>2 else 'REUSE_BEFORE.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
for r in stats:print(r['id'],r['role'],r['uses'],r['totalSeconds'],r['longestContinuousSeconds'])
print('IDENTICAL',same)
