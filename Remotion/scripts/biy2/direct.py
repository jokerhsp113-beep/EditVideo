"""Direction pass: the decisions an editor makes after the layout is right.

build_timeline.py gets every layer into the right place. This decides how the
picture *behaves* over time, using the real word timings:

  swap      a thing that arrives where another thing already is replaces it.
            Sun then rain is a change of state, not a pile of both.
  connect   an arrow runs from one subject to the other, edge to edge; a
            directional arrow points at its target; a ring goes round what it
            rings.
  beats     no stretch longer than ~2s where nothing new happens. Where the
            production file leaves one, the camera punches in on the next
            sentence and the focal subject pulses.
  cuts      a scene change whips in; a continuation holds; the first shot of
            each item zooms in from 130% (chapter reset A in the spec).
"""

from __future__ import annotations

import json
import pathlib
import re

CAPTIONS = pathlib.Path("public/biy2/captions")

GAP = 2.1           # seconds of nothing new before a beat is added
MIN_SWAP = 0.40     # overlap (of the smaller box) that makes arrival a swap

ARROWS_BETWEEN = ("code_arrow",)
ARROWS_DOWN = ("code_uv_arrow", "code_risk_arrow")
ARROWS_UP = ("code_vitd_arrow", "code_selection_arrow")
RINGS = ("code_shield_ring", "code_spread_rings", "code_carrier_dot")
RULERS = ("code_ruler_marker", "code_gate_width_ruler")


def norm(s: str) -> list[str]:
    return re.sub(r"[^a-z0-9 ]", " ", s.lower()).split()


class Clock:
    """Resolve phrases to seconds against one section's captions."""

    def __init__(self, sec: str):
        caps = json.load(open(CAPTIONS / f"s{sec}.json", encoding="utf-8"))
        self.words: list[str] = []
        self.times: list[float] = []
        for c in caps:
            for w in norm(c["text"]):
                self.words.append(w)
                self.times.append(c["startMs"] / 1000)
        self.end = caps[-1]["endMs"] / 1000

    def find(self, phrase: str, after: float) -> float | None:
        t = norm(phrase)
        for i in range(len(self.words) - len(t) + 1):
            if self.times[i] < after:
                continue
            if self.words[i:i + len(t)] == t:
                return self.times[i]
        return None

    def span(self, a: float, b: float) -> list[tuple[int, float]]:
        return [(i, t) for i, t in enumerate(self.times) if a <= t < b]


def box(layer: dict, extent) -> tuple[float, float, float, float]:
    w, h = extent(layer)
    return layer["x"] - w / 2, layer["y"] - h / 2, layer["x"] + w / 2, layer["y"] + h / 2


def overlap(a, b) -> float:
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    small = min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]))
    return ix * iy / small if small > 0 else 0.0


def is_subject(l: dict, marks, containers) -> bool:
    name = str(l.get("asset") or "")
    if l.get("kind") == "text" or not name:
        return False
    if name.startswith(marks + containers + ARROWS_BETWEEN + ARROWS_DOWN + ARROWS_UP):
        return False
    if name.startswith(("code_label", "code_evidence", "code_trail")):
        return False
    return True


def direct(sec: str, shots: list[dict], extent, marks, containers) -> dict:
    clock = Clock(sec)
    stats = {"swaps": 0, "arrows": 0, "rings": 0, "beats": 0, "whips": 0}

    # --- resolve when every shot and layer arrives -------------------------
    cursor = 0.0
    starts: list[float | None] = []
    for s in shots:
        t = clock.find(s["anchor"], cursor) if s.get("anchor") else None
        if t is not None:
            cursor = t + 0.001
        starts.append(t)
    for i, s in enumerate(shots):
        st = starts[i] if starts[i] is not None else (starts[i - 1] or 0.0) if i else 0.0
        nxt = next((x for x in starts[i + 1:] if x is not None), clock.end)
        s["_t0"], s["_t1"] = st, nxt
        for l in s["layers"]:
            if l.get("id", "").endswith("~"):
                l["_t"] = st
            elif l.get("at"):
                l["_t"] = clock.find(l["at"], st - 0.001) or st
            else:
                l["_t"] = st + float(l.get("delay") or 0)

    for idx, s in enumerate(shots):
        placed = [l for l in s["layers"] if l.get("x") is not None]
        subjects = [l for l in placed if is_subject(l, marks, containers)]

        # --- swap: arriving on top of something replaces it ---------------
        # Only artwork replaces artwork. A code-drawn ray, ring or bar landing
        # on the sun is annotating it; treating that as a replacement deletes
        # the sun and leaves the rays hanging in the air.
        art = [l for l in subjects if not str(l.get("asset") or "").startswith("code_")]

        def area(l: dict) -> float:
            b = box(l, extent)
            return (b[2] - b[0]) * (b[3] - b[1])

        for a in art:
            if a.get("exitOn"):
                continue                      # authored by hand: never second-guess it
            later = sorted((b for b in art if b is not a and b["_t"] > a["_t"] + 0.25),
                           key=lambda b: b["_t"])
            for b in later:
                # a key arriving at the edge of a door is a detail on it, not
                # its replacement — only something of comparable size takes over
                if area(b) < 0.4 * area(a):
                    continue
                if overlap(box(a, extent), box(b, extent)) >= MIN_SWAP:
                    a["exitOn"] = b["id"]
                    stats["swaps"] += 1
                    break

        # --- connect: arrows and rings attach to what they refer to -------
        for l in placed:
            name = str(l.get("asset") or "")
            others = [o for o in subjects if o is not l]
            if not others:
                continue
            if name.startswith(ARROWS_BETWEEN) and len(others) >= 2:
                # the two subjects either side of where the arrow was put
                left = [o for o in others if o["x"] <= l["x"]]
                right = [o for o in others if o["x"] > l["x"]]
                if left and right:
                    a = max(left, key=lambda o: o["x"])
                    b = min(right, key=lambda o: o["x"])
                    ax1 = box(a, extent)[2] + 30
                    bx0 = box(b, extent)[0] - 30
                    y = (a["y"] + b["y"]) / 2
                    if bx0 - ax1 > 80:
                        l.update({"x": int((ax1 + bx0) / 2), "y": int(y),
                                  "w": int(bx0 - ax1), "h": 90})
                        l.setdefault("props", {})["span"] = int(bx0 - ax1)
                        stats["arrows"] += 1
            elif name.startswith(ARROWS_DOWN + ARROWS_UP):
                target = min(others, key=lambda o: (o["x"] - l["x"]) ** 2 + (o["y"] - l["y"]) ** 2)
                t = box(target, extent)
                # as long as the room above the target allows, never out of frame
                room = t[1] - 54 - 10
                h = int(max(110, min(200, room)))
                if name.startswith(ARROWS_DOWN):
                    # tip lands on the top edge of what it hits
                    y = t[1] - h / 2 - 10
                    x = target["x"]
                else:
                    # rises out of the top of what produces it
                    y = t[1] - h / 2 + 30
                    x = target["x"] + (t[2] - t[0]) * 0.28
                y = max(54 + h / 2, y)
                l.update({"x": int(x), "y": int(y), "h": h, "w": int(h * 0.55)})
                stats["arrows"] += 1
            elif name.startswith(RULERS):
                pool = [o for o in others if not str(o.get("asset") or "").startswith(RULERS)]
                if not pool:
                    continue
                if name == "code_gate_width_ruler":
                    gates = [o for o in pool if "gate" in str(o.get("asset") or "")]
                    target = min(gates or pool, key=lambda o: (o["x"] - l["x"]) ** 2 + (o["y"] - l["y"]) ** 2)
                    t = box(target, extent)
                    span = int(max(180, min(520, (t[2] - t[0]) * 0.9)))
                    y = min(980, t[3] + 72)
                    l.update({"x": int(target["x"]), "y": int(y), "w": span, "h": 92})
                    l.setdefault("props", {})["orientation"] = "horizontal"
                else:
                    target = min(pool, key=lambda o: (o["x"] - l["x"]) ** 2 + (o["y"] - l["y"]) ** 2)
                    t = box(target, extent)
                    h = int(max(150, min(440, (t[3] - t[1]) * 1.05)))
                    right = t[2] + 66
                    x = right if right + 50 < 1824 else t[0] - 66
                    l.update({"x": int(x), "y": int(target["y"]), "w": 104, "h": h})
                stats["arrows"] += 1
            elif name.startswith(RINGS):
                pool = others
                if name == "code_spread_rings":
                    # spreading happens across a map, not around a strip of rice
                    maps = [o for o in others if str(o.get("asset") or "").startswith("asset_map")]
                    pool = maps or others
                target = min(pool, key=lambda o: (o["x"] - l["x"]) ** 2 + (o["y"] - l["y"]) ** 2)
                t = box(target, extent)
                if name == "code_carrier_dot" and target.get("asset") == "code_crowd_grid":
                    # a carrier is a marked person in the crowd, not a dot in the
                    # middle of it
                    props = target.setdefault("props", {})
                    props["carrierDots"] = sorted(set(props.get("carrierDots", []) + [3, 8, 14]))
                    l["_drop"] = True
                    stats["rings"] += 1
                    continue
                if str(target.get("asset") or "").startswith("asset_map"):
                    d = int((t[3] - t[1]) * 0.55)       # a point of origin on the map
                else:
                    d = int(max(t[2] - t[0], t[3] - t[1]) * 1.18)
                cx, cy = target["x"], target["y"]
                # a ring is only useful if all of it is on screen
                fit = 2 * min(cy - 54, 1080 - 54 - cy, cx - 96, 1920 - 96 - cx)
                d = max(120, min(d, int(fit)))
                l.update({"x": int(cx), "y": int(cy), "w": d, "h": d, "_ring_of": target["id"]})
                stats["rings"] += 1

        # one ring of a kind per shot: a second one lands on the wrong thing
        seen_rings: dict[str, dict] = {}
        for l in placed:
            name = str(l.get("asset") or "")
            if not name.startswith(RINGS) or l.get("_drop"):
                continue
            prev_ring = seen_rings.get(name)
            if prev_ring is None:
                seen_rings[name] = l
                continue
            keep, lose = (prev_ring, l) if prev_ring["w"] >= l["w"] else (l, prev_ring)
            lose["_drop"] = True
            seen_rings[name] = keep
        s["layers"] = [l for l in s["layers"] if not l.get("_drop")]
        for l in s["layers"]:
            l.pop("_ring_of", None)

        # --- beats: fill any stretch where nothing new happens ------------
        events = sorted({round(l["_t"], 2) for l in s["layers"]} | {round(s["_t0"], 2)})
        events = [e for e in events if s["_t0"] <= e < s["_t1"]] + [s["_t1"]]
        beats: list[str] = []
        vo_words = norm(s.get("vo") or "")
        for a, b in zip(events, events[1:]):
            if b - a <= GAP:
                continue
            # one beat per ~1.6s of the gap, each on a real word so it lands
            # on the voice rather than between syllables
            n = int((b - a) // 1.6)
            for k in range(1, n + 1):
                target_t = a + (b - a) * k / (n + 1)
                cands = clock.span(a + 0.6, b - 0.5)
                if not cands:
                    continue
                i, _ = min(cands, key=lambda c: abs(c[1] - target_t))
                phrase = _unique_phrase(clock, i, s["_t0"])
                if phrase and phrase not in beats:
                    beats.append(phrase)
        if beats:
            s["beats"] = beats
            stats["beats"] += len(beats)

        # --- cuts ----------------------------------------------------------
        # A whip on every cut is noise. It marks a change of *scene*: nothing
        # carried over, and no artwork in common with the shot before. Where
        # the character or the diagram continues, a hard cut reads better.
        carried = any(l.get("id", "").endswith("~") for l in s["layers"])
        if idx == 0:
            s["transition"] = "zoom"
        elif not carried:
            before = {l.get("asset") for l in shots[idx - 1]["layers"]
                      if is_subject(l, marks, containers)}
            now = {l.get("asset") for l in s["layers"] if is_subject(l, marks, containers)}
            if not (before & now):
                s["transition"] = "whip"
                stats["whips"] += 1

    for s in shots:
        s.pop("_t0", None)
        s.pop("_t1", None)
        for l in s["layers"]:
            l.pop("_t", None)
    return stats


def _unique_phrase(clock: Clock, i: int, shot_start: float) -> str | None:
    """Shortest phrase starting at word i that first occurs at word i."""
    for n in range(2, 6):
        words = clock.words[i:i + n]
        if len(words) < n:
            return None
        phrase = " ".join(words)
        if clock.find(phrase, shot_start - 0.001) == clock.times[i]:
            return phrase
    return None
