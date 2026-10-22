import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_SIZE, LESSONS, TOOLS, STARTING_FUNDS, POWER_CAPACITY,
  createCity, build, canBuild, tick, setTaxRate, renameCity, readCity, serializeCity, cityToText, summarizeCity, count, index, analyze,
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
