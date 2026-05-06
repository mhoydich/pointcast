import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const CARTOGRAPHY_LIB = new URL('../src/lib/cartography-business.ts', import.meta.url);
const JOIN_LIB = new URL('../src/lib/join-system.ts', import.meta.url);
const AGENTS_MANIFEST = new URL('../src/pages/agents.json.ts', import.meta.url);
const FOR_AGENTS = new URL('../src/pages/for-agents.astro', import.meta.url);
const BLOCK_0442 = new URL('../src/content/blocks/0442.json', import.meta.url);
const HEADERS = new URL('../public/_headers', import.meta.url);

test('Cartography business data defines the 2026 revenue target and product schemas', async () => {
  const source = await readFile(CARTOGRAPHY_LIB, 'utf8');

  assert.match(source, /targetUsd: 5000000/);
  assert.match(source, /profileMap/);
  assert.match(source, /opportunityRoute/);
  assert.match(source, /contributionReceipt/);
  assert.match(source, /Stripe Payment Link or Checkout Session/);
  assert.match(source, /Stripe Invoicing/);
  assert.match(source, /No Stripe secret key belongs in this static repo/);
});

test('Join system exposes commercial lanes for sales, fulfillment, and receipts', async () => {
  const source = await readFile(JOIN_LIB, 'utf8');

  for (const lane of ['agent', 'people', 'sales', 'fulfillment', 'receipt']) {
    assert.match(source, new RegExp(`id: '${lane}'`));
  }

  assert.match(source, /cartography-100-brand-accounts/);
  assert.match(source, /cartography-stripe-payment-links/);
  assert.match(source, /cartography-yield-receipt-ledger/);
});

test('Agent-facing discovery surfaces include Cartography routes', async () => {
  const agents = await readFile(AGENTS_MANIFEST, 'utf8');
  const forAgents = await readFile(FOR_AGENTS, 'utf8');

  for (const path of ['/cartography', '/cartography.json', '/cartography/demo', '/cartography/demo.json']) {
    assert.match(agents, new RegExp(path.replace(/\//g, '\\/')));
    assert.match(forAgents, new RegExp(path.replace(/\//g, '\\/')));
  }
});

test('Cartography JSON surfaces are CORS-open in the static headers file', async () => {
  const headers = await readFile(HEADERS, 'utf8');

  for (const path of ['/cartography.json', '/cartography/demo.json', '/join.json']) {
    assert.match(headers, new RegExp(`${path}\\n\\s+Access-Control-Allow-Origin: \\*`));
  }
});

test('Block 0442 announces non-financial yield posture', async () => {
  const block = JSON.parse(await readFile(BLOCK_0442, 'utf8'));

  assert.equal(block.id, '0442');
  assert.equal(block.external.url, 'https://pointcast.xyz/cartography');
  assert.equal(block.meta.revenueTargetUsd, 5000000);
  assert.equal(block.meta.yieldDefinition, 'leads, deals, campaign proof, and contribution receipts only');
});
