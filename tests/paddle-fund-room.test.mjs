import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

test('The Paddle Fund ships its room, JSON twin, block, and discovery lines', async () => {
  for (const path of [
    'src/lib/paddle-fund.ts',
    'src/pages/paddle-fund.astro',
    'src/pages/paddle-fund.json.ts',
    'src/content/blocks/0594.json',
  ]) assert.ok(exists(path), path);

  const [lib, room, block, sitemap, llms] = await Promise.all([
    read('src/lib/paddle-fund.ts'),
    read('src/pages/paddle-fund.astro'),
    read('src/content/blocks/0594.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
  ]);

  // the arithmetic the whole concept hangs on: seats x dues = one paddle
  const n = (key) => Number(lib.match(new RegExp(`${key}: ([\\d.]+)`))?.[1]);
  assert.equal(n('seats') * n('duesPerWeekUsd'), n('paddleUsd'));
  assert.equal(n('duesPerWeekUsd') * n('weeksPerSprint') * n('sprintsPerYear'), n('costPerSeatPerYearUsd'));

  // honest status: a rehearsal, never a raffle
  assert.match(lib, /pretend money, no wallet, nothing on-chain yet/);
  assert.match(lib, /never chance/);
  assert.match(room, /NO MONEY MOVES HERE/);

  // the frame only trusts its own origin
  assert.match(room, /event\.origin !== origin/);
  assert.match(lib, /https:\/\/tez-rally\.pages\.dev\/paddle-fund\//);

  const parsed = JSON.parse(block);
  assert.equal(parsed.channel, 'CRT');
  assert.equal(parsed.external.url, 'https://pointcast.xyz/paddle-fund');
  assert.match(sitemap, /pointcast\.xyz\/paddle-fund'/);
  assert.match(llms, /pointcast\.xyz\/paddle-fund\)/);
});
