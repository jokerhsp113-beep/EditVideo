from pathlib import Path
from PIL import Image,ImageDraw
import json, subprocess, hashlib, math
import numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v02'
BIN=Path(r'C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin')
FF=str(BIN/'ffmpeg.exe'); FP=str(BIN/'ffprobe.exe')
VIDEO=OUT/'VIDEO005_DRAFT_V02_1080p30.mp4'
def read(p):return json.loads(p.read_text(encoding='utf8'))
timeline=read(OUT/'TIMELINE_V02.json');props=read(ROOT/'examples/medieval/video005-draft-v02.props.json')['episode']
probe=json.loads(subprocess.check_output([FP,'-v','error','-show_streams','-show_format','-of','json',str(VIDEO)]))
vs=next(s for s in probe['streams'] if s['codec_type']=='video'); au=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert vs['width']==1920 and vs['height']==1080 and vs['r_frame_rate']=='30/1'
assert int(vs['nb_frames'])==props['durationInFrames']
assert abs(float(probe['format']['duration'])-props['durationInFrames']/30)<.1
decode=subprocess.run([FF,'-v','error','-i',str(VIDEO),'-f','null','-'],capture_output=True,text=True);assert decode.returncode==0,decode.stderr
qa=OUT/'export-qa';qa.mkdir(exist_ok=True)
# Frame-exact extraction from the exported MP4, not from the React preview.
selected=['S001-T01','S002-T01','S003-T01','S003-T02','S004-T01','S004-T02','S007-T02','S014-T02','S027-T01','S034-T01','S047-T02','S061-T01','S065-T01','S069-T02','S073-T02','S078-T02','S080-T01','S081-T01','S082-T01','S083-T01','S085-T01']
selected=list(dict.fromkeys(selected+[r['state'].removeprefix('V12-') for r in read(OUT/'CHANGE_REGISTER_V02.json')]))
frames=[]
for id in selected:
 s=next((s for s in timeline if s['state'].endswith(id)),None)
 if not s:continue
 frame=s['frame']+2;file=qa/f'{id}.jpg'
 frames.append(dict(state=s['state'],frame=frame,second=frame/30,file=str(file)))
frames.sort(key=lambda f:f['frame'])
terms=[f"eq(n\\,{f['frame']})" for f in frames]
select='+'.join('('+ '+'.join(terms[k:k+20])+')' for k in range(0,len(terms),20))
subprocess.run([FF,'-v','error','-y','-i',str(VIDEO),'-vf','select='+select,'-fps_mode','vfr','-q:v','2',str(qa/'frame-%03d.jpg')],check=True)
for i,f in enumerate(frames):
 (qa/f'frame-{i+1:03}.jpg').replace(Path(f['file']))
# Check every authored cut against its source state, catching concat timestamp drift.
boundary=qa/'boundaries';boundary.mkdir(exist_ok=True)
terms=[f"eq(n\\,{s['frame']})" for s in timeline]
select='+'.join('('+ '+'.join(terms[k:k+20])+')' for k in range(0,len(terms),20))
subprocess.run([FF,'-v','error','-y','-i',str(VIDEO),'-vf','select='+select+',scale=320:180','-fps_mode','vfr',str(boundary/'cut-%03d.png')],check=True)
errors=[]
for i,s in enumerate(timeline):
 actual=np.asarray(Image.open(boundary/f'cut-{i+1:03}.png').convert('RGB'),dtype=float)
 expected=np.asarray(Image.open(OUT/'state-frames'/f"{s['state']}.png").convert('RGB').resize((320,180),Image.Resampling.LANCZOS),dtype=float)
 mae=float(np.mean(abs(actual-expected)));errors.append(dict(state=s['state'],frame=s['frame'],rgb_mae=mae))
 assert mae<8,(s['state'],'exported cut differs from authored state',mae)
for batch in range(0,len(frames),12):
 rows=math.ceil(len(frames[batch:batch+12])/4);sheet=Image.new('RGB',(1600,rows*255),'#ddd8cd');d=ImageDraw.Draw(sheet)
 for j,item in enumerate(frames[batch:batch+12]):
  im=Image.open(item['file']);im.thumbnail((396,223));x=j%4*400;y=j//4*255
  sheet.paste(im,(x,y+27));d.text((x+4,y+5),f"{item['state']}  {item['second']:.2f}s",fill='black')
 sheet.save(qa/f'export-contact-{batch//12+1:02}.jpg',quality=94)
mix=subprocess.run([FF,'-hide_banner','-i',str(VIDEO),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True)
(OUT/'MIX_TECHNICAL_ANALYSIS.log').write_text(mix.stderr,encoding='utf8')
report=dict(video=str(VIDEO),sha256=hashlib.sha256(VIDEO.read_bytes()).hexdigest(),probe=probe,full_decode_pass=decode.returncode==0,decode_errors=decode.stderr,all_state_boundary_checks=errors,exported_frames=frames,direct_listening=False,review_marker=dict(paragraph='P027',time_s=156.73,issue='ASR: managed a visit / managed to visit; original audio retained for user listening review'),visual_review_status='pending inspection of exported frames')
(OUT/'EXPORT_VERIFICATION_V02.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(dict(video=str(VIDEO),duration=probe['format']['duration'],frames=len(frames),decode=decode.returncode,range=vs.get('color_range'),pixel_format=vs['pix_fmt'])))
