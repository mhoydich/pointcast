import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { pcc, makeNet } from '../public/chain/apps/chain-kit.js';
import { publicAddress, localLabel, bookDocument, parseBook, mergeBook, loadBook, saveBook, accountView, createReader, MAX_ACCOUNTS, MAX_FILE_BYTES, STORAGE_KEY } from '../public/chain/accounts/model.mjs';

const identity = { chainId: 'pointcast-devnet-2', genesis: 'a'.repeat(64) };
const address = (n) => pcc.tezosAddress({ scheme: 'ed25519', bytes: n.toString(16).padStart(2, '0').repeat(32) });
const entry = (n, label = '') => ({ address: address(n), label });
const document = (entries) => JSON.stringify(bookDocument(entries, identity));
const status = (extra = {}) => ({ chain_id: identity.chainId, genesis_hash: identity.genesis, height: 5, ...extra });
const account = (address, extra = {}) => ({ address, exists: true, balance: 10, next_nonce: 2, ...extra });
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
const tick = () => new Promise((resolve) => setImmediate(resolve));
function storage(initial = null) {
  let value = initial;
  return { getItem: () => value, setItem: (_, next) => { value = next; }, removeItem: () => { value = null; } };
}

test('validates SDK address kinds and checksums rather than an EVM or prefix regex', () => {
  const agent = pcc.agentAddress({ scheme: 'ed25519', bytes: '11'.repeat(32) });
  const passkey = pcc.passkeyAddress({ scheme: 'p256', bytes: '036b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296' });
  const tz2 = pcc.tezosAddress({ scheme: 'secp256k1', bytes: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' });
  for (const value of [address(1), tz2, agent, passkey]) assert.equal(publicAddress(' ' + value + ' '), value);
  for (const value of ['0x' + 'a'.repeat(40), 'tz1' + 'A'.repeat(33), address(1).slice(0, -1) + '0', null, 'x'.repeat(100)]) assert.throws(() => publicAddress(value));
  assert.equal(localLabel('Studio\u202e account\nlabel'), 'Studio account label');
  assert.throws(() => localLabel('x'.repeat(65)));
});

test('exports round-trip only public addresses, labels and pinned identity', () => {
  const entries = [entry(1, '<b>Studio</b>'), entry(2)];
  const payload = document(entries);
  assert.deepEqual(parseBook(payload, identity), entries);
  assert.deepEqual(Object.keys(JSON.parse(payload)), ['format', 'version', 'chainId', 'genesis', 'accounts']);
  const store = storage(); assert.equal(saveBook(store, entries, identity), true);
  assert.deepEqual(loadBook(store, identity), { accounts: entries, unavailable: false, error: '' });
  assert.equal(store.getItem(STORAGE_KEY), payload);
});

test('rejects unknown/private fields, foreign genesis, unsupported versions, duplicates, and unsafe labels atomically', () => {
  const base = bookDocument([entry(1)], identity);
  const bad = [null, [], { ...base, privateKey: 'secret' }, { ...base, version: 2 }, { ...base, genesis: 'b'.repeat(64) }, { ...base, chainId: 'another' }, { ...base, accounts: [{ ...entry(1), seed: 'secret' }] }, { ...base, accounts: [entry(1), entry(1)] }, { ...base, accounts: [{ address: address(1), label: 1 }] }, { ...base, accounts: [{ address: 'invalid', label: '' }] }, { ...base, accounts: Array.from({ length: MAX_ACCOUNTS + 1 }, (_, n) => entry(n)) }];
  for (const value of bad) assert.throws(() => parseBook(JSON.stringify(value), identity));
  assert.throws(() => parseBook('{broken', identity), /readable JSON/);
  assert.throws(() => parseBook(' '.repeat(MAX_FILE_BYTES + 1), identity), /too large/);
  assert.throws(() => parseBook('💚'.repeat(MAX_FILE_BYTES / 2), identity), /too large/);
});

test('merge keeps existing labels and rejects overflow without changing either input', () => {
  const current = [entry(1, 'original')]; const incoming = [entry(1, 'replacement'), entry(2, 'new')];
  assert.deepEqual(mergeBook(current, incoming), { accounts: [entry(1, 'original'), entry(2, 'new')], added: 1, skipped: 1 });
  const full = Array.from({ length: MAX_ACCOUNTS }, (_, n) => entry(n));
  assert.throws(() => mergeBook(full, [entry(100)]), /exceed/);
  assert.equal(full.length, MAX_ACCOUNTS); assert.equal(current[0].label, 'original');
});

test('corrupt and foreign saved data stays untouched; storage denial is explicit', () => {
  for (const text of ['{broken', JSON.stringify(bookDocument([entry(1)], { ...identity, genesis: 'c'.repeat(64) }))]) {
    const store = storage(text); const loaded = loadBook(store, identity);
    assert.deepEqual(loaded.accounts, []); assert.ok(loaded.error); assert.equal(store.getItem(STORAGE_KEY), text);
  }
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } };
  assert.equal(loadBook(denied, identity).unavailable, true); assert.equal(saveBook(denied, [entry(1)], identity), false);
  assert.equal(loadBook(null, identity).unavailable, true);
});

test('account views reject unexpected, mismatched, unsafe and inconsistent API data', () => {
  assert.deepEqual(accountView(account(address(1)), address(1)), { exists: true, balance: 10, nextNonce: 2 });
  assert.equal(accountView(account(address(1), { exists: false, balance: 0, next_nonce: 0 }), address(1)).exists, false);
  for (const bad of [null, {}, account(address(2)), account(address(1), { exists: 'yes' }), account(address(1), { balance: '10' }), account(address(1), { balance: Number.MAX_SAFE_INTEGER + 1 }), account(address(1), { balance: -1 }), account(address(1), { next_nonce: 0.5 }), account(address(1), { exists: false })]) assert.throws(() => accountView(bad, address(1)));
});

test('bounded concurrent requests and identity checks bracket every account batch', async () => {
  let active = 0; let peak = 0; const calls = []; const states = [];
  const net = { async get(path) {
    calls.push(path);
    if (path === '/status') return status();
    active++; peak = Math.max(peak, active); await tick(); active--;
    return account(decodeURIComponent(path.split('/').pop()));
  } };
  const entries = Array.from({ length: 11 }, (_, n) => entry(n));
  await createReader(net, identity, (state) => states.push(state), { now: () => 123 }).refresh(entries);
  assert.equal(peak, 4); assert.equal(calls.length, entries.length + 2);
  assert.equal(calls[0], '/status'); assert.equal(calls.at(-1), '/status');
  assert.equal(states.at(-1).state, 'ready'); assert.equal(states.at(-1).rows.length, 11); assert.equal(states.at(-1).checkedAt, 123);
});

test('repeated edits coalesce and superseded account results cannot publish', async () => {
  const hold = deferred(); const calls = []; const states = [];
  const net = { async get(path) {
    calls.push(path); if (path === '/status') return status();
    if (path.endsWith(address(1))) return hold.promise;
    return account(path.split('/').pop(), { balance: 99 });
  } };
  const reader = createReader(net, identity, (state) => states.push(state));
  const first = reader.refresh([entry(1)]); await tick();
  reader.refresh([entry(2)]); reader.refresh([entry(3)]);
  hold.resolve(account(address(1), { balance: 111 })); await first;
  const ready = states.filter((state) => state.state === 'ready');
  assert.equal(ready.length, 1); assert.equal(ready[0].rows[0].address, address(3));
  assert.equal(calls.some((path) => path.endsWith(address(2))), false);
});

test('changed chain or genesis before or after reads hides results and latches pause', async () => {
  for (const field of ['chain_id', 'genesis_hash']) for (const during of [false, true]) {
    let reads = 0; let checks = 0; const states = [];
    const net = { async get(path) {
      if (path === '/status') { checks++; return status(checks === (during ? 2 : 1) ? { [field]: field === 'chain_id' ? 'wrong' : 'b'.repeat(64) } : {}); }
      reads++; return account(address(1));
    } };
    const reader = createReader(net, identity, (state) => states.push(state));
    await reader.refresh([entry(1)]);
    assert.equal(states.at(-1).state, 'paused'); assert.deepEqual(states.at(-1).rows, []); assert.equal(reads, during ? 1 : 0);
    const count = checks; await reader.refresh([entry(2)]); assert.equal(checks, count);
  }
});

test('identity mismatch in a superseded status request also pauses the latest book', async () => {
  const hold = deferred(); const states = []; let count = 0;
  const reader = createReader({ get: async () => { count++; return hold.promise; } }, identity, (state) => states.push(state));
  const done = reader.refresh([entry(1)]); reader.refresh([entry(2)]);
  hold.resolve(status({ genesis_hash: 'b'.repeat(64) })); await done;
  assert.equal(states.at(-1).state, 'paused'); assert.equal(count, 1);
});

test('chain ID must match exactly, including whitespace and invisible characters', async () => {
  for (const chain_id of [' ' + identity.chainId, identity.chainId + '\u202e']) {
    const states = [];
    await createReader({ get: async () => status({ chain_id }) }, identity, (state) => states.push(state)).refresh([entry(1)]);
    assert.equal(states.at(-1).state, 'paused');
  }
});

test('a partial account failure remains unavailable while other safe reads succeed', async () => {
  const states = [];
  await createReader({ get: async (path) => path === '/status' ? status() : path.endsWith(address(1)) ? null : account(address(2)) }, identity, (state) => states.push(state)).refresh([entry(1), entry(2)]);
  assert.deepEqual(states.at(-1).rows.map((row) => row.state), ['error', 'ready']);
});

test('backwards height, malformed status and failing final identity check publish no balances', async () => {
  for (const last of [status({ height: 4 }), {}, null]) {
    let checks = 0; const states = [];
    await createReader({ get: async (path) => path === '/status' ? (++checks === 1 ? status() : last) : account(address(1)) }, identity, (state) => states.push(state)).refresh([entry(1)]);
    assert.equal(states.at(-1).state, 'error'); assert.deepEqual(states.at(-1).rows, []);
  }
});

test('hung fetch bodies time out and cannot leave a book loading forever', async () => {
  const states = [];
  const net = makeNet('https://example.test', { timeoutMs: 5, fetch: async () => ({ ok: true, status: 200, text: () => new Promise(() => {}) }) });
  await createReader(net, identity, (state) => states.push(state)).refresh([entry(1)]);
  assert.equal(states.at(-1).state, 'error'); assert.equal(net.count, 1);
});

test('HTTP integration uses only bounded public GET reads with matching identity around the batch', async (t) => {
  const calls = [];
  const server = createServer((request, response) => {
    calls.push({ path: request.url, method: request.method, referrer: request.headers.referer });
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(request.url === '/status' ? status() : account(request.url.split('/').pop())));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const net = makeNet(`http://127.0.0.1:${server.address().port}`, { timeoutMs: 1000 });
  const states = [];
  await createReader(net, identity, (state) => states.push(state)).refresh([entry(1)]);
  assert.equal(states.at(-1).state, 'ready');
  assert.deepEqual(calls.map((call) => call.path), ['/status', '/account/' + address(1), '/status']);
  assert.ok(calls.every((call) => call.method === 'GET' && call.referrer === undefined));
});
