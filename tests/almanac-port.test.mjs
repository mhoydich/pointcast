import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

test('the almanac derives its places from the current local station lens', async () => {
  const [almanac, local] = await Promise.all([
    read('src/lib/almanac.ts'),
    read('src/lib/local.ts'),
  ]);

  assert.match(almanac, /import \{ ANCHOR, STATIONS, type Station \} from '\.\/local';/);
  assert.match(almanac, /\.\.\.\[\.\.\.STATIONS\]\.sort\(\(a, b\) => a\.miles - b\.miles\)\.map\(fromStation\)/);
  assert.match(local, /export const STATIONS: Station\[\]/);
  assert.match(almanac, /moonPhase, sunTimes/);
  assert.doesNotMatch(almanac, /heightFt|predictions:\s*\[/);
});

test('the tide proxy remains a live, named-station NOAA proxy with an honest failure message', async () => {
  const [tide, component] = await Promise.all([
    read('functions/api/tide.ts'),
    read('src/components/AlmanacTide.astro'),
  ]);

  for (const station of ['9410660', '9410840']) assert.match(tide, new RegExp(`'${station}'`));
  assert.match(tide, /api\.tidesandcurrents\.noaa\.gov/);
  assert.match(tide, /ALLOWED_STATIONS/);
  assert.doesNotMatch(tide, /cacheTtl|cacheEverything|max-age|stale-while-revalidate/);
  assert.match(tide, /'Cache-Control': 'no-store'/);
  assert.match(component, /Couldn't reach NOAA just now/);
  assert.doesNotMatch(component, /NOAA didn't answer|NOAA returned no predictions/);
});

test('the built almanac has 81 HTML routes, 16 JSON twins, and every facet', { skip: !exists('dist/almanac/index.html') && 'run npm run build:bare first' }, async () => {
  const { readdir } = await import('node:fs/promises');
  const places = (await readdir(new URL('../dist/almanac/', import.meta.url), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.equal(places.length, 16);
  assert.ok(exists('dist/almanac/index.html'));
  assert.equal((await Promise.all(places.map((place) => exists(`dist/almanac/${place}.json`)))).filter(Boolean).length, 16);
  for (const place of places) {
    assert.ok(exists(`dist/almanac/${place}/index.html`), place);
    for (const facet of ['sunset', 'sunrise', 'moon', 'daylight']) {
      assert.ok(exists(`dist/almanac/${place}/${facet}/index.html`), `${place}/${facet}`);
    }
  }

  const [facet, twin] = await Promise.all([
    read('dist/almanac/el-segundo/sunset/index.html'),
    read('dist/almanac/el-segundo.json'),
  ]);
  assert.match(facet, /data-live="date"/);
  assert.match(facet, /data-almanac-live/);
  assert.equal(JSON.parse(twin).tide.policy, 'not-computed');
});
