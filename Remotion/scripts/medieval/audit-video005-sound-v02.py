from pathlib import Path
import json,subprocess,math
import numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v02'
e=json.loads((ROOT/'examples/medieval/video005-draft-v02.props.json').read_text(encoding='utf8'))['episode']
FF=r'C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe'
rows=[]
for a in e['audio']:
 if a['role']=='voice':continue
 p=ROOT/'public'/a['file'];sr=16000
 data=np.frombuffer(subprocess.check_output([FF,'-v','error','-i',str(p),'-f','f32le','-ac','1','-ar',str(sr),'pipe:1']),dtype='<f4')
 start=round(a['trimBeforeFrames']/30*sr);n=round(a['durationFrames']/30*sr);clip=data[start:start+n];assert len(clip)>0
 rms=math.sqrt(float(np.mean(clip.astype(float)**2)));peak=float(np.max(abs(clip)));zeros=float(np.mean(abs(clip)<.0001))
 rows.append(dict(id=a['id'],role=a['role'],duration_s=len(clip)/sr,mixed_rms_dbfs=20*math.log10(max(1e-9,rms*a['volume'])),mixed_peak_dbfs=20*math.log10(max(1e-9,peak*a['volume'])),nearly_silent_fraction=zeros))
(OUT/'SOUND_SIGNAL_AUDIT_V02.json').write_text(json.dumps(rows,indent=2),encoding='utf8')
for r in rows:print(json.dumps(r))
