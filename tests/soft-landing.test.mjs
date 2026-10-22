import test from 'node:test';
import assert from 'node:assert/strict';
import { LANDER, FUEL_START, DEFAULT_ENV, createLander, stepLander, wrapX, ceiling, speedOf, createBurnTracker } from '../src/lib/soft-landing/physics.mjs';
import { mulberry32, MIN_PAD, PAD_KINDS, RUSH_PAD, generateSkyline, groundAt, padUnder, widestPad } from '../src/lib/soft-landing/skyline.mjs';
import { LIMITS, REASON_TEXT, altitudeOf, touchedDown, judgeLanding, landingScore, descentMarks, envFor, autopilot } from '../src/lib/soft-landing/landing.mjs';
import { createMood, moodEvent, moodResponse, setDial } from '../src/lib/breakwater/mood.mjs';

const W = 288, H = 384, HUD = 32;

test('physics: gravity pulls down, the engine pushes along the lander axis, fuel burns only while thrusting', () => {
  const l = createLander(100, 100, 500);
  stepLander(l, {}, 1, DEFAULT_ENV);
  assert.ok(l.vy > 0 && l.vx === 0 && l.fuel === 500);
  const up = createLander(100, 100, 500);
  for (let i = 0; i < 60; i += 1) stepLander(up, { thrust: true }, 1 / 60, DEFAULT_ENV);
  assert.ok(up.vy < 0, 'the main engine beats gravity');
  assert.ok(up.fuel < 500 && up.fuel > 400, `one second of burn costs about fourteen fuel, left ${up.fuel}`);
  const lean = createLander(100, 100, 500);
  for (let i = 0; i < 30; i += 1) stepLander(lean, { right: true }, 1 / 60, DEFAULT_ENV);
  assert.ok(lean.angle > 0 && lean.angle <= DEFAULT_ENV.maxTilt);
  for (let i = 0; i < 60; i += 1) stepLander(lean, { thrust: true }, 1 / 60, DEFAULT_ENV);
  assert.ok(lean.vx > 0, 'leaning right and burning moves right');
  const dry = createLander(100, 100, 0);
  stepLander(dry, { thrust: true }, 0.1, DEFAULT_ENV);
  assert.equal(dry.burning, false);
  assert.ok(dry.vy > 0, 'an empty tank falls');
  const calm = createLander(100, 100, Infinity);
  stepLander(calm, { thrust: true, left: true }, 1, { ...DEFAULT_ENV, unlimitedFuel: true });
  assert.equal(calm.fuel, Infinity);
  assert.equal(calm.burning, true);
});

test('physics: tilt is capped, the field wraps, the HUD is a ceiling, and wind pushes', () => {
  const l = createLander(100, 100, 500);
  for (let i = 0; i < 600; i += 1) stepLander(l, { left: true }, 1 / 60, DEFAULT_ENV);
  assert.ok(Math.abs(l.angle + DEFAULT_ENV.maxTilt) < 1e-9);
  const w = createLander(-1, 100, 500); wrapX(w, W); assert.equal(w.x, W - 1);
  const w2 = createLander(W + 2, 100, 500); wrapX(w2, W); assert.equal(w2.x, 2);
  const c = createLander(50, HUD - 20, 500); c.vy = -30; ceiling(c, HUD);
  assert.equal(c.y, HUD + LANDER.h / 2); assert.equal(c.vy, 0);
  const windy = createLander(100, 100, 500);
  stepLander(windy, {}, 1, { ...DEFAULT_ENV, wind: -8 });
  assert.ok(windy.vx < 0);
});

test('physics: the burn tracker reports one controlled burn per hold that slowed the lander', () => {
  const t = createBurnTracker();
  const l = createLander(100, 100, 500); l.vy = 40;
  let fired = 0;
  for (let i = 0; i < 60; i += 1) { stepLander(l, { thrust: true }, 1 / 60); if (t.step(l, 1 / 60)) fired += 1; }
  assert.equal(fired, 0, 'nothing fires while the engine is still on');
  stepLander(l, {}, 1 / 60); if (t.step(l, 1 / 60)) fired += 1;
  assert.equal(fired, 1);
  for (let i = 0; i < 30; i += 1) { stepLander(l, {}, 1 / 60); if (t.step(l, 1 / 60)) fired += 1; }
  assert.equal(fired, 1, 'coasting does not fire again');
  // A tap too short to matter does not count.
  const tap = createBurnTracker();
  const q = createLander(100, 100, 500); q.vy = 40;
  stepLander(q, { thrust: true }, 1 / 60); tap.step(q, 1 / 60);
  stepLander(q, { thrust: true }, 1 / 60); tap.step(q, 1 / 60);
  stepLander(q, {}, 1 / 60);
  assert.equal(tap.step(q, 1 / 60), false);
});

test('skyline: seeded, sorted, inside the field, with distinct pads that sit on the ground', () => {
  const a = generateSkyline(7, { width: W, height: H });
  const b = generateSkyline(7, { width: W, height: H });
  assert.deepEqual(a.points, b.points);
  assert.notDeepEqual(a.points, generateSkyline(8, { width: W, height: H }).points);
  for (let seed = 1; seed <= 40; seed += 1) {
    for (const rush of [false, true]) {
      const sky = generateSkyline(seed, { width: W, height: H, rush });
      assert.equal(sky.points[0][0], 0);
      assert.equal(sky.points[sky.points.length - 1][0], W);
      for (let i = 1; i < sky.points.length; i += 1) assert.ok(sky.points[i][0] >= sky.points[i - 1][0], `seed ${seed} sorted`);
      for (const [, y] of sky.points) assert.ok(y >= H * 0.5 && y <= H - 20, `seed ${seed} y ${y} in band`);
      assert.equal(sky.pads.length, rush ? PAD_KINDS.length + 1 : PAD_KINDS.length);
      for (let i = 1; i < sky.pads.length; i += 1) assert.ok(sky.pads[i].x0 >= sky.pads[i - 1].x1 + 4, `seed ${seed} pads apart`);
      for (const pad of sky.pads) {
        assert.ok(pad.x0 >= 0 && pad.x1 <= W);
        assert.equal(groundAt(sky, pad.x0 + 1), pad.y);
        assert.equal(groundAt(sky, pad.x1 - 1), pad.y);
        assert.equal(padUnder(sky, pad.x0, pad.x1), pad);
        assert.equal(padUnder(sky, pad.x0 - 3, pad.x1), null);
        assert.ok(pad.width >= MIN_PAD && pad.width >= LANDER.legSpan, `seed ${seed} pad fits the legs`);
      }
      const mults = sky.pads.map((p) => p.mult).sort();
      assert.deepEqual(mults, (rush ? [...PAD_KINDS, RUSH_PAD] : PAD_KINDS).map((k) => k.mult).sort());
      assert.equal(widestPad(sky).mult, 1);
    }
  }
  const wide = generateSkyline(3, { width: W, height: H, padScale: 1.35 });
  const narrow = generateSkyline(3, { width: W, height: H, padScale: 0.9 });
  assert.ok(wide.pads.every((p, i) => p.width > narrow.pads.find((q) => q.mult === p.mult).width));
  const r = mulberry32(1); const v = r(); assert.ok(v >= 0 && v < 1); assert.notEqual(v, r());
});

test('skyline: a resize rebuilds the same ground, only taller or shorter, so pads keep their x', () => {
  for (const seed of [1, 7, 42, 1979]) {
    for (const opts of [{}, { padScale: 1.35 }, { padScale: 0.9, rush: true }]) {
      const a = generateSkyline(seed, { width: W, height: 384, ...opts });
      const b = generateSkyline(seed, { width: W, height: 480, ...opts });
      assert.deepEqual(a.points.map(([x]) => x), b.points.map(([x]) => x), `seed ${seed} point x`);
      assert.deepEqual(a.pads.map((p) => [p.x0, p.x1, p.mult]), b.pads.map((p) => [p.x0, p.x1, p.mult]), `seed ${seed} pads`);
      for (const [, y] of b.points) assert.ok(y <= 480 - 20 && y >= 480 * 0.5);
    }
  }
});

test('skyline: groundAt interpolates between points and clamps at the edges', () => {
  const sky = { width: 100, points: [[0, 100], [50, 200], [100, 100]], pads: [] };
  assert.equal(groundAt(sky, 25), 150);
  assert.equal(groundAt(sky, 75), 150);
  assert.equal(groundAt(sky, -5), 100);
  assert.equal(groundAt(sky, 500), 100);
});

test('landing: the judgement names every fault and the score follows multiplier, softness and fuel', () => {
  const sky = generateSkyline(11, { width: W, height: H });
  const pad = sky.pads.find((p) => p.mult === 4);
  const l = createLander((pad.x0 + pad.x1) / 2, pad.y - LANDER.h / 2, 800, 2, 6);
  const ok = judgeLanding(l, sky);
  assert.equal(ok.landed, true); assert.equal(ok.soft, true); assert.equal(ok.pad, pad);
  assert.deepEqual(landingScore(ok, l), { points: 4 * 75 + 80, fuelBonus: 80, mult: 4 });
  const firm = { ...l, vy: 20 };
  const j2 = judgeLanding(firm, sky);
  assert.equal(j2.landed, true); assert.equal(j2.soft, false);
  assert.equal(landingScore(j2, firm).points, 4 * 50 + 80);
  const bad = { ...l, vy: 40, vx: 20, angle: 0.5, x: pad.x0 - 20 };
  const j3 = judgeLanding(bad, sky);
  assert.equal(j3.landed, false);
  assert.deepEqual(j3.reasons, ['off-pad', 'fast', 'sideways', 'tilted']);
  for (const r of j3.reasons) assert.ok(REASON_TEXT[r]);
  assert.equal(landingScore(j3, bad).points, 0);
  assert.equal(landingScore(ok, { ...l, fuel: Infinity }).fuelBonus, 0, 'CALM has no fuel bonus to count');
  assert.equal(touchedDown(l, sky), true);
  assert.equal(touchedDown({ ...l, y: l.y - 30 }, sky), false);
  assert.ok(Math.abs(altitudeOf({ ...l, y: l.y - 30 }, sky) - 30) < 1e-9);
});

test('landing: descent marks count each hundred units crossed on the way down only', () => {
  assert.equal(descentMarks(305, 295), 1);
  assert.equal(descentMarks(305, 95), 3);
  assert.equal(descentMarks(95, 50), 0);
  assert.equal(descentMarks(50, 95), 0);
  assert.equal(descentMarks(120, -5), 1);
});

test('landing: the mood sets gravity, pad width, wind and fuel', () => {
  const play = createMood('play');
  const base = envFor(moodResponse(play), 1);
  assert.ok(base.gravity > 14 && base.gravity < 22);
  assert.equal(base.wind, 0);
  assert.equal(base.unlimitedFuel, false);
  moodEvent(play, 'loss'); moodEvent(play, 'loss');
  const drift = envFor(moodResponse(play), 1);
  assert.ok(drift.gravity < base.gravity, 'DRIFT softens gravity');
  assert.ok(drift.padScale > base.padScale, 'DRIFT widens pads');
  const hot = createMood('rush'); hot.energy = 0.9; hot.label = 'RUSH';
  const rush = envFor(moodResponse(hot), -1);
  assert.ok(rush.wind < 0, 'RUSH brings the crosswind');
  assert.equal(rush.rushPad, true);
  assert.ok(rush.padScale < base.padScale);
  const calm = createMood('calm');
  assert.equal(envFor(moodResponse(calm)).unlimitedFuel, true);
  assert.equal(FUEL_START.calm, Infinity);
  assert.ok(FUEL_START.rush < FUEL_START.play);
  setDial(calm, 'play');
  assert.equal(envFor(moodResponse(calm)).unlimitedFuel, false);
});

function fly(seed, env, { pad, maxSeconds = 90, fuel = FUEL_START.play } = {}) {
  const sky = generateSkyline(seed, { width: W, height: H, padScale: env.padScale ?? 1, rush: !!env.rushPad });
  const target = pad ? sky.pads.find((p) => p.mult === pad) : widestPad(sky);
  const l = createLander(40, HUD + 30, fuel, 12, 0);
  let alt = altitudeOf(l, sky), marks = 0, burns = 0;
  const tracker = createBurnTracker();
  const dt = 1 / 60;
  for (let t = 0; t < maxSeconds; t += dt) {
    const input = autopilot(l, sky, env, target);
    stepLander(l, input, dt, env); wrapX(l, W); ceiling(l, HUD);
    if (tracker.step(l, dt)) burns += 1;
    const next = altitudeOf(l, sky);
    marks += descentMarks(alt, next); alt = next;
    if (touchedDown(l, sky)) return { sky, l, judgement: judgeLanding(l, sky), marks, burns, t, target };
  }
  return { sky, l, judgement: null, marks, burns, t: maxSeconds, target };
}

test('descent: the autopilot lands softly on every seed, counts its descent, and scores', () => {
  const env = envFor(moodResponse(createMood('play')));
  for (let seed = 1; seed <= 24; seed += 1) {
    const run = fly(seed, env);
    assert.ok(run.judgement, `seed ${seed} touched down`);
    assert.ok(run.judgement.landed, `seed ${seed} landed, got ${run.judgement.reasons} vy ${run.l.vy.toFixed(1)} vx ${run.l.vx.toFixed(1)} a ${run.l.angle.toFixed(2)}`);
    assert.equal(run.judgement.pad, run.target);
    assert.ok(run.l.fuel < FUEL_START.play && run.l.fuel > 0, `seed ${seed} used some fuel, left ${run.l.fuel}`);
    assert.ok(run.marks >= 1, `seed ${seed} descended at least a hundred units`);
    assert.ok(landingScore(run.judgement, run.l).points > 50);
  }
});

test('descent: the narrow pads, a crosswind and soft gravity can all be landed; a free fall crashes', () => {
  const play = envFor(moodResponse(createMood('play')));
  for (const mult of [2, 4]) {
    const run = fly(5, play, { pad: mult });
    assert.ok(run.judgement?.landed, `pad x${mult}: ${run.judgement?.reasons}`);
    assert.equal(run.judgement.pad.mult, mult);
  }
  const hot = createMood('rush'); hot.energy = 0.85; hot.label = 'RUSH';
  const rush = envFor(moodResponse(hot), 1);
  assert.ok(rush.wind > 0);
  const windy = fly(9, rush, { pad: 4 });
  assert.ok(windy.judgement?.landed, `x4 pad in a crosswind: ${windy.judgement?.reasons} vx ${windy.l.vx.toFixed(1)}`);
  const sliver = fly(9, envFor(moodResponse(hot), 0), { pad: 5 });
  assert.ok(sliver.judgement?.landed, `the five-times sliver: ${sliver.judgement?.reasons}`);
  assert.equal(sliver.judgement.pad.width, MIN_PAD);
  const m = createMood('play'); moodEvent(m, 'loss'); moodEvent(m, 'loss');
  const drift = fly(13, envFor(moodResponse(m)));
  assert.ok(drift.judgement?.landed);
  const calm = fly(2, envFor(moodResponse(createMood('calm'))), { fuel: Infinity });
  assert.ok(calm.judgement?.landed);
  assert.equal(calm.l.fuel, Infinity);
  // Hands off: the lander falls and hits whatever is below it too fast.
  const sky = generateSkyline(4, { width: W, height: H });
  const l = createLander(40, HUD + 30, 1000, 12, 0);
  let crashed = null;
  for (let t = 0; t < 60 && !crashed; t += 1 / 60) { stepLander(l, {}, 1 / 60, play); wrapX(l, W); if (touchedDown(l, sky)) crashed = judgeLanding(l, sky); }
  assert.ok(crashed && !crashed.landed && crashed.reasons.includes('fast'));
  assert.ok(speedOf(l) > LIMITS.vy);
});
