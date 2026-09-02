import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

test('Kennel Club ships its room, all per-sitting routes, and JSON twins', async () => {
  for (const path of [
    'src/lib/kennel-club.ts',
    'src/pages/kennel-club.astro',
    'src/pages/kennel-club.json.ts',
    'src/pages/kennel-club/[slug].astro',
    'src/pages/kennel-club/[slug].json.ts',
    'src/pages/send/kennel-club.astro',
    'src/pages/send/kennel-club.json.ts',
    'src/pages/send/kennel-club.txt.ts',
  ]) assert.ok(exists(path), path);

  const [room, helper, plate, plateJson] = await Promise.all([
    read('src/pages/kennel-club.astro'),
    read('src/lib/kennel-club.ts'),
    read('src/pages/kennel-club/[slug].astro'),
    read('src/pages/kennel-club/[slug].json.ts'),
  ]);
  assert.match(helper, /America\/Los_Angeles/);
  assert.match(helper, /sittingOfTheDay/);
  assert.match(helper, /export function calendar/);
  assert.match(room, /The club opened two days late; the first two dogs were already waiting\./);
  assert.match(room, /Mint window opens when the contract lands\./);
  assert.match(room, /calendar__grid/);
  assert.match(room, /data-sitting-date/);
  assert.match(room, /imageWidth=\{1024\}/);
  assert.match(plate, /TZIP-21-style metadata/);
  assert.match(plate, /image=\{sitting\.image\.png\}/);
  assert.match(plateJson, /sittingPayload/);
});

test('the September calendar is complete and every plate has a verified image route', async () => {
  const series = JSON.parse(await read('src/data/kennel-club-september-sitting.json'));
  assert.equal(series.sittings.length, 30);
  assert.deepEqual(series.sittings.map((sitting) => sitting.day), Array.from({ length: 30 }, (_, index) => index + 1));
  for (const sitting of series.sittings) {
    assert.equal(sitting.image.status, 'verified');
    assert.ok(exists(`public${sitting.image.png}`), `${sitting.slug} PNG`);
    assert.ok(exists(`public${sitting.image.webp}`), `${sitting.slug} WebP`);
  }
});

test('the front door and send shelf expose today’s sitting', async () => {
  const [home, send, sitemap] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/lib/send-sheets.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
  ]);
  assert.match(home, /title: 'Today’s Sitting', href: '\/kennel-club'/);
  assert.match(home, /tag: 'KENNEL'/);
  assert.match(send, /slug: 'kennel-club'/);
  assert.match(send, /Thirty original dog portrait plates/);
  for (const route of ['/kennel-club', '/kennel-club.json', '/send/kennel-club', '/send/kennel-club.json', '/send/kennel-club.txt']) {
    assert.ok(sitemap.includes(`'https://pointcast.xyz${route}'`), `${route} in discovery sitemap`);
  }
});

test('built Kennel Club routes have a resolved today, 30 calendar records, and plate OG metadata', { skip: !exists('dist/kennel-club.json') && 'run npm run build:bare first' }, async () => {
  const calendar = JSON.parse(await read('dist/kennel-club.json'));
  const sitting = JSON.parse(await read('dist/kennel-club/02-hartley.json'));
  const page = await read('dist/kennel-club/02-hartley/index.html');
  assert.equal(calendar.calendar.length, 30);
  assert.ok(calendar.today?.sitting?.slug, 'today resolves to a sitting');
  assert.equal(sitting.attributes.length, 5, 'TZIP-21-style attributes arrive in the JSON twin');
  assert.match(page, /og:image/);
  assert.match(page, /02-hartley\.png/);
});
