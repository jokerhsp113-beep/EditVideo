// Synthesizes 3 short placeholder SFX as raw PCM WAV files — no external
// downloads, pure math. Swap these for real SFX later; file names/paths stay
// the same so nothing else needs to change.
//
// Run with: node scripts/generate-sfx.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "sfx");
fs.mkdirSync(outDir, { recursive: true });

const SAMPLE_RATE = 44100;

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

// --- pop.wav — short cartoon "boop" for GAG reveals ---
function makePop() {
  const duration = 0.15;
  const n = Math.round(duration * SAMPLE_RATE);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 900 + (350 - 900) * (t / duration); // quick downward sweep
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.005);
    const decay = Math.exp(-t * 18);
    samples[i] = attack * decay * Math.sin(phase) * 0.8;
  }
  return samples;
}

// --- whoosh.wav — soft filtered-noise sweep for section transitions ---
function makeWhoosh() {
  const duration = 0.45;
  const n = Math.round(duration * SAMPLE_RATE);
  const samples = new Float32Array(n);
  let phase = 0;
  let prevNoise = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const noiseRaw = Math.random() * 2 - 1;
    const noise = 0.6 * prevNoise + 0.4 * noiseRaw; // cheap low-pass smoothing
    prevNoise = noise;
    const freq = 1400 - 1200 * (t / duration);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const tone = Math.sin(phase);
    const envelope = Math.sin(Math.PI * Math.min(1, t / duration)); // rise then fall
    samples[i] = envelope * (0.5 * noise + 0.5 * tone) * 0.5;
  }
  return samples;
}

// --- chime.wav — two-tone "ding" for subscribe / comment-bait / hero beats ---
function makeChime() {
  const duration = 0.7;
  const n = Math.round(duration * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.01);
    const decay = Math.exp(-t * 4);
    const tone =
      0.6 * Math.sin(2 * Math.PI * 1200 * t) +
      0.4 * Math.sin(2 * Math.PI * 1800 * t);
    samples[i] = attack * decay * tone * 0.5;
  }
  return samples;
}

writeWav(path.join(outDir, "pop.wav"), makePop());
writeWav(path.join(outDir, "chime.wav"), makeChime());
// whoosh.wav intentionally no longer generated/used — see add-sfx-cues.mjs

console.log("SFX written to", outDir);
