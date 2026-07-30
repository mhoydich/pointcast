import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('PointCast Field ships one finite human invitation with an on-device receipt', async () => {
  const page = await read('src/pages/field.astro');

  assert.match(page, /Find the seat nobody designed/);
  assert.match(page, /duration|90 seconds|90-second|ninety-second/i);
  assert.match(page, /data-begin/);
  assert.match(page, /data-found/);
  assert.match(page, /data-observation-form/);
  assert.match(page, /data-stage="receipt"/);
  assert.match(page, /pointcast-field-observation-v1/);
  assert.match(page, /Does comfort appear before permission\?/);
  assert.match(page, /no public count/i);
});

test('PointCast Field keeps collection private and states the boundary in the interface', async () => {
  const page = await read('src/pages/field.astro');

  assert.match(page, /Private to this browser · nothing uploads/);
  assert.match(page, /no\s+location, image, or identity is transmitted/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(page, /XMLHttpRequest/);
  assert.doesNotMatch(page, /sendBeacon/);
  assert.doesNotMatch(page, /\/api\/field/);
});

test('PointCast Field has canonical, social, and machine-readable twins', async () => {
  const [page, endpoint] = await Promise.all([
    read('src/pages/field.astro'),
    read('src/pages/field.json.ts'),
  ]);

  assert.match(page, /rel="canonical" href="https:\/\/pointcast\.xyz\/field"/);
  assert.match(page, /rel="alternate" type="application\/json" href="\/field\.json"/);
  assert.match(page, /property="og:title" content="Find the seat nobody designed — PointCast Field"/);
  assert.match(page, /type="application\/ld\+json"/);

  assert.match(endpoint, /PC-FIELD-001/);
  assert.match(endpoint, /schema: 'https:\/\/pointcast\.xyz\/schemas\/field-invitation\/v1'/);
  assert.match(endpoint, /publicSubmission: false/);
  assert.match(endpoint, /photoUpload: false/);
  assert.match(endpoint, /completedFieldReceipts: 25/);
  assert.match(endpoint, /returningParticipants: 5/);
  assert.match(endpoint, /contributionsChangingNextEdition: 3/);
});

test('the homepage gives PointCast Field a direct doorway without replacing /now or /today', async () => {
  const [homepage, component, nowPage, todayPage] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomePointCastField.astro'),
    read('src/pages/now.astro'),
    read('src/pages/today.astro'),
  ]);

  assert.match(homepage, /import HomePointCastField/);
  assert.match(homepage, /<HomePointCastField \/>/);
  assert.match(component, /href="\/field"/);
  assert.match(component, /Take today’s field prompt/);
  assert.match(component, /No account/);
  assert.match(component, /No upload/);
  assert.match(nowPage, /Right now on PointCast/);
  assert.match(todayPage, /Daily Drop|today/i);
});

test('mobile rules protect the field action and avoid horizontal overflow primitives', async () => {
  const [page, component] = await Promise.all([
    read('src/pages/field.astro'),
    read('src/components/HomePointCastField.astro'),
  ]);

  assert.match(page, /min-width:\s*320px/);
  assert.match(page, /overflow-x:\s*hidden/);
  assert.match(page, /@media \(max-width: 900px\)[\s\S]*?\.found \{[\s\S]*?position:\s*fixed/);
  assert.match(component, /min-width:\s*0/);
  assert.match(component, /@media \(max-width: 900px\)/);
});
