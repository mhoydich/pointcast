import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IndexedDbSandboxStore, MemorySandboxStore, NounsMoneyClient,
  NounsMoneyError, NounsMoneySandbox, SANDBOX_LIMITS, validateSandboxState,
} from '../packages/nouns-money-sdk/src/index.ts';

const create = { label: 'Studio demo', noteCount: 2, mode: 'test' };
const confirm = { noteIds: ['nm100-000', 'nm100-099'], mode: 'test' };
const opts = n => ({ idempotencyKey: `sandbox-key-${String(n).padStart(6, '0')}` });
const setup = () => { const store = new MemorySandboxStore(); return { store, sandbox: new NounsMoneySandbox(store) }; };
const rejects = (promise, code) => assert.rejects(promise, error => error instanceof NounsMoneyError && error.code === code);

test('local state machine: create, confirm, stable receipt, reload, and immutable return values', async () => {
  const { store, sandbox } = setup();
  const intent = await sandbox.createIntent(create, opts(1));
  assert.equal(intent.status, 'requires_notes');
  assert.equal(intent.receipt, null);
  assert.deepEqual(intent.noteIds, []);
  assert.match(intent.id, /^nmpi_/);
  const result = await sandbox.confirmIntent(intent.id, confirm, opts(2));
  assert.equal(result.status, 'succeeded');
  assert.equal(result.receipt.id, 'nmr_' + intent.id.slice(5));
  assert.deepEqual(result.noteIds, confirm.noteIds);
  assert.equal(result.receipt.mode, 'test');
  const repeated = await sandbox.confirmIntent(intent.id, confirm, opts(3));
  assert.deepEqual(repeated, result);
  repeated.receipt.noteIds.push('nm100-042');
  result.label = 'Changed outside storage';
  const reloaded = new NounsMoneySandbox(new MemorySandboxStore(await store.exportState()));
  const read = await reloaded.retrieveIntent(intent.id);
  assert.equal(read.label, create.label);
  assert.deepEqual(read.noteIds, confirm.noteIds);
  assert.equal((await reloaded.listIntents()).length, 1);
  assert.equal((await reloaded.retrieveIntent(intent.id)).receipt.id, repeated.receipt.id);
  await rejects(sandbox.cancelIntent(intent.id, opts(4)), 'invalid_state');
  await rejects(sandbox.confirmIntent(intent.id, { noteIds: ['nm100-001', 'nm100-002'], mode: 'test' }, opts(5)), 'invalid_state');
});

test('idempotency is global, normalized, persists original create keys, and returns original snapshots', async () => {
  const { store, sandbox } = setup();
  const intent = await sandbox.createIntent({ ...create, label: '  Studio demo  ' }, opts(1));
  assert.deepEqual(await sandbox.createIntent(create, opts(1)), intent);
  await rejects(sandbox.createIntent({ ...create, noteCount: 3 }, opts(1)), 'idempotency_conflict');
  await rejects(sandbox.cancelIntent(intent.id, opts(1)), 'idempotency_conflict');
  const succeeded = await sandbox.confirmIntent(intent.id, confirm, opts(2));
  assert.deepEqual(await sandbox.confirmIntent(intent.id, { ...confirm, noteIds: [...confirm.noteIds].reverse() }, opts(2)), succeeded);
  await rejects(sandbox.confirmIntent(intent.id, { noteIds: ['nm100-001', 'nm100-002'], mode: 'test' }, opts(2)), 'idempotency_conflict');
  assert.deepEqual(await sandbox.createIntent(create, opts(1)), intent);
  const persisted = await store.exportState();
  assert.equal(persisted.intents[intent.id].createIdempotencyKey, opts(1).idempotencyKey);
  assert.equal(Object.keys(persisted.operations).length, 2);
});

test('concurrent clicks across adapter instances create one intent and one receipt', async () => {
  const { store, sandbox } = setup();
  const secondTab = new NounsMoneySandbox(store);
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => (i % 2 ? secondTab : sandbox).createIntent(create, opts(1))));
  assert.equal(new Set(results.map(result => result.id)).size, 1);
  const id = results[0].id;
  const confirmations = await Promise.all(Array.from({ length: 20 }, (_, i) => (i % 2 ? secondTab : sandbox).confirmIntent(id, confirm, opts(i + 2))));
  assert.equal(new Set(confirmations.map(result => result.receipt.id)).size, 1);
  assert.equal((await sandbox.listIntents()).length, 1);
});

test('cancel/back is terminal and repeatable, while selection failure preserves requires_notes', async () => {
  const { sandbox } = setup();
  const intent = await sandbox.createIntent(create, opts(1));
  await rejects(sandbox.confirmIntent(intent.id, { noteIds: ['nm100-000'], mode: 'test' }, opts(2)), 'invalid_request');
  assert.equal((await sandbox.retrieveIntent(intent.id)).status, 'requires_notes');
  const result = await sandbox.cancelIntent(intent.id, opts(2));
  assert.equal(result.status, 'canceled');
  assert.equal(result.receipt, null);
  assert.deepEqual(await sandbox.cancelIntent(intent.id, opts(3)), result);
  await rejects(sandbox.confirmIntent(intent.id, confirm, opts(4)), 'invalid_state');
});

test('strict input validation rejects live mode, unknown fields, invalid counts, labels, keys and notes', async () => {
  const { sandbox } = setup();
  const invalidCreates = [null, {}, { ...create, amount: 99 }, { ...create, noteCount: 0 }, { ...create, noteCount: 6 }, { ...create, noteCount: 1.5 }, { ...create, noteCount: '2' }, { ...create, label: '' }, { ...create, label: ' '.repeat(5) }, { ...create, label: 'x'.repeat(81) }, { ...create, label: 'bad\nlabel' }, Object.assign({ ...create }, { [Symbol('extra')]: true })];
  for (const value of invalidCreates) await rejects(sandbox.createIntent(value, opts(1)), 'invalid_request');
  for (const value of ['live', 'TEST', undefined, null]) await rejects(sandbox.createIntent({ ...create, mode: value }, opts(1)), 'invalid_mode');
  for (const value of [{ idempotencyKey: 'short' }, { idempotencyKey: 'a'.repeat(129) }, { idempotencyKey: 'invalid spaces-key' }, { idempotencyKey: 'nonascii-ππππππππ' }, { ...opts(1), extra: true }, null]) await rejects(sandbox.createIntent(create, value), 'invalid_request');
  const intent = await sandbox.createIntent(create, opts(1));
  for (const noteIds of [[], ['nm100-000', 'nm100-000'], ['nm100-100'], ['nm100-00'], ['nm100-000', 'nm100-0a1'], ['nmpi_001'], null]) await rejects(sandbox.confirmIntent(intent.id, { noteIds, mode: 'test' }, opts(2)), 'invalid_request');
  await rejects(sandbox.confirmIntent(intent.id, { ...confirm, extra: true }, opts(2)), 'invalid_request');
  await rejects(sandbox.confirmIntent(intent.id, { ...confirm, mode: 'live' }, opts(2)), 'invalid_mode');
  await rejects(sandbox.retrieveIntent('fake'), 'invalid_request');
  await rejects(sandbox.retrieveIntent('nmpi_00000000-0000-0000-0000-000000000000'), 'not_found');
  await rejects(sandbox.cancelIntent('nmpi_00000000-0000-0000-0000-000000000000', opts(2)), 'not_found');
});

test('persisted corruption is rejected without silent reset, including forged receipts and missing operation evidence', async () => {
  const { store, sandbox } = setup();
  const intent = await sandbox.createIntent(create, opts(1));
  await sandbox.confirmIntent(intent.id, confirm, opts(2));
  const original = await store.exportState();
  const corruptions = [
    state => { state.extra = true; },
    state => { state.schema = 'other'; },
    state => { state.intents[intent.id].mode = 'live'; },
    state => { state.intents[intent.id].receipt.id = 'forged'; },
    state => { state.intents[intent.id].noteIds = ['nm100-000', 'nm100-000']; },
    state => { state.intents[intent.id].createIdempotencyKey = 'missing-create-key'; },
    state => { delete state.operations[opts(1).idempotencyKey]; },
    state => { delete state.operations[opts(2).idempotencyKey]; },
    state => { state.operations[opts(2).idempotencyKey].fingerprint = '{}'; },
    state => { state.operations[opts(2).idempotencyKey].result.receipt.noteIds = ['nm100-001', 'nm100-002']; },
    state => { state.intents[intent.id].updatedAt = 'not a date'; },
  ];
  for (const corrupt of corruptions) {
    const state = structuredClone(original);
    corrupt(state);
    const broken = new NounsMoneySandbox(new MemorySandboxStore(state));
    await rejects(broken.listIntents(), 'corrupted_state');
    await rejects(broken.createIntent(create, opts(3)), 'corrupted_state');
  }
  validateSandboxState(original);
});

test('transaction rollback protects prior state when mutation or validation fails', async () => {
  const { store, sandbox } = setup();
  const intent = await sandbox.createIntent(create, opts(1));
  const before = await store.exportState();
  await assert.rejects(store.transact(state => { state.intents[intent.id].status = 'succeeded'; throw new Error('simulated operation failure'); }), /simulated operation failure/);
  await rejects(store.transact(state => { state.intents[intent.id].status = 'succeeded'; return null; }), 'corrupted_state');
  assert.deepEqual(await store.exportState(), before);
  assert.equal((await sandbox.retrieveIntent(intent.id)).status, 'requires_notes');
});

test('capacity preserves old idempotency keys and rejects new intents and operations without eviction', async () => {
  const { store, sandbox } = setup();
  const first = await sandbox.createIntent(create, opts(0));
  for (let i = 1; i < SANDBOX_LIMITS.intents; i++) await sandbox.createIntent(create, opts(i));
  await rejects(sandbox.createIntent(create, opts(5000)), 'capacity_exceeded');
  assert.deepEqual(await sandbox.createIntent(create, opts(0)), first);
  const canceled = await sandbox.cancelIntent(first.id, opts(250));
  for (let i = 251; i < SANDBOX_LIMITS.operations; i++) await sandbox.cancelIntent(first.id, opts(i));
  await rejects(sandbox.cancelIntent(first.id, opts(5001)), 'capacity_exceeded');
  assert.deepEqual(await sandbox.cancelIntent(first.id, opts(250)), canceled);
  const state = await store.exportState();
  assert.equal(Object.keys(state.intents).length, 250);
  assert.equal(Object.keys(state.operations).length, 1000);
  assert.equal((await sandbox.retrieveIntent(first.id)).status, 'canceled');
});

// Minimal asynchronous transaction harness. This proves SDK commit/abort handling;
// native browser IndexedDB concurrency is separately checked in browser QA.
function mockIndexedDB({ failPut = false } = {}) {
  let committed;
  let running = false;
  const queue = [];
  const drain = () => { if (!running && queue.length) { running = true; queue.shift()(); } };
  const db = {
    objectStoreNames: { contains: () => true }, close() {},
    transaction() {
      let aborted = false;
      const tx = {
        abort() { if (aborted) return; aborted = true; queueMicrotask(() => { tx.onabort?.(); running = false; drain(); }); },
        objectStore() { return {
          get() { const request = {}; queue.push(() => queueMicrotask(() => { request.result = structuredClone(committed); request.onsuccess?.(); })); queueMicrotask(drain); return request; },
          put(value) { if (failPut) throw new DOMException('Quota exceeded', 'QuotaExceededError'); const next = structuredClone(value); queueMicrotask(() => { if (aborted) return; committed = next; tx.oncomplete?.(); running = false; drain(); }); },
        }; },
      };
      return tx;
    },
  };
  return { factory: { open() { const request = {}; queueMicrotask(() => { request.result = db; request.onsuccess?.(); }); return request; } }, snapshot: () => structuredClone(committed), setFailPut(value) { failPut = value; } };
}

test('IndexedDB adapter waits for atomic commit and reports failed writes instead of success (mocked storage)', async () => {
  const previous = globalThis.indexedDB;
  const mock = mockIndexedDB();
  globalThis.indexedDB = mock.factory;
  try {
    const firstStore = new IndexedDbSandboxStore();
    const secondStore = new IndexedDbSandboxStore();
    const first = new NounsMoneySandbox(firstStore);
    const second = new NounsMoneySandbox(secondStore);
    const results = await Promise.all([first.createIntent(create, opts(1)), second.createIntent(create, opts(1))]);
    assert.equal(results[0].id, results[1].id);
    assert.equal(Object.keys(mock.snapshot().intents).length, 1);
    mock.setFailPut(true);
    await rejects(first.confirmIntent(results[0].id, confirm, opts(2)), 'storage_unavailable');
    assert.equal(mock.snapshot().intents[results[0].id].status, 'requires_notes');
    assert.equal(mock.snapshot().operations[opts(2).idempotencyKey], undefined);
    mock.setFailPut(false);
    assert.equal((await second.confirmIntent(results[0].id, confirm, opts(2))).status, 'succeeded');
    await firstStore.close();
    await secondStore.close();
  } finally { if (previous === undefined) delete globalThis.indexedDB; else globalThis.indexedDB = previous; }
});

test('unavailable browser storage fails explicitly and cannot create an intent', async () => {
  const previous = globalThis.indexedDB;
  delete globalThis.indexedDB;
  try { await rejects(new NounsMoneySandbox().createIntent(create, opts(1)), 'storage_unavailable'); }
  finally { if (previous !== undefined) globalThis.indexedDB = previous; }
});

test('collection client follows actual HTTP contract, validates IDs, and uses same-origin credentials', async () => {
  const requests = [];
  const timestamp = '2026-10-02T07:00:00.000Z';
  const collection = { ok: true, schema: 'pointcast.nouns-money.collection/v1', userId: 'pcu_demo', storage: 'account', noteIds: ['nm100-000'], collectedAt: { 'nm100-000': timestamp }, updatedAt: timestamp };
  const client = new NounsMoneyClient({ fetch: async (url, init) => { requests.push({ url, ...init }); return Response.json(collection); } });
  assert.deepEqual(await client.getCollection(), collection);
  await client.collectNote('nm100-000', collection.userId);
  await client.removeNote('nm100-000', collection.userId);
  assert.deepEqual(requests.map(request => request.method), ['GET', 'POST', 'DELETE']);
  for (const request of requests) { assert.equal(request.url, '/api/me/nouns-money'); assert.equal(request.credentials, 'same-origin'); }
  assert.equal(requests[1].body, '{"noteId":"nm100-000"}');
  assert.equal(requests[0].headers['X-PointCast-User'], undefined);
  assert.equal(requests[1].headers['X-PointCast-User'], collection.userId);
  assert.equal(requests[2].headers['X-PointCast-User'], collection.userId);
  await rejects(client.collectNote('nm100-100', collection.userId), 'invalid_request');
  for (const userId of [undefined, null, '', 'pcu_', 'wrong-prefix', 'pcu_bad id', 'pcu_bad\nheader', 'pcu_' + 'x'.repeat(125), 42]) {
    await rejects(client.collectNote('nm100-000', userId), 'invalid_request');
    await rejects(client.removeNote('nm100-000', userId), 'invalid_request');
  }
  assert.equal(requests.length, 3);
  const changedAccount = new NounsMoneyClient({ fetch: async () => Response.json({ ok: false, reason: 'account-changed' }, { status: 409 }) });
  await assert.rejects(changedAccount.collectNote('nm100-000', collection.userId), error => error.code === 'api_error' && error.status === 409 && error.reason === 'account-changed');
  const mismatchedResponse = new NounsMoneyClient({ fetch: async () => Response.json({ ...collection, userId: 'pcu_other' }) });
  await rejects(mismatchedResponse.removeNote('nm100-000', collection.userId), 'invalid_response');
  const unauthorized = new NounsMoneyClient({ fetch: async () => Response.json({ ok: false, reason: 'unauthenticated' }, { status: 401 }) });
  await assert.rejects(unauthorized.getCollection(), error => error.code === 'api_error' && error.status === 401 && error.reason === 'unauthenticated');
  const malformed = new NounsMoneyClient({ fetch: async () => Response.json({ ...collection, collectedAt: {} }) });
  await rejects(malformed.getCollection(), 'invalid_response');
  const networkFailure = new NounsMoneyClient({ fetch: async () => { throw new Error('offline'); } });
  await rejects(networkFailure.getCollection(), 'api_error');
});

test('catalog client requires exactly 100 authentic source IDs and matching noun IDs', async () => {
  const catalog = { schema: 'pointcast.nouns-money.catalog/v1', mode: 'collectible-art', count: 100, provenance: {}, notes: Array.from({ length: 100 }, (_, nounId) => ({ id: `nm100-${String(nounId).padStart(3, '0')}`, name: `Noun ${nounId}`, nounId, image: `/nouns-money/${nounId}.png`, svg: `/nouns-money/${nounId}.svg` })) };
  const client = new NounsMoneyClient({ fetch: async url => { assert.equal(url, '/nouns-money/catalog.json'); return Response.json(catalog); } });
  assert.equal((await client.getCatalog()).notes.length, 100);
  const broken = structuredClone(catalog); broken.notes[0].nounId = 1;
  await rejects(new NounsMoneyClient({ fetch: async () => Response.json(broken) }).getCatalog(), 'invalid_response');
});
