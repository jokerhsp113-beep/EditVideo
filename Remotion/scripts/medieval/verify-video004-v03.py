"""Verify exported MP4 and derive an exact 45-second opening review."""
import pathlib,subprocess,json
WORK=pathlib.Path(r'C:\Users\huutr\Documents\ChatGPT\Medieval 2')
ROOT=pathlib.Path(__file__).resolve().parents[2]
BIN=WORK/'render-tools/ffmpeg-9.0.2-essentials_build/bin'
OUT=ROOT/'out/medieval/video004-v03'
movie=OUT/'video004-v03-540p-30fps.mp4'
probe=json.loads(subprocess.run([str(BIN/'ffprobe.exe'),'-v','error','-show_streams','-show_format','-of','json',str(movie)],capture_output=True,text=True,check=True).stdout)
v=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'])==(960,540,'30/1')
assert abs(float(probe['format']['duration'])-458.16163265306125)<.12
subprocess.run([str(BIN/'ffmpeg.exe'),'-v','error','-i',str(movie),'-map','0:v:0','-map','0:a:0','-f','null','-'],check=True)
clip=OUT/'video004-v03-opening-45s.mp4'
assert not clip.exists(),'Do not overwrite an inspected clip'
subprocess.run([str(BIN/'ffmpeg.exe'),'-v','error','-i',str(movie),'-t','45','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(clip)],check=True)
for t in [1.6,2.7,4.3,7.8,81,390,457]:
    target=OUT/f'export-{round(t*10):04d}.png'
    subprocess.run([str(BIN/'ffmpeg.exe'),'-v','error','-ss',str(t),'-i',str(movie),'-frames:v','1','-y',str(target)],check=True)
report={'file':movie.name,'seconds':float(probe['format']['duration']),'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'videoCodec':v['codec_name'],'audioCodec':audio['codec_name'],'fullDecodePassed':True,'humanListened':False,'openingClip':clip.name}
(OUT/'EXPORT_CHECK.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
