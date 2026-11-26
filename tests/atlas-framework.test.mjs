/**
 * The Atlas framework (scripts/atlas/lib.mjs) and the shared query library (src/lib/atlas-query.mjs).
 * Spec: docs/cartography/ATLAS.md. These tests use fixtures only; tests/atlas.test.mjs checks the
 * committed public/atlas.json against the same rules.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { atlasProblems, recordProblems, personalDataProblems, assembleAtlas, mergeAtlases, sameAtlas, slug, rid, src, loc, summary, haversineMiles, bearingDegrees, sortRecords } from '../scripts/atlas/lib.mjs';
import { search, get, near, links, compactRecord, provenance } from '../src/lib/atlas-query.mjs';

const SITE = { host: 'pointcast.xyz', name: 'Test atlas', description: 'fixture', notOfficial: 'Not official.', spec: 'https://pointcast.xyz/cartography/atlas', map: 'https://pointcast.xyz/cartography/map', atlasPath: '/atlas.json', radiusMiles: 25, center: { lat: 33.92044971, lon: -118.4153182, name: 'City Hall', source: 'https://locator.lacounty.gov/lac/Location/3177269/el-segundo-city-hall' } };
const LAYER = { id: 'courts', name: 'Courts', types: ['court'], license: 'CC0-1.0', updated: '2026-10-18', data: 'https://pointcast.xyz/air.json' };
const good = (over = {}) => ({
  id: 'pc:court:rec-park', type: 'court', name: 'Recreation Park courts', site: 'pointcast.xyz', url: 'https://pointcast.xyz/air/el-segundo',
  location: loc(33.9216674, -118.411307, 'point', { address: '401 Sheldon St, El Segundo, CA 90245', area: 'rec-park' }),
  source: [src('https://www.rec.us/locations/7527b987-0f0b-473e-9680-0c90758f6dcd', '2026-10-18', 'listing', 'rec.us')],
  updated: '2026-10-18', license: 'CC0-1.0', layer: 'courts', tags: ['pickleball'], ...over,
});

test('helpers: slug, rid, src, loc, summary, distance', () => {
  assert.equal(slug('Manhattan Heights Park & Courts!'), 'manhattan-heights-park-and-courts');
  assert.equal(slug('Café Ólé'), 'cafe-ole');
  assert.equal(rid('elsegundo.xyz', 'place', 'Recreation Park'), 'es:place:recreation-park');
  assert.equal(rid('pointcast.xyz', 'page', 'b-0475'), 'pc:page:b-0475');
  assert.deepEqual(src('https://x.test/a', '2026-11-08T10:00:00Z', 'fact', 'T'), { url: 'https://x.test/a', checked: '2026-11-08', label: 'fact', title: 'T' });
  assert.equal(loc('abc', 1, 'point'), undefined);
  assert.deepEqual(loc(33.12345678, -118.98765432, 'address'), { lat: 33.123457, lon: -118.987654, precision: 'address' });
  assert.equal(summary('a'.repeat(300)).length, 280);
  assert.equal(summary('  two   words '), 'two words');
  const d = haversineMiles(SITE.center, { lat: 33.9216674, lon: -118.411307 });
  assert.ok(d > 0.2 && d < 0.3, `City Hall to Rec Park courts should be about a quarter mile, got ${d}`);
  assert.ok(Math.abs(bearingDegrees({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })) < 0.01);
});

test('a well-formed record passes and each rule has a message', () => {
  assert.deepEqual(recordProblems(good()), []);
  assert.match(recordProblems(good({ id: 'xx:court:a' })).join('\n'), /id .* must match/);
  assert.match(recordProblems(good({ id: 'pc:place:rec-park' })).join('\n'), /id type segment/);
  assert.match(recordProblems(good({ source: [] })).join('\n'), /source must be a non-empty array/);
  assert.match(recordProblems(good({ source: [src('http://insecure.test', '2026-01-01')] })).join('\n'), /must be https/);
  assert.match(recordProblems(good({ source: [src('https://ok.test', '2026-02-30')] })).join('\n'), /checked must be YYYY-MM-DD/);
  assert.match(recordProblems(good({ updated: 'yesterday' })).join('\n'), /updated must be/);
  assert.match(recordProblems(good({ license: 'ODbL-1.0' })).join('\n'), /attribution is required/);
  assert.deepEqual(recordProblems(good({ license: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' })), []);
  assert.match(recordProblems(good({ links: [{ rel: 'loves', id: 'pc:place:x' }] })).join('\n'), /rel not in vocabulary/);
  assert.match(recordProblems(good({ links: [{ rel: 'near', id: 'pc:court:rec-park' }] })).join('\n'), /points at itself/);
  assert.match(recordProblems(good({ extra: 1 })).join('\n'), /unknown field extra/);
  assert.match(recordProblems(good({ location: { lat: 91, lon: 0, precision: 'point' } })).join('\n'), /lat out of range/);
  assert.match(recordProblems(good({ location: { lat: 1, lon: 0, precision: 'exact' } })).join('\n'), /precision not in vocabulary/);
  assert.match(recordProblems(good({ summary: 'x'.repeat(281) })).join('\n'), /summary/);
  assert.match(recordProblems(good({ tags: ['Has Caps'] })).join('\n'), /tags must be lowercase/);
});

test('the personal-data screen refuses phones, emails and SSNs outside a venue summary', () => {
  assert.deepEqual(personalDataProblems(good({ summary: 'Desk line 310-524-2700, 8 courts.' })), []);
  assert.match(personalDataProblems(good({ type: 'player', id: 'pc:player:x', summary: 'Call 310-524-2700' })).join('\n'), /phone/);
  assert.match(personalDataProblems(good({ name: 'mail me at someone@example.com' })).join('\n'), /email/);
  assert.match(personalDataProblems(good({ tags: ['123-45-6789'] })).join('\n'), /SSN/);
  assert.deepEqual(personalDataProblems(good({ url: 'https://pointcast.xyz/x?tel=310-555-1212' })), [], 'urls are not screened');
});

test('assembleAtlas sorts, counts and validates; links to unknown same-site ids fail', () => {
  const b = good({ id: 'pc:court:b', name: 'B', links: [{ rel: 'near', id: 'pc:court:rec-park' }, { rel: 'same-as', id: 'es:court:recreation-park-courts' }] });
  const atlas = assembleAtlas(SITE, [LAYER], [b, good()], '2026-11-08T00:00:00Z');
  assert.deepEqual(atlasProblems(atlas), []);
  assert.deepEqual(atlas.records.map((r) => r.id), ['pc:court:b', 'pc:court:rec-park']);
  assert.deepEqual(atlas.counts, { total: 2, located: 2, byType: { court: 2 }, byLayer: { courts: 2 } });
  assert.equal(atlas.layers[0].count, 2);
  const broken = assembleAtlas(SITE, [LAYER], [good({ links: [{ rel: 'near', id: 'pc:court:ghost' }] })], '2026-11-08T00:00:00Z');
  assert.match(atlasProblems(broken).join('\n'), /points at an id this atlas does not have/);
  const undeclared = assembleAtlas(SITE, [LAYER], [good({ layer: 'other' })], '2026-11-08T00:00:00Z');
  assert.match(atlasProblems(undeclared).join('\n'), /layer other is not declared/);
  const dup = assembleAtlas(SITE, [LAYER], [good(), good()], '2026-11-08T00:00:00Z');
  assert.match(atlasProblems(dup).join('\n'), /duplicate id/);
  assert.ok(sameAtlas(atlas, { ...atlas, generated: '2030-01-01T00:00:00Z' }));
  assert.ok(!sameAtlas(atlas, { ...atlas, records: [] }));
});

const ES_SITE = { ...SITE, host: 'elsegundo.xyz', name: 'ES' };
const esCourt = { id: 'es:court:recreation-park-courts', type: 'court', name: 'Recreation Park Courts', site: 'elsegundo.xyz', url: 'https://elsegundo.xyz/places/recreation-park-courts/', location: loc(33.9216674, -118.411307, 'point'), source: [src('https://www.elsegundo.org/x', '2026-10-29', 'fact')], updated: '2026-10-29', license: 'CC0-1.0', layer: 'places', links: [{ rel: 'same-as', id: 'pc:court:rec-park' }] };
const esBeach = { id: 'es:place:el-segundo-beach', type: 'place', name: 'The beach at Grand Avenue', site: 'elsegundo.xyz', url: 'https://elsegundo.xyz/here/el-segundo-beach/', location: loc(33.916776, -118.42884, 'point'), source: [src('https://californiacoastaltrail.org/info-point/el-segundo-beach', '2026-11-01', 'fact')], updated: '2026-11-01', license: 'CC0-1.0', layer: 'places', tags: ['do:sit', 'do:swim'], summary: 'Swim near an open tower.' };
const paddle = { id: 'pc:gear:volair-shift', type: 'gear', name: 'Volair Shift', site: 'pointcast.xyz', url: 'https://pointcast.xyz/paddles/volair-shift', source: [src('https://volair.com/collections/shift-collection', '2026-09-21', 'listing')], updated: '2026-09-21', license: 'CC0-1.0', layer: 'paddles' };

function fixtureIndex() {
  const pc = assembleAtlas(SITE, [LAYER, { id: 'paddles', name: 'Paddles', types: ['gear'], license: 'CC0-1.0', updated: '2026-09-21' }], [good({ links: [{ rel: 'same-as', id: 'es:court:recreation-park-courts' }] }), paddle], '2026-11-08T00:00:00Z');
  const es = assembleAtlas(ES_SITE, [{ id: 'places', name: 'Places', types: ['place', 'court'], license: 'CC0-1.0', updated: '2026-10-29' }], [esCourt, esBeach], '2026-11-08T01:00:00Z');
  assert.deepEqual(atlasProblems(pc), []);
  assert.deepEqual(atlasProblems(es), []);
  const index = mergeAtlases({ ...SITE, indexName: 'Index', indexDescription: 'x', indexMap: 'https://pointcast.xyz/cartography/map?site=all' }, [{ atlas: pc, url: 'https://pointcast.xyz/atlas.json', ok: true }, { atlas: es, url: 'https://elsegundo.xyz/atlas.json', snapshot: '2026-11-08', ok: true }, { atlas: null, url: 'https://industrynext.xyz/atlas.json', ok: false, note: 'no snapshot' }], '2026-11-08T02:00:00Z');
  return { pc, es, index };
}

test('mergeAtlases keeps every id once, resolves cross links and reports unavailable sites', () => {
  const { index } = fixtureIndex();
  assert.deepEqual(atlasProblems(index), []);
  assert.equal(index.kind, 'merged-index');
  assert.equal(index.records.length, 4);
  assert.deepEqual(index.crossLinks.map((l) => `${l.from} ${l.rel} ${l.to}`).sort(), [
    'es:court:recreation-park-courts same-as pc:court:rec-park',
    'pc:court:rec-park same-as es:court:recreation-park-courts',
  ]);
  assert.equal(index.sites.length, 3);
  assert.equal(index.sites[2].ok, false);
  assert.equal(index.counts.byType.court, 2);
});

test('query: search ranks name matches first, filters by type/site and pages', () => {
  const { index } = fixtureIndex();
  const r = search(index, { q: 'park' });
  assert.equal(r.total, 2);
  assert.ok(r.items.every((i) => i.type === 'court'));
  assert.equal(search(index, { q: 'swim' }).items[0].id, 'es:place:el-segundo-beach');
  assert.equal(search(index, { type: 'gear' }).total, 1);
  assert.equal(search(index, { site: 'elsegundo.xyz' }).total, 2);
  assert.equal(search(index, { q: 'park swim' }).total, 0);
  const paged = search(index, { limit: 1 });
  assert.equal(paged.items.length, 1);
  assert.equal(paged.nextOffset, 1);
  assert.equal(search(index, { limit: 999 }).limit, 50);
  assert.deepEqual(Object.keys(compactRecord(paddle)), ['id', 'type', 'name', 'site', 'url', 'updated', 'layer', 'license']);
});

test('query: get resolves links both ways and names the layer', () => {
  const { index, pc } = fixtureIndex();
  const r = get(index, 'pc:court:rec-park');
  assert.equal(r.links[0].resolved, true);
  assert.equal(r.links[0].name, 'Recreation Park Courts');
  assert.equal(r.incoming[0].id, 'es:court:recreation-park-courts');
  assert.equal(r.layerInfo.name, 'Courts');
  assert.equal(get(index, 'pc:court:nope'), null);
  assert.equal(get(pc, 'pc:court:rec-park').links[0].resolved, false, 'a site atlas cannot resolve a sister id');
});

test('query: near is straight-line, sorted, radius-clamped and honours type', () => {
  const { index } = fixtureIndex();
  const r = near(index, { lat: 33.92044971, lon: -118.4153182, radiusMiles: 2 });
  assert.equal(r.total, 3);
  assert.ok(r.items[0].distanceMiles <= r.items[1].distanceMiles);
  assert.ok(r.items.every((i) => typeof i.compass === 'string' && Number.isInteger(i.bearing)));
  assert.equal(near(index, { lat: 33.92, lon: -118.41, radiusMiles: 999 }).radiusMiles, 25);
  assert.equal(near(index, { lat: 33.92, lon: -118.41, type: 'place' }).total, 0, 'the beach is 1.1 miles out; default radius is 1');
  assert.equal(near(index, { lat: 33.92, lon: -118.41, type: 'place', radiusMiles: 3 }).total, 1);
  assert.throws(() => near(index, { lat: 'x', lon: 1 }), /lat and lon are required/);
  assert.match(r.distanceNote, /not a route/);
});

test('query: links walks out and back, one or two hops, and marks unresolved ids', () => {
  const { index, pc } = fixtureIndex();
  const g = links(index, { id: 'pc:court:rec-park' });
  assert.deepEqual(g.nodes.map((n) => n.id).sort(), ['es:court:recreation-park-courts', 'pc:court:rec-park']);
  assert.equal(g.edges.length, 2);
  const g2 = links(pc, { id: 'pc:court:rec-park' });
  assert.equal(g2.nodes.find((n) => n.id === 'es:court:recreation-park-courts').resolved, false);
  assert.equal(links(index, { id: 'pc:court:rec-park', rel: 'near' }).edges.length, 0);
  assert.equal(links(index, { id: 'nope' }), null);
  assert.equal(provenance(index).kind, 'merged-index');
});

test('sortRecords orders by vocabulary type, then id', () => {
  const ids = sortRecords([paddle, esBeach, esCourt]).map((r) => r.id);
  assert.deepEqual(ids, ['es:place:el-segundo-beach', 'es:court:recreation-park-courts', 'pc:gear:volair-shift']);
});
