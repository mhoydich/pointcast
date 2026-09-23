import test from 'node:test';
import assert from 'node:assert/strict';
import { createSkyward, resumeSkyward, pauseSkyward, resizeSkyward, stepSkyward, MAX_STEP } from '../src/lib/ghost-town-skyward.mjs';

const playing = () => { const s = createSkyward(800, 420, () => 0.5); resumeSkyward(s); return s; };
const collect = s => { s.orbs = [{ id: 0, x: s.x, y: s.height - 57 }]; stepSkyward(s, 0.01); };

test('ready and paused skies do not move or spawn', () => {
  const s = createSkyward(); stepSkyward(s, 1, 1); assert.equal(s.time, 0);
  resumeSkyward(s); stepSkyward(s, 0.05, 1); pauseSkyward(s);
  const x = s.x, time = s.time; stepSkyward(s, 0.05, -1);
  assert.equal(s.x, x); assert.equal(s.time, time);
});
test('movement is frame independent and capped after a stalled frame', () => {
  const a = playing(), b = playing();
  for (let i = 0; i < 8; i++) stepSkyward(a, 1 / 30, 1);
  for (let i = 0; i < 32; i++) stepSkyward(b, 1 / 120, 1);
  assert.ok(Math.abs(a.x - b.x) < 0.00001);
  const c = playing(); stepSkyward(c, 100, 1);
  assert.equal(c.time, MAX_STEP); assert.ok(c.x < 430);
});
test('pointer targets and keyboard motion stay inside the canvas', () => {
  const s = playing();
  for (let i = 0; i < 100; i++) stepSkyward(s, 0.05, 0, -100);
  assert.equal(s.x, 22);
  for (let i = 0; i < 100; i++) stepSkyward(s, 0.05, 1);
  assert.equal(s.x, 778);
});
test('seven catches reveal each sky and twenty-one finish without extra catches', () => {
  const s = playing();
  for (let i = 0; i < 7; i++) collect(s);
  assert.equal(s.stage, 1); assert.equal(s.lights, 0); assert.equal(s.total, 7);
  for (let i = 0; i < 14; i++) collect(s);
  assert.equal(s.phase, 'complete'); assert.equal(s.stage, 2); assert.equal(s.lights, 7);
  assert.equal(s.total, 21); resumeSkyward(s); collect(s); assert.equal(s.total, 21);
});
test('missed lights leave quietly and new lights keep arriving', () => {
  const s = playing(); s.orbs = [{ id: 4, x: 28, y: 450 }]; stepSkyward(s, 0.05);
  assert.equal(s.orbs.length, 0); assert.equal(s.lights, 0); assert.equal(s.phase, 'playing');
  for (let i = 0; i < 20; i++) stepSkyward(s, 0.05);
  assert.ok(s.orbs.length > 0);
});
test('resize preserves relative positions and invalid time cannot corrupt state', () => {
  const s = playing(); s.orbs = [{ id: 0, x: 200, y: 100 }]; resizeSkyward(s, 400, 300);
  assert.equal(s.x, 200); assert.equal(s.orbs[0].x, 100);
  assert.ok(Math.abs(s.orbs[0].y - 100 * 300 / 420) < 0.00001);
  for (const dt of [NaN, Infinity, -1, 0]) stepSkyward(s, dt, 1);
  assert.equal(s.x, 200); assert.equal(s.time, 0);
});
