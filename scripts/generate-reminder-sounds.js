// Generates the alternate reminder chimes in assets/sounds/.
//
// The original quran-chime.wav (Soft Chime) is left untouched; this script
// only writes the three additional profiles. Output is deterministic, mono,
// 44.1 kHz, 16-bit PCM — the format expo-av plays everywhere without a codec
// dependency.
//
// Usage: node scripts/generate-reminder-sounds.js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT = path.join(__dirname, '..', 'assets', 'sounds');

/**
 * Additive struck-idiophone synthesis.
 * Each event is a fundamental plus partials with independent decays, which is
 * what separates a bell (inharmonic, long tail) from a kalimba (short, odd
 * harmonics).
 */
function render(events, totalSeconds) {
  const length = Math.ceil(SAMPLE_RATE * totalSeconds);
  const mix = new Float64Array(length);

  for (const event of events) {
    const start = Math.floor(event.start * SAMPLE_RATE);
    const samples = Math.min(length - start, Math.ceil(event.duration * SAMPLE_RATE));

    for (let i = 0; i < samples; i++) {
      const t = i / SAMPLE_RATE;
      // 6 ms attack removes the click of a waveform starting at non-zero.
      const attack = Math.min(1, t / 0.006);
      const fade = Math.min(1, (samples - i) / (SAMPLE_RATE * 0.02));
      let value = 0;

      for (const partial of event.partials) {
        const partialDecay = partial.decay || event.duration;
        value += Math.sin(2 * Math.PI * event.frequency * partial.ratio * t + (partial.phase || 0))
          * partial.gain
          * Math.exp(-t / partialDecay);
      }

      mix[start + i] += value * event.gain * attack * fade;
    }
  }

  // Normalise so every chime peaks at the same loudness and never clips.
  let peak = 0;
  for (const sample of mix) peak = Math.max(peak, Math.abs(sample));
  const scale = peak > 0 ? 0.82 / peak : 0;

  const data = Buffer.alloc(length * 2);
  for (let i = 0; i < length; i++) {
    const clamped = Math.max(-1, Math.min(1, mix[i] * scale));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }
  return data;
}

function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);          // PCM chunk size
  header.writeUInt16LE(1, 20);           // PCM
  header.writeUInt16LE(1, 22);           // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);           // block align
  header.writeUInt16LE(16, 34);          // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// A deep G bell with inharmonic overtones and a long tail.
const warmBell = render([
  {
    start: 0,
    duration: 3.4,
    gain: 0.30,
    frequency: 392.0, // G4
    partials: [
      { ratio: 1.0, gain: 1.00, decay: 2.8 },
      { ratio: 2.0, gain: 0.32, decay: 1.8 },
      { ratio: 2.76, gain: 0.20, decay: 1.3 },
      { ratio: 5.4, gain: 0.07, decay: 0.8 },
    ],
  },
  {
    start: 0.07,
    duration: 3.0,
    gain: 0.12,
    frequency: 587.33, // D5, the bell's fifth
    partials: [
      { ratio: 1.0, gain: 1.0, decay: 2.2 },
      { ratio: 2.0, gain: 0.22, decay: 1.2 },
    ],
  },
], 3.6);

// Three quick, light strikes with a final sparkle.
const brightBells = render([
  { start: 0.00, duration: 2.6, gain: 0.28, frequency: 659.25, partials: [
    { ratio: 1.0, gain: 1.0, decay: 1.5 },
    { ratio: 2.0, gain: 0.30, decay: 0.9 },
    { ratio: 3.01, gain: 0.16, decay: 0.6 },
  ] },
  { start: 0.20, duration: 2.5, gain: 0.24, frequency: 783.99, partials: [
    { ratio: 1.0, gain: 1.0, decay: 1.4 },
    { ratio: 2.0, gain: 0.28, decay: 0.8 },
  ] },
  { start: 0.40, duration: 2.4, gain: 0.20, frequency: 1046.5, partials: [
    { ratio: 1.0, gain: 1.0, decay: 1.3 },
    { ratio: 2.0, gain: 0.24, decay: 0.7 },
  ] },
  { start: 0.62, duration: 1.8, gain: 0.08, frequency: 1318.51, partials: [
    { ratio: 1.0, gain: 1.0, decay: 0.8 },
  ] },
], 3.0);

// Short, mellow plucks with the odd harmonics a kalimba's tines produce.
const softKalimba = render([
  { start: 0.00, duration: 1.7, gain: 0.30, frequency: 440.0, partials: [
    { ratio: 1.0, gain: 1.0, decay: 0.85 },
    { ratio: 3.0, gain: 0.20, decay: 0.35 },
    { ratio: 5.4, gain: 0.06, decay: 0.20 },
  ] },
  { start: 0.24, duration: 1.7, gain: 0.26, frequency: 523.25, partials: [
    { ratio: 1.0, gain: 1.0, decay: 0.85 },
    { ratio: 3.0, gain: 0.18, decay: 0.35 },
  ] },
  { start: 0.48, duration: 1.7, gain: 0.22, frequency: 659.25, partials: [
    { ratio: 1.0, gain: 1.0, decay: 0.9 },
    { ratio: 3.0, gain: 0.16, decay: 0.35 },
  ] },
], 2.3);

const sounds = [
  ['reminder-warm-bell.wav', warmBell],
  ['reminder-bright-bells.wav', brightBells],
  ['reminder-soft-kalimba.wav', softKalimba],
];

fs.mkdirSync(OUT, { recursive: true });
for (const [name, pcm] of sounds) {
  const bytes = wav(pcm);
  fs.writeFileSync(path.join(OUT, name), bytes);
  console.log(`${name}  ${(bytes.length / 1024).toFixed(1)} KB`);
}
