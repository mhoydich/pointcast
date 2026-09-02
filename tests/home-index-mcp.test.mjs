import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const MCP_LIB = new URL('../functions/api/mcp.ts', import.meta.url);
const HOME_DEMO_LIB = new URL('../src/lib/home-cartography-demo.ts', import.meta.url);

const HOME_INDEX_TOOLS = [
  'home_index_summary',
  'home_index_find',
  'home_index_room',
  'home_index_valuation',
  'home_index_lendable',
  'home_index_sell_draft',
];

test('MCP server declares SERVER_VERSION 0.13.0', async () => {
  const source = await readFile(MCP_LIB, 'utf8');
  assert.match(source, /SERVER_VERSION = '0\.13\.0'/);
});

test('MCP server declares each home_index tool by name', async () => {
  const source = await readFile(MCP_LIB, 'utf8');
  for (const tool of HOME_INDEX_TOOLS) {
    assert.match(source, new RegExp(`name: '${tool}'`), `expected a tool declaration for ${tool}`);
  }
});

test('MCP server has a case handler for each home_index tool', async () => {
  const source = await readFile(MCP_LIB, 'utf8');
  for (const tool of HOME_INDEX_TOOLS) {
    assert.match(source, new RegExp(`case '${tool}':`), `expected a case handler for ${tool}`);
  }
});

test('MCP help HTML documents each home_index tool in a <code> tag', async () => {
  const source = await readFile(MCP_LIB, 'utf8');
  for (const tool of HOME_INDEX_TOOLS) {
    assert.match(source, new RegExp(`<code>${tool}</code>`), `expected help HTML to mention ${tool}`);
  }
});

test('home_index tool handlers reference the fictional demo household surface', async () => {
  const source = await readFile(MCP_LIB, 'utf8');
  assert.match(source, /\/cartography\/home\/demo\.json/);
});

test('Home Cartography demo data: sell flow item exists in DEMO_ITEMS', async () => {
  const source = await readFile(HOME_DEMO_LIB, 'utf8');

  const sellItemMatch = source.match(/export const demoSellFlow = \{[\s\S]*?item: '([^']+)'/);
  assert.ok(sellItemMatch, 'expected demoSellFlow.item to be found');
  const sellItemId = sellItemMatch[1];

  assert.match(source, new RegExp(`id: '${sellItemId}'`), `sell flow item ${sellItemId} should exist in DEMO_ITEMS`);
});

test('Home Cartography demo data: lend flow match exists in DEMO_ITEMS', async () => {
  const source = await readFile(HOME_DEMO_LIB, 'utf8');

  const lendMatch = source.match(/export const demoLendFlow = \{[\s\S]*?match: '([^']+)'/);
  assert.ok(lendMatch, 'expected demoLendFlow.match to be found');
  const lendItemId = lendMatch[1];

  assert.match(source, new RegExp(`id: '${lendItemId}'`), `lend flow match ${lendItemId} should exist in DEMO_ITEMS`);
});

test('Home Cartography demo data: duplicate item ids all exist in DEMO_ITEMS', async () => {
  const source = await readFile(HOME_DEMO_LIB, 'utf8');

  const duplicatesBlockMatch = source.match(/duplicates: \[([\s\S]*?)\],\n\s*warrantyWatch/);
  assert.ok(duplicatesBlockMatch, 'expected a duplicates block');
  const duplicatesBlock = duplicatesBlockMatch[1];

  const itemIds = [...duplicatesBlock.matchAll(/'(it-\d+)'/g)].map((m) => m[1]);
  assert.ok(itemIds.length > 0, 'expected at least one item id referenced in duplicates');

  for (const id of itemIds) {
    assert.match(source, new RegExp(`id: '${id}'`), `duplicate-referenced item ${id} should exist in DEMO_ITEMS`);
  }
});

test('Home Cartography demo data: DEMO_ITEMS ids are unique', async () => {
  const source = await readFile(HOME_DEMO_LIB, 'utf8');
  const itemsBlockMatch = source.match(/export const DEMO_ITEMS: DemoItem\[\] = \[([\s\S]*?)\n\];/);
  assert.ok(itemsBlockMatch, 'expected DEMO_ITEMS array to be found');
  const ids = [...itemsBlockMatch[1].matchAll(/\{ id: '(it-\d+)'/g)].map((m) => m[1]);

  assert.ok(ids.length >= 20, 'expected at least 20 demo items');
  assert.equal(new Set(ids).size, ids.length, 'DEMO_ITEMS ids should be unique');
});
