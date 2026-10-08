"""Key the magenta background out of every BIY source asset.

The source JPEGs do not all use a clean #FF00FF: some render as (191,45,146).
So the background colour is estimated per image from its border pixels, and
pixels are keyed by distance to that colour instead of a fixed threshold.
"""

import json
import pathlib

import numpy as np
from PIL import Image

SRC = pathlib.Path(r"C:\Work\Youtube\Built Into You\Video001\Create_data\Image")
DST = pathlib.Path("public/biy/assets")

# distance (in RGB units) to the estimated background colour
T_OUT = 45.0   # closer than this -> fully transparent
T_IN = 120.0   # further than this -> fully opaque


def border_color(a: np.ndarray) -> np.ndarray:
    b = 12
    edge = np.concatenate(
        [
            a[:b].reshape(-1, 3),
            a[-b:].reshape(-1, 3),
            a[:, :b].reshape(-1, 3),
            a[:, -b:].reshape(-1, 3),
        ]
    )
    return np.median(edge, axis=0)


def key(im: Image.Image) -> tuple[Image.Image, str]:
    a = np.asarray(im).astype(np.float32)
    bg = border_color(a)
    r, g, b = bg
    if not (r > g + 40 and b > g + 40):
        return im.convert("RGBA"), "no-magenta-bg"

    dist = np.linalg.norm(a - bg, axis=-1)
    alpha = np.clip((dist - T_OUT) / (T_IN - T_OUT), 0, 1)

    # despill: in the transition zone, remove the background tint
    rgb = a.copy()
    partial = (alpha > 0) & (alpha < 1)
    if partial.any():
        k = (1 - alpha[partial])[:, None]
        rgb[partial] = np.clip((rgb[partial] - k * bg) / np.maximum(1 - k, 0.25), 0, 255)

    # residual despill on opaque pixels that still lean magenta
    rr, gg, bb = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lean = np.minimum(rr, bb) - gg
    over = np.clip(lean - 25, 0, None) * 0.9
    rgb[..., 0] = np.where(lean > 25, np.maximum(rr - over, gg), rr)
    rgb[..., 2] = np.where(lean > 25, np.maximum(bb - over, gg), bb)

    # kill the faint halo the JPEG leaves behind, otherwise the crop below keeps
    # the whole frame and every layer ends up with a huge transparent margin
    # the generator leaves faint pink smudges (rgb ~255,80,250) in some corners:
    # they survive a low alpha floor and then drag the crop box out to the frame edge
    a8 = (alpha * 255).astype(np.uint8)
    a8[a8 < 120] = 0

    out = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), a8])
    return Image.fromarray(out, "RGBA"), f"bg={tuple(int(v) for v in bg)}"


def main() -> None:
    amap = json.loads(pathlib.Path("scripts/biy/asset_map.json").read_text(encoding="utf-8"))
    rows = []
    for sec, entries in amap.items():
        for code, meta in entries.items():
            if meta["kind"] != "image":
                continue
            src = SRC / sec / f"{code}.jpeg"
            if not src.exists():
                rows.append((sec, code, meta["name"], "MISSING"))
                continue
            img, note = key(Image.open(src).convert("RGB"))
            # crop to the real subject: rows/cols holding almost no ink are noise
            al = np.asarray(img)[..., 3]
            solid = al > 180
            keep_cols = solid.sum(axis=0) > max(2, solid.shape[0] * 0.004)
            keep_rows = solid.sum(axis=1) > max(2, solid.shape[1] * 0.004)
            bbox = None
            if keep_cols.any() and keep_rows.any():
                x0 = int(np.argmax(keep_cols))
                x1 = int(len(keep_cols) - np.argmax(keep_cols[::-1]))
                y0 = int(np.argmax(keep_rows))
                y1 = int(len(keep_rows) - np.argmax(keep_rows[::-1]))
                bbox = (x0, y0, x1, y1)
            if bbox:
                pad = max(4, int(0.015 * max(bbox[2] - bbox[0], bbox[3] - bbox[1])))
                bbox = (
                    max(bbox[0] - pad, 0),
                    max(bbox[1] - pad, 0),
                    min(bbox[2] + pad, img.width),
                    min(bbox[3] + pad, img.height),
                )
                img = img.crop(bbox)
            d = DST / f"s{sec}"
            d.mkdir(parents=True, exist_ok=True)
            img.save(d / f"{meta['name']}.png")
            fill = float((np.asarray(img)[..., 3] > 40).mean())
            rows.append((sec, code, meta["name"], f"{img.width}x{img.height} fill={fill:.2f} {note}"))

    print(f"{len(rows)} assets keyed -> {DST}")
    for row in rows:
        if "MISSING" in row[3] or "no-magenta-bg" in row[3]:
            print("  !", row)
        else:
            fill = float(row[3].split("fill=")[1].split()[0])
            if fill < 0.02 or fill > 0.95:
                print("  ?", row)


if __name__ == "__main__":
    main()
