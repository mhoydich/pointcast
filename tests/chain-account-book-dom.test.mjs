import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { pcc } from '../public/chain/apps/chain-kit.js';
import { mountAccountBook } from '../public/chain/accounts/book.js';
import { STORAGE_KEY, bookDocument } from '../public/chain/accounts/model.mjs';

const source = await readFile(new URL('../src/pages/chain/accounts.astro', import.meta.url), 'utf8');
const identity = { chainId: 'pointcast-devnet-2', genesis: 'a'.repeat(64) };
const address = (n) => pcc.tezosAddress({ scheme: 'ed25519', bytes: n.toString(16).padStart(2, '0').repeat(32) });
const entry = (n, label = '') => ({ address: address(n), label });
const status = (extra = {}) => ({ chain_id: identity.chainId, genesis_hash: identity.genesis, height: 5, ...extra });
const account = (address) => ({ address, exists: true, balance: 10, next_nonce: 2 });
const tick = () => new Promise((resolve) => setImmediate(resolve));
function setup({ entries = [], raw, get = async (path) => path === '/status' ? status() : account(path.split('/').pop()), storage, clipboard } = {}) {
  const markup = source.slice(source.indexOf('  <main'), source.indexOf('</main>') + 7).replace('data-api={DEVNET.url}', 'data-api="https://example.test"').replace('data-genesis={DEVNET.genesis}', `data-genesis="${identity.genesis}"`).replace('data-chain-id={DEVNET.chainId}', `data-chain-id="${identity.chainId}"`);
  const dom = new JSDOM(markup, { url: 'https://pointcast.xyz/chain/accounts/' });
  const store = storage ?? dom.window.localStorage;
  if (!storage) store.setItem(STORAGE_KEY, raw ?? JSON.stringify(bookDocument(entries, identity)));
  const root = dom.window.document.querySelector('main');
  const app = mountAccountBook(root, { storage: store, net: { get }, clipboard });
  const find = (key) => root.querySelector(`[data-${key}]`);
  const submit = (n, label = '') => { find('address').value = address(n); find('label').value = label; find('add-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); };
  return { dom, root, app, find, submit, store };
}

test('real page mounts, persists public addresses and labels, prevents duplicates and removes entries', async () => {
  const { dom, root, app, find, submit, store } = setup(); await tick();
  assert.match(root.textContent, /A place for the addresses/);
  submit(1, '<img src=x onerror=alert(1)>'); await tick();
  assert.equal(app.getAccounts().length, 1); assert.equal(root.querySelectorAll('.account-card').length, 1); assert.equal(root.querySelector('.account-card img'), null);
  assert.match(root.querySelector('.balance').textContent, /10play ATTN/);
  assert.match(find('count').textContent, /1 \/ 24/); assert.match(store.getItem(STORAGE_KEY), /address/);
  submit(1, 'duplicate'); assert.equal(app.getAccounts().length, 1); assert.match(find('message').textContent, /already/);
  const input = root.querySelector('.label-form input'); input.value = 'Renamed'; root.querySelector('.label-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await tick();
  assert.equal(JSON.parse(store.getItem(STORAGE_KEY)).accounts[0].label, 'Renamed');
  root.querySelector('.remove').click(); await tick(); assert.equal(app.getAccounts().length, 0); assert.equal(root.querySelectorAll('.account-card').length, 0);
  dom.window.close();
});

test('labels keep their draft, selection and focus when an asynchronous refresh finishes', async () => {
  let release;
  const { dom, root } = setup({ entries: [entry(1, 'Saved')], get: async (path) => path === '/status' ? status() : new Promise((resolve) => { release = resolve; }) }); await tick();
  let input = root.querySelector('.label-form input'); input.focus(); input.value = 'Draft label'; input.setSelectionRange(3, 5); input.dispatchEvent(new dom.window.Event('input'));
  release(account(address(1))); await tick();
  input = root.querySelector('.label-form input'); assert.equal(input.value, 'Draft label'); assert.equal(dom.window.document.activeElement, input); assert.equal(input.selectionStart, 3); assert.equal(input.selectionEnd, 5);
  assert.equal(root.querySelector('.account-card h3').textContent, 'Saved'); dom.window.close();
});

test('identity mismatch hides old balances; local add, remove and label edits still render while reads stay paused', async () => {
  let mismatch = false; let requests = 0;
  const { dom, root, find, submit, app, store } = setup({ entries: [entry(1, 'First')], get: async (path) => { requests++; return path === '/status' ? status(mismatch ? { genesis_hash: 'b'.repeat(64) } : {}) : account(address(1)); } }); await tick();
  assert.match(root.querySelector('.balance').textContent, /10play/);
  mismatch = true; find('refresh').click(); await tick(); const stopped = requests;
  assert.match(find('status').textContent, /identity changed/); assert.match(root.querySelector('.balance').textContent, /—/);
  submit(2, 'Second'); assert.equal(root.querySelectorAll('.account-card').length, 2); assert.match(find('count').textContent, /^2/);
  const forms = root.querySelectorAll('.label-form'); forms[1].querySelector('input').value = 'Local edit'; forms[1].dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  assert.equal(root.querySelectorAll('.account-card h3')[1].textContent, 'Local edit');
  root.querySelector('.remove').click(); assert.equal(root.querySelectorAll('.account-card').length, 1); assert.equal(app.getAccounts()[0].address, address(2));
  assert.equal(JSON.parse(store.getItem(STORAGE_KEY)).accounts.length, 1); assert.equal(requests, stopped); dom.window.close();
});

test('corrupt storage is preserved until the user clears it and key-like imports cannot replace the book', async () => {
  const { dom, find, store, submit, app } = setup({ raw: '{bad' }); await tick();
  assert.match(find('storage').textContent, /left untouched/); assert.equal(find('address').disabled, true); submit(1); assert.equal(app.getAccounts().length, 0); assert.equal(store.getItem(STORAGE_KEY), '{bad');
  find('reset-storage').click(); await tick(); submit(1, 'Safe'); await tick();
  const previous = store.getItem(STORAGE_KEY); const file = { size: 40, text: async () => JSON.stringify({ seed: 'do not import' }) };
  Object.defineProperty(find('import'), 'files', { configurable: true, value: [file] }); find('import').dispatchEvent(new dom.window.Event('change')); await tick();
  assert.match(find('message').textContent, /Unsupported/); assert.equal(store.getItem(STORAGE_KEY), previous); dom.window.close();
});

test('import merges without replacing existing labels and latest selected file wins', async () => {
  const { dom, find, app } = setup({ entries: [entry(1, 'Original')] }); await tick();
  let release; const old = { size: 100, text: () => new Promise((resolve) => { release = resolve; }) };
  const newer = { size: 100, text: async () => JSON.stringify(bookDocument([entry(1, 'Changed'), entry(2, 'New')], identity)) };
  const pick = (file) => { Object.defineProperty(find('import'), 'files', { configurable: true, value: [file] }); find('import').dispatchEvent(new dom.window.Event('change')); };
  pick(old); pick(newer); await tick(); release(JSON.stringify(bookDocument([entry(3, 'Old file')], identity))); await tick();
  assert.deepEqual(app.getAccounts(), [entry(1, 'Original'), entry(2, 'New')]); assert.match(find('message').textContent, /Imported 1.*skipped 1/); dom.window.close();
});

test('clipboard writes only public address and denied storage warns that changes are temporary', async () => {
  const writes = [];
  const { dom, root, submit, find } = setup({ storage: { getItem() { throw new Error(); }, setItem() { throw new Error(); } }, clipboard: { writeText: async (value) => writes.push(value) } }); await tick(); submit(1, 'Private local label'); await tick();
  assert.match(find('storage').textContent, /only for this visit/); root.querySelector('.card-actions button').click(); await tick(); assert.deepEqual(writes, [address(1)]); assert.match(find('message').textContent, /copied/); dom.window.close();
});

test('export downloads a versioned public book without balances or signing material', async () => {
  const { dom, find } = setup({ entries: [entry(1, 'Local name')] }); await tick();
  let exported; let download;
  dom.window.URL.createObjectURL = (blob) => { exported = blob; return 'blob:account-book'; };
  dom.window.URL.revokeObjectURL = () => {};
  dom.window.document.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') { download = event.target.download; event.preventDefault(); }
  });
  find('export').click();
  assert.equal(download, 'pointcast-public-account-book.json');
  const text = await new Promise((resolve, reject) => {
    const reader = new dom.window.FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(exported);
  });
  assert.deepEqual(JSON.parse(text), bookDocument([entry(1, 'Local name')], identity));
  assert.doesNotMatch(text, /balance|nonce|private|signature|seed/); dom.window.close();
});
