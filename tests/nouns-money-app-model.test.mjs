import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildCatalog, createFavorites, filterCatalog, parseRoute, formatRoute, printPlan, FAVORITES_KEY } from '../src/lib/nouns-money-app-model.mjs';

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const source = readFileSync(new URL('../src/lib/nouns-money.ts', import.meta.url), 'utf8');
const exportedArray = name => JSON.parse(source.split(`export const ${name} = `)[1].split(' as const;')[0]);
const input = {
  hundred: json('../src/data/nouns-money-hundred.json'),
  originals: exportedArray('NOTE_DESIGNS'),
  studies: exportedArray('NORDIC_STUDIES'),
  everyday: json('../src/data/nouns-money-editions.json'),
  flowers: [
    { id: 'flower-01', title: 'Aster plate', file: '01-aster', description: 'Flower note and decorative stamp study.', width: 1536, height: 1024 },
    { id: 'flower-02', title: 'Rose plate', file: '02-rose', description: 'A Nouns-inspired flower medallion concept.', width: 1024, height: 1536 },
  ],
};
const catalog = buildCatalog(input);
const clone = value => JSON.parse(JSON.stringify(value));
function storageFixture(initial = null) {
  const values = new Map(initial === null ? [] : [[FAVORITES_KEY, initial]]);
  const writes = [];
  return { values, writes, getItem(key) { return values.get(key) ?? null; }, setItem(key, value) { writes.push({ key, value }); values.set(key, value); } };
}
const packet = ids => JSON.stringify({ version: 1, ids });

test('real catalogs retain all 174 existing designs, order, stable IDs and original URLs', () => {
  const before = clone(input);
  assert.equal(catalog.length, 176);
  assert.deepEqual(Object.fromEntries(['nordic', 'originals', 'studies', 'everyday', 'flowers'].map(key => [key, catalog.filter(note => note.seriesKey === key).length])), { nordic: 100, originals: 10, studies: 14, everyday: 50, flowers: 2 });
  assert.equal(new Set(catalog.map(note => note.id)).size, 176);
  for (const note of input.hundred.catalog) {
    const record = catalog.find(row => row.id === `nm100-${String(note.nounId).padStart(3, '0')}`);
    assert.equal(record.image, `/images/nouns-money/nordic-100/${note.file}.webp`);
    assert.equal(record.original, `/images/nouns-money/nordic-100/${note.file}.svg`);
    assert.match(record.description, new RegExp(note.serial));
    assert.equal(record.detailHref, '/nouns-money/#hundred');
  }
  input.originals.forEach(note => assert.equal(catalog.find(row => row.id === `original-${note.id}`).original, `/images/nouns-money/${note.file}.svg`));
  input.everyday.catalog.forEach(note => {
    const record = catalog.find(row => row.id === note.serial.toLowerCase());
    assert.equal(record.title, note.title);
    assert.equal(record.description, note.description);
    assert.equal(record.image, note.preview);
    assert.equal(record.original, note.svg);
    assert.equal(record.detailHref, `/nouns-money/editions/#${note.serial.toLowerCase()}`);
  });
  assert.deepEqual(input, before);
});

test('generated studies and flowers never inherit exact-source, NFT or production claims', () => {
  assert.equal(catalog.filter(note => note.kind === 'exact-source').length, 160);
  assert.equal(catalog.filter(note => note.kind === 'generated-study').length, 16);
  const study = catalog.find(note => note.id === 'study-01');
  assert.equal(study.original, '/images/nouns-money/nordic-2027/01-ice-blue-one.webp');
  assert.match(study.disclaimer, /not an exact-source print master/);
  assert.equal(study.svg, undefined);
  const flower = catalog.find(note => note.id === 'flower-02');
  assert.equal(flower.original, '/images/nouns-money/flowers-2026/02-rose.png');
  assert.deepEqual([flower.width, flower.height], [1024, 1536]);
  assert.match(flower.disclaimer, /not authenticated Noun pixel art/);
  assert.match(flower.disclaimer, /not valid postage/);
  assert.match(catalog.find(note => note.id === 'nm28-001').disclaimer, /Planned 1 tez price only; mint unavailable/);
});

test('catalog accepts source array variants, empty incremental flowers and known dimensions', () => {
  const result = buildCatalog({ ...input, hundred: input.hundred.catalog, everyday: input.everyday.catalog, flowers: [] });
  assert.equal(result.length, 174);
  assert.deepEqual([result[0].width, result[0].height], [1000, 500]);
  assert.deepEqual([result[100].width, result[100].height], [1400, 700]);
  assert.deepEqual([result[124].width, result[124].height], [1000, 667]);
  assert.deepEqual(buildCatalog(), []);
});

test('catalog rejects duplicate IDs, mismatched Nordic identities and path traversal', () => {
  assert.throws(() => buildCatalog({ flowers: [input.flowers[0], input.flowers[0]] }), /Duplicate/);
  assert.throws(() => buildCatalog({ hundred: [{ ...input.hundred.catalog[0], nounId: 1 }] }), /identity mismatch/);
  assert.throws(() => buildCatalog({ originals: [{ ...input.originals[0], id: 'nm-99' }] }), /original artwork ID/);
  assert.throws(() => buildCatalog({ studies: [{ ...input.studies[0], file: '../secret' }] }), /filename/);
  assert.throws(() => buildCatalog({ everyday: [{ ...input.everyday.catalog[0], preview: '/images/nouns-money/everyday-2028/../../secret.webp' }] }), /filename/);
  assert.throws(() => buildCatalog({ everyday: [{ ...input.everyday.catalog[0], svg: 'https://evil.example/note.svg' }] }), /asset path/);
  assert.throws(() => buildCatalog({ flowers: [{ ...input.flowers[0], width: NaN }] }), /dimensions/);
  assert.throws(() => buildCatalog({ flowers: [{ ...input.flowers[0], id: 'flower-00' }] }), /flower artwork ID/);
  assert.throws(() => buildCatalog({ hundred: {} }), /catalog/);
});

test('favorite preferences normalize duplicates and unknown IDs without touching existing stores', () => {
  const storage = storageFixture(packet(['flower-02', 'nm100-000', 'nm100-000', 'foreign', null, { id: 'nm100-001' }]));
  storage.values.set('pointcast:nouns-money:design-set:v1', '["nm-01"]');
  storage.values.set('pointcast:nouns-money:source-100:device:v1', '["nm100-010"]');
  const favorites = createFavorites(catalog, storage);
  assert.deepEqual(favorites.ids(), ['nm100-000', 'flower-02']);
  assert.equal(favorites.persistent(), true);
  favorites.toggle('study-01');
  assert.deepEqual(JSON.parse(storage.values.get(FAVORITES_KEY)), { version: 1, ids: ['nm100-000', 'study-01', 'flower-02'] });
  assert.equal(storage.values.get('pointcast:nouns-money:design-set:v1'), '["nm-01"]');
  assert.equal(storage.values.get('pointcast:nouns-money:source-100:device:v1'), '["nm100-010"]');
  assert.ok(storage.writes.every(write => write.key === FAVORITES_KEY));
});

test('all designs save, survive reload, and repeated toggles remove then restore exactly one ID', () => {
  const storage = storageFixture();
  let favorites = createFavorites(catalog, storage);
  for (const note of catalog) favorites.toggle(note.id);
  assert.equal(favorites.ids().length, 176);
  favorites = createFavorites(catalog, storage);
  assert.deepEqual(favorites.ids(), catalog.map(note => note.id));
  favorites.toggle('nm100-042');
  assert.equal(favorites.ids().length, 175);
  assert.ok(!favorites.ids().includes('nm100-042'));
  favorites.toggle('nm100-042');
  assert.equal(favorites.ids().length, 176);
  assert.equal(new Set(favorites.ids()).size, 176);
});

test('returned favorite arrays are independent and clearing is repeatable', () => {
  const storage = storageFixture();
  const favorites = createFavorites(catalog, storage);
  const returned = favorites.toggle('original-nm-01');
  returned.push('nm100-001');
  const read = favorites.ids(); read.length = 0;
  assert.deepEqual(favorites.ids(), ['original-nm-01']);
  assert.deepEqual(favorites.clear(), []);
  assert.deepEqual(favorites.clear(), []);
  assert.deepEqual(JSON.parse(storage.values.get(FAVORITES_KEY)), { version: 1, ids: [] });
});

test('a later cross-tab selection is read before a toggle or favorite display', () => {
  const storage = storageFixture();
  const favorites = createFavorites(catalog, storage);
  favorites.toggle('nm100-000');
  storage.values.set(FAVORITES_KEY, packet(['nm100-001']));
  assert.deepEqual(favorites.ids(), ['nm100-001']);
  storage.values.set(FAVORITES_KEY, packet(['nm100-002']));
  assert.deepEqual(favorites.toggle('flower-01'), ['nm100-002', 'flower-01']);
  storage.values.delete(FAVORITES_KEY);
  assert.deepEqual(favorites.ids(), []);
});

test('denied reads and missing storage provide a durable-in-this-visit memory fallback', () => {
  for (const storage of [undefined, { getItem() { throw Error('denied'); }, setItem() { throw Error('must not write'); } }]) {
    const favorites = createFavorites(catalog, storage);
    assert.equal(favorites.persistent(), false);
    favorites.toggle('nm100-000'); favorites.toggle('flower-02');
    assert.deepEqual(favorites.ids(), ['nm100-000', 'flower-02']);
    favorites.toggle('nm100-000');
    assert.deepEqual(favorites.ids(), ['flower-02']);
    assert.deepEqual(favorites.clear(), []);
  }
});

test('denied storage capability getters also fail into visit-only memory', () => {
  const storage = Object.defineProperty({}, 'getItem', { get() { throw Error('denied'); } });
  const favorites = createFavorites(catalog, storage);
  assert.equal(favorites.persistent(), false);
  assert.deepEqual(favorites.toggle('flower-01'), ['flower-01']);
});

test('a denied write keeps the intended memory selection and never rereads the stale saved value', () => {
  const storage = storageFixture(packet(['nm100-000']));
  storage.setItem = () => { throw Error('quota'); };
  const favorites = createFavorites(catalog, storage);
  assert.deepEqual(favorites.toggle('flower-01'), ['nm100-000', 'flower-01']);
  assert.equal(favorites.persistent(), false);
  assert.deepEqual(favorites.ids(), ['nm100-000', 'flower-01']);
  assert.deepEqual(favorites.toggle('nm100-000'), ['flower-01']);
  assert.deepEqual(JSON.parse(storage.values.get(FAVORITES_KEY)).ids, ['nm100-000']);
});

test('malformed, oversized or wrong-version packets remain untouched during memory fallback', () => {
  const malformed = ['not JSON', 'null', '[]', '{"version":2,"ids":[]}', '{"version":1,"ids":[],"owned":true}', '{"version":1,"ids":"nm100-000"}', packet(Array(513).fill('nm100-000')), ' '.repeat(65537)];
  for (const raw of malformed) {
    const storage = storageFixture(raw);
    const favorites = createFavorites(catalog, storage);
    assert.deepEqual(favorites.ids(), []);
    assert.equal(favorites.persistent(), false);
    favorites.toggle('nm100-001');
    assert.deepEqual(favorites.ids(), ['nm100-001']);
    assert.equal(storage.values.get(FAVORITES_KEY), raw);
    assert.equal(storage.writes.length, 0);
  }
});

test('later corruption or a denied read preserves the last known preference in memory', () => {
  const storage = storageFixture(packet(['nm100-000']));
  const favorites = createFavorites(catalog, storage);
  storage.values.set(FAVORITES_KEY, 'corrupt');
  assert.deepEqual(favorites.ids(), ['nm100-000']);
  assert.equal(favorites.persistent(), false);
  assert.deepEqual(favorites.toggle('nm100-001'), ['nm100-000', 'nm100-001']);
  const otherStorage = storageFixture(packet(['flower-01']));
  const other = createFavorites(catalog, otherStorage);
  otherStorage.getItem = () => { throw Error('denied'); };
  assert.deepEqual(other.ids(), ['flower-01']);
  assert.equal(other.persistent(), false);
});

test('unknown favorite IDs and forged catalog IDs are rejected before any write', () => {
  const storage = storageFixture(); const favorites = createFavorites(catalog, storage);
  for (const id of ['foreign', '__proto__', null, 'NM100-000', 'nm100-000/../../']) assert.throws(() => favorites.toggle(id), /Unknown/);
  assert.deepEqual(favorites.ids(), []); assert.equal(storage.writes.length, 0);
  assert.throws(() => createFavorites([{ id: 'a' }, { id: 'a' }], storage), /catalog IDs/);
  assert.throws(() => createFavorites([{ id: '<script>' }], storage), /catalog IDs/);
});

test('series, case-insensitive multi-term search and saved-only filters intersect in catalog order', () => {
  assert.deepEqual(filterCatalog(catalog, { series: 'flowers', query: ' FLOWER   plate ', savedOnly: true, savedIds: ['flower-02', 'nm100-000', 'flower-01'] }).map(note => note.id), ['flower-01', 'flower-02']);
  assert.deepEqual(filterCatalog(catalog, { series: 'nordic', query: 'noun #42' }).map(note => note.id), ['nm100-042']);
  assert.deepEqual(filterCatalog(catalog, { query: 'useful thing' }).map(note => note.id), ['nm28-001', 'nm28-010']);
  assert.deepEqual(filterCatalog(catalog, { series: 'unknown' }), []);
  assert.deepEqual(filterCatalog(catalog, { query: 'unfindable-word' }), []);
  assert.deepEqual(filterCatalog(catalog, { savedOnly: true }), []);
  assert.deepEqual(filterCatalog(catalog, { query: '   ' }), catalog);
  assert.throws(() => filterCatalog(catalog, { query: {} }), /filter/);
});

test('filtering never sorts or mutates the source catalog or saved list', () => {
  const before = clone(catalog); const savedIds = ['flower-02', 'nm100-000'];
  filterCatalog(catalog, { savedOnly: true, savedIds });
  assert.deepEqual(catalog, before);
  assert.deepEqual(savedIds, ['flower-02', 'nm100-000']);
});

test('all tabs and every artwork round-trip through explicit history-safe hashes', () => {
  for (const tab of ['catalog', 'saved', 'workshop', 'studio']) {
    assert.equal(formatRoute({ tab }), `#${tab}`);
    assert.deepEqual(parseRoute(`#${tab}`, catalog), { tab, artId: null });
    for (const { id: artId } of catalog) assert.deepEqual(parseRoute(formatRoute({ tab, artId }), catalog), { tab, artId });
  }
  assert.deepEqual(parseRoute('', catalog), { tab: 'catalog', artId: null });
  assert.deepEqual(parseRoute('#', catalog), { tab: 'catalog', artId: null });
  assert.equal(formatRoute(), '#catalog');
});

test('unknown routes, forged IDs, percent encodings and incomplete art routes fail closed', () => {
  for (const hash of ['catalog', '#profile', '#Catalog', '#catalog/', '#catalog/art/', '#catalog/art/foreign', '#catalog/art/nm100-000/extra', '#catalog/art/nm100%2D000', '#catalog?art=nm100-000', '#saved/art/../secret', '#studio/art/<script>', null, '#catalog/art/' + 'a'.repeat(100)]) assert.equal(parseRoute(hash, catalog), null, String(hash));
  for (const route of [{ tab: 'profile' }, { tab: 'catalog', artId: '../secret' }, { tab: 'saved', artId: '' }, { tab: 'studio', artId: 0 }]) assert.throws(() => formatRoute(route), /route/);
});

test('Letter planning gives true artwork dimensions and a bounded one-column page count', () => {
  const plan = printPlan({ paper: 'letter', widthMm: 150, count: 5, ratio: 2 });
  assert.equal(plan.paperWidthMm, 215.9); assert.equal(plan.paperHeightMm, 279.4);
  assert.equal(plan.widthMm, 150); assert.equal(plan.heightMm, 75);
  assert.equal(plan.marginMm, 20); assert.equal(plan.captionAllowanceMm, 18); assert.equal(plan.gapMm, 8);
  assert.equal(plan.sheetChromeMm, 32);
  assert.equal(plan.usableHeightMm, 279.4 - 40 - 32);
  assert.equal(plan.perPage, 2); assert.equal(plan.pages, 3);
});

test('A4 and width/count/ratio boundary cases remain physically inside all four margins', () => {
  const a4 = printPlan({ paper: 'a4', widthMm: 170, count: 12, ratio: 2 });
  assert.deepEqual([a4.paperWidthMm, a4.paperHeightMm, a4.perPage, a4.pages], [210, 297, 2, 6]);
  const narrow = printPlan({ paper: 'letter', widthMm: 40, count: 1, ratio: 0.25 });
  assert.equal(narrow.heightMm, 160); assert.equal(narrow.perPage, 1); assert.equal(narrow.pages, 1);
  const wideRatio = printPlan({ paper: 'letter', widthMm: 40, count: 12, ratio: 4 });
  assert.equal(wideRatio.heightMm, 10); assert.equal(wideRatio.perPage, 5); assert.equal(wideRatio.pages, 3);
});

test('print planning rejects non-finite, coerced, fractional and out-of-range inputs', () => {
  const valid = { paper: 'letter', widthMm: 150, count: 2, ratio: 2 };
  for (const paper of ['legal', '__proto__', '', undefined]) assert.throws(() => printPlan({ ...valid, paper }), /paper/);
  for (const widthMm of [NaN, Infinity, -Infinity, '150', null, 0, 39.99, 170.01]) assert.throws(() => printPlan({ ...valid, widthMm }), /width/);
  for (const count of [NaN, Infinity, '2', null, 0, 1.5, 13]) assert.throws(() => printPlan({ ...valid, count }), /count/);
  for (const ratio of [NaN, Infinity, '2', null, 0, -1, 0.249, 4.001]) assert.throws(() => printPlan({ ...valid, ratio }), /ratio/);
  assert.throws(() => printPlan({ ...valid, widthMm: 170, ratio: 0.25 }), /do not fit/);
});

test('146 mm flower pairs leave room for the full sheet chrome on separate Letter and A4 pages', () => {
  for (const paper of ['letter', 'a4']) {
    const plan = printPlan({ paper, widthMm: 146, count: 2, ratio: 1.5 });
    assert.equal(plan.heightMm, 146 / 1.5);
    assert.equal(plan.sheetChromeMm, 32);
    assert.equal(plan.perPage, 1);
    assert.equal(plan.pages, 2);
    assert.ok(plan.heightMm + 18 + 32 <= plan.paperHeightMm - 40);
    assert.ok(2 * (plan.heightMm + 18) + 8 + 32 > plan.paperHeightMm - 40);
  }
});

test('a range of portrait and landscape plans fits artwork, captions and sheet chrome within the margins', () => {
  for (const paper of ['letter', 'a4']) for (const widthMm of [40, 80, 120, 146, 150, 170]) for (const ratio of [0.25, 0.5, 1, 1.5, 2, 4]) for (const count of [1, 2, 5, 12]) {
    let plan;
    try { plan = printPlan({ paper, widthMm, count, ratio }); }
    catch (error) { assert.match(error.message, /do not fit/); continue; }
    assert.ok(plan.widthMm + 40 <= plan.paperWidthMm + 1e-9);
    assert.equal(plan.usableHeightMm, plan.paperHeightMm - 40 - 32);
    assert.ok(plan.perPage * (plan.heightMm + 18) + (plan.perPage - 1) * 8 + 32 <= plan.paperHeightMm - 40 + 1e-9);
    assert.ok(plan.pages * plan.perPage >= count);
    assert.ok((plan.pages - 1) * plan.perPage < count);
  }
});
