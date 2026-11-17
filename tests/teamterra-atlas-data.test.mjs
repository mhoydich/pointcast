import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const atlasRoot = new URL('../public/teamterra-atlas/', import.meta.url);
const read = (path) => readFileSync(new URL(path, atlasRoot), 'utf8');
const atlas = JSON.parse(read('atlas.json'));
const geojson = JSON.parse(read('places.geojson'));

test('every curated record has an explicit reuse status and a unique ID', () => {
  assert.ok(atlas.records.length > 0, 'curated records must not be empty');
  const ids = new Set();
  for (const record of atlas.records) {
    assert.equal(typeof record.id, 'string', 'record ID must be a string');
    assert.ok(record.id.trim(), 'record ID must not be blank');
    assert.ok(!ids.has(record.id), `duplicate curated ID: ${record.id}`);
    ids.add(record.id);
    assert.equal(typeof record.reuse_status, 'string', `${record.id}: missing reuse_status`);
    assert.ok(record.reuse_status.trim(), `${record.id}: blank reuse_status`);
  }
});

test('the dataset loaded by the browser matches the curated source dataset', () => {
  const context = { window: {} };
  runInNewContext(read('assets/atlas-data.js'), context, { timeout: 1000 });
  // Normalize the VM realm before comparing; only the bundled world map is extra.
  const { world, ...browserAtlas } = JSON.parse(JSON.stringify(context.window.TEAMTERRA));
  assert.equal(world.type, 'FeatureCollection');
  assert.ok(world.features.length > 0, 'the browser world map must remain bundled');
  assert.deepEqual(browserAtlas, atlas, 'browser records and metadata must match atlas.json');
});

test('curated GeoJSON preserves each mapped record and its reuse status', () => {
  assert.equal(geojson.type, 'FeatureCollection');
  const mapped = new Map(atlas.records.filter((record) => record.coordinates).map((record) => [record.id, record]));
  const ids = new Set();
  for (const feature of geojson.features) {
    assert.equal(feature.type, 'Feature');
    assert.ok(!ids.has(feature.id), `duplicate GeoJSON ID: ${feature.id}`);
    ids.add(feature.id);
    const record = mapped.get(feature.id);
    assert.ok(record, `${feature.id}: feature has no matching mapped record`);
    assert.equal(feature.properties.id, record.id);
    assert.equal(feature.geometry.type, 'Point', record.id);
    assert.deepEqual(feature.geometry.coordinates, record.coordinates, record.id);
    assert.equal(typeof feature.properties.reuse_status, 'string', `${record.id}: missing exported reuse_status`);
    assert.ok(feature.properties.reuse_status.trim(), `${record.id}: blank exported reuse_status`);
    assert.equal(feature.properties.reuse_status, record.reuse_status, `${record.id}: exported reuse status differs`);
  }
  assert.deepEqual([...ids].sort(), [...mapped.keys()].sort(), 'every mapped record must appear exactly once');
});
