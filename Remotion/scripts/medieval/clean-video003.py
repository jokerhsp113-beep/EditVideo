"""Bounded, inventory-first cleanup of the accepted Video003 and its generated caches."""
import ast
import copy
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
MASTER=Path(r"D:\Youtube\Medieval Life Explained\videos\Video003")
CONTROL=ROOT/"maintenance/video003-cleanup"
CONTROL.mkdir(parents=True,exist_ok=True)
MANIFEST=CONTROL/"cleanup-plan.json"
def sha(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()
def inside(p,root):
    try:
        p.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False
def snapshot(root):
    files=[p for p in root.rglob("*") if p.is_file()]
    return dict(files=len(files),bytes=sum(p.stat().st_size for p in files))
def load(p):
    return json.loads(p.read_text(encoding="utf-8-sig"))

if "--apply" not in sys.argv:
    props=load(MASTER/"05_EDITING/revision-v02/REMOTION_PLAN_V02.json")
    original=copy.deepcopy(props)
    p=props["plan"]
    for shot in p["shots"]:
        for cut in shot["cuts"]:
            cut["file"]=cut["file"].replace("rough-v01/","current/")
    p["voice"]=p["voice"].replace("revision-v02/","current/")
    for s in p["sfx"]:
        s["file"]=s["file"].replace("revision-v02/","current/")
    names={Path(c["file"]).name for s in p["shots"] for c in s["cuts"]}
    tree=ast.parse((ROOT/"scripts/medieval/build-video003-v02.py").read_text(encoding="utf-8"))
    custom=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=="custom")
    custom_names={n.comparators[0].value for n in ast.walk(custom)
                  if isinstance(n,ast.Compare) and isinstance(n.left,ast.Name) and n.left.id=="name"
                  and isinstance(n.comparators[0],ast.Constant)}
    svg_names=(set(p["definitions"])-custom_names)|{"E09_before","E09_after"}
    moves=[]
    deletes={}
    writes={}
    def move(src,dst):
        src=MASTER/src
        dst=MASTER/dst
        if not src.is_file() or dst.exists():
            raise ValueError(f"Invalid move {src} -> {dst}")
        moves.append(dict(source=str(src),target=str(dst),sha256=sha(src)))
    def delete(file,reason):
        if file.is_file():
            deletes[str(file)]=dict(path=str(file),bytes=file.stat().st_size,sha256=sha(file),reason=reason)
    def remove_tree(directory,reason):
        if directory.exists():
            if not (inside(directory,MASTER) or inside(directory,ROOT/"out/medieval") or inside(directory,ROOT/"public/medieval/video003")):
                raise ValueError("Unbounded directory "+str(directory))
            for f in directory.rglob("*"):
                if f.is_file():
                    delete(f,reason)
    def write(relative,value):
        writes[str(MASTER/relative)]=value

    move("05_EDITING/revision-v02/Video003-v02-review.mp4","06_PUBLISH/Video003-v02.mp4")
    move("05_EDITING/revision-v02/audio-v02/narration-v02.wav","Audio/narration-v02.wav")
    for file in ("brush.wav","coin.wav","wood.wav","ceramic.wav"):
        move("05_EDITING/revision-v02/audio-v02/"+file,"Audio/sfx/"+file)
    move("05_EDITING/revision-v02/VIDEO003_REVISION_V02_AUDIT_VI.md","04_AUDITS/REVIEW_V02_VI.md")
    for file in ("AUDIO_AND_FONT_QA.json","CUE_AUDIT_V02.json"):
        move("05_EDITING/revision-v02/"+file,"04_AUDITS/"+file)
    review=(MASTER/"05_EDITING/revision-v02/VIDEO003_REVISION_V02_AUDIT_VI.md").read_text(encoding="utf-8")
    review=review.replace("V01, audio gốc, storyboard và asset gốc được giữ nguyên. Bản v02 là bản sửa dựng để review, chưa tự coi là bản phát hành cuối.",
        "Người dùng đã chốt v02. Sau cleanup chỉ giữ bản chốt và dữ liệu cần dựng lại; audio gốc giữ nguyên. Chưa tự động đăng YouTube.")
    review=review.replace("Manifest dựng: examples/medieval/video003-v02.json.","Plan đã chốt: ../02_PLAN/EDIT_PLAN_APPROVED.json.")
    write("04_AUDITS/REVIEW_V02_VI.md",review)
    for file in (MASTER/"05_EDITING/revision-v02/qa").glob("*"):
        move(str(file.relative_to(MASTER)),str(Path("04_AUDITS/qa")/file.name))

    delivery=load(MASTER/"05_EDITING/revision-v02/DELIVERY_V02.json")
    if sha(MASTER/"05_EDITING/revision-v02/Video003-v02-review.mp4").upper()!=delivery["sha256"].upper():
        raise ValueError("Approved video no longer matches delivery hash")
    assets=load(MASTER/"03_ASSETS/ACTIVE_ASSET_MANIFEST.json")
    old={Path(item.get("actual_path","")).name:item for item in assets["items"]}
    items=[]
    for folder in ("scene_png","reused_png"):
        for file in (MASTER/"03_ASSETS"/folder).glob("*.png"):
            if file.name not in names:
                delete(file,"image absent from approved v02")
            else:
                item={k:v for k,v in old.get(file.name,{}).items()
                      if k in ("id","dimensions","actual_dimensions","mode","visual_checks","limits","claim_ids","rights","rights_status")}
                item.update(actual_path=str(file),sha256=sha(file),status="used in user-approved v02")
                items.append(item)
    vectors=[]
    for file in (MASTER/"03_ASSETS/native_overlay").iterdir():
        if file.suffix.lower()==".svg" and file.stem in svg_names:
            vectors.append(dict(id=file.stem,file=str(file),sha256=sha(file),role="compiler source geometry; display text comes from approved native plan"))
        else:
            delete(file,"obsolete PNG text preview or unused vector")
    for name in names:
        if not any(Path(item["actual_path"]).name==name for item in items):
            raise ValueError("Unresolved approved image "+name)
    write("03_ASSETS/ACTIVE_ASSET_MANIFEST.json",json.dumps(dict(version="v02-user-approved",
        image_count=len(items),compiler_svg_count=len(vectors),native_overlay_occurrences=27,
        active_plan=str(MASTER/"02_PLAN/EDIT_PLAN_APPROVED.json"),items=items,compiler_vectors=vectors),ensure_ascii=False,indent=2))

    write("02_PLAN/EDIT_PLAN_APPROVED.json",json.dumps(props,ensure_ascii=False,indent=2))
    remove_tree(MASTER/"90_ARCHIVE","unused revision archive")
    remove_tree(MASTER/"02_PLAN","superseded storyboard and handoff")
    # The replacement plan is written after deleting obsolete files.
    for file in (MASTER/"05_EDITING").rglob("*"):
        if file.is_file() and file.name!="EDIT_TIMELINE_AUDIO_V01.json":
            delete(file,"superseded rough cut, delivery duplicate or intermediate metadata")
    remove_tree(MASTER/"01_CONTENT/rev09_chunks_v01","unused TTS paste chunks; full narration retained")
    for name in ("VOICE_REV09_READY_V01_VI.md","rev09_voice_map_v01.json"):
        delete(MASTER/"01_CONTENT"/name,"superseded voice-preparation notes")
    for name in ("QA_STATIC_V05.json","VIDEO003_READINESS_AUDIT_VI.md"):
        delete(MASTER/"04_AUDITS"/name,"superseded pre-render audit")
    delete(MASTER/"00_CONTROL/MIGRATION_REPORT.json","superseded by approved project index")
    # Remove deleted source/preview paths from the retained compiler input.
    timeline=load(MASTER/"05_EDITING/EDIT_TIMELINE_AUDIO_V01.json")
    timeline["metadata"]["role"]="source narration timing before the approved opening tempo edit"
    timeline["metadata"]["active_edit_plan"]=str(MASTER/"02_PLAN/EDIT_PLAN_APPROVED.json")
    timeline["metadata"].pop("ready_for",None)
    timeline["metadata"].pop("not_ready_for",None)
    for beat in timeline["beats"]:
        for key in ("overlay_bindings","overlay_variants","old_duration_est","status","source_scene_png_ids","source_overlay_variants","audio_edit_note","overlay_audio_note"):
            beat.pop(key,None)
        if beat["id"]=="R05V001":
            beat["scene_files"]=[str(MASTER/"03_ASSETS/scene_png/R04_OP02_01.png")]
            beat["scene_png_ids"]=["R04_OP02_01"]
        if beat["id"]=="R05V016":
            beat["prop_files"]=beat["prop_files"][:1]
            beat["prop_layer_ids"]=beat["prop_layer_ids"][:1]
        if beat["id"]=="R05V137":
            beat["prop_files"]=[]
            beat["prop_layer_ids"]=[]
    write("05_EDITING/EDIT_TIMELINE_AUDIO_V01.json",json.dumps(timeline,ensure_ascii=False,indent=2))
    qa=load(MASTER/"05_EDITING/revision-v02/FINAL_MEDIA_QA.json")
    qa["file"]=str(MASTER/"06_PUBLISH/Video003-v02.mp4")
    for key in ("cutSheets","overlaySheets"):
        qa[key]=[str(MASTER/"04_AUDITS/qa"/Path(file).name) for file in qa[key]]
    write("04_AUDITS/FINAL_MEDIA_QA.json",json.dumps(qa,ensure_ascii=False,indent=2))
    project=dict(episode="Video003",status="user-approved",approved_date="2026-10-15",
        video="06_PUBLISH/Video003-v02.mp4",video_sha256=delivery["sha256"],
        edit_plan="02_PLAN/EDIT_PLAN_APPROVED.json",script="01_CONTENT/SCRIPT_EN_REV09.md",
        voice_master="01_CONTENT/narration_rev09_v01.txt",assets="03_ASSETS/ACTIVE_ASSET_MANIFEST.json",
        source_timing="05_EDITING/EDIT_TIMELINE_AUDIO_V01.json",original_audio=delivery["sourceAudio"],
        fps=24,duration_seconds=delivery["durationSeconds"],image_count=len(items),overlays=27,sfx=9,
        remotion_project=str(ROOT),sync_command="node scripts/medieval/sync-video003-current.mjs")
    write("00_CONTROL/PROJECT.json",json.dumps(project,ensure_ascii=False,indent=2))
    write("README.md","# Video003 — bản v02 đã chốt\n\n"
        "- **Xem video:** [Video003-v02.mp4](06_PUBLISH/Video003-v02.mp4) — 9:30,3; 720p/24 fps.\n"
        "- **Nội dung:** 01_CONTENT — script REV09, narration và căn cứ.\n"
        "- **Plan dựng đang dùng:** 02_PLAN/EDIT_PLAN_APPROVED.json — 141 beat, 27 lượt overlay native.\n"
        "- **Asset:** 03_ASSETS — chỉ giữ 118 ảnh dùng trong bản chốt và SVG đầu vào cần để dựng lại.\n"
        "- **Audio:** Audio001/002 trong Audio là bản gốc; narration-v02.wav là bản dựng đã chỉnh mở đầu; SFX nằm trong Audio/sfx.\n"
        "- **Kiểm tra:** 04_AUDITS/REVIEW_V02_VI.md và 04_AUDITS/qa.\n"
        "- **Dựng lại:** project Remotion tại D:\\Youtube\\EditVideo\\Remotion; chạy node scripts/medieval/sync-video003-current.mjs trước khi mở Studio hoặc render.\n"
        "- **Chỉ mục:** 00_CONTROL/PROJECT.json. 05_EDITING giữ timing nguồn trước chỉnh tempo; không dùng nó thay plan đã chốt.\n\n"
        "Không còn archive/bản nháp cũ trong thư mục này. Video đã được người dùng chốt; chưa tự động đăng YouTube.\n")
    write("05_EDITING/README.md","Timing nguồn ở EDIT_TIMELINE_AUDIO_V01.json phục vụ compiler. Plan v02 đã chốt nằm tại ../02_PLAN/EDIT_PLAN_APPROVED.json. Media runtime trong Remotion/public/medieval/video003/current là cache có thể dựng lại bằng sync-video003-current.mjs.\n")
    write("06_PUBLISH/README.md","Video003-v02.mp4 là bản v02 người dùng đã chốt. SHA-256 và trạng thái nằm trong ../00_CONTROL/PROJECT.json. Chưa tự động đăng video.\n")

    generated=[
      ROOT/"out/medieval/revision-v02",ROOT/"out/medieval/qa-v01",
      ROOT/"public/medieval/video003/rough-v01",ROOT/"public/medieval/video003/revision-v02",
    ]
    for directory in generated:
        remove_tree(directory,"regenerable Video003 cache or intermediate render")
    for name in ("Video003-rough-v01-720p15.mp4","Video003-rough-v01-QA.md"):
        delete(ROOT/"out/medieval"/name,"superseded Video003 rough cut")
    for file in (ROOT/"examples/medieval").glob("video003-rough-v01*.json"):
        delete(file,"unused v01 renderer props")
    moved={m["source"] for m in moves}
    deletes={key:value for key,value in deletes.items() if key not in moved and key not in writes}
    plan=dict(master=str(MASTER),before=snapshot(MASTER),moves=moves,writes=writes,
              deletes=list(deletes.values()),runtime_dirs=[str(p) for p in generated],
              final_sha=delivery["sha256"],images=len(items),svg_inputs=len(vectors),
              scoped_bytes_before=snapshot(MASTER)["bytes"]+snapshot(ROOT/"public/medieval/video003")["bytes"]+snapshot(ROOT/"out/medieval")["bytes"])
    MANIFEST.write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(dict(delete_files=len(deletes),delete_GB=round(sum(d["bytes"] for d in deletes.values())/1024**3,3),
                         moves=len(moves),images=len(items),svg_inputs=len(vectors),manifest=str(MANIFEST)),indent=2))
    sys.exit()

plan=load(MANIFEST)
allow=[MASTER,ROOT/"out/medieval",ROOT/"public/medieval/video003",ROOT/"examples/medieval"]
for record in plan["deletes"]:
    file=Path(record["path"])
    if not any(inside(file,root) for root in allow) or not file.is_file() or sha(file)!=record["sha256"]:
        raise ValueError("Deletion validation failed: "+str(file))
for move in plan["moves"]:
    source,target=Path(move["source"]),Path(move["target"])
    if not inside(source,MASTER) or not inside(target,MASTER) or target.exists() or sha(source)!=move["sha256"]:
        raise ValueError("Move validation failed")
for move in plan["moves"]:
    source,target=Path(move["source"]),Path(move["target"])
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.move(str(source),str(target))
    if sha(target)!=move["sha256"]:
        raise ValueError("Move hash mismatch")
# Write approved replacements before clearing old generated runtime.
for filename,content in plan["writes"].items():
    file=Path(filename)
    if not inside(file,MASTER):
        raise ValueError("Write escapes master")
    file.parent.mkdir(parents=True,exist_ok=True)
    file.write_text(content+"\n",encoding="utf-8")
subprocess.run(["node",str(ROOT/"scripts/medieval/sync-video003-current.mjs")],cwd=ROOT,check=True)
for record in plan["deletes"]:
    file=Path(record["path"])
    # Replacements at a previously obsolete filename must survive.
    if str(file) in plan["writes"]:
        continue
    if not any(inside(file,root) for root in allow):
        raise ValueError("Delete escaped root")
    file.unlink()
for directory in [MASTER,*[Path(p) for p in plan["runtime_dirs"]]]:
    if directory.exists():
        if not any(inside(directory,root) for root in allow):
            raise ValueError("Directory escaped root")
        for sub in sorted([p for p in directory.rglob("*") if p.is_dir()],key=lambda p:len(p.parts),reverse=True):
            if not any(sub.iterdir()):
                sub.rmdir()
        if directory!=MASTER and not any(directory.iterdir()):
            directory.rmdir()
if sha(MASTER/"06_PUBLISH/Video003-v02.mp4").upper()!=plan["final_sha"].upper():
    raise ValueError("Approved video changed")
summary=dict(before=plan["before"],after=snapshot(MASTER),deleted_files=len(plan["deletes"]),
             removed_bytes=sum(r["bytes"] for r in plan["deletes"]),approved_video_sha256=plan["final_sha"],
             images=plan["images"],compiler_svg_inputs=plan["svg_inputs"],manifest=str(MANIFEST))
for _ in range(3):
    summary["net_reclaimed_bytes"]=plan["scoped_bytes_before"]-(snapshot(MASTER)["bytes"]+snapshot(ROOT/"public/medieval/video003")["bytes"]+snapshot(ROOT/"out/medieval")["bytes"])
    (MASTER/"00_CONTROL/CLEANUP_REPORT.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    summary["after"]=snapshot(MASTER)
print(json.dumps(summary,indent=2))
