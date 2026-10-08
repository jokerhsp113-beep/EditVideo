"""Tighten the voiceover: shorter pauses, slightly faster delivery.

ElevenLabs leaves 291 pauses longer than 0.25s across the nine chunks — 161s of
silence, a sixth of the runtime. This shrinks every silent run to a fixed
breath, then speeds the result up with WSOLA (tempo without a pitch shift).

Every cut is recorded, so the word timings from Whisper are carried through
the same edit exactly: no re-transcription, and every anchor still resolves.

    python scripts/biy2/tighten_vo.py            # default: breath 0.20s, tempo 1.12
    python scripts/biy2/tighten_vo.py 0.22 1.10

Reads the original mp3s (never modified) and writes
    public/biy2/audio_tight/AudioNN.wav
    scripts/biy2/.words_tight/NN.json
    src/biy2/durations.json
"""

import json
import pathlib
import subprocess
import sys
import wave

import numpy as np

SRC = pathlib.Path(r"C:\Work\Youtube\Built Into You\Video002\Audio")
OUT = pathlib.Path("public/biy2/audio_tight")
WORDS_IN = pathlib.Path("scripts/biy2/.words")
WORDS_OUT = pathlib.Path("scripts/biy2/.words_tight")
FF = str(pathlib.Path("node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe").resolve())
SR = 44100

BREATH = float(sys.argv[1]) if len(sys.argv) > 1 else 0.20   # brisk but still a natural breath
TEMPO = float(sys.argv[2]) if len(sys.argv) > 2 else 1.12
MIN_PAUSE = BREATH + 0.06        # only touch pauses longer than this
QUIET_DB = -38.0                 # relative to the loud end of the file
XFADE = int(0.012 * SR)          # 12ms crossfade at each cut, no clicks


def decode(path: pathlib.Path) -> np.ndarray:
    """mp3 -> float samples, shape (n, channels).

    Remotion's ffmpeg ships without the raw PCM muxer and without the filters
    that resampling needs, so decode to a WAV at the source's own rate and
    channel count, and read that.
    """
    tmp = OUT / "_decode.wav"
    subprocess.run([FF, "-v", "error", "-y", "-i", str(path), "-c:a", "pcm_s16le",
                    "-f", "wav", str(tmp)], check=True)
    with wave.open(str(tmp), "rb") as w:
        assert w.getframerate() == SR, w.getframerate()
        ch = w.getnchannels()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    tmp.unlink()
    return data.reshape(-1, ch).astype(np.float32) / 32768.0


def encode(x: np.ndarray, path: pathlib.Path) -> None:
    """Write a 16-bit WAV. The final render encodes AAC; nothing is gained by
    compressing twice."""
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(x.shape[1])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def silent_runs(x: np.ndarray) -> list[tuple[int, int]]:
    """Sample ranges that are quiet, from 10ms RMS frames."""
    hop = int(0.010 * SR)
    mono = x.mean(axis=1)
    n = len(mono) // hop
    rms = np.sqrt((mono[: n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    loud = np.percentile(db, 95)
    quiet = db < loud + QUIET_DB
    runs = []
    i = 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            runs.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    return runs


def shorten_pauses(x: np.ndarray) -> tuple[np.ndarray, list[tuple[int, int]]]:
    """Cut the middle out of every long silence. Returns audio and the cuts."""
    keep_each_side = int(BREATH / 2 * SR)
    cuts: list[tuple[int, int]] = []
    for a, b in silent_runs(x):
        if (b - a) / SR < MIN_PAUSE:
            continue
        # never touch the very start or end — those are handled by the lead-in
        s, e = a + keep_each_side, b - keep_each_side
        if e - s > 2 * XFADE:
            cuts.append((s, e))

    pieces = []
    prev = 0
    for s, e in cuts:
        pieces.append(x[prev:s])
        prev = e
    pieces.append(x[prev:])

    # join with short crossfades so no cut clicks
    out = pieces[0]
    fade_out = np.linspace(1, 0, XFADE, dtype=np.float32)[:, None]
    fade_in = 1 - fade_out
    for p in pieces[1:]:
        if len(out) < XFADE or len(p) < XFADE:
            out = np.concatenate([out, p])
            continue
        mixed = out[-XFADE:] * fade_out + p[:XFADE] * fade_in
        out = np.concatenate([out[:-XFADE], mixed, p[XFADE:]])
    return out, cuts


def wsola(x: np.ndarray, rate: float, n: int = 2048, tol: int = 512) -> np.ndarray:
    """Time-stretch by `rate` (>1 is faster) without changing pitch."""
    hs = n // 2
    ha = hs * rate
    win = np.hanning(n).astype(np.float32)
    mono = x.mean(axis=1)
    dec = 4                                        # search on a decimated copy
    md = mono[::dec]
    out_len = int(len(x) / rate) + n
    y = np.zeros((out_len, x.shape[1]), dtype=np.float32)
    wsum = np.zeros(out_len, dtype=np.float32)

    prev = 0
    k = 0
    pos = 0
    while True:
        nominal = int(k * ha)
        if nominal + n + tol >= len(x) or pos + n >= out_len:
            break
        if k == 0:
            start = 0
        else:
            # the frame that best continues the previous one's natural tail
            want = md[(prev + hs) // dec:(prev + hs + n) // dec]
            lo = max(0, nominal - tol)
            region = md[lo // dec:(nominal + tol + n) // dec]
            if len(region) <= len(want) or len(want) == 0:
                start = nominal
            else:
                corr = np.correlate(region, want, mode="valid")
                start = lo + int(np.argmax(corr)) * dec
        frame = x[start:start + n]
        if len(frame) < n:
            break
        y[pos:pos + n] += frame * win[:, None]
        wsum[pos:pos + n] += win
        prev = start
        pos += hs
        k += 1
    y = y[:pos + hs]
    wsum = wsum[:pos + hs]
    return y / np.maximum(wsum, 1e-3)[:, None]


def remap(t: float, cuts: list[tuple[int, int]]) -> float:
    """Where an original timestamp (s) lands after the cuts and the tempo change."""
    smp = t * SR
    removed = 0
    for s, e in cuts:
        if smp <= s:
            break
        removed += min(smp, e) - s
        # every join overlaps the two sides by one crossfade, so everything
        # after it lands that much earlier again; ignoring this drifts ~0.3s
        # by the end of a two-minute chunk
        if smp > e:
            removed += XFADE
    return (smp - removed) / SR / TEMPO


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    WORDS_OUT.mkdir(parents=True, exist_ok=True)
    durations = {}
    before = after = 0.0
    for i in range(9):
        sec = f"{i:02d}"
        x = decode(SRC / f"Audio{sec}.mp3")
        tight, cuts = shorten_pauses(x)
        fast = wsola(tight, TEMPO)
        encode(fast, OUT / f"Audio{sec}.wav")

        words = json.load(open(WORDS_IN / f"{sec}.json", encoding="utf-8"))
        moved = [{"w": w["w"], "s": round(remap(w["s"], cuts), 3),
                  "e": round(remap(w["e"], cuts), 3)} for w in words]
        json.dump(moved, open(WORDS_OUT / f"{sec}.json", "w", encoding="utf-8"))

        d0, d1 = len(x) / SR, len(fast) / SR
        durations[sec] = round(d1, 3)
        before += d0
        after += d1
        print(f"Audio{sec}: {d0:6.1f}s -> {d1:6.1f}s  ({len(cuts)} pauses shortened)")

    pathlib.Path("src/biy2/durations.json").write_text(json.dumps(durations, indent=1))
    print(f"\nTOTAL {before:.1f}s -> {after:.1f}s  (saved {before - after:.0f}s, "
          f"{(1 - after / before) * 100:.0f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
