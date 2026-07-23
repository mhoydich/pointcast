import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('LOCAL STAR COMMONS has canonical human, machine, Block, press, and discovery surfaces', async () => {
  const [page, packet, block, press, sitemap, llms, llmsFull, ads] = await Promise.all([
    read('src/pages/local-star-commons.astro'),
    read('src/pages/local-star-commons.json.ts'),
    read('src/content/blocks/0490.json'),
    read('src/data/press-releases.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/lib/open-ad-network.ts'),
  ]);

  assert.match(page, /https:\/\/pointcast\.xyz\/local-star-commons/);
  assert.match(page, /local-star-commons\.json/);
  assert.match(page, /Read Block 0490/);
  assert.match(page, /NO TOKEN, TREASURY, FUNDRAISING/i);
  assert.match(packet, /local-star-commons-001/);
  assert.match(packet, /radiusMiles: 25/);
  assert.match(packet, /legalEntity: false/);
  assert.match(packet, /token: false/);
  assert.match(packet, /mainnetActions: false/);
  assert.match(block, /"id": "0490"/);
  assert.match(block, /"author": "codex"/);
  assert.match(press, /PCPW-2026-0013/);
  assert.match(sitemap, /pointcast\.xyz\/local-star-commons\.json/);
  assert.match(llms, /LOCAL STAR COMMONS/);
  assert.match(llmsFull, /LOCAL STAR COMMONS/);
  assert.match(ads, /PC-LOCAL-STAR-COMMONS-001/);
});

test('LOCAL STAR COMMONS release keeps the governance and deployment boundary explicit', async () => {
  const [packet, block, press] = await Promise.all([
    read('src/pages/local-star-commons.json.ts'),
    read('src/content/blocks/0490.json'),
    read('src/data/press-releases.json'),
  ]);
  const text = `${packet}\n${block}\n${press}`;

  assert.match(text, /off-chain/i);
  assert.match(text, /no token/i);
  assert.match(text, /treasury/i);
  assert.match(text, /device-local/i);
  assert.match(text, /not a legal/i);
  assert.match(text, /physical mesh/i);
});
