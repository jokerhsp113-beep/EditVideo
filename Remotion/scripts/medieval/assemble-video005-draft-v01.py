from pathlib import Path
import json, subprocess, math
import numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v01'
FF=r'C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe'
e=json.loads((ROOT/'examples/medieval/video005-draft-v01.props.json').read_text(encoding='utf8'))['episode'];sr=44100
length=round(e['durationInFrames']/e['fps']*sr);mix=np.zeros((length,2),np.float64);tracks=[]
for a in e['audio']:
 file=ROOT/'public'/a['file']
 data=np.frombuffer(subprocess.check_output([FF,'-v','error','-i',str(file),'-f','f32le','-ac','2','-ar',str(sr),'pipe:1']),dtype='<f4').reshape(-1,2).copy()
 trim=round(a['trimBeforeFrames']/30*sr);data=data[trim:];n=round(a['durationFrames']/30*sr)
 if a['loop']:data=np.tile(data,(math.ceil(n/len(data)),1))
 data=data[:n];env=np.ones(len(data));fade=round(a['fadeFrames']/30*sr)
 if fade:
  env=np.minimum(1,np.minimum(np.arange(len(data))/fade,(len(data)-1-np.arange(len(data)))/fade))
 # Current clip manifest has only gain/fade; fail rather than silently ignore future edits.
 assert not a.get('gainEnvelope'),'Implement revised gainEnvelope before baking mix'
 data*=env[:,None]*a['volume'];start=round(a['fromFrame']/30*sr);count=min(len(data),length-start)
 mix[start:start+count]+=data[:count];tracks.append(dict(id=a['id'],source=str(file),fromFrame=a['fromFrame'],samples=count,volume=a['volume']))
peak=float(np.max(abs(mix)));assert peak<.999,peak
wav=OUT/'REVIEW_MIX_V01.wav'
subprocess.run([FF,'-v','error','-y','-f','f32le','-ar',str(sr),'-ac','2','-i','pipe:0','-c:a','pcm_s24le',str(wav)],input=mix.astype('<f4').tobytes(),check=True)
(OUT/'MIX_PROVENANCE_V01.json').write_text(json.dumps(dict(sample_peak_dbfs=20*math.log10(peak),tracks=tracks,method='Separate editable clips mixed sample-wise with manifest trim, gain and fades; stereo 44.1 kHz PCM24 intermediate. Not directly listened.'),indent=2),encoding='utf8')
lines=['ffconcat version 1.0']
for i,s in enumerate(e['shots']):
 # This optimized route is exact only for held states. Refuse animated manifests.
 assert not s.get('camera') or len(s['camera']['keyframes'])==1
 assert all(not l.get('motion') and len(l.get('keyframes',[]))<=1 and l['enter']=='none' for l in s['layers'])
 image=OUT/'state-frames'/f"{s['id']}.png";assert image.exists(),image
 end=e['shots'][i+1]['fromFrame'] if i+1<len(e['shots']) else e['durationInFrames'];frames=end-s['fromFrame']
 lines.extend([f"file '{image.as_posix()}'",'option framerate 30',f'duration {frames/30:.12f}'])
lines.extend([f"file '{image.as_posix()}'",'option framerate 30'])
concat=OUT/'STATE_SEQUENCE_V01.ffconcat';concat.write_text('\n'.join(lines)+'\n',encoding='utf8')
video=OUT/'VIDEO005_DRAFT_V01_1080p30.mp4';assert not video.exists(),'Never overwrite delivery'
vf=f"fps=30,tpad=stop_mode=clone:stop_duration=2,trim=end_frame={e['durationInFrames']},setpts=N/(30*TB),scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p"
cmd=[FF,'-hide_banner','-nostdin','-f','concat','-safe','0','-i',str(concat),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-vf',vf,'-fps_mode','passthrough','-c:v','libx264','-preset','fast','-tune','stillimage','-crf','18','-threads','6','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-b:a','192k','-ar',str(sr),'-movflags','+faststart',str(video)]
with (OUT/'ENCODE_V01.log').open('w',encoding='utf8') as log:subprocess.run(cmd,stdout=log,stderr=log,check=True)
print(json.dumps(dict(output=str(video),seconds=e['durationInFrames']/30,mix_peak_dbfs=20*math.log10(peak))))
