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
  const dom = new JSDOM(`<main data-pilot data-api="https://example.test" data-genesis="${genesis}" data-chain-id="pointcast-devnet-2"><select data-scenario><option value="agent">Agent</option><option value="ues">UES</option><option value="local">Local</option></select><button data-practice></button><div data-practice-result></div><button data-find></button><p data-status></p><div data-example hidden><code data-hash tabindex="0"></code><button data-copy></button><span data-height></span></div></main>`);
  const root = dom.window.document.querySelector('main'); mountPilot(root, { get });
  const click = (name) => root.querySelector(`[data-${name}]`).click();
  return { dom, root, click };
}
test('practice makes no network request or visitor data and is explicitly not a transaction', () => {
  const p = setup(() => assert.fail('practice must not access the network')); p.click('practice');
  assert.match(p.root.querySelector('[data-practice-result]').textContent, /PRACTICE ONLY.*creative agent publishing.*Status: simulated.*No transaction was sent/);
  p.root.querySelector('[data-scenario]').value = 'ues'; p.click('practice');
  assert.match(p.root.querySelector('[data-practice-result]').textContent, /UES lesson completion.*Status: simulated/);
  p.root.querySelector('[data-scenario]').value = 'local'; p.click('practice');
  assert.match(p.root.querySelector('[data-practice-result]').textContent, /neighborhood event.*Status: simulated/);
  p.dom.window.close();
});
test('a real example is read only, pinned before and after, and matches its receipt', async () => {
  const calls = []; const p = setup(async (path) => { calls.push(path); if (path === '/status') return chainStatus(); if (path.startsWith('/feed?')) return feed; if (path === '/tx/' + hash) return tx; assert.fail(path); });
  p.click('find'); await tick(); await tick();
  assert.deepEqual(calls, ['/status', '/feed?limit=10', '/tx/' + hash, '/status']);
  assert.equal(p.root.querySelector('[data-hash]').textContent, hash);
  assert.equal(p.root.querySelector('[data-height]').textContent, '8');
  assert.equal(p.root.querySelector('[data-example]').hidden, false);
  p.click('copy'); await tick();
  assert.match(p.root.querySelector('[data-status]').textContent, /Select the hash/);
  assert.equal(p.dom.window.document.activeElement, p.root.querySelector('[data-hash]'));
  let copied = ''; Object.defineProperty(p.dom.window.navigator, 'clipboard', { value: { writeText: async (s) => { copied = s; } }, configurable: true });
  p.click('copy'); await tick(); assert.equal(copied, hash); assert.match(p.root.querySelector('[data-status]').textContent, /Hash copied/);
  let rejectCopy; Object.defineProperty(p.dom.window.navigator, 'clipboard', { value: { writeText: () => new Promise((_, reject) => { rejectCopy = reject; }) }, configurable: true });
  p.click('copy'); p.click('find'); await tick(); await tick(); rejectCopy(new Error('denied')); await tick();
  assert.match(p.root.querySelector('[data-status]').textContent, /Example read/);
  p.dom.window.close();
});
test('a reset, bad response or mismatched receipt clears the example instead of claiming inclusion', async () => {
  let mode = 'ok', checks = 0;
  const p = setup(async (path) => { if (path === '/status') return chainStatus(mode === 'reset' && ++checks > 1 ? 'c'.repeat(64) : genesis); if (path.startsWith('/feed?')) return mode === 'empty' ? { blocks: [] } : feed; if (path.startsWith('/tx/')) return mode === 'mismatch' ? { ...tx, height: 9 } : tx; assert.fail(path); });
  p.click('find'); await tick(); await tick(); assert.equal(p.root.querySelector('[data-example]').hidden, false);
  for (mode of ['reset', 'empty', 'mismatch']) { checks = 0; p.click('find'); await tick(); await tick(); assert.equal(p.root.querySelector('[data-example]').hidden, true, mode); assert.equal(p.root.querySelector('[data-hash]').textContent, '', mode); assert.match(p.root.querySelector('[data-status]').textContent, mode === 'reset' ? /identity changed/ : /No example/); }
  p.dom.window.close();
});
