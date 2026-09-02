import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Microduck is published as Future Book 001 Companion 05 and Block 0579', async () => {
  const block = JSON.parse(await read('src/content/blocks/0579.json'));
  assert.equal(block.id, '0579');
  assert.equal(block.channel, 'FD');
  assert.equal(block.type, 'READ');
  assert.equal(block.author, 'mh+cc');
  assert.match(block.source, /add to pointcast/i);
  assert.equal(block.external.url, 'https://pointcast.xyz/digital-pets/microduck');
  assert.ok(block.companions.some((item) => item.id.endsWith('/digital-pets/microduck.json')));
});
test('the Future Book doorway and homepage link to the native Microduck route', async () => {
  const [book, home] = await Promise.all([
    read('src/pages/digital-pets.astro'),
    read('src/pages/index.astro'),
  ]);
  assert.match(book, /The living edition/);
  assert.match(book, /href="\/digital-pets\/microduck"/);
  assert.match(book, /Companion 05/);
  // front door rebuilt 2026-09-01: the Microduck door is a `covers` entry in index.astro's frontmatter (href: '/digital-pets/microduck', № 0579), not an inline <a href="…">.
  assert.match(home, /href(?:="|: ')\/digital-pets\/microduck["']/);
});

test('Microduck publishes full human and machine surfaces', async () => {
  const [page, json, agents, sitemap, llms] = await Promise.all([
    read('src/pages/digital-pets/microduck.astro'),
    read('src/pages/digital-pets/microduck.json.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
  ]);
  for (const marker of [
    'THE POINTCAST VERDICT',
    'HOW TO PROGRAM IT',
    'POINTCAST BEHAVIOR LAB',
    'Astra and Mythos',
    'BEYOND MICRODUCK',
  ]) assert.match(page, new RegExp(marker, 'i'));
  assert.match(json, /pointcast\.future-book-companion\/v1/);
  assert.match(agents, /digitalPetsMicroduck/);
  assert.match(sitemap, /digital-pets\/microduck\.json/);
  assert.match(llms, /Microduck/);
});

test('built Microduck HTML and JSON preserve the integrated release', async () => {
  const [html, json] = await Promise.all([
    read('dist/digital-pets/microduck/index.html'),
    read('dist/digital-pets/microduck.json'),
  ]);
  assert.match(html, /The first computer/);
  assert.match(html, /data-microduck-page/);
  assert.match(html, /\/images\/digital-pets\/microduck\/morning\.webp/);
  const payload = JSON.parse(json);
  assert.equal(payload.blockId, '0579');
  assert.equal(payload.companionNumber, 5);
  assert.equal(payload.behaviorLab.length, 3);
  assert.equal(payload.specifications.length, 8);
});
