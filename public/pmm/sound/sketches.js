/* The three directions the sprint sketched before choosing, kept so the lab can play them side by
   side with the chosen system in sound.js. Same note-event shape, same durations, six events each.
   Not shipped to /pmm/: only the lab imports this. */
import { note, arp, motifIn, flavour, st, fitVoices, DURATION_MS } from './sound.js';

export const SKETCH_EVENTS = Object.freeze(['send', 'receive', 'connect', 'fail', 'react', 'their-mood']);

/* ---------- SID: pulse leads, fast chord arpeggios, noise drums ---------- */
const sid = {
  send: (me) => [note(0, 2000, 0.03, 'noise', 0.08, { q: 1.5 }), ...arp({ ...me, wave: 'square', pw: 0.25 }, 0.02, me.root * 2, [0, 4, 7, 12], 0.04, 0.04, 0.12)],
  receive: (me, them) => [...arp({ ...them, wave: 'square', pw: 0.125 }, 0, them.root, [12, 7, 3, 0, 7, 12], 0.04, 0.04, 0.13)],
  connect: (me, them) => [
    note(0, 120, 0.06, 'noise', 0.14, { q: 0.7 }), note(0.45, 120, 0.06, 'noise', 0.14, { q: 0.7 }),
    // the classic 3-voice-in-one trick: a chord played as a 30 ms arpeggio, twice over
    ...[0, 1].flatMap((k) => arp({ ...me, wave: 'square', pw: 0.25 }, k * 0.15, st(me.root, k * 5), me.chord.slice(0, 3), 0.03, 0.03, 0.12)),
    ...arp({ ...them, wave: 'square', pw: 0.375 }, 0.48, them.root * 2, [0, 7, 12, 7, 12, 19], 0.07, 0.07, 0.12),
  ],
  fail: () => [note(0, 150, 0.25, 'noise', 0.12, { to: 60, q: 0.6 }), note(0, 196, 0.5, 'square', 0.13, { pw: 0.125, to: 98, r: 0.2 })],
  react: (me) => arp({ ...me, wave: 'square', pw: 0.25 }, 0, me.root * 2, [0, 4, 7, 12, 7, 12, 16, 19], 0.0375, 0.0375, 0.09),
  'their-mood': (me, them) => [
    ...motifIn(them.id, 0, 0.6, 0, 'square', 0.12, { pw: 0.25 }),
    ...motifIn(me.id, 0, 0.6, -1, 'square', 0.08, { pw: 0.5, bright: 3 }),
    note(0, 140, 0.05, 'noise', 0.1), note(0.3, 140, 0.05, 'noise', 0.1),
  ],
};

/* ---------- VCS: a narrow, detuned pitch set and gritty tones ----------
   The 2600's sound chip divides one clock by 1–32, so only those pitches exist and most are a
   little off the piano. Every note here snaps to that set first. */
const TIA = [15700, 5233].flatMap((c) => Array.from({ length: 32 }, (_, n) => c / (n + 1))).filter((f) => f >= 40 && f <= 4000);
export const snap = (f) => TIA.reduce((b, x) => (Math.abs(Math.log(x / f)) < Math.abs(Math.log(b / f)) ? x : b), TIA[0]);
const grit = (t, f, dur, gain) => [note(t, snap(f), dur, 'square', gain, { pw: 0.333, bright: 6 }), note(t, snap(f) * 2, dur, 'noise', gain * 0.35, { q: 6 })];
const vcs = {
  send: (me) => [...grit(0, me.root * 2, 0.09, 0.12), ...grit(0.09, me.root * 3, 0.09, 0.12)],
  receive: (me, them) => [...grit(0, them.root * 1.5, 0.12, 0.12), ...grit(0.12, them.root, 0.12, 0.12)],
  connect: (me, them) => [0, 1, 2, 3, 4, 5].flatMap((i) => grit(i * 0.15, (i % 2 ? them : me).root * [1, 1.25, 1.5, 2, 2.5, 3][i], 0.15, 0.11)),
  fail: () => [0, 1, 2, 3, 4].flatMap((i) => grit(i * 0.1, 220 / (1 + i * 0.25), 0.1, 0.12)),
  react: (me) => [0, 1, 2].flatMap((i) => grit(i * 0.1, me.root * [2, 3, 4][i], 0.1, 0.08)),
  'their-mood': (me, them) => [
    ...motifIn(them.id, 0, 0.6, 0, 'square', 0.12, { pw: 0.333 }).map((n) => ({ ...n, freq: snap(n.freq) })),
    ...motifIn(me.id, 0, 0.6, -1, 'noise', 0.08, { q: 8 }).map((n) => ({ ...n, freq: snap(n.freq) })),
  ],
};

/* ---------- Glass: soft triangle and sine earcons, nearly subliminal ---------- */
const soft = { a: 0.02, r: 0.08 };
const glass = {
  send: (me) => [note(0, me.root * 2, 0.18, 'sine', 0.08, { to: st(me.root * 2, 2), ...soft })],
  receive: (me, them) => [note(0, them.root * 1.5, 0.24, 'sine', 0.08, soft), note(0.06, them.root * 2, 0.18, 'triangle', 0.05, soft)],
  connect: (me, them) => [note(0, me.root, 0.5, 'sine', 0.08, { a: 0.1, r: 0.3 }), note(0.3, them.root * 1.5, 0.6, 'sine', 0.07, { a: 0.1, r: 0.35 })],
  fail: () => [note(0, 330, 0.5, 'triangle', 0.1, { to: 294, a: 0.03, r: 0.3 })],
  react: (me) => [note(0, me.root * 3, 0.3, 'sine', 0.05, { a: 0.01, r: 0.25 })],
  'their-mood': (me, them) => [
    ...motifIn(them.id, 0, 0.6, 0, 'sine', 0.07, soft),
    ...motifIn(me.id, 0, 0.6, -1, 'triangle', 0.05, soft),
  ],
};

const wrap = (table) => (event, opts = {}) => {
  const make = table[event];
  if (!make) throw new Error(`sketch has no ${event}`);
  const notes = make(flavour(opts.mood), flavour(opts.theirMood));
  return fitVoices(notes.filter((n) => n.t < DURATION_MS[event] / 1000));
};

export const SKETCHES = Object.freeze({
  sid: { name: 'SID', blurb: 'Pulse-width square leads, 30 ms chord arpeggios, noise drums. Loud, busy, very 1984.', plan: wrap(sid) },
  vcs: { name: 'VCS', blurb: 'Every pitch snapped to a 32-step divider set, so it is a little off the piano. Gritty pulse plus noise.', plan: wrap(vcs) },
  glass: { name: 'Glass', blurb: 'Sine and triangle only, slow attacks, low gain. Barely there.', plan: wrap(glass) },
});
