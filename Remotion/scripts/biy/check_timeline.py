"""Verify every shot anchor and every layer `at:` phrase exists in the captions.

Run after editing any timeline file:
    python scripts/biy/check_timeline.py
"""

import json
import pathlib
import re
import sys

CAP = pathlib.Path("public/biy/captions")
TL = pathlib.Path("src/biy/timeline")


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", s.lower())).strip()


def words(section: str) -> tuple[list[str], list[dict], list[int]]:
    caps = json.loads((CAP / f"s{section}.json").read_text(encoding="utf-8"))
    toks, owner = [], []
    for i, c in enumerate(caps):
        for w in norm(c["text"]).split():
            toks.append(w)
            owner.append(i)
    return toks, caps, owner


def find(tokens: list[str], phrase: str, start: int = 0) -> int:
    target = norm(phrase).split()
    for i in range(start, len(tokens) - len(target) + 1):
        if tokens[i : i + len(target)] == target:
            return i
    return -1


def main() -> int:
    bad = 0
    for tl in sorted(TL.glob("s??.ts")):
        section = tl.stem[1:]
        if not (CAP / f"s{section}.json").exists():
            continue
        tokens, caps, owner = words(section)
        src = tl.read_text(encoding="utf-8")
        print(f"\n=== s{section}")

        cursor = 0
        for m in re.finditer(r'id:\s*"([\d.TP]+)"(.*?)(?=\n    \{\n      id:|\n  \],)', src, re.S):
            shot_id, block = m.group(1), m.group(2)
            am = re.search(r'anchor:\s*"([^"]+)"', block)
            if am:
                i = find(tokens, am.group(1), cursor)
                if i < 0:
                    print(f"  MISS anchor  {shot_id}: {am.group(1)!r}")
                    bad += 1
                else:
                    cursor = i + 1
                    print(f"  ok   {shot_id:6} {caps[owner[i]]['startMs']/1000:7.2f}s  {am.group(1)}")
            else:
                print(f"  ok   {shot_id:6} (no anchor)")

            for at in re.finditer(r'at:\s*"([^"]+)"', block):
                if find(tokens, at.group(1), max(cursor - 1, 0)) < 0:
                    print(f"       MISS at    {shot_id}: {at.group(1)!r}")
                    bad += 1

    print(f"\n{bad} unresolved phrase(s)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
