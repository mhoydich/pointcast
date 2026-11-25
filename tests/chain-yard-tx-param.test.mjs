import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../public/chain/yard/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const API = 'https://yard-test.example/node';
// The card's publish_block; all network responses below are mocked.
const HASH = 'a4e0a1e30139340932ca23277a5c7137645db8decb7b065b34970b2981f81948';
const HEIGHT = 13513;
const GENESIS = 'a'.repeat(64);
const included = { status: 'included', height: HEIGHT, index: 1 };
const rawTx = (title) => ({ tx: { type: 'publish_block', channel: 'BOT', title, sender: 'test-agent', nonce: 1 } });
const settle = () => new Promise((resolve) => setImmediate(resolve));

async function yard(t, { tx = HASH, lookup = included, tip = HEIGHT + 1, missingBlock = false } = {}) {
  const query = new URLSearchParams({ api: API });
  if (tx !== null) query.set('tx', tx);
  const dom = new JSDOM(html, { url: `https://pointcast.xyz/chain/yard/?${query}`, runScripts: 'outside-only' });
  t.after(async () => { await settle(); dom.window.close(); });
  const w = dom.window;
  const calls = [], intervals = [], scrolled = [];
  // Execute the real startup, fetching, selection and panel code. Only the
  // canvas surface and background timers are inert; no actual HTTP is allowed.
  w.matchMedia = (query) => ({ matches: query.includes('reduced-motion'), addEventListener() {} });
  w.ResizeObserver = class { observe() {} };
  w.requestAnimationFrame = () => 1;
  w.setTimeout = () => 1;
  w.clearTimeout = () => {};
  w.setInterval = (fn, ms) => { intervals.push({ fn, ms }); return intervals.length; };
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (o, key) => o[key] ?? (() => {}) });
  w.HTMLElement.prototype.getBoundingClientRect = () => ({ width: 900, height: 600, left: 0, top: 0 });
  w.HTMLElement.prototype.scrollIntoView = function () { scrolled.push(this.id); };
  w.fetch = async (url, options = {}) => {
    assert.equal(options.method || 'GET', 'GET');
    assert.ok(String(url).startsWith(API + '/'), `must use api= node: ${url}`);
    const path = String(url).slice(API.length);
    calls.push(path);
    let body, status = 200;
    if (path === '/status') body = { height: tip, genesis_hash: GENESIS, network: 'devnet' };
    else if (path === '/params') body = { anchor_interval: 100 };
    else if (path === '/anchors') body = { anchors: [] };
    else if (path === `/tx/${HASH}`) {
      if (lookup instanceof Error) throw lookup;
      body = lookup;
      if (lookup === null) status = 404;
    } else if (path.startsWith('/raw/blocks?')) {
      const q = new URL(API + path).searchParams;
      const from = Number(q.get('from')), limit = Number(q.get('limit'));
      body = { blocks: Array.from({ length: Math.max(0, Math.min(limit, tip - from + 1)) }, (_, i) => {
        const height = from + i;
        return { header: { height, timestamp: 1 }, txs: height === HEIGHT ? [rawTx('Other post'), rawTx('Linked post')] : [] };
      }).filter((b) => !missingBlock || b.header.height !== HEIGHT) };
    } else if (path.startsWith('/block/')) {
      const height = Number(path.slice('/block/'.length));
      body = { height, txs: height === HEIGHT ? [
        { hash: 'b'.repeat(64), kind: 'publish_block', payload: { title: 'Other post' } },
        { hash: HASH, kind: 'publish_block', payload: { title: 'Linked post' } },
      ] : [] };
    } else if (path === '/net') { status = 404; body = {}; }
    else assert.fail(`unexpected request: ${path}`);
    return { ok: status < 400, status, headers: { get: () => null }, json: async () => body };
  };
  // Capture completion without exposing test hooks in the shipped page.
  w.eval(script.replace('boot().catch(', 'window.yardReady = boot().catch('));
  await w.yardReady;
  await settle(); // the open panel's asynchronous /block card redraw
  assert.doesNotMatch(w.document.getElementById('msg').textContent, /NO SIGNAL/);
  return { w, doc: w.document, calls, intervals, scrolled };
}

for (const tip of [HEIGHT + 1, HEIGHT + 7000]) {
  test(`tx= opens and highlights its block on api= (tip ${tip})`, async (t) => {
    const { doc, calls, intervals, scrolled } = await yard(t, { tip });
    assert.ok(calls.includes(`/tx/${HASH}`));
    assert.equal(doc.getElementById('panel').hidden, false);
    assert.equal(doc.getElementById('panel-title').textContent, '№ 13,513');
    assert.match(doc.getElementById('sr-sel').textContent, /^Block 13513:/);
    assert.equal(doc.getElementById('follow').getAttribute('aria-pressed'), 'false');
    assert.equal(doc.getElementById('s-txs').textContent, '2');
    assert.equal(doc.getElementById('live-tally').textContent, '');
    const cards = doc.querySelectorAll('#panel-body .txc');
    assert.equal(cards.length, 2);
    assert.equal(cards[0].classList.contains('tx-target'), false);
    assert.equal(cards[1].id, 'linked-tx');
    assert.equal(cards[1].getAttribute('aria-current'), 'true');
    assert.match(cards[1].textContent, /Linked transaction/);
    assert.match(cards[1].textContent, /Linked post/);
    assert.ok(scrolled.includes('linked-tx'));
    if (tip > HEIGHT + 6000) {
      assert.ok(calls.includes(`/raw/blocks?from=${HEIGHT}&limit=500`));
      assert.match(doc.getElementById('v-src').textContent, /and linked block №13,513/);
    }
    // The periodic panel refresh must retain the marker, too.
    intervals.find(({ ms }) => ms === 15000).fn();
    await settle();
    assert.equal(doc.querySelectorAll('.tx-target').length, 1);
    assert.equal(doc.querySelectorAll('.txc')[1].classList.contains('tx-target'), true);
    // The existing height box still opens another loaded block normally.
    doc.getElementById('goto-h').value = String(tip);
    doc.getElementById('goto').dispatchEvent(new doc.defaultView.Event('submit', { cancelable: true }));
    assert.equal(doc.getElementById('panel-title').textContent, `№ ${tip.toLocaleString('en-US')}`);
    assert.equal(doc.querySelector('.tx-target'), null);
  });
}

for (const [label, lookup] of [
  ['404', null], ['network failure', new Error('offline')], ['pending', { status: 'pending' }],
  ['invalid height', { ...included, height: -1 }], ['invalid index', { ...included, index: 2 }],
]) {
  test(`tx= ${label} leaves the yard at the tip with a plain message`, async (t) => {
    const { doc } = await yard(t, { lookup });
    assert.equal(doc.getElementById('follow').getAttribute('aria-pressed'), 'true');
    assert.equal(doc.getElementById('panel').hidden, true);
    assert.equal(doc.querySelector('.tx-target'), null);
    assert.equal(doc.getElementById('s-tip').textContent, '№13,514');
    assert.equal(doc.getElementById('v-src').hidden, false);
    assert.equal(doc.getElementById('v-src').textContent, "Transaction wasn't found on this node. Showing the tip.");
  });
}

test('tx= with an unavailable block falls back to the tip', async (t) => {
  const { doc } = await yard(t, { missingBlock: true });
  assert.equal(doc.getElementById('panel').hidden, true);
  assert.equal(doc.getElementById('follow').getAttribute('aria-pressed'), 'true');
  assert.match(doc.getElementById('v-src').textContent, /Transaction wasn't found/);
});

test('an invalid tx= is displayed as a miss without requesting an arbitrary path', async (t) => {
  const { doc, calls } = await yard(t, { tx: '../status?<script>alert(1)</script>' });
  assert.ok(!calls.some((p) => p.startsWith('/tx/')));
  assert.equal(doc.getElementById('panel').hidden, true);
  assert.match(doc.getElementById('v-src').textContent, /Transaction wasn't found/);
  assert.equal(doc.getElementById('v-src').querySelector('script'), null);
});

test('no tx= keeps startup and the go-to height box unchanged', async (t) => {
  const { doc, calls } = await yard(t, { tx: null, tip: 3 });
  assert.ok(!calls.some((p) => p.startsWith('/tx/')));
  assert.equal(doc.getElementById('panel').hidden, true);
  assert.equal(doc.getElementById('follow').getAttribute('aria-pressed'), 'true');
  assert.equal(doc.getElementById('s-tip').textContent, '№3');
  assert.equal(doc.getElementById('v-src').hidden, true);
  doc.getElementById('goto-h').value = '2';
  doc.getElementById('goto').dispatchEvent(new doc.defaultView.Event('submit', { cancelable: true }));
  assert.equal(doc.getElementById('panel-title').textContent, '№ 2');
  assert.equal(doc.getElementById('panel').hidden, false);
  assert.equal(doc.querySelector('.tx-target'), null);
});
