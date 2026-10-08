"""Word-level captions for the BIY voiceover.

Whisper supplies the timings; the *text* comes from the locked script so that
gene names and spelling always match what is on screen. Whisper tokens are
aligned to the script with difflib and timings are interpolated across any
stretch where the two disagree.

Output: public/biy/captions/sNN.json in Remotion's `Caption[]` shape.
"""

import json
import pathlib
import re
import subprocess
import sys
from difflib import SequenceMatcher

from faster_whisper import WhisperModel

BIY = pathlib.Path(r"C:\Work\Youtube\Built Into You\Video001")
AUDIO = BIY / "Create_data" / "Audio"
SCRIPT = BIY / "BIY-v001-script-v4-TTS.md"
OUT = pathlib.Path("public/biy/captions")
FFMPEG = pathlib.Path("node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe").resolve()
TMP = pathlib.Path("scripts/biy/.wav")

MODEL = "small.en"
PROMPT = (
    "A B C C eleven, A L D H two, F U T two, goo-lo, M Y H sixteen, Casp twelve, G six P D, "
    "acetaldehyde, esophageal, hemolytic anemia, norovirus, non-secretors, Crohn's, fava."
)


def script_blocks() -> dict[str, list[str]]:
    txt = SCRIPT.read_text(encoding="utf-8")
    out: dict[str, list[str]] = {}
    for m in re.finditer(r"## ▸ Audio(\d\d)\.mp3[^\n]*\n\n```text\n(.*?)\n```", txt, re.S):
        sec, body = m.group(1), m.group(2)
        out[sec] = [p.strip() for p in body.split("\n\n") if p.strip()]
    return out


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def to_wav(mp3: pathlib.Path, wav: pathlib.Path) -> None:
    wav.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [str(FFMPEG), "-v", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", "16000", str(wav)],
        check=True,
    )


def align(script_words: list[str], heard: list[tuple[str, float, float]]) -> list[dict]:
    """Give every script word a start/end, borrowed from the matching heard words."""
    a = [norm(w) for w in script_words]
    b = [norm(w) for w, _, _ in heard]
    times: list[list[float] | None] = [None] * len(script_words)

    for tag, i1, i2, j1, j2 in SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                _, s, e = heard[j1 + k]
                times[i1 + k] = [s, e]
        elif tag in ("replace", "delete"):
            # spread the heard span (or the gap) evenly over the script words
            if j2 > j1:
                s, e = heard[j1][1], heard[j2 - 1][2]
            else:
                s = heard[j1 - 1][2] if j1 > 0 else 0.0
                e = heard[j1][1] if j1 < len(heard) else s
            n = i2 - i1
            step = (e - s) / n if n else 0
            for k in range(n):
                times[i1 + k] = [s + k * step, s + (k + 1) * step]

    # fill anything still empty by interpolation
    last = 0.0
    for i, t in enumerate(times):
        if t is None:
            nxt = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), last + 0.3)
            times[i] = [last, max(nxt, last + 0.05)]
        last = times[i][1]

    captions = []
    for i, w in enumerate(script_words):
        s, e = times[i]
        captions.append(
            {
                "text": (" " if i else "") + w,
                "startMs": round(s * 1000),
                "endMs": round(max(e, s + 0.04) * 1000),
                "timestampMs": round((s + e) * 500),
                "confidence": None,
            }
        )
    return captions


def main() -> None:
    only = sys.argv[1:] or None
    blocks = script_blocks()
    OUT.mkdir(parents=True, exist_ok=True)
    model = WhisperModel(MODEL, device="cpu", compute_type="int8")

    for sec, paras in sorted(blocks.items()):
        if only and sec not in only:
            continue
        mp3 = AUDIO / f"Audio{sec}.mp3"
        if not mp3.exists():
            print(f"s{sec}: MISSING {mp3.name}")
            continue
        wav = TMP / f"{sec}.wav"
        to_wav(mp3, wav)

        segs, _ = model.transcribe(
            str(wav), language="en", beam_size=5, word_timestamps=True,
            vad_filter=False, initial_prompt=PROMPT,
        )
        heard = [
            (w.word.strip(), w.start, w.end)
            for s in segs
            for w in s.words
            if w.word.strip()
        ]

        script_words: list[str] = []
        para_of: list[int] = []
        for pi, p in enumerate(paras):
            for w in p.split():
                script_words.append(w)
                para_of.append(pi)

        caps = align(script_words, heard)
        for i, c in enumerate(caps):
            # paragraph boundary -> page break for the caption renderer
            if i + 1 < len(caps) and para_of[i] != para_of[i + 1]:
                c["pageBreakAfter"] = True

        (OUT / f"s{sec}.json").write_text(json.dumps(caps, indent=1), encoding="utf-8")

        # paragraph index: start/end ms of every script paragraph
        para_times = []
        for pi in range(len(paras)):
            idx = [i for i, p in enumerate(para_of) if p == pi]
            para_times.append(
                {"index": pi, "startMs": caps[idx[0]]["startMs"], "endMs": caps[idx[-1]]["endMs"],
                 "text": paras[pi]}
            )
        (OUT / f"s{sec}.paragraphs.json").write_text(json.dumps(para_times, indent=1), encoding="utf-8")

        print(
            f"s{sec}: {len(caps)} words, {len(paras)} paragraphs, "
            f"heard {len(heard)}, ends {caps[-1]['endMs']/1000:.1f}s"
        )


if __name__ == "__main__":
    main()
