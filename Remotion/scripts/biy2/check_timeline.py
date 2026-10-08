"""Every shot anchor and every layer `at:` must exist in the recorded captions.

    python scripts/biy2/check_timeline.py
"""
import json, pathlib, re, sys

TL = pathlib.Path("src/biy2/timeline")
CAP = pathlib.Path("public/biy2/captions")


def norm(s): return re.sub(r"[^a-z0-9 ]", " ", s.lower()).split()


def main():
    bad = ok = 0
    for tl in sorted(TL.glob("s??.ts")):
        sec = tl.stem
        words = [w for c in json.load(open(CAP / (sec + ".json"), encoding="utf-8"))
                 for w in norm(c["text"])]
        hay = " " + " ".join(words) + " "
        src = tl.read_text(encoding="utf-8")
        shot = None
        miss = []
        for line in src.splitlines():
            if m := re.search(r'id: "([\w.]+)",$', line.strip()):
                shot = m.group(1)
            phrases = []
            for key in ("anchor", "at"):
                if m := re.search(key + r': "([^"]+)"', line):
                    phrases.append((key, m.group(1)))
            if m := re.search(r"beats: \[(.*)\]", line):
                phrases += [("beat", b) for b in re.findall(r'"([^"]+)"', m.group(1))]
            for key, text in phrases:
                if True:
                    phrase = " " + " ".join(norm(text)) + " "
                    if phrase.strip() and phrase in hay:
                        ok += 1
                    else:
                        bad += 1
                        miss.append((shot, key, text))
        print(f"{sec}: {len(miss)} unresolved")
        for s, k, p in miss:
            print(f"    {s} {k}=\"{p}\"")
    print(f"\nresolved {ok} · unresolved {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
