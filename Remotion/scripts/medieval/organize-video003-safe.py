"""Apply the audited layout with recoverable moves only; no file deletion."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT=Path(__file__).resolve().parents[2]
MASTER=Path(r"D:\Youtube\Medieval Life Explained\videos\Video003")
HOLD=Path(r"D:\Youtube\EditVideo\_cleanup_review\Video003-20261015")
MANIFEST=ROOT/"maintenance/video003-cleanup/cleanup-plan.json"
plan=json.loads(MANIFEST.read_text(encoding="utf-8"))
def sha(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""):
            h.update(block)
    return h.hexdigest()
def inside(path,root):
    try:
        path.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False
def snapshot(root):
    files=[f for f in root.rglob("*") if f.is_file()]
    return dict(files=len(files),bytes=sum(f.stat().st_size for f in files))
def relocate(source,target,expected):
    if target.exists() or sha(source)!=expected:
        raise ValueError("Move validation failed: "+str(source))
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.move(str(source),str(target))
    if sha(target)!=expected:
        raise ValueError("Move hash mismatch: "+str(target))
if HOLD.exists():
    raise ValueError("Quarantine folder already exists")
allowed=[MASTER,ROOT/"out/medieval",ROOT/"public/medieval/video003",ROOT/"examples/medieval"]
for d in plan["deletes"]:
    file=Path(d["path"])
    if not any(inside(file,root) for root in allowed) or not file.is_file() or sha(file)!=d["sha256"]:
        raise ValueError("Inventory changed: "+str(file))
for m in plan["moves"]:
    source,target=Path(m["source"]),Path(m["target"])
    if not inside(source,MASTER) or not inside(target,MASTER) or target.exists() or sha(source)!=m["sha256"]:
        raise ValueError("Retained file move failed validation")
HOLD.mkdir(parents=True)
restorable=[]
for m in plan["moves"]:
    relocate(Path(m["source"]),Path(m["target"]),m["sha256"])
    restorable.append(dict(kind="retained-layout",**m))
for filename,content in plan["writes"].items():
    target=Path(filename)
    if not inside(target,MASTER):
        raise ValueError("Write escaped master")
    if target.exists():
        backup=HOLD/"replaced"/target.relative_to(MASTER)
        backup.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(target,backup)
        restorable.append(dict(kind="replaced-original",source=str(target),target=str(backup),sha256=sha(backup)))
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(content+"\n",encoding="utf-8")

# Relocate the existing render media cache rather than duplicating its contents.
props=json.loads((MASTER/"02_PLAN/EDIT_PLAN_APPROVED.json").read_text(encoding="utf-8"))
p=props["plan"]
media={p["voice"],*[s["file"] for s in p["sfx"]],*[c["file"] for s in p["shots"] for c in s["cuts"]]}
consumed=set()
for file in media:
    if not file.startswith("medieval/video003/current/"):
        raise ValueError("Unexpected current media path")
    relative=file.split("medieval/video003/current/",1)[1]
    old=ROOT/"public/medieval/video003"/("revision-v02" if relative.startswith("audio/") else "rough-v01")/relative
    new=ROOT/"public"/file
    if not old.is_file() or new.exists():
        raise ValueError("Runtime relocation unavailable: "+str(old))
    relocate(old,new,sha(old))
    consumed.add(str(old))
    restorable.append(dict(kind="runtime-layout",source=str(old),target=str(new),sha256=sha(new)))
subprocess.run(["node",str(ROOT/"scripts/medieval/sync-video003-current.mjs")],cwd=ROOT,check=True)
count=0
for d in plan["deletes"]:
    source=Path(d["path"])
    if str(source) in consumed:
        continue
    if not any(inside(source,root) for root in allowed):
        raise ValueError("Quarantine move escaped approved roots")
    relative=Path("project")/source.relative_to(MASTER) if inside(source,MASTER) else Path("remotion")/source.relative_to(ROOT)
    target=HOLD/relative
    if not inside(target,HOLD):
        raise ValueError("Quarantine destination escaped")
    relocate(source,target,d["sha256"])
    restorable.append(dict(kind="unused-recoverable",source=str(source),target=str(target),sha256=d["sha256"],reason=d["reason"]))
    count+=1
# Only remove empty directories left by moves; no recursive or data deletion.
for base in [MASTER,*[Path(d) for d in plan["runtime_dirs"]]]:
    if not base.exists():
        continue
    if not any(inside(base,root) for root in allowed):
        raise ValueError("Empty-directory cleanup escaped roots")
    for directory in sorted([d for d in base.rglob("*") if d.is_dir()],key=lambda d:len(d.parts),reverse=True):
        if not any(directory.iterdir()):
            directory.rmdir()
    if base!=MASTER and not any(base.iterdir()):
        base.rmdir()
if sha(MASTER/"06_PUBLISH/Video003-v02.mp4").upper()!=plan["final_sha"].upper():
    raise ValueError("Accepted video changed")
(HOLD/"RESTORE_MANIFEST.json").write_text(json.dumps(restorable,ensure_ascii=False,indent=2),encoding="utf-8")
summary=dict(before=plan["before"],after=snapshot(MASTER),quarantined_files=count,
    quarantine=str(HOLD),quarantine_stats=snapshot(HOLD),permanently_deleted_files=0,
    runtime_files_relocated=len(consumed),images=plan["images"],compiler_svg_inputs=plan["svg_inputs"],
    approved_video_sha256=plan["final_sha"])
for _ in range(3):
    (MASTER/"00_CONTROL/CLEANUP_REPORT.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    summary["after"]=snapshot(MASTER)
print(json.dumps(summary,indent=2))
