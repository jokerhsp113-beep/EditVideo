"""Build an audio-duration-based Video004 review animatic from the current storyboard.

No ASR or listening alignment is implied. Scene/beat cuts are proportional to spoken
word counts, then adjusted by watching the resulting video.
"""
import json
import math
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parents[2]
EP = pathlib.Path(r"D:\Youtube\Medieval Life Explained\videos\Video004")
PUBLIC = ROOT / "public" / "medieval" / "video004-animatic-v01"
OUT = ROOT / "examples" / "medieval" / "video004-animatic-v01.props.json"
BOARD = json.loads((EP / "production" / "STORYBOARD_CURRENT.json").read_text(encoding="utf-8"))
MANIFEST = json.loads((EP / "production" / "ASSET_MANIFEST_CURRENT.json").read_text(encoding="utf-8"))
FPS = 30
AUDIO_SECONDS = 458.16163265306125  # music-metadata duration used by Remotion preflight
FRAMES = math.ceil(AUDIO_SECONDS * FPS)

# Full-frame cutaways from the V04 expansion. Seven V04 files with located QA
# failures are excluded from this review cut.
NEW = {
    "PEWTER_WORKBENCH_DUSK": "PEWTER_WORKBENCH_DUSK_v01.png",
    "FORGE_SMOKE_ROOM": "FORGE_SMOKE_ROOM_v01.png",
    "CARE_CRADLE_CLOSE": "CARE_CRADLE_CLOSE_v01.png",
    "TAVERN_CLOSE_DOOR": "TAVERN_CLOSE_DOOR_v01.png",
    "FORGE_STRIKE_CLOSE": "FORGE_STRIKE_CLOSE_v01.png",
    "MUSIC_INDOOR_GROUP": "MUSIC_INDOOR_GROUP_v02.png",
    "RUSHLIGHT_LIT_CLOSE": "RUSHLIGHT_LIT_CLOSE_v01.png",
    "BOWL_TABLE_USE": "BOWL_TABLE_USE_v01.png",
    "BOWL_WORKER_INSPECT": "BOWL_WORKER_INSPECT_v01.png",
    "HOME_LIGHT_MATERIALS": "HOME_LIGHT_MATERIALS_v01.png",
    "PEWTER_TASK_STOP_CLOSE": "PEWTER_TASK_STOP_CLOSE_v01.png",
    "FORGE_NEIGHBOUR_LISTEN": "FORGE_NEIGHBOUR_LISTEN_v01.png",
    "TAVERN_DOOR_CLOSED": "TAVERN_DOOR_CLOSED_v01.png",
}
OLD = {
    a["id"]: a for a in MANIFEST["assets"]
    if a.get("kind") != "native" and a.get("status") == "generated-pending-composite"
}
ASSETS = {}

def asset(asset_id):
    if asset_id in ASSETS:
        return
    if asset_id in NEW:
        source = EP / "production" / "asset-expansion-v04" / "assets" / NEW[asset_id]
    elif asset_id in OLD:
        source = pathlib.Path(OLD[asset_id]["actualPath"])
    else:
        raise ValueError(f"Asset is not in the review-eligible draft list: {asset_id}")
    if not source.is_file():
        raise FileNotFoundError(source)
    target = PUBLIC / source.name
    PUBLIC.mkdir(parents=True, exist_ok=True)
    if not target.exists() or target.stat().st_size != source.stat().st_size:
        shutil.copy2(source, target)
    ASSETS[asset_id] = {
        "id": asset_id, "file": f"medieval/video004-animatic-v01/{source.name}",
        "version": source.stem.rsplit("_", 1)[-1], "status": "draft",
        "rights": "unresolved", "role": "Video004 review animatic"
    }

def image(asset_id, *, x=960, y=540, w=1920, h=1080, z=0, delay=0, fade=0):
    asset(asset_id)
    layer = {
        "id": f"image-{asset_id}-{z}-{delay}", "kind": "image", "assetId": asset_id,
        "x": x, "y": y, "width": w, "height": h, "z": z,
    }
    if delay:
        layer["fromFrame"] = delay
    if fade:
        layer["enter"] = "fade"
        layer["enterFrames"] = fade
    return layer

def native(native_id, text, *, x=960, y=540, w=1450, h=840, z=2, delay=0):
    layer = {
        "id": f"native-{native_id}-{z}-{delay}", "kind": "native",
        "nativeId": native_id, "x": x, "y": y,
        "width": w, "height": h, "z": z
    }
    if text:
        layer["text"] = text
    if delay:
        layer["fromFrame"] = delay
        layer["enter"] = "fade"
        layer["enterFrames"] = 7
    return layer

def guide(pose, bg="BG_SHOP", native_id=None, words="", *, side="left"):
    layers = [image(bg)]
    cx = 430 if side == "left" else 1485
    layers.append(image(pose, x=cx, y=620, w=660, h=920, z=2))
    if native_id:
        nx = 1300 if side == "left" else 610
        layers.append(native(native_id, words, x=nx, y=475, w=900, h=600, z=3, delay=8))
    return layers

def diagram(native_id, words, *, bg=None):
    layers = [image(bg or "BG_SHOP")]
    # Keep the scene visible around a readable editorial insert.
    layers.append({"id": "diagram-wash", "kind": "rect", "x": 960, "y": 540,
                   "width": 1640, "height": 930, "z": 1, "color": "#F4EDE1EE"})
    layers.append(native(native_id, words, w=1360, h=800, z=2))
    return layers

def full(asset_id):
    return [image(asset_id)]

def object_on_bg(asset_id, bg="BG_SHOP", *, native_id=None, words=""):
    layers = [image(bg), image(asset_id, x=930, y=570, w=1050, h=930, z=2)]
    if native_id:
        layers.append(native(native_id, words, x=1350, y=450, w=850, h=560, z=3, delay=8))
    return layers

# One visual state per authored beat. Reuse is deliberate when a concept needs a
# hold; no disallowed V03/V04 draft is silently promoted.
V = {
 "S001":[full("HOME_LIGHT_MATERIALS"),guide("C_PUTDOWN","BG_SHOP")],
 "S002":[guide("C_LOOK_SUN","BG_SHOP","N_SUN"),guide("C_HOPE","BG_SHOP","N_SUN")],
 "S003":[guide("C_HOPE","BG_SHOP","N_RELATION","LESS LIGHT|MORE FREE TIME?"),full("BOWL_TABLE_USE"),guide("C_COMPARE","BG_SHOP","N_RELATION","TASK STOPS|TIME IS YOURS?")],
 "S004":[full("PEWTER_WORKBENCH_DUSK"),full("CARE_CRADLE_CLOSE"),full("MUSIC_INDOOR_GROUP")],
 "S005":[full("HOME_LIGHT_MATERIALS"),diagram("N_RUSH_PROCESS","RUSH|FAT|HOLDER"),object_on_bg("PROP_RUSH_PREPARED","BG_SHOP"),full("RUSHLIGHT_LIT_CLOSE")],
 "S006":[guide("C_LOOK_RUSH","BG_SHOP"),guide("C_INGREDIENTS","BG_SHOP","N_RUSH_PROCESS","RUSH|FAT|HOLDER"),guide("C_RUSH_GRIP","BG_SHOP","N_LIGHT_FX")],
 "S007":[full("RUSHLIGHT_LIT_CLOSE"),object_on_bg("PROP_TALLOW","BG_SHOP"),object_on_bg("PROP_BEESWAX","BG_SHOP"),guide("C_COMPARE","BG_SHOP","N_SCOPE","DIFFERENT MATERIALS|DIFFERENT ACCESS")],
 "S008":[full("BOWL_TABLE_USE"),full("BOWL_WORKER_INSPECT")],
 "S009":[full("PEWTER_WORKBENCH_DUSK"),diagram("N_RULE","LONDON PEWTERERS|1348 RULE|DAYLIGHT"),full("BOWL_WORKER_INSPECT"),full("PEWTER_TASK_STOP_CLOSE"),guide("C_RULE_PROUD","BG_SHOP","N_RELATION","ONE CRAFT TASK|NOT ALL NIGHT WORK")],
 "S010":[full("FORGE_STRIKE_CLOSE"),diagram("N_FORGE_SOUND","FORGE|NEIGHBOUR"),full("FORGE_NEIGHBOUR_LISTEN"),full("FORGE_SMOKE_ROOM"),guide("C_NOISE_REACT","BG_FORGE")],
 "S011":[full("FORGE_NEIGHBOUR_LISTEN"),full("FORGE_SMOKE_ROOM"),diagram("N_HOUSE","FORGE|NEIGHBOUR")],
 "S012":[full("FORGE_STRIKE_CLOSE"),diagram("N_SCOPE","CRAFTSMEN ARGUED|NOT COURT FINDING"),guide("C_COMPARE","BG_FORGE")],
 "S013":[full("FORGE_NEIGHBOUR_LISTEN"),full("FORGE_SMOKE_ROOM"),guide("C_LIGHT_ON","BG_SHOP"),full("CARE_CRADLE_CLOSE")],
 "S014":[full("CARE_CRADLE_CLOSE"),object_on_bg("CARE_A","BG_CARE"),diagram("N_SCOPE","PIERS PLOWMAN|POEM, NOT CENSUS")],
 "S015":[full("CARE_CRADLE_CLOSE"),object_on_bg("CARE_A","BG_CARE"),object_on_bg("CARE_B","BG_CARE"),guide("C_SERIOUS","BG_CARE","N_CARE_TIME","WORK|NIGHT CARE|REST")],
 "S016":[guide("C_NEUTRAL","BG_SHOP","N_MUSIC_SWAP","WORKPLACE|GATHERING"),full("MUSIC_INDOOR_GROUP")],
 "S017":[full("MUSIC_INDOOR_GROUP"),diagram("N_SCOPE","OXFORD|1306 INQUEST"),full("MUSIC_INDOOR_GROUP"),guide("C_LISTEN","BG_SHOP","N_MUSIC_SWAP","TAILORS|MUSIC")],
 "S018":[full("MUSIC_INDOOR_GROUP"),object_on_bg("MUSIC_COMPANIONS","BG_STREET"),guide("C_HARP_REALISE","BG_STREET")],
 "S019":[object_on_bg("MUSIC_COMPANIONS","BG_STREET"),diagram("N_SCOPE","THEY EXPECTED|AN EMPTY STREET"),guide("C_LISTEN","BG_STREET"),diagram("N_RELATION","ONE GROUP|NOT A WHOLE TOWN")],
 "S020":[guide("C_SERIOUS","BG_STREET"),diagram("N_SCOPE","INQUEST|LATER VIOLENCE"),full("BG_MEADOW")],
 "S021":[full("BG_MEADOW"),guide("C_POINT_MEADOW","BG_MEADOW"),diagram("N_WATCH_DUTY","WATCHING MEADOWS",bg="BG_MEADOW"),full("BG_MEADOW"),diagram("N_RELATION","FESTIVAL NIGHT|NIGHT DUTY",bg="BG_MEADOW")],
 "S022":[full("MUSIC_INDOOR_GROUP"),diagram("N_RELATION","MUSIC|WATCHING")],
 "S023":[full("BG_MEADOW"),diagram("N_SCOPE","INQUEST RECORD|ONE PERSON'S MOVEMENTS",bg="BG_MEADOW"),guide("C_NEUTRAL","BG_MEADOW")],
 "S024":[guide("C_LIGHT","BG_STREET"),diagram("N_RULE","LONDON CURFEW|CONDITIONAL TRAVEL")],
 "S025":[guide("C_LIGHT_QUERY","BG_STREET"),diagram("N_CONDITION_GATE","LIGHT|REASON|REPUTATION"),guide("C_LIGHT_QUERY","BG_STREET")],
 "S026":[diagram("N_CONDITION_GATE","LIGHT|REASON|REPUTATION"),diagram("N_RELATION","AWAKE|ALLOWED OUT?")],
 "S027":[full("TAVERN_CLOSE_DOOR"),full("TAVERN_DOOR_CLOSED")],
 "S028":[full("TAVERN_DOOR_CLOSED"),diagram("N_WATCH_DUTY","WARD WATCH WHEN NECESSARY",bg="BG_STREET"),diagram("N_RULE","RULE|NOT PROOF OF COMPLIANCE",bg="BG_STREET"),full("MUSIC_INDOOR_GROUP"),diagram("N_RELATION","LONDON RULES|OXFORD EVENT",bg="BG_STREET")],
 "S029":[full("BOWL_TABLE_USE"),guide("C_COMPARE","BG_SHOP"),diagram("N_RELATION","LESS LIGHT|NOT ALWAYS LEISURE")],
 "S030":[diagram("N_RECAP","CARE|WATCH|FORGE|MUSIC"),full("MUSIC_INDOOR_GROUP")],
 "S031":[diagram("N_SCOPE","CASES, NOT A COUNT OF EVERYONE"),guide("C_NEUTRAL","BG_SHOP")],
 "S032":[guide("C_LOOK_SUN","BG_SHOP","N_SUN"),guide("C_CHECK_SELF","BG_SHOP")],
}

beats = [(scene, beat) for scene in BOARD["scenes"] for beat in scene["beats"]]
if len(beats) != 99 or any(len(V[s["id"]]) != len(s["beats"]) for s in BOARD["scenes"]):
    raise ValueError("The 99 authored beats and visual-state matrix disagree")
weights = [max(1, int(b.get("estimatedWords", len(b["narration"].split())))) for _,b in beats]
total = sum(weights)
starts = [0]
running = 0
for w in weights[:-1]:
    running += w
    starts.append(round(running / total * FRAMES))
if len(set(starts)) != len(starts) or starts[-1] >= FRAMES:
    raise ValueError("Invalid beat timing")

shots = []
idx = 0
for scene in BOARD["scenes"]:
    for pos, beat in enumerate(scene["beats"]):
        shots.append({
            "id": beat["id"], "fromFrame": starts[idx],
            "background": "#F4EDE1", "layers": V[scene["id"]][pos],
            "note": f"Review animatic; estimated cut from Audio001 duration and script words. {beat['viewerChangeVI']}"
        })
        idx += 1

audio_src = EP / "audio" / "Audio001.mp3"
PUBLIC.mkdir(parents=True, exist_ok=True)
shutil.copy2(audio_src, PUBLIC / "Audio001.mp3")
episode = {
    "id": "video004-animatic-v01", "version": "animatic-v01",
    "scriptVersion": "V06", "planVersion": "V04", "width": 1920, "height": 1080,
    "fps": FPS, "durationInFrames": FRAMES, "timingBasis": "estimated", "words": [],
    "assets": list(ASSETS.values()),
    "audio": [{
        "id": "Audio001", "file": "medieval/video004-animatic-v01/Audio001.mp3",
        "role": "voice", "fromFrame": 0, "durationFrames": FRAMES,
        "trimBeforeFrames": 0, "volume": 1, "fadeFrames": 0,
        "loop": False, "rights": "unresolved"
    }],
    "shots": shots
}
OUT.write_text(json.dumps({"episode": episode}, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"props": str(OUT), "frames": FRAMES, "seconds": FRAMES/FPS,
                  "shots": len(shots), "assets": len(ASSETS),
                  "visualBeatCoverage": len(V)}, ensure_ascii=False))
