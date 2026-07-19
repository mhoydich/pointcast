import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Common Hours has a human landing page, machine index, and app shelf entry', async () => {
  const [page, json, data, apps] = await Promise.all([
    read('src/pages/common-hours.astro'),
    read('src/pages/common-hours.json.ts'),
    read('src/lib/common-hours.ts'),
    read('src/lib/pointcast-apps.ts'),
  ]);
  assert.match(page, /Small rituals for the hours we share/);
  assert.match(page, /COMMON_HOURS_RITUALS/);
  assert.match(json, /application\/json/);
  assert.match(data, /Daily Chimes/);
  assert.match(data, /Prayer Bells/);
  assert.match(data, /Morning Hours/);
  assert.match(apps, /slug: 'common-hours'/);
  assert.match(apps, /https:\/\/common-hours\.mhoydich\.chatgpt\.site/);
});
