/**
 * A tiny Web Audio kit shared by the Ten Doors. Everything is synthesized
 * at runtime; nothing is fetched. The context starts on the first gesture.
 */

let ctx = null;
let master = null;
let muted = false;

export function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** True when a key event is aimed at a text box (the site footer has one), so a door leaves it alone. */
export function typing(e) {
  const t = e && e.target;
  return Boolean(t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));
}

/** True when a key event is aimed at something Space or Enter already activates. */
export function onControl(e) {
  const t = e && e.target;
  return Boolean(t && t.closest && t.closest('button, a, summary, [role="button"]'));
}

if (typeof document !== 'undefined') {
  // A hidden tab stops drawing frames, so held notes would drone on. Pause the sound until it is back.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });
  // iOS unlocks Web Audio on touchend or click, not pointerdown, so resume there too.
  const unlock = () => { if (ctx && ctx.state === 'suspended' && !document.hidden) ctx.resume(); };
  document.addEventListener('touchend', unlock, { passive: true });
  document.addEventListener('click', unlock);
}

export function out() {
  audio();
  return master;
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = value ? 0 : 0.7;
}

export function isMuted() {
  return muted;
}

/** MIDI note number to Hz. */
export const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** A pentatonic ladder from a root MIDI note. */
export function pentatonic(root, count) {
  const steps = [0, 2, 4, 7, 9];
  return Array.from({ length: count }, (_, i) => root + steps[i % 5] + 12 * Math.floor(i / 5));
}

/**
 * One enveloped note. Returns the gain node so callers can shape a long tone.
 * opts: { type, attack, decay, sustain, release, length, gain, when, detune, filter }
 */
export function tone(freq, opts = {}) {
  const c = audio();
  if (!c) return null;
  const { type = 'sine', attack = 0.01, length = 0.3, release = 0.25, gain = 0.25, when = 0, detune = 0, filter = 0 } = opts;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  osc.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t0 + attack);
  g.gain.setValueAtTime(Math.max(gain, 0.0002), t0 + attack + length);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + length + release);
  let node = osc;
  if (filter) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(out());
  osc.start(t0);
  osc.stop(t0 + attack + length + release + 0.05);
  return { osc, gain: g };
}

/** A short burst of filtered noise: claps, hats, sand, splashes. */
export function noise(opts = {}) {
  const c = audio();
  if (!c) return;
  const { length = 0.08, gain = 0.2, when = 0, freq = 3000, type = 'bandpass', q = 1 } = opts;
  const t0 = c.currentTime + when;
  const buffer = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * length)), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(out());
  src.start(t0);
}

/** A pitched-down sine thump. */
export function kick(when = 0, gain = 0.6) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.setValueAtTime(150, t0);
  osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.18);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
  osc.connect(g);
  g.connect(out());
  osc.start(t0);
  osc.stop(t0 + 0.35);
}

/** Safe localStorage helpers. */
export function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full storage: the toy still works */
  }
}

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Size a canvas for crisp drawing; returns the 2D context scaled to CSS pixels. */
export function fitCanvas(canvas, width, height) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

/** Pointer position in canvas CSS coordinates (canvas drawn at logical width w). */
export function pointerXY(canvas, event, w, h) {
  const rect = canvas.getBoundingClientRect();
  return { x: ((event.clientX - rect.left) / rect.width) * w, y: ((event.clientY - rect.top) / rect.height) * h };
}
