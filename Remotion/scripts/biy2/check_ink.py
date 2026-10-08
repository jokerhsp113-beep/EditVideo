"""Measure how much is on screen, frame by frame.

Decodes every frame to a thumbnail and counts pixels darker than the cream
background. A frame under `--floor` has effectively nothing on it, which is the
one defect a viewer always notices.

    python scripts/biy2/check_ink.py out/biy2/s00.mp4
    python scripts/biy2/check_ink.py out/biy2/BIY2-V002-full.mp4 --floor 0.0008
"""

import pathlib
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

FF = pathlib.Path("node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe").resolve()
# the cream background is 251,241,220; anything meaningfully darker is content
DARK = 228


def main() -> int:
    src = pathlib.Path(sys.argv[1]).resolve()
    floor = 0.0005
    if "--floor" in sys.argv:
        floor = float(sys.argv[sys.argv.index("--floor") + 1])

    tmp = pathlib.Path(tempfile.mkdtemp())
    try:
        subprocess.run(
            [str(FF), "-v", "error", "-i", str(src), "-s", "160x90",
             str(tmp / "f%06d.jpg")],
            check=True,
        )
        frames = sorted(tmp.glob("*.jpg"))
        inks = []
        for f in frames:
            a = np.asarray(Image.open(f).convert("L"))
            inks.append(float((a < DARK).mean()))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    arr = np.array(inks)
    empty = np.flatnonzero(arr < floor)
    print(f"{src.name}: {len(arr)} frames · median ink {np.median(arr) * 100:.2f}%")
    print(f"  below {floor}: {len(empty)} frame(s)")
    # report them as runs, not as a wall of frame numbers
    if len(empty):
        runs = []
        start = prev = empty[0]
        for i in empty[1:]:
            if i == prev + 1:
                prev = i
                continue
            runs.append((start, prev))
            start = prev = i
        runs.append((start, prev))
        for a, b in runs[:40]:
            print(f"    {a / 30:7.2f}s - {b / 30:7.2f}s  ({b - a + 1} frames)")
    return 1 if len(empty) else 0


if __name__ == "__main__":
    sys.exit(main())
