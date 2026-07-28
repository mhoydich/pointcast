import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('What I Keep Noticing publishes the selected manifesto as a warm visual issue', async () => {
  const page = await read('src/pages/noticing.astro');

  assert.match(page, /Everything turns out to be the same subject/);
  assert.match(page, /Coffee is a ritual for coordinating a body with a morning/);
  assert.match(page, /functionally infinite resources and painfully finite\s+coordination/);
  assert.match(page, /different altitudes over the same terrain/);
  assert.match(page, /New Friday/);
  assert.match(page, /Field notes arrive between/);
  assert.match(page, /Fable, Claude, and Codex in the room/);
  assert.match(page, /Six reasons to come back/);
});

test('The issue connects two published stories and four planned stories across five public altitudes', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/noticing.astro'),
    read('src/lib/noticing.ts'),
  ]);

  for (const altitude of ['body', 'home', 'town', 'network', 'world']) {
    assert.match(data, new RegExp(`id: '${altitude}'`));
    assert.match(page, new RegExp(`data-altitude=\\{altitude\\.id\\}`));
  }

  for (const title of [
    'The future of the library',
    'Why LaCroix',
    'Animal Crossing is a gift economy',
    'How to calendar a life',
    'Places we said to visit in 2023',
    'How a town builds its own wireless network',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(page, /data-altitude-control/);
  assert.match(page, /data-altitude-status/);
  assert.match(page, /Planned—not yet published/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /data-countdown/);
  assert.match(page, /data-copy-link/);
});

test('The editorial calendar has truthful machine, Block, home, and discovery companions', async () => {
  const [endpoint, data, blockText, home, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/noticing.json.ts'),
    read('src/lib/noticing.ts'),
    read('src/content/blocks/0512.json'),
    read('src/components/HomeNewEdition.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /pointcast\.editorial-desk\/v1/);
  assert.match(endpoint, /Only a story with status published and a related URL is represented as published/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0512');
  assert.equal(block.author, 'codex');
  assert.match(block.source, /Fable 5 low/);
  assert.equal(block.external.url, 'https://pointcast.xyz/noticing');
  assert.equal(block.meta.publicationStatus, 'editorial calendar');
  assert.match(home, /href="\/noticing\/why-lacroix"/);
  assert.match(home, /Why LaCroix · Block 0519/);
  assert.match(sitemap, /pointcast\.xyz\/noticing'/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\.json'/);
  assert.match(llms, /What I Keep Noticing/);
  assert.match(llmsFull, /companion is Block 0512/);
});

test('The issue has a 1200 by 630 social card and its source SVG', async () => {
  const pngUrl = new URL('../public/images/noticing/noticing-og.png', import.meta.url);
  const svgUrl = new URL('../public/images/noticing/noticing-og.svg', import.meta.url);
  await Promise.all([access(pngUrl), access(svgUrl)]);
  assert.deepEqual(pngSize(await readFile(pngUrl)), { width: 1200, height: 630 });
});
