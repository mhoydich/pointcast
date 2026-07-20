import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Common Hours has a featured human landing page, public machine index, app shelf entry, and discovery links', async () => {
  const [page, json, data, apps, home, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/common-hours.astro'),
    read('src/pages/common-hours.json.ts'),
    read('src/lib/common-hours.ts'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/index.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);
  await access(new URL('src/assets/common-hours/field-guide.png', root));
  assert.match(page, /Small rituals for the hours we share/);
  assert.match(page, /COMMON_HOURS_RITUALS/);
  assert.match(page, /common-hours-field-guide\.png/);
  assert.match(json, /application\/json/);
  assert.match(json, /status: 'live'/);
  assert.match(json, /access: 'public'/);
  assert.match(json, /Access-Control-Allow-Origin/);
  assert.match(data, /Daily Chimes/);
  assert.match(data, /Prayer Bells/);
  assert.match(data, /Morning Hours/);
  assert.match(apps, /slug: 'common-hours'/);
  assert.match(apps, /https:\/\/common-hours\.mhoydich\.chatgpt\.site/);
  assert.match(home, /title: 'Common Hours'/);
  assert.match(home, /commonHoursCard\.src/);
  assert.match(sitemap, /pointcast\.xyz\/common-hours\.json/);
  assert.match(llms, /Common Hours, a public field guide/);
  assert.match(llmsFull, /Common Hours:/);
});
