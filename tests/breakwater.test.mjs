import test from 'node:test';
import assert from 'node:assert/strict';
import { GLYPHS, GLYPH_W, GLYPH_H, textWidth, pixelsOf } from '../src/lib/breakwater/font.mjs';
import { COLS, ROWS, MACHINES, MACHINE_IDS, PATTERNS, buildWave, patternCells, speedStepsFor, BAND_POINTS, ROW_BAND } from '../src/lib/breakwater/waves.mjs';
import { LABELS, DIALS, createMood, moodEvent, moodStep, moodResponse, setDial, serializeMood, restoreMood, dialFromSiteMood, siteMoodFromLabel } from '../src/lib/breakwater/mood.mjs';

test('font: every glyph is 3x5 and only uses 0/1', () => {
  for (const [ch, rows] of Object.entries(GLYPHS)) {
    assert.equal(rows.length, GLYPH_H, `${ch} rows`);
    for (const row of rows) assert.match(row, new RegExp(`^[01]{${GLYPH_W}}$`), `${ch} row ${row}`);
  }
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .:-+*"/!?') assert.ok(GLYPHS[ch], `glyph ${ch}`);
});

test('font: width and pixel placement scale', () => {
  assert.equal(textWidth('AB', 1), 7);
  assert.equal(textWidth('AB', 2), 14);
  assert.equal(textWidth('', 3), 0);
  const px = pixelsOf('I', 10, 20, 2);
  assert.ok(px.some(([x, y]) => x === 10 && y === 20));
  assert.ok(px.some(([x, y]) => x === 14 && y === 20));
  assert.ok(px.every(([x, y]) => x >= 10 && x <= 14 && y >= 20 && y <= 28));
});

test('waves: both machines carry a full palette', () => {
  assert.deepEqual(MACHINE_IDS, ['xl', 'c64']);
  for (const m of Object.values(MACHINES)) {
    for (const key of ['field', 'border', 'text', 'dim', 'bright', 'paddle', 'ball']) assert.match(m[key], /^#[0-9a-f]{6}$/, `${m.id} ${key}`);
    for (const band of ['red', 'orange', 'green', 'yellow']) assert.match(m.bands[band], /^#[0-9a-f]{6}$/);
    assert.ok(m.raster.length >= 6);
    assert.ok(m.prompt.startsWith('READY'));
  }
});

test('waves: every pattern fits the grid and has enough bricks to be a wave', () => {
  for (let n = 0; n < PATTERNS.length * 2; n += 1) {
    for (const id of MACHINE_IDS) {
      const wave = buildWave(n, id);
      assert.equal(wave.pattern, PATTERNS[n % PATTERNS.length]);
      assert.ok(wave.total >= 40, `${wave.pattern} on ${id} has ${wave.total} bricks`);
      assert.ok(wave.total <= COLS * ROWS);
      const seen = new Set();
      for (const b of wave.bricks) {
        assert.ok(b.c >= 0 && b.c < COLS && b.r >= 0 && b.r < ROWS);
        assert.equal(b.band, ROW_BAND[b.r]);
        assert.equal(b.points, BAND_POINTS[b.band]);
        assert.ok(!seen.has(`${b.c},${b.r}`), 'no duplicate cells');
        seen.add(`${b.c},${b.r}`);
      }
      assert.equal(wave.points, wave.bricks.reduce((s, b) => s + b.points, 0));
    }
  }
  assert.equal(buildWave(0).total, COLS * ROWS);
  assert.equal(buildWave(0).points, 2 * 14 * (7 + 5 + 3 + 1));
});

test('waves: the nameplate spells each machine', () => {
  const xl = patternCells(PATTERNS.indexOf('nameplate'), 'xl').cells.map(String).join('|');
  const c64 = patternCells(PATTERNS.indexOf('nameplate'), 'c64').cells.map(String).join('|');
  assert.notEqual(xl, c64);
});

test('waves: arcade speed steps', () => {
  assert.equal(speedStepsFor(0, false, false), 0);
  assert.equal(speedStepsFor(4, false, false), 1);
  assert.equal(speedStepsFor(12, false, false), 2);
  assert.equal(speedStepsFor(12, true, true), 4);
});

test('mood: a long rally reaches FLOW then RUSH, losses fall to DRIFT, time recovers', () => {
  const m = createMood('play');
  assert.equal(m.label, 'DAWN');
  // A return trip takes about 2.5 s. One brick per return is a steady rally.
  for (let i = 0; i < 8; i += 1) { moodStep(m, 2.5); moodEvent(m, 'paddle'); moodEvent(m, 'brick'); }
  assert.equal(m.label, 'FLOW');
  // Three bricks per return is a hot one.
  for (let i = 0; i < 12; i += 1) { moodStep(m, 2.5); moodEvent(m, 'paddle'); moodEvent(m, 'brick'); moodEvent(m, 'brick'); moodEvent(m, 'brick'); }
  assert.equal(m.label, 'RUSH');
  assert.equal(m.peak, 'RUSH');
  moodEvent(m, 'loss');
  moodStep(m, 3);
  moodEvent(m, 'loss');
  assert.equal(m.label, 'DRIFT');
  assert.equal(m.streak, 0);
  // DRIFT has to last long enough to be felt: still there eight seconds on.
  for (let i = 0; i < 8; i += 1) moodStep(m, 1);
  assert.equal(m.label, 'DRIFT');
  for (let i = 0; i < 30; i += 1) { moodStep(m, 1); if (i % 3 === 0) moodEvent(m, 'paddle'); }
  assert.notEqual(m.label, 'DRIFT');
  assert.ok(m.tape.length >= 9, 'tape samples every two seconds');
});

test('mood: energy relaxes toward the dial baseline and never exceeds the cap', () => {
  const calm = createMood('calm');
  for (let i = 0; i < 60; i += 1) moodEvent(calm, 'brick');
  assert.ok(calm.energy <= DIALS.calm.cap + 1e-9);
  const hot = createMood('rush');
  hot.energy = 1;
  for (let i = 0; i < 40; i += 1) moodStep(hot, 1);
  assert.ok(Math.abs(hot.energy - DIALS.rush.baseline) < 0.05);
  setDial(hot, 'calm');
  assert.ok(hot.energy <= DIALS.calm.cap);
  setDial(hot, 'nonsense');
  assert.equal(hot.dial, 'calm');
});

test('mood: the response is bounded and DRIFT widens and slows', () => {
  const m = createMood('play');
  const base = moodResponse(m);
  assert.ok(base.speed >= 0.84 && base.speed <= 1.2);
  assert.ok(base.tempo >= 92 && base.tempo <= 162);
  assert.equal(base.unlimitedBalls, false);
  moodEvent(m, 'loss'); moodEvent(m, 'loss');
  const drift = moodResponse(m);
  assert.equal(drift.label, 'DRIFT');
  assert.ok(drift.speed <= 0.9);
  assert.ok(drift.paddle > base.paddle);
  assert.equal(drift.scale, 'soft');
  assert.equal(moodResponse(createMood('calm')).unlimitedBalls, true);
});

test('mood: serialize and restore round trip pulls most of the way back', () => {
  const m = createMood('rush');
  for (let i = 0; i < 30; i += 1) { moodEvent(m, 'paddle'); moodEvent(m, 'brick'); }
  const saved = JSON.parse(JSON.stringify(serializeMood(m)));
  assert.equal(saved.dial, 'rush');
  assert.ok(saved.tape.length <= 120);
  const back = restoreMood(saved);
  assert.equal(back.dial, 'rush');
  assert.ok(back.energy > DIALS.rush.baseline);
  assert.ok(back.energy <= 1);
  const forced = restoreMood(saved, 'calm');
  assert.equal(forced.dial, 'calm');
  assert.ok(forced.energy <= DIALS.calm.cap);
  const fresh = restoreMood(null);
  assert.equal(fresh.dial, 'play');
  const junk = restoreMood({ dial: 'x', energy: 'no', tape: [9, -1, 1, 'a'] });
  assert.deepEqual(junk.tape, [1]);
});

test('mood: the town mood maps both ways', () => {
  assert.equal(dialFromSiteMood('chill'), 'calm');
  assert.equal(dialFromSiteMood('quiet'), 'calm');
  assert.equal(dialFromSiteMood('hype'), 'rush');
  assert.equal(dialFromSiteMood('focus'), 'play');
  assert.equal(dialFromSiteMood(null), 'play');
  for (const label of LABELS) assert.ok(['chill', 'flow', 'hype', 'quiet'].includes(siteMoodFromLabel(label)));
});
