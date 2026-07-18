import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('Corner Engineering Pulse ships as a PointCast-native app', async () => {
  const [page, apps, launch] = await Promise.all([
    readFile(new URL('src/pages/corner.astro', root), 'utf8'),
    readFile(new URL('src/lib/pointcast-apps.ts', root), 'utf8'),
    readFile(new URL('src/components/AppLaunchStrip.astro', root), 'utf8'),
  ]);

  assert.match(page, /The work knows where it happened\./);
  assert.match(page, /CONCEPT SYSTEM · SYNTHETIC DATA/);
  assert.match(page, /TST-24-117/);
  assert.match(page, /data-filter="hazard"/);
  assert.match(page, /data-publish/);
  assert.match(page, /aria-label="Facility context map"/);
  assert.match(apps, /slug: 'corner-engineering'/);
  assert.match(apps, /path: '\/corner'/);
  assert.match(launch, /name: 'CORNER'.*href: '\/corner'/);
});

test('built route contains machine-share metadata and core controls', async () => {
  const html = await readFile(new URL('dist/corner/index.html', root), 'utf8');
  assert.match(html, /<title>Corner Engineering Pulse — PointCast<\/title>/);
  assert.match(html, /https:\/\/pointcast\.xyz\/images\/og\/corner-engineering\.png/);
  assert.match(html, /Publish engineering signal/);
  assert.match(html, /Mobile engineering navigation/);
});
