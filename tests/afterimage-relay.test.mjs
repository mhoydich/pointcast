import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('Afterimage Relay accepts bounded Passport room slugs and exposes share, remix, and guarded mint routes', async () => {
  const [page, apps, detail, detailJson, catalog, examplesText, sitemap, llms, llmsRoute, robotsRoute] = await Promise.all([
    readFile(new URL('src/pages/afterimage.astro', root), 'utf8'),
    readFile(new URL('src/lib/pointcast-apps.ts', root), 'utf8'),
    readFile(new URL('src/pages/afterimage/[slug].astro', root), 'utf8'),
    readFile(new URL('src/pages/afterimage/[slug].json.ts', root), 'utf8'),
    readFile(new URL('src/pages/afterimage.json.ts', root), 'utf8'),
    readFile(new URL('src/data/afterimage-examples.json', root), 'utf8'),
    readFile(new URL('src/pages/sitemap-discovery.xml.ts', root), 'utf8'),
    readFile(new URL('public/llms.txt', root), 'utf8'),
    readFile(new URL('src/pages/llms.txt.ts', root), 'utf8'),
    readFile(new URL('src/pages/robots.txt.ts', root), 'utf8'),
  ]);
  const examples = JSON.parse(examplesText);

  assert.match(apps, /slug: 'afterimage'/);
  assert.match(page, /passportz\.xyz\/afterimage\/room/);
  assert.match(page, /\^\[a-z0-9\]\{8,16\}\$/);
  assert.match(page, /api\/afterimage\/room\/\$\{slug\}\/image/);
  assert.match(page, /api\/afterimage\/room\/\$\{slug\}\/audio/);
  assert.match(page, /MINT WITH KUKAI/);
  assert.match(page, /REMIX IMAGE/);
  assert.match(page, /SHARE RELAY/);
  assert.match(page, /REQUEST \/ CREATE A LINK/);
  assert.match(page, /data-example-slug/);
  assert.match(page, /nothing is minted automatically/i);
  assert.equal(examples.length, 10);
  assert.equal(new Set(examples.map((example) => example.slug)).size, 10);
  assert.ok(examples.every((example) => /^[a-z0-9]{8,16}$/.test(example.slug)));
  assert.ok(examples.every((example) => ['nocturne', 'signal', 'levitate'].includes(example.direction)));
  assert.match(detail, /MusicRecording/);
  assert.match(detail, /<audio controls/);
  assert.match(detailJson, /Access-Control-Allow-Origin/);
  assert.match(catalog, /requestUrl/);
  assert.match(sitemap, /afterimageExamples\.flatMap/);
  assert.match(llms, /machine-readable catalog of ten public image-to-music/);
  assert.match(llmsRoute, /text\/plain; charset=utf-8/);
  assert.match(robotsRoute, /public\/robots\.txt\?raw/);
});
