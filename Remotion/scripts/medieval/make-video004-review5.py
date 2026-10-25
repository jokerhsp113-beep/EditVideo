"""Derive a five-fps viewing copy from the editable 30-fps Video004 animatic."""
import copy
import json
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCE = ROOT / "examples/medieval/video004-animatic-v01.props.json"
TARGET = ROOT / "examples/medieval/video004-animatic-v01-review5.props.json"
data = copy.deepcopy(json.loads(SOURCE.read_text(encoding="utf-8")))
episode = data["episode"]
old_fps, new_fps = episode["fps"], 5
def scaled(frame):
    return round(frame * new_fps / old_fps)
episode["fps"] = new_fps
episode["durationInFrames"] = math.ceil(458.16163265306125 * new_fps)
episode["version"] = "animatic-v01-review5"
for shot in episode["shots"]:
    shot["fromFrame"] = scaled(shot["fromFrame"])
    for layer in shot["layers"]:
        for key in ("fromFrame", "untilFrame", "enterFrames"):
            if key in layer:
                layer[key] = max(1,scaled(layer[key]))
        if "motion" in layer:
            layer["motion"]["durationFrames"] = max(1,scaled(layer["motion"]["durationFrames"]))
        for point in layer.get("keyframes",[]):
            point["frame"]=scaled(point["frame"])
for audio in episode["audio"]:
    audio["fromFrame"]=scaled(audio["fromFrame"])
    audio["durationFrames"]=episode["durationInFrames"]
    audio["trimBeforeFrames"]=scaled(audio["trimBeforeFrames"])
    audio["fadeFrames"]=scaled(audio["fadeFrames"])
TARGET.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
print(TARGET,episode["durationInFrames"],len(episode["shots"]))
