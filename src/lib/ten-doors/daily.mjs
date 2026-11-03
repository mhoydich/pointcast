/**
 * Seeded, shared logic for the Ten Doors that change on a clock:
 * Meter Oracle (every 15 minutes), Green Flash (today's sunset),
 * Ice Cream Route (a street map a day) and Tide Pool Census (a pool a day).
 *
 * The same functions run in the browser and in the build that writes the
 * JSON manifests, so a person and a bot asking about the same window get
 * the same answer. Pure functions, no I/O; covered by tests/ten-doors.test.mjs.
 */

export const EL_SEGUNDO = { lat: 33.9192, lon: -118.4165, tz: 'America/Los_Angeles' };

/** FNV-1a, 32-bit. */
export function hashString(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a tiny seeded generator returning floats in [0, 1). */
export function rng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed));
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** YYYY-MM-DD for the town (Pacific) day containing `date`. */
export function townDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: EL_SEGUNDO.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** "6:41 PM" in Pacific time. */
export function pacificClock(date) {
  return new Intl.DateTimeFormat('en-US', { timeZone: EL_SEGUNDO.tz, hour: 'numeric', minute: '2-digit' }).format(date);
}

/** Add whole days to a YYYY-MM-DD string. */
export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- Meter Oracle

export const METER_WINDOW_MS = 15 * 60 * 1000;

export const FORTUNES = [
  'A stranger holds a door. Hold the next one.',
  'The light at Grand and Main turns green for you. Take it slow anyway.',
  'Something you lost is in the second place you look, not the first.',
  'Order the thing you always order. It knows you.',
  'A plane will pass overhead and you will not mind the noise.',
  'Text the person you just thought of. Keep it to one line.',
  'The best parking spot is one block further than you wanted.',
  'You will hear a song you forgot you loved.',
  'A dog will look at you like you are doing great. You are.',
  'Leave a little more time than you think. You will need it for a good reason.',
  'The answer arrives after you stop refreshing.',
  'Drink a glass of water before the next decision.',
  'Someone nearby is having a better day because of something small you did.',
  'The ocean is still there. Go look at it this week.',
  'Fix the one thing that has bugged you for a month. It takes nine minutes.',
  'Say the compliment out loud instead of thinking it.',
  'An old idea comes back wearing new clothes. Let it in.',
  'Your next meeting could have been a walk. Make it one.',
  'Today the shortcut is the long way. Enjoy the long way.',
  'A small win before noon carries the afternoon.',
  'Somebody at the counter knows your name. Learn theirs.',
  'The wind turns west. Bring a layer.',
  'You are allowed to leave it unfinished until tomorrow.',
  'A good question beats a fast answer for the next quarter hour.',
  'Put the phone face down for one song.',
  'Coffee helps. A second coffee helps less. Choose wisely.',
  'The kid on the scooter is having the best day in town. Wave.',
  'What you are carrying is lighter if you name it.',
  'Look up at the jacarandas, or where they will be in spring.',
  'Return the thing you borrowed. It will feel better than keeping it.',
  'You will find a coin on the ground. It is not for this meter.',
  'Write the idea down now. It will not be there at the next light.',
  'A table opens just as you walk in.',
  'The meter runs out. You are already gone. Well timed.',
  'Ask for the small favor. The answer is yes.',
  'Someone is about to tell you a good story. Let them finish.',
  'A fog bank sits offshore, deciding. So can you.',
  'Pick the slower lane. It is moving.',
  'An agent somewhere is reading this too. Be kind to it.',
  'The thing you dread takes less time than the dreading.',
  'Today the sunset is worth stopping for.',
  'Tidy one drawer. The rest of the house will notice.',
  'A friend is closer than the freeway makes it seem.',
  'Say no to one thing so you can say yes to a better one.',
  'Stretch. Your shoulders have been holding a meeting.',
  'You will laugh at something dumb and it will be the best part of the hour.',
  'Leave the meter a little better than you found it.',
  'Fifteen minutes is enough to start. Start.',
];

export function meterWindow(date = new Date()) {
  const index = Math.floor(date.getTime() / METER_WINDOW_MS);
  return { index, start: new Date(index * METER_WINDOW_MS), end: new Date((index + 1) * METER_WINDOW_MS) };
}

/**
 * The fortune for the 15-minute window containing `date`. Even windows draw from the
 * first half of the deck and odd windows from the second, so neighbors never repeat.
 */
export function meterFortune(date = new Date()) {
  const { index, start, end } = meterWindow(date);
  const half = Math.floor(FORTUNES.length / 2);
  const n = (Math.abs(index) % 2) * half + Math.floor(rng(`meter:${index}`)() * half);
  return { window: index, start: start.toISOString(), end: end.toISOString(), fortune: FORTUNES[n], number: n + 1 };
}

// ---------------------------------------------------------------- Green Flash

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/**
 * Sunset for a town day, by the NOAA general solar position equations
 * (fractional year, equation of time, declination) with the standard
 * 90.833 degree zenith for refraction and the solar disc. Good to about a
 * minute at this latitude. Returns a Date (UTC instant).
 */
export function sunsetFor(day, { lat = EL_SEGUNDO.lat, lon = EL_SEGUNDO.lon } = {}) {
  const noon = new Date(`${day}T12:00:00Z`);
  const start = Date.UTC(noon.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((noon.getTime() - start) / 86400000) + 1;
  const leap = new Date(Date.UTC(noon.getUTCFullYear(), 1, 29)).getUTCDate() === 29;
  const yearDays = leap ? 366 : 365;
  // Evaluate at roughly local sunset (about 01:00 UTC next day) to tighten the estimate.
  const gamma = ((2 * Math.PI) / yearDays) * (dayOfYear - 1 + (25 - 12) / 24);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const cosHa = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(decl)) - Math.tan(rad(lat)) * Math.tan(decl);
  const ha = deg(Math.acos(Math.max(-1, Math.min(1, cosHa))));
  const minutesUtc = 720 - 4 * (lon - ha) - eqTime; // sunset uses the negative hour angle
  const midnight = Date.UTC(noon.getUTCFullYear(), noon.getUTCMonth(), noon.getUTCDate());
  return new Date(midnight + minutesUtc * 60000);
}

export function sunsetReport(day) {
  const at = sunsetFor(day);
  return { day, utc: at.toISOString(), pacific: pacificClock(at) };
}

// ---------------------------------------------------------------- Ice Cream Route

export const ROUTE_SIZE = 5; // corners per side
export const ROUTE_ROUNDS = [
  { round: 1, kids: 3, oneWays: 0, slack: 4 },
  { round: 2, kids: 4, oneWays: 4, slack: 4 },
  { round: 3, kids: 5, oneWays: 6, slack: 3 },
];

const key = (a, b) => `${a}>${b}`;
export const node = (x, y) => y * ROUTE_SIZE + x;
export const coords = (n) => ({ x: n % ROUTE_SIZE, y: Math.floor(n / ROUTE_SIZE) });

export function neighbors(n) {
  const { x, y } = coords(n);
  const out = [];
  if (x > 0) out.push(node(x - 1, y));
  if (x < ROUTE_SIZE - 1) out.push(node(x + 1, y));
  if (y > 0) out.push(node(x, y - 1));
  if (y < ROUTE_SIZE - 1) out.push(node(x, y + 1));
  return out;
}

/** Can the truck drive from a to b in one block? `blocked` holds "a>b" keys a one-way street forbids. */
export function canDrive(a, b, blocked) {
  return neighbors(a).includes(b) && !blocked.has(key(a, b));
}

function distancesFrom(src, blocked) {
  const total = ROUTE_SIZE * ROUTE_SIZE;
  const dist = new Array(total).fill(Infinity);
  dist[src] = 0;
  const queue = [src];
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of neighbors(cur)) {
      if (blocked.has(key(cur, nb)) || dist[nb] !== Infinity) continue;
      dist[nb] = dist[cur] + 1;
      queue.push(nb);
    }
  }
  return dist;
}

function permutations(items) {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}

/** Fewest blocks to visit every kid from `start`, given one-way streets. */
export function shortestTour(start, kids, blocked) {
  const stops = [start, ...kids];
  const table = new Map(stops.map((s) => [s, distancesFrom(s, blocked)]));
  let best = Infinity;
  for (const order of permutations(kids)) {
    let len = 0;
    let at = start;
    for (const k of order) {
      len += table.get(at)[k];
      at = k;
      if (len >= best) break;
    }
    if (len < best) best = len;
  }
  return best;
}

/** One round of a day's map: start corner, kids' corners, one-way streets and the jingle's length in blocks. */
export function routeRound(day, roundSpec) {
  const total = ROUTE_SIZE * ROUTE_SIZE;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const r = rng(`route:${day}:${roundSpec.round}:${attempt}`);
    const start = node(Math.floor(ROUTE_SIZE / 2), ROUTE_SIZE - 1);
    const kids = [];
    while (kids.length < roundSpec.kids) {
      const n = Math.floor(r() * total);
      if (n !== start && !kids.includes(n)) kids.push(n);
    }
    const blocked = new Set();
    const oneWays = [];
    while (oneWays.length < roundSpec.oneWays) {
      const a = Math.floor(r() * total);
      const nbs = neighbors(a);
      const b = nbs[Math.floor(r() * nbs.length)];
      if (blocked.has(key(a, b)) || blocked.has(key(b, a))) continue;
      blocked.add(key(b, a)); // traffic may go a -> b only
      oneWays.push([a, b]);
    }
    // Every corner must stay reachable from every other.
    const ok = Array.from({ length: total }, (_, s) => distancesFrom(s, blocked)).every((d) => d.every(Number.isFinite));
    if (!ok) continue;
    const best = shortestTour(start, kids, blocked);
    return { round: roundSpec.round, start, kids, oneWays, best, jingle: best + roundSpec.slack };
  }
  throw new Error(`No solvable map for ${day} round ${roundSpec.round}`);
}

export function routeDay(day) {
  return { day, size: ROUTE_SIZE, rounds: ROUTE_ROUNDS.map((spec) => routeRound(day, spec)) };
}

/** Blocked "a>b" keys for a round's one-way list. */
export function blockedFor(round) {
  return new Set(round.oneWays.map(([a, b]) => key(b, a)));
}

// ---------------------------------------------------------------- Tide Pool Census

export const SPECIES = [
  { id: 'crab', name: 'shore crabs', min: 2, max: 7 },
  { id: 'star', name: 'sea stars', min: 1, max: 5 },
  { id: 'snail', name: 'turban snails', min: 3, max: 9 },
  { id: 'anemone', name: 'anemones', min: 2, max: 6 },
];

/** Smallest distance between two creatures, in pool widths. */
export const POOL_SPACING = 0.07;

/** A day's pool: creatures with positions in a unit square and whether each hides until the water is touched. */
export function tidePool(day) {
  const r = rng(`pool:${day}`);
  const creatures = [];
  const counts = {};
  for (const sp of SPECIES) {
    const n = sp.min + Math.floor(r() * (sp.max - sp.min + 1));
    counts[sp.id] = n;
    for (let i = 0; i < n; i += 1) {
      // Keep creatures apart so two never sit on top of each other and every one can be counted.
      let x, y, tries = 0;
      do {
        x = Number((0.08 + r() * 0.84).toFixed(3));
        y = Number((0.1 + r() * 0.8).toFixed(3));
        tries += 1;
      } while (tries < 60 && creatures.some((c) => Math.hypot(c.x - x, c.y - y) < POOL_SPACING));
      creatures.push({ species: sp.id, x, y, hidden: r() < 0.28, turn: Number((r() * 360).toFixed(0)) });
    }
  }
  const rocks = Array.from({ length: 5 + Math.floor(r() * 4) }, () => ({
    x: Number((r()).toFixed(3)),
    y: Number((r()).toFixed(3)),
    r: Number((0.05 + r() * 0.08).toFixed(3)),
  }));
  return { day, counts, creatures, rocks };
}
