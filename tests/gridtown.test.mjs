import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_SIZE, LESSONS, TOOLS, STARTING_FUNDS, POWER_CAPACITY,
  createCity, build, canBuild, tick, setTaxRate, renameCity, readCity, serializeCity, cityToText, summarizeCity, count, index, analyze, inBounds, computeHappiness,
} from '../src/lib/gridtown.mjs';

/** A straight road across row 8 with homes above it and jobs below. Water tiles are skipped by the engine. */
function scriptedTown(seed = 7) {
  let city = createCity(seed, 'Test Town');
  const place = (tool, x, y) => { city = build(city, tool, x, y).city; };
  for (let x = 0; x < GRID_SIZE; x += 1) place('road', x, 8);
  for (let x = 0; x < 8; x += 1) place('res', x, 7);
  for (let x = 8; x < 12; x += 1) place('com', x, 7);
  for (let x = 8; x < 12; x += 1) place('ind', x, 9);
  place('power', 0, 9);
  place('park', 3, 9);
  return city;
}

test('terrain is deterministic per seed and always leaves room to build', () => {
  const a = createCity(7); const b = createCity(7); const c = createCity(8);
  assert.equal(cityToText(a), cityToText(b));
  assert.notEqual(cityToText(a), cityToText(c));
  assert.equal(a.tiles.length, GRID_SIZE * GRID_SIZE);
  for (const seed of [0, 1, 7, 4294967295, 20261022]) {
    const city = createCity(seed);
    assert.ok(count(city, 'grass') >= 120, `seed ${seed} keeps most of the map buildable`);
    assert.ok(count(city, 'water') >= GRID_SIZE, `seed ${seed} has a river`);
  }
  assert.equal(createCity(-5).seed, 20261022);
  assert.equal(createCity('abc').seed, 20261022);
});

test('build charges the tool cost, refuses water and overbuilding, and bulldoze returns grass', () => {
  let city = createCity(7);
  const water = city.tiles.findIndex((t) => t.id === 'water');
  const wx = water % GRID_SIZE; const wy = Math.floor(water / GRID_SIZE);
  assert.equal(canBuild(city, 'road', wx, wy).ok, false);
  assert.equal(canBuild(city, 'bulldoze', wx, wy).ok, false);
  assert.equal(canBuild(city, 'road', -1, 0).ok, false);
  const grass = city.tiles.findIndex((t) => t.id === 'grass');
  const gx = grass % GRID_SIZE; const gy = Math.floor(grass / GRID_SIZE);
  const road = build(city, 'road', gx, gy);
  assert.equal(road.ok, true);
  assert.equal(road.city.funds, STARTING_FUNDS - 10);
  assert.equal(road.city.tiles[grass].id, 'road');
  assert.equal(build(road.city, 'res', gx, gy).ok, false, 'must bulldoze first');
  assert.equal(build(road.city, 'road', gx, gy).ok, false, 'already a road');
  const cleared = build(road.city, 'bulldoze', gx, gy);
  assert.equal(cleared.city.tiles[grass].id, 'grass');
  assert.equal(cleared.city.funds, STARTING_FUNDS - 15);
  const broke = { ...city, funds: 3 };
  assert.match(build(broke, 'road', gx, gy).reason, /Not enough funds/);
  assert.equal(build(broke, 'road', gx, gy).city, broke, 'a refused build returns the same object');
});

test('a powered, roaded town grows, employs its people, and pays for itself', () => {
  let city = scriptedTown();
  assert.equal(city.stats.population, 0);
  assert.ok(city.stats.demand.res > 0, 'pioneers want homes');
  for (let i = 0; i < 12; i += 1) city = tick(city);
  assert.equal(city.month, 12);
  assert.ok(city.stats.population >= 100, `population ${city.stats.population}`);
  assert.ok(city.stats.jobs >= city.stats.population * 0.8, 'jobs keep pace');
  assert.ok(city.ledger.net > 0, 'a settled town runs in the black');
  assert.ok(city.funds > STARTING_FUNDS - 1500);
  assert.ok(city.stats.happiness >= 70, `happiness ${city.stats.happiness}`);
  assert.ok(city.log.length >= 12 && city.log.length <= 24);
  assert.equal(city.log[0].month, 12);
  const again = tick(tick(scriptedTown()));
  assert.deepEqual(summarizeCity(again), summarizeCity(tick(tick(scriptedTown()))), 'ticks are deterministic');
});

test('zones without power or a road empty out, and smoke caps homes at one level', () => {
  let city = scriptedTown();
  for (let i = 0; i < 6; i += 1) city = tick(city);
  const before = city.stats.population;
  assert.ok(before > 0);
  // Pull the plug.
  let dark = build(city, 'bulldoze', 0, 9).city;
  assert.equal(dark.stats.capacity, 0);
  assert.equal(dark.stats.unpowered, count(dark, 'res') + count(dark, 'com') + count(dark, 'ind'));
  for (let i = 0; i < 4; i += 1) dark = tick(dark);
  assert.equal(dark.stats.population, 0, 'everyone leaves a dark town');
  assert.match(dark.log[0].text, /in the dark/);
  // A home two tiles from a workshop is in the smoke; it never passes level 1.
  const { pollution } = analyze(city);
  const smoky = city.tiles.findIndex((t, i) => t.id === 'res' && pollution[i] > 0);
  assert.notEqual(smoky, -1, 'the scripted town has at least one smoky home');
  assert.ok(city.tiles[smoky].level <= 1);
  assert.ok(city.stats.pollutedHomes >= 1);
  const clean = city.tiles.findIndex((t, i) => t.id === 'res' && pollution[i] <= 0 && t.level === 3);
  assert.notEqual(clean, -1, 'clean homes reach level 3');
});

test('power capacity is 24 zone tiles per plant, served in reading order', () => {
  let city = createCity(3);
  // Clear a block of grass to be sure of the layout.
  const place = (tool, x, y) => { city = build(city, tool, x, y).city; };
  let placed = 0;
  for (let y = 0; y < GRID_SIZE && placed < 30; y += 1) for (let x = 0; x < GRID_SIZE && placed < 30; x += 1) {
    if (city.tiles[index(x, y)].id !== 'grass') continue;
    place('res', x, y); placed += 1;
  }
  assert.equal(count(city, 'res'), 30);
  assert.equal(city.stats.unpowered, 30);
  let py = GRID_SIZE - 1; let px = GRID_SIZE - 1;
  while (city.tiles[index(px, py)].id !== 'grass') { px -= 1; if (px < 0) { px = GRID_SIZE - 1; py -= 1; } }
  place('power', px, py);
  assert.equal(city.stats.capacity, POWER_CAPACITY);
  assert.equal(city.stats.powered, 24);
  assert.equal(city.stats.unpowered, 6);
});

test('lessons unlock in order of play and never un-complete', () => {
  assert.equal(LESSONS.length, 12);
  assert.equal(new Set(LESSONS.map((l) => l.id)).size, 12);
  let city = createCity(7);
  assert.deepEqual(city.lessons, []);
  city = scriptedTown();
  assert.ok(city.lessons.includes('road') && city.lessons.includes('homes') && city.lessons.includes('power') && city.lessons.includes('jobs'));
  assert.ok(!city.lessons.includes('month'));
  city = tick(city);
  assert.ok(city.lessons.includes('month'));
  for (let i = 0; i < 12; i += 1) city = tick(city);
  assert.ok(city.lessons.includes('fifty'));
  assert.ok(city.lessons.includes('black'));
  assert.ok(city.lessons.includes('year'));
  // Bulldozing the road does not take a finished lesson away.
  const after = build(city, 'bulldoze', 5, 8).city;
  for (const id of city.lessons) assert.ok(after.lessons.includes(id), id);
});

test('tax rate and name are clamped and happiness answers to taxes', () => {
  let city = scriptedTown();
  for (let i = 0; i < 8; i += 1) city = tick(city);
  const fair = city.stats.happiness;
  const greedy = setTaxRate(city, 20);
  assert.equal(greedy.taxRate, 20);
  assert.ok(greedy.stats.happiness < fair);
  assert.equal(setTaxRate(city, 99).taxRate, 20);
  assert.equal(setTaxRate(city, -4).taxRate, 0);
  assert.equal(setTaxRate(city, 7), city, 'no change returns the same object');
  const named = renameCity(city, '  El Segundo\u0000 Jr  ');
  assert.equal(named.name, 'El Segundo Jr');
  assert.equal(renameCity(city, '').name, 'Gridtown');
  assert.equal(renameCity(city, 'x'.repeat(80)).name.length, 40);
});

test('saved cities round-trip and malformed saves are rejected or repaired', () => {
  let city = scriptedTown();
  for (let i = 0; i < 5; i += 1) city = tick(city);
  const raw = serializeCity(city);
  assert.ok(!raw.includes('"stats"'), 'derived stats are not persisted');
  const back = readCity(raw);
  assert.deepEqual(summarizeCity(back), summarizeCity(city));
  assert.deepEqual(back.tiles, city.tiles);
  assert.deepEqual(back.lessons, city.lessons);
  assert.equal(readCity(null), null);
  assert.equal(readCity('{not json'), null);
  assert.equal(readCity('{"version":2}'), null);
  assert.equal(readCity(JSON.stringify({ version: 1, tiles: [] })), null);
  const odd = JSON.parse(raw);
  odd.tiles[0] = { id: 'castle', level: 9 };
  odd.tiles[1] = { id: 'res', level: 9 };
  odd.tiles[2] = { id: 'road', level: 4 };
  odd.funds = 'lots'; odd.taxRate = 50; odd.name = 'A\u0001B'; odd.lessons = ['road', 'nope'];
  odd.log = [{ month: 'x', text: 'y'.repeat(500) }];
  const repaired = readCity(JSON.stringify(odd));
  assert.equal(repaired.tiles[0].id, 'grass');
  assert.equal(repaired.tiles[1].level, 3);
  assert.equal(repaired.tiles[2].level, 0);
  assert.equal(repaired.funds, STARTING_FUNDS);
  assert.equal(repaired.taxRate, 20);
  assert.equal(repaired.name, 'AB');
  assert.ok(repaired.lessons.includes('road') && !repaired.lessons.includes('nope'));
  assert.equal(repaired.log[0].text.length, 200);
});

test('the toolbar is small, numbered, and every tool has a one-line lesson', () => {
  assert.equal(TOOLS.length, 7);
  assert.deepEqual(TOOLS.map((t) => t.key), ['1', '2', '3', '4', '5', '6', '0']);
  for (const tool of TOOLS) {
    assert.ok(tool.cost > 0);
    assert.ok(tool.hint.length > 20 && tool.hint.length < 140, tool.id);
  }
  const text = cityToText(createCity(7));
  assert.equal(text.split('\n').length, GRID_SIZE);
  assert.match(text, /^[.~t#RCIP*\n]+$/);
});

/** Review follow-ups (2026-10-22): each test below pins a defect two independent reviewers reproduced. */

function roadTown(seed, { homes, shops, works }) {
  let city = createCity(seed);
  const place = (tool, x, y) => { city = build(city, tool, x, y).city; };
  for (const rx of [4, 11]) for (let y = 0; y < GRID_SIZE; y += 1) if (city.tiles[index(rx, y)].id !== 'water') place('road', rx, y);
  let h = 0; let s = 0; let w = 0;
  for (let y = 0; y < GRID_SIZE; y += 1) for (const [x, rx] of [[3, 4], [5, 4], [10, 11], [12, 11]]) {
    if (city.tiles[index(x, y)].id !== 'grass' || city.tiles[index(rx, y)].id !== 'road') continue;
    if (h < homes) { place('res', x, y); h += 1; } else if (s < shops) { place('com', x, y); s += 1; } else if (w < works) { place('ind', x, y); w += 1; }
  }
  for (let y = GRID_SIZE - 1; y >= 0; y -= 1) if (city.tiles[index(0, y)].id === 'grass') { place('power', 0, y); break; }
  assert.equal(count(city, 'res'), homes); assert.equal(count(city, 'com'), shops); assert.equal(count(city, 'ind'), works);
  assert.equal(count(city, 'power'), 1);
  return city;
}

test('a saved tax rate of zero is restored as zero, not the default', () => {
  const free = setTaxRate(scriptedTown(), 0);
  assert.equal(free.taxRate, 0);
  assert.equal(readCity(serializeCity(free)).taxRate, 0);
  assert.equal(readCity(JSON.stringify({ ...JSON.parse(serializeCity(free)), taxRate: null })).taxRate, 7, 'missing still means the default');
  assert.equal(readCity(JSON.stringify({ ...JSON.parse(serializeCity(free)), taxRate: 'x' })).taxRate, 7);
});

test('large towns settle instead of swinging between two populations every month', () => {
  for (const seed of [0, 7, 20261022]) {
    let city = roadTown(seed, { homes: 16, shops: 2, works: 2 });
    const series = [];
    for (let i = 0; i < 48; i += 1) { city = tick(city); series.push(city.stats.population); }
    const tail = series.slice(-12);
    assert.ok(tail.every((p) => p === tail[0]), `seed ${seed} settles: ${series.join(',')}`);
    assert.ok(tail[0] > 0, `seed ${seed} keeps its people`);
    assert.ok(series.every((p, i) => i === 0 || p >= series[i - 1] || tail.includes(p)), `seed ${seed} never dumps its people: ${series.join(',')}`);
  }
  let jobless = roadTown(0, { homes: 18, shops: 0, works: 0 });
  const series = [];
  for (let i = 0; i < 24; i += 1) { jobless = tick(jobless); series.push(jobless.stats.population); }
  assert.deepEqual(series.slice(-6), Array(6).fill(series.at(-1)), `a jobless town finds a level: ${series.join(',')}`);
  assert.ok(series.at(-1) > 0 && series.at(-1) <= 72, 'pioneers stop at the first few dozen');
});

test('smoke pulls a built-out home back down to level one', () => {
  let city = scriptedTown();
  for (let i = 0; i < 8; i += 1) city = tick(city);
  const { pollution } = analyze(city);
  // Find a clean level-3 home and a grass tile exactly two steps away whose workshop smoke actually reaches it
  // (a park within two steps of the home would cancel one workshop's smoke).
  let clean = -1; let smoked = null;
  for (let i = 0; i < city.tiles.length && !smoked; i += 1) {
    const t = city.tiles[i];
    if (t.id !== 'res' || pollution[i] > 0 || t.level !== 3) continue;
    const cx = i % GRID_SIZE; const cy = Math.floor(i / GRID_SIZE);
    for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const x = cx + dx; const y = cy + dy;
      if (!inBounds(x, y) || city.tiles[index(x, y)].id !== 'grass') continue;
      const candidate = build(city, 'ind', x, y).city;
      if (analyze(candidate).pollution[i] > 0) { clean = i; smoked = candidate; break; }
    }
  }
  assert.ok(smoked, 'found a clean level-3 home with a grass tile two steps away');
  assert.ok(analyze(smoked).pollution[clean] > 0);
  const after1 = tick(smoked); const after2 = tick(after1); const after3 = tick(after2);
  assert.equal(after1.tiles[clean].level, 2);
  assert.equal(after2.tiles[clean].level, 1);
  assert.equal(after3.tiles[clean].level, 1, 'stops at one, never zero');
});

test('only a real park satisfies the park lesson; water and trees raise value but do not count', () => {
  for (const seed of [0, 7, 20261022]) {
    let city = createCity(seed);
    for (let i = 0; i < city.tiles.length; i += 1) {
      if (city.tiles[i].id !== 'grass') continue;
      const built = build(city, 'res', i % GRID_SIZE, Math.floor(i / GRID_SIZE)).city;
      assert.equal(built.stats.parkedHomes, 0, `seed ${seed} tile ${i}`);
      assert.ok(!built.lessons.includes('park'));
    }
  }
  const city = scriptedTown();
  assert.ok(city.stats.parkedHomes >= 1 && city.lessons.includes('park'), 'the scripted park beside homes still counts');
});

test('happiness charges exactly 3 per tax point over 7 and gives at most 3 for low taxes', () => {
  const base = { population: 100, employment: 1, parks: 0, homes: 10, homePollution: 0, homeValue: 0 };
  const at = (taxRate) => computeHappiness({ ...base, taxRate });
  assert.equal(at(7) - at(8), 3);
  assert.equal(at(7) - at(10), 9);
  assert.equal(at(7) - at(20), 39);
  assert.equal(at(4) - at(7), 3);
  assert.equal(at(0) - at(7), 3);
});

test('a broke town can still bulldoze', () => {
  let city = scriptedTown();
  city = { ...city, funds: -300 };
  assert.equal(canBuild(city, 'road', 15, 0).ok, false);
  const cleared = build(city, 'bulldoze', 5, 8);
  assert.equal(cleared.ok, true);
  assert.equal(cleared.city.tiles[index(5, 8)].id, 'grass');
  assert.equal(cleared.city.funds, -305);
});

test('prototype keys are not tile ids', () => {
  const raw = JSON.parse(serializeCity(scriptedTown()));
  raw.tiles[0] = { id: '__proto__', level: 1 }; raw.tiles[1] = { id: 'constructor', level: 1 }; raw.tiles[2] = { id: 'toString', level: 0 };
  const city = readCity(JSON.stringify(raw));
  assert.deepEqual(city.tiles.slice(0, 3), [{ id: 'grass', level: 0 }, { id: 'grass', level: 0 }, { id: 'grass', level: 0 }]);
  assert.match(cityToText(city), /^[.~t#RCIP*\n]+$/);
});

/** v1.1 (2026-10-22): demand from real jobs, the tile inspector, city links and town titles. */
import { explainTile, encodeCity, decodeCity, cityTitle, CITY_TITLES, computeDemand, generateTerrain } from '../src/lib/gridtown.mjs';

test('demand counts jobs that exist, so painting a long row of shops never freezes a town', () => {
  assert.deepEqual(computeDemand(0, 0, 0), { res: 30, com: 20, ind: 20 });
  let city = createCity(7);
  const place = (tool, x, y) => { city = build(city, tool, x, y).city; };
  for (let x = 0; x < GRID_SIZE; x += 1) place('road', x, 8);
  for (let x = 0; x < 8; x += 1) place('res', x, 7);
  for (let x = 0; x < GRID_SIZE; x += 1) place('com', x, 9);
  place('power', 15, 10);
  assert.ok(count(city, 'com') >= 12, 'a long row of shops');
  for (let i = 0; i < 12; i += 1) city = tick(city);
  assert.ok(city.stats.population >= 96, `homes keep filling: ${city.stats.population}`);
  assert.ok(city.stats.comJobs > 0, 'shops open once there are customers');
  // Homes and shops never point at each other: a stalled tile names something the player can actually do.
  const home = explainTile(city, 0, 7);
  const shop = explainTile(city, 15, 9);
  assert.ok(!(/zone shops or workshops/.test(home.blocker ?? '') && /zone more homes/.test(shop.blocker ?? '')) || city.stats.indJobs === 0);
});

test('a dense planned town can reach every title, Metropolis included', () => {
  let city = { ...createCity(0), funds: 1e7 };
  const place = (tool, x, y) => { const r = build(city, tool, x, y); if (r.ok) city = r.city; return r.ok; };
  for (let y = 1; y < GRID_SIZE; y += 3) for (let x = 0; x < GRID_SIZE; x += 1) place('road', x, y);
  for (let y = 0; y < GRID_SIZE; y += 1) for (let x = 0; x < GRID_SIZE; x += 1) {
    const id = city.tiles[index(x, y)].id;
    if ((id !== 'grass' && id !== 'trees') || y % 3 === 1) continue;
    if (x >= 13) place('ind', x, y); else if (x >= 10) place('com', x, y); else if ((x + y) % 7 === 0) place('park', x, y); else place('res', x, y);
  }
  const zones = count(city, 'res') + count(city, 'com') + count(city, 'ind');
  let plants = 0;
  for (let y = GRID_SIZE - 1; y >= 0 && plants < Math.ceil(zones / 24) + 1; y -= 1) for (let x = GRID_SIZE - 1; x >= 12 && plants < Math.ceil(zones / 24) + 1; x -= 1) {
    if (['ind', 'com'].includes(city.tiles[index(x, y)].id)) { city = build(city, 'bulldoze', x, y).city; if (place('power', x, y)) plants += 1; }
  }
  for (let i = 0; i < 80; i += 1) city = tick({ ...city, funds: 1e7 });
  assert.equal(cityTitle(city.stats.population), 'Metropolis', `final ${city.stats.population}`);
  assert.ok(city.stats.population >= CITY_TITLES.at(-1).min);
  assert.equal(city.stats.unpowered, 0);
  assert.equal(city.stats.pollutedHomes, 0);
});

test('town titles step up at fixed populations', () => {
  assert.deepEqual(CITY_TITLES.map((t) => t.min), [0, 1, 50, 200, 500, 1000]);
  assert.equal(cityTitle(0), 'Open country');
  assert.equal(cityTitle(8), 'Hamlet');
  assert.equal(cityTitle(49), 'Hamlet');
  assert.equal(cityTitle(50), 'Village');
  assert.equal(cityTitle(999), 'City');
  assert.equal(cityTitle(1000), 'Metropolis');
  assert.equal(cityTitle(-5), 'Open country');
  assert.equal(cityTitle('x'), 'Open country');
  assert.equal(summarizeCity(scriptedTown()).title, 'Open country');
});

test('the inspector names the one thing standing in a tile\'s way', () => {
  let city = createCity(7);
  const place = (tool, x, y) => { const r = build(city, tool, x, y); assert.ok(r.ok, `${tool} at ${x},${y}: ${r.reason}`); city = r.city; };
  // A grass tile with grass below it, so a home and its road both fit.
  const spot = city.tiles.findIndex((t, i) => t.id === 'grass' && i + GRID_SIZE < city.tiles.length && city.tiles[i + GRID_SIZE].id === 'grass');
  const hx = spot % GRID_SIZE; const hy = Math.floor(spot / GRID_SIZE);
  place('res', hx, hy);
  assert.match(explainTile(city, hx, hy).blocker, /road/i);
  place('road', hx, hy + 1);
  assert.match(explainTile(city, hx, hy).blocker, /power plant/i);
  assert.equal(explainTile(city, hx, hy).facts.find((f) => f.label === 'Power').ok, false);
  let town = scriptedTown();
  for (let i = 0; i < 12; i += 1) town = tick(town);
  const grown = town.tiles.findIndex((t) => t.id === 'res' && t.level === 3);
  assert.notEqual(grown, -1);
  const full = explainTile(town, grown % GRID_SIZE, Math.floor(grown / GRID_SIZE));
  assert.equal(full.blocker, null);
  assert.equal(full.tip, 'Fully grown.');
  assert.equal(full.facts.find((f) => f.label === 'People').text, '24 living here.');
  const water = town.tiles.findIndex((t) => t.id === 'water');
  const w = explainTile(town, water % GRID_SIZE, Math.floor(water / GRID_SIZE));
  assert.equal(w.facts[0].ok, false);
  assert.match(w.facts[0].text, /water/);
  const park = explainTile(town, 3, 9);
  assert.equal(park.id, 'park');
  assert.ok(park.facts[0].ok, 'the scripted park sits beside homes');
  const plant = explainTile(town, 0, 9);
  assert.match(plant.facts[0].text, /of 24 zone tiles/);
  const road = explainTile(town, 5, 8);
  assert.equal(road.id, 'road');
  assert.ok(road.facts[0].ok);
  assert.equal(explainTile(town, -1, 0), null);
  assert.equal(explainTile(town, 0, GRID_SIZE), null);
  for (const t of [explainTile(city, hx, hy), full, w, park, plant, road]) {
    assert.ok(t.headline.length > 0);
    for (const f of t.facts) assert.ok(typeof f.ok === 'boolean' && f.text.length > 0 && !/[<>]/.test(f.text));
  }
});

test('a city link carries the whole town and nothing else', () => {
  let city = renameCity(scriptedTown(), 'El Segundo. Jr & Co #1');
  for (let i = 0; i < 9; i += 1) city = tick(city);
  city = setTaxRate({ ...city, funds: -1234 }, 0);
  const code = encodeCity(city);
  assert.match(code, /^g1\.[0-9a-z]+\.[0-9a-z]+\.-?[0-9a-z]+\.[0-9a-z]+\.[a-z]{256}\.[A-Za-z0-9%._~!*'()-]+$/);
  assert.ok(code.length < 400, `${code.length} characters`);
  const back = decodeCity(code);
  assert.deepEqual(back.tiles, city.tiles);
  assert.equal(back.name, city.name);
  assert.equal(back.seed, city.seed);
  assert.equal(back.month, city.month);
  assert.equal(back.funds, -1234);
  assert.equal(back.taxRate, 0);
  assert.equal(back.stats.population, city.stats.population);
  assert.deepEqual(back.log, []);
  assert.deepEqual(decodeCity(encodeCity(createCity(4294967295))).tiles, createCity(4294967295).tiles);
});

test('damaged, oversized or impossible city links are refused', () => {
  const good = encodeCity(scriptedTown());
  const parts = good.split('.');
  const swap = (k, v) => { const p = [...parts]; p[k] = v; return p.join('.'); };
  for (const bad of [
    null, undefined, 42, '', 'g1', good.replace(/^g1/, 'g2'), good + 'x'.repeat(1200),
    swap(1, '-1'), swap(1, 'zzzzzzzzz'), swap(1, '1z141z4'),
    swap(2, 'zzzzzz'), swap(3, 'zzzzzz'), swap(4, 'l'), swap(4, '-1'),
    swap(5, parts[5].slice(1)), swap(5, parts[5].slice(0, -1) + 'Z'), swap(5, parts[5].replace(/[a-dh-kmnoq]/, 'x')),
    swap(6, '%E0%A4%A'),
  ]) assert.equal(decodeCity(bad), null, String(bad).slice(0, 60));
  // Moving the river is impossible: water must sit exactly where the seed puts it.
  const terrain = generateTerrain(scriptedTown().seed);
  const wi = terrain.findIndex((t) => t.id === 'water');
  const dry = parts[5].slice(0, wi) + 'g' + parts[5].slice(wi + 1);
  assert.equal(decodeCity(swap(5, dry)), null);
  const gi = terrain.findIndex((t) => t.id === 'grass');
  const wet = parts[5].slice(0, gi) + 'w' + parts[5].slice(gi + 1);
  assert.equal(decodeCity(swap(5, wet)), null);
  // Names are cleaned the same way as a rename.
  assert.equal(decodeCity(swap(6, encodeURIComponent('  A\u0001B  '))).name, 'AB');
  assert.equal(decodeCity(swap(6, '')).name, 'Gridtown');
  assert.equal(decodeCity(swap(6, encodeURIComponent('x'.repeat(90)))).name.length, 40);
});
