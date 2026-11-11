/**
 * Low Tide engine: Kaboom! (Activision, 1981, Larry Kaplan) made gentle.
 *
 * A gull glides along the top of the field dropping shells; a stack of up to
 * three buckets at the bottom catches them. Each wave drops a fixed count,
 * faster than the last, and every catch in a later wave scores more (one
 * point in wave 1 up to eight from wave 8 on, Kaboom's own sliding scale).
 * A shell that reaches the sand is washed away by the tide: the rest of that
 * wave's shells go with it, the bottom bucket is lost, and the gull starts
 * the previous wave again. A bucket comes back every 1000 points.
 *
 * The page owns input, drawing and sound; everything that decides the game
 * lives here so tests/low-tide.test.mjs can play it without a browser.
 * Pure functions plus one mutable state object, no DOM.
 */
export const W = 288;
export const WALL = 8;
export const HUD = 32;
export const H_MIN = 384;
export const H_MAX = 480;

export const GULL_Y = HUD + 10;
export const SHELL_W = 7;
export const SHELL_H = 6;
export const BUCKET_W = 30;
export const BUCKET_H = 8;
export const BUCKET_GAP = 13;
export const MAX_BUCKETS = 3;
export const BUCKET_EVERY = 1000;
export const GOLD_POINTS = 5;

/** Kaboom!'s groups run 10, 20, 30, 40, 50, 75, 100, 150; Low Tide keeps the climb and shortens the sit. */
export const WAVE_COUNTS = Object.freeze([10, 15, 20, 25, 30, 40, 50, 60]);

/** Pixel art, one string per row. Two gull frames (wings up, wings down) and a scallop shell. */
export const GULL = Object.freeze([
  Object.freeze(['1100000000011', '0110000000110', '0011101110100', '0001111111000', '0000111110000', '0000011100000']),
  Object.freeze(['0000000000000', '0000000000000', '0001101110000', '0111111111110', '1100111110011', '0000011100000']),
]);
export const SHELL = Object.freeze(['0011100', '0111110', '1101011', '1111111', '0101010', '0011100']);

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** The fixed shape of wave `n` (0-based): how many shells, what each catch is worth, how fast it all moves. */
export function waveSpec(n) {
  const i = Math.max(0, Math.floor(n));
  return {
    index: i,
    count: WAVE_COUNTS[Math.min(i, WAVE_COUNTS.length - 1)],
    points: Math.min(8, i + 1),
    fall: Math.min(240, 78 + 18 * i),
    interval: Math.max(0.3, 1.02 - 0.09 * i),
    gull: Math.min(200, 62 + 17 * i),
  };
}

/** Points for one catch in wave `n`; a golden shell (RUSH only) is worth five. */
export function catchPoints(n, golden = false) {
  return waveSpec(n).points * (golden ? GOLD_POINTS : 1);
}

/** Top edge of bucket `i` (0 is the top of the stack) on a field `h` tall. */
export function bucketTop(i, h) {
  return h - 60 + i * BUCKET_GAP;
}

/** Where the tide line sits: a shell below it is lost. */
export function sandY(h) {
  return h - 18;
}

/** The note for the `run`-th catch of a wave: a rising pentatonic run that climbs an octave and a half, then rolls over. */
const PENTA = [0, 2, 4, 7, 9];
export function catchNote(run, scale = 'major') {
  const steps = 8;
  const k = ((Math.floor(run) % steps) + steps) % steps;
  const base = scale === 'minor' ? 69 : scale === 'soft' ? 67 : scale === 'bright' ? 74 : 72;
  const minor = [0, 3, 5, 7, 10];
  const set = scale === 'minor' ? minor : PENTA;
  return base + 12 * Math.floor(k / set.length) + set[k % set.length];
}

/** Buckets after the score goes from `before` to `after`: one back for every 1000 crossed, never more than three. */
export function bucketsAfter(before, after, buckets) {
  const crossed = Math.floor(after / BUCKET_EVERY) - Math.floor(before / BUCKET_EVERY);
  return Math.min(MAX_BUCKETS, buckets + Math.max(0, crossed));
}

/** A small seeded generator so a test can replay one exact game. */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A new game. `rng` defaults to Math.random. Phase is 'ready' (the gull
 * waits for a tap), 'drop' (shells falling), 'between' (a clean wave just
 * ended), 'wash' (the tide took a shell) or 'over'.
 */
export function createTide({ height = H_MIN, rng = Math.random } = {}) {
  const s = {
    h: clamp(Math.round(height), H_MIN, H_MAX),
    rng,
    phase: 'ready',
    t: 0,
    wave: 0,
    spec: waveSpec(0),
    dropped: 0,
    caught: 0,
    run: 0,
    clean: true,
    shells: [],
    gull: { x: W / 2, target: W / 2, dir: 1, dropT: 0.4, flap: 0 },
    buckets: MAX_BUCKETS,
    bucketX: W / 2,
    bucketW: BUCKET_W,
    score: 0,
    totalCaught: 0,
    golds: 0,
    misses: 0,
    wavesCleared: 0,
    pendingOver: false,
    over: false,
  };
  return s;
}

/** Start the current wave from the top. */
function openWave(s) {
  s.spec = waveSpec(s.wave);
  s.dropped = 0;
  s.caught = 0;
  s.run = 0;
  s.shells = [];
  s.gull.dropT = 0.5;
  s.phase = 'drop';
  s.t = 0;
}

/** The player's tap: begins a waiting wave. Returns true when it did something. */
export function startWave(s) {
  if (s.phase !== 'ready') return false;
  openWave(s);
  return true;
}

/** Move the buckets to `x` (absolute, like a paddle), clamped to the field. */
export function setBucketX(s, x) {
  const half = s.bucketW / 2;
  s.bucketX = clamp(Number.isFinite(x) ? x : s.bucketX, WALL + half, W - WALL - half);
  return s.bucketX;
}

/** A new field height (rotation, fullscreen). Applies at once and pulls in-flight shells back onto the field. */
export function setHeight(s, height) {
  s.h = clamp(Math.round(height), H_MIN, H_MAX);
  const lowest = bucketTop(0, s.h) - SHELL_H - 2;
  for (const sh of s.shells) {
    sh.y = clamp(sh.y, GULL_Y, lowest);
    sh.x = clamp(sh.x, WALL + SHELL_W / 2, W - WALL - SHELL_W / 2);
  }
  s.gull.x = clamp(s.gull.x, WALL + 8, W - WALL - 8);
  return s;
}

function pickTarget(s) {
  const lo = WALL + 10, hi = W - WALL - 10;
  // Mostly a fresh spot across the field; sometimes a short feint back, the way Kaboom!'s bomber twitches.
  if (s.rng() < 0.25) s.gull.target = clamp(s.gull.x - s.gull.dir * (16 + s.rng() * 30), lo, hi);
  else s.gull.target = lo + s.rng() * (hi - lo);
  s.gull.dir = s.gull.target >= s.gull.x ? 1 : -1;
}

/**
 * Advance `dt` seconds. `opts` carries what the mood asks for:
 *   speed   multiplies fall speed, gull speed and drop rate (moodResponse().speed)
 *   widen   multiplies bucket width (moodResponse().paddle)
 *   rush    the gull flies faster and a golden shell turns up now and then
 *   calm    no bucket is ever lost (the CALM dial)
 * Returns the list of events this step produced.
 */
export function tideStep(s, dt, opts = {}) {
  const ev = [];
  if (s.phase === 'over') return ev;
  const speed = clamp(opts.speed ?? 1, 0.5, 1.6);
  const widen = clamp(opts.widen ?? 1, 0.6, 1.6);
  const rush = !!opts.rush;
  s.t += dt;

  s.bucketW += (BUCKET_W * widen - s.bucketW) * Math.min(1, 3 * dt);
  setBucketX(s, s.bucketX);

  // The gull always glides; it only drops during a wave.
  const g = s.gull;
  const gullSpeed = s.spec.gull * speed * (rush ? 1.35 : 1) * (s.phase === 'drop' ? 1 : 0.5);
  const dx = g.target - g.x;
  const stepX = gullSpeed * dt;
  if (Math.abs(dx) <= stepX) { g.x = g.target; pickTarget(s); } else { g.x += Math.sign(dx) * stepX; g.dir = Math.sign(dx) || g.dir; }
  g.flap += dt * (2 + gullSpeed / 40);

  if (s.phase === 'between') {
    if (s.t > 1.3) { s.wave += 1; openWave(s); ev.push({ type: 'open', wave: s.wave }); }
    return ev;
  }
  if (s.phase === 'wash') {
    if (s.t > 1.1) {
      if (s.pendingOver) { s.pendingOver = false; s.phase = 'over'; s.over = true; ev.push({ type: 'over', score: s.score }); }
      else { s.phase = 'ready'; s.t = 0; s.spec = waveSpec(s.wave); }
    }
    return ev;
  }
  if (s.phase !== 'drop') return ev;

  // Drop.
  if (s.dropped < s.spec.count) {
    g.dropT -= dt * speed;
    if (g.dropT <= 0) {
      const golden = rush && s.rng() < 0.12;
      s.shells.push({ x: g.x, y: GULL_Y + 6, golden, id: s.dropped });
      s.dropped += 1;
      g.dropT += s.spec.interval * (0.75 + s.rng() * 0.5);
      ev.push({ type: 'drop', golden });
    }
  }

  // Fall, catch, or wash away.
  const fall = s.spec.fall * speed;
  const reach = s.bucketW / 2 + SHELL_W / 2;
  const sand = sandY(s.h);
  let missed = null;
  for (const sh of s.shells) {
    const prevBottom = sh.y + SHELL_H;
    sh.y += fall * dt;
    const bottom = sh.y + SHELL_H;
    if (Math.abs(sh.x - s.bucketX) <= reach) {
      for (let i = 0; i < s.buckets; i += 1) {
        const top = bucketTop(i, s.h);
        if (prevBottom <= top + 1 && bottom >= top) { sh.caught = i; break; }
      }
    }
    if (sh.caught != null) {
      const before = s.score;
      const points = catchPoints(s.wave, sh.golden);
      s.score += points;
      s.caught += 1;
      s.totalCaught += 1;
      if (sh.golden) s.golds += 1;
      ev.push({ type: 'catch', points, golden: sh.golden, run: s.run, bucket: sh.caught, x: sh.x });
      s.run += 1;
      const next = opts.calm ? MAX_BUCKETS : bucketsAfter(before, s.score, s.buckets);
      if (next > s.buckets) { s.buckets = next; ev.push({ type: 'extra', buckets: next }); }
    } else if (bottom >= sand && !missed) {
      missed = sh;
    }
  }
  s.shells = s.shells.filter((sh) => sh.caught == null);

  if (missed) {
    const cleared = s.shells.length - 1 + (s.spec.count - s.dropped);
    s.misses += 1;
    s.clean = false;
    let lost = false;
    if (!opts.calm) { s.buckets -= 1; lost = true; }
    // The gull goes back one wave, the next set comes a little slower: Kaboom!'s own mercy.
    s.wave = Math.max(0, s.wave - 1);
    s.spec = waveSpec(s.wave);
    s.dropped = 0;
    s.run = 0;
    s.phase = 'wash';
    s.t = 0;
    const washed = s.shells.map((sh) => ({ x: sh.x, y: sh.y, golden: sh.golden }));
    s.shells = [];
    if (s.buckets <= 0) { s.buckets = 0; s.pendingOver = true; }
    ev.push({ type: 'miss', x: missed.x, cleared: Math.max(0, cleared), washed, bucketLost: lost, buckets: s.buckets, final: s.pendingOver });
    return ev;
  }

  if (s.dropped >= s.spec.count && s.shells.length === 0) {
    s.wavesCleared += 1;
    ev.push({ type: 'wave', index: s.wave, clean: s.clean, caught: s.caught });
    s.clean = true;
    s.phase = 'between';
    s.t = 0;
  }
  return ev;
}

/** CALM turned on mid-game: the stack fills back up. A final loss already under way still ends the game. */
export function applyCalm(s) {
  if (s.phase !== 'over' && !s.pendingOver) s.buckets = MAX_BUCKETS;
  return s;
}

/** Where a shell will be when it reaches the top bucket, for the attract-mode autopilot. */
export function lowestShell(s) {
  let best = null;
  for (const sh of s.shells) if (!best || sh.y > best.y) best = sh;
  return best;
}
