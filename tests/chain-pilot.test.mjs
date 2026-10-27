import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountPilot } from '../public/chain/apps/pilot.js';

const genesis = 'a'.repeat(64), hash = 'b'.repeat(64);
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const chainStatus = (g = genesis) => ({ chain_id: 'pointcast-devnet-2', genesis_hash: g, height: 10 });
const tx = { status: 'included', height: 8, receipt: { tx_hash: hash, kind: 'publish_block' } };
const feed = { blocks: [{ height: 8, txs: [{ hash }] }] };
function setup(get) {
  const dom = new JSDOM(`<main data-pilot data-api="https://example.test" data-genesis="${genesis}" data-chain-id="pointcast-devnet-2"><button data-practice></button><div data-practice-result></div><button data-find></button><p data-status></p><div data-example hidden><code data-hash></code><span data-height></span></div></main>`);
  const root = dom.window.document.querySelector('main'); mountPilot(root, { get });
  const click = (name) => root.querySelector(`[data-${name}]`).click();
  return { dom, root, click };
}
test('practice makes no network request or visitor data and is explicitly not a transaction', () => {
  const p = setup(() => assert.fail('practice must not access the network')); p.click('practice');
  assert.match(p.root.querySelector('[data-practice-result]').textContent, /PRACTICE ONLY.*Status: simulated.*No transaction was sent/);
  p.dom.window.close();
});
test('a real example is read only, pinned before and after, and matches its receipt', async () => {
  const calls = []; const p = setup(async (path) => { calls.push(path); if (path === '/status') return chainStatus(); if (path.startsWith('/feed?')) return feed; if (path === '/tx/' + hash) return tx; assert.fail(path); });
  p.click('find'); await tick(); await tick();
  assert.deepEqual(calls, ['/status', '/feed?limit=10', '/tx/' + hash, '/status']);
  assert.equal(p.root.querySelector('[data-hash]').textContent, hash);
  assert.equal(p.root.querySelector('[data-height]').textContent, '8');
  assert.equal(p.root.querySelector('[data-example]').hidden, false); p.dom.window.close();
});
test('a reset, bad response or mismatched receipt clears the example instead of claiming inclusion', async () => {
  let mode = 'ok', checks = 0;
  const p = setup(async (path) => { if (path === '/status') return chainStatus(mode === 'reset' && ++checks > 1 ? 'c'.repeat(64) : genesis); if (path.startsWith('/feed?')) return mode === 'empty' ? { blocks: [] } : feed; if (path.startsWith('/tx/')) return mode === 'mismatch' ? { ...tx, height: 9 } : tx; assert.fail(path); });
  p.click('find'); await tick(); await tick(); assert.equal(p.root.querySelector('[data-example]').hidden, false);
  for (mode of ['reset', 'empty', 'mismatch']) { checks = 0; p.click('find'); await tick(); await tick(); assert.equal(p.root.querySelector('[data-example]').hidden, true, mode); assert.equal(p.root.querySelector('[data-hash]').textContent, '', mode); assert.match(p.root.querySelector('[data-status]').textContent, mode === 'reset' ? /identity changed/ : /No example/); }
  p.dom.window.close();
});
