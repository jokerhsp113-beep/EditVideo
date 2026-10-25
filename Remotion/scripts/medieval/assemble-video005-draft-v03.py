from pathlib import Path
import json,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/medieval/video005-draft-v03'
FF=r'C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe'
e=json.loads((ROOT/'examples/medieval/video005-draft-v03.props.json').read_text(encoding='utf8'))['episode'];base=json.loads((ROOT/'examples/medieval/video005-draft-v02.props.json').read_text(encoding='utf8'))['episode'];assert e['audio']==base['audio']
audio=ROOT/'out/medieval/video005-draft-v02/VIDEO005_DRAFT_V02_1080p30.mp4'
lines=['ffconcat version 1.0']
for i,s in enumerate(e['shots']):
 image=OUT/'state-frames'/f"{s['id']}.png";assert image.exists();end=e['shots'][i+1]['fromFrame'] if i+1<len(e['shots']) else e['durationInFrames']
 lines.extend([f"file '{image.as_posix()}'",'option framerate 30',f"duration {(end-s['fromFrame'])/30:.12f}"])
lines.extend([f"file '{image.as_posix()}'",'option framerate 30']);concat=OUT/'STATE_SEQUENCE_V03.ffconcat';concat.write_text('\n'.join(lines)+'\n',encoding='utf8')
video=OUT/'VIDEO005_DRAFT_V03_1080p30.mp4';assert not video.exists()
vf=f"fps=30,tpad=stop_mode=clone:stop_duration=2,trim=end_frame={e['durationInFrames']},setpts=N/(30*TB),scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p"
cmd=[FF,'-hide_banner','-nostdin','-f','concat','-safe','0','-i',str(concat),'-i',str(audio),'-map','0:v:0','-map','1:a:0','-vf',vf,'-fps_mode','passthrough','-c:v','libx264','-preset','fast','-tune','stillimage','-crf','18','-threads','6','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','copy','-movflags','+faststart',str(video)]
with (OUT/'ENCODE_V03.log').open('w',encoding='utf8') as log:subprocess.run(cmd,stdout=log,stderr=log,check=True)
def audiohash(p):return subprocess.check_output([FF,'-v','error','-i',str(p),'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-']).decode().strip()
before,after=audiohash(audio),audiohash(video);assert before==after
(OUT/'AUDIO_BITSTREAM_UNCHANGED_V03.json').write_text(json.dumps(dict(before=before,after=after,identical=True),indent=2),encoding='utf8')
print(str(video))
