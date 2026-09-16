import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const bundle = async path => (await build({ entryPoints: [path], bundle: true, write: false, format: 'esm', platform: 'node' })).outputFiles[0].text;
const { SHOPPING_ITEMS, POCKET_KEY, readPocket } = await import('data:text/javascript;base64,' + Buffer.from(await bundle('src/lib/shopping.ts')).toString('base64'));
const api = await import('data:text/javascript;base64,' + Buffer.from(await bundle('functions/api/shopping-metrics.ts')).toString('base64'));
const script = (await build({ entryPoints: ['src/scripts/shopping-pocket.ts'], bundle: true, write: false, format: 'iife', globalName: 'Pocket' })).outputFiles[0].text;
const request = (body, headers = {}) => new Request('https://pointcast.xyz/api/shopping-metrics', { method: 'POST', headers: { Origin: 'https://pointcast.xyz', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
const event = { study: 'beach-commons-v19', product: 'numanu', eventId: 'aabbaa00-0000-4000-8000-000000000000' };

test('corrupt, duplicate and unknown saved items are safely normalized', () => {
  assert.deepEqual(readPocket('{'), []);
  assert.deepEqual(readPocket('{"numanu":true}'), []);
  assert.deepEqual(readPocket('["numanu","numanu","unknown",null]'), ['numanu']);
});

test('save, reload, cross-tab clear, filter and blocked storage work with the production controller', t => {
  const dom = new JSDOM(`<section data-shopping-root><p data-pocket-storage></p><p data-pocket-status></p><span data-pocket-count></span><div data-shopping-tools hidden></div><button data-shopping-filter="saved"></button><button data-pocket-clear></button><p data-pocket-empty hidden></p>${SHOPPING_ITEMS.map(item => `<article data-shopping-item="${item.id}"><button hidden data-pocket-save="${item.id}"></button><a data-shop-link="${item.id}" href="${item.url}">Shop</a></article>`).join('')}</section>`, { url: 'https://pointcast.xyz', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const w = dom.window;
  const d = w.document;
  w.localStorage.setItem(POCKET_KEY, '["btr-20"]');
  const calls = [];
  w.fetch = (...args) => { calls.push(args); return Promise.resolve({}); };
  w.eval(script + '\nPocket.initShoppingPocket();');
  d.querySelector('[data-pocket-save="numanu"]').click();
  assert.ok(JSON.parse(w.localStorage.getItem(POCKET_KEY)).includes('numanu'));
  assert.equal(d.querySelector('[data-pocket-save="numanu"]').textContent, 'Saved ✓');
  d.querySelector('[data-shopping-filter="saved"]').click();
  assert.equal(d.querySelector('[data-shopping-item="numanu"]').hidden, false);
  assert.equal(d.querySelector('[data-shopping-item="campwell"]').hidden, true);
  w.dispatchEvent(new w.StorageEvent('storage', { key: POCKET_KEY, newValue: '[]' }));
  assert.equal(d.querySelector('[data-pocket-empty]').hidden, false);
  Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } });
  d.querySelector('[data-pocket-save="numanu"]').click();
  assert.match(d.querySelector('[data-pocket-storage]').textContent, /only for this page visit/);
  const link = d.querySelector('[data-shop-link="numanu"]');
  d.addEventListener('click', e => e.preventDefault());
  link.click();
  assert.equal(calls.length, 1);
  Object.defineProperty(w.navigator, 'globalPrivacyControl', { value: true });
  link.click(); assert.equal(calls.length, 1);
  d.querySelector('[data-pocket-clear]').click();
  assert.equal(d.querySelector('[data-pocket-count]').textContent, '· 0 saved');
});

test('metrics validates origin/catalog/body and honors privacy before writing', async () => {
  const writes = [];
  const env = { PC_ANALYTICS_KV: { put: async (...args) => writes.push(args) } };
  assert.equal((await api.onRequestPost({ request: request(event, { Origin: 'https://evil.test' }), env })).status, 403);
  assert.equal((await api.onRequestPost({ request: request(event, { 'Sec-GPC': '1' }), env })).status, 204);
  assert.equal((await api.onRequestPost({ request: request({ ...event, product: 'fake' }), env })).status, 400);
  assert.equal((await api.onRequestPost({ request: request({ ...event, more: 'x'.repeat(2000) }), env })).status, 400);
  assert.equal(writes.length, 0);
  assert.equal((await api.onRequestPost({ request: request(event), env })).status, 201);
  await api.onRequestPost({ request: request(event), env });
  assert.equal(writes[0][0], writes[1][0], 'retries overwrite the event, not increment a counter');
  assert.equal(writes[0][1], '');
  assert.equal(writes[0][2].expirationTtl, 90 * 86400);
});

test('report follows pagination and never labels clicks as confirmed sales', async () => {
  let calls = 0;
  const env = { PC_ANALYTICS_KV: { list: async () => {
    calls++;
    return { keys: [{ name: 'shopping:v1:2026-09-15:numanu:abc' }], list_complete: calls === 2, cursor: 'next' };
  } } };
  const report = await (await api.onRequestGet({ env })).json();
  assert.equal(report.outboundClicks, 2);
  assert.equal(report.products.numanu, 2);
  assert.equal(report.confirmedSales, null);
  assert.equal(report.attributedRevenue, null);
  assert.equal(report.truncated, false);
  assert.equal((await api.onRequestGet({ env: {} })).status, 503);
});

test('report cap is explicit and binding errors are unavailable, never zero sales', async () => {
  const env = { PC_ANALYTICS_KV: { list: async () => ({ keys: Array.from({ length: 1000 }, () => ({ name: 'shopping:v1:2026-09-15:numanu:id' })), list_complete: false, cursor: 'more' }) } };
  const result = await (await api.onRequestGet({ env })).json();
  assert.equal(result.truncated, true); assert.equal(result.outboundClicks, 10000);
  const response = await api.onRequestGet({ env: { PC_ANALYTICS_KV: { list: async () => { throw new Error('offline'); } } } });
  assert.equal(response.status, 503); assert.equal((await response.json()).outboundClicks, null);
});
