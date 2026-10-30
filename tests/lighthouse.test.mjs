import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { LAMPS, midiToHz, lampForKey, lensGeometry, lampAt, lensCells, hubCells } from '../src/lib/lighthouse/lens.mjs';
import { SPEED_STEPS, FLASH_ON, BASE_WINDOW, speedTier, playbackTiming, playbackPlan, tuning, createRng, createGame, extend, due, press, miss } from '../src/lib/lighthouse/game.mjs';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { createMood, moodEvent, moodStep, moodResponse, beginGame, serializeMood } from '../src/lib/breakwater/mood.mjs';
import { ROW, readSave } from '../src/lib/breakwater/row.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);

test('lamps: four compass lamps, one per palette band, tones of an A major chord', () => {
  assert.equal(LAMPS.length, 4);
  assert.deepEqual(LAMPS.map((l) => l.id), ['north', 'east', 'south', 'west']);
  assert.deepEqual(new Set(LAMPS.map((l) => l.band)), new Set(['red', 'orange', 'green', 'yellow']));
  for (const m of Object.values(MACHINES)) for (const l of LAMPS) assert.match(m.bands[l.band], /^#[0-9a-f]{6}$/);
  // E3, A3, C#4, E4: pitch classes E, A, C# only, and the outer two an octave apart.
  const pcs = new Set(LAMPS.map((l) => l.midi % 12));
  assert.deepEqual(pcs, new Set([4, 9, 1]));
  assert.equal(LAMPS[3].midi - LAMPS[0].midi, 12);
  assert.ok(Math.abs(midiToHz(57) - 220) < 1e-9);
  assert.ok(Math.abs(midiToHz(64) - 329.63) < 0.01);
});

test('lamps: arrows, W A S D, 1 to 4 and the numpad name the same lamps; nothing else does', () => {
  assert.deepEqual(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].map(lampForKey), [0, 1, 2, 3]);
  assert.deepEqual(['KeyW', 'KeyD', 'KeyS', 'KeyA'].map(lampForKey), [0, 1, 2, 3]);
  assert.deepEqual(['Digit1', 'Digit2', 'Digit3', 'Digit4'].map(lampForKey), [0, 1, 2, 3]);
  assert.deepEqual(['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'].map(lampForKey), [0, 1, 2, 3]);
  for (const code of ['Space', 'Enter', 'KeyP', 'KeyF', 'KeyM', 'KeyC', 'KeyX', 'KeyZ', 'KeyT', 'Digit5']) assert.equal(lampForKey(code), -1, code);
});

test('lens: fits the 288-wide field at every height and hit-tests by compass point', () => {
  for (const h of [384, 420, 480]) {
    const g = lensGeometry(288, h);
    assert.ok(g.cx - g.rOuter >= 8 && g.cx + g.rOuter <= 280, 'inside the side walls');
    assert.ok(g.cy - g.rOuter >= 32, 'below the HUD');
    assert.ok(g.cy + g.rOuter <= h - 40, `room for the prompt at ${h}`);
    const r = (g.rOuter + g.rInner) / 2;
    assert.equal(lampAt(g.cx, g.cy - r, g), 0);
    assert.equal(lampAt(g.cx + r, g.cy, g), 1);
    assert.equal(lampAt(g.cx, g.cy + r, g), 2);
    assert.equal(lampAt(g.cx - r, g.cy, g), 3);
    assert.equal(lampAt(g.cx, g.cy, g), -1, 'the hub is not a lamp');
    assert.equal(lampAt(g.cx, g.cy - g.rOuter - 40, g), -1, 'far outside is not a lamp');
    assert.equal(lampAt(g.cx + 4, g.cy - g.rOuter - 10, g), 0, 'a thumb just past the rim still counts');
  }
});

test('lens: cells are balanced between lamps, stay inside the ring and leave the frame dark', () => {
  const g = lensGeometry(288, 384);
  const cells = lensCells(g);
  const counts = [0, 0, 0, 0];
  for (const c of cells) {
    counts[c.lamp] += 1;
    const d = Math.hypot(c.x + 2 - g.cx, c.y + 2 - g.cy);
    assert.ok(d <= g.rOuter && d >= g.rInner);
    assert.equal(lampAt(c.x + 2, c.y + 2, g), c.lamp, 'a cell hit-tests to its own lamp');
    assert.ok(c.ring >= 0);
  }
  const min = Math.min(...counts), max = Math.max(...counts);
  assert.ok(min > 300, `each lamp is big: ${counts}`);
  assert.ok(max - min <= max * 0.05, `balanced: ${counts}`);
  assert.ok(hubCells(g).length > 50);
});

test('speed: playback steps up after the 5th, 9th and 13th signal, as on Simon', () => {
  assert.deepEqual(SPEED_STEPS, [5, 9, 13]);
  const tiers = Array.from({ length: 20 }, (_, i) => speedTier(i + 1));
  assert.deepEqual(tiers.slice(0, 5), [0, 0, 0, 0, 0]);
  assert.equal(speedTier(6), 1);
  assert.equal(speedTier(9), 1);
  assert.equal(speedTier(10), 2);
  assert.equal(speedTier(13), 2);
  assert.equal(speedTier(14), 3);
  for (let i = 1; i < FLASH_ON.length; i += 1) assert.ok(FLASH_ON[i] < FLASH_ON[i - 1]);
  assert.ok(playbackTiming(6).on < playbackTiming(5).on);
  assert.ok(playbackTiming(14, 1.3).on > playbackTiming(14, 1).on, 'a slower mood stretches the flash');
  assert.equal(playbackTiming(3, NaN).on, FLASH_ON[0]);
  const plan = playbackPlan([0, 1, 2], 1);
  assert.equal(plan.length, 3);
  for (let i = 1; i < plan.length; i += 1) assert.ok(plan[i].start > plan[i - 1].end, 'dark between flashes');
});

test('tuning: DRIFT slows and widens the window, RUSH speeds up and dims, CALM is more generous', () => {
  const m = createMood('play');
  const dawn = tuning(moodResponse(m), 'play');
  assert.equal(dawn.label, 'DAWN');
  moodEvent(m, 'loss'); moodEvent(m, 'loss');
  const drift = tuning(moodResponse(m), 'play');
  assert.equal(drift.label, 'DRIFT');
  assert.ok(drift.mult >= 1.3);
  assert.ok(drift.window > dawn.window);
  const hot = createMood('rush');
  hot.energy = 1; hot.label = 'RUSH';
  const rush = tuning(moodResponse(hot), 'rush');
  assert.ok(rush.mult <= 0.86);
  assert.ok(rush.idle < dawn.idle, 'RUSH dims the lamps between flashes');
  assert.ok(rush.window < dawn.window);
  assert.ok(rush.sparks > drift.sparks, 'energy throws more sparks');
  assert.ok(tuning(moodResponse(createMood('calm')), 'calm').window > dawn.window);
  for (const t of [dawn, drift, rush]) assert.ok(t.window >= 2.2 && t.window <= 6);
  assert.equal(tuning(null).label, 'DAWN');
  assert.equal(BASE_WINDOW, 3);
});

test('game: the sequence grows by one and must be repeated from the first lamp', () => {
  const g = createGame(createRng(7));
  assert.equal(press(g, 0).result, 'ignored', 'nothing to repeat yet');
  extend(g);
  assert.equal(g.sequence.length, 1);
  const r = press(g, g.sequence[0]);
  assert.equal(r.result, 'complete');
  assert.deepEqual(r.events, ['paddle', 'brick']);
  assert.equal(g.longest, 1);
  extend(g);
  assert.equal(g.pos, 0);
  assert.equal(due(g), g.sequence[0]);
  assert.equal(press(g, g.sequence[0]).result, 'correct');
  assert.equal(press(g, g.sequence[1]).result, 'complete');
  // Same seed, same light.
  const a = createGame(createRng(3)), b = createGame(createRng(3));
  for (let i = 0; i < 12; i += 1) { extend(a); extend(b); }
  assert.deepEqual(a.sequence, b.sequence);
  assert.ok(a.sequence.every((x) => x >= 0 && x < 4));
});

test('game: a miss ends it on PLAY and replays the same sequence on CALM', () => {
  const g = createGame(createRng(11));
  for (let i = 0; i < 4; i += 1) { extend(g); for (const l of g.sequence) press(g, l); }
  extend(g);
  const seq = g.sequence.slice();
  press(g, seq[0], true);
  const wrong = (seq[1] + 1) % 4;
  const calm = press(g, wrong, true);
  assert.equal(calm.result, 'replay');
  assert.equal(calm.expected, seq[1], 'the miss names the lamp that was due');
  assert.deepEqual(calm.events, ['loss']);
  assert.equal(g.over, false);
  assert.deepEqual(g.sequence, seq, 'CALM keeps the same sequence');
  assert.equal(g.pos, 0);
  for (const l of seq) press(g, l, true);
  assert.equal(g.longest, 5);
  extend(g);
  const out = miss(g, false);
  assert.equal(out.result, 'over');
  assert.equal(g.over, true);
  assert.equal(press(g, g.sequence[0]).result, 'ignored');
  assert.equal(g.longest, 5, 'best is the longest sequence repeated, not the one missed');
  assert.equal(g.misses, 2);
});

test('simulated play: a careful player reaches 20 steps; the mood climbs, waves fire, a miss drifts', () => {
  const g = createGame(createRng(2026));
  const mood = createMood('play');
  beginGame(mood);
  const counts = { paddle: 0, brick: 0, wave: 0, loss: 0 };
  const flashes = [];
  let clock = 0;
  for (let round = 1; round <= 20; round += 1) {
    extend(g);
    const t = tuning(moodResponse(mood), mood.dial);
    const plan = playbackPlan(g.sequence, t.mult);
    flashes.push(plan[0].end - plan[0].start);
    // Watch: time passes while the light plays.
    const watch = plan[plan.length - 1].end;
    moodStep(mood, watch); clock += watch;
    for (const lamp of g.sequence) {
      const think = 0.45;
      assert.ok(think < t.window, 'the player answers inside the window');
      moodStep(mood, think); clock += think;
      const r = press(g, lamp);
      assert.notEqual(r.result, 'over');
      for (const e of r.events) { moodEvent(mood, e); counts[e] += 1; }
    }
    moodStep(mood, 1); clock += 1;
  }
  assert.equal(g.longest, 20);
  assert.equal(counts.brick, 20);
  assert.equal(counts.paddle, (20 * 21) / 2, 'one paddle per correct press');
  assert.equal(counts.wave, 2, 'the 8th and 16th steps');
  assert.ok(['FLOW', 'RUSH'].includes(mood.label), `a long clean run is ${mood.label}`);
  assert.ok(flashes[19] < flashes[0], 'later sequences flash faster');
  assert.ok(clock > 60, 'a twenty-step game takes a few minutes of attention');
  // Now a miss: the game ends, the mood drops to DRIFT, the save holds the best.
  extend(g);
  const out = miss(g, false);
  moodEvent(mood, out.events[0]);
  assert.equal(mood.label, 'DRIFT');
  assert.equal(g.over, true);
  const save = JSON.parse(JSON.stringify({ best: g.longest, machine: 'xl', dial: mood.dial, sound: true, crt: true, mood: serializeMood(mood) }));
  const lobby = readSave(save);
  assert.equal(lobby.best, 20);
  assert.equal(lobby.label, 'DRIFT');
  assert.ok(lobby.played);
});

test('cabinet: Lighthouse is in the row, the catalog and the discovery files', () => {
  const cab = ROW.find((c) => c.slug === 'lighthouse');
  assert.ok(cab);
  assert.equal(cab.storeKey, 'lighthouse:v1');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/data/game-catalog.json'), 'utf8'));
  const i = catalog.findIndex((g) => g.slug === 'lighthouse');
  assert.ok(i >= 0, 'in the catalog');
  assert.equal(catalog[i + 1]?.slug, 'breakwater', 'immediately before Breakwater');
  assert.equal(catalog[i].family, 'Retro arcade');
  assert.ok(fs.existsSync(path.join(root, 'public/images/lighthouse/og.png')));
  assert.ok(fs.existsSync(path.join(root, 'public/images/lighthouse/cover.svg')));
  const block = JSON.parse(fs.readFileSync(path.join(root, 'src/content/blocks/0745.json'), 'utf8'));
  assert.equal(block.id, '0745');
  assert.equal(block.channel, 'FD');
  assert.equal(block.media.src, '/images/lighthouse/cover.svg');
  const page = fs.readFileSync(path.join(root, 'src/pages/lighthouse.astro'), 'utf8');
  assert.match(page, /Directed by Michael Hoydich\. Designed and built by Claude Code\./);
  assert.match(page, /href="\/cabinet-row"/);
  assert.match(page, /lighthouse:v1/);
  const llms = fs.readFileSync(path.join(root, 'public/llms.txt'), 'utf8');
  assert.match(llms, /^- \[Play\]\(https:\/\/pointcast\.xyz\/play\).*\[Lighthouse\]\(https:\/\/pointcast\.xyz\/lighthouse\)/m);
});
