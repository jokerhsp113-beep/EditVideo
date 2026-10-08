import re, json, pathlib
SRC = pathlib.Path(r"C:\Work\Youtube\Built Into You\Video001\Create_data\Image")
out = {}
for md in sorted(SRC.glob("*.md")):
    sec = md.name[:2]
    txt = md.read_text(encoding="utf-8")
    entries = {}
    # "## A4 · `stick_walk_remember_v01.png`"  or  "## C1 · Red X"
    for m in re.finditer(r"^##\s+([ABC]\d+)\s*[·\-]\s*(.+)$", txt, re.M):
        code, label = m.group(1), m.group(2).strip()
        fn = re.match(r"`([\w\-.]+)`", label)
        if fn:
            name = fn.group(1).rsplit(".", 1)[0]
            kind = "image"
        else:
            name = re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")
            kind = "code"
        entries[code] = {"name": name, "kind": kind, "label": label}
    out[sec] = entries
pathlib.Path("scripts/biy/asset_map.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
for s, e in out.items():
    img = [c for c, v in e.items() if v["kind"] == "image"]
    print(s, len(e), "entries |", len(img), "image:", ",".join(sorted(img, key=lambda x:(x[0],int(x[1:])))))
