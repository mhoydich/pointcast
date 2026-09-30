import test from 'node:test';
import assert from 'node:assert/strict';

let moduleId = 0;
const keep = (n) => ({ id: `link:https://example.com/${n}`, kind: 'link', url: `https://example.com/${n}`, title: `Save ${n}`, note: '', keptAt: '2026-09-30T12:00:00.000Z' });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const shelf = (keeps = [], userId = 'pcu_a', extra = {}) => json({ ok: true, keeps, userId, importProtocol: 2, ...extra });
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

async function fixture(t, items = []) {
  const events = new EventTarget();
  const values = new Map([['pc:keeps', JSON.stringify(items)]]);
  const storage = {
    failRead: false, failWrite: false,
    getItem(key) { if (this.failRead) throw Error('denied'); return values.get(key) ?? null; },
    setItem(key, value) { if (this.failWrite) throw Error('quota'); values.set(key, value); },
  };
  const originals = new Map(['window', 'localStorage', 'fetch'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: events });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: storage });
  t.after(() => { for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const client = await import(`../src/lib/keeps-client.ts?test=${++moduleId}`);
  const changes = [];
  events.addEventListener('pc:keeps:change', (event) => changes.push(event.detail));
  return { client, storage, values, changes, events, local: () => JSON.parse(values.get('pc:keeps')), auth: (userId) => events.dispatchEvent(new CustomEvent('pc:auth-change', { detail: { user: userId ? { userId } : null } })) };
}

test('account loading never auto-imports; explicit 300-item import uses acknowledged batches of 100', async (t) => {
  const f = await fixture(t, Array.from({ length: 300 }, (_, i) => keep(i)));
  const posts = [];
  const durable = new Map();
  globalThis.fetch = async (_url, options) => {
    if (options.method === 'GET') return shelf([...durable.values()]);
    const body = JSON.parse(options.body); posts.push(body);
    for (const item of body.items) durable.set(item.id, item);
    return shelf([...durable.values()], 'pcu_a', { acceptedIds: body.items.map((k) => k.id) });
  };
  assert.equal((await f.client.loadKeeps()).mode, 'account');
  assert.equal(posts.length, 0);
  assert.equal(f.local().length, 300);
  const result = await f.client.importBrowserKeeps();
  assert.equal(result.complete, true);
  assert.equal(result.acceptedIds.length, 300);
  assert.deepEqual(posts.map((p) => p.items.length), [100, 100, 100]);
  assert.ok(posts.every((p) => p.importProtocol === 2));
  assert.equal(durable.size, 300);
  assert.deepEqual(f.local(), []);
});

test('imports require negotiated protocol and never trust old success envelopes', async (t) => {
  const f = await fixture(t, [keep(1)]);
  let posts = 0;
  globalThis.fetch = async (_url, opts) => { if (opts.method !== 'GET') posts++; return shelf([], 'pcu_a', { importProtocol: undefined }); };
  await f.client.loadKeeps();
  const result = await f.client.importBrowserKeeps();
  assert.equal(result.complete, false); assert.equal(posts, 0); assert.equal(f.local().length, 1);
  assert.match(f.client.keepsError(), /Safe import/);
});

test('an interrupted 151-item import retains the unacknowledged 51 and retry completes', async (t) => {
  const f = await fixture(t, Array.from({ length: 151 }, (_, i) => keep(i)));
  let calls = 0;
  const durable = new Map();
  globalThis.fetch = async (_url, opts) => {
    if (opts.method === 'GET') return shelf([...durable.values()]);
    if (++calls === 2) return json({ ok: false, reason: 'unavailable' }, 503);
    const { items } = JSON.parse(opts.body); items.forEach((k) => durable.set(k.id, k));
    return shelf([...durable.values()], 'pcu_a', { acceptedIds: items.map((k) => k.id) });
  };
  const first = await f.client.importBrowserKeeps();
  assert.equal(first.complete, false); assert.equal(first.acceptedIds.length, 100);
  assert.equal(f.local().length, 51); assert.equal(durable.size, 100);
  const second = await f.client.importBrowserKeeps();
  assert.equal(second.complete, true); assert.equal(durable.size, 151); assert.equal(f.local().length, 0);
});

test('partial acknowledgement removes only accepted source IDs and ignores invented acknowledgements', async (t) => {
  const items = [keep(1), keep(2), keep(3)];
  const f = await fixture(t, items);
  globalThis.fetch = async (_url, opts) => opts.method === 'GET' ? shelf() : shelf(items.slice(0, 2), 'pcu_a', { acceptedIds: [items[0].id, items[1].id, 'not-sent'], rejected: [{ id: items[2].id, reason: 'limit-reached' }] });
  const result = await f.client.importBrowserKeeps();
  assert.deepEqual(result.acceptedIds, items.slice(0, 2).map((k) => k.id));
  assert.deepEqual(f.local(), [items[2]]); assert.equal(result.complete, false);
});

test('imports from adapters do not clear the unrelated browser shelf', async (t) => {
  const f = await fixture(t, [keep(1)]);
  globalThis.fetch = async (_url, opts) => opts.method === 'GET' ? shelf() : shelf([keep(2)], 'pcu_a', { acceptedIds: [keep(2).id] });
  assert.equal((await f.client.importKeeps([keep(2)])).complete, true);
  assert.deepEqual(f.local(), [keep(1)]);
});

test('a local edit made during import survives acknowledgement of the older version', async (t) => {
  const f = await fixture(t, [keep(1)]);
  globalThis.fetch = async (_url, opts) => {
    if (opts.method === 'GET') return shelf();
    f.values.set('pc:keeps', JSON.stringify([{ ...keep(1), note: 'Added in another tab' }]));
    return shelf([keep(1)], 'pcu_a', { acceptedIds: [keep(1).id] });
  };
  await f.client.importBrowserKeeps();
  assert.equal(f.local()[0].note, 'Added in another tab');
});

test('503 and network failures are unavailable, while only 401 enables browser saves', async (t) => {
  const f = await fixture(t, [keep(1)]);
  globalThis.fetch = async () => json({ ok: false }, 503);
  assert.equal((await f.client.loadKeeps()).mode, 'unavailable');
  assert.equal(await f.client.addKeep(keep(2)), false);
  assert.deepEqual(f.local(), [keep(1)]);
  globalThis.fetch = async () => { throw Error('offline'); };
  assert.equal((await f.client.loadKeeps(true)).mode, 'unavailable');
  globalThis.fetch = async () => json({ ok: false }, 401);
  assert.equal((await f.client.loadKeeps(true)).mode, 'browser');
  assert.equal(await f.client.addKeep(keep(2)), true);
  assert.equal(f.local().length, 2);
  assert.equal((await f.client.loadKeeps()).keeps.length, 2);
});

test('full local shelves are not truncated, duplicates preserve notes, failed writes report failure', async (t) => {
  const f = await fixture(t, Array.from({ length: 301 }, (_, i) => keep(i)));
  globalThis.fetch = async () => json({ ok: false }, 401);
  assert.equal(await f.client.addKeep(keep(302)), false);
  assert.equal(f.local().length, 301);
  assert.equal(await f.client.addKeep({ ...keep(0), note: 'do not overwrite existing' }), true);
  assert.equal(f.local()[0].note, '');
  f.storage.failWrite = true;
  assert.equal(await f.client.removeKeep(keep(0).id), false);
  assert.equal(f.client.isKept(keep(0).id), true);
  assert.match(f.client.keepsError(), /not saved/);
});

test('unreadable browser storage is not overwritten with an empty shelf', async (t) => {
  const f = await fixture(t, [keep(1)]);
  f.storage.failRead = true;
  globalThis.fetch = async () => json({ ok: false }, 401);
  assert.equal((await f.client.loadKeeps()).mode, 'unavailable');
  assert.equal(await f.client.addKeep(keep(2)), false);
  assert.deepEqual(f.local(), [keep(1)]);
});

test('late account-A load cannot repopulate after account B signs in', async (t) => {
  const f = await fixture(t);
  const old = deferred(); let get = 0;
  globalThis.fetch = async () => ++get === 1 ? old.promise : shelf([keep('b')], 'pcu_b');
  const stale = f.client.loadKeeps();
  await Promise.resolve();
  f.auth('pcu_b');
  await f.client.loadKeeps();
  old.resolve(shelf([keep('a')], 'pcu_a'));
  await stale;
  assert.equal(f.client.isKept(keep('a').id), false);
  assert.equal(f.client.isKept(keep('b').id), true);
  assert.ok(f.changes.every((state) => !state.keeps.some((k) => k.id === keep('a').id)));
});

test('account switch aborts pending and queued saves instead of saving them into the new account', async (t) => {
  const f = await fixture(t);
  const pending = deferred(), started = deferred(); let posts = 0, active = 'pcu_a';
  globalThis.fetch = async (_url, opts) => {
    if (opts.method === 'GET') return shelf([], active);
    posts++; started.resolve(); return pending.promise;
  };
  await f.client.loadKeeps();
  const first = f.client.addKeep(keep(1)), second = f.client.addKeep(keep(2));
  await started.promise;
  active = 'pcu_b'; f.auth(active); await f.client.loadKeeps();
  pending.resolve(shelf([keep(1)], 'pcu_a'));
  assert.deepEqual(await Promise.all([first, second]), [false, false]);
  assert.equal(posts, 1); assert.equal(f.client.isKept(keep(1).id), false);
});

test('late import acknowledgment from a former account never clears guest records', async (t) => {
  const f = await fixture(t, [keep(1)]);
  const pending = deferred(), started = deferred(); let active = 'pcu_a';
  globalThis.fetch = async (_url, opts) => {
    if (opts.method === 'GET') return shelf([], active);
    started.resolve(); return pending.promise;
  };
  const importing = f.client.importBrowserKeeps(); await started.promise;
  active = 'pcu_b'; f.auth(active); await f.client.loadKeeps();
  pending.resolve(shelf([keep(1)], 'pcu_a', { acceptedIds: [keep(1).id] }));
  assert.equal((await importing).complete, false);
  assert.deepEqual(f.local(), [keep(1)]);
});

test('an expired session cannot turn already queued account writes into guest saves', async (t) => {
  const f = await fixture(t, [keep('guest')]);
  let posts = 0;
  globalThis.fetch = async (_url, opts) => opts.method === 'GET' ? shelf() : (++posts, json({ ok: false }, 401));
  await f.client.loadKeeps();
  assert.deepEqual(await Promise.all([f.client.addKeep(keep(1)), f.client.addKeep(keep(2))]), [false, false]);
  assert.equal(posts, 1); assert.deepEqual(f.local(), [keep('guest')]);
});

test('versioned edits keep the existing API response contract', async (t) => {
  const f = await fixture(t); const calls = [];
  globalThis.fetch = async (_url, opts) => { calls.push(opts); return shelf([{ ...keep(1), note: 'Edited', version: 3 }]); };
  await f.client.loadKeeps();
  assert.equal(await f.client.updateKeep(keep(1).id, { note: 'Edited' }, 2), true);
  assert.equal(calls.at(-1).method, 'PATCH');
  assert.deepEqual(JSON.parse(calls.at(-1).body), { id: keep(1).id, note: 'Edited', version: 2, expectedUserId: 'pcu_a' });
});


test('delete binds the selected save lifetime and preserves the shelf on a stale-delete conflict', async (t) => {
  const f = await fixture(t); const calls = [];
  const old = { ...keep(1), itemId: 'old-item-id', version: 1 };
  const current = { ...keep(1), itemId: 'new-item-id', version: 1 };
  globalThis.fetch = async (_url, opts) => {
    calls.push(opts);
    return opts.method === 'GET' ? shelf([current]) : json({ ok: false, reason: 'conflict', userId: 'pcu_a' }, 409);
  };
  await f.client.loadKeeps();
  assert.equal(await f.client.removeKeep(old.id, old.version, old.itemId), false);
  assert.equal(calls.at(-1).method, 'DELETE');
  assert.deepEqual(JSON.parse(calls.at(-1).body), { id: old.id, version: 1, expectedItemId: old.itemId, expectedUserId: 'pcu_a' });
  assert.equal(f.client.isKept(current.id), true);
  assert.match(f.client.keepsError(), /changed in another tab/);
  // Callers without a dialog capture bind to the current cache at invocation.
  assert.equal(await f.client.removeKeep(current.id), false);
  assert.equal(JSON.parse(calls.at(-1).body).expectedItemId, current.itemId);
});

test('failed browser cleanup keeps acknowledged imports available for safe retry', async (t) => {
  const f = await fixture(t, [keep(1)]);
  globalThis.fetch = async (_url, opts) => opts.method === 'GET' ? shelf() : shelf([keep(1)], 'pcu_a', { acceptedIds: [keep(1).id] });
  await f.client.loadKeeps(); f.storage.failWrite = true;
  const result = await f.client.importBrowserKeeps();
  assert.equal(result.complete, false); assert.deepEqual(f.local(), [keep(1)]);
  assert.match(f.client.keepsError(), /storage/);
});

test('account mismatch without an auth event clears private results and refuses the change', async (t) => {
  const f = await fixture(t);
  globalThis.fetch = async (_url, opts) => opts.method === 'GET' ? shelf([keep('a')]) : shelf([keep('b')], 'pcu_b');
  await f.client.loadKeeps();
  assert.equal(await f.client.addKeep(keep(2)), false);
  assert.equal(f.client.shelfMode(), 'unavailable');
  assert.equal(f.client.isKept(keep('a').id), false); assert.equal(f.client.isKept(keep('b').id), false);
});


test('a hanging shelf load times out into a retry state instead of using guest storage', async (t) => {
  const f = await fixture(t, [keep('guest')]);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reached = deferred();
  globalThis.fetch = async (_url, opts) => {
    reached.resolve();
    return new Promise((_resolve, reject) => opts.signal.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), { once: true }));
  };
  const loading = f.client.loadKeeps(); await reached.promise;
  t.mock.timers.tick(15000);
  assert.equal((await loading).mode, 'unavailable');
  assert.deepEqual(f.local(), [keep('guest')]); assert.match(f.client.keepsError(), /Try again/);
  globalThis.fetch = async () => shelf([keep('account')]);
  assert.equal((await f.client.loadKeeps(true)).mode, 'account');
});

test('a hanging account save times out without local fallback and can be retried', async (t) => {
  const f = await fixture(t, [keep('guest')]);
  globalThis.fetch = async () => shelf([keep('existing')]);
  await f.client.loadKeeps();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reached = deferred();
  globalThis.fetch = async (_url, opts) => {
    reached.resolve();
    return new Promise((_resolve, reject) => opts.signal.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), { once: true }));
  };
  const saving = f.client.addKeep(keep('new')); await reached.promise;
  t.mock.timers.tick(15000);
  assert.equal(await saving, false); assert.equal(f.client.shelfMode(), 'account');
  assert.equal(f.client.isKept(keep('existing').id), true); assert.equal(f.client.isKept(keep('new').id), false);
  assert.deepEqual(f.local(), [keep('guest')]); assert.match(f.client.keepsError(), /Try again/);
  globalThis.fetch = async () => shelf([keep('existing'), keep('new')]);
  assert.equal(await f.client.addKeep(keep('new')), true);
});

test('writes and imports bind to the account shown before another tab changes its cookie', async (t) => {
  const f = await fixture(t, [keep(1)]); const sent = [];
  globalThis.fetch = async (_url, opts) => {
    if (opts.method === 'GET') return shelf();
    sent.push(JSON.parse(opts.body));
    return json({ ok: false, reason: 'account-changed', userId: 'pcu_b' }, 409);
  };
  await f.client.loadKeeps();
  const result = await f.client.importBrowserKeeps();
  assert.equal(sent[0].expectedUserId, 'pcu_a');
  assert.equal(result.complete, false); assert.deepEqual(f.local(), [keep(1)]);
  assert.equal(f.client.shelfMode(), 'unavailable');
  await f.client.loadKeeps(true);
  assert.equal(await f.client.addKeep(keep(2)), false);
  assert.equal(sent[1].expectedUserId, 'pcu_a');
});
