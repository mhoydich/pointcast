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

test('Alabama Field File 001 publishes the requested three-part editorial', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/25/alabama-after-saban.astro'),
    read('src/lib/pointcast-25-alabama.ts'),
  ]);

  assert.match(page, /THE STATE OF/);
  assert.match(page, /PART I · THE PROGRAM/);
  assert.match(page, /PART II · THE FORMER COACH/);
  assert.match(page, /PART III · A LIGHT SEC PRIMER/);
  assert.match(page, /THE QUARTERBACK REFERENDUM/);
  assert.match(page, /THE FOUR-DATE SEASON/);
  assert.match(page, /THE RECEIPT BOOK/);
  assert.match(page, /prefers-reduced-motion/);

  assert.match(data, /pointcast\.25-field-file\/v1/);
  assert.match(data, /The State of Alabama \/ The State of Nick Saban/);
  assert.match(data, /Austin Mack/);
  assert.match(data, /Keelon Russell/);
  assert.match(data, /THE CROWN/);
  assert.match(data, /THE PLAYOFF CROWD/);
  assert.match(data, /THE VOLATILE MIDDLE/);
  assert.match(data, /THE UPSET TAX/);
  assert.equal((data.match(/publisher:/g) || []).length, 11);
});

test('the Saban section distinguishes current facts, policy, counter-read, and inference', async () => {
  const data = await read('src/lib/pointcast-25-alabama.ts');

  assert.match(data, /remains retired from coaching/);
  assert.match(data, /ESPN lists him as a college-football analyst/);
  assert.match(data, /Protect College Sports Act/);
  assert.match(data, /The SEC and Big Ten opposed the bill/);
  assert.match(data, /Saban’s position is coherent, but it is not neutral/);
  assert.match(data, /There is no credible current report of an imminent coaching return/);
  assert.doesNotMatch(data, /Saban is returning to coach/);
});

test('Alabama Field File has a CORS-open machine twin and permanent Block 0529', async () => {
  const [endpoint, blockText] = await Promise.all([
    read('src/pages/25/alabama-after-saban.json.ts'),
    read('src/content/blocks/0529.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /pointcast\.xyz\/25\/alabama-after-saban/);
  assert.match(endpoint, /alabamaTeamReceipt/);
  assert.match(endpoint, /Facts and source links were checked July 28, 2026/);
  assert.equal(block.id, '0529');
  assert.equal(block.channel, 'BTL');
  assert.equal(block.type, 'READ');
  assert.equal(block.author, 'codex');
  assert.equal(block.external.url, 'https://pointcast.xyz/25/alabama-after-saban');
  assert.equal(block.meta.sourceCount, 11);
  assert.equal(block.meta.pointcastRank, 11);
  assert.equal(block.meta.secMediaRank, 6);
});

test('the article is discoverable from the 25 desk, machine board, sitemap, and LLM surfaces', async () => {
  const [desk, board, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/25/index.astro'),
    read('src/pages/25.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const text of [desk, board, sitemap, llms, llmsFull]) {
    assert.match(text, /25\/alabama-after-saban/);
  }
  assert.match(desk, /FIELD FILE 001/);
  assert.match(desk, /BLOCK 0529/i);
  assert.match(board, /fieldFiles/);
  assert.match(llms, /Block 0529 is the permanent record/);
  assert.match(llmsFull, /Alabama Field File 001/);
});

test('Field File 001 social card is a 1200 by 630 PNG', async () => {
  const card = new URL('../public/images/og/b/0529.png', import.meta.url);
  await access(card);
  assert.deepEqual(pngSize(await readFile(card)), { width: 1200, height: 630 });
});
