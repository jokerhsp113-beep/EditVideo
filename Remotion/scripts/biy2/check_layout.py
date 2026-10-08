"""Static layout audit of every shot, from the generated drafts.

Reports, per shot:

  OUTSIDE  a layer leaves the 96/54 safe area
  STRAY    a verdict mark (X, tick, patch, ring) that lands on nothing
  OVERLAP  two subjects sitting on top of each other
  THIN     a shot whose whole content covers less than 3% of the frame

    python scripts/biy2/check_layout.py
"""

import json
import pathlib
import sys

from PIL import Image

DRAFTS = pathlib.Path("src/biy2/timeline")
ASSETS = pathlib.Path("public/biy2/assets")
W, H = 1920, 1080
SAFE_X, SAFE_Y = 96, 54

CONTAINERS = ("code_dashed_outline", "code_room_outline", "code_body_window",
              "code_trigger_box", "code_heat_gradient", "code_sky_split",
              "code_tsetse_belt", "code_shelf_line", "code_chapter_reset")

# A frame drawn around other things is meant to overlap them.
MARKS = ("code_mark", "code_price", "code_patch", "code_flush", "code_bruise",
         "code_carrier", "code_shield", "code_pore", "code_gap", "code_chapter")

_size: dict[str, tuple[int, int]] = {}


def asset_size(name: str):
    if name not in _size:
        p = ASSETS / (name + ".png")
        _size[name] = Image.open(p).size if p.exists() else (0, 0)
    return _size[name]


# Code widgets are drawn to a shape, and the production files usually give only
# one dimension. Without this a 1200px-wide shelf line is measured as 960 tall.
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


def box(layer: dict):
    x, y = layer.get("x"), layer.get("y")
    if x is None or y is None:
        return None
    name = layer.get("asset") or ""
    if layer.get("kind") == "text":
        s = layer.get("size") or 120
        w, h = len(str(layer.get("text", ""))) * s * 0.62, s * 1.2
    elif name and not name.startswith("code_"):
        aw, ah = asset_size(name)
        if not aw:
            return None
        if layer.get("h"):
            h = layer["h"]
            w = h * aw / ah
        elif layer.get("w"):
            w = layer["w"]
            h = w * ah / aw
        else:
            h, w = 320, 320 * aw / ah
    else:
        ratio = WIDGET_ASPECT.get(name)
        if ratio == 0.0:
            return None
        w = layer.get("w")
        h = layer.get("h")
        if not (w and h):
            if ratio and w:
                h = w * ratio
            elif ratio and h:
                w = h / ratio
            else:
                w = w or h or 300
                h = h or w
    return (x - w / 2, y - h / 2, x + w / 2, y + h / 2)


def cover(a, b) -> float:
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    area = (a[2] - a[0]) * (a[3] - a[1])
    return (ix * iy) / area if area else 0.0


def main() -> int:
    issues = 0
    shots = 0
    for draft in sorted(DRAFTS.glob("s??.draft.json")):
        data = json.load(open(draft, encoding="utf-8"))
        for shot in data["shots"]:
            shots += 1
            boxes = []
            for layer in shot["layers"]:
                b = box(layer)
                if b:
                    boxes.append((layer, b))
            if not boxes:
                continue
            tag = f"{data['id']}/{shot['id']}"

            for layer, b in boxes:
                if (layer.get("opacity") or 1) < 0.35 or layer.get("to"):
                    continue
                edges = [SAFE_X - b[0], b[2] - (W - SAFE_X), SAFE_Y - b[1], b[3] - (H - SAFE_Y)]
                worst = max(edges)
                if worst > 60:
                    side = ["left", "right", "top", "bottom"][edges.index(worst)]
                    print(f"  OUTSIDE  {tag:12} {layer['id']:10} {side} by {worst:.0f}px")
                    issues += 1

            subjects = [(l, b) for l, b in boxes
                        if not str(l.get("asset") or "").startswith(MARKS)]
            for l, b in boxes:
                if not str(l.get("asset") or "").startswith(MARKS):
                    continue
                best = max((cover(b, ob) for ol, ob in subjects if ol is not l), default=0.0)
                if best < 0.25:
                    print(f"  STRAY    {tag:12} {l['id']:10} {l.get('asset')} cover={best*100:.0f}%")
                    issues += 1

            framed = [(l, b) for l, b in subjects
                      if not str(l.get("asset") or "").startswith(CONTAINERS)]
            for i, (la, ba) in enumerate(framed):
                for lb, bb in framed[i + 1:]:
                    c = min(cover(ba, bb), cover(bb, ba))
                    if c > 0.55:
                        print(f"  OVERLAP  {tag:12} {la['id']}+{lb['id']} {c*100:.0f}%")
                        issues += 1

            # weight by how much a thing actually draws: a dashed frame the
            # size of the screen puts far less on it than a filled asset does
            def weight(l: dict) -> float:
                name = str(l.get("asset") or "")
                if name.startswith(("code_dashed", "code_room", "code_trigger")):
                    return 0.08
                if name.startswith(("code_divider", "code_supply", "code_timeline",
                                    "code_shelf", "code_adhesion", "code_gap")):
                    return 0.12
                if name.startswith("code_"):
                    return 0.5
                return 1.0

            ink = sum((b[2] - b[0]) * (b[3] - b[1]) * weight(l) for l, b in boxes) / (W * H)
            if ink < 0.03:
                print(f"  THIN     {tag:12} content covers {ink*100:.1f}% of frame")
                issues += 1

    print(f"\nchecked {shots} shots · {issues} issue(s)")
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
