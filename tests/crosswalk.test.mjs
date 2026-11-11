import test from 'node:test';
import assert from 'node:assert/strict';
import { W, COLS, CELL, ROWS, ROW_KINDS, START, TOWER_COLS, H, HUD, TIMER_H, H_MAX, ROW_H_MAX, layoutFor, rowY, rowHeight, LANE_ROWS, SAFE_ROWS, LANE_SPECS, VEHICLES, PERIOD, rng, paceForStage, buildLanes, stepLanes, laneAt, onScreen, screenX, vehiclesOverlapping } from '../src/lib/crosswalk/field.mjs';
import { SCORE, LIVES, DIAL_NOTES, trafficFromResponse, createRun, resetCrossing, placeBall, hop, collision, stepRun, loseLife, checkExtraLife, nextStage, cellIsSafe, cellSafeIn } from '../src/lib/crosswalk/rules.mjs';
import { SPRITES, SPRITE_KEYS, spriteCells, eachSpriteCell } from '../src/lib/crosswalk/sprites.mjs';
import { createMood, moodEvent, moodResponse, DIALS, setDial } from '../src/lib/breakwater/mood.mjs';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';

test('field: the strip is Breakwater-wide, eleven rows from water to sidewalk, and fits the logical screen', () => {
  assert.equal(W, 288);
  assert.equal(COLS * CELL, W);
  assert.equal(ROWS, 11);
  assert.equal(ROW_KINDS[0], 'water');
  assert.equal(ROW_KINDS[ROWS - 1], 'sidewalk');
  assert.equal(ROW_KINDS.filter((k) => k === 'lane').length, 7, 'five street lanes and two bike lanes');
  assert.deepEqual(LANE_ROWS, Object.keys(LANE_SPECS).map(Number));
  assert.ok(SAFE_ROWS.includes(4) && ROW_KINDS[4] === 'median');
  assert.equal(START.row, ROWS - 1);
  assert.equal(TOWER_COLS.length, 4);
  for (const c of TOWER_COLS) assert.ok(c >= 0 && c < COLS);
  let y = HUD;
  for (let r = 0; r < ROWS; r += 1) { assert.equal(rowY(r), y); y += rowHeight(r); }
  assert.ok(y < H && H <= 384, `field height ${H}`);
  for (const spec of Object.values(LANE_SPECS)) assert.ok(VEHICLES[spec.kind], `${spec.row} ${spec.kind}`);
});

test('field: a tall screen gets taller lanes, the base layout matches the constants, and the field never shrinks', () => {
  const base = layoutFor(H);
  assert.equal(base.H, H);
  for (let r = 0; r < ROWS; r += 1) { assert.equal(base.rowY(r), rowY(r)); assert.equal(base.rowHeight(r), rowHeight(r)); }
  const nums = (l) => [l.rowH, l.waterH, l.H, l.timerY];
  assert.deepEqual(nums(layoutFor(100)), nums(base), 'a short screen keeps the base field and letterboxes');
  assert.deepEqual(nums(layoutFor(NaN)), nums(base));
  const tall = layoutFor(608);
  assert.ok(tall.rowH > base.rowH && tall.rowH <= ROW_H_MAX);
  assert.ok(tall.H <= 608 && tall.H > H);
  assert.equal(tall.timerY, tall.H - TIMER_H);
  assert.equal(tall.rowY(ROWS - 1) + tall.rowHeight(ROWS - 1), tall.timerY, 'the sidewalk meets the clock');
  assert.equal(layoutFor(5000).H, H_MAX);
  for (let h = H; h < H_MAX + 40; h += 7) { const l = layoutFor(h); assert.ok(l.H <= Math.max(H, h)); }
});

test('field: lanes are reproducible from a seed, wrap on their track, and alternate direction by stage', () => {
  const a = buildLanes(0, 42), b = buildLanes(0, 42), c = buildLanes(0, 43);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.map((l) => l.vehicles.map((v) => v.x)), c.map((l) => l.vehicles.map((v) => v.x)));
  assert.equal(a.length, LANE_ROWS.length);
  for (const lane of a) {
    assert.equal(lane.vehicles.length, lane.slots);
    for (const v of lane.vehicles) { assert.ok(v.x >= 0 && v.x < PERIOD); assert.equal(v.w, VEHICLES[lane.kind].w); }
  }
  const odd = buildLanes(1, 42);
  for (let i = 0; i < a.length; i += 1) assert.equal(odd[i].dir, -a[i].dir);
  const r = rng(7); const seq = [r(), r(), r()]; const r2 = rng(7);
  assert.deepEqual(seq, [r2(), r2(), r2()]);
  for (const v of seq) assert.ok(v >= 0 && v < 1);
});

test('field: stepping keeps vehicles on the track and never switches a slot on screen', () => {
  const lanes = buildLanes(0, 5);
  const before = lanes.map((l) => l.vehicles.map((v) => v.x));
  stepLanes(lanes, 1, { speed: 1, density: 1 });
  lanes.forEach((l, i) => l.vehicles.forEach((v, j) => {
    const expected = (((before[i][j] + l.dir * l.speed) % PERIOD) + PERIOD) % PERIOD;
    assert.ok(Math.abs(v.x - expected) < 1e-9);
  }));
  // Thin the traffic: within a few seconds each lane is down to a minimum of one vehicle, and nothing was switched while visible.
  for (let i = 0; i < 600; i += 1) {
    const visibleBefore = lanes.map((l) => l.vehicles.map((v) => v.active && onScreen(v)));
    stepLanes(lanes, 1 / 60, { speed: 1, density: 0.3 });
    lanes.forEach((l, li) => l.vehicles.forEach((v, vi) => { if (visibleBefore[li][vi]) assert.ok(v.active || !onScreen(v), 'a visible vehicle vanished'); }));
  }
  for (const l of lanes) assert.equal(l.vehicles.filter((v) => v.active).length, Math.max(1, Math.round(l.slots * 0.3)), `${l.name} thinned`);
  for (let i = 0; i < 900; i += 1) stepLanes(lanes, 1 / 60, { speed: 1.5, density: 1 });
  for (const l of lanes) assert.equal(l.vehicles.filter((v) => v.active).length, l.slots, `${l.name} back to full`);
  // A vehicle straddling the seam is found on screen by the overlap test.
  const lane = laneAt(lanes, 9);
  lane.vehicles[0].x = PERIOD - 4; lane.vehicles[0].active = true;
  const sx = screenX(lane.vehicles[0]);
  assert.ok(vehiclesOverlapping(lane, sx + 2, sx + 6).includes(lane.vehicles[0]));
  assert.equal(laneAt(lanes, 4), null);
});

test('pace: stages speed up and shorten the clock, with a floor', () => {
  assert.deepEqual(paceForStage(0), { speed: 1, timer: 30, stage: 0 });
  assert.equal(paceForStage(3).timer, 24);
  assert.ok(paceForStage(3).speed > paceForStage(2).speed);
  assert.equal(paceForStage(20).timer, 18);
});

test('rules: the mood response drives lane speed, traffic density, the clock and the beach ball', () => {
  const m = createMood('play');
  const dawn = trafficFromResponse(moodResponse(m));
  assert.equal(dawn.label, 'DAWN');
  assert.ok(dawn.density > 0.5 && dawn.density <= 1);
  assert.equal(dawn.beachBall, false);
  assert.equal(dawn.timer, 30, 'DAWN keeps the stage clock');
  moodEvent(m, 'loss'); moodEvent(m, 'loss');
  const drift = trafficFromResponse(moodResponse(m));
  assert.equal(drift.label, 'DRIFT');
  assert.ok(drift.density < dawn.density, 'DRIFT thins the traffic');
  assert.ok(drift.speed < dawn.speed, 'DRIFT slows the lanes');
  assert.ok(drift.timer > dawn.timer, 'DRIFT gives more time');
  const hot = createMood('rush');
  for (let i = 0; i < 30; i += 1) { moodEvent(hot, 'paddle'); moodEvent(hot, 'brick'); }
  const rush = trafficFromResponse(moodResponse(hot));
  assert.equal(rush.label, 'RUSH');
  assert.ok(rush.speed > dawn.speed, 'RUSH speeds the lanes');
  assert.ok(rush.timer <= dawn.timer);
  assert.equal(rush.beachBall, true);
  const staged = trafficFromResponse(moodResponse(createMood('play')), paceForStage(2));
  assert.ok(staged.speed > dawn.speed && staged.timer < dawn.timer);
  for (const id of Object.keys(DIALS)) assert.ok(DIAL_NOTES[id], `dial note ${id}`);
  assert.doesNotMatch(Object.values(DIAL_NOTES).join(' '), /ball(s)?\b(?! on the sand)/i, 'no Breakwater ball copy');
});

test('rules: hops score once per new row, lanes cleared are reported, edges and full towers block', () => {
  const run = createRun({ seed: 3 });
  assert.equal(run.lives, LIVES);
  assert.equal(run.timer, 30);
  assert.equal(hop(run, 'down').type, 'blocked');
  assert.equal(hop(run, 'sideways').type, 'blocked');
  let r = hop(run, 'up');
  assert.equal(r.type, 'hop'); assert.equal(r.forward, true); assert.equal(r.laneCleared, false); assert.equal(run.score, SCORE.hop);
  r = hop(run, 'down'); assert.equal(r.forward, false); assert.equal(run.score, SCORE.hop);
  r = hop(run, 'up'); assert.equal(r.forward, false, 'a row already reached does not score again');
  r = hop(run, 'up'); assert.equal(r.forward, true); assert.equal(r.laneCleared, true, 'leaving a lane upward clears it');
  assert.equal(run.score, 2 * SCORE.hop);
  for (let i = 0; i < 20; i += 1) hop(run, 'left');
  assert.equal(run.player.col, 0);
  assert.equal(run.player.facing, 'left');
  // Walk straight up to the water on a tower column.
  resetCrossing(run);
  while (run.player.col > TOWER_COLS[0]) hop(run, 'left');
  while (run.player.row > 1) hop(run, 'up');
  const scoreBefore = run.score;
  run.timer = 12.6;
  r = hop(run, 'up');
  assert.equal(r.type, 'tower'); assert.equal(r.tower, 0); assert.equal(r.seconds, 12); assert.equal(r.filled, false);
  assert.equal(run.score - scoreBefore, SCORE.hop + SCORE.tower + 12 * SCORE.perSecond);
  assert.equal(run.alive, false);
  assert.equal(run.towers[0], true);
  resetCrossing(run);
  while (run.player.col > TOWER_COLS[0]) hop(run, 'left');
  while (run.player.row > 1) hop(run, 'up');
  r = hop(run, 'up');
  assert.equal(r.type, 'blocked'); assert.equal(r.reason, 'full');
  assert.equal(run.player.row, 1);
  // Water between towers is a splash.
  hop(run, 'right');
  r = hop(run, 'up');
  assert.equal(r.type, 'splash');
  assert.equal(run.alive, false);
});

test('rules: filling all four towers pays the stage bonus and the next stage is faster', () => {
  const run = createRun({ seed: 9, stage: 0 });
  let filled = false;
  for (const col of TOWER_COLS) {
    resetCrossing(run);
    while (run.player.col !== col) hop(run, run.player.col < col ? 'right' : 'left');
    while (run.player.row > 1) hop(run, 'up');
    run.timer = 0.2;
    const r = hop(run, 'up');
    assert.equal(r.type, 'tower');
    filled = r.filled;
  }
  assert.equal(filled, true);
  assert.equal(run.stagesCleared, 1);
  assert.ok(run.score >= SCORE.stage + 4 * (SCORE.tower + SCORE.hop * 10));
  const lanesBefore = run.lanes;
  nextStage(run);
  assert.equal(run.stage, 1);
  assert.notEqual(run.lanes, lanesBefore);
  assert.ok(run.towers.every((t) => !t));
  assert.equal(run.timer, 28);
  assert.ok(run.pace.speed > 1);
  assert.equal(run.player.row, START.row);
});

test('rules: the beach ball is picked up on the sand and pays out at a tower', () => {
  const run = createRun({ seed: 11 });
  placeBall(run, false);
  assert.equal(run.ball, null);
  placeBall(run, true, () => 0.99);
  assert.deepEqual(run.ball, { col: COLS - 1, row: 1 });
  placeBall(run, true, () => 0);
  assert.equal(run.ball.col, COLS - 1, 'only one ball at a time');
  while (run.player.col < COLS - 1) hop(run, 'right');
  while (run.player.row > 2) hop(run, 'up');
  const r = hop(run, 'up');
  assert.equal(r.pickedBall, true);
  assert.equal(run.carrying, true);
  assert.equal(run.ball, null);
  placeBall(run, true, () => 0.5);
  assert.equal(run.ball, null, 'no new ball while one is carried');
  hop(run, 'left');
  const before = run.score;
  run.timer = 0;
  const t = hop(run, 'up');
  assert.equal(t.type, 'tower'); assert.equal(t.withBall, true);
  assert.equal(run.score - before, SCORE.hop + SCORE.tower + SCORE.ball);
  assert.equal(run.carrying, false);
});

test('rules: a vehicle on the cell is a hit, the clock runs out, lives and extra lives follow the score', () => {
  const run = createRun({ seed: 2 });
  hop(run, 'up');
  const lane = laneAt(run.lanes, run.player.row);
  for (const v of lane.vehicles) v.active = false;
  assert.equal(collision(run), null);
  assert.deepEqual(stepRun(run, 0.1, { speed: 1, density: 0 }), []);
  assert.ok(run.timer < 30);
  const v = lane.vehicles[0];
  v.active = true; v.x = run.player.col * CELL + 48;
  const events = stepRun(run, 0, { speed: 1, density: 1 });
  assert.equal(events[0]?.type, 'hit');
  assert.equal(events[0].vehicle, v);
  assert.equal(run.alive, false);
  assert.deepEqual(stepRun(run, 1, { speed: 1, density: 1 }), [], 'a dead crossing reports nothing more');
  assert.equal(loseLife(run), false); assert.equal(run.lives, 2);
  assert.equal(loseLife(run), false); assert.equal(loseLife(run), true);
  const calm = createRun({ unlimited: true });
  assert.equal(loseLife(calm), false); assert.equal(calm.lives, Infinity);
  resetCrossing(calm);
  for (const l of calm.lanes) for (const x of l.vehicles) x.active = false;
  const timeout = [];
  for (let i = 0; i < 400 && !timeout.length; i += 1) timeout.push(...stepRun(calm, 0.1, { speed: 1, density: 0 }));
  assert.equal(timeout[0]?.type, 'timeout');
  assert.equal(calm.timer, 0);
  const rich = createRun({});
  rich.score = 4100;
  assert.equal(checkExtraLife(rich), 2);
  assert.equal(rich.lives, LIVES + 2);
  assert.equal(rich.nextExtra, 6000);
  assert.equal(checkExtraLife(calm), 0);
});

test('rules: a simulated crossing that waits for gaps reaches a tower without being hit on every dial', () => {
  for (const dial of ['calm', 'play', 'rush']) {
    const mood = createMood(dial);
    const run = createRun({ seed: 17, unlimited: dial === 'calm' });
    const target = TOWER_COLS[2];
    const traffic = () => trafficFromResponse(moodResponse(mood), run.pace);
    let t = 0, hits = 0, towers = 0, hops = 0;
    const dt = 1 / 60;
    let cool = 0;
    while (t < 240 && towers < 1) {
      const tr = traffic();
      const ev = stepRun(run, dt, tr);
      t += dt; cool -= dt;
      if (ev.some((e) => e.type === 'hit')) { hits += 1; moodEvent(mood, 'loss'); resetCrossing(run, tr.timer); continue; }
      if (ev.some((e) => e.type === 'timeout')) { moodEvent(mood, 'loss'); resetCrossing(run, tr.timer); continue; }
      if (cool > 0) continue;
      const p = run.player;
      const step = (d) => [p.col + (d === 'right' ? 1 : d === 'left' ? -1 : 0), p.row + (d === 'up' ? -1 : d === 'down' ? 1 : 0)];
      // A lane cell is only entered when it stays clear long enough to hop on again.
      const clear = (d) => { const [c, r] = step(d); if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return false; if (r === 0) return TOWER_COLS.includes(c); return ROW_KINDS[r] === 'lane' ? cellSafeIn(run, c, r, 0.8, tr) : cellIsSafe(run, c, r); };
      let dir = p.row === 1 ? (p.col === target ? 'up' : p.col < target ? 'right' : 'left') : 'up';
      if (!clear(dir)) {
        // Standing in traffic with the way ahead blocked: step aside if this cell is about to be hit, else wait.
        if (ROW_KINDS[p.row] === 'lane' && !cellSafeIn(run, p.col, p.row, 0.4, tr)) dir = ['up', 'left', 'right', 'down'].find(clear) || null;
        else dir = null;
      }
      if (!dir) continue;
      const r = hop(run, dir);
      hops += 1; cool = 0.12;
      if (r.type === 'hop' && r.forward) moodEvent(mood, 'paddle');
      if (r.type === 'hop' && r.laneCleared) moodEvent(mood, 'brick');
      if (r.type === 'tower') { towers += 1; moodEvent(mood, 'wave'); }
    }
    assert.equal(towers, 1, `${dial}: reached a tower in ${t.toFixed(1)}s after ${hops} hops and ${hits} hits`);
    assert.equal(hits, 0, `${dial}: a patient crossing is never hit`);
    assert.ok(run.score >= SCORE.hop * (ROWS - 1) + SCORE.tower, `${dial}: scored ${run.score}`);
    assert.ok(mood.label !== 'DRIFT');
  }
});

test('rules: cellIsSafe knows water, towers and lanes', () => {
  const run = createRun({ seed: 1 });
  assert.equal(cellIsSafe(run, 0, 0), false);
  assert.equal(cellIsSafe(run, TOWER_COLS[1], 0), true);
  assert.equal(cellIsSafe(run, 3, 4), true);
  const lane = laneAt(run.lanes, 9);
  for (const v of lane.vehicles) v.active = false;
  assert.equal(cellIsSafe(run, 3, 9), true);
  lane.vehicles[0].active = true; lane.vehicles[0].x = 3 * CELL + 48;
  assert.equal(cellIsSafe(run, 3, 9), false);
});

test('sprites: every picture is 8 rows of known keys, the bus is 16 wide, and flips and turns stay inside the box', () => {
  for (const [name, rows] of Object.entries(SPRITES)) {
    assert.equal(rows.length, 8, name);
    const w = name === 'bus' ? 16 : 8;
    for (const row of rows) { assert.equal(row.length, w, `${name} ${row}`); for (const ch of row) assert.ok(ch === '.' || SPRITE_KEYS.includes(ch), `${name} key ${ch}`); }
    assert.ok(spriteCells(name).length > 8, `${name} has pixels`);
  }
  const plain = spriteCells('car', 0, 0, 1);
  const flipped = spriteCells('car', 0, 0, 1, { flip: true });
  assert.equal(plain.length, flipped.length);
  assert.ok(flipped.every(([x, y]) => x >= 0 && x < 8 && y >= 0 && y < 8));
  assert.ok(plain.some(([x, y, k]) => flipped.some(([fx, fy, fk]) => fx === 7 - x && fy === y && fk === k)));
  const turned = spriteCells('walker', 0, 0, 3, { rot: 1 });
  assert.ok(turned.every(([x, y]) => x >= 0 && x < 24 && y >= 0 && y < 24));
  assert.equal(spriteCells('walker', 0, 0, 1, { rot: 2 }).length, spriteCells('walker').length);
  let calls = 0; eachSpriteCell('nothing-like-this', 0, 0, 1, () => { calls += 1; });
  assert.equal(calls, spriteCells('walker').length, 'unknown names fall back to the walker');
  // Each key the page maps must exist on both machines' palettes.
  for (const m of Object.values(MACHINES)) for (const key of ['field', 'border', 'text', 'dim', 'bright', 'paddle', 'ball']) assert.ok(m[key], `${m.id} ${key}`);
  assert.equal(setDial(createMood('play'), 'calm').dial, 'calm');
});
