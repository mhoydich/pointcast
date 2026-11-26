/**
 * The committed PointCast atlas (public/atlas.json) and merged index (public/atlas/index.json):
 * valid against the Atlas rules, not stale against the layer adapters, and honouring the policies
 * in docs/cartography/ATLAS.md §5. Rebuild with `node scripts/atlas/build.mjs`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { atlasProblems, sameAtlas, haversineMiles } from '../scripts/atlas/lib.mjs';
import { buildSiteAtlas, buildIndex } from '../scripts/atlas/build.mjs';
import { site } from '../scripts/atlas/site.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const atlas = read('public/atlas.json');
const index = read('public/atlas/index.json');
const schema = read('public/atlas/schema.json');

test('public/atlas.json is a valid site atlas with the shared center and at least the core layers', () => {
  assert.deepEqual(atlasProblems(atlas), []);
  assert.equal(atlas.kind, 'site-atlas');
  assert.equal(atlas.site, 'pointcast.xyz');
  assert.equal(atlas.$schema, 'https://pointcast.xyz/atlas/schema.json');
  assert.equal(atlas.center.lat, 33.92044971);
  assert.equal(atlas.center.lon, -118.4153182);
  assert.equal(atlas.radiusMiles, 25);
  assert.ok(atlas.records.length >= 40, `expected a real atlas, got ${atlas.records.length} records`);
  assert.ok(atlas.counts.located >= 10, 'at least the court and shrine spots should carry coordinates');
  for (const required of ['court', 'gear', 'shrine', 'agent', 'page', 'tool']) assert.ok(atlas.counts.byType[required] > 0, `no ${required} records`);
  assert.ok(atlas.layers.length >= 6, 'expected several layers');
});

test('the committed atlas matches what the adapters build today (run node scripts/atlas/build.mjs)', async () => {
  const { atlas: fresh, problems } = await buildSiteAtlas({ generated: atlas.generated });
  assert.deepEqual(problems, []);
  assert.ok(sameAtlas(atlas, fresh), 'public/atlas.json is stale');
  const { index: freshIndex, problems: ip } = await buildIndex(fresh, { generated: index.generated });
  assert.deepEqual(ip, []);
  assert.ok(sameAtlas(index, freshIndex), 'public/atlas/index.json is stale');
});

test('policies: every record has a public https source and a check date; no record is more than radius+100 miles out without a tag', () => {
  for (const r of atlas.records) {
    assert.ok(r.source.length >= 1 && r.source.every((s) => s.url.startsWith('https://') && /^\d{4}-\d{2}-\d{2}$/.test(s.checked)), r.id);
    if (r.location) {
      const miles = haversineMiles(site.center, r.location);
      if (miles > site.radiusMiles) assert.ok((r.tags || []).includes('wider'), `${r.id} is ${miles.toFixed(1)} mi out and must carry the "wider" tag`);
    }
  }
});

test('policies: people appear only as they published themselves', () => {
  for (const r of atlas.records.filter((x) => x.type === 'player')) {
    assert.ok((r.tags || []).includes('claimed'), `${r.id}: player records need a verified claim (tag "claimed")`);
    assert.ok(r.source.some((s) => s.label === 'fact' || s.label === 'listing'), `${r.id}: a claim needs a public source`);
  }
});

test('policies: cannabis records carry the sensitive flag so sister sites can skip them', () => {
  for (const r of atlas.records) {
    const text = `${r.name} ${r.summary || ''} ${r.layer} ${(r.tags || []).join(' ')}`.toLowerCase();
    if (/dispensar|cannabis|\bthc\b|\bcbd\b/.test(text)) assert.ok((r.sensitive || []).includes('cannabis'), `${r.id} mentions cannabis without sensitive: ["cannabis"]`);
  }
});

test('the merged index merges every snapshot, links across sites and never loses a PointCast record', () => {
  assert.deepEqual(atlasProblems(index), []);
  assert.equal(index.kind, 'merged-index');
  assert.ok(index.sites.some((s) => s.site === 'pointcast.xyz' && s.ok));
  assert.ok(index.sites.some((s) => s.site === 'elsegundo.xyz'), 'elsegundo.xyz must be listed even when its snapshot is missing');
  const ids = new Set(index.records.map((r) => r.id));
  for (const r of atlas.records) assert.ok(ids.has(r.id), `${r.id} missing from the index`);
  for (const l of index.crossLinks) assert.notEqual(l.from.split(':')[0], l.to.split(':')[0]);
  if (index.sites.find((s) => s.site === 'elsegundo.xyz' && s.ok)) {
    assert.ok(index.crossLinks.length >= 1, 'with both atlases present there should be at least one same-as link across sites');
    assert.ok(index.records.every((r) => r.site !== 'elsegundo.xyz' || !(r.sensitive || []).includes('cannabis')), 'elsegundo.xyz never publishes cannabis records');
  }
});

test('the published JSON Schema agrees with the framework vocabulary', () => {
  const defs = schema.$defs;
  assert.deepEqual(defs.type.enum, ['place', 'court', 'player', 'gear', 'event', 'league', 'business', 'quiet-place', 'shrine', 'ping', 'page', 'bot', 'agent', 'route', 'area', 'dataset', 'feed', 'tool']);
  assert.deepEqual(defs.rel.enum, ['near', 'in', 'part-of', 'has-part', 'same-as', 'about', 'plays-at', 'hosted-at', 'made-by', 'sells', 'reads', 'answers', 'see-also']);
  assert.ok(defs.record.required.includes('source') && defs.record.required.includes('license') && defs.record.required.includes('layer'));
  for (const t of Object.keys(atlas.counts.byType)) assert.ok(defs.type.enum.includes(t), t);
});

test('ajv agrees with the hand-rolled validator on the committed files', async () => {
  const { default: Ajv } = await import('ajv/dist/2020.js');
  const { default: addFormats } = await import('ajv-formats');
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  for (const [name, doc] of [['atlas', atlas], ['index', index]]) assert.ok(validate(doc), `${name}: ${JSON.stringify((validate.errors || []).slice(0, 5))}`);
  if (existsSync(new URL('src/data/atlas/snapshots/elsegundo.xyz.json', root))) assert.ok(validate(read('src/data/atlas/snapshots/elsegundo.xyz.json')), JSON.stringify((validate.errors || []).slice(0, 5)));
});
