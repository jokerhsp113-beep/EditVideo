import json
import math
from pathlib import Path
import subprocess
import sys
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/"out/medieval/revision-v02"
VIDEO=Path(sys.argv[1]) if len(sys.argv)>1 else Path(r"D:\Youtube\Medieval Life Explained\videos\Video003\06_PUBLISH\Video003-v02.mp4")
FF=Path(r"C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe")
FP=FF.with_name("ffprobe.exe")
PLAN=json.loads((ROOT/"examples/medieval/video003-v02.json").read_text(encoding="utf-8"))["plan"]
OUT=BASE/"qa-final"
OUT.mkdir(parents=True,exist_ok=True)
def extract(seconds,path,width):
    subprocess.run([str(FF),"-hide_banner","-loglevel","error","-ss",f"{seconds:.5f}",
                    "-i",str(VIDEO),"-frames:v","1","-vf",f"scale={width}:-1",
                    "-q:v","3","-y",str(path)],check=True,capture_output=True)
def sheets(files,prefix,cols,rows,width,height):
    result=[]
    for start in range(0,len(files),cols*rows):
        group=files[start:start+cols*rows]
        canvas=Image.new("RGB",(cols*width,rows*(height+26)),"#eee8dd")
        draw=ImageDraw.Draw(canvas)
        for i,(file,label) in enumerate(group):
            x=(i%cols)*width
            y=(i//cols)*(height+26)
            canvas.paste(Image.open(file).convert("RGB").resize((width,height)),(x,y))
            draw.text((x+6,y+height+4),label,fill="#222")
        dest=OUT/f"{prefix}-{start//(cols*rows)+1:02}.jpg"
        canvas.save(dest,quality=91)
        result.append(str(dest))
    return result

metadata=json.loads(subprocess.check_output([str(FP),"-v","error","-show_entries",
    "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames","-of","json",str(VIDEO)]))
video_stream=next(s for s in metadata["streams"] if s["codec_type"]=="video")
if int(video_stream["nb_frames"])!=PLAN["duration"]:
    raise ValueError("Frame count changed during assembly")
cuts=[]
for shot in PLAN["shots"]:
    for i,cut in enumerate(shot["cuts"]):
        frame=(cut["start"]+cut["end"]-1)//2
        filename=OUT/f"cut-{shot['id']}-{i+1}.jpg"
        extract(frame/PLAN["fps"],filename,480)
        cuts.append((filename,f"{shot['id']}.{i+1}   {frame/PLAN['fps']:.2f}s"))
print("CUTS",len(cuts),flush=True)
overlays=[]
for i,o in enumerate(PLAN["overlays"]):
    frame=min(o["end"]-2,o["start"]+max(o.get("cardDelays",[0]))+round(1.1*PLAN["fps"]))
    filename=OUT/f"overlay-{i+1:02}-{o['variant']}.jpg"
    extract(frame/PLAN["fps"],filename,1280)
    overlays.append((filename,f"{o['variant']}   {frame/PLAN['fps']:.2f}s"))
grain=next(o for o in PLAN["overlays"] if o["variant"]=="E09_transfer")
for label,t in (("before",.17),("moving",.5),("after",1.25)):
    extract(grain["start"]/PLAN["fps"]+t,OUT/f"grain-{label}.png",1280)
cut_sheets=sheets(cuts,"ALL-CUTS",4,6,320,180)
overlay_sheets=sheets(overlays,"ALL-OVERLAYS",2,3,640,360)
audio=subprocess.run([str(FF),"-hide_banner","-nostats","-i",str(VIDEO),
    "-vn","-af","volumedetect","-f","null","-"],capture_output=True,text=True)
audio_lines=[line for line in audio.stderr.splitlines() if "volume:" in line]
if audio.returncode:
    raise ValueError(audio.stderr[-2000:])
report=dict(file=str(VIDEO),metadata=metadata,sceneCutSamples=len(cuts),
    overlaySamples=len(overlays),cutSheets=cut_sheets,overlaySheets=overlay_sheets,
    audioStats=audio_lines,limits="Every scene-cut midpoint and every overlay's final reveal sampled; not a claim of full human playback or audience testing.")
(OUT/"FINAL_MEDIA_QA.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(dict(sceneCutSamples=len(cuts),overlaySamples=len(overlays),audioStats=audio_lines)))
