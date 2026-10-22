/**
 * Gridtown — a small, deterministic city builder for the browser.
 *
 * Pure module: no DOM, no timers, no randomness other than the seeded
 * generator in `createCity`. Every rule a player can learn lives here so
 * the same file runs in the page, in node:test, and in an agent.
 */

export const GRIDTOWN_VERSION = '1.1.1';
export const GRIDTOWN_TITLE = 'Gridtown';
export const GRIDTOWN_DESCRIPTION =
  'A small city you can hold in a browser. Lay roads, zone homes, shops and workshops, power them, plant parks, and keep the budget honest. Twelve lessons, one tap at a time, saved on your device.';
export const STORAGE_KEY = 'pc:gridtown:city:v1';

export const GRID_SIZE = 16;
export const MAX_LEVEL = 3;
export const STARTING_FUNDS = 2500;
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Everything a tile can be. `terrain` tiles are the ground; the rest are built. */
export const TILES = Object.freeze({
  grass: { id: 'grass', label: 'Grass', terrain: true, buildable: true },
  water: { id: 'water', label: 'Water', terrain: true, buildable: false },
  trees: { id: 'trees', label: 'Trees', terrain: true, buildable: true },
  road: { id: 'road', label: 'Road', terrain: false },
  res: { id: 'res', label: 'Homes', terrain: false, zone: true },
  com: { id: 'com', label: 'Shops', terrain: false, zone: true },
  ind: { id: 'ind', label: 'Workshops', terrain: false, zone: true },
  park: { id: 'park', label: 'Park', terrain: false },
  power: { id: 'power', label: 'Power plant', terrain: false },
});

/** The toolbar. Order matters: it is the order a new player meets them. */
export const TOOLS = Object.freeze([
  { id: 'road', label: 'Road', cost: 10, key: '1', hint: 'Every zone needs a road touching one of its four sides.' },
  { id: 'res', label: 'Homes', cost: 50, key: '2', hint: 'People move in when there are jobs, power and a road. Parks and water raise the value.' },
  { id: 'com', label: 'Shops', cost: 60, key: '3', hint: 'Shops need customers. They grow with population.' },
  { id: 'ind', label: 'Workshops', cost: 70, key: '4', hint: 'The most jobs per tile. Smoke covers every tile within two steps, so keep homes three away.' },
  { id: 'park', label: 'Park', cost: 40, key: '5', hint: 'Cleans the air two tiles around it and raises land value for homes.' },
  { id: 'power', label: 'Power plant', cost: 400, key: '6', hint: 'Powers 24 zone tiles anywhere in town. Costs 25 a month to run. Pollutes like a workshop.' },
  { id: 'bulldoze', label: 'Bulldoze', cost: 5, key: '0', hint: 'Return a tile to grass. Always allowed, even when the town is broke.' },
]);

export const POWER_CAPACITY = 24;
export const UPKEEP = Object.freeze({ road: 2, park: 2, power: 25 });
export const RESIDENTS_PER_LEVEL = 8;
export const JOBS = Object.freeze({ com: 6, ind: 10 });
/** Units of smoke on every tile within two steps. A park clears 2, so one park cancels one workshop. */
export const SMOKE = Object.freeze({ ind: 2, power: 3, park: -2 });
/** The share of residents a town wants working in shops and in workshops. Together they make one job per person. */
export const JOB_MIX = Object.freeze({ com: 0.3, ind: 0.7 });

/** Twelve lessons. Each is a predicate over the city, checked after every change and every month. */
export const LESSONS = Object.freeze([
  { id: 'road', title: 'Lay a road', text: 'Pick the Road tool and tap three tiles in a row. Drag to paint.', done: (c) => count(c, 'road') >= 3 },
  { id: 'homes', title: 'Zone four homes', text: 'Homes go next to a road. Tap four grass tiles touching your road.', done: (c) => count(c, 'res') >= 4 },
  { id: 'power', title: 'Build a power plant', text: 'Nothing grows in the dark. A plant powers 24 zone tiles anywhere in town.', done: (c) => count(c, 'power') >= 1 },
  { id: 'jobs', title: 'Zone two shops and two workshops', text: 'The first few dozen move in on their own. After that, homes follow jobs. Shops sell, workshops make.', done: (c) => count(c, 'com') >= 2 && count(c, 'ind') >= 2 },
  { id: 'month', title: 'Let a month pass', text: 'Press Next month, or turn on Auto. Watch the ledger.', done: (c) => c.month >= 1 },
  { id: 'fifty', title: 'Reach 50 residents', text: 'Zones fill in one level at a time when they have power, a road and demand.', done: (c) => c.stats.population >= 50 },
  { id: 'park', title: 'Plant a park near homes', text: 'A park within two tiles of a home raises its value and cleans the air.', done: (c) => c.stats.parkedHomes >= 1 },
  { id: 'clean', title: 'Keep every home out of the smoke', text: 'Workshops and plants put smoke on every tile within two steps. Keep homes three away, or add parks.', done: (c) => c.stats.population >= 50 && c.stats.pollutedHomes === 0 },
  { id: 'black', title: 'Finish a month in the black', text: 'Roads, parks and plants cost upkeep. Taxes from people and jobs pay for them.', done: (c) => c.month >= 1 && c.ledger.net > 0 },
  { id: 'twohundred', title: 'Reach 200 residents', text: 'Balance homes against jobs. The RCI bars show what the town is asking for.', done: (c) => c.stats.population >= 200 },
  { id: 'happy', title: 'Reach 80% happiness with 100 residents', text: 'Jobs for everyone, clean air, parks per person and a fair tax rate.', done: (c) => c.stats.happiness >= 80 && c.stats.population >= 100 },
  { id: 'year', title: 'Run the town for a year', text: 'Twelve months without going broke. Then it is your city.', done: (c) => c.month >= 12 && c.funds > 0 },
]);

/** What a town is called as it grows. The page announces each step up. */
export const CITY_TITLES = Object.freeze([
  { min: 0, title: 'Open country' },
  { min: 1, title: 'Hamlet' },
  { min: 50, title: 'Village' },
  { min: 200, title: 'Town' },
  { min: 500, title: 'City' },
  { min: 1000, title: 'Metropolis' },
]);

export function cityTitle(population) {
  const people = Math.max(0, Number(population) || 0);
  let title = CITY_TITLES[0].title;
  for (const step of CITY_TITLES) if (people >= step.min) title = step.title;
  return title;
}

/* ----------------------------- helpers ----------------------------- */

/** At most 40 characters, counted as code points so an emoji is never cut in half. */
export function cleanName(value) {
  const text = String(value ?? '').replace(/[\u0000-\u001f]/g, '').trim();
  return Array.from(text).slice(0, 40).join('').trim() || 'Gridtown';
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const index = (x, y) => y * GRID_SIZE + x;
export const inBounds = (x, y) => x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function count(city, tileId) {
  let n = 0;
  for (const tile of city.tiles) if (tile.id === tileId) n += 1;
  return n;
}

export function normalizeSeed(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 20261022;
  return Math.floor(n) % 4294967296;
}

/* ----------------------------- terrain ----------------------------- */

/** A river winding north to south, a lake, and clumps of trees. Same seed, same map. */
export function generateTerrain(seed) {
  const rand = mulberry32(seed);
  const tiles = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => ({ id: 'grass', level: 0 }));
  let river = 2 + Math.floor(rand() * (GRID_SIZE - 4));
  for (let y = 0; y < GRID_SIZE; y += 1) {
    tiles[index(river, y)] = { id: 'water', level: 0 };
    if (rand() < 0.35) tiles[index(Math.max(0, river - 1), y)] = { id: 'water', level: 0 };
    const drift = rand();
    if (drift < 0.3 && river > 1) river -= 1;
    else if (drift > 0.7 && river < GRID_SIZE - 2) river += 1;
  }
  const lakeX = Math.floor(rand() * (GRID_SIZE - 4)) + 2;
  const lakeY = Math.floor(rand() * (GRID_SIZE - 4)) + 2;
  for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
    if (Math.abs(dx) + Math.abs(dy) <= 1 || rand() < 0.5) tiles[index(lakeX + dx, lakeY + dy)] = { id: 'water', level: 0 };
  }
  const clumps = 5 + Math.floor(rand() * 4);
  for (let c = 0; c < clumps; c += 1) {
    const cx = Math.floor(rand() * GRID_SIZE);
    const cy = Math.floor(rand() * GRID_SIZE);
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
      const x = cx + dx; const y = cy + dy;
      if (!inBounds(x, y)) continue;
      if (Math.abs(dx) + Math.abs(dy) <= 2 && rand() < 0.65 && tiles[index(x, y)].id === 'grass') tiles[index(x, y)] = { id: 'trees', level: 0 };
    }
  }
  return tiles;
}

/* ------------------------------ city ------------------------------ */

export function createCity(seed = 20261022, name = 'Gridtown') {
  const s = normalizeSeed(seed);
  const city = {
    version: 1,
    name: cleanName(name),
    seed: s,
    month: 0,
    funds: STARTING_FUNDS,
    taxRate: 7,
    tiles: generateTerrain(s),
    ledger: { income: 0, upkeep: 0, net: 0 },
    stats: emptyStats(),
    lessons: [],
    log: [],
  };
  return refresh(city);
}

function emptyStats() {
  return {
    population: 0, jobs: 0, comJobs: 0, indJobs: 0, capacity: 0, powered: 0, unpowered: 0, unroaded: 0,
    pollutedHomes: 0, parkedHomes: 0, happiness: 50,
    demand: { res: 0, com: 0, ind: 0 },
    employment: 1,
  };
}

/* ------------------------------ build ------------------------------ */

export function canBuild(city, toolId, x, y) {
  if (!inBounds(x, y)) return { ok: false, reason: 'Off the map.' };
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) return { ok: false, reason: 'Unknown tool.' };
  const tile = city.tiles[index(x, y)];
  if (toolId === 'bulldoze') {
    if (tile.id === 'grass') return { ok: false, reason: 'Already grass.' };
    if (tile.id === 'water') return { ok: false, reason: 'You cannot bulldoze water.' };
  } else {
    if (tile.id === 'water') return { ok: false, reason: 'You cannot build on water.' };
    if (tile.id === toolId) return { ok: false, reason: `Already ${tool.label.toLowerCase()}.` };
    if (!TILES[tile.id].terrain) return { ok: false, reason: 'Bulldoze it first.' };
  }
  if (toolId !== 'bulldoze' && city.funds < tool.cost) return { ok: false, reason: `Not enough funds. ${tool.label} costs ${tool.cost}.` };
  return { ok: true, cost: tool.cost };
}

/** Returns a new city, or the same object when nothing changed. */
export function build(city, toolId, x, y) {
  const check = canBuild(city, toolId, x, y);
  if (!check.ok) return { city, ...check };
  const tiles = city.tiles.slice();
  tiles[index(x, y)] = toolId === 'bulldoze' ? { id: 'grass', level: 0 } : { id: toolId, level: 0 };
  const next = refresh({ ...city, tiles, funds: city.funds - check.cost });
  return { city: next, ok: true, cost: check.cost };
}

export function setTaxRate(city, rate) {
  const taxRate = Math.max(0, Math.min(20, Math.round(Number(rate) || 0)));
  if (taxRate === city.taxRate) return city;
  return refresh({ ...city, taxRate });
}

export function renameCity(city, name) {
  const clean = cleanName(name);
  if (clean === city.name) return city;
  return { ...city, name: clean };
}

/* --------------------------- derived state --------------------------- */

/** Recompute everything that follows from the tiles. Pure; never changes levels or funds. */
export function analyze(city) {
  const { tiles } = city;
  const roaded = new Array(tiles.length).fill(false);
  const pollution = new Array(tiles.length).fill(0);
  const value = new Array(tiles.length).fill(0);
  const parkValue = new Array(tiles.length).fill(0);
  for (let y = 0; y < GRID_SIZE; y += 1) for (let x = 0; x < GRID_SIZE; x += 1) {
    const i = index(x, y);
    const tile = tiles[i];
    // Smoke does not depend on a workshop's level: level-dependent smoke let a park flip homes in and out of
    // the smoke as the workshop grew and shrank, and some towns cycled every few months forever.
    if (tile.id === 'ind' || tile.id === 'power') spread(pollution, x, y, 2, SMOKE[tile.id]);
    if (tile.id === 'park') { spread(pollution, x, y, 2, SMOKE.park); spread(value, x, y, 2, 2); spread(parkValue, x, y, 2, 1); }
    if (tile.id === 'water') spread(value, x, y, 1, 1);
    if (tile.id === 'trees') spread(value, x, y, 1, 1);
    if (TILES[tile.id].zone) {
      roaded[i] = NEIGHBORS.some(([dx, dy]) => inBounds(x + dx, y + dy) && tiles[index(x + dx, y + dy)].id === 'road');
    }
  }
  // Power: plants serve zone tiles in reading order until capacity runs out.
  const capacity = count(city, 'power') * POWER_CAPACITY;
  const powered = new Array(tiles.length).fill(false);
  let served = 0;
  for (let i = 0; i < tiles.length; i += 1) {
    if (!TILES[tiles[i].id].zone) continue;
    if (served < capacity) { powered[i] = true; served += 1; }
  }
  let population = 0; let jobs = 0; let comJobs = 0; let indJobs = 0; let unpowered = 0; let unroaded = 0; let pollutedHomes = 0; let parkedHomes = 0;
  let homes = 0; let homeValue = 0; let homePollution = 0;
  for (let i = 0; i < tiles.length; i += 1) {
    const tile = tiles[i];
    if (!TILES[tile.id].zone) continue;
    if (!powered[i]) unpowered += 1;
    if (!roaded[i]) unroaded += 1;
    if (tile.id === 'res') {
      population += tile.level * RESIDENTS_PER_LEVEL;
      homes += 1;
      homeValue += value[i];
      homePollution += Math.max(0, pollution[i]);
      if (pollution[i] > 0) pollutedHomes += 1;
      if (parkValue[i] > 0) parkedHomes += 1;
    } else {
      jobs += tile.level * JOBS[tile.id];
      if (tile.id === 'com') comJobs += tile.level * JOBS.com; else indJobs += tile.level * JOBS.ind;
    }
  }
  const employment = population === 0 ? 1 : Math.min(1, jobs / population);
  const parks = count(city, 'park');
  const demand = computeDemand(population, comJobs, indJobs);
  const happiness = computeHappiness({ population, employment, parks, taxRate: city.taxRate, homes, homePollution, homeValue });
  return {
    roaded, powered, pollution, value, parkValue,
    stats: {
      population, jobs, comJobs, indJobs, capacity, powered: Math.min(served, capacity), unpowered, unroaded,
      pollutedHomes, parkedHomes, happiness, demand, employment,
    },
  };
}

function spread(field, cx, cy, radius, amount) {
  for (let dy = -radius; dy <= radius; dy += 1) for (let dx = -radius; dx <= radius; dx += 1) {
    if (Math.abs(dx) + Math.abs(dy) > radius) continue;
    const x = cx + dx; const y = cy + dy;
    if (inBounds(x, y)) field[index(x, y)] += amount;
  }
}

/**
 * RCI demand in -100..100. Positive means the town wants more of that zone.
 *
 * Every term counts people and jobs that exist, never tiles that are merely
 * zoned, so painting a long row of shops early can never freeze a town:
 * empty zoning simply waits until the town needs it.
 */
export function computeDemand(population, comJobs, indJobs) {
  const jobs = comJobs + indJobs;
  // Pioneers always want a few homes; after that, homes follow jobs.
  const res = clamp(30 + Math.round((jobs - population) * 0.5), -100, 100);
  // Shops want about three jobs for every ten residents, workshops about seven, plus a little room to start.
  const com = clamp(20 + Math.round((Math.round(population * JOB_MIX.com) - comJobs) * 2), -100, 100);
  const ind = clamp(20 + Math.round((Math.round(population * JOB_MIX.ind) - indJobs) * 1.5), -100, 100);
  return { res, com, ind };
}

export function computeHappiness({ population, employment, parks, taxRate, homes, homePollution, homeValue }) {
  if (population === 0) return 50;
  let h = 50;
  h += Math.round(employment * 25);                           // up to +25 when everyone has a job
  h += Math.min(15, Math.round((parks / Math.max(1, population / 40)) * 5)); // parks per 40 residents
  h -= Math.max(0, taxRate - 7) * 3;                           // every point over 7% costs 3
  h += Math.max(0, Math.min(3, 7 - taxRate));                  // a little love for low taxes, never a second penalty
  h -= Math.min(30, Math.round((homePollution / Math.max(1, homes)) * 10));
  h += Math.min(10, Math.round((homeValue / Math.max(1, homes)) * 3));
  return clamp(h, 0, 100);
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** Attach derived stats and lesson progress. Returns a new city object. */
export function refresh(city) {
  const { stats } = analyze(city);
  const next = { ...city, stats };
  const done = new Set(city.lessons || []);
  for (const lesson of LESSONS) if (!done.has(lesson.id) && lesson.done(next)) done.add(lesson.id);
  next.lessons = LESSONS.map((l) => l.id).filter((id) => done.has(id));
  return next;
}

/* ------------------------------ time ------------------------------ */

/**
 * The zoning half of a month, shared by tick() and the inspector so the
 * inspector can never promise something the month will not do.
 * Returns the new tiles and, for every zone tile, the demand it saw on its turn.
 */
export function stepMonth(city, before = analyze(city)) {
  let population = before.stats.population;
  let comJobs = before.stats.comJobs;
  let indJobs = before.stats.indJobs;
  const seen = new Array(city.tiles.length).fill(null);
  const tiles = city.tiles.map((tile, i) => {
    if (!TILES[tile.id].zone) return tile;
    const alive = before.powered[i] && before.roaded[i];
    const smoky = tile.id === 'res' && before.pollution[i] > 0;
    let level = tile.level;
    if (!alive) level = Math.max(0, level - 1);
    else if (smoky && level > 1) level -= 1;                       // a home in the smoke loses a level a month, down to one
    else {
      const demand = computeDemand(population, comJobs, indJobs)[tile.id];
      seen[i] = demand;
      if (demand > 0 && level < MAX_LEVEL && !(smoky && level >= 1)) level += 1;
      else if (demand < -40 && level > 0) level -= 1;
    }
    const delta = level - tile.level;
    if (delta !== 0) {
      if (tile.id === 'res') population += delta * RESIDENTS_PER_LEVEL;
      else if (tile.id === 'com') comJobs += delta * JOBS.com;
      else indJobs += delta * JOBS.ind;
    }
    return level === tile.level ? tile : { id: tile.id, level };
  });
  return { tiles, demandSeen: seen };
}

/**
 * Advance one month: zones grow or shrink, the ledger settles, lessons update.
 *
 * Demand is re-read after every tile changes, in reading order, so growth
 * stops the moment the town has what it asked for. One shared pre-month
 * demand applied to every tile at once made large towns swing between
 * two populations forever.
 */
export function tick(city) {
  const { tiles } = stepMonth(city);
  const grown = { ...city, tiles };
  const after = analyze(grown);
  const income = Math.round((after.stats.population + after.stats.jobs * 0.5) * (city.taxRate / 10));
  const upkeep = count(grown, 'road') * UPKEEP.road + count(grown, 'park') * UPKEEP.park + count(grown, 'power') * UPKEEP.power;
  const net = income - upkeep;
  const month = city.month + 1;
  const log = [{ month, text: describeMonth(city, grown, after.stats, net) }, ...(city.log || [])].slice(0, 24);
  return refresh({ ...grown, month, funds: city.funds + net, ledger: { income, upkeep, net }, log });
}

export function describeMonth(before, after, stats, net) {
  const delta = stats.population - before.stats.population;
  const parts = [];
  if (delta > 0) parts.push(`${delta} moved in`);
  else if (delta < 0) parts.push(`${-delta} moved out`);
  else parts.push('no one moved');
  parts.push(net >= 0 ? `+${net} in the bank` : `${net} in the bank`);
  const zones = (n) => `${n} zone${n === 1 ? '' : 's'}`;
  if (stats.unpowered > 0) parts.push(`${zones(stats.unpowered)} in the dark`);
  if (stats.unroaded > 0) parts.push(`${zones(stats.unroaded)} without a road`);
  return parts.join(' · ');
}

export function monthLabel(month) {
  return `${MONTHS[month % 12]} Y${Math.floor(month / 12) + 1}`;
}

/* ------------------------------ save ------------------------------ */

/** Parse a saved city. Anything malformed returns null so the page starts fresh. */
export function readCity(raw) {
  if (!raw) return null;
  let data;
  try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
  if (!data || typeof data !== 'object' || data.version !== 1) return null;
  if (!Array.isArray(data.tiles) || data.tiles.length !== GRID_SIZE * GRID_SIZE) return null;
  const tiles = data.tiles.map((t) => {
    const id = t && typeof t.id === 'string' && Object.hasOwn(TILES, t.id) ? t.id : 'grass';
    const level = TILES[id].zone ? clamp(Math.floor(Number(t.level) || 0), 0, MAX_LEVEL) : 0;
    return { id, level };
  });
  const city = {
    version: 1,
    name: cleanName(data.name),
    seed: normalizeSeed(data.seed),
    month: Math.max(0, Math.floor(Number(data.month) || 0)),
    funds: Number.isFinite(Number(data.funds)) ? Math.round(Number(data.funds)) : STARTING_FUNDS,
    taxRate: clamp(Number.isFinite(Number(data.taxRate)) && data.taxRate !== null && data.taxRate !== '' ? Math.round(Number(data.taxRate)) : 7, 0, 20),
    tiles,
    ledger: {
      income: Math.round(Number(data.ledger?.income) || 0),
      upkeep: Math.round(Number(data.ledger?.upkeep) || 0),
      net: Math.round(Number(data.ledger?.net) || 0),
    },
    stats: emptyStats(),
    lessons: Array.isArray(data.lessons) ? data.lessons.filter((id) => LESSONS.some((l) => l.id === id)) : [],
    log: Array.isArray(data.log)
      ? data.log.slice(0, 24).map((e) => ({ month: Math.floor(Number(e?.month) || 0), text: String(e?.text || '').slice(0, 200) }))
      : [],
  };
  return refresh(city);
}

export function serializeCity(city) {
  const { stats, ...rest } = city;
  return JSON.stringify(rest);
}

/** A compact, shareable text snapshot: one character per tile. */
export function cityToText(city) {
  const glyph = { grass: '.', water: '~', trees: 't', road: '#', res: 'R', com: 'C', ind: 'I', park: 'P', power: '*' };
  const rows = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    let row = '';
    for (let x = 0; x < GRID_SIZE; x += 1) row += glyph[city.tiles[index(x, y)].id];
    rows.push(row);
  }
  return rows.join('\n');
}

export function summarizeCity(city) {
  return {
    name: city.name, seed: city.seed, month: city.month, date: monthLabel(city.month), funds: city.funds, taxRate: city.taxRate,
    population: city.stats.population, jobs: city.stats.jobs, happiness: city.stats.happiness, title: cityTitle(city.stats.population),
    lessons: `${city.lessons.length}/${LESSONS.length}`,
    tiles: { road: count(city, 'road'), res: count(city, 'res'), com: count(city, 'com'), ind: count(city, 'ind'), park: count(city, 'park'), power: count(city, 'power') },
  };
}

/* ------------------------------ inspect ------------------------------ */

const ZONE_NOUN = { res: 'homes', com: 'shops', ind: 'workshops' };

/** How many tiles of each zone could still gain a level: roaded, powered, below the top, and (for homes) clean. */
function roomToGrow(city, a) {
  const room = { res: 0, com: 0, ind: 0 };
  city.tiles.forEach((t, i) => {
    if (!TILES[t.id].zone || t.level >= MAX_LEVEL || !a.roaded[i] || !a.powered[i]) return;
    if (t.id === 'res' && a.pollution[i] > 0 && t.level >= 1) return;
    room[t.id] += 1;
  });
  return room;
}

/** What actually unblocks a zone whose demand is spent: never two tiles pointing at each other. */
function demandAdvice(zone, d, room) {
  const fill = (z) => (room[z] > 0 ? `${ZONE_NOUN[z][0].toUpperCase()}${ZONE_NOUN[z].slice(1)} are still filling in; give it a month or two.` : `Zone more ${ZONE_NOUN[z]}.`);
  if (zone === 'res') {
    const hiring = ['com', 'ind'].filter((z) => d[z] > 0).sort((p, q) => d[q] - d[p]);
    if (!hiring.length) return 'Homes follow jobs, and every job is filled: zone more shops and workshops together.';
    return `Homes follow jobs. ${fill(hiring[0])}`;
  }
  if (d.res > 0) return `It needs more people. ${fill('res')}`;
  const other = zone === 'com' ? 'ind' : 'com';
  if (d[other] > 0) return `More people need more jobs first. ${fill(other)}`;
  return 'The town has the jobs its people need. Grow homes and jobs together.';
}

/**
 * Explain one tile in plain words: what it is, what it needs, and the one
 * thing standing in its way. Pure; the page shows it in the inspector.
 */
export function explainTile(city, x, y) {
  if (!inBounds(x, y)) return null;
  const a = analyze(city);
  const i = index(x, y);
  const tile = city.tiles[i];
  const kind = TILES[tile.id];
  const smoke = Math.max(0, a.pollution[i]);
  // A tree raises its own tile's value too, but building a home clears it, so leave that part out.
  const value = Math.max(0, a.value[i] - (tile.id === 'trees' ? 1 : 0));
  const nearPark = a.parkValue[i] > 0;
  const facts = [];
  let blocker = null;
  let tip = '';
  let headline = kind.label;

  if (kind.zone) {
    const noun = ZONE_NOUN[tile.id];
    const demand = a.stats.demand[tile.id];
    headline = `${kind.label}, level ${tile.level} of ${MAX_LEVEL}`;
    facts.push({ label: 'Road', ok: a.roaded[i], text: a.roaded[i] ? 'Touches a road.' : 'No road on any of its four sides.' });
    facts.push({ label: 'Power', ok: a.powered[i], text: a.powered[i] ? 'Powered.' : a.stats.capacity === 0 ? 'Dark: there is no power plant.' : `Dark: the plants are full (${a.stats.capacity} zone tiles).` });
    facts.push({
      label: 'Demand', ok: demand > 0,
      text: demand > 0 ? `The town wants more ${noun} (${demand}).` : demand < -40 ? `Too many ${noun} (${demand}); it will shrink.` : `Balanced for ${noun} (${demand}); it holds.`,
    });
    if (tile.id === 'res') {
      facts.push({ label: 'Air', ok: smoke === 0, text: smoke === 0 ? 'Clean air.' : `Smoke ${smoke}: it cannot grow past level 1.` });
      facts.push({ label: 'Value', ok: value > 0, text: value > 0 ? `Land value ${value}${nearPark ? ', with a park nearby' : ''}.` : 'No park, water or trees nearby.' });
      facts.push({ label: 'People', ok: tile.level > 0, text: `${tile.level * RESIDENTS_PER_LEVEL} living here.` });
    } else {
      facts.push({ label: 'Jobs', ok: tile.level > 0, text: `${tile.level * JOBS[tile.id]} jobs here.` });
      if (tile.id === 'ind') facts.push({ label: 'Smoke', ok: false, text: 'Puts smoke on every tile within two steps.' });
    }
    // The verdict comes from the same month the game will run, so it is never a guess.
    const next = stepMonth(city, a);
    const nextLevel = next.tiles[i].level;
    const turnDemand = next.demandSeen[i];
    const smokeFix = 'Smoke: keep homes three steps from workshops and plants, or plant a park within two steps (one park cancels one workshop).';
    let why = null;
    if (!a.roaded[i]) why = 'Lay a road on one of its four sides.';
    else if (!a.powered[i]) why = a.stats.capacity === 0 ? 'Build a power plant anywhere in town.' : 'Build another power plant; each one powers 24 zone tiles.';
    else if (tile.id === 'res' && smoke > 0 && tile.level >= 1) why = smokeFix;
    if (nextLevel > tile.level) tip = 'It will grow next month.';
    else if (nextLevel < tile.level) blocker = `It will lose a level next month. ${why ?? `Too many ${noun} for the town (${turnDemand}).`}`;
    else if (tile.level >= MAX_LEVEL) tip = 'Fully grown.';
    else blocker = why ?? demandAdvice(tile.id, a.stats.demand, roomToGrow(city, a));
  } else if (tile.id === 'road') {
    let served = 0;
    for (const [dx, dy] of NEIGHBORS) if (inBounds(x + dx, y + dy) && TILES[city.tiles[index(x + dx, y + dy)].id].zone) served += 1;
    facts.push({ label: 'Serves', ok: served > 0, text: served ? `${served} zone tile${served === 1 ? '' : 's'} beside it.` : 'No zones beside it yet.' });
    facts.push({ label: 'Upkeep', ok: true, text: `${UPKEEP.road} a month.` });
    tip = served ? '' : 'Zone homes, shops or workshops beside it.';
  } else if (tile.id === 'power') {
    facts.push({ label: 'Grid', ok: a.stats.unpowered === 0, text: `${a.stats.powered} of ${a.stats.capacity} zone tiles in use town-wide.` });
    facts.push({ label: 'Upkeep', ok: true, text: `${UPKEEP.power} a month.` });
    facts.push({ label: 'Smoke', ok: false, text: 'Puts smoke on every tile within two steps.' });
    if (a.stats.unpowered > 0) blocker = `${a.stats.unpowered} zone tile${a.stats.unpowered === 1 ? ' is' : 's are'} dark. Build another plant.`;
  } else if (tile.id === 'park') {
    let homes = 0;
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
      if (Math.abs(dx) + Math.abs(dy) > 2 || !inBounds(x + dx, y + dy)) continue;
      if (city.tiles[index(x + dx, y + dy)].id === 'res') homes += 1;
    }
    facts.push({ label: 'Homes', ok: homes > 0, text: homes ? `Raises value and clears smoke for ${homes} home tile${homes === 1 ? '' : 's'} within two steps.` : 'No homes within two steps.' });
    facts.push({ label: 'Upkeep', ok: true, text: `${UPKEEP.park} a month.` });
    if (!homes) tip = 'Parks help homes within two steps.';
  } else if (tile.id === 'water') {
    facts.push({ label: 'Build', ok: false, text: 'Nothing can be built on water.' });
    facts.push({ label: 'Value', ok: true, text: 'Raises the value of homes beside it.' });
  } else {
    facts.push({ label: 'Build', ok: true, text: tile.id === 'trees' ? 'Buildable; building clears the trees.' : 'Buildable.' });
    if (tile.id === 'trees') facts.push({ label: 'Value', ok: true, text: 'Raises the value of homes beside it.' });
    if (smoke > 0) facts.push({ label: 'Smoke', ok: false, text: `Smoke ${smoke}: a home here would stop at level 1.` });
    else if (value > 0) facts.push({ label: 'Value', ok: true, text: `Land value ${value}: a good spot for homes.` });
  }
  return { x, y, id: tile.id, label: kind.label, level: tile.level, headline, facts, blocker, tip };
}

/* ------------------------------ city links ------------------------------ */

const CODE_VERSION = 'g1';
const PLAIN_CODE = Object.freeze({ grass: 'g', water: 'w', trees: 't', road: 'r', park: 'p', power: 'e' });
const ZONE_CODE = Object.freeze({ res: 'abcd', com: 'hijk', ind: 'mnoq' });
const DECODE = (() => {
  const map = new Map();
  for (const [id, ch] of Object.entries(PLAIN_CODE)) map.set(ch, { id, level: 0 });
  for (const [id, chars] of Object.entries(ZONE_CODE)) [...chars].forEach((ch, level) => map.set(ch, { id, level }));
  return map;
})();
const MAX_MONTH = 120000;
const MAX_FUNDS = 1e9;

/**
 * A whole city in one URL-safe string: version, seed, month, funds, tax,
 * one letter per tile, then the name. About 290 characters for a 16 x 16 map.
 * The log and lessons are not carried; lessons are recomputed on arrival.
 */
export function encodeCity(city) {
  let tiles = '';
  for (const t of city.tiles) tiles += TILES[t.id].zone ? ZONE_CODE[t.id][t.level] : PLAIN_CODE[t.id];
  const funds = Math.round(city.funds);
  return [
    CODE_VERSION,
    city.seed.toString(36),
    city.month.toString(36),
    (funds < 0 ? '-' : '') + Math.abs(funds).toString(36),
    city.taxRate.toString(36),
    tiles,
    encodeURIComponent(city.name),
  ].join('.');
}

/** Read a city link. Anything malformed, out of range or not matching its own seed's river returns null. */
export function decodeCity(code) {
  if (typeof code !== 'string' || code.length > 1200) return null;
  const parts = code.split('.');
  if (parts.length < 7 || parts[0] !== CODE_VERSION) return null;
  const int36 = (text, signed = false) => ((signed ? /^-?[0-9a-z]{1,8}$/ : /^[0-9a-z]{1,8}$/).test(text) ? parseInt(text, 36) : NaN);
  const seed = int36(parts[1]);
  const month = int36(parts[2]);
  const funds = int36(parts[3], true);
  const taxRate = int36(parts[4]);
  if (!(seed >= 0 && seed <= 4294967295)) return null;
  if (!(month >= 0 && month <= MAX_MONTH)) return null;
  if (!(Math.abs(funds) <= MAX_FUNDS)) return null;
  if (!(taxRate >= 0 && taxRate <= 20)) return null;
  const letters = parts[5];
  if (letters.length !== GRID_SIZE * GRID_SIZE) return null;
  const terrain = generateTerrain(seed);
  const tiles = [];
  for (let i = 0; i < letters.length; i += 1) {
    const tile = DECODE.get(letters[i]);
    if (!tile) return null;
    if ((tile.id === 'water') !== (terrain[i].id === 'water')) return null; // rivers are fixed by the seed
    tiles.push({ id: tile.id, level: tile.level });
  }
  let name;
  try { name = decodeURIComponent(parts.slice(6).join('.')); } catch { return null; }
  name = cleanName(name);
  return refresh({
    version: 1, name, seed, month, funds, taxRate, tiles,
    ledger: { income: 0, upkeep: 0, net: 0 }, stats: emptyStats(), lessons: [], log: [],
  });
}
