import test from 'node:test';
import assert from 'node:assert/strict';
import { ROCK_FAMILIES, ROCK_SOURCES, makeRock, normalizeRock, readCabinet, rockSvg } from '../src/lib/pocket-rocks.mjs';

const collectedAt = '2026-09-29T18:15:00.000Z';
const record = (seed, familyId = 'basalt', date = collectedAt) => ({ seed, familyId, collectedAt: date });
const cabinet = (rocks, featuredId) => JSON.stringify({ version: 1, rocks, featuredId });

test('all ten geology inspirations have stable metadata and primary source links', () => {
  assert.deepEqual(ROCK_FAMILIES.map((f) => f.id), ['basalt', 'granite', 'sandstone', 'slate', 'obsidian', 'pumice', 'agate', 'jasper', 'serpentinite', 'quartzite']);
  for (const family of ROCK_FAMILIES) {
    for (const field of ['id', 'name', 'geology', 'group', 'story', 'fact', 'texture']) assert.ok(family[field].length > 0);
    assert.equal(family.palette.length, 4);
    assert.ok(family.palette.every((color) => /^#[a-f0-9]{6}$/i.test(color)));
  }
  assert.ok(ROCK_SOURCES.length >= 3);
  assert.ok(ROCK_SOURCES.every((source) => /^https:\/\/(?:[a-z]+\.)?usgs\.gov\//.test(source.url)));
});

test('zero and maximum uint32 seeds retain deterministic, collision-free family identity', () => {
  assert.equal(makeRock(0, 'granite').id, 'PR-GRANITE-00000000');
  assert.equal(makeRock(4294967295, 'basalt').id, 'PR-BASALT-FFFFFFFF');
  assert.deepEqual(makeRock(415, 'agate'), makeRock(415, 'agate'));
  assert.deepEqual(makeRock(415), makeRock(415));
  const ids = new Set(ROCK_FAMILIES.flatMap((family) => [0, 1, 415, 4294967295].map((seed) => makeRock(seed, family.id).id)));
  assert.equal(ids.size, ROCK_FAMILIES.length * 4);
  const changed = makeRock(415, 'agate');
  changed.palette[0] = '#000000';
  assert.notEqual(makeRock(415, 'agate').palette[0], '#000000');
});

test('untrusted storage and share values cannot become valid through coercion', () => {
  for (const seed of ['123', '', null, undefined, true, false, NaN, Infinity, -Infinity, -1, 0.2, 4294967296, {}, []]) {
    assert.equal(normalizeRock({ seed, familyId: 'basalt' }), null);
    assert.throws(() => makeRock(seed, 'basalt'));
  }
  for (const familyId of ['__proto__', 'constructor', '<script>', 'BASALT', '', null, {}, []]) {
    assert.equal(normalizeRock({ seed: 123, familyId }), null);
    assert.throws(() => makeRock(123, familyId));
  }
  for (const input of [null, [], 123, '123', {}]) assert.equal(normalizeRock(input), null);
  assert.equal(normalizeRock({ get seed() { throw new Error('hostile getter'); }, familyId: 'basalt' }), null);
});

test('normalization reconstructs metadata and ignores injected identity or SVG fields', () => {
  const honest = makeRock(123, 'granite');
  const hostile = { ...honest, id: '__proto__', name: '<script>alert(1)</script>', palette: ['url(https://example.com)'], texture: '" onload="alert(1)' };
  assert.deepEqual(normalizeRock(hostile), honest);
  assert.equal(rockSvg(hostile), rockSvg(honest));
});

test('malformed envelopes safely produce an empty cabinet', () => {
  for (const raw of [null, undefined, {}, '', '[', 'null', '[]', '{}', '{"version":"1","rocks":[]}', '{"version":2,"rocks":[]}', '{"version":1,"rocks":{}}', 'x'.repeat(1_000_001)]) {
    assert.deepEqual(readCabinet(raw), { version: 1, rocks: [], featuredId: null });
  }
});

test('cabinet rejects invalid records and dates, deduplicates, and validates featured ownership', () => {
  const rock = makeRock(12, 'basalt');
  const other = makeRock(12, 'granite');
  const imported = readCabinet(cabinet([
    null, record('12'), record(-1), record(12, 'made-up'),
    record(1, 'slate', '2026-02-30T12:00:00.000Z'),
    record(2, 'slate', '2026-09-29'),
    record(3, 'slate', '<script>'),
    { seed: 4, familyId: 'slate' },
    { ...record(12), name: '<script>', id: 'not-real' },
    record(12, 'basalt', '2026-09-30T00:00:00.000Z'),
    record(12, 'granite'),
  ], rock.id));
  assert.equal(imported.rocks.length, 2);
  assert.deepEqual(imported.rocks[0], { ...rock, collectedAt });
  assert.deepEqual(imported.rocks[1], { ...other, collectedAt });
  assert.equal(imported.featuredId, rock.id);
  assert.equal(readCabinet(cabinet([record(12)], other.id)).featuredId, null);
  assert.equal(readCabinet(cabinet([record(12)], '<img src=x onerror=alert(1)>')).featuredId, null);
});

test('500 valid specimens is the cabinet limit even when invalid entries precede them', () => {
  const records = [record(-1), ...Array.from({ length: 530 }, (_, seed) => record(seed))];
  const imported = readCabinet(cabinet(records, makeRock(529, 'basalt').id));
  assert.equal(imported.rocks.length, 500);
  assert.equal(imported.rocks[0].seed, 0);
  assert.equal(imported.rocks[499].seed, 499);
  assert.equal(imported.featuredId, null);
});

test('safe artwork is reproducible and every seed changes the sculptural SVG', () => {
  for (const family of ROCK_FAMILIES) {
    const rock = makeRock(41, family.id);
    const art = rockSvg(rock);
    assert.equal(art, rockSvg(rock));
    assert.notEqual(art, rockSvg(makeRock(42, family.id)));
    assert.ok(art.startsWith('<svg '));
    assert.ok(art.includes('role="img"'));
    assert.ok(art.includes('<desc>'));
    assert.ok(art.includes('<clipPath'));
    assert.ok(!/<(?:script|foreignObject|image)\b|\bon\w+=|\bhref=|\bsrc=|NaN|Infinity/.test(art));
    assert.ok(!art.includes('fill="#f3efe5"'));
  }
  const granite = rockSvg(makeRock(41, 'granite'));
  assert.ok(granite.includes('Salt &amp; Pepper'));
  assert.ok(!granite.includes('Salt & Pepper'));
});

test('SVG exports allow a paper background and bounded dimensions only', () => {
  const rock = makeRock(3, 'sandstone');
  assert.ok(rockSvg(rock, { size: 1200, background: true }).includes('width="1200" height="1200"'));
  assert.ok(rockSvg(rock, { background: true }).includes('fill="#f3efe5"'));
  for (const size of ['480" onload="alert(1)', NaN, Infinity, -1, 0, 100000, 1.5]) {
    assert.ok(rockSvg(rock, { size }).includes('width="480" height="480"'));
  }
  assert.throws(() => rockSvg({ seed: '3', familyId: 'basalt' }));
});

test('specimens within each family have distinct silhouettes, beyond metadata changes', () => {
  for (const family of ROCK_FAMILIES) {
    const outlines = Array.from({ length: 25 }, (_, seed) => {
      const svg = rockSvg(makeRock(seed, family.id));
      return svg.match(/<clipPath[^>]*><path d="([^"]+)"/)[1];
    });
    assert.equal(new Set(outlines).size, 25, family.id);
  }
});
