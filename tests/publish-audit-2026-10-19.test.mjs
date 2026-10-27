import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { BLOCK_ID, PAGE_PATH, receipt, ruleCount, slides } from '../src/data/publish-audit-2026-10-19.mjs';
import { clampIndex, indexAfterKey, keyToDelta } from '../src/scripts/publish-audit-deck.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('block 0723 is free on current main and unused by this collection', async () => {
  assert.equal(BLOCK_ID, '0723');
  const names = (await readdir(new URL('../src/content/blocks/', import.meta.url))).filter((name) => name.endsWith('.json'));
  const ids = [];
  for (const name of names) {
    const block = JSON.parse(await read(`src/content/blocks/${name}`));
    assert.equal(name, `${block.id}.json`, `${name} must match its id`);
    ids.push(block.id);
  }
  assert.equal(new Set(ids).size, ids.length, 'block ids must be unique');
  assert.equal(ids.filter((id) => id === '0723').length, 1);
  assert.ok(names.includes('0722.json'));
  assert.ok(!names.includes('0720.json'));
  assert.ok(!names.includes('0724.json'));
  assert.ok(Number(BLOCK_ID) > 722);

  const guides = JSON.parse(await read('src/content/blocks/0716.json'));
  assert.equal(guides.id, '0716');
  assert.equal(guides.title, 'PointCast Guides: About.com, rebuilt for 2028');

  const witness = JSON.parse(await read('src/content/blocks/0722.json'));
  assert.equal(witness.id, '0722');
  assert.equal(witness.title, 'Be a witness from your browser, or claim a channel');

  const block = JSON.parse(await read('src/content/blocks/0723.json'));
  assert.equal(block.id, '0723');
  assert.equal(block.channel, 'FD');
  assert.equal(block.type, 'READ');
  assert.equal(block.author, 'cc');
  assert.equal(block.draft, false);
  assert.match(block.source, /7efd2faa/);
  assert.equal(block.external.url, 'https://pointcast.xyz/publishing/2026-10-19/');
  assert.match(block.body, /0723/);
  assert.match(block.body, /#1440/);
});

test('the deck states the Oct 19 audit and the eight rules', () => {
  assert.equal(PAGE_PATH, '/publishing/2026-10-19/');
  assert.equal(receipt.commit, '7efd2faa');
  assert.equal(receipt.pr, '1446');
  assert.equal(receipt.deployRun, '39340471436');
  assert.equal(receipt.deployAt, '4:15 PM PT');
  assert.equal(ruleCount, 8);
  assert.equal(slides.filter((slide) => slide.kind === 'rule').length, 8);

  const text = JSON.stringify(slides);
  for (const fact of [
    'Every PR merged on Oct 19 is live.',
    '4:15 PM PT',
    '7efd2faa',
    '39340471436',
    '#1446',
    'Nothing merged is waiting.',
    'Status 200, and the title matches.',
    'block 0710',
    '#1431',
    'block 0711',
    '#1436',
    '#1439',
    '#1437',
    '#1438',
    '#1424',
    'block 0714',
    '#1435',
    '#1441',
    '#1444',
    '#1446',
    '#1415',
    '#1430',
    '#1416',
    '#1432',
    '0710',
    '#1433',
    '0711',
    '#1440',
    '#1445',
    '#1442',
    '#1434',
    '#1443',
    '#1447',
    '#1448',
    'pointcast-devnet-1',
    'October 8',
    'GROK_INBOX_TOKEN',
    'Claim the number on current main.',
    'Merged is not live.',
    'matches zero tests',
    'Do not push a merged branch.',
    'Close what you replaced.',
    'Rebase before a batch.',
    'Write down the receipt.',
    'One path to main.',
  ]) {
    assert.ok(text.includes(fact), fact);
  }

  const ids = slides.map((slide) => slide.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('arrow keys move one slide and stop at the ends', () => {
  assert.equal(keyToDelta('ArrowRight'), 1);
  assert.equal(keyToDelta('ArrowDown'), 1);
  assert.equal(keyToDelta('ArrowLeft'), -1);
  assert.equal(keyToDelta('ArrowUp'), -1);
  assert.equal(keyToDelta('PageDown'), 1);
  assert.equal(keyToDelta(' '), 1);
  assert.equal(indexAfterKey(0, slides.length, 'ArrowLeft'), 0);
  assert.equal(indexAfterKey(0, slides.length, 'ArrowRight'), 1);
  assert.equal(indexAfterKey(slides.length - 1, slides.length, 'ArrowRight'), slides.length - 1);
  assert.equal(indexAfterKey(4, slides.length, 'Home'), 0);
  assert.equal(indexAfterKey(4, slides.length, 'End'), slides.length - 1);
  assert.equal(clampIndex(-3, 10), 0);
  assert.equal(clampIndex(99, slides.length), slides.length - 1);
});

test('the slide page is a scroll-snap deck with keyboard controls', async () => {
  const page = await read('src/pages/publishing/2026-10-19.astro');
  assert.match(page, /scroll-snap-type:\s*y mandatory/);
  assert.match(page, /data-deck/);
  assert.match(page, /data-dir="-1"/);
  assert.match(page, /data-dir="1"/);
  assert.match(page, /indexAfterKey/);
  assert.match(page, /100dvh/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /publish-audit-2026-10-19\.mjs/);
  const json = await read('src/pages/publishing/2026-10-19.json.ts');
  assert.match(json, /publish-audit-2026-10-19\.mjs/);
});
