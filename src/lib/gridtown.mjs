/**
 * Gridtown — a small, deterministic city builder for the browser.
 *
 * Pure module: no DOM, no timers, no randomness other than the seeded
 * generator in `createCity`. Every rule a player can learn lives here so
 * the same file runs in the page, in node:test, and in an agent.
 */

export const GRIDTOWN_VERSION = '1.0.0';
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

/* ----------------------------- helpers ----------------------------- */

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
    name: String(name || 'Gridtown').slice(0, 40),
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
    population: 0, jobs: 0, capacity: 0, powered: 0, unpowered: 0, unroaded: 0,
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
  const clean = String(name ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 40) || 'Gridtown';
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
    if (tile.id === 'ind' || tile.id === 'power') spread(pollution, x, y, 2, tile.id === 'power' ? 3 : 1 + tile.level);
    if (tile.id === 'park') { spread(pollution, x, y, 2, -2); spread(value, x, y, 2, 2); spread(parkValue, x, y, 2, 1); }
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
  let population = 0; let jobs = 0; let unpowered = 0; let unroaded = 0; let pollutedHomes = 0; let parkedHomes = 0;
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
    }
  }
  const employment = population === 0 ? 1 : Math.min(1, jobs / population);
  const parks = count(city, 'park');
  const demand = computeDemand(population, jobs, count(city, 'res'), count(city, 'com'), count(city, 'ind'));
  const happiness = computeHappiness({ population, employment, parks, taxRate: city.taxRate, homes, homePollution, homeValue });
  return {
    roaded, powered, pollution, value, parkValue,
    stats: {
      population, jobs, capacity, powered: Math.min(served, capacity), unpowered, unroaded,
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

/** RCI demand in -100..100. Positive means the town wants more of that zone. */
export function computeDemand(population, jobs, resTiles, comTiles, indTiles) {
  // Pioneers always want a few homes; after that, homes follow jobs.
  const res = clamp(30 + Math.round((jobs - population) * 0.5), -100, 100);
  // Each shop tile serves about 12 people, each workshop tile about 20.
  const com = clamp(20 + Math.round((population - comTiles * JOBS.com * 2) * 2), -100, 100);
  const ind = clamp(20 + Math.round((population - indTiles * JOBS.ind * 2) * 1.5), -100, 100);
  void resTiles;
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
 * Advance one month: zones grow or shrink, the ledger settles, lessons update.
 *
 * Demand is re-read after every tile changes, in reading order, so growth
 * stops the moment the town has what it asked for. One shared pre-month
 * demand applied to every tile at once made large towns swing between
 * two populations forever.
 */
export function tick(city) {
  const before = analyze(city);
  let population = before.stats.population;
  let jobs = before.stats.jobs;
  const resTiles = count(city, 'res'); const comTiles = count(city, 'com'); const indTiles = count(city, 'ind');
  const tiles = city.tiles.map((tile, i) => {
    if (!TILES[tile.id].zone) return tile;
    const alive = before.powered[i] && before.roaded[i];
    const smoky = tile.id === 'res' && before.pollution[i] > 0;
    let level = tile.level;
    if (!alive) level = Math.max(0, level - 1);
    else if (smoky && level > 1) level -= 1;                       // a home in the smoke loses a level a month, down to one
    else {
      const demand = computeDemand(population, jobs, resTiles, comTiles, indTiles)[tile.id];
      if (demand > 0 && level < MAX_LEVEL && !(smoky && level >= 1)) level += 1;
      else if (demand < -40 && level > 0) level -= 1;
    }
    const delta = level - tile.level;
    if (delta !== 0) {
      if (tile.id === 'res') population += delta * RESIDENTS_PER_LEVEL;
      else jobs += delta * JOBS[tile.id];
    }
    return level === tile.level ? tile : { id: tile.id, level };
  });
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
  if (stats.unpowered > 0) parts.push(`${stats.unpowered} zones in the dark`);
  if (stats.unroaded > 0) parts.push(`${stats.unroaded} zones without a road`);
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
    name: String(data.name || 'Gridtown').replace(/[\u0000-\u001f]/g, '').slice(0, 40) || 'Gridtown',
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
    population: city.stats.population, jobs: city.stats.jobs, happiness: city.stats.happiness,
    lessons: `${city.lessons.length}/${LESSONS.length}`,
    tiles: { road: count(city, 'road'), res: count(city, 'res'), com: count(city, 'com'), ind: count(city, 'ind'), park: count(city, 'park'), power: count(city, 'power') },
  };
}
