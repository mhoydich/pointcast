/**
 * Morning Route: the street, the houses and the ride itself.
 *
 * A Paperboy-style route (Atari Games, 1985) on an El Segundo street at
 * 6:45 AM, when PointCast's Morning Edition comes out. Portrait: the street
 * scrolls down the field while the rider moves up it. World position `s`
 * grows along the street; a thing at `s` sits `s - run.s` logical pixels
 * above the rider on screen. Houses line the right side, subscribers' porches
 * lit and non-subscribers dark.
 *
 * Everything here is pure (no DOM, no clock) so tests/morning-route.test.mjs
 * can ride a whole day. The page owns drawing, sound and the mood; it feeds
 * `stepRun` the input and the current moodResponse and maps the events back
 * with MOOD_FOR_EVENT.
 */

export const W = 288;
/** Columns of the street, left to right, in logical pixels. */
export const ROAD = Object.freeze({ l: 12, r: 118, mid: 65 });
export const CURB = Object.freeze({ l: 118, r: 124 });
export const WALK = Object.freeze({ l: 124, r: 148 });
export const LAWN = Object.freeze({ l: 148, r: 210 });
export const PORCH = Object.freeze({ l: 194, r: 210 });
export const HOUSE = Object.freeze({ l: 210, r: 282 });
export const RIDER = Object.freeze({ w: 8, h: 14, minX: 18, maxX: 196, startX: 136 });

export const LOT = 140;
export const HOUSES_PER_DAY = 16;
export const START_RUN = 220;
export const DAY_LENGTH = START_RUN + HOUSES_PER_DAY * LOT + 120;
export const DAYS = Object.freeze(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
export const MIN_SUBS = 8;
export const MAX_SUBS = 12;

export const PAPERS_START = 10;
export const PAPERS_MAX = 20;
export const BUNDLE_PAPERS = 5;
export const RIDERS_START = 3;
export const RIDERS_MAX = 6;

export const PAPER_VX = 170;
export const PAPER_LEAD = 18;
export const PAPER_RANGE = 168;
export const THROW_COOLDOWN = 0.2;

export const BASE_SPEED = 66;
export const THROTTLE = Object.freeze({ min: 0.55, max: 1.5 });
export const STEER_SPEED = 120;
export const CRASH_TIME = 1.2;
export const INVULN = 1.5;
export const AIR_TIME = 0.9;
export const SPAWN_AHEAD = 560;
export const DESPAWN_BEHIND = 160;

export const SCORE = Object.freeze({ porch: 100, mailbox: 250, star: 50, bundle: 10, perfect: 500, perfectPerDay: 100 });

/** The page's mood events, from the brief: porch = paddle, mailbox = brick, crash = loss, a finished day = wave. */
export const MOOD_FOR_EVENT = Object.freeze({ porch: 'paddle', mailbox: 'brick', crash: 'loss', day: 'wave' });

/** What the sim assumes when no moodResponse is passed: a plain PLAY dawn. */
export const NEUTRAL = Object.freeze({ label: 'DAWN', speed: 1, paddle: 1, density: 0.5 });

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Small seeded generator (mulberry32) so a day's street is the same every time. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const dayName = (day) => DAYS[((day % DAYS.length) + DAYS.length) % DAYS.length];

/** The houses for day `day` (0 = the first Monday). Between MIN_SUBS and MAX_SUBS subscribers; the first house always takes the paper. */
export function buildStreet(day) {
  const r = rng(0x6a45 + day * 7919);
  const houses = [];
  for (let i = 0; i < HOUSES_PER_DAY; i += 1) {
    houses.push({ i, b: START_RUN + i * LOT, subscriber: i === 0 || r() < 0.62, style: Math.floor(r() * 4), delivered: null });
  }
  let subs = houses.filter((h) => h.subscriber).length;
  for (let i = HOUSES_PER_DAY - 1; i > 0 && subs < MIN_SUBS; i -= 1) if (!houses[i].subscriber) { houses[i].subscriber = true; subs += 1; }
  for (let i = HOUSES_PER_DAY - 1; i > 0 && subs > MAX_SUBS; i -= 1) if (houses[i].subscriber) { houses[i].subscriber = false; subs -= 1; }
  return houses;
}

/** Grow a rect about its center by `g` (the mood's generosity). */
function grow(r, g) {
  if (g === 1) return r;
  const cx = (r.x0 + r.x1) / 2, cs = (r.s0 + r.s1) / 2, hx = ((r.x1 - r.x0) / 2) * g, hs = ((r.s1 - r.s0) / 2) * g;
  return { x0: cx - hx, x1: cx + hx, s0: cs - hs, s1: cs + hs };
}
export const houseRect = (h) => ({ x0: HOUSE.l, x1: HOUSE.r, s0: h.b + 26, s1: h.b + 122 });
export const porchRect = (h, g = 1) => grow({ x0: PORCH.l, x1: PORCH.r, s0: h.b + 54, s1: h.b + 80 }, g);
export const mailboxRect = (h, g = 1) => (h.subscriber ? grow({ x0: LAWN.l + 3, x1: LAWN.l + 11, s0: h.b + 34, s1: h.b + 42 }, g) : null);
export const drivewayRect = (h) => ({ x0: WALK.r, x1: HOUSE.l, s0: h.b + 4, s1: h.b + 30 });
export const pathRect = (h) => ({ x0: WALK.r, x1: PORCH.l, s0: h.b + 62, s1: h.b + 72 });

export const inRect = (r, x, s) => !!r && x >= r.x0 && x <= r.x1 && s >= r.s0 && s <= r.s1;
export const overlap = (a, b) => !!a && !!b && a.x0 < b.x1 && a.x1 > b.x0 && a.s0 < b.s1 && a.s1 > b.s0;

export function houseAt(run, s) {
  const i = Math.floor((s - START_RUN) / LOT);
  return i >= 0 && i < run.houses.length ? run.houses[i] : null;
}

/** How fast the street goes by. DRIFT slows it below the plain mood speed; RUSH pushes it. */
export function scrollSpeed(day, throttle, response = NEUTRAL) {
  const label = response.label;
  const lean = label === 'DRIFT' ? 0.85 : label === 'RUSH' ? 1.12 : 1;
  return BASE_SPEED * (1 + 0.05 * Math.min(day, 10)) * clamp(throttle, THROTTLE.min, THROTTLE.max) * (response.speed ?? 1) * lean;
}

/** World distance between obstacles. DRIFT widens the gaps; RUSH closes them a little; later days are busier. */
export function obstacleGap(day, response = NEUTRAL) {
  const label = response.label;
  const base = Math.max(96, 176 - 10 * Math.min(day, 8));
  return base * (label === 'DRIFT' ? 1.6 : label === 'RUSH' ? 0.9 : 1);
}

/** World distance between paper bundles. DRIFT is generous. */
export function bundleGap(response = NEUTRAL) {
  return LOT * 2.6 * (response.label === 'DRIFT' ? 0.7 : 1);
}

export function createRun({ day = 0, score = 0, riders = RIDERS_START, papers = PAPERS_START, seed } = {}) {
  return {
    day,
    houses: buildStreet(day),
    r: rng(seed ?? 0x51ed + day * 104729),
    t: 0,
    s: 0,
    x: RIDER.startX,
    speed: 0,
    throttle: 1,
    papers,
    riders,
    score,
    dayScore: 0,
    cool: 0,
    crashT: 0,
    invuln: 0,
    airT: 0,
    pendingOver: false,
    over: false,
    done: false,
    report: null,
    papersOut: [],
    litter: [],
    things: [],
    // The first house comes clear, so the first throw is the first thing to learn.
    nextObstacle: START_RUN + LOT,
    nextBundle: START_RUN + LOT * 1.5,
    nextRamp: START_RUN + LOT,
    reserved: [],
    porches: 0,
    mailboxes: 0,
    misses: 0,
    crashes: 0,
    stars: 0,
    thrown: 0,
    bundles: 0,
  };
}

export const subscriberCount = (run) => run.houses.filter((h) => h.subscriber).length;
export const deliveredCount = (run) => run.houses.filter((h) => h.subscriber && h.delivered).length;

// ---------- things on the street ----------

const SIZE = Object.freeze({
  bin: [8, 8], dog: [12, 10], sprinkler: [4, 4], skater: [8, 12], car: [26, 14], bundle: [12, 8], ramp: [24, 16], star: [7, 7],
});
export const HAZARDS = Object.freeze(['bin', 'dog', 'sprinkler', 'skater', 'car']);

export function sprinklerOn(th, t) {
  const p = (((t + th.phase) % 2.4) + 2.4) % 2.4;
  return p < 1.3;
}

/** The rect that touches the rider, or null. Hazards are a little smaller than their sprites. */
export function hitbox(th, t) {
  if (th.gone) return null;
  if (th.kind === 'sprinkler') return sprinklerOn(th, t) ? { x0: th.x - 22, x1: th.x + 18, s0: th.s - 5, s1: th.s + 5 } : null;
  const [w, h] = SIZE[th.kind];
  const k = HAZARDS.includes(th.kind) ? 0.8 : 1;
  return { x0: th.x - (w / 2) * k, x1: th.x + (w / 2) * k, s0: th.s - (h / 2) * k, s1: th.s + (h / 2) * k };
}

export const riderRect = (run) => ({ x0: run.x - RIDER.w / 2, x1: run.x + RIDER.w / 2, s0: run.s - RIDER.h / 2, s1: run.s + RIDER.h / 2 });

function pick(r, list) { return list[Math.floor(r() * list.length) % list.length]; }

function kindPool(day) {
  if (day <= 0) return ['bin', 'dog', 'sprinkler', 'bin', 'dog', 'skater'];
  if (day === 1) return ['bin', 'dog', 'sprinkler', 'skater', 'car'];
  return ['bin', 'dog', 'sprinkler', 'skater', 'car', 'car', 'skater'];
}

const reservedAt = (run, s) => run.reserved.some((band) => s >= band.s0 && s <= band.s1);

function spawnObstacle(run, s) {
  const r = run.r;
  let kind = pick(r, kindPool(run.day));
  const h = houseAt(run, s);
  if (kind === 'car' && !h) kind = 'bin';
  if (kind === 'sprinkler' && !h) kind = 'dog';
  let th;
  if (kind === 'bin') th = { kind, x: pick(r, [CURB.l - 4, WALK.l + 8, LAWN.l + 26]), s };
  else if (kind === 'dog') th = { kind, x: pick(r, [WALK.l + 10, ROAD.mid + 14, ROAD.l + 26]), s, wag: r() * 6 };
  else if (kind === 'sprinkler') {
    // On the lawn next to the walk, clear of the driveway and the path.
    const at = h.b + pick(r, [48, 92, 112]);
    th = { kind, x: LAWN.l + 8, s: at, phase: r() * 2.4 };
  } else if (kind === 'skater') th = { kind, x: ROAD.l + 16 + r() * (ROAD.r - ROAD.l - 36), s: s + 120, vs: -42, phase: r() * 6 };
  else {
    // A car backs out of the next driveway that is still ahead.
    const lot = s > h.b + 15 ? houseAt(run, h.b + LOT) : h;
    if (!lot) return;
    th = { kind, x: LAWN.r - 22, s: lot.b + 17, state: 'parked', vs: 0 };
  }
  th.x0 = th.x;
  // Keep the bonus ramp lane clear.
  if (th.x < ROAD.mid + 8 && kind !== 'car' && reservedAt(run, th.s)) th.x = th.x0 = WALK.l + 10;
  run.things.push(th);
}

function spawnAhead(run, response) {
  const edge = run.s + SPAWN_AHEAD;
  const lastS = DAY_LENGTH - 220;
  // RUSH lays a short bonus ramp lane in the left lane: a ramp, then stars to catch in the air.
  // Ramps go down first so the obstacles placed after them keep the lane clear.
  while (run.nextRamp < edge && run.nextRamp < lastS - 200) {
    if (response.label === 'RUSH') {
      const s = run.nextRamp, x = ROAD.l + 22;
      run.things.push({ kind: 'ramp', x, s });
      for (let k = 0; k < 4; k += 1) run.things.push({ kind: 'star', x, s: s + 30 + k * 20 });
      run.reserved.push({ s0: s - 30, s1: s + 130 });
      run.nextRamp += 760;
    } else run.nextRamp += 120;
  }
  while (run.nextObstacle < edge && run.nextObstacle < lastS) {
    spawnObstacle(run, run.nextObstacle);
    run.nextObstacle += obstacleGap(run.day, response) * (0.8 + 0.4 * run.r());
  }
  while (run.nextBundle < edge && run.nextBundle < lastS) {
    run.things.push({ kind: 'bundle', x: pick(run.r, [ROAD.mid + 22, WALK.l + 12, ROAD.l + 24]), s: run.nextBundle });
    run.nextBundle += bundleGap(response) * (0.85 + 0.3 * run.r());
  }
}

// ---------- papers ----------

/**
 * Where a paper is now, if it has landed: 'mailbox', 'porch', 'miss' (a
 * non-subscriber's house or porch), 'again' (a house already delivered),
 * 'wall' (a subscriber's wall, no delivery) or 'lawn' (out of range).
 */
export function paperResult(run, p, g = 1) {
  const h = houseAt(run, p.s);
  if (h) {
    if (h.subscriber && inRect(mailboxRect(h, g), p.x, p.s)) return h.delivered ? 'again' : 'mailbox';
    if (inRect(porchRect(h, g), p.x, p.s)) return h.subscriber ? (h.delivered ? 'again' : 'porch') : 'miss';
    if (inRect(houseRect(h), p.x, p.s)) return h.subscriber ? (h.delivered ? 'again' : 'wall') : 'miss';
  }
  if (p.x - p.x0 > PAPER_RANGE || p.x > W - 4) return 'lawn';
  return null;
}

function movePaper(run, p, dt, g) {
  const n = Math.max(1, Math.ceil((PAPER_VX * dt) / 2));
  const sdt = dt / n;
  for (let i = 0; i < n; i += 1) {
    p.x += p.vx * sdt; p.s += p.vs * sdt; p.t += sdt;
    const res = paperResult(run, p, g);
    if (res) return res;
  }
  return null;
}

/** What a paper thrown right now would do, if the rider kept this speed: { result, house }. The autopilot aims with it. */
export function wouldHit(run, g = 1) {
  const p = { x: run.x, x0: run.x, s: run.s, vx: PAPER_VX, vs: run.speed + PAPER_LEAD, t: 0 };
  for (let i = 0; i < 90; i += 1) {
    const result = movePaper(run, p, 1 / 60, g);
    if (result) return { result, house: houseAt(run, p.s) };
  }
  return { result: 'lawn', house: null };
}

function landPaper(run, p, res, ev) {
  const h = houseAt(run, p.s);
  if (res === 'mailbox') { h.delivered = 'mailbox'; run.mailboxes += 1; addScore(run, SCORE.mailbox); ev.push({ type: 'mailbox', house: h.i, x: p.x, s: p.s, points: SCORE.mailbox }); return; }
  if (res === 'porch') { h.delivered = 'porch'; run.porches += 1; addScore(run, SCORE.porch); ev.push({ type: 'porch', house: h.i, x: p.x, s: p.s, points: SCORE.porch }); return; }
  if (res === 'miss') { run.misses += 1; ev.push({ type: 'miss', house: h ? h.i : -1, x: p.x, s: p.s }); }
  else ev.push({ type: 'drop', result: res, x: p.x, s: p.s });
  run.litter.push({ x: Math.min(p.x, W - 6), s: p.s });
  if (run.litter.length > 30) run.litter.shift();
}

function addScore(run, n) { run.score += n; run.dayScore += n; }

// ---------- the step ----------

/**
 * Advance the ride by `dt` seconds.
 *
 * input: { steer: -1..1 (held keys), dx: logical px (drag since last step),
 *          pedal: -1|0|1 (held up/down), dThrottle: number (vertical drag),
 *          hold: bool (a finger is down, so the throttle stays put), throw: bool }
 * ctx:   { response: moodResponse(mood), calm: bool (the CALM dial) }
 *
 * Movement is applied before the throw, so a tap that moves the rider and
 * throws in the same frame throws from the new position. Returns events.
 */
export function stepRun(run, dt, input = {}, ctx = {}) {
  const ev = [];
  if (run.over || run.done) return ev;
  const response = ctx.response || NEUTRAL;
  const calm = !!ctx.calm;
  const g = response.paddle ?? 1;
  run.t += dt;
  if (run.invuln > 0) run.invuln = Math.max(0, run.invuln - dt);
  if (run.airT > 0) run.airT = Math.max(0, run.airT - dt);
  run.cool -= dt;

  if (run.crashT > 0) {
    run.crashT -= dt;
    run.speed = 0;
    if (run.crashT <= 0) {
      run.crashT = 0;
      // A final crash ends the route even if the dial turned to CALM during the tumble.
      if (run.pendingOver) { run.over = true; ev.push({ type: 'over' }); return ev; }
      run.invuln = INVULN;
      ev.push({ type: 'up' });
    }
  } else {
    run.x = clamp(run.x + clamp(input.steer || 0, -1, 1) * STEER_SPEED * dt + (input.dx || 0), RIDER.minX, RIDER.maxX);
    if (input.pedal) run.throttle += input.pedal * 1.6 * dt;
    if (input.dThrottle) run.throttle += input.dThrottle;
    if (!input.pedal && !input.dThrottle && !input.hold) run.throttle += (1 - run.throttle) * Math.min(1, 1.2 * dt);
    run.throttle = clamp(run.throttle, THROTTLE.min, THROTTLE.max);
    const target = scrollSpeed(run.day, run.throttle, response);
    run.speed += (target - run.speed) * Math.min(1, 3 * dt);
  }
  run.s += run.speed * dt;

  if (input.throw && run.crashT <= 0) {
    if (run.papers <= 0) ev.push({ type: 'empty' });
    else if (run.cool <= 0) {
      run.papers -= 1; run.thrown += 1; run.cool = THROW_COOLDOWN;
      run.papersOut.push({ x: run.x, x0: run.x, s: run.s, vx: PAPER_VX, vs: run.speed + PAPER_LEAD, t: 0 });
      ev.push({ type: 'throw', x: run.x, s: run.s, left: run.papers });
    }
  }

  spawnAhead(run, response);

  for (const p of run.papersOut) {
    const res = movePaper(run, p, dt, g);
    if (res) { p.done = true; landPaper(run, p, res, ev); }
  }
  run.papersOut = run.papersOut.filter((p) => !p.done);

  for (const th of run.things) {
    if (th.kind === 'skater') { th.s += th.vs * dt; th.x = th.x0 + Math.sin(run.t * 2 + th.phase) * 10; }
    if (th.kind === 'car') {
      if (th.state === 'parked' && th.s - run.s < 230) { th.state = 'backing'; ev.push({ type: 'honk', x: th.x, s: th.s }); }
      if (th.state === 'backing') { th.x -= 40 * dt; if (th.x <= ROAD.l + 40) th.state = 'away'; }
      if (th.state === 'away') { th.vs = Math.min(150, th.vs + 120 * dt); th.s += th.vs * dt; }
    }
    if (th.kind === 'dog' && !th.arfed && th.s - run.s < 130) { th.arfed = true; ev.push({ type: 'arf', x: th.x, s: th.s }); }
  }
  const me = riderRect(run);
  for (const th of run.things) {
    if (run.crashT > 0) break;
    const hb = hitbox(th, run.t);
    if (!hb || !overlap(me, hb)) continue;
    if (th.kind === 'bundle') {
      th.gone = true;
      const got = Math.min(BUNDLE_PAPERS, PAPERS_MAX - run.papers);
      run.papers += got; run.bundles += 1; addScore(run, SCORE.bundle);
      ev.push({ type: 'bundle', x: th.x, s: th.s, got, left: run.papers });
    } else if (th.kind === 'ramp') {
      if (run.airT <= 0) { run.airT = AIR_TIME; ev.push({ type: 'ramp', x: th.x, s: th.s }); }
    } else if (th.kind === 'star') {
      if (run.airT > 0) { th.gone = true; run.stars += 1; addScore(run, SCORE.star); ev.push({ type: 'star', x: th.x, s: th.s, points: SCORE.star }); }
    } else if (run.airT <= 0 && run.invuln <= 0) {
      th.gone = true;
      run.crashT = CRASH_TIME; run.crashes += 1; run.speed = 0;
      if (!calm) { run.riders -= 1; if (run.riders <= 0) { run.riders = 0; run.pendingOver = true; } }
      ev.push({ type: 'crash', kind: th.kind, x: run.x, s: run.s, final: run.pendingOver });
      break;
    }
  }
  run.things = run.things.filter((th) => !th.gone && th.s > run.s - DESPAWN_BEHIND && th.s < run.s + SPAWN_AHEAD + 400);
  run.litter = run.litter.filter((l) => l.s > run.s - DESPAWN_BEHIND);

  if (run.s >= DAY_LENGTH && run.crashT <= 0 && !run.pendingOver) {
    run.done = true;
    run.report = makeReport(run);
    if (run.report.bonus) addScore(run, run.report.bonus);
    const extra = run.report.perfect && !calm && run.riders < RIDERS_MAX;
    if (extra) run.riders += 1;
    run.report.score = run.score;
    run.report.dayScore = run.dayScore;
    ev.push({ type: 'day', report: run.report, extra });
  }
  return ev;
}

// ---------- the report card ----------

/** A letter for the day: deliveries count most, misses and crashes take a little off. */
export function gradeFor({ subscribers, delivered, misses, crashes }) {
  const ratio = subscribers ? delivered / subscribers : 0;
  if (ratio === 1 && misses === 0 && crashes === 0) return 'A+';
  const pts = ratio * 100 - misses * 4 - crashes * 6;
  if (pts >= 88) return 'A';
  if (pts >= 72) return 'B';
  if (pts >= 55) return 'C';
  return 'D';
}

export function makeReport(run) {
  const subscribers = subscriberCount(run);
  const delivered = deliveredCount(run);
  const perfect = subscribers > 0 && delivered === subscribers;
  const r = {
    day: dayName(run.day),
    week: Math.floor(run.day / DAYS.length) + 1,
    subscribers,
    delivered,
    porches: run.porches,
    mailboxes: run.mailboxes,
    misses: run.misses,
    crashes: run.crashes,
    stars: run.stars,
    thrown: run.thrown,
    perfect,
    bonus: perfect ? SCORE.perfect + SCORE.perfectPerDay * Math.min(run.day, 10) : 0,
    score: run.score,
    dayScore: run.dayScore,
  };
  r.grade = gradeFor(r);
  return r;
}

/** The report card as lines of 3x5 text, at most 34 characters each (the field at scale 2). */
export function reportLines(r) {
  const pad = (label, value) => `${label}${' '.repeat(Math.max(1, 14 - label.length))}${value}`;
  return [
    `${r.day} REPORT`,
    pad('DELIVERED', `${r.delivered}/${r.subscribers}`),
    pad('PORCHES', String(r.porches)),
    pad('MAILBOXES', String(r.mailboxes)),
    pad('MISSES', String(r.misses)),
    pad('CRASHES', String(r.crashes)),
    ...(r.stars ? [pad('STARS', String(r.stars))] : []),
    pad('BONUS', r.bonus ? `+${r.bonus}` : '-'),
    pad('SCORE', String(r.score).padStart(6, '0')),
    pad('GRADE', r.grade),
  ];
}

// ---------- autopilot ----------

const LANES = [WALK.l + 12, ROAD.r - 22, ROAD.mid - 10, LAWN.l + 28, ROAD.l + 14];

/**
 * A rider that keeps to the walk, weaves around trouble, picks up bundles
 * when low and throws when a paper would land. The title screen rides it;
 * the tests ride a whole day with it.
 */
export function autopilot(run, response = NEUTRAL) {
  const input = { steer: 0, pedal: 0, throw: false };
  if (run.crashT > 0 || run.done || run.over) return input;
  const g = response.paddle ?? 1;
  let want = LANES[0];
  const ahead = (th, d) => th.s > run.s - 8 && th.s - run.s < d;
  if (run.papers < 4) {
    const b = run.things.find((th) => th.kind === 'bundle' && ahead(th, 320));
    if (b) want = b.x;
  }
  const ramp = run.things.find((th) => (th.kind === 'ramp' || (th.kind === 'star' && run.airT > 0)) && ahead(th, 260));
  if (ramp) want = ramp.x;
  const blocked = (x) => run.things.some((th) => {
    if (!HAZARDS.includes(th.kind) || !ahead(th, 120)) return false;
    const reach = th.kind === 'sprinkler' ? 30 : th.kind === 'car' ? 26 : 16;
    const cx = th.kind === 'sprinkler' ? th.x - 2 : th.kind === 'car' && th.state === 'backing' ? th.x - 20 : th.x;
    return Math.abs(cx - x) < reach;
  });
  if (blocked(want)) want = [want, ...LANES].find((x) => !blocked(x)) ?? want;
  const d = want - run.x;
  if (Math.abs(d) > 2) input.steer = clamp(d / 24, -1, 1);
  // One paper in the air at a time, or the second lands on a porch the first already reached.
  if (run.papers > 0 && run.cool <= 0 && !run.papersOut.length) {
    const { result, house } = wouldHit(run, g);
    // Aim for the mailbox at every other house; the porch when the mailbox has gone by.
    if (result === 'mailbox') input.throw = true;
    if (result === 'porch' && (house.i % 2 === 1 || run.s > mailboxRect(house, g).s1 - 6)) input.throw = true;
  }
  return input;
}
