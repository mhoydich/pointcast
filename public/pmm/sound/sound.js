/* PMM sound: earcons and haptics for PointCast Mobile Messaging.
   No dependencies, no audio files, no network. Every cue is synthesised from a plan: a list of
   note events {t, freq, dur, wave, gain} in seconds from the cue's start. The planners are pure,
   so tests/pmm-sound.test.mjs drives them in Node; the engine below plays them in a browser.
   Design notes and the spec table: docs/design-sprints/2026-10-23-pmm-sound.md. */

// The Mood Atlas (/pmm/moods/) owns the eight moods and their motifs; every earcon builds on them.
import { MOOD_IDS, mood, freq, schedule } from '../moods/moods.js';

export { MOOD_IDS };

// Shared with the motion thread (/pmm/motion/). Change these only through the coordinator.
export const EVENTS = Object.freeze(['boot', 'found', 'connect', 'fail', 'hangup', 'send', 'receive', 'unverified',
  'react', 'file-done', 'mood', 'their-mood', 'tab', 'settle', 'join', 'leave']);
export const DURATION_MS = Object.freeze({ boot: 1200, found: 600, connect: 900, fail: 500, hangup: 400, send: 180,
  receive: 240, unverified: 400, react: 300, 'file-done': 400, mood: 600, 'their-mood': 600, tab: 300, settle: 900,
  join: 400, leave: 300 });

// Sound is never the only signal: the lab shows these, and app.js can hand them to a live region.
export const CAPTIONS = Object.freeze({
  boot: 'PMM boots: a noise sweep, then your chord climbs',
  found: 'Friend found: a two-ping sonar',
  connect: 'Connected: your arpeggio, theirs, then both lock on one note',
  fail: 'Could not connect: a detuned buzz falls',
  hangup: 'Line closed: a click and a falling swoop',
  send: 'Sent: a quick chirp up',
  receive: 'Message in: the opening of their mood tune',
  unverified: 'Unverified signature: a tritone wobble',
  react: 'Reaction: a three-note sparkle',
  'file-done': 'File done: a tick and three rising notes',
  mood: 'Your mood: your mood tune, quick',
  'their-mood': 'Their mood changed: their tune over yours',
  tab: 'Tab noted: a tick and a rising fifth',
  settle: 'Settled up: a cadence that comes home',
  join: 'Someone joined: a tap and a rising fourth',
  leave: 'Someone left: a soft falling fourth',
});

/* ---------- budgets (the tests hold every plan to these) ---------- */
export const LIMITS = Object.freeze({ minHz: 40, maxHz: 8000, noteGain: 0.25, peakGain: 0.5, maxNoteS: 1, hapticMs: 400,
  brightHz: 2000, brightGain: 0.08 });
export const MAX_VOICES = 14;
const MASTER = 0.9; // master gain at volume 1; the render pass holds the output peak under -6 dBFS

/* ---------- mood flavour ----------
   Each mood's root is the first note of its motif, in the motif's own register, and its timbre is
   the motif's wave. The table adds a chord shape and a pulse width for the square-wave moods. */
const MAJ = [0, 4, 7, 12], MIN = [0, 3, 7, 12], LYD = [0, 4, 6, 11];
const FLAVOUR = Object.freeze({
  calm: { chord: MAJ, pw: 0.5 }, hyped: { chord: MAJ, pw: 0.25 }, soft: { chord: MAJ, pw: 0.5 },
  sunny: { chord: MAJ, pw: 0.375 }, salty: { chord: MIN, pw: 0.125 }, tired: { chord: MIN, pw: 0.5 },
  curious: { chord: LYD, pw: 0.3 }, low: { chord: MIN, pw: 0.5 },
});
export const FLAVOUR_IDS = Object.freeze(Object.keys(FLAVOUR));

export function flavour(id) {
  const m = mood(id);
  return { id: m.id, root: freq(m.motif.notes[0][0]), wave: m.motif.wave, ...FLAVOUR[m.id] };
}

/* ---------- note helpers ---------- */
const r4 = (x) => Math.round(x * 1e4) / 1e4;
// Perceived loudness differs by wave: a square at the same gain sounds about twice a sine.
// A narrow pulse carries less energy than a square, so it gets back 0.5/sqrt(pw(1-pw)) of it.
const LEVEL = { sine: 1, triangle: 0.9, square: 0.75, noise: 0.5 };
const pwk = (pw) => (pw && pw < 0.5 ? 0.5 / Math.sqrt(pw * (1 - pw)) : 1);
export const st = (f, semis) => f * 2 ** (semis / 12);
export function note(t, hz, dur, wave, gain, extra) {
  const k = wave === 'square' ? pwk(extra?.pw) : 1;
  return { t: r4(t), freq: r4(hz), dur: r4(dur), wave, gain: r4(gain * LEVEL[wave] * k), ...extra };
}
const tone = (fl, t, hz, dur, gain, extra) => note(t, hz, dur, fl.wave, gain, fl.wave === 'square' ? { pw: fl.pw, ...extra } : extra);
// Arpeggio: one note per interval, `step` apart, each `len` long.
export function arp(fl, t, base, semis, step, len, gain, extra) {
  return semis.map((s, i) => tone(fl, t + i * step, st(base, s), len, gain, extra));
}
// A mood's motif squeezed into a window, from `t` to `t + span`, transposed by `oct` octaves.
export function motifIn(id, t, span, oct, wave, gain, extra) {
  const ev = schedule(id), total = ev[ev.length - 1].at + ev[ev.length - 1].dur, k = span / total;
  return ev.map((e) => note(t + e.at * k, e.hz * 2 ** oct, e.dur * k, wave, gain, extra));
}
// The first two different notes of a mood's motif: the hook a friend learns to recognise.
function hook(id) {
  const ns = mood(id).motif.notes.map(([n]) => freq(n));
  return [ns[0], ns.find((f) => f !== ns[0]) || ns[0] * 1.5];
}

/* ---------- the earcons ----------
   SID bones, Glass manners: pulse-wave arpeggios for the rare moments that matter, soft
   triangle and sine for the ones that repeat all day, and off-grid detuned pitches only for
   things that went wrong. Warnings (fail, unverified) never change with mood, so they always
   read the same. */
const PLANS = {
  boot: (me) => [
    note(0, 500, 0.32, 'noise', 0.1, { to: 1800, q: 1.2, a: 0.08, r: 0.12 }),
    ...arp(me, 0.28, me.root, me.chord, 0.12, 0.14, 0.16),
    note(0.78, me.root, 0.42, 'triangle', 0.14, { r: 0.2 }),
    note(0.78, st(me.root, 7), 0.42, 'triangle', 0.1, { r: 0.2 }),
    note(0.78, me.root * 2, 0.42, 'sine', 0.07, { r: 0.24 }),
  ],
  found: (me) => [
    note(0, me.root * 2, 0.24, 'sine', 0.18, { to: me.root * 1.96, r: 0.16 }),
    note(0.3, me.root * 2, 0.3, 'sine', 0.08, { to: me.root * 1.96, r: 0.22 }),
  ],
  connect: (me, them) => [
    ...arp(me, 0, me.root, me.chord.slice(0, 3), 0.1, 0.12, 0.13),
    ...arp(them, 0.31, them.root, them.chord.slice(0, 3), 0.1, 0.12, 0.13),
    note(0.62, me.root, 0.28, 'triangle', 0.14, { to: me.root * 2, r: 0.12 }),
    note(0.62, them.root, 0.28, 'triangle', 0.1, { to: me.root * 2, r: 0.12 }),
  ],
  fail: () => [
    note(0, 80, 0.08, 'noise', 0.12, { q: 0.7 }),
    note(0, 5233 / 22, 0.2, 'square', 0.14, { pw: 0.5, det: 22 }),
    note(0.2, 5233 / 27, 0.3, 'square', 0.14, { pw: 0.5, det: -18, to: 5233 / 32, r: 0.14 }),
  ],
  hangup: (me) => [
    note(0, 380, 0.03, 'noise', 0.1, { q: 0.8 }),
    note(0.02, me.root, 0.38, 'triangle', 0.16, { to: me.root / 2, r: 0.16 }),
  ],
  send: (me) => [
    tone(me, 0, st(me.root, 7), 0.08, 0.1, { bright: 4 }),
    tone(me, 0.07, me.root * 2, 0.11, 0.1, { bright: 4, r: 0.06 }),
  ],
  receive: (me, them) => {
    const [a, b] = hook(them.id);
    return [tone(them, 0, a, 0.1, 0.12, { bright: 4 }), tone(them, 0.1, b, 0.14, 0.12, { bright: 4, r: 0.08 }),
      note(0, a / 2, 0.24, 'sine', 0.07, { r: 0.12 })];
  },
  unverified: () => [0, 1, 2, 3].map((i) => note(i * 0.1, i % 2 ? 311.13 : 440, 0.1, 'triangle', 0.15, { det: i % 2 ? -14 : 9, a: 0.01, r: 0.03 })),
  react: (me) => [0, 1, 2].map((i) => note(i * 0.07, st(me.root * 2, me.chord[i]), i === 2 ? 0.16 : 0.1, 'sine', 0.08, { r: 0.06 })),
  'file-done': (me) => [
    note(0, 1200, 0.03, 'noise', 0.06, { q: 2 }),
    ...arp(me, 0.03, me.root, [0, 7], 0.1, 0.1, 0.12),
    tone(me, 0.23, me.root * 2, 0.17, 0.12, { r: 0.1 }),
  ],
  mood: (me) => motifIn(me.id, 0, 0.6, 0, me.wave, 0.12, me.wave === 'square' ? { pw: me.pw, bright: 4 } : {}),
  'their-mood': (me, them) => [
    ...motifIn(them.id, 0, 0.6, 0, them.wave, 0.11, them.wave === 'square' ? { pw: them.pw, bright: 4 } : {}),
    ...motifIn(me.id, 0, 0.6, -1, 'triangle', 0.08),
  ],
  tab: (me) => [
    note(0, 1500, 0.03, 'noise', 0.05, { q: 3 }),
    note(0.03, me.root * 2, 0.1, 'triangle', 0.12),
    note(0.11, st(me.root * 2, 7), 0.19, 'triangle', 0.12, { r: 0.1 }),
  ],
  settle: (me) => [
    ...arp(me, 0, me.root, [7, 11, 14], 0.1, 0.12, 0.12),
    note(0.34, me.root * 2, 0.56, 'triangle', 0.1, { r: 0.3 }),
    note(0.34, st(me.root * 2, me.chord[1]), 0.56, 'triangle', 0.08, { r: 0.3 }),
    note(0.34, me.root * 3, 0.56, 'sine', 0.06, { r: 0.32 }),
  ],
  join: (me) => [
    note(0, 900, 0.03, 'noise', 0.05, { q: 2 }),
    note(0.04, me.root, 0.12, 'triangle', 0.13),
    note(0.16, st(me.root, 5), 0.24, 'triangle', 0.13, { r: 0.12 }),
  ],
  leave: (me) => [
    note(0, st(me.root, 5), 0.12, 'sine', 0.1),
    note(0.12, me.root, 0.18, 'sine', 0.09, { r: 0.12 }),
  ],
};

/* ---------- pure planners ---------- */
// plan(event, {mood, theirMood, streak}) → note events. `streak` is how many of the same cue
// played in the last few seconds; each one is 5% quieter, down to 55%, so a busy chat recedes.
export function plan(event, opts = {}) {
  const make = PLANS[event];
  if (!make) throw new Error(`unknown event: ${event}`);
  const notes = make(flavour(opts.mood), flavour(opts.theirMood));
  const k = 1 - Math.min(0.45, 0.05 * (opts.streak || 0));
  return k === 1 ? notes : notes.map((n) => ({ ...n, gain: r4(n.gain * k) }));
}

export const span = (notes) => notes.reduce((m, n) => Math.max(m, n.t + n.dur), 0);

// The loudest instant of a plan: the sum of every note's gain that is sounding then.
export function peakGain(notes) {
  return notes.reduce((m, n) => Math.max(m, notes.filter((o) => o.t <= n.t && o.t + o.dur > n.t).reduce((s, o) => s + o.gain, 0)), 0);
}

// navigator.vibrate patterns, on/off in ms. Short by rule: the whole pattern is at most 400 ms.
const BUZZ = { boot: [20, 60, 20], found: [10, 40, 10], connect: [15, 50, 15, 50, 30], fail: [60, 40, 60], hangup: [40],
  send: [8], unverified: [30, 30, 30, 30, 30], react: [6], 'file-done': [10, 30, 25], tab: [8, 30, 8],
  settle: [15, 40, 15, 40, 40], join: [10, 30, 15], leave: [15] };
const KNOCK = { calm: [14], hyped: [8, 25, 8, 25, 8], soft: [6, 50, 6], sunny: [10, 30, 10], salty: [20, 20, 6],
  tired: [24], curious: [6, 30, 6, 30, 14], low: [30] };
// mood and their-mood buzz the motif's rhythm: one pulse per note, longer notes buzz longer.
function rhythm(id) {
  const out = [];
  for (const [, len] of mood(id).motif.notes) {
    if (out.reduce((a, b) => a + b, 0) + len * 8 + 25 > LIMITS.hapticMs) break;
    if (out.length) out.push(25);
    out.push(len * 8);
  }
  return out;
}
export function haptic(event, moodId, theirMood) {
  if (event === 'receive') return [...KNOCK[mood(moodId).id]];
  if (event === 'mood') return rhythm(moodId);
  if (event === 'their-mood') return rhythm(theirMood ?? moodId);
  if (!BUZZ[event]) throw new Error(`unknown event: ${event}`);
  return [...BUZZ[event]];
}

/* ---------- atmosphere bed (opt-in, off by default) ----------
   One 9.6 s loop: their motif, slowed and an octave down, over yours two octaves down, in sine
   and triangle with long swells. The only cue allowed past one second, and kept very quiet. */
export const ATMO_LOOP_S = 9.6;
export function atmospherePlan(me, them) {
  const soft = { a: 0.5, d: 0.2, s: 0.8, r: 0.9 };
  return [
    ...motifIn(mood(them).id, 0, ATMO_LOOP_S * 0.5, -1, 'sine', 0.04, soft),
    ...motifIn(mood(me).id, ATMO_LOOP_S * 0.45, ATMO_LOOP_S * 0.5, -2, 'triangle', 0.04, soft),
  ].map((n) => ({ ...n, dur: r4(Math.max(n.dur, 1.2)) }));
}

/* ---------- rendering (browser and OfflineAudioContext) ---------- */
const waves = new WeakMap();
function pulse(ctx, pw) {
  let m = waves.get(ctx); if (!m) waves.set(ctx, (m = new Map()));
  if (!m.has(pw)) {
    const n = 40, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) { re[k] = Math.sin(2 * Math.PI * k * pw) / (Math.PI * k); im[k] = (1 - Math.cos(2 * Math.PI * k * pw)) / (Math.PI * k); }
    m.set(pw, ctx.createPeriodicWave(re, im));
  }
  return m.get(pw);
}
const noises = new WeakMap();
function noise(ctx) {
  if (!noises.has(ctx)) {
    const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
    let s = 0x9e3779b9; // a fixed seed, so a cue renders the same every time
    for (let i = 0; i < d.length; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; d[i] = ((s >>> 0) / 4294967296) * 2 - 1; }
    noises.set(ctx, b);
  }
  return noises.get(ctx);
}

// Master chain: input → high shelf (-6 dB above 2.8 kHz, so nothing is harsh) → compressor → volume.
export function buildChain(ctx, volume = 1, out = ctx.destination) {
  const input = ctx.createGain(), shelf = ctx.createBiquadFilter(), comp = ctx.createDynamicsCompressor(), master = ctx.createGain();
  shelf.type = 'highshelf'; shelf.frequency.value = 2800; shelf.gain.value = -6;
  comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.12;
  master.gain.value = volume * MASTER;
  input.connect(shelf).connect(comp).connect(master).connect(out);
  return { input, master };
}

// Schedule notes at `t0` into `dest`. Envelope: linear attack, decay to sustain, linear release
// that reaches zero exactly at t + dur, so a cue never clicks and ends when its plan says.
export function scheduleNotes(ctx, notes, dest, t0 = ctx.currentTime, live) {
  for (const n of notes) {
    const at = t0 + n.t, end = at + n.dur;
    const a = Math.min(n.a ?? 0.004, n.dur / 3), r = Math.min(n.r ?? 0.04, n.dur - a), d = Math.min(n.d ?? 0.05, n.dur - a - r);
    const env = ctx.createGain(), g = env.gain;
    g.setValueAtTime(0, at); g.linearRampToValueAtTime(n.gain, at + a);
    g.linearRampToValueAtTime(n.gain * (n.s ?? 0.7), at + a + d); g.setValueAtTime(n.gain * (n.s ?? 0.7), end - r);
    g.linearRampToValueAtTime(0, end);
    let src, head = env;
    if (n.wave === 'noise') {
      src = ctx.createBufferSource(); src.buffer = noise(ctx); src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = n.q ?? 1; f.frequency.setValueAtTime(n.freq, at);
      if (n.to) f.frequency.exponentialRampToValueAtTime(n.to, end);
      f.connect(env); head = f;
    } else {
      src = ctx.createOscillator();
      if (n.wave === 'square' && n.pw && n.pw !== 0.5) src.setPeriodicWave(pulse(ctx, n.pw)); else src.type = n.wave;
      src.frequency.setValueAtTime(n.freq, at);
      if (n.to) src.frequency.exponentialRampToValueAtTime(n.to, end);
      if (n.det) src.detune.value = n.det;
      if (n.wave === 'square') {
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.5;
        f.frequency.value = Math.min(4000, n.freq * (n.bright ?? 5)); f.connect(env); head = f;
      }
    }
    src.connect(head); env.connect(dest);
    src.start(at); src.stop(end + 0.01);
    if (live) { live.add(src); src.onended = () => { live.delete(src); env.disconnect(); }; }
  }
}

/* ---------- runtime engine ---------- */
const PRIORITY = new Set(['connect', 'fail', 'hangup', 'unverified']);
let ac = null, chain = null, enabled = true, volume = 0.8, haptics = true, hiddenReceive = false, unlocked = false;
let bed = null;
const live = new Set(), last = new Map();
const counts = { played: 0, coalesced: 0, capped: 0, muted: 0 };
const hidden = () => typeof document !== 'undefined' && document.hidden;
const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Call from the first tap or key press. Creates the context inside the gesture and plays one
// silent sample, which is what iOS needs before it will make any sound.
export function unlock() {
  unlocked = true;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return Promise.resolve(false);
  if (!ac) {
    ac = new AC({ latencyHint: 'interactive' }); chain = buildChain(ac, volume);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!hidden() && ac.state !== 'running') ac.resume().catch(() => {}); });
  }
  try { const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, ac.sampleRate); s.connect(ac.destination); s.start(0); } catch (_) {}
  return ac.state === 'running' ? Promise.resolve(true) : ac.resume().then(() => true, () => false);
}

export function setEnabled(on) { enabled = Boolean(on); if (!enabled) { stopAll(); stopAtmosphere(); } }
export function setVolume(v) {
  volume = Math.max(0, Math.min(1, Number(v) || 0));
  if (chain) chain.master.gain.setTargetAtTime(volume * MASTER, ac.currentTime, 0.02);
}
export function setHaptics(on) { haptics = Boolean(on); }
// Off by default: whether a message may sound while the page is hidden.
export function setHiddenReceive(on) { hiddenReceive = Boolean(on); }
export const stats = () => ({ ...counts, voices: live.size, state: ac ? ac.state : 'locked' });

function stopAll() { for (const s of live) { try { s.stop(); } catch (_) {} } live.clear(); }

// play(event, {mood, theirMood, plan}). Returns true if it made a sound. A cue that repeats
// inside its own length plus 160 ms is folded into the first, so twenty messages landing at
// once make one knock and one buzz.
export function play(event, opts = {}) {
  if (!DURATION_MS[event]) return false;
  const t = clock(), prev = last.get(event);
  if (prev && t - prev.at < DURATION_MS[event] + 160) { counts.coalesced++; return false; }
  const streak = prev && t - prev.at < 6000 ? prev.streak + 1 : 0;
  last.set(event, { at: t, streak });
  if (unlocked && haptics && !hidden() && opts.haptic !== false) {
    try { globalThis.navigator?.vibrate?.(haptic(event, event === 'receive' ? opts.theirMood : opts.mood, opts.theirMood)); } catch (_) {}
  }
  if (!enabled || !ac || (hidden() && !(event === 'receive' && hiddenReceive))) { counts.muted++; return false; }
  if (ac.state !== 'running') { ac.resume().catch(() => {}); counts.muted++; return false; }
  const notes = (opts.plan || plan)(event, { ...opts, streak });
  if (live.size + notes.length > MAX_VOICES) {
    if (!PRIORITY.has(event)) { counts.capped++; return false; }
    stopAll();
  }
  scheduleNotes(ac, notes, chain.input, ac.currentTime + 0.01, live);
  counts.played++;
  return true;
}

export function startAtmosphere(opts = {}) {
  stopAtmosphere();
  if (!enabled || !ac || ac.state !== 'running') return false;
  const g = ac.createGain(); g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(1, ac.currentTime + 1.5);
  g.connect(chain.input);
  const srcs = new Set(), notes = atmospherePlan(opts.mood, opts.theirMood);
  let next = ac.currentTime + 0.05;
  const loop = () => {
    if (!hidden()) scheduleNotes(ac, notes, g, next, srcs);
    next += ATMO_LOOP_S;
    bed.timer = setTimeout(loop, Math.max(0, (next - ac.currentTime - 0.5) * 1000));
  };
  bed = { g, srcs, timer: 0 };
  loop();
  return true;
}
export function stopAtmosphere() {
  if (!bed) return;
  const { g, srcs, timer } = bed; bed = null; clearTimeout(timer);
  g.gain.cancelScheduledValues(ac.currentTime); g.gain.setTargetAtTime(0, ac.currentTime, 0.15);
  setTimeout(() => { for (const s of srcs) { try { s.stop(); } catch (_) {} } g.disconnect(); }, 800);
}
