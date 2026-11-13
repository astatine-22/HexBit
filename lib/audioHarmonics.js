/**
 * Web Audio API synthesizer for the Harmonic Frequency Roadmap & The Plugin Rack.
 * Pure native browser audio (0 external dependencies).
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SAPTAK_FREQUENCIES = [
  { note: "Sa", name: "Shadja", freq: 261.63, western: "C4" },
  { note: "Re", name: "Rishabh", freq: 293.66, western: "D4" },
  { note: "Ga", name: "Gandhar", freq: 329.63, western: "E4" },
  { note: "Ma", name: "Madhyam", freq: 349.23, western: "F4" },
  { note: "Pa", name: "Pancham", freq: 392.00, western: "G4" },
  { note: "Dha", name: "Dhaivat", freq: 440.00, western: "A4" },
  { note: "Ni", name: "Nishad", freq: 493.88, western: "B4" },
  { note: "Sa'", name: "Tar Shadja", freq: 523.25, western: "C5" },
];

/**
 * Strike a resonant note: warm vibrating acoustic tone with fundamental + octave harmonic
 */
export function playResonantTone(frequency = 440, duration = 1.2) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Master gain envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Fundamental oscillator (sine - clean warm bass/mid)
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(frequency, now);

    // Harmonic overtone (triangle - acoustic string sparkle)
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(frequency * 2, now);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.08, now);

    // Subtle gentle vibrato (LFO)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(5.5, now);
    lfoGain.gain.setValueAtTime(2.5, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    osc1.connect(masterGain);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    masterGain.connect(ctx.destination);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    lfo.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch (e) {
    // Graceful fallback
  }
}

/**
 * Dampened ping: muted pluck for skills currently in progress
 */
export function playDampenedPing(frequency = 330) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

/**
 * Ghost tape hiss / muted low click for missing frequency band
 */
export function playGhostBandClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(110, now); // low thud
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {}
}

/**
 * Ascending studio arpeggio when unlocking a marketplace pack
 */
export function playPackUnlockChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playResonantTone(freq, 0.9);
      }, idx * 110);
    });
  } catch (e) {}
}
