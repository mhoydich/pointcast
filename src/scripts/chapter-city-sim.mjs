// CHAPTER CITY — the simulation. Pure, seeded and DOM-free so it can be
// tested in Node. A "chapter" is one simulated year of twelve months.

export const W = 24;
export const H = 16;

export const TOOLS = {
  road:   { label: 'Road', short: 'Road',          cost: 10,  upkeep: 0.4, key: '1' },
  res:    { label: 'Homes', short: 'Homes',         cost: 20,  upkeep: 0,   key: '2', zone: true },
  com:    { label: 'Shops', short: 'Shops',         cost: 25,  upkeep: 0,   key: '3', zone: true },
  ind:    { label: 'Industry', short: 'Works',      cost: 25,  upkeep: 0,   key: '4', zone: true },
  park:   { label: 'Park', short: 'Park',          cost: 45,  upkeep: 1,   key: '5' },
  power:  { label: 'Power plant', short: 'Power',   cost: 600, upkeep: 22,  key: '6', service: true },
  water:  { label: 'Water tower', short: 'Water',   cost: 280, upkeep: 10,  key: '7', service: true },
  school: { label: 'School', short: 'School',        cost: 400, upkeep: 16,  key: '8', service: true },
  clinic: { label: 'Clinic', short: 'Clinic',        cost: 420, upkeep: 18,  key: '9', service: true },
  fire:   { label: 'Fire station', short: 'Fire',  cost: 320, upkeep: 12,  key: '0', service: true },
  police: { label: 'Watch house', short: 'Watch',   cost: 320, upkeep: 12,  key: '-', service: true },
  doze:   { label: 'Bulldoze', short: 'Clear',      cost: 5,   upkeep: 0,   key: 'x' },
  // landmarks: one of each, unlocked when the town is big enough
  lighthouse: { label: 'Lighthouse', short: 'Light', cost: 900,  upkeep: 6,  key: 'q', landmark: true, unlock: 300,  coastal: true },
  pier:       { label: 'Ferry pier', short: 'Pier',  cost: 1400, upkeep: 10, key: 'w', landmark: true, unlock: 800,  coastal: true },
  college:    { label: 'College',    short: 'Uni',     cost: 2500, upkeep: 28, key: 'e', landmark: true, unlock: 1300 },
  stadium:    { label: 'Stadium',    short: 'Arena',   cost: 3000, upkeep: 24, key: 'r', landmark: true, unlock: 2000 },
};

export const LANDMARKS = Object.keys(TOOLS).filter(k => TOOLS[k].landmark);
const touchesSea = (state, i) => {
  const x = i % W, y = Math.floor(i / W);
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx >= 0 && ny >= 0 && nx < W && ny < H && state.tiles[ny * W + nx].terrain === 'water';
  });
};
export const landmarkUnlocked = (state, k) => !!state.flags[`unlocked_${k}`] || (state.stats?.pop || 0) >= TOOLS[k].unlock;

export const POP = [0, 30, 95, 250];
export const JOBS_C = [0, 14, 45, 120];
export const JOBS_I = [0, 24, 70, 150];
const RADIUS = 6;

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------- rng ----------
export function rngFrom(seed) {
  let a = seed >>> 0 || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.state = () => a;
  return next;
}
export const pick = (rng, list) => list[Math.floor(rng() * list.length) % list.length];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const idx = (x, y) => y * W + x;

// ---------- map ----------
export function makeMap(seed) {
  const rng = rngFrom(seed * 7919 + 13);
  const tiles = [];
  // a wobbly western coastline, a creek, and a few groves
  const coast = [];
  let c = 3 + Math.floor(rng() * 2);
  for (let y = 0; y < H; y++) { c = clamp(c + Math.round((rng() - 0.5) * 2), 2, 5); coast.push(c); }
  const creekY = 5 + Math.floor(rng() * 6);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let terrain = 'grass';
      if (x < coast[y]) terrain = 'water';
      else if (x === coast[y]) terrain = 'sand';
      else if (y === creekY && x < coast[y] + 7) terrain = 'water';
      tiles.push({ terrain, t: null, lvl: 0, age: 0 });
    }
  }
  for (let g = 0; g < 7; g++) {
    const gx = 9 + Math.floor(rng() * (W - 10)), gy = Math.floor(rng() * H);
    const r = 1 + Math.floor(rng() * 2);
    for (let y = gy - r; y <= gy + r; y++) for (let x = gx - r; x <= gx + r; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const tile = tiles[idx(x, y)];
      if (tile.terrain === 'grass' && rng() < 0.7) tile.terrain = 'trees';
    }
  }
  return tiles;
}

export function newGame({ seed = Date.now() % 1e9, name = 'Halcyon' } = {}) {
  return {
    v: 1, seed, name: cleanName(name), year: 1, month: 0,
    funds: 6000, tax: 7, approval: 58,
    tiles: makeMap(seed),
    stats: emptyStats(),
    history: [],
    chapters: [],
    yearLog: [],
    built: {},
    modifiers: [],
    flags: {},
    choices: [],
    pending: null,
    district: new Array(W * H).fill(null),
    districtNames: {},
    over: false,
    rng: seed >>> 0,
  };
}

export const cleanName = s => String(s || '').replace(/[^\p{L}\p{N}' .-]/gu, '').trim().slice(0, 24) || 'Halcyon';

function emptyStats() {
  return { pop: 0, jobsC: 0, jobsI: 0, workers: 0, unemployment: 0, demand: { r: 0.3, c: 0, i: 0.6 }, power: { cap: 0, use: 0 }, water: { cap: 0, use: 0 }, pollution: 0, crime: 0, landValue: 30, income: 0, expenses: 0, happiness: 58 };
}

// ---------- building ----------
export function canBuild(state, tool, i) {
  const tile = state.tiles[i];
  if (!tile || state.over) return { ok: false, why: 'Nothing to build on.' };
  const def = TOOLS[tool];
  if (!def) return { ok: false, why: 'Unknown tool.' };
  if (tool === 'doze') {
    if (!tile.t && tile.terrain !== 'trees') return { ok: false, why: 'Nothing to clear.' };
    return { ok: true, cost: def.cost };
  }
  if (tile.terrain === 'water') return { ok: false, why: 'That is the sea.' };
  if (tile.t === tool) return { ok: false, why: 'Already there.' };
  if (tile.t) return { ok: false, why: 'Bulldoze it first.' };
  if (def.landmark) {
    if (!landmarkUnlocked(state, tool)) return { ok: false, why: `${def.label} unlocks at ${def.unlock.toLocaleString('en-US')} people.` };
    if (state.tiles.some(t => t.t === tool)) return { ok: false, why: `${state.name} already has a ${def.label.toLowerCase()}.` };
    if (def.coastal && !touchesSea(state, i)) return { ok: false, why: `A ${def.label.toLowerCase()} has to touch the sea.` };
  }
  const cost = def.cost + (tile.terrain === 'trees' ? 8 : 0);
  if (state.funds < cost) return { ok: false, why: 'Not enough money in the treasury.' };
  return { ok: true, cost };
}

export function build(state, tool, i) {
  const check = canBuild(state, tool, i);
  if (!check.ok) return check;
  const tile = state.tiles[i];
  state.funds -= check.cost;
  if (tool === 'doze') {
    if (tile.t) state.built.doze = (state.built.doze || 0) + 1;
    tile.t = null; tile.lvl = 0; tile.age = 0;
    if (tile.terrain === 'trees') tile.terrain = 'grass';
    return check;
  }
  if (tile.terrain === 'trees') tile.terrain = 'grass';
  tile.t = tool; tile.lvl = 0; tile.age = 0;
  state.built[tool] = (state.built[tool] || 0) + 1;
  if (!state.flags[`first_${tool}`]) state.flags[`first_${tool}`] = state.year;
  return check;
}

// ---------- analysis ----------
const neighbors4 = i => {
  const x = i % W, y = Math.floor(i / W), out = [];
  if (x > 0) out.push(i - 1); if (x < W - 1) out.push(i + 1);
  if (y > 0) out.push(i - W); if (y < H - 1) out.push(i + W);
  return out;
};

function field(state, sources, radius, strengthOf) {
  const out = new Float32Array(W * H);
  for (const s of sources) {
    const sx = s % W, sy = Math.floor(s / W), str = strengthOf(s);
    for (let y = Math.max(0, sy - radius); y <= Math.min(H - 1, sy + radius); y++) {
      for (let x = Math.max(0, sx - radius); x <= Math.min(W - 1, sx + radius); x++) {
        const d = Math.abs(x - sx) + Math.abs(y - sy);
        if (d > radius) continue;
        out[idx(x, y)] += str * (1 - d / (radius + 1));
      }
    }
  }
  return out;
}

export function analyze(state) {
  const { tiles } = state;
  const of = t => tiles.map((tile, i) => (tile.t === t ? i : -1)).filter(i => i >= 0);
  const roads = new Set(of('road'));
  const access = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const x = i % W, y = Math.floor(i / W);
    outer: for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > 2) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (roads.has(idx(nx, ny))) { access[i] = 1; break outer; }
    }
  }
  const cover = {};
  for (const s of ['school', 'clinic', 'fire', 'police']) cover[s] = field(state, of(s), RADIUS, () => 1);
  const college = field(state, of('college'), 10, () => 1.5);
  for (let i = 0; i < W * H; i++) cover.school[i] += college[i];
  const parkField = field(state, of('park'), 3, () => 1);
  const pollution = field(state, tiles.map((t, i) => (t.t === 'ind' || t.t === 'power' ? i : -1)).filter(i => i >= 0), 3,
    i => (tiles[i].t === 'power' ? 7 : 1.5 + tiles[i].lvl * 1.5));
  for (let i = 0; i < W * H; i++) {
    pollution[i] = Math.max(0, pollution[i] - parkField[i] * 2.5 - (tiles[i].terrain === 'trees' ? 1 : 0) - (state.flags.cleanAir ? 1 : 0));
  }
  const waterNear = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const x = i % W, y = Math.floor(i / W);
    for (let dy = -3; dy <= 3 && !waterNear[i]; dy++) for (let dx = -3; dx <= 3; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && tiles[idx(nx, ny)].terrain === 'water' && Math.abs(dx) + Math.abs(dy) <= 3) { waterNear[i] = 1; break; }
    }
  }
  const density = field(state, tiles.map((t, i) => ((t.t === 'res' || t.t === 'com') && t.lvl ? i : -1)).filter(i => i >= 0), 3, i => tiles[i].lvl);
  const crime = new Float32Array(W * H);
  const land = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    crime[i] = Math.max(0, density[i] * 0.5 - Math.min(1, cover.police[i]) * 6 + (state.flags.casino ? 1.5 : 0));
    land[i] = clamp(28 + waterNear[i] * 18 + Math.min(1, parkField[i]) * 16
      + (Math.min(1, cover.school[i]) + Math.min(1, cover.clinic[i])) * 7
      - pollution[i] * 4 - crime[i] * 2.5 + (state.flags.museum ? 3 : 0), 0, 100);
  }
  return { access, cover, pollution, crime, land, parkField, waterNear };
}

export function totals(state) {
  let pop = 0, jobsC = 0, jobsI = 0, zones = 0, services = 0;
  const count = {};
  for (const t of state.tiles) {
    if (!t.t) continue;
    count[t.t] = (count[t.t] || 0) + 1;
    if (t.t === 'res') pop += POP[t.lvl];
    if (t.t === 'com') jobsC += JOBS_C[t.lvl];
    if (t.t === 'ind') jobsI += JOBS_I[t.lvl];
    if (TOOLS[t.t].zone) zones += t.lvl;
    if (TOOLS[t.t].service || TOOLS[t.t].landmark) services++;
  }
  return { pop, jobsC, jobsI, zones, services, count };
}

const modifier = (state, key) => state.modifiers.filter(m => m.key === key).reduce((s, m) => s + m.value, 0);

// ---------- one month ----------
export function stepMonth(state) {
  if (state.over) return state;
  const rng = rngFrom(state.rng);
  const a = analyze(state);
  const before = totals(state);
  const powerCap = (before.count.power || 0) * 130;
  const powerUse = before.zones + before.services * 2;
  const waterCap = (before.count.water || 0) * 160;
  const waterUse = before.zones;
  const powerRatio = powerUse ? Math.min(1, powerCap / powerUse) : (powerCap ? 1 : 0);
  const waterRatio = waterUse ? Math.min(1, waterCap / waterUse) : (waterCap ? 1 : 0);

  const workers = before.pop * 0.55;
  const jobs = before.jobsC + before.jobsI;
  const taxDrag = (state.tax - 7) * 0.07;
  const has = k => (before.count[k] || 0) > 0;
  const lure = (state.approval - 50) / 120 + modifier(state, 'demand') + (has('pier') ? 0.08 : 0);
  const d = {
    r: clamp((jobs * 1.25 + 40 - workers) / (workers + 60) + lure - taxDrag, -1, 1),
    c: clamp((before.pop * 0.24 - before.jobsC) / (before.jobsC + 30) + modifier(state, 'demand') + (has('stadium') ? 0.1 : 0) + (has('pier') ? 0.05 : 0) - taxDrag, -1, 1),
    i: clamp((before.pop * 0.3 + 70 - before.jobsI) / (before.jobsI + 60) + modifier(state, 'demand') + modifier(state, 'industry') - taxDrag, -1, 1),
  };

  // grow and decline
  const order = state.tiles.map((_, i) => i).filter(i => TOOLS[state.tiles[i].t]?.zone);
  for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
  for (const i of order) {
    const tile = state.tiles[i];
    tile.age++;
    const dem = tile.t === 'res' ? d.r : tile.t === 'com' ? d.c : d.i;
    const powered = rng() < powerRatio;
    const watered = rng() < waterRatio;
    const land = a.land[i];
    const max = !a.access[i] || !powered ? 0
      : !watered ? 1
      : tile.t === 'res' && (land < 45 || a.cover.school[i] < 0.2) ? 2
      : tile.t === 'com' && land < 40 ? 2
      : 3;
    const upChance = 0.08 + dem * 0.28 + (land - 40) / 400;
    if (tile.lvl < max && dem > -0.05 && rng() < upChance) tile.lvl++;
    else if (tile.lvl > max && rng() < 0.35) tile.lvl--;
    else if (tile.lvl > 0 && (dem < -0.45 || (tile.t === 'res' && a.pollution[i] > 6) || a.crime[i] > 7) && rng() < 0.08) tile.lvl--;
  }

  // events
  const month = state.month;
  const log = e => state.yearLog.push({ month, ...e });
  const lit = state.tiles.map((t, i) => (TOOLS[t.t]?.zone && t.lvl ? i : -1)).filter(i => i >= 0);
  const unprotected = lit.filter(i => a.cover.fire[i] < 0.25);
  if (unprotected.length && rng() < Math.min(0.14, 0.012 * unprotected.length / 4)) {
    const start = pick(rng, unprotected);
    const burned = [start];
    for (const n of neighbors4(start)) if (state.tiles[n].t && state.tiles[n].t !== 'road' && rng() < 0.45) burned.push(n);
    burned.forEach(n => { const t = state.tiles[n]; t.t = null; t.lvl = 0; t.age = 0; });
    log({ kind: 'fire', tile: start, size: burned.length, district: state.district[start] });
  } else if (lit.length && unprotected.length < lit.length && rng() < 0.03) {
    log({ kind: 'fireSaved', tile: pick(rng, lit.filter(i => a.cover.fire[i] >= 0.25)) });
  }
  if (powerUse > 0 && powerRatio < 1 && rng() < 0.5) log({ kind: 'blackout', ratio: powerRatio });
  if (waterUse > 0 && waterRatio < 1 && rng() < 0.3) log({ kind: 'drought', ratio: waterRatio });
  if ((month >= 9 || month <= 1) && rng() < 0.05) {
    const coast = state.tiles.map((t, i) => (t.t && neighbors4(i).some(n => state.tiles[n].terrain === 'water') ? i : -1)).filter(i => i >= 0);
    coast.forEach(i => { if (state.tiles[i].lvl > 0 && rng() < (has('lighthouse') ? 0.2 : 0.5)) state.tiles[i].lvl--; });
    log({ kind: 'storm', hit: coast.length });
  }
  const avgCrime = lit.length ? lit.reduce((s, i) => s + a.crime[i], 0) / lit.length : 0;
  if (avgCrime > 2.5 && rng() < 0.1) log({ kind: 'crime', level: avgCrime });
  if (state.approval > 64 && (before.count.park || 0) >= 2 && (month === 5 || month === 6) && rng() < 0.6) log({ kind: 'festival' });
  if (before.count.road > 6 && before.zones / Math.max(1, before.count.road) > 4.5 && rng() < 0.1) log({ kind: 'traffic' });
  if (state.tax >= 12 && rng() < 0.1) log({ kind: 'taxRevolt' });
  if (d.r > 0.4 && d.c > 0.2 && d.i > 0.2 && before.pop > 200 && rng() < 0.12) log({ kind: 'boom' });
  if (state.year >= 4 && !state.flags.serpentGone && state.flags.serpentYear !== state.year && rng() < 0.008 + (state.flags.serpentSeen ? 0.004 : 0)) {
    state.flags.serpentYear = state.year;
    const coast = state.tiles.map((t, i) => (t.t && neighbors4(i).some(n => state.tiles[n].terrain === 'water') ? i : -1)).filter(i => i >= 0);
    const hit = coast.filter(() => rng() < 0.35).slice(0, 5);
    hit.forEach(i => { const t = state.tiles[i]; t.t = null; t.lvl = 0; });
    state.flags.serpentSeen = (state.flags.serpentSeen || 0) + 1;
    log({ kind: 'serpent', hit: hit.length, nth: state.flags.serpentSeen });
  }
  if (state.flags.filmCrew === state.year && month === 3) log({ kind: 'film' });
  if (state.flags.strikeRisk && rng() < 0.15) { log({ kind: 'strike' }); state.flags.strikeRisk = false; }

  // money
  const after = totals(state);
  const income = state.tax * (after.pop * 0.012 + (after.jobsC + after.jobsI) * 0.009) + (state.flags.museum ? 25 : 0) + (state.flags.casino ? 40 : 0) + (after.count.lighthouse ? 12 : 0) + (after.count.pier ? 30 : 0) + (after.count.stadium ? 45 : 0) + modifier(state, 'income');
  let expenses = 0;
  for (const t of state.tiles) if (t.t) expenses += TOOLS[t.t].upkeep;
  expenses *= 1 + modifier(state, 'upkeep');
  expenses += modifier(state, 'loan');
  state.funds = Math.round(state.funds + income - expenses);

  // mood
  const resTiles = state.tiles.map((t, i) => (t.t === 'res' && t.lvl ? i : -1)).filter(i => i >= 0);
  const avg = f => (resTiles.length ? resTiles.reduce((s, i) => s + Math.min(1, f[i]), 0) / resTiles.length : 0.5);
  const unemployment = after.pop ? clamp((after.pop * 0.55 - (after.jobsC + after.jobsI)) / (after.pop * 0.55), 0, 1) : 0;
  const polRes = resTiles.length ? resTiles.reduce((s, i) => s + a.pollution[i], 0) / resTiles.length : 0;
  const happiness = clamp(54
    + (avg(a.cover.school) + avg(a.cover.clinic) + avg(a.cover.fire) + avg(a.cover.police)) * 7
    + Math.min(1, avg(a.parkField)) * 8
    - polRes * 3.5 - avgCrime * 2.5 - (state.tax - 7) * 3.2 - unemployment * 22
    - (powerRatio < 1 ? 8 : 0) - (waterRatio < 1 ? 5 : 0)
    + (after.count.stadium ? 4 : 0) + (after.count.lighthouse ? 1 : 0) + (after.count.college ? 2 : 0)
    + modifier(state, 'approval'), 0, 100);
  state.approval = Math.round(clamp(state.approval + (happiness - state.approval) * 0.18, 0, 100) * 10) / 10;

  state.stats = {
    pop: after.pop, jobsC: after.jobsC, jobsI: after.jobsI, workers: Math.round(after.pop * 0.55),
    unemployment, demand: d, power: { cap: powerCap, use: powerUse }, water: { cap: waterCap, use: waterUse },
    pollution: polRes, crime: avgCrime, landValue: resTiles.length ? resTiles.reduce((s, i) => s + a.land[i], 0) / resTiles.length : 30,
    income: Math.round(income), expenses: Math.round(expenses), happiness, count: after.count,
  };
  state.month++;
  state.rng = rng.state();
  return state;
}

// ---------- districts ----------
const PREFIX = ['Lamplight', 'Brine', 'Gull', 'Saltwick', 'Copper', 'Juniper', 'Harbor', 'Tidewater', 'Ember', 'Kelp', 'Lantern', 'Marigold', 'Pelican', 'Driftwood', 'Sunday', 'Orchard', 'Fogbell', 'Larkspur', 'Anchor', 'Clementine'];
const SUFFIX = { res: ['Row', 'Heights', 'Gardens', 'Terrace', 'Lane', 'Commons', 'Hill'], com: ['Market', 'Arcade', 'Square', 'Strand', 'Exchange'], ind: ['Works', 'Yards', 'Flats', 'Docks', 'Mills'] };

export function nameDistricts(state) {
  const rng = rngFrom(state.seed + state.year * 31);
  const seen = new Uint8Array(W * H);
  const used = new Set(Object.values(state.districtNames));
  const next = new Array(W * H).fill(null);
  for (let i = 0; i < W * H; i++) {
    const kind = state.tiles[i].t;
    if (seen[i] || !TOOLS[kind]?.zone) continue;
    const cluster = [];
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const c = stack.pop();
      cluster.push(c);
      for (const n of neighbors4(c)) if (!seen[n] && state.tiles[n].t === kind) { seen[n] = 1; stack.push(n); }
    }
    if (cluster.length < 4) continue;
    const votes = {};
    for (const c of cluster) if (state.district[c]) votes[state.district[c]] = (votes[state.district[c]] || 0) + 1;
    let id = Object.entries(votes).sort((x, y) => y[1] - x[1])[0]?.[0];
    if (!id) {
      let name, tries = 0;
      do { name = `${pick(rng, PREFIX)} ${pick(rng, SUFFIX[kind])}`; tries++; } while (used.has(name) && tries < 40);
      used.add(name);
      id = `d${i}y${state.year}`;
      state.districtNames[id] = name;
    }
    cluster.forEach(c => { next[c] = id; });
  }
  state.district = next;
  return state;
}

export function districtsByKind(state) {
  const out = { res: [], com: [], ind: [] };
  const sizes = {};
  state.district.forEach((id, i) => { if (id) sizes[id] = (sizes[id] || { n: 0, kind: state.tiles[i].t, lvl: 0 }); if (id) { sizes[id].n++; sizes[id].lvl += state.tiles[i].lvl; } });
  for (const [id, s] of Object.entries(sizes)) out[s.kind]?.push({ id, name: state.districtNames[id], size: s.n, lvl: s.lvl });
  for (const k of Object.keys(out)) out[k].sort((a, b) => b.lvl - a.lvl);
  return out;
}

// ---------- dilemmas ----------
export const DILEMMAS = {
  casino: {
    when: s => s.year >= 2 && !s.flags.casino,
    title: 'Wexley’s pier',
    text: 'Augustin Wexley wants to build a casino on a new pier. He will pay the city 2,500 up front and a share of the takings. Mei Okafor has already drafted two editorials, one for each answer.',
    a: { label: 'Build the pier', effect: s => { s.funds += 2500; s.flags.casino = s.year; } },
    b: { label: 'Turn him down', effect: s => { s.modifiers.push({ key: 'approval', value: 4, until: s.year + 1 }); } },
  },
  library: {
    when: s => s.year >= 2 && s.year <= 8 && !s.flags.library,
    title: 'Juniper’s petition',
    text: 'Juniper Bell has collected 212 signatures, most of them legible, asking for a public library. The clerk says it would cost 500.',
    a: { label: 'Fund the library', cost: 500, effect: s => { s.funds -= 500; s.flags.library = s.year; s.modifiers.push({ key: 'approval', value: 3, until: s.year + 2 }); } },
    b: { label: 'Not this year', effect: s => { s.flags.libraryDeclined = s.year; } },
  },
  exemption: {
    when: s => (s.stats.count?.ind || 0) >= 4 && !s.flags.exemption && !s.flags.cleanAir,
    title: 'The smokestack letter',
    text: 'The factory owners ask to be excused from the new emissions rules. They promise jobs. The gulls, consulted informally, have no comment.',
    a: { label: 'Grant the exemption', effect: s => { s.flags.exemption = s.year; s.modifiers.push({ key: 'industry', value: 0.25, until: s.year + 3 }); } },
    b: { label: 'Keep the rules', effect: s => { s.flags.cleanAir = s.year; s.modifiers.push({ key: 'industry', value: -0.1, until: s.year + 1 }); } },
  },
  film: {
    when: s => s.stats.pop > 300 && !s.flags.filmCrew,
    title: 'Lights, camera',
    text: 'A film studio wants to shoot a seaside thriller here next spring. They offer 900 and promise to put the town in the credits, near the end.',
    a: { label: 'Roll cameras', effect: s => { s.funds += 900; s.flags.filmCrew = s.year + 1; } },
    b: { label: 'Keep the town quiet', effect: s => { s.flags.filmCrew = -1; } },
  },
  bread: {
    when: s => (s.stats.count?.com || 0) >= 3 && !s.flags.breadFestival,
    title: 'Tomas and the loaf',
    text: 'Tomas Ferreira wants to bake the longest loaf on the coast, across the main road, for one afternoon. He needs 250 for permits and a very long table.',
    a: { label: 'Sponsor the loaf', cost: 250, effect: s => { s.funds -= 250; s.flags.breadFestival = s.year + 1; s.modifiers.push({ key: 'approval', value: 5, until: s.year + 1 }); } },
    b: { label: 'Too much bread', effect: s => { s.flags.breadFestival = -1; } },
  },
  rail: {
    when: s => s.stats.pop > 800 && !s.flags.rail,
    title: 'The rail link',
    text: 'The regional authority will extend the coastal railway to town if the city pays 1,500 toward the station. Trains bring people, and people bring luggage.',
    a: { label: 'Build the station', cost: 1500, effect: s => { s.funds -= 1500; s.flags.rail = s.year; s.modifiers.push({ key: 'demand', value: 0.15, until: 9999 }); } },
    b: { label: 'Stay a road town', effect: s => { s.flags.rail = -1; } },
  },
  serpentMuseum: {
    when: s => s.flags.serpentSeen && !s.flags.museum && !s.flags.serpentGone,
    title: 'What to do about Wendell',
    text: 'The thing in the bay has a name now, Wendell, and a fan club. Some want a museum. Others want a harpoon.',
    a: { label: 'Open a serpent museum', cost: 600, effect: s => { s.funds -= 600; s.flags.museum = s.year; } },
    b: { label: 'Ask it to leave', effect: s => { s.flags.serpentGone = s.year; s.modifiers.push({ key: 'approval', value: -2, until: s.year + 1 }); } },
  },
  loan: {
    when: s => s.funds < 600 && !s.flags.loan,
    title: 'The bank’s offer',
    text: 'The treasury is nearly empty. The Coastal Savings Bank offers 3,000 now, repaid at 45 a month for ten years. Odile Marsh has underlined the word “ten” twice.',
    a: { label: 'Take the loan', effect: s => { s.funds += 3000; s.flags.loan = s.year; s.modifiers.push({ key: 'loan', value: 45, until: s.year + 10 }); } },
    b: { label: 'Tighten belts', effect: s => { s.modifiers.push({ key: 'upkeep', value: -0.3, until: s.year + 1 }, { key: 'approval', value: -6, until: s.year + 1 }); } },
  },
  union: {
    when: s => s.year >= 3 && (s.stats.count?.school || 0) + (s.stats.count?.clinic || 0) + (s.stats.count?.fire || 0) >= 2 && !s.flags.union,
    title: 'The city staff',
    text: 'Nurses, teachers and firefighters ask for a raise. Their letter is polite and unanimous and arrived with cake.',
    a: { label: 'Give the raise', effect: s => { s.flags.union = s.year; s.modifiers.push({ key: 'upkeep', value: 0.12, until: 9999 }, { key: 'approval', value: 4, until: s.year + 2 }); } },
    b: { label: 'Hold the line', effect: s => { s.flags.union = -s.year; s.flags.strikeRisk = true; } },
  },
  capsule: {
    when: s => s.year >= 3 && !s.flags.capsule,
    title: 'The time capsule',
    text: 'The schoolchildren want to bury a time capsule under the town square, to be opened in ten years. Contents are confidential.',
    a: { label: 'Bury it', effect: s => { s.flags.capsule = s.year; } },
    b: { label: 'Maybe next year', effect: () => {} },
  },
  gulls: {
    when: s => s.year >= 2 && !s.flags.gulls && (s.stats.count?.com || 0) >= 2,
    title: 'The gull situation',
    text: 'Gulls have taken the boardwalk. They are organised and have eaten three wedding cakes. A falconer offers her services for 300.',
    a: { label: 'Hire the falconer', cost: 300, effect: s => { s.funds -= 300; s.flags.gulls = 'falcon'; s.modifiers.push({ key: 'approval', value: 3, until: s.year + 1 }); } },
    b: { label: 'Coexist', effect: s => { s.flags.gulls = 'peace'; } },
  },
};

export function chooseDilemma(state) {
  const rng = rngFrom(state.seed + state.year * 101);
  const recent = new Set(state.choices.map(c => c.key));
  const open = Object.keys(DILEMMAS).filter(k => !recent.has(k) && DILEMMAS[k].when(state));
  const urgent = open.includes('loan') ? 'loan' : null;
  return urgent || (open.length ? pick(rng, open) : null);
}

export function resolveDilemma(state, option) {
  const key = state.pending;
  const d = DILEMMAS[key];
  if (!d || (option !== 'a' && option !== 'b')) return false;
  const opt = d[option];
  if (opt.cost && state.funds < opt.cost) return false;
  opt.effect(state);
  state.choices.push({ key, option, year: state.year });
  state.pending = null;
  return true;
}

// ---------- snapshots ----------
// One character per tile, so every chapter can carry a picture of the town.
const SNAP_TERRAIN = { water: '~', sand: ':', grass: '.', trees: 't' };
const SNAP_BUILT = { road: '#', park: 'p', power: 'P', water: 'W', school: 'S', clinic: 'C', fire: 'F', police: 'K', lighthouse: 'L', pier: 'J', college: 'U', stadium: 'D' };
const SNAP_ZONE = { res: 'abcd', com: 'efgh', ind: 'ijkl' };
export function snapshot(state) {
  return state.tiles.map(t => (!t.t ? SNAP_TERRAIN[t.terrain] : SNAP_ZONE[t.t] ? SNAP_ZONE[t.t][t.lvl] : SNAP_BUILT[t.t] || '.')).join('');
}
export function readSnapshot(snap) {
  const zone = Object.fromEntries(Object.entries(SNAP_ZONE).flatMap(([k, s]) => [...s].map((c, lvl) => [c, { t: k, lvl }])));
  const built = Object.fromEntries(Object.entries(SNAP_BUILT).map(([k, c]) => [c, k]));
  const terrain = Object.fromEntries(Object.entries(SNAP_TERRAIN).map(([k, c]) => [c, k]));
  return [...String(snap || '')].slice(0, W * H).map(c => zone[c] || (built[c] ? { t: built[c], lvl: 0 } : { terrain: terrain[c] || 'grass' }));
}

// ---------- the year ----------
// Runs whatever months remain in the year, names districts and returns the
// year's record. The story module turns that record into a chapter.
export function finishYear(state) {
  while (state.month < 12) stepMonth(state);
  nameDistricts(state);
  const unlockedNow = LANDMARKS.filter(k => !state.flags[`unlocked_${k}`] && state.stats.pop >= TOOLS[k].unlock);
  unlockedNow.forEach(k => { state.flags[`unlocked_${k}`] = state.year; });
  const prev = state.history[state.history.length - 1] || { pop: 0, funds: 6000, approval: 58, jobs: 0 };
  const record = {
    year: state.year,
    pop: state.stats.pop,
    jobs: state.stats.jobsC + state.stats.jobsI,
    funds: state.funds,
    approval: state.approval,
    tax: state.tax,
    prev,
    stats: JSON.parse(JSON.stringify(state.stats)),
    log: state.yearLog.slice(),
    built: { ...state.built },
    lastChoice: state.choices.find(c => c.year === state.year) || null,
    election: state.year % 4 === 0,
    unlocked: unlockedNow,
    snap: snapshot(state),
    districts: districtsByKind(state),
  };
  if (record.election) {
    record.won = state.approval >= 40;
    if (!record.won) state.over = 'election';
  }
  if (state.funds < -1500) { state.over = 'bankrupt'; record.bankrupt = true; }
  state.history.push({ year: state.year, pop: record.pop, funds: record.funds, approval: record.approval, jobs: record.jobs });
  return record;
}

export function startNextYear(state) {
  state.year++;
  state.month = 0;
  state.yearLog = [];
  state.built = {};
  state.modifiers = state.modifiers.filter(m => m.until >= state.year);
  state.pending = state.over ? null : chooseDilemma(state);
  return state;
}
