"""Print when each shot starts, resolved the same way the renderer does.

    python scripts/biy2/shot_times.py 01
"""
import json, pathlib, re, sys

sec = sys.argv[1]
caps = json.load(open(f"public/biy2/captions/s{sec}.json", encoding="utf-8"))
words, owner = [], []
for i, c in enumerate(caps):
    for w in re.sub(r"[^a-z0-9 ]", " ", c["text"].lower()).split():
        words.append(w); owner.append(i)


def find(phrase, from_ms):
    t = re.sub(r"[^a-z0-9 ]", " ", phrase.lower()).split()
    for i in range(len(words) - len(t) + 1):
        if caps[owner[i]]["startMs"] < from_ms:
            continue
        if words[i:i + len(t)] == t:
            return caps[owner[i]]["startMs"]
    return None


draft = json.load(open(f"src/biy2/timeline/s{sec}.draft.json", encoding="utf-8"))
cursor = 0
rows = []
for s in draft["shots"]:
    ms = find(s["anchor"], cursor) if s.get("anchor") else None
    if ms is not None:
        cursor = ms + 1
    rows.append((s["id"], ms, len(s["layers"])))
for i, (sid, ms, n) in enumerate(rows):
    nxt = next((m for _, m, _ in rows[i + 1:] if m is not None), None)
    a = (ms or 0) / 1000
    b = (nxt / 1000) if nxt else a
    print(f"{sid:8} {a:7.2f}s -> {b:7.2f}s  ({b - a:5.2f}s, {n} layers)")
