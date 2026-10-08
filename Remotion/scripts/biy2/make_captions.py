"""Word-level captions for the Video002 voiceover.

Whisper supplies the timings; the *text* comes from the locked master TTS script,
so gene names and spelling on screen always match what was actually recorded.
Whisper tokens are aligned to the script with difflib and timings are
interpolated across any stretch where the two disagree.

Output: public/biy2/captions/sNN.json in Remotion's `Caption[]` shape.

    python scripts/biy2/make_captions.py          # all nine
    python scripts/biy2/make_captions.py 02 05    # just these
"""

import json
import pathlib
import re
import subprocess
import sys
from difflib import SequenceMatcher

BIY = pathlib.Path(r"C:\Work\Youtube\Built Into You\Video002")
AUDIO = BIY / "Audio"
SCRIPT = BIY / "BIY-001-MASTER-TTS.md"
OUT = pathlib.Path("public/biy2/captions")
# timings of the tightened voiceover (see tighten_vo.py), carried through
# the same cuts as the audio, so no re-transcription is needed
CACHE = pathlib.Path("scripts/biy2/.words_tight")
FFMPEG = pathlib.Path("node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe").resolve()

CHUNKS = ["00", "01", "02", "03", "04", "05", "06", "07", "CL"]
MODEL = "small.en"
PROMPT = (
    "MC1R, ALDH2, CCR5, delta-32, MEFV, ABO, CPT1A, APOL1, eumelanin, pheomelanin, "
    "acetaldehyde, pyrin, podocytes, trypanosome, tsetse, von Willebrand, Yup'ik, Inuit."
)


def script_chunks() -> dict[str, str]:
    txt = SCRIPT.read_text(encoding="utf-8")
    return {
        m.group(1): m.group(2).strip()
        for m in re.finditer(r"^# ▣ CHUNK (\w+) ·.*?\n```text\n(.*?)\n```", txt, re.S | re.M)
    }


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def heard_words(index: int) -> list[tuple[str, float, float]]:
    """Whisper word timings, cached — a full pass over 15 minutes is slow."""
    cache = CACHE / f"{index:02d}.json"
    if cache.exists():
        return [(w["w"], w["s"], w["e"]) for w in json.load(open(cache, encoding="utf-8"))]

    from faster_whisper import WhisperModel

    cache.parent.mkdir(parents=True, exist_ok=True)
    wav = CACHE / f"{index:02d}.wav"
    subprocess.run(
        [str(FFMPEG), "-v", "error", "-y", "-i", str(AUDIO / f"Audio{index:02d}.mp3"),
         "-ac", "1", "-ar", "16000", str(wav)],
        check=True,
    )
    model = WhisperModel(MODEL, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(
        str(wav), language="en", beam_size=5, word_timestamps=True,
        vad_filter=False, initial_prompt=PROMPT,
    )
    words = [
        {"w": w.word.strip(), "s": w.start, "e": w.end}
        for s in segs for w in s.words if w.word.strip()
    ]
    json.dump(words, open(cache, "w", encoding="utf-8"))
    wav.unlink(missing_ok=True)
    return [(w["w"], w["s"], w["e"]) for w in words]


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
            if j2 > j1:
                s, e = heard[j1][1], heard[j2 - 1][2]
            else:
                s = heard[j1 - 1][2] if j1 > 0 else 0.0
                e = heard[j1][1] if j1 < len(heard) else s
            n = i2 - i1
            step = (e - s) / n if n else 0
            for k in range(n):
                times[i1 + k] = [s + k * step, s + (k + 1) * step]

    last = 0.0
    for i, t in enumerate(times):
        if t is None:
            nxt = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), last + 0.3)
            times[i] = [last, max(nxt, last + 0.05)]
        last = times[i][1]

    caps = []
    for i, w in enumerate(script_words):
        s, e = times[i]
        caps.append({
            "text": (" " if i else "") + w,
            "startMs": round(s * 1000),
            "endMs": round(max(e, s + 0.04) * 1000),
            "timestampMs": round((s + e) * 500),
            "confidence": None,
        })
    return caps


def main() -> None:
    only = sys.argv[1:] or None
    chunks = script_chunks()
    OUT.mkdir(parents=True, exist_ok=True)

    for i, key in enumerate(CHUNKS):
        sec = f"{i:02d}"
        if only and sec not in only and key not in only:
            continue
        heard = heard_words(i)
        words = chunks[key].split()
        caps = align(words, heard)

        # sentence ends double as caption page breaks
        for j, w in enumerate(words[:-1]):
            if w.endswith((".", "?", "!")):
                caps[j]["pageBreakAfter"] = True

        (OUT / f"s{sec}.json").write_text(json.dumps(caps, indent=1), encoding="utf-8")
        print(f"s{sec} ({key}): {len(caps)} words · heard {len(heard)} · "
              f"ends {caps[-1]['endMs'] / 1000:.1f}s")


if __name__ == "__main__":
    main()
