import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { DEMO_OFFERS, createState, propose, applyPolicy, approve, decline, reset } from '../src/lib/bot-money-demo.mjs';

const timestamp = '2026-10-19T12:00:00.000Z';
const record = (state, scenario) => {
  const proposed = propose(state, scenario);
  return approve(proposed, proposed.pending.id, timestamp);
};

test('preparing and declining do not move credits or record transactions', () => {
  const initial = createState();
  const proposed = propose(initial, 'buy');
  assert.equal(proposed.balance, 30);
  assert.equal(proposed.ledger.length, 0);
  assert.equal(proposed.pending.offer.amount, 12);
  assert.equal(proposed.pending.offer.recipient, 'You (fictional buyer)');
  const declined = decline(proposed);
  assert.equal(declined.pending, null);
  assert.equal(declined.balance, 30);
  assert.deepEqual(initial, createState(), 'previous state is not mutated');
});

test('earn models accepted useful work, independent of spending permissions and limits', () => {
  const strict = applyPolicy(createState(), { maxSpend: 5, allowBuy: false, allowGift: false });
  const earned = record(strict, 'earn');
  assert.equal(earned.balance, 48);
  assert.equal(earned.ledger.length, 1);
  assert.equal(earned.ledger[0].realWorkPerformed, false);
  assert.match(earned.ledger[0].offer.scope, /one round of text revisions/);
});

test('buy and gift permissions are independent', () => {
  const start = createState();
  assert.equal(record(start, 'buy').balance, 18);
  const giftBlocked = record(start, 'gift');
  assert.equal(giftBlocked.balance, 30);
  assert.equal(giftBlocked.ledger.length, 0);
  assert.match(giftBlocked.notice, /gift is switched off/);
  const giftOnly = applyPolicy(start, { maxSpend: 20, allowBuy: false, allowGift: true });
  assert.equal(record(giftOnly, 'buy').balance, 30);
  const gift = record(giftOnly, 'gift');
  assert.equal(gift.balance, 22);
  assert.equal(gift.ledger[0].offer.recipient, 'Alex (fictional friend)');
  assert.match(gift.ledger[0].offer.license, /personal use/);
});

test('limit equality is allowed, one below blocks, and incoming credits do not bypass a spending limit', () => {
  const exact = applyPolicy(createState(), { maxSpend: 12, allowBuy: true, allowGift: true });
  assert.equal(record(exact, 'buy').balance, 18);
  const low = applyPolicy(exact, { maxSpend: 11, allowBuy: true, allowGift: true });
  const denied = record(record(low, 'earn'), 'buy');
  assert.equal(denied.balance, 48);
  assert.equal(denied.ledger.length, 1);
  assert.match(denied.notice, /your limit is 11/);
});

test('insufficient balance blocks a proposal even with enough per-action permission', () => {
  let state = record(record(createState(), 'buy'), 'buy');
  assert.equal(state.balance, 6);
  state = applyPolicy(state, { maxSpend: 30, allowBuy: true, allowGift: true });
  const denied = record(state, 'gift');
  assert.equal(denied.balance, 6);
  assert.equal(denied.ledger.length, 2);
  assert.match(denied.notice, /your balance is 6/);
});

test('an exact remaining balance can be spent without going negative', () => {
  const start = applyPolicy(createState(), { maxSpend: 30, allowBuy: true, allowGift: true });
  const ready = record(record(record(record(start, 'earn'), 'buy'), 'buy'), 'buy');
  assert.equal(ready.balance, 12);
  const empty = record(ready, 'buy');
  assert.equal(empty.balance, 0);
  assert.equal(record(empty, 'buy').balance, 0);
});

test('every valid policy change invalidates pending approval, including a raised limit', () => {
  const proposed = propose(createState(), 'buy');
  const changed = applyPolicy(proposed, { maxSpend: 30, allowBuy: true, allowGift: false });
  assert.equal(changed.pending, null);
  const stale = approve(changed, proposed.pending.id, timestamp);
  assert.equal(stale.balance, 30);
  assert.equal(stale.ledger.length, 0);
  assert.equal(record(changed, 'buy').balance, 18);
});

test('invalid policy values clear proposals without changing approved policy', () => {
  for (const maxSpend of [4, 31, 12.5, NaN, Infinity, '12', null]) {
    const proposed = propose(createState(), 'buy');
    const changed = applyPolicy(proposed, { maxSpend, allowBuy: true, allowGift: false });
    assert.equal(changed.pending, null);
    assert.equal(changed.policy.maxSpend, 20);
    assert.equal(approve(changed, proposed.pending.id).balance, 30);
  }
  for (const maxSpend of [5, 30]) {
    assert.equal(applyPolicy(createState(), { maxSpend, allowBuy: true, allowGift: false }).policy.maxSpend, maxSpend);
  }
});

test('repeated approval, replaced proposal, and changed balance cannot execute a stale proposal', () => {
  const first = propose(createState(), 'buy');
  const approved = approve(first, first.pending.id, timestamp);
  const repeated = approve(approved, first.pending.id, timestamp);
  assert.equal(repeated.balance, 18);
  assert.equal(repeated.ledger.length, 1);
  const replaced = propose(first, 'earn');
  assert.equal(approve(replaced, first.pending.id, timestamp).balance, 30);
  const staleBalance = approve({ ...first, balance: 10 }, first.pending.id, timestamp);
  assert.equal(staleBalance.balance, 10);
  assert.equal(staleBalance.pending, null);
});

test('downloadable record is explicitly fictional and carries complete terms and exact approval', () => {
  const finished = record(createState(), 'buy');
  const receipt = JSON.parse(JSON.stringify(finished.ledger[0]));
  assert.equal(receipt.mode, 'sandbox');
  assert.equal(receipt.fictional, true);
  assert.equal(receipt.paymentStatus, 'not_processed');
  assert.equal(receipt.realFundsMoved, false);
  assert.equal(receipt.realGoodsDelivered, false);
  assert.equal(receipt.price.cashValue, 0);
  assert.equal(receipt.price.status, 'fictional_example');
  assert.deepEqual(receipt.balance, { before: 30, change: -12, after: 18, unit: 'DEMO_CREDIT' });
  assert.equal(receipt.createdAt, timestamp);
  assert.equal(receipt.approvals.humanApproved, true);
  assert.equal(receipt.approvals.realTransactionAuthorized, false);
  assert.equal(receipt.approvals.policy.maxSpend, 20);
  for (const field of ['seller', 'buyer', 'recipient', 'deliverable', 'scope', 'license', 'delivery', 'approval']) assert.ok(receipt.offer[field]);
  assert.match(receipt.disclaimer, /not proof of purchase or earnings/);
});

test('reset restores original balance and permissions and does not reuse old proposal IDs', () => {
  const proposed = propose(createState(), 'buy');
  const changed = applyPolicy(record(createState(), 'earn'), { maxSpend: 30, allowBuy: false, allowGift: true });
  const clean = reset(changed);
  assert.equal(clean.balance, 30);
  assert.equal(clean.pending, null);
  assert.deepEqual(clean.ledger, []);
  assert.deepEqual(clean.policy, createState().policy);
  const fresh = propose(clean, 'buy');
  assert.notEqual(fresh.pending.id, proposed.pending.id);
  assert.equal(approve(fresh, proposed.pending.id).balance, 30);
});

test('unrecognized scenario cannot create a proposal', () => {
  for (const kind of ['withdraw', 'toString', '__proto__', 'constructor']) {
    const invalid = propose(propose(createState(), 'earn'), kind);
    assert.equal(invalid.pending, null);
    assert.equal(invalid.balance, 30);
  }
});

// The component has static markup with three initial text expressions. Use that
// real markup and bundle the real client, so this exercises DOM wiring as well
// as the transitions. Astro compilation is checked separately by the site build.
async function demoDocument() {
  const source = await readFile(new URL('../src/components/BotMoneyDemo.astro', import.meta.url), 'utf8');
  const html = source.replace(/^---[\s\S]*?---/, '').replace(/<script>[\s\S]*?<\/script>/, '').replace(/<style>[\s\S]*?<\/style>/, '').replace(/\{sample\.(title|summary|delivery)\}/g, (_, key) => DEMO_OFFERS.earn[key]);
  return new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.test/bot-money' });
}

test('without JavaScript, the readable sample cannot trigger any controls', async () => {
  const dom = await demoDocument();
  const doc = dom.window.document;
  assert.match(doc.querySelector('[data-bm-sample-title]').textContent, /three product cards/);
  for (const control of doc.querySelectorAll('button, input')) assert.ok(control.matches(':disabled'));
  assert.ok(doc.querySelector('[data-bm-review]').hidden);
  assert.match(doc.querySelector('noscript').textContent, /No purchase is available/);
  dom.window.close();
});

test('real client wiring supports review, permission changes, balance blocks, download, and reset without network or storage', async () => {
  const dom = await demoDocument();
  const { window } = dom;
  const doc = window.document;
  const bundled = await build({ entryPoints: [new URL('../src/scripts/bot-money-demo.ts', import.meta.url).pathname], bundle: true, write: false, format: 'iife', platform: 'browser' });
  window.fetch = () => { throw new Error('No network allowed in this sandbox'); };
  window.XMLHttpRequest = class { constructor() { throw new Error('No network allowed in this sandbox'); } };
  window.Storage.prototype.getItem = () => { throw new Error('No storage allowed in this sandbox'); };
  window.Storage.prototype.setItem = () => { throw new Error('No storage allowed in this sandbox'); };
  const downloads = [];
  const blobs = [];
  window.URL.createObjectURL = (blob) => { blobs.push(blob); return 'blob:fictional-demo-record'; };
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function () { downloads.push(this.download); };
  window.eval(bundled.outputFiles[0].text);
  const el = (name) => doc.querySelector(`[data-bm-${name}]`);
  const click = (name) => el(name).click();
  const choose = (scenario) => doc.querySelector(`input[value="${scenario}"]`).click();
  const setLimit = (value) => { el('limit').value = String(value); el('limit').dispatchEvent(new window.Event('input', { bubbles: true })); };

  assert.equal(el('prepare').disabled, false);
  click('prepare');
  assert.equal(doc.activeElement, el('review-heading'));
  assert.equal(el('review').hidden, false);
  click('approve');
  click('approve');
  assert.equal(el('balance').textContent, '48');
  assert.equal(el('ledger').children.length, 1);
  assert.equal(doc.activeElement, el('prepare'));

  choose('gift');
  click('prepare');
  assert.equal(el('approve').disabled, true);
  click('gift');
  assert.equal(el('review').hidden, true);
  click('prepare');
  assert.equal(doc.querySelector('[data-bm-term="recipient"]').textContent, 'Alex (fictional friend)');
  setLimit(5);
  assert.equal(el('review').hidden, true);
  click('prepare');
  assert.equal(el('approve').disabled, true);
  setLimit(8);
  click('prepare');
  click('approve');
  assert.equal(el('balance').textContent, '40');

  choose('buy');
  setLimit('');
  assert.equal(el('prepare').disabled, true);
  setLimit(20);
  for (let i = 0; i < 3; i++) { click('prepare'); click('approve'); }
  assert.equal(el('balance').textContent, '4');
  click('prepare');
  assert.equal(el('approve').disabled, true);
  assert.match(el('blocked').textContent, /your balance is 4/);
  click('decline');

  click('download');
  assert.match(downloads[0], /FICTIONAL-demo/);
  const json = await new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blobs[0]);
  });
  const downloaded = JSON.parse(json);
  assert.equal(downloaded.paymentStatus, 'not_processed');
  assert.equal(downloaded.fictional, true);
  assert.equal(downloaded.balance.after, 4);
  click('reset');
  assert.equal(el('balance').textContent, '30');
  assert.equal(el('ledger').children.length, 0);
  assert.equal(el('download').disabled, true);
  assert.equal(el('gift').checked, false);
  assert.equal(el('limit').value, '20');
  dom.window.close();
});

test('mount resets browser-restored controls and prepare reads later restorations without events', async () => {
  const dom = await demoDocument();
  const { window } = dom;
  const doc = window.document;
  const el = (name) => doc.querySelector(`[data-bm-${name}]`);
  const radio = (kind) => doc.querySelector(`input[name="bm-scenario"][value="${kind}"]`);
  // Model a browser restoring form controls before the client initializes.
  el('limit').value = '5';
  el('buy').checked = false;
  el('gift').checked = true;
  radio('gift').checked = true;
  const bundled = await build({ entryPoints: [new URL('../src/scripts/bot-money-demo.ts', import.meta.url).pathname], bundle: true, write: false, format: 'iife', platform: 'browser' });
  window.eval(bundled.outputFiles[0].text);
  assert.equal(el('limit').value, '20');
  assert.equal(el('buy').checked, true);
  assert.equal(el('gift').checked, false);
  assert.equal(radio('earn').checked, true);
  el('prepare').click();
  assert.match(doc.querySelector('[data-bm-term="title"]').textContent, /Clean up three product cards/);
  el('decline').click();

  // Late restoration can happen after mount, without input/change events.
  el('limit').value = '5';
  el('buy').checked = false;
  radio('buy').checked = true;
  el('prepare').click();
  assert.match(doc.querySelector('[data-bm-term="title"]').textContent, /poster/);
  assert.match(el('blocked').textContent, /Buying for yourself is switched off/);
  assert.match(el('blocked').textContent, /your limit is 5/);
  assert.equal(el('approve').disabled, true);
  assert.equal(el('balance').textContent, '30');
  assert.equal(el('ledger').children.length, 0);
  dom.window.close();
});

test('approval reconciles silently restored controls and requires fresh review for every changed term', async () => {
  const dom = await demoDocument();
  const { window } = dom;
  const doc = window.document;
  const el = (name) => doc.querySelector(`[data-bm-${name}]`);
  const radio = (kind) => doc.querySelector(`input[name="bm-scenario"][value="${kind}"]`);
  const bundled = await build({ entryPoints: [new URL('../src/scripts/bot-money-demo.ts', import.meta.url).pathname], bundle: true, write: false, format: 'iife', platform: 'browser' });
  window.eval(bundled.outputFiles[0].text);
  const changes = [
    () => { el('limit').value = '5'; },
    () => { el('limit').value = '30'; },
    () => { el('limit').value = ''; },
    () => { el('buy').checked = false; },
    () => { el('gift').checked = true; },
    () => { radio('earn').checked = true; },
  ];
  for (const change of changes) {
    el('reset').click();
    radio('buy').click();
    el('prepare').click();
    assert.equal(el('approve').disabled, false);
    change();
    el('approve').click();
    assert.equal(el('balance').textContent, '30');
    assert.equal(el('ledger').children.length, 0);
    assert.equal(el('review').hidden, true);
    assert.equal(el('approve').disabled, true);
  }
  el('reset').click();
  radio('gift').click();
  el('gift').click();
  el('prepare').click();
  assert.equal(el('approve').disabled, false);
  el('gift').checked = false;
  el('approve').click();
  assert.equal(el('balance').textContent, '30');
  assert.equal(el('ledger').children.length, 0);
  assert.equal(el('review').hidden, true);
  dom.window.close();
});
