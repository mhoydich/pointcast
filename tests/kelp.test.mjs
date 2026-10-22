import test from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, START, HAVEN, PATTERNS, DIR_IDS, OPPOSITE, cellKey, inHaven, glyphCells, glyphWidth, patternFor, patternCells, rocksFor, reachable } from '../src/lib/kelp/grid.mjs';
import { createGame, setDirection, tick, probe, respawn, nextStage, setMachine, start, autoDirection, targetLength, planktonValue, startLengthFor, tickInterval, noteForLength, placePlankton, GOLDEN_MULT, BASE_TICK, MIN_TICK } from '../src/lib/kelp/strand.mjs';
import { MACHINE_IDS } from '../src/lib/breakwater/waves.mjs';
import { createMood, moodEvent, moodResponse } from '../src/lib/breakwater/mood.mjs';

function seeded(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

test('grid: a portrait field with a rock-free haven around the start', () => {
  assert.equal(COLS, 24);
  assert.equal(ROWS, 32);
  assert.ok(inHaven(START.c, START.r));
  assert.ok(inHaven(START.c, START.r + 5), 'the whole starting strand fits');
  assert.ok(HAVEN.c1 - HAVEN.c0 >= 4 && HAVEN.r1 - HAVEN.r0 >= 8);
  assert.deepEqual(DIR_IDS, ['up', 'down', 'left', 'right']);
  for (const d of DIR_IDS) assert.equal(OPPOSITE[OPPOSITE[d]], d);
});

test('grid: font glyphs become rock cells at scale', () => {
  assert.equal(glyphWidth('XL', 3), 21);
  assert.equal(glyphWidth('', 3), 0);
  const cells = glyphCells('I', 2, 4, 2);
  assert.equal(cells.length, 9 * 4, 'the I glyph has 9 lit pixels, each a 2x2 block');
  assert.ok(cells.every(([c, r]) => c >= 2 && c < 8 && r >= 4 && r < 14));
});

test('grid: every pattern, on both machines, leaves the haven clear and the water connected', () => {
  for (let n = 0; n < PATTERNS.length * 2; n += 1) {
    for (const id of MACHINE_IDS) {
      const rocks = rocksFor(n, id, 1);
      assert.equal(rocks.pattern, patternFor(n));
      assert.equal(rocks.pattern, PATTERNS[n % PATTERNS.length]);
      const seen = new Set();
      for (const [c, r] of rocks.cells) {
        assert.ok(c >= 0 && c < COLS && r >= 0 && r < ROWS, `${rocks.pattern} in bounds`);
        assert.ok(!inHaven(c, r), `${rocks.pattern} keeps the haven`);
        assert.ok(!seen.has(cellKey(c, r)), 'no duplicate rocks');
        seen.add(cellKey(c, r));
      }
      assert.equal(rocks.set.size, rocks.cells.length);
      const water = reachable(rocks.set);
      assert.equal(water.size, COLS * ROWS - rocks.set.size, `${rocks.pattern} on ${id}: every open cell is reachable`);
      if (rocks.pattern !== 'open') assert.ok(rocks.total >= 16, `${rocks.pattern} has enough rocks to matter`);
    }
  }
  assert.equal(rocksFor(0).total, 0, 'the first stage is open water');
});

test('grid: the nameplate spells the machine and the counter spells the stage; density thins but never adds', () => {
  const xl = patternCells(PATTERNS.indexOf('nameplate'), 'xl').cells.map(String).join('|');
  // The 6 of the C64 nameplate encloses water; a doorway is cut so the pocket stays reachable.
  const six = rocksFor(PATTERNS.indexOf('nameplate'), 'c64', 1);
  assert.ok(six.cells.length < glyphCells('64', 0, 0, 3).length, 'a doorway was cut through the 6');
  const c64 = patternCells(PATTERNS.indexOf('nameplate'), 'c64').cells.map(String).join('|');
  assert.notEqual(xl, c64);
  const ci = PATTERNS.indexOf('counter');
  const seven = patternCells(ci).cells.map(String).join('|');
  const fourteen = patternCells(ci + PATTERNS.length).cells.map(String).join('|');
  assert.notEqual(seven, fourteen, 'stage 7 and stage 14 spell different numbers');
  for (let n = 1; n < PATTERNS.length; n += 1) {
    const full = rocksFor(n, 'xl', 1);
    const thin = rocksFor(n, 'xl', 0.2);
    assert.ok(thin.set.size < full.set.size, `${full.pattern} thins`);
    assert.ok(thin.set.size >= full.set.size * 0.5, `${full.pattern} keeps at least half`);
    for (const k of thin.set) assert.ok(full.set.has(k), 'thinning never adds a rock');
  }
});

test('strand: a fresh game sits in the haven, heads up, and has plankton in open water', () => {
  const g = createGame({ rng: seeded(1) });
  assert.equal(g.strand.length, 4);
  assert.deepEqual(g.strand[0], { c: START.c, r: START.r });
  assert.equal(g.dir, 'up');
  assert.equal(g.phase, 'ready');
  assert.equal(g.lives, 3);
  assert.ok(g.plankton && !g.rocks.set.has(cellKey(g.plankton.c, g.plankton.r)));
  assert.ok(!g.strand.some((s) => s.c === g.plankton.c && s.r === g.plankton.r));
  assert.equal(g.target, targetLength(0));
  assert.deepEqual(tick(g), [], 'no movement before start');
});

test('strand: turns queue, reversals are refused, and the queue drains one per tick', () => {
  const g = createGame({ rng: seeded(2) });
  start(g);
  assert.equal(setDirection(g, 'down'), false, 'cannot reverse');
  assert.equal(setDirection(g, 'up'), false, 'already going up');
  assert.equal(setDirection(g, 'left'), true);
  assert.equal(setDirection(g, 'right'), false, 'reverse of the queued turn');
  assert.equal(setDirection(g, 'up'), true);
  assert.equal(setDirection(g, 'down'), true, 'a third turn replaces the second when it is legal after the first');
  assert.deepEqual(g.queue, ['left', 'down']);
  assert.equal(setDirection(g, 'left'), false, 'a repeat of the first queued turn is refused');
  assert.equal(setDirection(g, 'right'), false, 'a reversal of the first queued turn is refused');
  assert.deepEqual(g.queue, ['left', 'down']);
  g.queue = ['left', 'up'];
  tick(g, { rng: seeded(3) });
  assert.equal(g.dir, 'left');
  assert.deepEqual(g.strand[0], { c: START.c - 1, r: START.r });
  assert.equal(g.strand.length, 4, 'no growth without plankton');
  tick(g, { rng: seeded(3) });
  assert.equal(g.dir, 'up');
});

test('strand: eating grows by one, scores by stage and mood, climbs the pentatonic, and clears the stage at the target', () => {
  const g = createGame({ rng: seeded(4) });
  start(g);
  g.plankton = { c: START.c, r: START.r - 1 };
  const events = tick(g, { rng: seeded(5), label: 'DAWN' });
  assert.equal(events[0].type, 'eat');
  assert.equal(events[0].value, planktonValue(0, 'DAWN'));
  assert.equal(g.score, 10);
  assert.equal(g.streak, 1);
  assert.equal(g.grow, 1, 'growth lands on the next tick');
  assert.equal(g.strand.length, 4);
  tick(g, { rng: seeded(5) });
  assert.equal(g.strand.length, 5);
  assert.notDeepEqual(g.plankton, { c: START.c, r: START.r - 1 }, 'a new plankton was placed');
  assert.equal(planktonValue(0, 'FLOW'), 15);
  assert.equal(planktonValue(2, 'RUSH'), 60);
  assert.equal(noteForLength(4), 0);
  assert.equal(noteForLength(5), 2);
  assert.equal(noteForLength(9), 12);
  assert.equal(noteForLength(80), 31, 'the climb tops out');
  assert.equal(targetLength(0), 12);
  assert.equal(targetLength(20), 40);
  // Feed the strand straight up to the target.
  const h = createGame({ rng: seeded(6) });
  start(h);
  let cleared = null;
  for (let i = 0; i < 40 && !cleared; i += 1) {
    h.plankton = { c: h.strand[0].c, r: h.strand[0].r - 1 };
    for (const e of tick(h, { rng: seeded(7) })) if (e.type === 'clear') cleared = e;
    if (h.strand[0].r <= 2 && h.phase === 'play') { setDirection(h, h.strand[0].c < 12 ? 'right' : 'left'); tick(h, { rng: seeded(7) }); setDirection(h, 'down'); }
  }
  assert.ok(cleared, 'the stage cleared');
  assert.equal(h.phase, 'clear');
  assert.ok(h.strand.length + h.grow >= targetLength(0));
});

test('strand: wall, rock and self collisions cost a life; CALM costs none; game over at zero', () => {
  const wall = createGame({ rng: seeded(8) });
  start(wall);
  wall.plankton = { c: 0, r: 0 };
  let events = [];
  for (let i = 0; i < 40 && wall.phase === 'play'; i += 1) events = tick(wall, { rng: seeded(9) });
  assert.equal(wall.phase, 'lost');
  assert.deepEqual(events[0], { type: 'collide', with: 'wall' });
  assert.equal(wall.lives, 2);
  assert.equal(wall.streak, 0);
  respawn(wall);
  assert.equal(wall.phase, 'ready');
  assert.deepEqual(wall.strand[0], { c: START.c, r: START.r });

  const rock = createGame({ stage: 1, rng: seeded(10) });
  assert.equal(rock.rocks.pattern, 'posts');
  rock.strand = [{ c: 5, r: 10 }, { c: 5, r: 11 }, { c: 5, r: 12 }];
  rock.dir = 'up'; start(rock);
  rock.plankton = { c: 0, r: 0 };
  tick(rock, { rng: seeded(11) });
  assert.equal(probe(rock, 'up'), 'rock');
  events = tick(rock, { rng: seeded(11) });
  assert.deepEqual(events[0], { type: 'collide', with: 'rock' });

  const self = createGame({ rng: seeded(12) });
  self.strand = [{ c: 11, r: 20 }, { c: 11, r: 21 }, { c: 12, r: 21 }, { c: 12, r: 20 }, { c: 12, r: 19 }, { c: 11, r: 19 }, { c: 10, r: 19 }];
  self.dir = 'up'; start(self);
  self.plankton = { c: 0, r: 0 };
  assert.equal(probe(self, 'up'), 'self');
  events = tick(self, { rng: seeded(13) });
  assert.deepEqual(events[0], { type: 'collide', with: 'self' });
  // The tail cell is free to enter when the strand is not growing.
  const ring = createGame({ rng: seeded(14) });
  ring.strand = [{ c: 11, r: 20 }, { c: 11, r: 21 }, { c: 12, r: 21 }, { c: 12, r: 20 }];
  ring.dir = 'up'; ring.queue = ['right']; start(ring);
  ring.plankton = { c: 0, r: 0 };
  assert.equal(probe(ring, 'right', false), 'open');
  assert.equal(probe(ring, 'right', true), 'self');

  const calm = createGame({ unlimited: true, lives: 0, rng: seeded(15) });
  start(calm); calm.plankton = { c: 0, r: 0 };
  for (let i = 0; i < 40 && calm.phase === 'play'; i += 1) tick(calm, { rng: seeded(16) });
  assert.equal(calm.phase, 'lost');
  assert.equal(calm.lives, 0, 'CALM never counts lives');

  const last = createGame({ lives: 1, rng: seeded(17) });
  start(last); last.plankton = { c: 0, r: 0 };
  for (let i = 0; i < 40 && last.phase === 'play'; i += 1) events = tick(last, { rng: seeded(18) });
  assert.equal(last.phase, 'over');
  assert.equal(events[1].type, 'over');
});

test('strand: the next stage stands a new pattern, resets the strand, and awards a life every third stage', () => {
  const g = createGame({ rng: seeded(19) });
  start(g);
  assert.equal(nextStage(g, { density: 1, rng: seeded(20) }), false);
  assert.equal(g.stage, 1);
  assert.equal(g.rocks.pattern, 'posts');
  assert.equal(g.target, targetLength(1));
  assert.equal(g.phase, 'ready');
  assert.equal(g.strand.length, 4);
  assert.equal(g.lives, 3);
  nextStage(g, { rng: seeded(21) });
  assert.equal(nextStage(g, { rng: seeded(22) }), true, 'stage 3 is the first extra life');
  assert.equal(g.lives, 4);
  // DRIFT asks for a shorter strand on the next life.
  const drift = createMood('play'); moodEvent(drift, 'loss'); moodEvent(drift, 'loss');
  const r = moodResponse(drift);
  assert.equal(r.label, 'DRIFT');
  assert.equal(startLengthFor(r), 3);
  assert.equal(startLengthFor(moodResponse(createMood('play'))), 4);
  assert.equal(startLengthFor({ paddle: 0.9 }), 4, 'RUSH never starts longer than the default');
  assert.equal(startLengthFor({ paddle: 2 }), 2);
  respawn(g, { startLength: startLengthFor(r) });
  assert.equal(g.strand.length, 3);
  const calm = createGame({ unlimited: true, rng: seeded(23) });
  nextStage(calm); nextStage(calm); assert.equal(nextStage(calm), false, 'no extra lives on CALM');
});

test('strand: the tick interval follows stage, mood speed and the golden boost, inside bounds', () => {
  assert.equal(tickInterval(0, 1), BASE_TICK);
  assert.ok(tickInterval(3, 1) < tickInterval(0, 1));
  assert.ok(tickInterval(0, 0.9) > tickInterval(0, 1), 'DRIFT slows the ticks');
  assert.ok(tickInterval(0, 1.2) < tickInterval(0, 1));
  assert.ok(tickInterval(0, 1, true) < tickInterval(0, 1));
  assert.equal(tickInterval(40, 2, true), MIN_TICK);
  assert.ok(tickInterval(12, 0.5) <= BASE_TICK * 2.1);
});

test('strand: golden plankton appears only in RUSH, is worth more, grows by two and boosts', () => {
  const g = createGame({ rng: seeded(24) });
  start(g);
  g.plankton = { c: 0, r: 0 };
  let spawned = false;
  for (let i = 0; i < 12 && !spawned; i += 1) { for (const e of tick(g, { rng: seeded(25 + i), label: 'DAWN' })) if (e.type === 'goldenSpawn') spawned = true; }
  assert.equal(spawned, false, 'no gold at DAWN');
  const rush = createGame({ rng: seeded(26) });
  start(rush); rush.plankton = { c: 0, r: 0 };
  const rng = () => 0.001;
  const ev = tick(rush, { rng, label: 'RUSH' });
  assert.ok(ev.some((e) => e.type === 'goldenSpawn'));
  assert.ok(rush.golden && rush.golden.ttl > 0);
  // Put the gold in front of the head and eat it.
  rush.golden = { c: rush.strand[0].c, r: rush.strand[0].r - 1, ttl: 10 };
  const ate = tick(rush, { rng: () => 0.99, label: 'RUSH' });
  assert.equal(ate[0].type, 'golden');
  assert.equal(ate[0].value, planktonValue(0, 'RUSH') * GOLDEN_MULT);
  assert.equal(rush.grow, 2);
  assert.ok(rush.boost > 0);
  assert.equal(rush.golden, null);
  // Gold times out.
  rush.golden = { c: 0, r: 1, ttl: 1 };
  tick(rush, { rng: () => 0.99, label: 'RUSH' });
  assert.equal(rush.golden, null);
});

test('strand: switching machines mid-stage never drops a rock on the strand or the plankton', () => {
  const g = createGame({ stage: 3, machineId: 'xl', rng: seeded(27) });
  assert.equal(g.rocks.pattern, 'nameplate');
  const before = g.rocks.set.size;
  // Park the strand inside where the C64 nameplate would stand.
  const c64 = rocksFor(3, 'c64', 1);
  const [c, r] = c64.cells[Math.floor(c64.cells.length / 2)];
  g.strand = [{ c, r }, { c, r: r + 1 }];
  setMachine(g, 'c64', 1);
  assert.ok(!g.rocks.set.has(cellKey(c, r)));
  assert.ok(!g.rocks.set.has(cellKey(g.plankton.c, g.plankton.r)));
  assert.notEqual(g.rocks.set.size, before);
  assert.equal(g.rocks.cells.length, g.rocks.set.size);
  assert.ok(placePlankton(g, seeded(28)));
});

test('grid: at every mood density, every open cell stays reachable and thinning only removes rocks', () => {
  for (let n = 0; n < PATTERNS.length * 3; n += 1) {
    for (const id of MACHINE_IDS) {
      const full = rocksFor(n, id, 1);
      for (let d = 0; d <= 1.0001; d += 0.01) {
        const rocks = rocksFor(n, id, d);
        const water = reachable(rocks.set);
        assert.equal(water.size, COLS * ROWS - rocks.set.size, `${rocks.pattern} stage ${n} on ${id} at density ${d.toFixed(2)}: no sealed cell`);
        for (const k of rocks.set) assert.ok(full.set.has(k), 'never a rock the full pattern lacks');
        assert.equal(rocks.cells.length, rocks.set.size);
      }
    }
  }
  // The reported case: the XL nameplate at 0.56 used to seal [2,4] and others.
  const r = rocksFor(3, 'xl', 0.56);
  assert.ok(reachable(r.set).has(cellKey(2, 4)) || r.set.has(cellKey(2, 4)));
});

test('strand: a full turn queue never queues a 180 into the neck', () => {
  const g = createGame({ rng: seeded(30) });
  start(g);
  g.plankton = { c: 0, r: 0 };
  assert.equal(setDirection(g, 'left'), true);
  assert.equal(setDirection(g, 'down'), true);
  assert.equal(setDirection(g, 'right'), false, 'right would reverse the queued left');
  assert.deepEqual(g.queue, ['left', 'down']);
  assert.equal(setDirection(g, 'up'), true, 'up after left is a legal turn and replaces down');
  assert.deepEqual(g.queue, ['left', 'up']);
  // Whatever lands in the queue, the strand never reverses into itself over the next two ticks.
  tick(g, { rng: seeded(33) }); tick(g, { rng: seeded(33) });
  assert.equal(g.phase, 'play');
});

test('strand: switching machines keeps the density the stage was built with', () => {
  for (const stage of [1, 2, 4, 5]) {
    const g = createGame({ stage, density: 0.3, rng: seeded(31) });
    g.strand = [{ c: 11, r: 22 }, { c: 11, r: 23 }];
    const before = new Set(g.rocks.set);
    setMachine(g, 'c64', 1);
    assert.deepEqual([...g.rocks.set].sort(), [...before].sort(), `stage ${stage} (${g.rocks.pattern}) did not change shape`);
    nextStage(g, { density: 0.9, rng: seeded(32) });
    assert.equal(g.density, 0.9);
  }
});

test('simulated run: the autopilot eats a dozen plankton on an open stage and survives a rock stage for a while', () => {
  const rng = seeded(1982);
  const g = createGame({ rng, density: 1 });
  start(g);
  let eaten = 0, ticks = 0, collided = null;
  while (ticks < 1500 && g.phase === 'play') {
    setDirection(g, autoDirection(g));
    for (const e of tick(g, { rng, label: eaten > 6 ? 'FLOW' : 'DAWN' })) {
      if (e.type === 'eat') eaten += 1;
      if (e.type === 'collide') collided = e.with;
      if (e.type === 'clear') { nextStage(g, { density: 0.8, rng }); start(g); }
    }
    ticks += 1;
    assert.equal(new Set(g.strand.map((s) => cellKey(s.c, s.r))).size, g.strand.length, 'the strand never overlaps itself');
    for (const s of g.strand) assert.ok(!g.rocks.set.has(cellKey(s.c, s.r)), 'the strand is never inside a rock');
  }
  assert.ok(eaten >= 12, `ate ${eaten} plankton in ${ticks} ticks (${collided || 'no collision'})`);
  assert.ok(g.stage >= 1, 'cleared the open stage');
  assert.ok(g.score >= 12 * 10);
});
