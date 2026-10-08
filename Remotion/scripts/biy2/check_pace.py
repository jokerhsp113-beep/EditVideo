"""How often does the picture change?

Collects every moment something new arrives on screen — each shot cut and each
layer entering on a word — and reports the stretches where nothing does. A
viewer reads a still frame in about a second; past two and a half seconds of
nothing new, attention goes.

    python scripts/biy2/check_pace.py
"""
import json, pathlib, re, sys

LIMIT = 2.5


def load(sec):
    caps = json.load(open(f"public/biy2/captions/s{sec}.json", encoding="utf-8"))
    words, owner = [], []
    for i, c in enumerate(caps):
        for w in re.sub(r"[^a-z0-9 ]", " ", c["text"].lower()).split():
            words.append(w); owner.append(i)

    def find(phrase, frm):
        t = re.sub(r"[^a-z0-9 ]", " ", phrase.lower()).split()
        for i in range(len(words) - len(t) + 1):
            if caps[owner[i]]["startMs"] < frm:
                continue
            if words[i:i + len(t)] == t:
                return caps[owner[i]]["startMs"]
        return None
    return caps, find


def main():
    total_dead = 0.0
    total_len = 0.0
    worst = []
    for sec in [f"{i:02d}" for i in range(9)]:
        caps, find = load(sec)
        end = caps[-1]["endMs"] / 1000
        draft = json.load(open(f"src/biy2/timeline/s{sec}.draft.json", encoding="utf-8"))
        events = []
        cursor = 0
        for s in draft["shots"]:
            st = find(s["anchor"], cursor) if s.get("anchor") else None
            if st is None:
                continue
            cursor = st + 1
            events.append(st / 1000)
            # a camera beat is a change the viewer sees, same as a new layer
            for b in s.get("beats", []):
                t = find(b, st - 1)
                if t is not None:
                    events.append(t / 1000)
            for l in s["layers"]:
                if l.get("at"):
                    t = find(l["at"], st - 1)
                    if t is not None:
                        events.append(t / 1000)
                elif l.get("delay"):
                    events.append(st / 1000 + l["delay"])
        events = sorted(set(round(e, 2) for e in events)) + [end]
        dead = 0.0
        for a, b in zip(events, events[1:]):
            if b - a > LIMIT:
                dead += b - a - LIMIT
                worst.append((b - a, sec, a))
        changes = len(events) - 1
        total_dead += dead
        total_len += end
        print(f"s{sec}: {end:6.1f}s · {changes:3d} changes · one every {end / max(changes, 1):4.2f}s"
              f" · dead time {dead:5.1f}s")
    print(f"\nTOTAL dead time (beyond {LIMIT}s without a change): {total_dead:.0f}s "
          f"of {total_len:.0f}s ({total_dead / total_len * 100:.0f}%)")
    worst.sort(reverse=True)
    print("longest static stretches:")
    for g, sec, a in worst[:12]:
        print(f"   s{sec} at {a:6.1f}s  {g:4.1f}s with nothing new")


if __name__ == "__main__":
    sys.exit(main())
