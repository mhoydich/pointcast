// The PMM motion module: the shared event names and timings, every event planning for every mood
// pair in every direction, reduced motion that never moves or flashes, the WCAG 2.3.1 flash limit
// (the tape border's bands most of all), emote frames, and moods that match app.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EVENTS, DURATION_MS, TARGET, MOOD_IDS, MAX_FLASHES, EMOTE_FPS, plan, flashes, layerSeries, emoteFrames, directions, CHOSEN, play,
} from '../public/pmm/motion/motion.js';
import { SKETCHED } from '../public/pmm/motion/sketches.js';
import { MOODS } from '../public/pmm/moods/moods.js';

const ROOT = resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');
const every = (fn) => {
  for (const direction of directions()) for (const ev of EVENTS) for (const reduced of [false, true])
    for (const mood of MOOD_IDS) for (const theirMood of MOOD_IDS) fn(plan(ev, { mood, theirMood, was: theirMood, reduced, direction }), { direction, ev, reduced, mood, theirMood });
};

test('EVENTS are the sixteen names shared with the sound sprint, in order', () => {
  assert.deepEqual(EVENTS, ['boot', 'found', 'connect', 'fail', 'hangup', 'send', 'receive', 'unverified', 'react', 'file-done', 'mood', 'their-mood', 'tab', 'settle', 'join', 'leave']);
});

test('DURATION_MS is the canonical timing table, and every plan runs exactly that long', () => {
  assert.deepEqual(DURATION_MS, { boot: 1200, found: 600, connect: 900, fail: 500, hangup: 400, send: 180, receive: 240, unverified: 400, react: 300, 'file-done': 400, mood: 600, 'their-mood': 600, tab: 300, settle: 900, join: 400, leave: 300 });
  for (const ev of EVENTS) { assert.equal(plan(ev).duration, DURATION_MS[ev]); assert.ok(TARGET[ev], ev); }
  assert.throws(() => plan('nope'));
});

test('the three sketches and the chosen system are all registered; sketches cover the compared moments', () => {
  assert.deepEqual(directions().sort(), ['arcade', 'pmm', 'quiet', 'raster']);
  for (const direction of ['raster', 'arcade', 'quiet']) for (const ev of SKETCHED) assert.equal(plan(ev, { direction }).direction, direction, `${direction} ${ev}`);
  assert.equal(plan('tab', { direction: 'arcade' }).direction, CHOSEN);
});

test('every event plans for every mood pair in every direction, with well-formed keyframes', () => {
  let n = 0;
  every((p, c) => {
    n++;
    assert.ok(p.layers.length > 0, JSON.stringify(c));
    for (const l of p.layers) {
      assert.ok(l.keys.length >= 2, `${c.ev} ${l.kind}`);
      assert.equal(l.keys[0].offset, 0); assert.equal(l.keys.at(-1).offset, 1);
      for (const kf of l.keys) {
        // compositor-only: transform and opacity, nothing that lays out or repaints colour
        for (const key of Object.keys(kf)) assert.ok(['offset', 'transform', 'opacity'].includes(key), `${c.ev}: ${key}`);
        assert.ok(kf.opacity >= 0 && kf.opacity <= 1);
      }
      assert.ok(typeof l.ease === 'string' && l.ease.length);
    }
  });
  assert.equal(n, 4 * 16 * 2 * 8 * 8);
});

test('the sender mood flavours the entrance: eight different receives, send uses my mood', () => {
  const sig = (p) => JSON.stringify(p.layers.map((l) => [l.keys, l.ease]));
  assert.equal(new Set(MOOD_IDS.map((m) => sig(plan('receive', { theirMood: m, mood: 'calm' })))).size, 8);
  assert.equal(sig(plan('receive', { theirMood: 'hyped', mood: 'calm' })), sig(plan('receive', { theirMood: 'hyped', mood: 'low' })));
  assert.equal(new Set(MOOD_IDS.map((m) => sig(plan('send', { mood: m, theirMood: 'calm' })))).size, 8);
  // reduced motion keeps the timing: tired arrives late
  const tired = plan('receive', { theirMood: 'tired', reduced: true }).layers[0].keys;
  assert.ok(tired.some((k) => k.offset > 0.3 && k.opacity === 0));
});

test('reduced motion: no transform movement, no particles, no tape border, still emotes, and no flashing', () => {
  every((p, c) => {
    if (!c.reduced) return;
    for (const l of p.layers) {
      assert.ok(!['ring', 'sparks'].includes(l.kind), `${c.ev}: ${l.kind}`);
      assert.ok(!l.scale && !l.slide, c.ev);
      for (const kf of l.keys) assert.ok(kf.transform === undefined || kf.transform === 'none', `${c.ev}: ${kf.transform}`);
      if (l.kind === 'sprite') assert.equal(l.frames.length, 1);
    }
    assert.equal(p.flashes, 0, `${c.direction} ${c.ev} ${c.mood}/${c.theirMood}`);
  });
});

test('reduced motion is an alternative, not off: every event still shows something', () => {
  for (const ev of EVENTS) {
    const p = plan(ev, { reduced: true, mood: 'sunny', theirMood: 'low', was: 'calm' });
    const moves = p.layers.some((l) => new Set(layerSeries(l, p.duration)).size > 1);
    assert.ok(moves, ev);
  }
});

test('nothing flashes more than three times a second (WCAG 2.3.1), tape border included', () => {
  every((p, c) => assert.ok(p.flashes <= MAX_FLASHES, `${c.direction} ${c.ev} ${c.mood}/${c.theirMood}: ${p.flashes}`));
  // the governor slows the bands rather than switching them off
  for (const m of MOOD_IDS) {
    const r = plan('boot', { mood: m }).layers.find((l) => l.kind === 'ring');
    assert.ok(r && r.speed >= 40, `${m}: ${r?.speed}`);
  }
});

test('the flash counter catches a real flash', () => {
  const strobe = { duration: 1000, layers: [{ kind: 'self', keys: Array.from({ length: 11 }, (_, i) => ({ offset: i / 10, opacity: i % 2 })) }] };
  assert.equal(flashes(strobe), 5);
  const ramp = { duration: 1000, layers: [{ kind: 'self', keys: [{ offset: 0, opacity: 0 }, { offset: 1, opacity: 1 }] }] };
  assert.equal(flashes(ramp), 0);
  const fast = { duration: 1000, layers: [{ kind: 'ring', bands: ['#FFFFFF', '#000000'], band: 6, speed: 600, thick: 8, keys: [] }] };
  assert.ok(flashes(fast) > MAX_FLASHES);
});

test('emotes: each mood loops two to four distinct 8x8 frames, the first is the Mood Atlas glyph', () => {
  assert.ok(EMOTE_FPS / 2 <= MAX_FLASHES);
  for (const m of MOODS) {
    const f = emoteFrames(m.id);
    assert.ok(f.length >= 2 && f.length <= 4, `${m.id}: ${f.length}`);
    assert.deepEqual([...f[0]], [...m.glyph]);
    for (const fr of f) { assert.equal(fr.length, 8); for (const row of fr) assert.match(row, /^[#.]{8}$/); assert.ok(fr.join('').includes('#'), m.id); }
    for (let i = 1; i < f.length; i++) assert.notEqual(f[i].join(), f[i - 1].join(), m.id);
  }
});

test('the moods are exactly the ones app.js uses, in order', () => {
  const src = /const MOODS = \[([\s\S]*?)\];/.exec(read('public/pmm/app.js'))[1];
  const inApp = [...src.matchAll(/\['(\w+)', '(#[0-9A-Fa-f]{6})'\]/g)].map((m) => [m[1], m[2]]);
  assert.equal(inApp.length, 8);
  assert.deepEqual(MOODS.map((m) => [m.id, m.color]), inApp);
  assert.deepEqual(MOOD_IDS, inApp.map(([id]) => id));
});

test('play() is a no-op without a document, and the module stays under 20 KB with no imports beyond moods', async () => {
  assert.equal(await play('send', {}), null);
  const src = read('public/pmm/motion/motion.js');
  assert.ok(statSync(resolve(ROOT, 'public/pmm/motion/motion.js')).size < 20 * 1024);
  const imports = [...src.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]);
  assert.ok(imports.every((p) => /^\.\.\/moods\/moods\.js$/.test(p)), imports.join());
});

test('the lab page loads the module, offers a reduced-motion preview and both mood pickers', () => {
  const html = read('public/pmm/motion/index.html');
  for (const s of ["from './motion.js'", 'id="reduced"', 'id="pick-me"', 'id="pick-them"', 'name="viewport"', 'href="../sound/"']) assert.ok(html.includes(s), s);
});
