"""Flag shots that open on an empty screen.

A shot is empty at its first frame when every one of its layers waits for a
phrase (`at:`) or a `delay`. That reads as a white flash mid-video, which is the
same defect as a blank opening frame.

    python scripts/biy/check_empty_shots.py
"""

import pathlib
import re
import sys

TL = pathlib.Path("src/biy/timeline")


def layers_of(block: str) -> list[str]:
    """Split a shot's layer array into individual layer literals."""
    start = block.find("layers: [")
    if start < 0:
        return []
    depth = 0
    out: list[str] = []
    current = ""
    for ch in block[start + len("layers: [") :]:
        if ch == "[":
            depth += 1
        elif ch == "]":
            if depth == 0:
                break
            depth -= 1
        if ch == "{" and depth == 0:
            current = "{"
            depth += 1
            continue
        if depth > 0:
            current += ch
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    out.append(current)
                    current = ""
    return out


def main() -> int:
    bad = 0
    for tl in sorted(TL.glob("s??.ts")):
        src = tl.read_text(encoding="utf-8")
        shots = re.finditer(r'id:\s*"([\w.]+)",(.*?)(?=\n    \{\n      id:|\n  \],)', src, re.S)
        for m in shots:
            shot_id, block = m.group(1), m.group(2)
            layers = layers_of(block)
            if not layers:
                continue
            immediate = []
            for layer in layers:
                has_at = "at:" in layer
                delay = re.search(r"delay:\s*([\d.]+)", layer)
                waits = has_at or (delay and float(delay.group(1)) > 0.25)
                if not waits:
                    immediate.append(layer)
            if not immediate:
                first = re.search(r'id:\s*"([^"]+)"', layers[0])
                print(f"  EMPTY OPEN  {tl.stem}/{shot_id}  ({len(layers)} layers, first={first.group(1) if first else '?'})")
                bad += 1
    print(f"\n{bad} shot(s) open on an empty frame")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
