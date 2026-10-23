import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import * as S from '../public/pmm/sound/sound.js';
import { SKETCHES, SKETCH_EVENTS, snap } from '../public/pmm/sound/sketches.js';

// Pure checks on the PMM earcon planners. The rendered pass (real Web Audio, peak and RMS) is
// scripts/pmm-sound-render.mjs, which needs Chromium and so is not part of `npm run test:pmm`.
const root = new URL('..', import.meta.url).pathname;
const appJs = readFileSync(`${root}public/pmm/app.js`, 'utf8');

const TABLE = { boot: 1200, found: 600, connect: 900, fail: 500, hangup: 400, send: 180, receive: 240, unverified: 400,
  react: 300, 'file-done': 400, mood: 600, 'their-mood': 600, tab: 300, settle: 900, join: 400, leave: 300 };
const pairs = S.MOOD_IDS.flatMap((a) => S.MOOD_IDS.map((b) => [a, b]));

test('EVENTS is the shared vocabulary, in order, and DURATION_MS is the shared table', () => {
  assert.deepEqual([...S.EVENTS], Object.keys(TABLE));
  assert.deepEqual({ ...S.DURATION_MS }, TABLE);
  for (const e of S.EVENTS) assert.ok(S.CAPTIONS[e]?.length > 10, `${e} has a caption`);
});

test('moods match MOODS in public/pmm/app.js', () => {
  const block = appJs.match(/const MOODS = \[([\s\S]*?)\];/);
  assert.ok(block, 'app.js declares const MOODS');
  const ids = [...block[1].matchAll(/\['([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...S.MOOD_IDS], ids);
  assert.deepEqual([...S.FLAVOUR_IDS], ids, 'every mood has a flavour');
});

function checkNotes(label, notes, ms) {
  assert.ok(Array.isArray(notes) && notes.length > 0, `${label}: plans notes`);
  for (const n of notes) {
    for (const k of ['t', 'freq', 'dur', 'gain']) assert.ok(Number.isFinite(n[k]), `${label}: ${k} finite`);
    assert.ok(['square', 'triangle', 'sine', 'noise'].includes(n.wave), `${label}: wave ${n.wave}`);
    for (const f of [n.freq, n.to ?? n.freq]) assert.ok(f >= S.LIMITS.minHz && f <= S.LIMITS.maxHz, `${label}: ${f} Hz in range`);
    assert.ok(n.t >= 0 && n.dur > 0 && n.gain > 0, `${label}: positive timing and gain`);
    assert.ok(n.gain <= S.LIMITS.noteGain, `${label}: note gain ${n.gain}`);
    if (n.pw !== undefined) assert.ok(n.pw > 0 && n.pw <= 0.5, `${label}: pulse width ${n.pw}`);
  }
  assert.ok(S.peakGain(notes) <= S.LIMITS.peakGain, `${label}: peak ${S.peakGain(notes)}`);
  const span = S.span(notes) * 1000;
  assert.ok(Math.abs(span - ms) <= ms * 0.1, `${label}: ${span.toFixed(0)} ms vs ${ms}`);
}

test('every event × every mood pair plans within range, budget and duration', () => {
  for (const e of S.EVENTS) for (const [a, b] of pairs) {
    const notes = S.plan(e, { mood: a, theirMood: b });
    checkNotes(`${e} ${a}/${b}`, notes, TABLE[e]);
    for (const n of notes) {
      assert.ok(n.dur <= S.LIMITS.maxNoteS, `${e}: no sustained tone over 1 s`);
      // Nothing harsh in the 2-5 kHz band: bright fundamentals stay soft, and never square.
      if (n.freq >= S.LIMITS.brightHz && n.wave !== 'noise') assert.ok(n.gain <= S.LIMITS.brightGain && n.wave !== 'square', `${e}: bright note`);
    }
  }
});

test('an unknown mood falls back to calm and an unknown event throws', () => {
  assert.deepEqual(S.plan('send', { mood: 'nope' }), S.plan('send', { mood: 'calm' }));
  assert.deepEqual(S.plan('send', {}), S.plan('send', { mood: 'calm' }));
  assert.throws(() => S.plan('explode'));
  assert.throws(() => S.haptic('explode'));
});

test('mood flavour: receive follows the sender, send follows me, warnings never change', () => {
  const rx = new Set(S.MOOD_IDS.map((m) => JSON.stringify(S.plan('receive', { mood: 'calm', theirMood: m }))));
  assert.equal(rx.size, S.MOOD_IDS.length, 'eight moods, eight different knocks');
  assert.deepEqual(S.plan('receive', { mood: 'calm', theirMood: 'low' }), S.plan('receive', { mood: 'hyped', theirMood: 'low' }));
  const tx = new Set(S.MOOD_IDS.map((m) => JSON.stringify(S.plan('send', { mood: m }))));
  assert.ok(tx.size >= 6, 'send changes with my mood');
  for (const e of ['fail', 'unverified']) assert.deepEqual(S.plan(e, { mood: 'hyped' }), S.plan(e, { mood: 'low' }));
  const both = S.plan('their-mood', { mood: 'calm', theirMood: 'low' });
  assert.ok(both.some((n) => n.t === 0 && n.wave === 'triangle') && both.filter((n) => n.t === 0).length >= 2, 'their-mood plays both motifs at once');
});

test('a streak recedes, never below 55%', () => {
  const g = (k) => S.plan('receive', { theirMood: 'hyped', streak: k }).reduce((s, n) => s + n.gain, 0);
  assert.ok(g(1) < g(0) && g(5) < g(1));
  assert.ok(Math.abs(g(100) / g(0) - 0.55) < 0.01);
});

test('haptic patterns are short, positive and mood-flavoured for receive', () => {
  for (const e of S.EVENTS) for (const m of S.MOOD_IDS) {
    const p = S.haptic(e, m, m);
    assert.ok(p.length > 0 && p.every((x) => Number.isInteger(x) && x > 0), `${e}/${m}: pattern`);
    assert.ok(p.reduce((a, b) => a + b, 0) <= S.LIMITS.hapticMs, `${e}/${m}: ${p}`);
  }
  assert.equal(new Set(S.MOOD_IDS.map((m) => S.haptic('receive', m).join())).size, S.MOOD_IDS.length);
});

test('the atmosphere bed is quiet, in range, and loops', () => {
  for (const [a, b] of pairs) {
    const notes = S.atmospherePlan(a, b);
    assert.ok(notes.length > 4);
    for (const n of notes) assert.ok(n.freq >= S.LIMITS.minHz && n.freq <= 1000 && ['sine', 'triangle'].includes(n.wave));
    assert.ok(S.peakGain(notes) <= 0.15, `${a}/${b}: bed peak ${S.peakGain(notes)}`);
    assert.ok(notes.every((n) => n.t < S.ATMO_LOOP_S));
  }
});

test('the three sketches cover their six events within the same budgets', () => {
  assert.deepEqual(Object.keys(SKETCHES), ['sid', 'vcs', 'glass']);
  for (const [key, d] of Object.entries(SKETCHES)) for (const e of SKETCH_EVENTS) for (const [a, b] of pairs) {
    checkNotes(`${key} ${e} ${a}/${b}`, d.plan(e, { mood: a, theirMood: b }), TABLE[e]);
  }
  assert.ok(Math.abs(snap(440) - 440) / 440 > 0.005, 'VCS pitches are off the piano');
});

test('the engine is inert in Node: no context, no sound, no throw', () => {
  assert.equal(S.play('send', { mood: 'calm' }), false);
  assert.equal(S.play('nope'), false);
  S.setVolume(2); S.setVolume(-1); S.setEnabled(false); S.setEnabled(true); S.setHaptics(false); S.setHiddenReceive(true);
  assert.equal(S.startAtmosphere({ mood: 'calm', theirMood: 'low' }), false);
  assert.equal(S.stats().state, 'locked');
});

test('sound.js stays under 20 KB and asks the network for nothing', () => {
  const path = `${root}public/pmm/sound/sound.js`;
  assert.ok(statSync(path).size < 20 * 1024, `${statSync(path).size} bytes`);
  const src = readFileSync(path, 'utf8');
  assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|new Audio\(|['"][^'"]*\.(mp3|wav|ogg)['"]|https?:\/\//);
  assert.deepEqual([...src.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]), ['../moods/moods.js']);
});
