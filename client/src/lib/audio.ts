"use client";

let ctx: AudioContext | null = null;
let ambientGain: GainNode | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientPlaying = false;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function initAudio(): void {
  getCtx();
}

export function startAmbient(): void {
  if (ambientPlaying) return;
  const c = getCtx();
  ambientGain = c.createGain();
  ambientGain.gain.setValueAtTime(0, c.currentTime);
  ambientGain.gain.linearRampToValueAtTime(0.08, c.currentTime + 2);

  ambientOsc = c.createOscillator();
  ambientOsc.type = "sine";
  ambientOsc.frequency.setValueAtTime(55, c.currentTime);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(200, c.currentTime);
  filter.Q.setValueAtTime(0.5, c.currentTime);

  const lfo = c.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.07, c.currentTime);
  const lfoGain = c.createGain();
  lfoGain.gain.setValueAtTime(8, c.currentTime);
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  ambientOsc.connect(filter).connect(ambientGain).connect(c.destination);
  ambientOsc.start();
  ambientPlaying = true;
}

export function stopAmbient(): void {
  if (!ambientPlaying) return;
  const c = getCtx();
  if (ambientGain) {
    ambientGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
  }
  setTimeout(() => {
    ambientOsc?.stop();
    ambientOsc?.disconnect();
    ambientOsc = null;
    ambientGain = null;
    ambientPlaying = false;
  }, 900);
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.12) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

function playNoise(duration: number, volume = 0.06) {
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(800, c.currentTime);
  filter.Q.setValueAtTime(0.4, c.currentTime);
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
}

export function playHazard(dangerLevel: number /* 0-1 */): void {
  playNoise(0.4, 0.04 * (1 + dangerLevel));
  playTone(220 - dangerLevel * 100, 0.3, "sawtooth", 0.05);
}

export function playDeath(): void {
  playTone(180, 0.6, "sawtooth", 0.1);
  setTimeout(() => playTone(90, 0.8, "triangle", 0.08), 200);
  playNoise(0.5, 0.07);
}

export function playRevive(): void {
  playTone(330, 0.15, "sine", 0.08);
  setTimeout(() => playTone(440, 0.2, "sine", 0.1), 120);
  setTimeout(() => playTone(550, 0.3, "sine", 0.1), 240);
}

export function playArtifact(): void {
  playTone(660, 0.1, "sine", 0.07);
  setTimeout(() => playTone(880, 0.12, "sine", 0.09), 80);
  setTimeout(() => playTone(1100, 0.2, "sine", 0.08), 150);
}

export function playJourneyStart(): void {
  playTone(220, 0.3, "triangle", 0.1);
  setTimeout(() => playTone(330, 0.4, "triangle", 0.11), 200);
  setTimeout(() => playTone(440, 0.5, "triangle", 0.1), 400);
}

export function playJourneyEnd(survived: boolean): void {
  if (survived) {
    playTone(440, 0.2, "sine", 0.1);
    setTimeout(() => playTone(554, 0.2, "sine", 0.1), 150);
    setTimeout(() => playTone(660, 0.3, "sine", 0.1), 300);
    setTimeout(() => playTone(880, 0.5, "sine", 0.12), 450);
  } else {
    playTone(220, 0.5, "triangle", 0.06);
    setTimeout(() => playTone(165, 0.7, "triangle", 0.06), 300);
  }
}
