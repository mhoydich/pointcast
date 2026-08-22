import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const blockPath = new URL('../src/content/blocks/0575.json', import.meta.url);

test('Block 0575 publishes the verified Green Rush lake-run snapshot', async () => {
  const block = JSON.parse(await readFile(blockPath, 'utf8'));

  assert.equal(block.id, '0575');
  assert.equal(block.channel, 'GF');
  assert.equal(block.type, 'NOTE');
  assert.equal(block.author, 'mh+cc');
  assert.match(block.source, /Michael Hoydich/);
  assert.match(block.body, /Mike’s at Lake Nacimiento in California/);
  assert.equal(block.external.url, 'https://greenrush.click/');

  assert.deepEqual(
    {
      market: block.meta.market,
      marketNumber: block.meta.marketNumber,
      automaticCashPerSecond: block.meta.automaticCashPerSecond,
      flowerPerSecond: block.meta.flowerPerSecond,
      productsFound: block.meta.productsFound,
      activeOperations: block.meta.activeOperations,
      operationTypes: block.meta.operationTypes,
      lifetimeRevenue: block.meta.lifetimeRevenue,
    },
    {
      market: 'New York',
      marketNumber: 2,
      automaticCashPerSecond: 98,
      flowerPerSecond: 2.5,
      productsFound: 6,
      activeOperations: 6,
      operationTypes: 4,
      lifetimeRevenue: 24300,
    },
  );
});
