"""Compile the Video003 native edit from retained source timing and SVG geometry."""
import collections
import json
import math
from pathlib import Path
import random
import re
import struct
import wave
import xml.etree.ElementTree as ET
from PIL import ImageFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(r"D:\Youtube\Medieval Life Explained\videos\Video003")
OUT = ROOT / "public/medieval/video003/current"
OUT.mkdir(parents=True, exist_ok=True)
TL = json.loads((SOURCE / "05_EDITING/EDIT_TIMELINE_AUDIO_V01.json").read_text(encoding="utf-8"))
BEATS = {int(b["id"][-3:]): b for b in TL["beats"]}
FPS = 24
SPEED_END = 32.94
SPEED = 1.07
SHIFT = SPEED_END - SPEED_END / SPEED
def time(t):
    return t / SPEED if t <= SPEED_END else t - SHIFT
def frame(t):
    return round(time(t) * FPS)
def norm(s):
    aliases = {"hue": "hugh", "favourable": "favorable"}
    return [aliases.get(token, token) for token in re.findall(r"[a-z0-9]+", s.lower().replace("’", "'"))]

raw_asr = json.loads((SOURCE / "04_AUDITS/ASR_RAW_V01.json").read_text(encoding="utf-8"))
WORDS = []
offset = 0
for audio in raw_asr:
    for word in audio["words"]:
        for token in norm(word["word"]):
            WORDS.append((token, word["start"] + offset, word["end"] + offset))
    offset += audio["duration_seconds"]

def cue(beat_number, phrase):
    beat = BEATS[beat_number]
    wanted = norm(phrase)
    hits = []
    for i in range(len(WORDS) - len(wanted) + 1):
        if beat["timeline_start"] - .12 <= WORDS[i][1] < beat["timeline_end"]:
            if [w[0] for w in WORDS[i:i+len(wanted)]] == wanted:
                hits.append(WORDS[i][1])
    if len(hits) != 1:
        raise ValueError(f"Cue {beat_number} {phrase!r}: {hits}")
    return hits[0]

FONT_PATH = ROOT / "public/fonts/PatrickHand-Regular.ttf"
def font(size):
    return ImageFont.truetype(str(FONT_PATH), int(size))
def measure(s, size):
    return font(size).getlength(s)
def wrap(s, size, max_width):
    result = []
    for paragraph in s.split("\n"):
        line = ""
        for word in paragraph.split():
            candidate = (line + " " + word).strip()
            if line and measure(candidate, size) > max_width:
                result.append(line)
                line = word
            else:
                line = candidate
        result.append(line)
    return result

TEXT = {
 "Your work": "Your work",
 "Work owed elsewhere": "Work owed",
 "Household needs": "Your household",
 "Alwalton, 1279 — autumn requirement": "Alwalton 1279\nAutumn obligation",
 "Alwalton, 1279 — one recorded holding": "Alwalton 1279\nOne recorded holding",
 "Recorded case — Hugh Cross": "Hugh Cross\nA recorded case",
 "West Cotton — pot residues; not everyone’s daily menu": "West Cotton\nPot evidence, not a daily menu",
 "Famine comparison — 1315 / 1316 examples": "Famine 1315 and 1316\nA crisis, not every year",
 "Reconstructed scene — one possible life": "Medieval England\nOne reconstructed life",
 "Stanton, 1341 — separate recorded agreement": "Stanton 1341\nA separate agreement",
 "Recorded case — Walter Hull": "Walter Hull\nA recorded case",
 "Shared space; different uses": "One room, several uses",
 "Household paperwork": "Part of the dues",
 "Chickens not consulted": "Nobody asked the chickens",
 "Ground + seed": "Prepare and sow",
 "Growing crop": "Grow and harvest",
 "Different tasks as the crop changes": "The crop changes the job",
 "Legal position": "Legal status",
 "They are not the same scale": "Wealth and freedom can differ",
 "Illustrative quantities": "Illustration, not measured amounts",
 "Seed used now needs replacing before sowing": "Replace before sowing",
 "Seed moved into today’s food": "Seed used for food",
 "Hugh’s recorded dues — not every household": "Hugh's recorded dues",
 "Each year: 3 hens + 1 rooster": "Each year\n3 hens + 1 rooster",
 "At Easter: 5 eggs": "At Easter\n5 eggs",
 "Claims did not require a castle and sword": "A lord could also be an abbot",
 "Money received → provide for another batch": "Pay for the next batch first",
 "Illustrative purchasing power": "Illustrative comparison",
 "Qualitative; not measured ratios": "Illustration, not measured ratios",
 "April 1316 — the king complained of withheld stocks": "April 1316\nThe king's complaint",
 "Grain present; not offered for sale": "Grain in store\nNot offered for sale",
 "The chronicler described hunger and deaths": "The writer also recorded deaths",
 "Home, crop, familiar support": "Home, crop, people you know",
 "Walter Hull: payment and guarantors; one recorded case": "Walter Hull\nPayment and guarantors",
 "Work or support waiting?": "Work or support waiting?",
 "Without it:": "Without support",
 "the next meal is not yet secured": "The next meal is uncertain",
 "Hugh Cross — a limited claim upheld": "Hugh Cross\nA limited claim upheld",
 "Bank and hedge; not every obligation": "Bank and hedge\nOther obligations remained",
 "Holding / future tenancy": "Land and future tenancy",
 "Support / shared goods": "Support and shared goods",
 "Conditions depend on the agreement": "Terms varied by agreement",
}

def card(x, y, text, size=54, max_width=900):
    lines = wrap(text, size, max_width - 48)
    width = max(measure(line, size) for line in lines) + 48
    height = len(lines) * size * 1.12 + 30
    x = max(36, min(x, 1884-width))
    y = max(30, min(y, 1035-height))
    return dict(x=round(x,2), y=round(y,2), width=round(width,2),
                height=round(height,2), lines=lines, size=size)

def arrow(x1, y1, x2, y2, color="#203e52"):
    return dict(x1=x1,y1=y1,x2=x2,y2=y2,color=color)

def custom(name):
    if name == "E01_intro":
        return dict(cards=[card(75,180,"Work owed",64,550)],arrows=[],raw="")
    if name == "E01_effort_recipients":
        return dict(cards=[card(803,690,"Your work"), card(130,890,"Work owed"),
                           card(1260,890,"Your household")],
                    arrows=[arrow(850,800,410,875),arrow(1090,800,1450,875)],raw="")
    if name == "E03_one_hugh":
        return dict(cards=[card(1210,240,"Only one Hugh",66,650)], arrows=[], raw="")
    if name == "E02_week":
        return dict(cards=[card(60,45,"Alwalton 1279\nOne recorded holding",48,620),
                           card(1180,180,"3 days each week",64,680),
                           card(1150,290,"Some holiday weeks exempt",44,710)],
                    arrows=[],raw="")
    if name == "E02_autumn":
        return dict(cards=[card(60,45,"Alwalton 1279\nAutumn obligation",48,620),
                           card(1330,180,"2 workers",70,530)],arrows=[],raw="")
    if name == "E13_power_relation":
        return dict(cards=[card(1060,140,"Pay can rise",58,640),
                           card(1060,390,"Grain prices\nrise faster",58,640),
                           card(1060,730,"More money\nLess grain",64,710),
                           card(1060,970,"Illustrative relationship",40,760)],
                    arrows=[arrow(1790,300,1790,165),arrow(1790,590,1790,455,"#8d3429")],
                    raw='<rect x="940" y="0" width="980" height="1080" fill="#fff5df"/>')
    if name == "E07_crop_states":
        return dict(cards=[card(70,35,"Prepare and sow",56,650),
                           card(1200,35,"Grow and harvest",56,650),
                           card(70,890,"The crop changes the job",48,950)],
                    arrows=[arrow(560,95,1170,95)],raw="")
    if name == "E08_resources_status":
        return dict(cards=[card(60,45,"Wealth and freedom can differ",54,1000)],arrows=[],raw="")
    if name == "E04_diet":
        return dict(cards=[card(55,835,"West Cotton\nPot evidence, not a daily menu",48,1000)],arrows=[],raw="")
    if name == "E16_portable":
        return dict(cards=[card(60,820,"Can carry\nBelongings in the bundle",54,850),
                           card(60,40,"Left behind\nHome, crop, people you know",50,780)],arrows=[],raw="")
    if name == "E10_hugh_produce":
        return dict(cards=[card(55,40,"Hugh's recorded dues",52,620),
                           card(55,175,"Each year\n3 hens + 1 rooster",52,570),
                           card(55,365,"At Easter\n5 eggs",52,570)],arrows=[],raw="")
    if name == "E19_limited_right":
        return dict(cards=[card(680,35,"Hugh Cross\nA limited claim upheld",50,650),
                           card(1010,850,"Bank and hedge\nOther obligations remained",48,800)],
                    arrows=[],raw="")
    if name == "E17_location_services":
        return dict(cards=[card(65,55,"New address",60,610),
                           card(1180,55,"Services still owed",60,680),
                           card(65,855,"Walter Hull\nPayment and guarantors",46,780)],
                    arrows=[arrow(760,105,1130,105)],raw="")
    return None

def compile_overlay(name):
    result = custom(name)
    if result:
        return result
    source = SOURCE / "03_ASSETS/native_overlay" / (name + ".svg")
    root = ET.fromstring(source.read_text(encoding="utf-8"))
    elements = list(root.iter())
    tag = lambda e: e.tag.split("}")[-1]
    rects = [e for e in elements if tag(e) == "rect"]
    texts = [e for e in elements if tag(e) == "text"]
    assigned = collections.defaultdict(list)
    for text in texts:
        x,y = float(text.get("x")), float(text.get("y"))
        candidates = []
        for i,r in enumerate(rects):
            rx,ry,rw,rh = [float(r.get(k,0)) for k in ("x","y","width","height")]
            if rx <= x <= rx+rw and ry <= y <= ry+rh:
                candidates.append((rw*rh,i))
        if not candidates:
            raise ValueError(f"{name}: no card for {text.text}")
        assigned[min(candidates)[1]].append(text)
    cards = []
    for i,entries in assigned.items():
        r = rects[i]
        entries.sort(key=lambda e: float(e.get("y")))
        # Paper labels hold concise display copy, never editorial prose.
        text = "\n".join(TEXT.get(e.text,e.text) for e in entries)
        size = max(44, min(58, max(float(e.get("font-size",44)) for e in entries)+4))
        cards.append(card(float(r.get("x")),float(r.get("y")),text,size,
                          min(1250,1884-float(r.get("x")))))
    arrows = []
    for line in [e for e in elements if tag(e)=="line"]:
        x1,y1,x2,y2 = [float(line.get(k)) for k in ("x1","y1","x2","y2")]
        arrows.append(arrow(x1,y1,x2,y2))
    # Preserve authored grain/token geometry; old arrowheads/cards are replaced.
    raw = []
    moving = []
    for e in elements:
        if tag(e) in ("ellipse","circle","path") or (tag(e)=="rect" and e not in [rects[i] for i in assigned]):
            copy = ET.fromstring(ET.tostring(e))
            copy.tag = tag(copy)
            markup = ET.tostring(copy,encoding="unicode")
            if name == "E09_transfer" and copy.get("id","").startswith("actual_g") and 40 <= int(copy.get("id")[-3:]) < 60:
                moving.append(markup)
            else:
                raw.append(markup)
    particles=[]
    if name == "E09_transfer":
        states=[]
        for state in ("E09_before","E09_after"):
            parsed=ET.fromstring((SOURCE/"03_ASSETS/native_overlay"/(state+".svg")).read_text(encoding="utf-8"))
            states.append({e.get("id"):e for e in parsed.iter() if tag(e)=="ellipse"})
        for index in range(40,60):
            identifier=f"actual_g{index:03}"
            before,after=states[0][identifier],states[1][identifier]
            particles.append(dict(x1=float(before.get("cx")),y1=float(before.get("cy")),
                                  x2=float(after.get("cx")),y2=float(after.get("cy"))))
        fixed=[(float(e.get("cx")),float(e.get("cy"))) for e in elements
               if tag(e)=="ellipse" and not 40 <= int(e.get("id")[-3:]) < 60]
        for state_number in (0,1):
            key1,key2=("x1","y1") if state_number==0 else ("x2","y2")
            actual=fixed+[(p[key1],p[key2]) for p in particles]
            expected=[(float(e.get("cx")),float(e.get("cy"))) for e in states[state_number].values()]
            if len(actual)!=80 or len(set(actual))!=80 or set(actual)!=set(expected):
                raise ValueError("Seed transfer must conserve 80 distinct illustrative tokens")
    return dict(cards=cards,arrows=arrows,raw="".join(raw),particles=particles)

# Each entry has an explicit narrative reason and a spoken cue. No blanket
# percentage-of-beat reveal is used. End beat means the end of that beat.
SCHEDULE = [
 (2,"E01_intro","owed elsewhere",2,"Name the competing claim briefly; reserve the full diagram for its explanation"),
 (3,"E02_week","one English record",3,"Locate the case; preserve the holiday qualification"),
 (4,"E02_autumn","In autumn",5,"Hold the worker requirement against the single farmer's own field"),
 (6,"E03_one_hugh","only one Hugh",6,"Pay off spare-Hugh joke without the unrelated dummy"),
 (9,"E04_reconstruction","one possible life",10,"Identify reconstruction once before the life story"),
 (20,"E05_shared_space","moves out of the way",20,"Summarize the room reuse only after it is demonstrated"),
 (32,"E07_crop_states","work that changes",33,"Connect different jobs to the crop cycle"),
 (50,"E08_resources_status","same land",50,"Distinguish resources from legal status"),
 (51,"E01_effort_recipients","household",52,"Return to who receives the work, once across the pair"),
 (60,"E04_diet","West Cotton",60,"Keep the material evidence and its limit visible"),
 (64,"E09_before","grain for sowing",64,"Distinguish the seed reserve from food"),
 (66,"E10_hugh_produce","three hens",66,"Show the recorded quantities rather than a prose sentence"),
 (68,"E11_abbot_claims","abbot",69,"Identify the lord without a castle stereotype"),
 (71,"E09_transfer","grain kept for sowing",71,"Show the reserve being used for food"),
 (72,"E09_after","replace that grain",73,"Hold the resulting shortfall without restarting the card"),
 (82,"E12_sale_inputs","another batch",83,"Make the next-batch allocation visible"),
 (90,"E04_famine","famine",92,"Clearly label the crisis comparison, once"),
 (95,"E13_power_relation","wages could rise",96,"Compare directions without inventing measured ratios"),
 (99,"E13_shortfall","what you can bring home",99,"Give the comparison the whole clause, not only its last words"),
 (100,"E14_not_offered","holding them back",102,"Distinguish grain present from grain offered for sale"),
 (108,"E16_portable","belongings",109,"Contrast portable goods with support left behind"),
 (111,"E17_location_services","Walter Hull",112,"Keep this separate recorded case identifiable"),
 (116,"E18_conditions","next meal",118,"Ask the practical support question only when narration reaches it"),
 (122,"E19_limited_right","Hugh Cross",123,"Show what the legal victory actually covered"),
 (127,"E20_support","support in return",128,"Explain the exchange of tenancy and support"),
 (129,"E04_stanton","Stanton",129,"Locate the later-life agreement"),
 (130,"E20_support","responsibilities",130,"Relate the successor's work to future tenancy"),
]
OVERLAYS = []
overlay_defs = {}
for beat_number,name,phrase,last,reason in SCHEDULE:
    start = cue(beat_number,phrase)
    end = BEATS[last]["timeline_end"]
    if end-start < 1.6:
        # Reveal up to 250ms before the phrase so a compact label has reading time.
        start = max(BEATS[beat_number]["timeline_start"],start-.25)
    overlay_defs.setdefault(name,compile_overlay(name))
    OVERLAYS.append(dict(id=f"{BEATS[beat_number]['id']}-{name}",variant=name,
        start=frame(start),end=frame(end),cue=phrase,sourceSeconds=start,reason=reason))

# Stagger the numerical details against the corresponding words, rather than
# exposing all of the evidence card at its first entrance.
for overlay in OVERLAYS:
    if overlay["variant"]=="E02_week":
        overlay["cardDelays"]=[0,frame(cue(3,"three days"))-overlay["start"],
                               frame(cue(3,"holiday weeks"))-overlay["start"]]
    if overlay["variant"]=="E02_autumn":
        overlay["cardDelays"]=[0,frame(cue(4,"two workers"))-overlay["start"]]
    if overlay["variant"]=="E10_hugh_produce":
        overlay["cardDelays"]=[0,0,max(0,frame(cue(66,"five eggs")-.4)-overlay["start"])]
    if overlay["variant"]=="E13_power_relation":
        price = frame(cue(95,"grain prices"))-overlay["start"]
        result = frame(cue(96,"More money"))-overlay["start"]
        overlay["cardDelays"]=[0,price,result,0]
        overlay["arrowDelays"]=[0,price]
    if overlay["variant"]=="E18_conditions":
        overlay["cardDelays"]=[0,frame(cue(118,"Without it"))-overlay["start"]]
    if overlay["variant"]=="E16_portable":
        overlay["cardDelays"]=[0,frame(cue(109,"The crop"))-overlay["start"]]
    if overlay["variant"]=="E12_sale_inputs":
        remainder=frame(cue(83,"What remains"))-overlay["start"]
        overlay["cardDelays"]=[0,0,0,remainder]
        overlay["arrowDelays"]=[0,remainder]
    if overlay["variant"]=="E19_limited_right":
        overlay["cardDelays"]=[0,frame(cue(122,"bank and hedge"))-overlay["start"]]

SHOTS = []
for i,beat in enumerate(TL["beats"]):
    number = i+1
    start = frame(beat["timeline_start"])
    end = frame(TL["beats"][i+1]["timeline_start"]) if i+1<len(TL["beats"]) else math.ceil(time(TL["metadata"]["total_audio_seconds"])*FPS)
    files = list(beat["scene_files"])
    if number == 1:
        files = [str(SOURCE/"03_ASSETS/scene_png/R04_OP02_01.png")]
    if number == 6:
        files = [str(SOURCE/"03_ASSETS/scene_png/R04_OP04_01.png"),
                 str(SOURCE/"03_ASSETS/scene_png/R04_OP04_02.png")]
    # Toy closeups are inserts, never four equally short cuts in a 4.7s clause.
    if number == 16:
        files = files[:1] + list(beat["prop_files"])[:1]
    elif number == 137:
        # The callback is already in the household scene; standalone toy props
        # no longer interrupt the final reflection.
        pass
    else:
        files += list(beat["prop_files"])
    files += list(beat["existing_files"])
    cuts = []
    for j,filename in enumerate(files):
        original = Path(filename)
        category = "gag" if "reused_png" in filename else "scene"
        relative = f"medieval/video003/current/{category}/{original.name}"
        if not (ROOT/"public"/relative).exists():
            raise ValueError(f"Missing staged scene {relative}")
        a = start+round(j*(end-start)/len(files))
        b = start+round((j+1)*(end-start)/len(files))
        cuts.append(dict(file=relative,start=a,end=b,scale=1,x=50,y=50,motion=0))
    # Located framing changes explain the spoken object/reaction. No perpetual
    # whole-video zoom and no fake movement of a flattened character.
    framing = {
      1:(1.09,48,63,.018),3:(1.045,37,52,.025),4:(1.025,48,52,.018),
      5:(1.08,41,48,.015),6:(1.15,36,41,0),11:(1.035,43,52,.022),
      23:(1.08,45,61,.02),35:(1.10,48,65,0),38:(1.06,50,62,.025),
      40:(1.04,55,63,.025),43:(1.14,39,38,.012),44:(1.14,39,38,0),
      67:(1.10,49,49,.018),75:(1.07,50,55,.015),81:(1.10,55,65,.02),
      84:(1.04,50,50,.015),97:(1.07,55,52,.02),107:(1.08,52,62,.025),
      140:(1.08,37,63,.018),141:(1.04,40,59,0),
    }
    if number in framing:
        scale,x,y,motion=framing[number]
        for cut in cuts:
            cut.update(scale=scale,x=x,y=y,motion=motion)
    SHOTS.append(dict(id=beat["id"],start=start,end=end,cuts=cuts,
                      spoken=beat["spoken_span"],section=beat["section"]))

# Original restrained sound design: transient cues mark physical contact or a
# narrative turn. No cue is placed over the famine/deaths passage.
def sound_file(kind, duration=.28):
    path=OUT/"audio"/(kind+".wav")
    sr=48000
    rng=random.Random(20261015+sum(map(ord,kind)))
    values=[]
    last=0
    for i in range(round(duration*sr)):
        t=i/sr
        noise=rng.uniform(-1,1)
        last=.82*last+.18*noise
        if kind=="coin":
            s=(math.sin(2*math.pi*2100*t)+.35*math.sin(2*math.pi*3450*t))*math.exp(-25*t)*.09
        elif kind=="ceramic":
            s=(math.sin(2*math.pi*990*t)+.4*math.sin(2*math.pi*2160*t))*math.exp(-40*t)*.09
        elif kind=="wood":
            s=(math.sin(2*math.pi*115*t)*math.exp(-38*t)+last*math.exp(-26*t))*.14
        else:
            env=math.sin(math.pi*min(1,t/duration))**2
            s=(noise-last)*env*.052
        s*=min(1,t/.004)
        values.append(struct.pack("<h",round(max(-1,min(1,s))*32767)))
    with wave.open(str(path),"wb") as wav:
        wav.setparams((1,2,sr,len(values),"NONE","not compressed"))
        wav.writeframes(b"".join(values))
    return f"medieval/video003/current/audio/{kind}.wav"

SFX_SPEC = [
 (6,"only one Hugh","wood","A single dry beat lands the one-Hugh reaction"),
 (20,"moves out","brush","Toy moves away so the same room can be reused"),
 (40,"put it down","wood","Bundle contacts the ground"),
 (67,"paperwork","brush","Paperwork is the established chicken callback"),
 (71,"grain kept for sowing","brush","Seed changes its use, not an arbitrary transition"),
 (75,"pottery supply","ceramic","A short ceramic-like click lands the pot joke"),
 (81,"receive money","coin","Coin contact at the transaction"),
 (107,"Fold","brush","Cloth bundle is being folded"),
 (122,"Hugh Cross","brush","Paper texture marks the arrival of a recorded-case card"),
]
SFX=[]
for n,phrase,kind,reason in SFX_SPEC:
    t=cue(n,phrase)
    SFX.append(dict(start=frame(t),file=sound_file(kind),duration=round(.28*FPS),
                    volume=.85,reason=reason,beat=BEATS[n]["id"],cue=phrase))

with wave.open(str(OUT/"audio/narration-v02.wav"),"rb") as wav:
    voice_seconds=wav.getnframes()/wav.getframerate()
duration=math.ceil(voice_seconds*FPS)
SHOTS[-1]["end"]=duration
SHOTS[-1]["cuts"][-1]["end"]=duration
plan=dict(version="revision-v02",fps=FPS,width=1280,height=720,duration=duration,
          voice="medieval/video003/current/audio/narration-v02.wav",
          shots=SHOTS,overlays=OVERLAYS,definitions=overlay_defs,sfx=SFX)
props=ROOT/"examples/medieval/video003-v02.json"
props.write_text(json.dumps(dict(plan=plan),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

errors=[]
for name,definition in overlay_defs.items():
    for c in definition["cards"]:
        if c["x"]+c["width"]>1885 or c["y"]+c["height"]>1036:
            errors.append(f"Card outside safe region: {name}")
        for line in c["lines"]:
            if measure(line,c["size"])>c["width"]-47:
                errors.append(f"Card overflow: {name} {line}")
            if ";" in line or " — " in line or " - " in line:
                errors.append(f"Editorial punctuation in display copy: {name} {line}")
for o in OVERLAYS:
    if o["end"]<=o["start"]:
        errors.append(f"Empty overlay {o['id']}")
for left,right in zip(SHOTS,SHOTS[1:]):
    if left["end"]!=right["start"]:
        errors.append(f"Timeline gap: {left['id']}")
if errors:
    raise ValueError("\n".join(errors))
report=dict(version="v02",openingSpeed=SPEED,openingSourceEnd=SPEED_END,
            openingSavedSeconds=SHIFT,duration=voice_seconds,shots=len(SHOTS),
            overlayOccurrences=len(OVERLAYS),oldOverlayOccurrences=75,sfx=SFX,
            overlaySchedule=OVERLAYS,errors=errors,
            removedDummy="E03_spare_worker",imageGenerationNeeded=False,
            note="Old source/voice/assets and v01 remain unchanged. All overlay typography is live Patrick Hand, not PNG text.")
(ROOT/"examples/medieval/video003-v02-audit.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps({k:report[k] for k in ("duration","shots","overlayOccurrences","oldOverlayOccurrences","errors")},indent=2))
