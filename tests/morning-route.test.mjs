import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  W, ROAD, CURB, WALK, LAWN, PORCH, HOUSE, RIDER, LOT, START_RUN, DAY_LENGTH, HOUSES_PER_DAY, DAYS, MIN_SUBS, MAX_SUBS, PAPERS_START, PAPERS_MAX, BUNDLE_PAPERS,
  RIDERS_START, CRASH_TIME, SCORE, MOOD_FOR_EVENT, NEUTRAL, HAZARDS, buildStreet, createRun, stepRun, autopilot, scrollSpeed, obstacleGap, bundleGap,
  porchRect, mailboxRect, houseRect, paperResult, wouldHit, makeReport, reportLines, gradeFor, subscriberCount, deliveredCount, dayName, hitbox, sprinklerOn,
} from '../src/lib/morning-route/route.mjs';
import { paletteFor, promptColors, contrast, mix, eachRect, CHROME, RIDER_SPRITE, PAPER_SPRITE, BUNDLE_SPRITE, BIN_SPRITE, DOG_SPRITES, SPRINKLER_SPRITE, SKATER_SPRITE, CAR_SPRITE, RAMP_SPRITE, mailboxSprite } from '../src/lib/morning-route/sprites.mjs';
import { MACHINE_IDS } from '../src/lib/breakwater/waves.mjs';
import { LABELS, createMood, moodEvent, moodStep, moodResponse, setDial, beginGame, serializeMood } from '../src/lib/breakwater/mood.mjs';
import { readSave, ROW } from '../src/lib/breakwater/row.mjs';
import { GLYPHS, textWidth } from '../src/lib/breakwater/font.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const DT = 1 / 60;
const response = (label, extra = {}) => ({ ...NEUTRAL, label, ...extra });

/** Ride one day with the autopilot, feeding events into a real mood the way the page does. */
function rideDay({ day = 0, dial = 'play', seconds = 120, mood = createMood(dial) } = {}) {
  const run = createRun({ day });
  const counts = {};
  const labels = new Set();
  let t = 0;
  while (!run.done && !run.over && t < seconds) {
    const resp = moodResponse(mood);
    const events = stepRun(run, DT, autopilot(run, resp), { response: resp, calm: dial === 'calm' });
    for (const e of events) {
      counts[e.type] = (counts[e.type] || 0) + 1;
      if (MOOD_FOR_EVENT[e.type]) moodEvent(mood, MOOD_FOR_EVENT[e.type]);
    }
    moodStep(mood, DT);
    labels.add(mood.label);
    t += DT;
    assert.ok(run.papers >= 0 && run.papers <= PAPERS_MAX, 'the bag never goes below empty or above full');
    assert.ok(run.x >= RIDER.minX && run.x <= RIDER.maxX, 'the rider stays on the street');
  }
  return { run, counts, labels, mood, t };
}

test('street: columns run left to right without gaps, and the field is the cabinet width', () => {
  assert.equal(W, 288);
  assert.equal(ROAD.r, CURB.l);
  assert.equal(CURB.r, WALK.l);
  assert.equal(WALK.r, LAWN.l);
  assert.equal(PORCH.r, HOUSE.l);
  assert.ok(HOUSE.r <= W);
  assert.ok(RIDER.maxX < HOUSE.l, 'the rider cannot ride into a house');
  assert.ok(ROAD.l < ROAD.mid && ROAD.mid < ROAD.r);
});

test('street: every day has sixteen houses and between eight and twelve subscribers, the same every time', () => {
  for (let day = 0; day < 21; day += 1) {
    const houses = buildStreet(day);
    assert.equal(houses.length, HOUSES_PER_DAY);
    const subs = houses.filter((h) => h.subscriber).length;
    assert.ok(subs >= MIN_SUBS && subs <= MAX_SUBS, `day ${day}: ${subs} subscribers`);
    assert.ok(houses[0].subscriber, 'the first house always takes the paper');
    assert.deepEqual(buildStreet(day), houses, 'deterministic');
    houses.forEach((h, i) => assert.equal(h.b, START_RUN + i * LOT));
    for (const h of houses) {
      assert.equal(Boolean(mailboxRect(h)), h.subscriber, 'only subscribers have a mailbox');
      const porch = porchRect(h), body = houseRect(h);
      assert.ok(porch.s0 >= h.b && porch.s1 <= h.b + LOT && body.s1 <= h.b + LOT, 'a lot holds its own house');
    }
  }
  assert.ok(DAY_LENGTH > START_RUN + HOUSES_PER_DAY * LOT);
  assert.deepEqual(DAYS.slice(0, 2), ['MONDAY', 'TUESDAY']);
  assert.equal(dayName(7), 'MONDAY');
  assert.equal(dayName(13), 'SUNDAY');
});

test('papers: porch, mailbox, a dark house and the lawn each land as they should', () => {
  const run = createRun({ day: 0 });
  const sub = run.houses.find((h) => h.subscriber);
  const dark = run.houses.find((h) => !h.subscriber);
  const at = (x, s) => paperResult(run, { x, x0: 136, s });
  const pr = porchRect(sub), mb = mailboxRect(sub);
  assert.equal(at((pr.x0 + pr.x1) / 2, (pr.s0 + pr.s1) / 2), 'porch');
  assert.equal(at((mb.x0 + mb.x1) / 2, (mb.s0 + mb.s1) / 2), 'mailbox');
  const dp = porchRect(dark);
  assert.equal(at((dp.x0 + dp.x1) / 2, (dp.s0 + dp.s1) / 2), 'miss', 'a paper on a non-subscriber porch is a miss');
  assert.equal(at(HOUSE.l + 20, dark.b + 100), 'miss', 'or on the house');
  assert.equal(at(HOUSE.l + 20, sub.b + 100), 'wall', 'a subscriber wall is not a delivery');
  assert.equal(paperResult(run, { x: 136 + 200, x0: 136, s: sub.b + 10 }), 'lawn');
  sub.delivered = 'porch';
  assert.equal(at((pr.x0 + pr.x1) / 2, (pr.s0 + pr.s1) / 2), 'again', 'a second paper earns nothing');
  // Generosity grows targets about their centers.
  const wide = porchRect(dark, 1.35);
  assert.ok(wide.s1 - wide.s0 > dp.s1 - dp.s0);
  assert.equal((wide.s0 + wide.s1) / 2, (dp.s0 + dp.s1) / 2);
});

test('throw: a paper flies right at the rider pace, scores once, and the bag runs out', () => {
  const run = createRun({ day: 0, papers: 2 });
  run.nextObstacle = Infinity;
  const sub = run.houses[0];
  // Ride to just before the first porch, then throw when it would land.
  let ev = [];
  for (let i = 0; i < 2000 && !ev.some((e) => e.type === 'porch' || e.type === 'mailbox'); i += 1) {
    const aim = !run.papersOut.length && run.s > sub.b && wouldHit(run).result === 'porch';
    ev = stepRun(run, DT, { throw: aim });
  }
  const hit = ev.find((e) => e.type === 'porch');
  assert.ok(hit, 'the porch took the paper');
  assert.equal(sub.delivered, 'porch');
  assert.equal(run.score, SCORE.porch);
  assert.equal(run.porches, 1);
  assert.equal(run.papers, 1);
  stepRun(run, 0.5, { throw: true });
  assert.equal(run.papers, 0);
  const empty = stepRun(run, 0.5, { throw: true });
  assert.ok(empty.some((e) => e.type === 'empty'), 'an empty bag says so');
  assert.equal(run.papers, 0);
});

test('throw: a tap that moves the rider and throws in the same frame throws from the new position', () => {
  const run = createRun({ day: 0 });
  stepRun(run, DT, {});
  const before = run.x;
  const ev = stepRun(run, DT, { dx: -40, throw: true });
  const thrown = ev.find((e) => e.type === 'throw');
  assert.ok(thrown);
  assert.equal(run.x, before - 40);
  assert.equal(thrown.x, run.x);
  assert.equal(run.papersOut[0].x0, run.x);
  // The move is clamped onto the street before the throw, too.
  const edge = stepRun(run, 0.5, { dx: 1000, throw: true }).find((e) => e.type === 'throw');
  assert.equal(edge.x, RIDER.maxX);
});

test('ride: pedaling speeds up the street, easing off slows it, and it settles back', () => {
  const run = createRun({ day: 0 });
  run.nextObstacle = Infinity;
  for (let i = 0; i < 180; i += 1) stepRun(run, DT, {});
  const cruise = run.speed;
  for (let i = 0; i < 120; i += 1) stepRun(run, DT, { pedal: 1 });
  assert.ok(run.speed > cruise * 1.2, 'up pedals faster');
  for (let i = 0; i < 180; i += 1) stepRun(run, DT, { pedal: -1 });
  assert.ok(run.speed < cruise * 0.8, 'down eases off');
  for (let i = 0; i < 400; i += 1) stepRun(run, DT, {});
  assert.ok(Math.abs(run.speed - cruise) < cruise * 0.05, 'and the throttle returns to cruise');
  // A vertical drag holds while the finger is down.
  stepRun(run, DT, { dThrottle: 0.4, hold: true });
  const held = run.throttle;
  for (let i = 0; i < 60; i += 1) stepRun(run, DT, { hold: true });
  assert.equal(run.throttle, held);
});

test('mood: DRIFT slows the street and widens the gaps; RUSH speeds it; targets follow generosity', () => {
  const dawn = response('DAWN'), drift = response('DRIFT', { speed: 0.9 }), rush = response('RUSH', { speed: 1.15 });
  assert.ok(scrollSpeed(0, 1, drift) < scrollSpeed(0, 1, dawn));
  assert.ok(scrollSpeed(0, 1, rush) > scrollSpeed(0, 1, dawn));
  assert.ok(scrollSpeed(5, 1, dawn) > scrollSpeed(0, 1, dawn), 'later days ride faster');
  assert.ok(obstacleGap(0, drift) > obstacleGap(0, dawn) * 1.4);
  assert.ok(obstacleGap(0, rush) < obstacleGap(0, dawn));
  assert.ok(obstacleGap(8, dawn) < obstacleGap(0, dawn), 'later days are busier');
  assert.ok(bundleGap(drift) < bundleGap(dawn), 'DRIFT brings bundles sooner');
  // The real mood response from the shared model drives the same dials.
  const m = createMood('play');
  moodEvent(m, 'loss'); moodEvent(m, 'loss');
  const r = moodResponse(m);
  assert.equal(r.label, 'DRIFT');
  assert.ok(scrollSpeed(0, 1, r) < scrollSpeed(0, 1, moodResponse(createMood('play'))));
  assert.ok(r.paddle > 1, 'DRIFT is generous with targets');
});

test('mood: only RUSH lays the bonus ramp lane, and the stars only count in the air', () => {
  const calmRun = createRun({ day: 2 });
  for (let i = 0; i < 600; i += 1) stepRun(calmRun, DT, {}, { response: response('DAWN'), calm: true });
  assert.ok(!calmRun.things.some((t) => t.kind === 'ramp'), 'no ramps outside RUSH');
  const rush = createRun({ day: 2 });
  stepRun(rush, DT, {}, { response: response('RUSH') });
  const ramp = rush.things.find((t) => t.kind === 'ramp');
  assert.ok(ramp, 'RUSH lays a ramp');
  const stars = rush.things.filter((t) => t.kind === 'star');
  assert.equal(stars.length, 4);
  assert.ok(stars.every((s) => s.x === ramp.x && s.s > ramp.s));
  assert.ok(!rush.things.some((t) => HAZARDS.includes(t.kind) && t.kind !== 'car' && t.kind !== 'skater' && t.x < ROAD.mid + 8 && t.s > ramp.s - 30 && t.s < ramp.s + 130), 'the ramp lane is kept clear');
  // Ride the ramp lane: the ramp sends the rider up, stars count while airborne.
  rush.x = ramp.x; rush.things = rush.things.filter((t) => t.kind === 'ramp' || t.kind === 'star');
  const events = [];
  for (let i = 0; i < 600 && rush.s < ramp.s + 140; i += 1) events.push(...stepRun(rush, DT, { pedal: 1 }, { response: response('RUSH') }));
  assert.ok(events.some((e) => e.type === 'ramp'));
  assert.ok(rush.stars >= 2, `caught ${rush.stars} stars in the air`);
  assert.equal(rush.score, rush.stars * SCORE.star);
  // On the ground, a star stays put.
  const ground = createRun({ day: 0 });
  ground.things = [{ kind: 'star', x: ground.x, s: 40 }];
  for (let i = 0; i < 120; i += 1) stepRun(ground, DT, {});
  assert.equal(ground.stars, 0);
});

test('crash: a bump costs a rider, the rider gets up, and the last one ends the route', () => {
  const run = createRun({ day: 0, riders: 2 });
  stepRun(run, DT, {});
  run.things = [{ kind: 'dog', x: run.x, x0: run.x, s: run.s + 20 }];
  let ev = [];
  for (let i = 0; i < 120 && !ev.some((e) => e.type === 'crash'); i += 1) ev = stepRun(run, DT, {});
  const c = ev.find((e) => e.type === 'crash');
  assert.ok(c);
  assert.equal(c.kind, 'dog');
  assert.equal(run.riders, 1);
  assert.equal(run.crashes, 1);
  assert.equal(run.speed, 0);
  const s = run.s;
  stepRun(run, 0.3, { dx: 50, throw: true });
  assert.equal(run.s, s, 'the street waits while the rider is down');
  assert.equal(run.papersOut.length, 0, 'no throwing from the ground');
  for (let i = 0; i < CRASH_TIME * 60 + 5; i += 1) stepRun(run, DT, {});
  assert.ok(run.invuln > 0, 'a moment of grace after getting up');
  // The last rider: a final fall ends the route after the tumble.
  run.invuln = 0;
  run.things = [{ kind: 'bin', x: run.x, x0: run.x, s: run.s + 10 }];
  for (let i = 0; i < 60 && !run.pendingOver; i += 1) stepRun(run, DT, {});
  assert.equal(run.riders, 0);
  assert.ok(run.pendingOver);
  assert.ok(!run.over, 'the tumble plays out first');
  for (let i = 0; i < 90 && !run.over; i += 1) stepRun(run, DT, {});
  assert.ok(run.over);
});

test('crash: a final fall ends the route even if the dial turns to CALM during the tumble; CALM itself never ends it', () => {
  const run = createRun({ day: 0, riders: 1 });
  stepRun(run, DT, {});
  run.things = [{ kind: 'bin', x: run.x, x0: run.x, s: run.s + 10 }];
  for (let i = 0; i < 60 && !run.pendingOver; i += 1) stepRun(run, DT, {}, { calm: false });
  assert.ok(run.pendingOver);
  const evs = [];
  for (let i = 0; i < 120 && !run.over; i += 1) evs.push(...stepRun(run, DT, {}, { calm: true }));
  assert.ok(run.over);
  assert.ok(evs.some((e) => e.type === 'over'));

  const calm = createRun({ day: 3, riders: 1 });
  let falls = 0;
  for (let k = 0; k < 6; k += 1) {
    calm.invuln = 0;
    calm.things = [{ kind: 'bin', x: calm.x, x0: calm.x, s: calm.s + 10 }];
    for (let i = 0; i < 200; i += 1) { if (stepRun(calm, DT, {}, { calm: true }).some((e) => e.type === 'crash')) falls += 1; }
  }
  assert.equal(falls, 6);
  assert.equal(calm.riders, 1, 'CALM never counts riders down');
  assert.ok(!calm.over && !calm.pendingOver);
});

test('hazards: sprinklers come and go; the car backs out and drives away; skaters roll toward you', () => {
  const spr = { kind: 'sprinkler', x: LAWN.l + 8, s: 100, phase: 0 };
  assert.ok(sprinklerOn(spr, 0.1) && hitbox(spr, 0.1));
  assert.ok(!sprinklerOn(spr, 2) && hitbox(spr, 2) === null);
  assert.ok(hitbox(spr, 0.1).x0 < WALK.r, 'the spray reaches across the walk');
  const run = createRun({ day: 2 });
  const car = { kind: 'car', x: LAWN.r - 22, x0: LAWN.r - 22, s: 400, state: 'parked', vs: 0 };
  const skater = { kind: 'skater', x: 60, x0: 60, s: 600, vs: -42, phase: 0 };
  run.things = [car, skater];
  run.x = 20;
  const ev = [];
  for (let i = 0; i < 60 * 8 && car.state !== 'away'; i += 1) { ev.push(...stepRun(run, DT, {}, { calm: true })); run.invuln = 99; }
  assert.ok(ev.some((e) => e.type === 'honk'), 'a honk before it moves');
  assert.equal(car.state, 'away');
  assert.ok(car.x < LAWN.l, 'it backed out across the walk');
  assert.ok(skater.s < 600 - 42 * 2);
});

test('simulated play: the autopilot rides a full day on every dial, delivers, and the report card adds up', () => {
  for (const dial of ['calm', 'play', 'rush']) {
    for (const day of [0, 1, 4]) {
      const { run, counts, labels, t } = rideDay({ day, dial });
      assert.ok(run.done, `${dial} day ${day} finished (${t.toFixed(1)} s, over ${run.over})`);
      assert.ok(t > 20 && t < 90, `${dial} day ${day} took ${t.toFixed(1)} s`);
      const subs = subscriberCount(run), got = deliveredCount(run);
      assert.ok(got >= Math.ceil(subs * 0.6), `${dial} day ${day}: ${got}/${subs} delivered`);
      const r = run.report;
      assert.equal(r.delivered, got);
      assert.equal(r.subscribers, subs);
      assert.equal(r.porches + r.mailboxes, got, 'each delivery is a porch or a mailbox');
      assert.equal(r.porches, counts.porch || 0);
      assert.equal(r.mailboxes, counts.mailbox || 0);
      assert.equal(r.crashes, counts.crash || 0);
      const expected = r.porches * SCORE.porch + r.mailboxes * SCORE.mailbox + r.stars * SCORE.star + run.bundles * SCORE.bundle + r.bonus;
      assert.equal(run.score, expected, 'the score is the sum of what happened');
      assert.equal(r.score, run.score);
      assert.ok(['A+', 'A', 'B', 'C', 'D'].includes(r.grade));
      assert.ok(counts.day === 1);
      assert.ok(labels.size >= 1);
      for (const line of reportLines(r)) assert.ok(textWidth(line, 2) <= W - 40, `report line fits: ${line}`);
      if (dial === 'rush') assert.ok(labels.has('RUSH'), 'RUSH reaches RUSH');
    }
  }
});

test('simulated play: a week of PLAY carries score and riders forward, and the mood moves with the ride', () => {
  const mood = createMood('play');
  beginGame(mood);
  let score = 0, riders = RIDERS_START, days = 0;
  const seen = new Set();
  for (let day = 0; day < 7; day += 1) {
    const run = createRun({ day, score, riders });
    for (let i = 0; i < 60 * 120 && !run.done && !run.over; i += 1) {
      const resp = moodResponse(mood);
      for (const e of stepRun(run, DT, autopilot(run, resp), { response: resp })) if (MOOD_FOR_EVENT[e.type]) moodEvent(mood, MOOD_FOR_EVENT[e.type]);
      moodStep(mood, DT);
      seen.add(mood.label);
    }
    assert.ok(run.score >= score, 'score never goes backward');
    score = run.score; riders = run.riders;
    if (run.over) break;
    days += 1;
  }
  assert.ok(days >= 3, `rode ${days} days`);
  assert.ok(seen.has('FLOW'), `porches in a row reach FLOW: ${[...seen]}`);
  const saved = serializeMood(mood);
  const lobby = readSave(JSON.stringify({ best: score, machine: 'xl', dial: 'play', sound: true, crt: true, mood: saved }));
  assert.equal(lobby.best, score, 'the lobby reads the best score');
  assert.ok(lobby.played);
  assert.ok(LABELS.includes(lobby.label));
});

test('report card: grades and lines', () => {
  assert.equal(gradeFor({ subscribers: 10, delivered: 10, misses: 0, crashes: 0 }), 'A+');
  assert.equal(gradeFor({ subscribers: 10, delivered: 10, misses: 1, crashes: 0 }), 'A');
  assert.equal(gradeFor({ subscribers: 10, delivered: 8, misses: 0, crashes: 0 }), 'B');
  assert.equal(gradeFor({ subscribers: 10, delivered: 6, misses: 0, crashes: 0 }), 'C');
  assert.equal(gradeFor({ subscribers: 10, delivered: 2, misses: 3, crashes: 3 }), 'D');
  const run = createRun({ day: 9 });
  for (const h of run.houses) if (h.subscriber) h.delivered = 'porch';
  const r = makeReport(run);
  assert.ok(r.perfect);
  assert.equal(r.day, 'WEDNESDAY');
  assert.equal(r.week, 2);
  assert.equal(r.bonus, SCORE.perfect + SCORE.perfectPerDay * 9);
  const lines = reportLines(r);
  assert.match(lines[0], /WEDNESDAY REPORT/);
  assert.ok(lines.some((l) => /^DELIVERED +\d+\/\d+$/.test(l)));
  assert.ok(lines.every((l) => l.length <= 34));
  for (const l of lines) for (const ch of l) assert.ok(GLYPHS[ch], `glyph for ${ch}`);
});

test('a perfect day earns an extra rider on PLAY, not on CALM', () => {
  for (const calm of [false, true]) {
    const run = createRun({ day: 0, riders: 2 });
    for (const h of run.houses) if (h.subscriber) h.delivered = 'mailbox';
    run.s = DAY_LENGTH - 1;
    run.things = [];
    run.nextObstacle = run.nextBundle = run.nextRamp = Infinity;
    const ev = stepRun(run, 0.1, {}, { calm });
    const day = ev.find((e) => e.type === 'day');
    assert.ok(day);
    assert.equal(day.extra, !calm);
    assert.equal(run.riders, calm ? 2 : 3);
  }
});

test('bundles refill the bag up to the cap', () => {
  const run = createRun({ day: 0, papers: 17 });
  stepRun(run, DT, {});
  run.things = [{ kind: 'bundle', x: run.x, s: run.s + 6 }];
  const ev = [];
  for (let i = 0; i < 30; i += 1) ev.push(...stepRun(run, DT, {}));
  const b = ev.find((e) => e.type === 'bundle');
  assert.ok(b);
  assert.equal(b.got, PAPERS_MAX - 17);
  assert.equal(run.papers, PAPERS_MAX);
  assert.ok(BUNDLE_PAPERS > 0 && PAPERS_START <= PAPERS_MAX);
});

test('mood mapping is the brief: porch = paddle, mailbox = brick, crash = loss, a finished day = wave', () => {
  assert.deepEqual({ ...MOOD_FOR_EVENT }, { porch: 'paddle', mailbox: 'brick', crash: 'loss', day: 'wave' });
  const m = createMood('play');
  setDial(m, 'calm');
  assert.equal(moodResponse(m).unlimitedBalls, true, 'CALM is the dial that never ends the route');
});

test('sprites: rect-only, inside their boxes, and every color key resolves on both machines', () => {
  const sprites = [RIDER_SPRITE, PAPER_SPRITE, BUNDLE_SPRITE, BIN_SPRITE, ...DOG_SPRITES, SPRINKLER_SPRITE, SKATER_SPRITE, CAR_SPRITE, RAMP_SPRITE, mailboxSprite(true), mailboxSprite(false)];
  for (const id of MACHINE_IDS) {
    const pal = paletteFor(id);
    for (const [k, v] of Object.entries(pal)) assert.match(v, /^#[0-9a-f]{6}$/, `${id} ${k}`);
    for (const sp of sprites) {
      for (const r of sp.rects) {
        assert.equal(r.length, 5);
        assert.ok(r[2] > 0 && r[3] > 0);
        assert.ok(r[0] >= -2 && r[0] + r[2] <= sp.w + 2 && r[1] >= -2 && r[1] + r[3] <= sp.h + 2, 'within a pixel or two of the box');
        assert.ok(pal[r[4]], `${id}: color ${r[4]}`);
      }
      let n = 0;
      eachRect(sp, 10, 10, pal, (x, y, w, h, c) => { n += 1; assert.match(c, /^#/); });
      assert.equal(n, sp.rects.length);
    }
  }
  assert.equal(mix('#000000', '#ffffff', 0.5), '#808080');
});

test('contrast: in-field prompts and the toggled-off buttons read at 4.5:1 or better', () => {
  for (const id of MACHINE_IDS) {
    const c = promptColors(id);
    assert.ok(contrast(c.text, c.panel) >= 4.5, `${id} text ${contrast(c.text, c.panel).toFixed(2)}`);
    assert.ok(contrast(c.accent, c.panel) >= 4.5, `${id} accent ${contrast(c.accent, c.panel).toFixed(2)}`);
  }
  assert.ok(contrast(CHROME.buttonOff, CHROME.button) >= 4.5);
  assert.ok(contrast(CHROME.readout, CHROME.bar) >= 4.5);
  const page = fs.readFileSync(path.join(root, 'src/pages/morning-route.astro'), 'utf8');
  assert.ok(page.includes(`button[aria-pressed='false'] { color: ${CHROME.buttonOff}`), 'the page uses the tested color for a toggled-off button');
  assert.ok(page.includes(`background: ${CHROME.button}`));
});

test('page: shared modules imported, not copied; the cabinet save, credits and engineering rules are in place', () => {
  const page = fs.readFileSync(path.join(root, 'src/pages/morning-route.astro'), 'utf8');
  for (const name of ['createMood', 'moodEvent', 'moodStep', 'moodResponse', 'setDial', 'beginGame', 'serializeMood', 'restoreMood', 'dialFromSiteMood', 'siteMoodFromLabel']) assert.ok(page.includes(name), name);
  assert.match(page, /from '\.\.\/lib\/breakwater\/mood\.mjs'/);
  assert.match(page, /from '\.\.\/lib\/breakwater\/font\.mjs'/);
  assert.match(page, /from '\.\.\/lib\/breakwater\/waves\.mjs'/);
  assert.ok(page.includes("'morning-route:v1'"));
  assert.match(page, /best, machine: machineId, dial: mood\.dial, sound: soundOn, crt: crtOn, mood: serializeMood\(mood\)/);
  assert.ok(page.includes('Directed by Michael Hoydich. Designed and built by Claude Code'));
  assert.ok(page.includes('href="/cabinet-row"'));
  assert.ok(page.includes('immersive') && page.includes('isolated'));
  assert.ok(/height: 100vh; height: 100dvh/.test(page), '100vh before 100dvh');
  assert.ok(page.includes('.mr-stage:fullscreen {') && page.includes('.mr-stage:-webkit-full-screen {'), 'separate fullscreen rules');
  assert.ok(!/:fullscreen,|,\s*\.mr-stage:-webkit-full-screen/.test(page), 'never in one selector list');
  assert.ok(page.includes('if (e.detail > 0) el.blur()'));
  assert.ok(page.includes('e.isComposing'));
  assert.ok(page.includes('touch-action: none'));
  assert.ok(page.includes("matchMedia('(pointer: coarse)')"));
  assert.ok(page.includes('webkitRequestFullscreen') && page.includes('webkitExitFullscreen') && page.includes('webkitFullscreenElement'));
  assert.ok(!/fetch\(|new Audio\(|\.mp3|\.wav|\.ogg/.test(page), 'synthesized sound only');
  assert.ok(!/paperboy/i.test(page.split('<script>')[1]), 'no Paperboy names in the game');
  const cab = ROW.find((c) => c.slug === 'morning-route');
  assert.equal(cab.storeKey, 'morning-route:v1');
  assert.ok(fs.existsSync(path.join(root, 'public/images/morning-route/og.png')));
  assert.ok(fs.existsSync(path.join(root, 'public/images/morning-route/cover.svg')));
});

test('catalog and discovery: the cabinet lights and llms.txt gains no line', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/data/game-catalog.json'), 'utf8'));
  const i = catalog.findIndex((g) => g.slug === 'morning-route');
  assert.ok(i >= 0);
  assert.equal(catalog[i + 1].slug, 'breakwater', 'immediately before Breakwater');
  const g = catalog[i];
  assert.equal(g.family, 'Retro arcade');
  assert.equal(g.download.kind, 'local');
  assert.deepEqual(g.download.include, ['/images/morning-route']);
  assert.equal(g.hero, '/images/morning-route/og.png');
  const llms = fs.readFileSync(path.join(root, 'public/llms.txt'), 'utf8');
  const play = llms.split('\n').find((l) => l.startsWith('- [Play](https://pointcast.xyz/play)'));
  assert.ok(play.includes('https://pointcast.xyz/morning-route'));
  for (const f of ['src/pages/agents.json.ts', 'src/pages/for-agents.astro', 'src/pages/sitemap-discovery.xml.ts', 'src/lib/play-layer.ts', 'src/components/FooterBar.astro', 'public/llms-full.txt']) {
    assert.ok(fs.readFileSync(path.join(root, f), 'utf8').includes('morning-route'), f);
  }
});
