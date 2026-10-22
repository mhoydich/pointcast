import test from 'node:test';
import assert from 'node:assert/strict';
import { FIELD, SEGMENTS, SEGMENT_ANGLES, segmentOf, returnAngle, createBall, normalize, deflect, stepBall, predictX } from '../src/lib/tideline/physics.mjs';
import { WIN_SCORE, SPEED, createMatch, rallySpeed, awardPoint, serverFor, houseSkill, houseTraits, createHouse, stepHouse, scoreDigits } from '../src/lib/tideline/rules.mjs';
import { createMood, moodEvent, moodStep, moodResponse, setDial } from '../src/lib/breakwater/mood.mjs';

const geom = (over = {}) => ({
  W: FIELD.W, H: FIELD.H_MIN, WALL: FIELD.WALL, HUD: FIELD.HUD, BALL: FIELD.BALL, PADDLE_H: FIELD.PADDLE_H,
  youX: FIELD.W / 2, youW: FIELD.PADDLE_W, youY: FIELD.H_MIN - FIELD.YOU_INSET,
  houseX: FIELD.W / 2, houseW: FIELD.PADDLE_W, houseY: FIELD.HOUSE_Y,
  ...over,
});

test('field: the same 288 logical width as Breakwater, house above, you below', () => {
  assert.equal(FIELD.W, 288);
  assert.ok(FIELD.HOUSE_Y > FIELD.HUD);
  assert.ok(FIELD.H_MIN - FIELD.YOU_INSET > FIELD.HOUSE_Y + 200);
});

test('segments: eight across the paddle, steep in the middle, flat at the edges, symmetric', () => {
  assert.equal(SEGMENTS, 8);
  assert.equal(SEGMENT_ANGLES.length, 8);
  assert.equal(segmentOf(-1), 0);
  assert.equal(segmentOf(1), 7);
  assert.equal(segmentOf(-0.01), 3);
  assert.equal(segmentOf(0.01), 4);
  assert.equal(segmentOf(-5), 0, 'clamped');
  for (let i = 0; i < 4; i += 1) assert.equal(SEGMENT_ANGLES[i], -SEGMENT_ANGLES[7 - i]);
  assert.ok(Math.abs(returnAngle(0.01)) < Math.abs(returnAngle(0.99)));
  assert.ok(Math.abs(returnAngle(0.99)) < Math.PI / 3 + 1e-9, 'never flatter than 60 degrees off vertical');
});

test('ball: normalize keeps speed and a vertical floor; deflect sends it away from the paddle', () => {
  const b = createBall(100, 100, 1, 0.01, 200);
  normalize(b);
  assert.ok(Math.abs(Math.hypot(b.vx, b.vy) - 200) < 1e-6);
  assert.ok(Math.abs(b.vy) >= 0.34 * 200 - 1e-6, 'no flat shots');
  const seg = deflect(b, 100, 32, -1);
  assert.ok(b.vy < 0);
  assert.ok(seg >= 3 && seg <= 4, 'center hit');
  deflect(b, 100 - 20, 32, 1);
  assert.ok(b.vy > 0 && b.vx > 0, 'hit on the right edge of a paddle goes right and down');
});

test('ball: side walls reflect, the house line and your line both return, out events fire', () => {
  const g = geom();
  const b = createBall(FIELD.WALL + 1, 200, -100, -100, 141);
  const ev = stepBall(b, g, 0.05);
  assert.ok(ev.includes('wall'));
  assert.ok(b.vx > 0);
  const down = createBall(g.youX, g.youY - 20, 0, 1, 160);
  const evs = [];
  for (let i = 0; i < 30 && !evs.includes('you'); i += 1) evs.push(...stepBall(down, g, 1 / 60));
  assert.ok(evs.includes('you'));
  assert.ok(down.vy < 0 && down.volleys === 1);
  const miss = createBall(FIELD.WALL + 2, g.youY - 10, 0, 1, 160);
  const out = [];
  for (let i = 0; i < 120 && !out.includes('outBottom'); i += 1) out.push(...stepBall(miss, geom({ youX: FIELD.W - 40 }), 1 / 60));
  assert.ok(out.includes('outBottom'));
  assert.ok(!out.includes('you'));
  const up = createBall(g.houseX, g.houseY + 30, 0, -1, 160);
  const upEv = [];
  for (let i = 0; i < 30 && !upEv.includes('house'); i += 1) upEv.push(...stepBall(up, g, 1 / 60));
  assert.ok(upEv.includes('house'));
  assert.ok(up.vy > 0);
  const past = createBall(FIELD.WALL + 2, g.houseY + 10, 0, -1, 160);
  const top = [];
  for (let i = 0; i < 120 && !top.includes('outTop'); i += 1) top.push(...stepBall(past, geom({ houseX: FIELD.W - 40 }), 1 / 60));
  assert.ok(top.includes('outTop'));
});

test('predictX: folds wall bounces and returns null when the ball goes the other way', () => {
  const g = geom();
  const straight = createBall(100, 200, 0, -100, 100);
  assert.ok(Math.abs(predictX(straight, g.houseY, g) - 102) < 1e-6, 'center of the ball');
  const away = createBall(100, 200, 0, 100, 100);
  assert.equal(predictX(away, g.houseY, g), null);
  // Aim at the left wall and confirm the prediction stays inside the field.
  const bounce = createBall(20, 300, -200, -100, 224);
  const px = predictX(bounce, g.houseY, g);
  assert.ok(px >= g.WALL && px <= g.W - g.WALL);
  // And matches the simulation.
  const sim = createBall(20, 300, -200, -100, 224);
  let crossed = null;
  for (let i = 0; i < 2400 && crossed == null; i += 1) {
    const before = sim.y;
    stepBall(sim, geom({ houseX: -999 }), 1 / 240);
    if (before > g.houseY && sim.y <= g.houseY) crossed = sim.x + FIELD.BALL / 2;
  }
  assert.ok(crossed != null);
  assert.ok(Math.abs(crossed - px) < 4, `predicted ${px} simulated ${crossed}`);
});

test('rules: rally to 11, serve alternates, speed climbs with volleys and resets on a point', () => {
  assert.equal(WIN_SCORE, 11);
  const m = createMatch();
  assert.equal(serverFor(m), 'you');
  awardPoint(m, 'you', 7);
  assert.equal(m.you, 1);
  assert.equal(serverFor(m), 'house');
  awardPoint(m, 'house', 3);
  assert.equal(serverFor(m), 'you');
  assert.equal(m.longest, 7);
  for (let i = 0; i < 10; i += 1) awardPoint(m, 'you');
  assert.equal(m.over, true);
  assert.equal(m.winner, 'you');
  assert.equal(m.you, 11);
  awardPoint(m, 'house');
  assert.equal(m.house, 1, 'no points after the game is over');
  assert.equal(rallySpeed(0), SPEED.base);
  assert.ok(rallySpeed(5) > rallySpeed(1));
  assert.equal(rallySpeed(1000), SPEED.max);
});

test('rules: CALM never ends a game and the digits keep counting', () => {
  const m = createMatch({ unlimited: true });
  for (let i = 0; i < 40; i += 1) awardPoint(m, i % 3 ? 'you' : 'house');
  assert.equal(m.over, false);
  assert.equal(m.you + m.house, 40);
  assert.equal(scoreDigits(7), '07');
  assert.equal(scoreDigits(123), '23');
});

test('house: DRIFT eases it, RUSH sharpens it, traits move with skill', () => {
  const m = createMood('play');
  const dawn = houseSkill(moodResponse(m));
  moodEvent(m, 'loss'); moodEvent(m, 'loss');
  const drift = houseSkill(moodResponse(m));
  assert.equal(moodResponse(m).label, 'DRIFT');
  assert.ok(drift < dawn, `drift ${drift} < dawn ${dawn}`);
  const hot = createMood('rush');
  for (let i = 0; i < 12; i += 1) { moodStep(hot, 2.5); moodEvent(hot, 'paddle'); moodEvent(hot, 'brick'); moodEvent(hot, 'brick'); moodEvent(hot, 'brick'); }
  assert.equal(moodResponse(hot).label, 'RUSH');
  const rush = houseSkill(moodResponse(hot));
  assert.ok(rush > dawn);
  assert.ok(rush <= 0.97 && drift >= 0.12);
  const lo = houseTraits(0.2), hi = houseTraits(0.9);
  assert.ok(hi.speed > lo.speed && hi.error < lo.error && hi.reach > lo.reach);
  assert.ok(houseSkill(null) > 0 && houseSkill(null) < 1);
});

test('house: a perfect house tracks the prediction, an eased house arrives late and off', () => {
  const g = geom();
  const ball = createBall(60, 300, 120, -200, 233);
  const sharp = createHouse(g.W / 2);
  const soft = createHouse(g.W / 2);
  for (let i = 0; i < 30; i += 1) {
    const px = predictX(ball, g.houseY, g);
    stepHouse(sharp, ball, px, 1 / 60, 0.97, g, () => 0.5);
    stepHouse(soft, ball, px, 1 / 60, 0.15, g, () => 1);
  }
  const target = predictX(ball, g.houseY, g);
  assert.ok(Math.abs(sharp.x - target) < 2, `sharp ${sharp.x} target ${target}`);
  assert.ok(Math.abs(soft.x - target) > 8, `soft ${soft.x} target ${target}`);
  // Going away: the house drifts back toward center and forgets its aim.
  const away = createBall(60, 100, 0, 200, 200);
  for (let i = 0; i < 240; i += 1) stepHouse(sharp, away, null, 1 / 60, 0.9, g);
  assert.ok(Math.abs(sharp.x - g.W / 2) < 3);
  assert.equal(sharp.aimedFor, null);
});

test('simulated rally: two paddles keep the ball up, speed climbs to the cap, then a miss scores and resets', () => {
  const g = geom();
  const match = createMatch();
  const ball = createBall(g.W / 2, g.youY - 10, 0.3, -1, rallySpeed(0));
  const house = createHouse(g.W / 2);
  let you = 0, hs = 0, frames = 0;
  const dt = 1 / 120;
  while (ball.volleys < 40 && frames < 120 * 120) {
    frames += 1;
    ball.speed = rallySpeed(ball.volleys);
    const px = predictX(ball, g.houseY, g);
    stepHouse(house, ball, px, dt, 0.97, g, () => 0.5);
    g.houseX = house.x;
    // You: track the ball perfectly too.
    const mine = predictX(ball, g.youY, g);
    if (mine != null) g.youX = Math.min(g.W - g.WALL - g.youW / 2, Math.max(g.WALL + g.youW / 2, mine));
    const ev = stepBall(ball, g, dt);
    if (ev.includes('you')) you += 1;
    if (ev.includes('house')) hs += 1;
    assert.ok(!ev.includes('outTop') && !ev.includes('outBottom'), `ball out after ${ball.volleys} volleys at frame ${frames}: ${ev}`);
  }
  assert.equal(ball.volleys, 40);
  assert.ok(you >= 19 && hs >= 19, `you ${you} house ${hs}`);
  assert.equal(ball.speed, SPEED.max, 'forty volleys reach the cap');
  // Now you step aside and the house wins the point; the next serve is the house's, the speed resets.
  g.youX = g.WALL + g.youW / 2;
  let out = null;
  for (let i = 0; i < 120 * 10 && !out; i += 1) {
    ball.speed = rallySpeed(ball.volleys);
    const px = predictX(ball, g.houseY, g);
    stepHouse(house, ball, px, dt, 0.97, g, () => 0.5);
    g.houseX = house.x;
    const ev = stepBall(ball, g, dt);
    if (ev.includes('outBottom')) out = 'house';
    if (ev.includes('outTop')) out = 'you';
  }
  assert.equal(out, 'house');
  awardPoint(match, out, ball.volleys);
  assert.equal(match.house, 1);
  assert.ok(match.longest >= 40, 'the house may have touched it once more on the way out');
  assert.equal(serverFor(match), 'house');
  const fresh = createBall(g.W / 2, g.houseY + 10, 0, 1, rallySpeed(0));
  assert.equal(fresh.speed, SPEED.base);
});

test('mood mapping: a Pong rally through the shared model reaches FLOW, a lost point eases to DRIFT, a won game lifts', () => {
  const m = createMood('play');
  // paddle = your return, brick = a won point, loss = a lost point, wave = a won game.
  for (let i = 0; i < 10; i += 1) { moodStep(m, 1.2); moodEvent(m, 'paddle'); }
  assert.equal(m.label, 'FLOW');
  moodEvent(m, 'brick');
  assert.ok(m.energy > 0.45);
  moodEvent(m, 'loss'); moodStep(m, 2); moodEvent(m, 'loss');
  assert.equal(m.label, 'DRIFT');
  assert.ok(houseSkill(moodResponse(m)) < 0.4);
  setDial(m, 'calm');
  assert.equal(moodResponse(m).unlimitedBalls, true);
  const calmBefore = m.calm;
  moodEvent(m, 'wave');
  assert.ok(m.calm > calmBefore, 'a won game lifts calm');
});
