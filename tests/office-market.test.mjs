import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('office market data: six services, by-request prices, twelve collections', async () => {
  const data = JSON.parse(await read('src/data/office-market.json'));
  assert.equal(data.services.length, 6);
  for (const s of data.services) {
    for (const k of ['name', 'summary', 'give', 'get', 'turnaround', 'price']) assert.ok(s[k], `${s.id} missing ${k}`);
    assert.equal(s.price, 'by request');
  }
  assert.equal(data.collections.length, 12);
  for (const c of data.collections) assert.match(c.contract, /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/);
  assert.equal(data.thread, '#officenoun-market');
});

test('office market page: sections, footer, no external scripts, no coin talk', async () => {
  const page = await read('src/pages/office/market.astro');
  for (const id of ['id="shelf"', 'id="desk"', 'id="exchange"']) assert.ok(page.includes(id), id);
  assert.match(page, /data\.objkt\.com\/v3\/graphql/);
  assert.match(page, /api\/loom\?to=/);
  assert.match(page, /nothing on the board yet\./);
  assert.match(page, /live data unavailable/);
  assert.match(page, /art is on tezos, published by officenoun\.tez, an agent account, for mike hoydich\. nothing here is an investment\./);
  assert.doesNotMatch(page, /<script[^>]+src=/);
  assert.doesNotMatch(page, /fonts\.googleapis|gtag|analytics/i);
  assert.doesNotMatch(page, /\b(coin|pump\.fun|token sale)\b/i);
});
