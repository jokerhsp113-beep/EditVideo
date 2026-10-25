"""Replace reviewed frame ranges; retain the already mixed narration/SFX stream."""
import json
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/"out/medieval/revision-v02"
BASE=OUT/"Video003-revision-v02-720p24.mp4"
FINAL=OUT/"Video003-revision-v02-reviewed-final.mp4"
FF=Path(r"C:\Users\huutr\Documents\ChatGPT\Medieval 2\render-tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe")
FP=FF.with_name("ffprobe.exe")
PLAN=json.loads((ROOT/"examples/medieval/video003-v02.json").read_text(encoding="utf-8"))["plan"]
def info(file):
    metadata=json.loads(subprocess.check_output([str(FP),"-v","error","-select_streams","v:0",
        "-show_entries","stream=nb_frames,width,height,r_frame_rate","-of","json",str(file)]))
    return metadata["streams"][0]
if FINAL.exists():
    raise ValueError("Final reviewed version already exists")
base_info=info(BASE)
if int(base_info["nb_frames"])!=PLAN["duration"]:
    raise ValueError("Base video frame count does not match plan")
patch_paths=[Path(value) for value in sys.argv[1:]] or [OUT/"grain-state-patch.json"]
patches=[(path,json.loads(path.read_text(encoding="utf-8"))) for path in patch_paths]
patches.sort(key=lambda pair:pair[1]["start"])
command=[str(FF),"-hide_banner","-loglevel","warning","-i",str(BASE)]
for path,patch in patches:
    media=path.with_suffix(".mp4")
    video_info=info(media)
    if int(video_info["nb_frames"])!=patch["end"]-patch["start"]:
        raise ValueError("Patch duration mismatch: "+str(path))
    if any(video_info[key]!=base_info[key] for key in ("width","height","r_frame_rate")):
        raise ValueError("Incompatible patch geometry: "+str(path))
    command+=["-i",str(media)]
filters=[]
labels=[]
cursor=0
for i,(path,patch) in enumerate(patches):
    if patch["start"]<cursor or patch["end"]>PLAN["duration"]:
        raise ValueError("Overlapping/out-of-bounds patch")
    if patch["start"]>cursor:
        label=f"base{i}"
        filters.append(f"[0:v]trim=start_frame={cursor}:end_frame={patch['start']},setpts=PTS-STARTPTS[{label}]")
        labels.append(f"[{label}]")
    label=f"patch{i}"
    filters.append(f"[{i+1}:v]setpts=PTS-STARTPTS[{label}]")
    labels.append(f"[{label}]")
    cursor=patch["end"]
if cursor<PLAN["duration"]:
    filters.append(f"[0:v]trim=start_frame={cursor}:end_frame={PLAN['duration']},setpts=PTS-STARTPTS[tail]")
    labels.append("[tail]")
filters.append("".join(labels)+f"concat=n={len(labels)}:v=1:a=0[video]")
command+=["-filter_complex",";".join(filters),"-map","[video]","-map","0:a",
          "-r",str(PLAN["fps"]),"-c:v","libx264","-preset","fast","-crf","16",
          "-pix_fmt","yuv420p","-c:a","copy","-movflags","+faststart",str(FINAL)]
subprocess.run(command,check=True)
final_info=info(FINAL)
if int(final_info["nb_frames"])!=PLAN["duration"]:
    raise ValueError("Reviewed assembly frame count mismatch")
(OUT/"REVIEWED_ASSEMBLY.json").write_text(json.dumps(dict(file=str(FINAL),base=str(BASE),
    patches=[patch for _,patch in patches],frames=int(final_info["nb_frames"]),audio="original mixed AAC stream copied without re-encoding"),indent=2),encoding="utf-8")
print(str(FINAL))
