import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-hardpoint-softkit.png',
  '02-ten-people-one-courtyard.png',
  '03-vertical-nest.png',
  '04-tide-room.png',
  '05-wave-foundry.png',
  '06-long-night-commons.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Beach Commons publishes one coherent six-prototype human field study', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons.astro'),
    read('src/lib/beach-commons.ts'),
  ]);

  assert.match(page, /Dockweiler Beach Commons/);
  assert.match(page, /Hardpoint \+ Softkit/);
  assert.match(page, /dialog/);
  assert.match(page, /event\.key === 'Escape'/);
  assert.match(page, /opener\?\.focus\(\)/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(data, /Speculative architecture only/);
  assert.match(data, /The Hardpoint \+ Softkit/);
  assert.match(data, /Ten People, One Courtyard/);
  assert.match(data, /The Vertical Nest/);
  assert.match(data, /The Tide Room/);
  assert.match(data, /Wave Foundry/);
  assert.match(data, /The Long Night Commons/);
});

test('Beach Commons has a machine twin, permanent Block 0506, and discovery entries', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/beach-commons.json.ts'),
    read('src/content/blocks/0506.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /prototypes/);
  assert.equal(block.id, '0506');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.works, 6);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons');
  assert.match(block.meta.design_status, /conceptual/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons'/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\.json/);
  assert.match(llms, /Dockweiler Beach Commons/);
  assert.match(llmsFull, /PointCast Field Study 001/);
});

test('Beach Commons image and social assets have the intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  const cardUrl = new URL('../public/images/og/beach-commons.png', import.meta.url);
  await access(cardUrl);
  const cardSize = pngSize(await readFile(cardUrl));

  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
  assert.deepEqual(cardSize, { width: 1200, height: 630 });
});
