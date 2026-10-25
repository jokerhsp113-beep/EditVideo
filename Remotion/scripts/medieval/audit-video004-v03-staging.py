"""Inspect actual alpha bounds of raster inserts; never edits source artwork."""
import pathlib,sys,json,subprocess,struct
WORK=pathlib.Path(r'C:\Users\huutr\Documents\ChatGPT\Medieval 2')
sys.path.insert(0,str(WORK/'render-tools/asr-python'))
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[2]
ff=WORK/'render-tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe'
e=json.loads((ROOT/'examples/medieval/video004-v03.props.json').read_text(encoding='utf-8'))['episode']
bounds={}
for a in e['assets']:
 p=ROOT/'public'/a['file']
 if p.suffix!='.png':continue
 header=p.read_bytes()[:32];w,h=struct.unpack('>II',header[16:24])
 rgba=subprocess.run([str(ff),'-v','error','-i',str(p),'-f','rawvideo','-pix_fmt','rgba','-'],capture_output=True,check=True).stdout
 mask=np.frombuffer(rgba,dtype=np.uint8).reshape(h,w,4)[:,:,3]>32
 yy,xx=np.where(mask)
 bounds[a['id']]={'image':[w,h],'alpha':[int(xx.min()),int(yy.min()),int(xx.max()),int(yy.max())]}
findings=[];checked=0;placements=[]
for s in e['shots']:
 for l in s['layers']:
  if l.get('assetId') not in bounds:continue
  b=bounds[l['assetId']]; w,h=b['image'];x0,y0,x1,y1=b['alpha']
  scale=min(l['width']/w,l['height']/h)
  left=l['x']-w*scale/2;top=l['y']-h*scale/2
  box=[round(left+x0*scale),round(top+y0*scale),round(left+x1*scale),round(top+y1*scale)]
  if l['assetId'].startswith('BG_') or len(s['layers'])==1:continue
  checked+=1;placements.append({'shot':s['id'],'asset':l['assetId'],'visibleBounds':box})
  if box[0]<0 or box[1]<0 or box[2]>1920 or box[3]>1080:findings.append(placements[-1])
report={'method':'Decoded source PNG alpha >32; contain scaling; static insert bounds, not semantic contact proof','checkedInsertPlacements':checked,'outOfFrame':findings,'placements':placements,'sourceBounds':bounds}
(ROOT/'out/medieval/video004-v03/STAGING_AUDIT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Checked',checked,'raster insert placements; out of frame:',len(findings))
print(json.dumps(findings))
