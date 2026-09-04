import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const CARTOGRAPHY_LIB = new URL('../src/lib/cartography-business.ts', import.meta.url);
const CARTOGRAPHY_SPRINT_LIB = new URL('../src/lib/cartography-sprint.ts', import.meta.url);
const AGENTS_MANIFEST = new URL('../src/pages/agents.json.ts', import.meta.url);
const FOR_AGENTS = new URL('../src/pages/for-agents.astro', import.meta.url);
const BLOCK_0442 = new URL('../src/content/blocks/0442.json', import.meta.url);
const BLOCK_0443 = new URL('../src/content/blocks/0443.json', import.meta.url);
const HEADERS = new URL('../public/_headers', import.meta.url);

test('Cartography business data preserves a clearly archived prototype and its schemas', async () => {
  const source = await readFile(CARTOGRAPHY_LIB, 'utf8');

  assert.match(source, /status: 'archived-exploration'/);
  assert.match(source, /No payment, intake, checkout, invoice, or sales workflow is active/);
  assert.match(source, /profileMap/);
  assert.match(source, /opportunityRoute/);
  assert.match(source, /contributionReceipt/);
});

test('Cartography sprint data preserves an archive without targets or a paid offer', async () => {
  const source = await readFile(CARTOGRAPHY_SPRINT_LIB, 'utf8');

  assert.match(source, /status: 'archived'/);
  assert.match(source, /targetPilotCount: 0/);
  assert.match(source, /targetContractedUsd: 0/);
  assert.match(source, /priceUsd: null/);
  assert.match(source, /sourceBlock: 'https:\/\/pointcast.xyz\/b\/0443'/);
});

test('Agent-facing discovery surfaces retain current Home Cartography routes', async () => {
  const agents = await readFile(AGENTS_MANIFEST, 'utf8');
  const forAgents = await readFile(FOR_AGENTS, 'utf8');

  for (const path of [
    '/cartography/home',
    '/cartography/home.json',
    '/cartography/home/demo',
    '/cartography/home/demo.json',
    '/cartography/home/field-kit',
    '/cartography/home/field-kit.json',
  ]) {
    assert.match(agents, new RegExp(path.replace(/\//g, '\\/')));
    assert.match(forAgents, new RegExp(path.replace(/\//g, '\\/')));
  }
});

test('Cartography JSON surfaces are CORS-open in the static headers file', async () => {
  const headers = await readFile(HEADERS, 'utf8');

  for (const path of ['/cartography.json', '/cartography/pilot.json', '/cartography/sprint.json', '/cartography/demo.json', '/cartography/home.json', '/cartography/home/demo.json', '/cartography/home/field-kit.json', '/join.json']) {
    assert.match(headers, new RegExp(`${path}\\n\\s+Access-Control-Allow-Origin: \\*`));
  }
});

test('Block 0442 marks Cartography as archived', async () => {
  const block = JSON.parse(await readFile(BLOCK_0442, 'utf8'));

  assert.equal(block.id, '0442');
  assert.equal(block.external.url, 'https://pointcast.xyz/cartography');
  assert.equal(block.meta.status, 'archived exploration');
});

test('Block 0443 marks the sprint as archived', async () => {
  const block = JSON.parse(await readFile(BLOCK_0443, 'utf8'));

  assert.equal(block.id, '0443');
  assert.equal(block.external.url, 'https://pointcast.xyz/cartography');
  assert.equal(block.meta.status, 'archived planning sprint');
});
