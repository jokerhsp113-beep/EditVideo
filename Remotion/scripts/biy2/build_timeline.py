"""Convert the nine production files into Remotion timeline drafts.

Each production file describes a shot twice: the CUE SHEET says *when* each
thing happens (anchored to a word in the narration) and the LAYERS table says
*where* it sits. Neither table alone is enough, so this joins them: every
LAYERS row is matched to the asset named in the cue that introduces it.

    python scripts/biy2/build_timeline.py
    python scripts/biy2/build_timeline.py --report
"""

import json
import pathlib
import re
import sys
import unicodedata

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import direct  # noqa: E402

SRC = pathlib.Path(r"C:\Work\Youtube\Built Into You\Video002\Create_data")
OUT = pathlib.Path("src/biy2/timeline")
ASSETS = pathlib.Path("public/biy2/assets")

SECTIONS = [
    ("00", "00-cold-open", "COLD OPEN"),
    ("01", "01-cloud-setting", "THE CLOUD SETTING - MC1R"),
    ("02", "02-brake", "THE BRAKE YOU DID NOT INSTALL - ALDH2"),
    ("03", "03-door-never-built", "THE DOOR THAT WAS NEVER BUILT - CCR5"),
    ("04", "04-low-tripwire", "THE LOW TRIPWIRE - MEFV"),
    ("05", "05-bare-surface", "THE BARE SURFACE - ABO"),
    ("06", "06-winter-engine", "THE WINTER ENGINE - CPT1A"),
    ("07", "07-blade-with-no-handle", "THE BLADE WITH NO HANDLE - APOL1"),
    ("08", "close", "CLOSE"),
]

ENTER = {
    "DRAW": "DRAW", "POP": "POP", "SLIDE": "SLIDE", "FADE": "FADE",
    "CROSSFADE": "FADE", "MOVE": "SLIDE", "TRAVEL": "SLIDE", "SCALE": "POP",
    "PULSE": "NONE", "IRIS-OPEN": "DRAW", "IRIS-CLOSE": "FADE", "WIPE": "DRAW",
    "SPLIT": "DRAW", "SHRINK": "POP", "NONE": "NONE",
}

STOP = {"asset", "code", "the", "a", "of", "on", "to", "va", "cua", "mot", "hai"}

# Layer labels are written for a human editor, so a good many of them share no
# word at all with the asset they refer to ("red X" -> code_mark_x). Everything
# below is a label wording that appears in the production files.
SYNONYM = [
    (r"\bred x\b|\bx do\b|\bdau x\b", "code_mark_x"),
    (r"\bgrey check\b|\btick xam\b|\bcheck xam\b", "code_mark_tick_grey"),
    (r"\bgreen check\b|\btick xanh\b|\bcheck xanh\b|\bcheck\b", "code_mark_tick"),
    (r"\bprice tag\b|\bthe gia\b", "code_price_tag"),
    (r"\bbody window\b|\bkhung body\b", "code_body_window"),
    (r"\bwindow\b|\bo cua\b|\bslot\b|\bkhung tron\b", "code_window"),
    (r"\btether\b|\bday noi\b", "code_body_window"),
    (r"\btrail dots?\b|\bcham duoi\b", "code_trail_dots"),
    (r"\bchapter reset\b", "code_chapter_reset"),
    (r"\bevidence chip\b|\bchip\b", "code_evidence_chip"),
    (r"\bcrowd\b|\bdam dong\b|\bgrid\b", "code_crowd_grid"),
    (r"\bcarrier dot\b", "code_carrier_dot"),
    (r"\bdashed outline\b|\bnet dut\b", "code_dashed_outline"),
    (r"\broom outline\b", "code_room_outline"),
    (r"\bshield ring\b|\bvong khien\b", "code_shield_ring"),
    (r"\bsignal pulse\b|\bxung\b", "code_signal_pulse"),
    (r"\bvitd arrow\b|\bvitamin d arrow\b", "code_vitd_arrow"),
    (r"\buv arrow\b", "code_uv_arrow"),
    (r"\bpatch red\b|\bvet do\b", "code_patch_red"),
    (r"\btan row\b", "code_tan_row"),
    (r"\bsky split\b", "code_sky_split"),
    (r"\brepeat ticks?\b", "code_repeat_ticks"),
    (r"\bflush\b|\bma do\b", "code_flush_cheeks"),
    (r"\bstep marker\b|\bbuoc\b", "code_step_marker"),
    (r"\bmolecule pile\b|\bdong phan tu\b", "code_molecule_pile"),
    (r"\bheat lines?\b|\bhoi nong\b", "code_heat_lines"),
    (r"\balarm burst\b|\bnan hoa\b", "code_alarm_burst"),
    (r"\btimeline\b|\btruc thoi gian\b", "code_timeline_blurred"),
    (r"\bcopy cards?\b|\bthe ban sao\b", "code_copy_cards"),
    (r"\bbrake slider\b|\bthanh phanh\b", "code_brake_slider"),
    (r"\bheat gradient\b", "code_heat_gradient"),
    (r"\bhypothesis\b|\bgia thuyet\b", "code_hypothesis_card"),
    (r"\bletter blocks?\b|\bkhoi chu\b", "code_letter_blocks"),
    (r"\bbounce\b|\bquy dao\b", "code_bounce_path"),
    (r"\bpore\b|\blo thung\b", "code_pore_holes"),
    (r"\bselection arrow\b", "code_selection_arrow"),
    (r"\btrigger box\b", "code_trigger_box"),
    (r"\btsetse belt\b|\bdai tsetse\b", "code_tsetse_belt"),
    (r"\bshelf\b|\bke ngang\b", "code_shelf_line"),
    (r"\bmoon\b|\bmat trang\b", "code_moon_sleep"),
    (r"\bthreshold bar\b|\bnguong\b", "code_threshold_bar"),
    (r"\binflammation\b|\bviem\b", "code_inflammation_burst"),
    (r"\bruler\b|\bthuoc\b", "code_ruler_marker"),
    (r"\btwo bars\b|\bhai thanh\b", "code_two_bars_race"),
    (r"\bbruise\b|\bvet bam\b", "code_bruise_patch"),
    (r"\bclump\b|\bket dinh\b", "code_clump_cluster"),
    (r"\bvwf bar\b", "code_vwf_bar"),
    (r"\bclotting bar\b|\bdong mau\b", "code_clotting_bar"),
    (r"\bbleed\b|\bgiot mau roi\b", "code_bleed_drops"),
    (r"\bdefect label\b", "code_defect_label"),
    (r"\bclot shape\b|\bcuc dong\b", "code_clot_shape"),
    (r"\bcoat shape\b|\bao khoac\b", "code_coat_shape"),
    (r"\bdivider\b|\bvach doc\b", "code_divider_line"),
    (r"\brisk arrow\b", "code_risk_arrow"),
    (r"\badhesion\b|\bsoi bam\b", "code_adhesion_bridge"),
    (r"\bgate width\b", "code_gate_width_ruler"),
    (r"\bsupply line\b|\bduong cung\b", "code_supply_line"),
    (r"\bhdl bar\b", "code_hdl_bar"),
    (r"\bglucose\b", "code_glucose_line"),
    (r"\bcalorie\b|\bdia calo\b", "code_calorie_plate"),
    (r"\bfuel glow\b|\bquang lua\b", "code_fuel_glow"),
    (r"\btag pair\b|\bcap the\b", "code_tag_pair"),
    (r"\bgap marker\b|\bkhe ho\b", "code_gap_marker"),
    (r"\bgear\b|\bbanh rang\b", "code_gear"),
    (r"\bdna letter\b|\brail dna\b", "code_dna_letter_strip"),
    (r"\barrow\b|\bmui ten\b", "code_arrow"),
    (r"\bray\b|\btia\b", "code_ray"),
    (r"\bthree icons\b|\bba icon\b", "code_icon_trio"),
    (r"\bstick offering\b|\boffering\b", "stick_offer_bottle_v01"),
    (r"\bheadache\b|\bdau dau\b", "code_heat_lines"),
    (r"\bspread rings?\b", "code_spread_rings"),
    (r"\breference wire\b", "asset_tripwire_low_v01"),
    (r"\breference band\b", "code_crowd_grid"),
    (r"\bco che\b", "asset_enzyme_gate_narrow_v01"),
]


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def tokens(s: str) -> set[str]:
    s = re.sub(r"[^a-z0-9]+", " ", strip_accents(s.lower()))
    # `_v01` is a version suffix, not a word — strip it after the split or the
    # underscore in asset_virus_particle_v01 defeats the word boundary
    return {t for t in s.split()
            if t and t not in STOP and len(t) > 1 and not re.fullmatch(r"v\d+", t)}


def find_shots(src: str) -> list[tuple[str, str, str]]:
    out = []
    for p in re.split(r"^## SHOT ", src, flags=re.M)[1:]:
        head, _, rest = p.partition("\n")
        m = re.match(r"([\w.]+)\s*(?:.\s*(.*))?", head.strip())
        out.append((m.group(1), (m.group(2) or "").strip(), rest))
    return out


def vo_of(block: str) -> str:
    m = re.search(r"\*\*VO\*\*\n```\n(.*?)\n```", block, re.S)
    return m.group(1).strip() if m else ""


def table(block: str, header: str) -> list[list[str]]:
    m = re.search(r"^### " + header + r"\s*\n(.*?)(?=\n###|\n---|\Z)", block, re.S | re.M)
    if not m:
        return []
    rows = []
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line.startswith("|") or set(line) <= set("|-: "):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if cells and cells[0] in ("#", "Layer"):
            continue
        rows.append(cells)
    return rows


def parse_size(s: str) -> dict:
    out: dict = {}
    s = s.replace("\u00d7", "x")
    if m := re.search(r"\bh(\d+)", s):
        out["h"] = int(m.group(1))
    if m := re.search(r"\bw(\d+)", s):
        out["w"] = int(m.group(1))
    if m := re.search(r"\bd(\d+)", s):
        out["w"] = out["h"] = int(m.group(1))
    if m := re.search(r"\br(\d+)", s):
        out["w"] = out["h"] = int(m.group(1)) * 2
    if m := re.search(r"(\d{2,4})\s*x\s*(\d{2,4})", s):
        out["w"], out["h"] = int(m.group(1)), int(m.group(2))
    if m := re.search(r"(\d+)\s*pt", s):
        out["size"] = max(96, int(int(m.group(1)) * 2.4))
    if m := re.search(r"(\d+)\s*%", s):
        out["opacity"] = int(m.group(1)) / 100
    return out


def parse_xy(s: str):
    """`760,540`, a `a -> b` travel, or a `x = 414 . 546 . ... . y 500` row."""
    pts = [(int(a), int(b)) for a, b in re.findall(r"(\d{2,4})\s*,\s*(\d{2,4})", s)]
    if pts:
        return pts, len(pts) > 1, []
    row = re.match(r".*?x\s*=?\s*([\d\s·.]+?)\s*[·,]?\s*y\s*=?\s*(\d{2,4})", s)
    if row:
        xs = [int(v) for v in re.findall(r"\d{2,4}", row.group(1))]
        y = int(row.group(2))
        if len(xs) > 1:
            return [(xs[0], y)], False, [(x, y) for x in xs]
    return [], False, []


def widget_names() -> set[str]:
    """Every `code_*` the production files define in a spec table."""
    out: set[str] = set()
    for md in sorted(SRC.glob("*.md")):
        for m in re.finditer(r"^\|\s*~?~?C\d+[a-z]?~?~?\s*\|\s*~?~?`(code_[a-z0-9_]+)`",
                             md.read_text(encoding="utf-8", errors="replace"), re.M):
            out.add(m.group(1))
        for m in re.finditer(r"^#{2,4}\s+C\d+\s*.*?`(code_[a-z0-9_]+)`",
                             md.read_text(encoding="utf-8", errors="replace"), re.M):
            out.add(m.group(1))
    return out


def match_label(label: str, cue_assets, vocab: set[str]):
    """Resolve a LAYERS row label to an asset or widget name."""
    # "tcell (co tay nam)" and "icon x6" name the same thing as "tcell" and
    # "icon"; the rest is a note to the editor about state or count
    label = re.sub(r"\([^)]*\)", " ", label)
    label = re.sub(r"[×x]\s*\d+", " ", label)
    flat = re.sub(r"[^a-z0-9 ]+", " ", strip_accents(label.lower()))
    for pattern, name in SYNONYM:
        if re.search(pattern, flat):
            return name, True
    lt = tokens(label)
    if not lt:
        return None, False
    best, hit = 0.0, None

    def score(aname: str, bonus: float) -> float:
        at_ = tokens(aname)
        if not at_:
            return 0.0
        shared = len(lt & at_)
        # both directions must agree, or "key nub (on the right edge of the
        # virus)" matches asset_virus_particle just because it says virus
        if shared / len(lt) < 0.4:
            return 0.0
        return shared / len(at_) + bonus

    for aname, _ in cue_assets:
        s = score(aname, 0.15)
        if s > best:
            best, hit = s, aname
    for aname in vocab:
        s = score(aname, 0.0)
        if s > best:
            best, hit = s, aname
    return (hit, False) if best >= 0.5 else (None, False)


# Where a layer goes when the LAYERS table describes its position in prose
# ("bám sau virus", "tới đích") instead of giving coordinates.
ANCHORED = {
    "code_mark_x": (0, 0), "code_mark_tick": (0, 0), "code_mark_tick_grey": (0, 0),
    "code_patch_red": (0, -40), "code_flush_cheeks": (0, -30),
    "code_shield_ring": (0, 0), "code_pore_holes": (0, 0),
    "code_price_tag": (240, 180), "code_tag_pair": (0, 250),
    "code_trail_dots": (-150, 0), "code_carrier_dot": (0, 0),
    "code_bruise_patch": (0, 0), "code_gap_marker": (0, 60),
}
FIXED = {
    "code_label": (960, 220), "code_chapter_reset": (960, 540),
    "code_evidence_chip": (960, 910), "code_body_window": (960, 540),
    "code_dashed_outline": (960, 540), "code_room_outline": (960, 540),
    "code_sky_split": (960, 540), "code_divider_line": (960, 540),
    "code_crowd_grid": (960, 580), "code_timeline_blurred": (960, 820),
    "code_hypothesis_card": (960, 560), "code_defect_label": (960, 860),
    "code_heat_gradient": (960, 540), "code_tsetse_belt": (960, 540),
    "code_shelf_line": (960, 760), "code_supply_line": (960, 540),
}
DEFAULT_H = {
    "code_label": 90, "code_evidence_chip": 90, "code_mark_x": 150,
    "code_mark_tick": 150, "code_mark_tick_grey": 150, "code_price_tag": 130,
    "code_body_window": 620, "code_chapter_reset": 1080,
}


def place(shot_id: str, layers: list[dict]) -> None:
    """Give every layer a position.

    A layer with no coordinates is either a mark that belongs on the thing
    introduced before it, or furniture with a fixed home. Marks inherit; the
    rest fall back to the frame centre so nothing is silently dropped.
    """
    last: tuple[int, int] | None = None
    for layer in layers:
        name = layer.get("asset") or ""
        if layer.get("x") is not None:
            if name not in ANCHORED:
                last = (layer["x"], layer["y"])
            continue
        if name in ANCHORED and last:
            dx, dy = ANCHORED[name]
            layer["x"], layer["y"] = last[0] + dx, last[1] + dy
        elif name in FIXED:
            layer["x"], layer["y"] = FIXED[name]
        elif last:
            layer["x"], layer["y"] = last[0], last[1]
        else:
            layer["x"], layer["y"] = 960, 540
        layer["placed"] = "derived"
        if not layer.get("h") and not layer.get("w") and name in DEFAULT_H:
            layer["h"] = DEFAULT_H[name]


W, H = 1920, 1080
SAFE_X, SAFE_Y = 96, 54

CONTAINERS = ("code_dashed_outline", "code_room_outline", "code_body_window",
              "code_trigger_box", "code_heat_gradient", "code_sky_split",
              "code_tsetse_belt", "code_shelf_line", "code_chapter_reset")

# A frame drawn around other things is meant to overlap them.
MARKS = ("code_mark", "code_price", "code_patch", "code_flush", "code_bruise",
         "code_carrier", "code_shield", "code_pore", "code_gap", "code_chapter")

_png: dict[str, tuple[int, int]] = {}


def png_size(name: str) -> tuple[int, int]:
    if name not in _png:
        from PIL import Image
        f = ASSETS / (name + ".png")
        _png[name] = Image.open(f).size if f.exists() else (0, 0)
    return _png[name]


# Code widgets are drawn to a shape, and the production files usually give only
# one dimension. Without this a 1200px-wide shelf line is measured as 960 tall.
MIN_SIZE = {
    "code_crowd_grid": (1020, 560), "code_evidence_chip": (480, 106),
    "code_step_marker": (120, 120), "code_timeline_blurred": (940, 38),
    "code_repeat_ticks": (560, 140), "code_trail_dots": (260, 65),
    "code_carrier_dot": (64, 64), "code_gap_marker": (34, 140),
    "code_signal_pulse": (460, 138), "code_tan_row": (560, 140),
    "code_supply_line": (820, 33), "code_divider_line": (10, 520),
    "code_letter_blocks": (1000, 80), "code_dna_letter_strip": (1000, 80),
    "code_shelf_line": (1000, 50), "code_tag_pair": (560, 146),
    "code_ruler_marker": (110, 385), "code_gate_width_ruler": (110, 385),
    "code_threshold_bar": (130, 455), "code_clotting_bar": (130, 455),
    "code_vwf_bar": (130, 455), "code_hdl_bar": (130, 455),
    "code_brake_slider": (120, 456), "code_bleed_drops": (110, 440),
    "code_label": (0, 108), "code_mark_x": (170, 170),
    "code_mark_tick": (170, 170), "code_mark_tick_grey": (170, 170),
    "code_price_tag": (250, 142),
}

WIDGET_ASPECT = {
    "code_shelf_line": 0.05, "code_timeline_blurred": 0.04, "code_supply_line": 0.04,
    "code_divider_line": 12.0, "code_gap_marker": 2.0, "code_adhesion_bridge": 0.2,
    "code_letter_blocks": 0.08, "code_dna_letter_strip": 0.08, "code_tan_row": 0.25,
    "code_repeat_ticks": 0.25, "code_trail_dots": 0.25, "code_signal_pulse": 0.3,
    "code_tag_pair": 0.26, "code_evidence_chip": 0.22, "code_label": 0.3,
    "code_threshold_bar": 3.5, "code_clotting_bar": 3.5, "code_vwf_bar": 3.5,
    "code_hdl_bar": 3.5, "code_brake_slider": 3.8, "code_ruler_marker": 3.5,
    "code_gate_width_ruler": 3.5, "code_tsetse_belt": 0.17, "code_glucose_line": 0.46,
    "code_bounce_path": 0.46, "code_calorie_plate": 1.0, "code_gear": 1.0,
    "code_body_window": 0.82, "code_crowd_grid": 0.55, "code_copy_cards": 0.48,
    "code_moon_sleep": 0.87, "code_bleed_drops": 4.0, "code_chapter_reset": 0.0,
}


def extent(layer: dict) -> tuple[float, float]:
    """The layer's on-screen box — the real artwork aspect where there is one."""
    if layer.get("kind") == "text":
        s = layer.get("size") or 120
        return len(str(layer.get("text", ""))) * s * 0.62, s * 1.2
    name = layer.get("asset") or ""
    w, h = layer.get("w"), layer.get("h")
    if name and not name.startswith("code_"):
        aw, ah = png_size(name)
        if aw:
            if h:
                return float(h) * aw / ah, float(h)
            if w:
                return float(w), float(w) * ah / aw
            return 320.0 * aw / ah, 320.0
    ratio = WIDGET_ASPECT.get(name)
    if ratio == 0.0:
        return 0.0, 0.0
    if w and h:
        return float(w), float(h)
    if ratio:
        if w:
            return float(w), float(w) * ratio
        if h:
            return float(h) / ratio, float(h)
    if h:
        return float(h) * 1.25, float(h)
    if w:
        return float(w), float(w) * 0.8
    return 320.0, 320.0


def lay_out_rows(items: list[dict]) -> None:
    """Space any line of three or more things evenly across the safe width."""
    rows: dict[int, list[dict]] = {}
    for l in items:
        rows.setdefault(round(l["y"] / 40), []).append(l)
    for members in rows.values():
        if len(members) < 3:
            continue
        members.sort(key=lambda l: l["x"])
        widest = max(extent(l)[0] for l in members)
        step = min((W - 2 * SAFE_X - widest) / (len(members) - 1), widest * 1.35)
        start = 960 - step * (len(members) - 1) / 2
        for i, l in enumerate(members):
            l["x"] = int(start + i * step)


def separate(items: list[dict]) -> None:
    """Move overlapping subjects apart, the smaller one and the shorter way."""
    for i, a in enumerate(items):
        aw, ah = extent(a)
        for b in items[i + 1:]:
            bw, bh = extent(b)
            ox = (aw + bw) / 2 - abs(a["x"] - b["x"])
            oy = (ah + bh) / 2 - abs(a["y"] - b["y"])
            if ox <= 0 or oy <= 0:
                continue
            if min(ox / min(aw, bw), oy / min(ah, bh)) < 0.42:
                continue
            small, big = (b, a) if bw * bh < aw * ah else (a, b)
            if ox < oy:
                small["x"] += int(ox + 40) * (1 if small["x"] >= big["x"] else -1)
            else:
                small["y"] += int(oy + 30) * (1 if small["y"] >= big["y"] else -1)


def clamp(items: list[dict]) -> None:
    for l in items:
        w, h = extent(l)
        # a row laid out across the frame is clamped as a row, not per copy, and
        # re-spaced: the production file's spacing was written for the original
        # size, so scaling the items up leaves them touching
        if l.get("spread") and len(l["spread"]) > 1:
            n = len(l["spread"])
            y = l["spread"][0][1]
            lo, hi = SAFE_X + w / 2, W - SAFE_X - w / 2
            step = min(w * 1.28, (hi - lo) / (n - 1))
            start = 960 - step * (n - 1) / 2
            l["spread"] = [(int(start + i * step), y) for i in range(n)]
            l["x"] = l["spread"][0][0]
            continue
        l["x"] = int(min(max(l["x"], SAFE_X + w / 2), W - SAFE_X - w / 2)) if w < W - 2 * SAFE_X else 960
        l["y"] = int(min(max(l["y"], SAFE_Y + h / 2), H - SAFE_Y - h / 2)) if h < H - 2 * SAFE_Y else 540


OVERRIDES = json.load(open("scripts/biy2/overrides.json", encoding="utf-8"))


def apply_overrides(sec: str, shot_id: str, layers: list[dict]) -> list[dict]:
    """Hand corrections, applied last so a rebuild never loses them."""
    patch = OVERRIDES.get(sec + "/" + shot_id)
    if not patch:
        return layers
    if "_replace" in patch:
        # the generated shot is thrown away: some beats need authoring, not
        # patching, and the cold open is where that pays for itself
        return [{"to": [], **l} for l in patch["_replace"]]
    out = []
    for l in layers:
        fields = patch.get(l["id"], patch.get("*"))
        if fields is None and (l["id"] in patch or "*" in patch):
            continue
        if fields:
            l.update(fields)
        out.append(l)
    for extra in patch.get("_add", []):
        out.append({"to": [], **extra})
    return out


def compose(layers: list[dict]) -> None:
    """Second-guess the production file on two things it cannot see.

    The cold open and several mechanism beats were written for a camera that
    slides across a canvas wider than the frame, so their x values are not
    frame coordinates — left alone, the subject sits against one edge. And a
    single-focal beat written as `h180` reads as a speck at 1080p.
    """
    real = [l for l in layers if l.get("x") is not None]
    if not real:
        return

    # type sizes come out of the production files as print points; even scaled
    # they can exceed the frame, and a headline taller than 1080 is not a beat
    for l in real:
        if l.get("kind") == "text" and l.get("size"):
            l["size"] = min(l["size"], 420)

    # 1. fill the frame. A beat written as `h180` reads as a speck at 1080p, so
    # scale the whole shot up until its content covers a reasonable share of
    # the frame, then cap anything that would now overflow it.
    subjects = [l for l in real
                if not str(l.get("asset") or "").startswith(MARKS + ("code_trail", "code_gap"))]
    if subjects:
        ink = sum(extent(l)[0] * extent(l)[1] for l in subjects) / (W * H)
        if ink < 0.17:
            k = min(3.0, (0.17 / max(ink, 0.002)) ** 0.5)
            for l in real:
                for key in ("w", "h", "size"):
                    if l.get(key):
                        l[key] = int(l[key] * k)
                # a row of seven windows spaced for d132 collides once each one
                # is 222 wide, so the spacing has to grow with them
                if l.get("spread") and len(l["spread"]) > 1:
                    cx = sum(x for x, _ in l["spread"]) / len(l["spread"])
                    l["spread"] = [(int(cx + (x - cx) * k), y) for x, y in l["spread"]]
    for l in real:
        w, h = extent(l)
        if h > H - 2 * SAFE_Y or w > W - 2 * SAFE_X:
            shrink = min((H - 2 * SAFE_Y) / h, (W - 2 * SAFE_X) / w)
            for key in ("w", "h", "size"):
                if l.get(key):
                    l[key] = int(l[key] * shrink)

    # 2. a widget below its legible size is noise, not information. The
    # production files size these against a storyboard thumbnail, so a crowd of
    # thirty people can arrive as a 34px smudge.
    for l in real:
        floor = MIN_SIZE.get(l.get("asset") or "")
        if not floor:
            continue
        fw, fh = floor
        if (l.get("w") or 0) < fw and (l.get("h") or 0) < fh:
            l["w"], l["h"] = fw, fh

    # 3. recentre a composition that the camera was supposed to carry.
    # With one or two subjects, centre the main one: the bounding box of a pair
    # where the second arrives later leaves the first sitting against an edge
    # for the whole opening of the shot. With a crowd, centre the group.
    frame_of = subjects or real
    if len(frame_of) <= 2:
        main = max(frame_of, key=lambda l: extent(l)[0] * extent(l)[1])
        dx = max(-820, min(820, 960 - main["x"]))
    else:
        xs0 = min(l["x"] - extent(l)[0] / 2 for l in frame_of)
        xs1 = max(l["x"] + extent(l)[0] / 2 for l in frame_of)
        dx = max(-820, min(820, 960 - (xs0 + xs1) / 2))
    if abs(dx) > 120:
        for l in real:
            l["x"] += int(dx)
            if l.get("to"):
                l["to"] = [(x + int(dx), y) for x, y in l["to"]]
            if l.get("spread"):
                l["spread"] = [(x + int(dx), y) for x, y in l["spread"]]

    # 3b. honour a label that says which half of the frame it belongs in —
    # two outlines both landing at x=837 is the join losing that information
    for l in real:
        if l.get("side"):
            w, _ = extent(l)
            l["x"] = int(960 + l["side"] * max(300, w / 2 + 60))

    # 3c. a recap row — four or more things on one line — is laid out evenly.
    # The production files give each icon its own x, and once the assets are
    # keyed to their true widths those spacings no longer hold.
    lay_out_rows(subjects)

    # 4. pull apart things the production file never meant to stack — a giant
    # numeral across a row of windows, a caption over a character's face.
    separate([l for l in subjects
              if not str(l.get('asset') or '').startswith(CONTAINERS)])

    # 5. a verdict mark has to land on what it is judging. The production files
    # place marks against a canvas we have already recentred and rescaled, so a
    # mark that now covers nothing gets snapped onto the nearest subject.
    for l in real:
        if not str(l.get("asset") or "").startswith(MARKS) or not subjects:
            continue
        mw, mh = extent(l)
        def covered(s: dict) -> float:
            sw, sh = extent(s)
            ix = max(0.0, (mw + sw) / 2 - abs(l["x"] - s["x"]))
            iy = max(0.0, (mh + sh) / 2 - abs(l["y"] - s["y"]))
            return (ix * iy) / max(mw * mh, 1)
        if max(covered(s) for s in subjects) >= 0.45:
            continue
        target = min(subjects, key=lambda s: (s["x"] - l["x"]) ** 2 + (s["y"] - l["y"]) ** 2)
        l["x"], l["y"] = target["x"], target["y"]

    # 6. keep everything inside the safe area, then separate once more: the
    # clamp can push two things back into each other at the frame edge.
    clamp(real)
    separate([l for l in subjects
              if not str(l.get('asset') or '').startswith(CONTAINERS)])
    clamp(real)

    # 7. a layer that travels off the frame is gone for the rest of the shot.
    # The production files use an off-canvas target to mean "keeps going"; on a
    # fixed frame that reads as the subject vanishing.
    for l in real:
        if not l.get("to"):
            continue
        w, h = extent(l)
        l["to"] = [(int(min(max(x, SAFE_X + w / 2), W - SAFE_X - w / 2)),
                    int(min(max(y, SAFE_Y + h / 2), H - SAFE_Y - h / 2)))
                   for x, y in l["to"]]


def stack(layers: list[dict]) -> None:
    """Assign z by role.

    Without this every layer sits at the same depth and DOM order decides, so a
    numeral written before a row of windows ends up behind them and reads as
    cut in half. Backdrops go under, then artwork, then diagram furniture, then
    type, then the marks that judge all of it.
    """
    for l in layers:
        name = str(l.get("asset") or "")
        if l.get("id", "").endswith("~"):
            z = 4                                  # carried from the last shot
        elif name.startswith(CONTAINERS):
            z = 6
        elif l.get("kind") == "text":
            z = 40
        elif name.startswith(MARKS):
            z = 50
        elif name.startswith("code_"):
            z = 20
        else:
            z = 12
        l["z"] = z


def motion(shot: dict) -> None:
    """Apply the motion hierarchy from §0.4 of the production files.

    STATIC for anything that has to be read; ALIVE for a character or a prop
    that is present but not the point; ACTIVE for whatever the narrator has
    just named. Without this every shot freezes the moment it finishes
    assembling, which is what makes a build like this feel dead next to a
    hand-cut one.
    """
    layers = shot["layers"]
    named = [l for l in layers if l.get("at")]
    focal = named[-1]["id"] if named else None
    subjects = 0
    for l in layers:
        name = str(l.get("asset") or "")
        if l.get("kind") == "text" or name.startswith(
                ("code_evidence", "code_hypothesis", "code_defect", "code_label",
                 "code_letter", "code_dna")):
            continue                                   # STATIC: it must be read
        if l.get("state"):
            pass
        elif l["id"] == focal:
            l["state"] = "ACTIVE"
        elif not name.startswith(MARKS + CONTAINERS):
            l["state"] = "ALIVE"
        if not name.startswith(MARKS + CONTAINERS) and l.get("kind") != "text":
            subjects += 1

    # a beat carried by one or two things needs the camera to keep moving
    if shot.get("push"):
        return
    if subjects <= 2:
        shot["push"] = 1.4
    elif subjects <= 4:
        shot["push"] = 0.8


def draw_weight(layer: dict) -> float:
    """How much of its box a layer actually puts on screen."""
    name = str(layer.get("asset") or "")
    if name.startswith(("code_dashed", "code_room", "code_trigger")):
        return 0.08
    if name.startswith(("code_divider", "code_supply", "code_timeline",
                        "code_shelf", "code_adhesion", "code_gap")):
        return 0.12
    if name.startswith("code_"):
        return 0.5
    return 1.0


def carry_forward(shots: list[dict]) -> None:
    """Hold the previous beat under a shot that only adds to it.

    The production files are written as one continuous scene per section — a
    cue sheet row often reads `SHOT START | giu` or `khong clear`. Rebuilding
    each shot from nothing makes those continuations look like a blank frame
    with one small thing added. So a shot that draws almost nothing of its own
    inherits the previous shot's subjects, underneath and already on screen.
    """
    for i in range(1, len(shots)):
        cur, prev = shots[i], shots[i - 1]
        own = sum(extent(l)[0] * extent(l)[1] * draw_weight(l) for l in cur["layers"])
        if own / (W * H) >= 0.05:
            continue
        have = {l.get("asset") for l in cur["layers"]}
        carried = []
        for l in prev["layers"]:
            if l.get("asset") in have or str(l.get("asset") or "").startswith(MARKS):
                continue
            c = dict(l)
            c["id"] = l["id"] + "~"
            c["enter"] = "NONE"
            c.pop("at", None)
            c.pop("delay", None)
            c.pop("to", None)
            c["z"] = 5
            carried.append(c)
        if not carried:
            continue
        cur["layers"] = carried + cur["layers"]
        # the carried beat sits behind, but it must not sit *under* the new one
        fresh = [l for l in cur["layers"]
                 if l not in carried and not str(l.get("asset") or "").startswith(MARKS)]
        for c in carried:
            cw, ch = extent(c)
            for f in fresh:
                fw, fh = extent(f)
                ox = (cw + fw) / 2 - abs(c["x"] - f["x"])
                oy = (ch + fh) / 2 - abs(c["y"] - f["y"])
                if ox <= 0 or oy <= 0:
                    continue
                if min(ox / min(cw, fw), oy / min(ch, fh)) < 0.45:
                    continue
                c["x"] += int(ox + 40) * (1 if c["x"] >= f["x"] else -1)
        lay_out_rows(carried)
        separate(carried)
        clamp(carried)


def ts_value(v) -> str:
    if isinstance(v, str):
        return '"' + v.replace('\\', '\\\\').replace('"', '\\"') + '"'
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, float):
        return ("%g" % v)
    if isinstance(v, dict):
        return "{ " + ", ".join(k + ": " + ts_value(x) for k, x in v.items()) + " }"
    return str(v)


def emit_ts(sec: str, title: str, shots: list[dict]) -> str:
    out = [
        "// GENERATED by scripts/biy2/build_timeline.py from the production files.",
        "// Hand edits belong in overrides.ts, which is applied after this module.",
        'import type { SectionTimeline } from "../types";',
        "",
        "export const s" + sec + ": SectionTimeline = {",
        '  id: "' + sec + '",',
        '  title: "' + title + '",',
        '  audio: "biy2/audio_tight/Audio' + sec + '.wav",',
        '  captions: "biy2/captions/s' + sec + '.json",',
        "  shots: [",
    ]
    for shot in shots:
        out.append("    {")
        out.append('      id: "' + shot["id"] + '",')
        if shot["anchor"]:
            out.append("      anchor: " + ts_value(shot["anchor"]) + ",")
        elif shot.get("hold"):
            out.append("      hold: " + ts_value(shot["hold"]) + ",")
        if shot.get("push"):
            out.append("      push: " + ts_value(shot["push"]) + ",")
        if shot.get("transition"):
            out.append("      transition: " + ts_value(shot["transition"]) + ",")
        if shot.get("beats"):
            out.append("      beats: [" + ", ".join(ts_value(b) for b in shot["beats"]) + "],")
        if shot["title"]:
            out.append("      note: " + ts_value(shot["title"]) + ",")
        out.append("      layers: [")
        for layer in shot["layers"]:
            for part in layer_ts(layer):
                out.append("        " + part)
        out.append("      ],")
        out.append("    },")
    out += ["  ],", "};", ""]
    return "\n".join(out)


def layer_ts(layer: dict) -> list[str]:
    spread = layer.get("spread") or [(layer["x"], layer["y"])]
    rows = []
    for i, (x, y) in enumerate(spread):
        f: dict = {"id": layer["id"] + ("-" + str(i) if len(spread) > 1 else "")}
        name = layer.get("asset")
        if layer.get("kind") == "text":
            f["kind"] = "text"
            f["text"] = layer["text"]
        elif name and name.startswith("code_"):
            f["kind"] = name
        elif name:
            f["src"] = name
        else:
            f["kind"] = "code_placeholder"
        f["x"], f["y"] = x, y
        for k in ("w", "h", "opacity", "rotate", "z", "until"):
            if layer.get(k) is not None:
                f[k] = layer[k]
        if layer.get("enter"):
            f["enter"] = layer["enter"]
        if layer.get("state"):
            f["state"] = layer["state"]
        if layer.get("exitOn") and i == 0:
            f["exitOn"] = layer["exitOn"]
        if layer.get("at"):
            f["at"] = layer["at"]
        elif layer.get("delay") is not None:
            f["delay"] = layer["delay"]
        props: dict = dict(layer.get("props") or {})
        if layer.get("size"):
            props["size"] = layer["size"]
        if layer.get("text") and f.get("kind") != "text":
            props["text"] = layer["text"]
        if layer.get("count") and not layer.get("spread"):
            props["count"] = layer["count"]
        if layer.get("to") and i == 0:
            tx, ty = layer["to"][-1]
            props["toX"], props["toY"], props["travel"] = tx, ty, 0.8
        if props:
            f["props"] = props
        if len(spread) > 1:
            f.setdefault("delay", 0)
            f["delay"] = round((layer.get("delay") or 0) + i * 0.07, 2)
        rows.append("{ " + ", ".join(k + ": " + ts_value(v) for k, v in f.items()) + " },")
    return rows


def main() -> int:
    report_only = "--report" in sys.argv
    known = {p.stem for p in ASSETS.glob("*.png")}
    vocab = known | widget_names()
    OUT.mkdir(parents=True, exist_ok=True)
    stats = {"shots": 0, "layers": 0, "joined": 0, "unplaced": 0, "noanchor": 0}
    missing_assets: set[str] = set()
    dropped: list[str] = []
    direction_totals: dict[str, int] = {}

    for sec, stem, title in SECTIONS:
        md = next(SRC.glob(stem + "*.md"))
        src = md.read_text(encoding="utf-8", errors="replace")
        body = src[src.find("# 2 \u00b7 SHOT-BY-SHOT"):]
        shots_out = []

        for shot_id, shot_title, block in find_shots(body):
            stats["shots"] += 1
            vo = vo_of(block)
            cues = table(block, "CUE SHEET")
            layers_t = table(block, "LAYERS")

            cue_assets: list[tuple[str, dict]] = []
            for row in cues:
                if len(row) < 3:
                    continue
                fire, event = row[1], row[2]
                enter_raw = row[3] if len(row) > 3 else ""
                quoted = re.findall(r'"([^"]+)"', fire)
                at = quoted[0] if quoted else None
                delay = None
                if m := re.search(r"\+([\d.]+)s", fire):
                    delay = float(m.group(1))
                enter = "POP"
                for k, v in ENTER.items():
                    if k in enter_raw.upper():
                        enter = v
                        break
                shown = re.search(r'"([^"]{1,28})"', event)
                for name in re.findall(r"`((?:asset|code)_[A-Za-z0-9_]+)`", event):
                    t = {"at": at, "delay": delay, "enter": enter}
                    if shown and name in ("code_label", "code_evidence_chip",
                                          "code_defect_label", "code_hypothesis_card"):
                        t["text"] = shown.group(1).upper()
                    cue_assets.append((name, t))

            used: set[str] = set()
            layers = []
            for li, row in enumerate(layers_t):
                if len(row) < 2:
                    continue
                name = re.sub(r"\*+", "", row[0]).strip()
                pts, travels, spread = parse_xy(row[1])
                geom = parse_size(row[2] if len(row) > 2 else "")
                stats["layers"] += 1
                if not pts:
                    stats["unplaced"] += 1

                layer: dict = {
                    "id": shot_id + "-" + str(li),
                    "label": name,
                    "x": pts[0][0] if pts else None,
                    "y": pts[0][1] if pts else None,
                    "to": pts[1:] if travels else [],
                    **geom,
                }
                if spread:
                    layer["spread"] = spread
                side = strip_accents(name.lower())
                if re.search(r"trai|left", side):
                    layer["side"] = -1
                elif re.search(r"phai|right", side):
                    layer["side"] = 1
                if m := re.search(r"[×x]\s*(\d+)\b", name):
                    layer["count"] = int(m.group(1))
                quoted = re.search(r'"([^"]+)"', name)
                if re.match(r"^(type|chu|text|numeral|number)\b", strip_accents(name.lower())):
                    layer["kind"] = "text"
                    if quoted:
                        layer["text"] = quoted.group(1).upper()
                    elif digits := re.search(r"\d+", name):
                        layer["text"] = digits.group(0)
                    else:
                        layer["text"] = re.sub(r"^(type|text|numeral|number)\s*", "",
                                               name, flags=re.I).upper()
                    aname = None
                else:
                    aname, _ = match_label(name, cue_assets, vocab)
                layer["asset"] = aname

                timing: dict = {}
                if aname:
                    stats["joined"] += 1
                    for cname, t in cue_assets:
                        if cname == aname and cname not in used:
                            timing = t
                            used.add(cname)
                            break
                    if aname not in known and not aname.startswith("code_"):
                        missing_assets.add(aname)
                layer.update({k: v for k, v in timing.items() if v is not None})
                layers.append(layer)

            for ci, (aname, timing) in enumerate(cue_assets):
                if aname in used:
                    continue
                used.add(aname)
                layers.append({
                    "id": shot_id + "-c" + str(ci), "label": aname, "asset": aname,
                    "x": None, "y": None, "to": [],
                    **{k: v for k, v in timing.items() if v is not None},
                })
                if aname not in known and not aname.startswith("code_"):
                    missing_assets.add(aname)

            if not layers:
                continue
            # the LAYERS table and the cue sheet often both name the same piece
            # of type; drawing it twice reads as a wobble, not as emphasis
            typed = {l.get("text") for l in layers if l.get("kind") == "text"}
            layers = [l for l in layers
                      if not (l.get("asset") == "code_label" and l.get("text") in typed)]
            # A row we could not resolve is a detail of something else — a key
            # nub on a virus, a ghost copy of a handle. Better absent than drawn
            # as a stub.
            for l in layers:
                if not l.get("asset") and l.get("kind") != "text":
                    dropped.append(sec + "/" + shot_id + "  " + l["label"][:46])
            layers = [l for l in layers if l.get("asset") or l.get("kind") == "text"]
            if not layers:
                continue
            # A card or a dashed outline with nothing written in it and nothing
            # inside it is an empty rectangle on screen. The production files
            # leave the wording to the editor; where the cue sheet did not
            # supply any, the frame is better off without the box.
            DROPPED_BY_SPEC = ("code_nego_table",)
            layers = [l for l in layers
                      if l.get("asset") not in DROPPED_BY_SPEC]
            # A card, chip or label with no wording draws nothing at all. Left
            # in the timeline it still counts as the shot's first layer, and the
            # renderer then holds an empty frame waiting for it — which is how
            # section 01 ended up blank for four seconds.
            NEEDS_TEXT = ("code_evidence_chip", "code_hypothesis_card",
                          "code_defect_label", "code_label")
            layers = [l for l in layers
                      if not (str(l.get("asset") or "").startswith(NEEDS_TEXT)
                              and not l.get("text"))]
            # an outline is a frame around something; alone it is an empty box
            FRAMES = ("code_dashed_outline", "code_room_outline", "code_trigger_box")
            if all(str(l.get("asset") or "").startswith(FRAMES) for l in layers):
                layers = []
            if not layers:
                continue
            # Two rows that resolved to the same artwork, sitting on top of one
            # another, are the join guessing — "rain strokes" matching the rain
            # cloud it is drawn on. One cloud, not two.
            seen: dict[str, dict] = {}
            deduped = []
            for l in layers:
                key = l.get("asset") or ""
                first = seen.get(key)
                if first and key and not key.startswith("code_"):
                    fx, fy = first.get("x"), first.get("y")
                    if fx is not None and l.get("x") is not None:
                        near = abs(fx - l["x"]) < 260 and abs(fy - l["y"]) < 260
                    else:
                        near = True
                    if near:
                        dropped.append(sec + "/" + shot_id + "  duplicate " + l["label"][:36])
                        continue
                seen.setdefault(key, l)
                deduped.append(l)
            layers = deduped

            place(shot_id, layers)
            compose(layers)
            layers = apply_overrides(sec, shot_id, layers)
            push_override = OVERRIDES.get(sec + "/" + shot_id, {}).get("_push")
            anchor = " ".join(vo.split()[:6]) if vo else None
            hold = None
            if mm := re.search(r"MIN\s*([\d.]+)s", block):
                hold = float(mm.group(1))
            if not anchor:
                stats["noanchor"] += 1
            shots_out.append({
                "id": shot_id, "title": shot_title, "anchor": anchor,
                "hold": hold, "vo": vo, "layers": layers,
                "push": push_override,
            })

        carry_forward(shots_out)
        for sh in shots_out:
            stack(sh["layers"])
            motion(sh)
        dstats = direct.direct(sec, shots_out, extent, MARKS, CONTAINERS)
        for k, v in dstats.items():
            direction_totals[k] = direction_totals.get(k, 0) + v
        if not report_only:
            (OUT / ("s" + sec + ".ts")).write_text(
                emit_ts(sec, title, shots_out), encoding="utf-8")
            (OUT / ("s" + sec + ".draft.json")).write_text(
                json.dumps({"id": sec, "title": title,
                            "audio": "biy2/audio/Audio" + sec + ".mp3",
                            "shots": shots_out}, indent=1, ensure_ascii=False),
                encoding="utf-8")
        print("s" + sec + ": " + str(len(shots_out)) + " shot, "
              + str(sum(len(s["layers"]) for s in shots_out)) + " layer")

    print("")
    print(stats)
    print("join rate: %d/%d (%.0f%%)" % (
        stats["joined"], stats["layers"], stats["joined"] / stats["layers"] * 100))
    print("assets named in cues with no PNG (code widgets): %d" % len(missing_assets))
    print("direction: " + ", ".join("%s %d" % kv for kv in direction_totals.items()))
    print("unresolved layer rows dropped: %d" % len(dropped))
    for d in dropped:
        print("   ", d)
    return 0


if __name__ == "__main__":
    sys.exit(main())
