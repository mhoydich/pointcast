// Rally watch mode: a spectator re-simulates the ball from the TV's keyframes (10 Hz snapshots + hit events) with the
// TV's own stepBall, so the ball it draws should sit within a ball-radius of the TV's. This pulls stepBall and the court
// constants straight out of src/pages/brick-choir/rally.astro, runs a seeded rally, quantizes keyframes the way
// watchFrame() does, and measures the reconstruction error. It also checks the watch frames fit the relay's 512-byte cap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/pages/brick-choir/rally.astro', import.meta.url), 'utf8');
const stepSrc = src.match(/function stepBall\(b,dt,sim\)\{[\s\S]*?\n\}/)[0];
const constSrc = src.match(/const HW=10[^\n]*;\n/)[0];
const { stepBall } = new Function(`const now=()=>0; const sideOf=z=>z>=0?1:-1; ${constSrc} ${stepSrc}; return { stepBall };`)();

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const STEP = 1 / 120;
const r2 = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;
const state = (b) => [r2(b.x), r2(b.y), r2(b.z), r1(b.vx), r1(b.vy), r1(b.vz), b.bounces];

test('watcher ball stays within a ball-radius of the TV ball', () => {
  const rand = rng(7);
  const tv = { x: 0, y: 3, z: 18, vx: 2, vy: 14, vz: -24, live: true, bounces: 0, netted: false };
  const relaunch = () => { const side = tv.z >= 0 ? 1 : -1; tv.vx = (rand() - 0.5) * 8; tv.vy = 10 + rand() * 8; tv.vz = -side * (18 + rand() * 8); tv.bounces = 0; tv.netted = false; tv.y = Math.max(1.2, tv.y); };
  const truth = []; const keys = [];
  let t = 0, nextHit = 1.3, nextSnap = 0;
  for (let i = 0; i < 120 * 30; i++) {
    t += STEP;
    if (t >= nextHit || (tv.y < 0.01 && tv.bounces >= 2) || tv.netted) { relaunch(); nextHit = t + 1.2 + rand() * 0.4; keys.push({ t, b: state(tv) }); }
    stepBall(tv, STEP, true);
    truth.push([t, tv.x, tv.y, tv.z]);
    if (t >= nextSnap) { nextSnap = t + 0.1; keys.push({ t, b: state(tv) }); }
  }
  keys.sort((a, b) => a.t - b.t);
  let max = 0, sum = 0, n = 0;
  for (const [tt, x, y, z] of truth) {
    if (tt < 0.5) continue;
    let k = null; for (let i = keys.length - 1; i >= 0; i--) if (keys[i].t <= tt) { k = keys[i]; break; }
    const b = { x: k.b[0], y: k.b[1], z: k.b[2], vx: k.b[3], vy: k.b[4], vz: k.b[5], bounces: k.b[6], live: true, netted: false };
    let rem = tt - k.t; while (rem > 1e-9) { const h = Math.min(STEP, rem); stepBall(b, h, true); rem -= h; }
    const e = Math.hypot(b.x - x, b.y - y, b.z - z); max = Math.max(max, e); sum += e; n++;
  }
  assert.ok(sum / n < 0.05, `mean error ${sum / n}`);
  assert.ok(max < 0.62, `max error ${max} should stay under the ball radius`);
});

test('a busy watch frame fits the relay frame cap', () => {
  const hit = [Date.now(), 'h', 3, 88, 1, 2, -12.34, 5.67, -18.9, -12.3, 14.5, 23.4, 0, 1, 27];
  const d = { f: 'w', t: Date.now(), ph: 'play', dm: 0, s: [10, 11], g: [1, 1], r: 27, sv: 3, tn: 2, md: 2, lp: [1, 'kitchen'],
    b: [-12.34, 5.67, -18.9, -12.3, 14.5, 23.4, 1, 1, 27], a: [[-14.5, 21.5], [14.5, 21.5], [-14.5, -21.5], [14.5, -21.5]],
    e: [hit, hit, [Date.now(), 'b', -12.34, -18.9, 1], [Date.now(), 'p', 1, 'double']], o: 'tv' };
  while (JSON.stringify(d).length > 440 && d.e.length) d.e.shift(); // watchFrame()'s own trim
  const wire = JSON.stringify({ v: 1, type: 'party', d });
  assert.ok(new TextEncoder().encode(wire).byteLength <= 512, `${wire.length} bytes`);
  assert.ok(d.e.length >= 1, 'at least one event survives the trim');
});

test('watch route and TV corner QR are wired', () => {
  assert.match(src, /\/brick-choir\/watch\/\$\{ROOM\}/);
  const fn = readFileSync(new URL('../functions/brick-choir/watch/[code].ts', import.meta.url), 'utf8');
  assert.match(fn, /\^\[A-Z\]\{4\}\$/);
  assert.match(fn, /noindex/);
});
