"""Contact sheet of a rendered section, one frame every N seconds.

    python scripts/biy2/contact.py out/biy2/s00.mp4 2.5
"""
import pathlib, subprocess, sys, tempfile
from PIL import Image, ImageDraw

FF = pathlib.Path("node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe").resolve()
src = pathlib.Path(sys.argv[1])
every = float(sys.argv[2]) if len(sys.argv) > 2 else 2.5
out = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else pathlib.Path("sheet.png")

tmp = pathlib.Path(tempfile.mkdtemp())
# this Remotion ffmpeg build ships without filters, and thinning the stream
# with an output -r lands on the wrong frames; seek to each timestamp instead
dur = float(subprocess.run(
    [str(FF).replace("ffmpeg", "ffprobe"), "-v", "error", "-show_entries",
     "format=duration", "-of", "csv=p=0", str(src.resolve())],
    capture_output=True, text=True, check=True).stdout.strip())
stamps = []
t = 0.0
while t < dur:
    stamps.append(t)
    t += every
for i, t in enumerate(stamps):
    subprocess.run([str(FF), "-v", "error", "-ss", "%.3f" % t, "-i", str(src.resolve()),
                    "-frames:v", "1", "-s", "320x180", "-y",
                    str(tmp / ("f%03d.jpg" % i))], check=True)
fs = sorted(tmp.glob("*.jpg"))
C, W, H = 6, 320, 180
R = (len(fs) + C - 1) // C
sheet = Image.new("RGB", (C * W, R * (H + 16)), "white")
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    x, y = (i % C) * W, (i // C) * (H + 16)
    sheet.paste(Image.open(f), (x, y + 16))
    dr.text((x + 4, y + 3), f"{stamps[i]:.0f}s", fill="black")
sheet.save(out)
print(out, len(fs), "frames")
