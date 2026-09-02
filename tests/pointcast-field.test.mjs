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
  assert.match(page, /consented public count/i);
});

test('PointCast Field keeps the observation private and makes counting an explicit opt-in', async () => {
  const page = await read('src/pages/field.astro');

  assert.match(page, /Private to this browser · nothing uploads/);
  assert.match(page, /Count this receipt toward Field Season 001/);
  assert.match(page, /random browser\s+token/);
  assert.match(page, /choices, note, photograph, location, IP address, and\s+user agent are not stored/);
  assert.match(page, /fetch\("\/api\/field"/);
  assert.match(page, /credentials:\s*"omit"/);
  assert.match(page, /type:\s*"pointcast-field-participation-v1"/);
  assert.match(page, /invitationId,\s*participantToken,\s*consent:\s*true/);
  assert.doesNotMatch(page, /XMLHttpRequest/);
  assert.doesNotMatch(page, /sendBeacon/);
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
  assert.match(endpoint, /publicCount: true/);
  assert.match(endpoint, /publicCountMode: 'explicit-opt-in aggregate only'/);
  assert.match(endpoint, /photoUpload: false/);
  assert.match(endpoint, /endpoint: 'https:\/\/pointcast\.xyz\/api\/field'/);
  assert.match(endpoint, /consentRequired: true/);
  assert.match(endpoint, /tokenHandling: 'SHA-256 hashed before storage'/);
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

  // front door rebuilt 2026-09-01: /field is a door in the `rooms` array rendered by HomeRoomsShelf, not a HomePointCastField module
  assert.match(homepage, /href: '\/field'/);
  assert.match(homepage, /<HomeRoomsShelf rooms=\{rooms\} \/>/);
  assert.match(component, /href="\/field"/);
  assert.match(component, /Take today’s field prompt/);
  assert.match(component, /No account/);
  assert.match(component, /Private by default/);
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
