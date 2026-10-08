"""Static layout audit of every shot.

Uses the real pixel size of each keyed asset to work out the on-screen box of
every layer, then reports:

  OUTSIDE  layer leaves the 96/54 safe area
  STRAY    a verdict mark (X, check, slash, ring, halo) that lands on nothing

    python scripts/biy/check_layout.py
"""

import pathlib
import re
import sys

from PIL import Image

TL = pathlib.Path("src/biy/timeline")
ASSETS = pathlib.Path("public/biy/assets")
W, H = 1920, 1080
SAFE_X, SAFE_Y = 96, 54

VERDICT_SRC = ("prop_red_x", "prop_green_check", "ring_fp", "ring_nb")
VERDICT_KIND = ("slash", "strike", "ring", "warning")

_sizes: dict[str, tuple[int, int]] = {}


def asset_size(src: str):
    if src not in _sizes:
        p = ASSETS / (src + ".png")
        if not p.exists():
            return None
        _sizes[src] = Image.open(p).size
    return _sizes[src]


def split_layers(block: str) -> list[str]:
    """Brace-matched split of a shot's layers array (layers may nest props)."""
    start = block.find("layers: [")
    if start < 0:
        return []
    out: list[str] = []
    depth = 0
    current = ""
    for ch in block[start + len("layers: [") :]:
        if ch == "{":
            depth += 1
            if depth == 1:
                current = ""
                continue
        elif ch == "}":
            depth -= 1
            if depth == 0:
                out.append(current)
                continue
        elif ch == "]" and depth == 0:
            break
        if depth >= 1:
            current += ch
    return out


def parse_layers(block: str) -> list[dict]:
    layers: list[dict] = []
    for body in split_layers(block):
        if "id:" not in body:
            continue
        layer: dict = {}
        for key in ("id", "src", "kind", "text"):
            m = re.search(key + ':\\s*"([^"]*)"', body)
            if m:
                layer[key] = m.group(1)
        layer["travels"] = "toX:" in body or "toY:" in body
        layer["held"] = "held:" in body
        head = body.split("props:")[0]  # x/y/w/h live outside props
        for key in ("x", "y", "w", "h", "opacity"):
            m = re.search("\\b" + key + ":\\s*(-?[0-9.]+)", head)
            if m:
                layer[key] = float(m.group(1))
        m = re.search("size:\\s*([0-9]+)", body)
        if m:
            layer["fontSize"] = float(m.group(1))
        if "id" in layer and "x" in layer:
            layers.append(layer)
    return layers


def box(layer: dict):
    x, y = layer.get("x"), layer.get("y")
    if x is None or y is None:
        return None
    kind = layer.get("kind", "image")

    if kind == "image":
        size = asset_size(layer.get("src", ""))
        if not size:
            return None
        aw, ah = size
        if layer.get("h"):
            h = layer["h"]
            w = h * aw / ah
        elif layer.get("w"):
            w = layer["w"]
            h = w * ah / aw
        else:
            return None
    elif kind in ("text", "number"):
        fs = layer.get("fontSize", 380 if kind == "number" else 120)
        w = len(layer.get("text", "")) * fs * 0.58
        h = fs * 1.15
    elif kind == "strike":
        w = layer.get("w", 700)
        h = 60.0
    elif kind == "scale":
        w = layer.get("w", 760)
        h = 380.0 if layer.get("held") else w * 0.72
    else:
        w = layer.get("w", 240)
        h = layer.get("h", w)
    return (x - w / 2, y - h / 2, x + w / 2, y + h / 2)


def is_verdict(layer: dict) -> bool:
    return layer.get("kind") in VERDICT_KIND or any(v in layer.get("src", "") for v in VERDICT_SRC)


def cover(a, b) -> float:
    """Fraction of box a that box b covers."""
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    area = (a[2] - a[0]) * (a[3] - a[1])
    return (ix * iy) / area if area else 0.0


def main() -> int:
    issues = 0
    shots = 0
    for tl in sorted(TL.glob("s??.ts")):
        src = tl.read_text(encoding="utf-8")
        for m in re.finditer('id:\\s*"([\\w.]+)",(.*?)(?=\\n    \\{\\n      id:|\\n  \\],)', src, re.S):
            shot_id, block = m.group(1), m.group(2)
            shots += 1
            boxes = []
            for layer in parse_layers(block):
                b = box(layer)
                if b:
                    boxes.append((layer, b))

            for layer, b in boxes:
                if layer.get("opacity", 1) < 0.3 or layer.get("travels"):
                    continue
                edges = [SAFE_X - b[0], b[2] - (W - SAFE_X), SAFE_Y - b[1], b[3] - (H - SAFE_Y)]
                worst = max(edges)
                if worst > 40:
                    side = ["left", "right", "top", "bottom"][edges.index(worst)]
                    print(f"  OUTSIDE  {tl.stem}/{shot_id}/{layer['id']:12} {side} by {worst:.0f}px")
                    issues += 1

            for layer, b in boxes:
                if not is_verdict(layer):
                    continue
                best, target = 0.0, None
                for other, ob in boxes:
                    if other is layer or is_verdict(other):
                        continue
                    c = cover(b, ob)
                    if c > best:
                        best, target = c, other["id"]
                if best < 0.3:
                    print(
                        f"  STRAY    {tl.stem}/{shot_id}/{layer['id']:12} "
                        f"nearest={target} cover={best * 100:.0f}%"
                    )
                    issues += 1

    print("\nchecked %d shots · %d layout issue(s)" % (shots, issues))
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
