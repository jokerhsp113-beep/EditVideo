"""Turn the Video002 source JPEGs into keyed, cropped PNGs.

Reads the asset headings out of the nine production files so every image is
written under its real name (`asset_coat_rack_bare_v01.png`), not its B-number.
Four B-numbers are reused for different assets in different sections, so the
number is not a usable key.

    python scripts/biy2/build_assets.py
"""

import json
import pathlib
import re
import sys

import numpy as np
from PIL import Image, ImageFilter

SRC = pathlib.Path(r"C:\Work\Youtube\Built Into You\Video002\Create_data")
OUT = pathlib.Path("public/biy2/assets")

# the generator stamps a faint sparkle into the bottom-right corner. It keys as
# real content, and autocrop then keeps the whole frame — this is exactly what
# made every Video001 asset 22% too small. Blank it before doing anything else.
MARK_X, MARK_Y = 0.93, 0.85

T_OUT = 45.0   # distance to background -> fully transparent
T_IN = 120.0   # -> fully opaque
ALPHA_FLOOR = 120
CROP_SOLID = 180


def declarations() -> dict[tuple[str, str], str]:
    """(section, code) -> asset name, from the production markdown."""
    out: dict[tuple[str, str], str] = {}
    for md in sorted(SRC.glob("*.md")):
        m = re.match(r"(\d\d)-", md.name)
        sec = m.group(1) if m else "CL"
        head = md.read_text(encoding="utf-8", errors="replace")
        cut = head.find("# 1 · SHOT INDEX")
        if cut > 0:
            head = head[:cut]
        for h in re.finditer(r"^#{2,4}\s+([ABC]\d+)\s*(?:·|—|-)\s*(.*)$", head, re.M):
            code, rest = h.group(1), h.group(2)
            if "KHÔNG DÙNG" in rest or "ĐÃ BỎ" in rest:
                continue
            nm = re.search(r"`([^`]+)`", rest)
            if nm and (sec, code) not in out:
                out[(sec, code)] = nm.group(1).replace(".png", "")
    return out


def drop_islands(a8: np.ndarray, min_frac: float = 0.0006) -> np.ndarray:
    """Erase specks the keyer left behind.

    Any opaque blob smaller than `min_frac` of the frame is background that
    survived, not part of the subject. Left in, a single stray pixel in a corner
    also defeats the autocrop below.
    """
    mask = a8 > 0
    h, w = mask.shape

    # run-length rows + union-find: a per-pixel flood fill in Python is far too
    # slow over a hundred 1376x768 frames.
    runs: list[tuple[int, int, int]] = []          # (row, x0, x1) half-open
    row_runs: list[list[int]] = []
    for y in range(h):
        idx: list[int] = []
        row = mask[y]
        if row.any():
            edges = np.flatnonzero(np.diff(np.concatenate(([0], row.view(np.int8), [0]))))
            for x0, x1 in zip(edges[::2], edges[1::2]):
                idx.append(len(runs))
                runs.append((y, int(x0), int(x1)))
        row_runs.append(idx)

    parent = list(range(len(runs)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for y in range(1, h):
        for i in row_runs[y]:
            _, a0, a1 = runs[i]
            for j in row_runs[y - 1]:
                _, b0, b1 = runs[j]
                if b0 < a1 and a0 < b1:
                    ri, rj = find(i), find(j)
                    if ri != rj:
                        parent[ri] = rj

    size: dict[int, int] = {}
    for i, (_, x0, x1) in enumerate(runs):
        r = find(i)
        size[r] = size.get(r, 0) + (x1 - x0)

    limit = h * w * min_frac
    for i, (y, x0, x1) in enumerate(runs):
        if size[find(i)] < limit:
            a8[y, x0:x1] = 0
    return a8


def defringe(img: Image.Image) -> Image.Image:
    """Remove the off-white matte and purple JPEG fringe around keyed art."""
    a = np.array(img.convert("RGBA"), copy=True)
    rgb = a[..., :3].astype(np.int16)
    alpha = a[..., 3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hi, lo = rgb.max(axis=2), rgb.min(axis=2)
    clear = alpha == 0

    def expand(mask: np.ndarray, size: int) -> np.ndarray:
        return np.asarray(
            Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(size))
        ) > 0

    near8 = expand(clear, 17)
    near3 = expand(clear, 7)
    light_matte = (alpha > 0) & near8 & (lo > 164) & ((hi - lo) < 105)
    purple = (
        (alpha > 0) & (r > g + 10) & (b > g + 10)
        & (np.abs(r - b) < 40) & ((r + b) > 55)
    )
    weak_edge = near3 & (alpha > 0) & ((alpha < 225) | purple)
    alpha[light_matte | weak_edge] = 0
    purple &= alpha > 0
    neutral = g.clip(0, 255).astype(np.uint8)
    for c in range(3):
        a[..., c][purple] = neutral[purple]
    a[..., 3] = alpha
    a[alpha == 0, :3] = 0
    return Image.fromarray(a)


def key(path: pathlib.Path) -> Image.Image:
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)

    rgb[int(h * MARK_Y):, int(w * MARK_X):] = bg

    dist = np.linalg.norm(rgb - bg, axis=2)
    alpha = np.clip((dist - T_OUT) / (T_IN - T_OUT), 0, 1)
    a8 = (alpha * 255).astype(np.uint8)
    a8[a8 < ALPHA_FLOOR] = 0

    # despill: pull the background hue out of the semi-transparent fringe
    fringe = (a8 > 0) & (a8 < 255)
    if fringe.any():
        k = ((a8[fringe] / 255.0)[:, None])
        rgb[fringe] = np.clip((rgb[fringe] - bg * (1 - k)) / np.maximum(k, 0.25), 0, 255)

    a8 = drop_islands(a8)
    out = np.dstack([rgb.astype(np.uint8), a8])

    solid = a8 > CROP_SOLID
    if not solid.any():
        return defringe(Image.fromarray(out))
    cols = solid.sum(axis=0) > max(2, solid.shape[0] * 0.004)
    rows = solid.sum(axis=1) > max(2, solid.shape[1] * 0.004)
    x0, x1 = np.argmax(cols), len(cols) - np.argmax(cols[::-1])
    y0, y1 = np.argmax(rows), len(rows) - np.argmax(rows[::-1])
    pad = 4
    return defringe(Image.fromarray(
        out[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
    ))


def main() -> int:
    decl = declarations()
    OUT.mkdir(parents=True, exist_ok=True)
    written: dict[str, str] = {}
    skipped: list[str] = []

    for p in sorted(SRC.glob("[0-9][0-9]/*")):
        sec = p.parent.name
        code = re.match(r"([ABC]\d+)", p.stem).group(1)
        name = decl.get((sec, code))
        if name is None:
            skipped.append(f"{sec}/{p.name}  (không có khai báo)")
            continue
        # C4 ships three window states as separate files, named C4_window_open —
        # drop the repeated token so the state lands as `code_window_open`
        suffix = p.stem[len(code):].lstrip("_")
        if suffix and name.endswith("_" + suffix.split("_")[0]):
            suffix = suffix.split("_", 1)[1] if "_" in suffix else ""
        target = f"{name}_{suffix}" if suffix else name
        img = key(p)
        img.save(OUT / f"{target}.png")
        written[target] = f"{sec}/{p.name}"

    json.dump(
        {"assets": written, "declared": {f"{s}/{c}": n for (s, c), n in decl.items()}},
        open("scripts/biy2/asset_map.json", "w", encoding="utf-8"),
        indent=1,
        ensure_ascii=False,
    )
    print(f"keyed {len(written)} asset(s) -> {OUT}")
    for s in skipped:
        print("  SKIP", s)

    # any asset a production file names but that has no image on disk
    missing = sorted({n for n in decl.values() if not n.startswith("code_")} - set(written))
    for m in missing:
        print("  MISSING IMAGE", m)
    return 0


if __name__ == "__main__":
    sys.exit(main())
