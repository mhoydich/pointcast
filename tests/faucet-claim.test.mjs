import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);
const SECRET = `0x${'1'.repeat(64)}`;
const ADDRESS = '0x000000000000000000000000000000000000dEaD';
const TX = `0x${'a'.repeat(64)}`;

async function withModules(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const [claims, lib, deliver, claim] = await Promise.all([
      server.ssrLoadModule('/functions/api/faucet/_claims.ts'),
      server.ssrLoadModule('/src/lib/faucet.ts'),
      server.ssrLoadModule('/functions/api/faucet/[slug]/deliver.ts'),
      server.ssrLoadModule('/functions/api/faucet/[slug]/claim.ts'),
    ]);
    return await run({ claims, lib, deliver, claim });
  } finally {
    await server.close();
  }
}

/** A D1-shaped shim over the real SQLite engine, so the migration and the SQL are what gets tested. */
class FakeD1 {
  constructor(sqlFiles) {
    this.db = new DatabaseSync(':memory:');
    for (const sql of sqlFiles) this.db.exec(sql);
  }

  prepare(sql) {
    const db = this.db;
    const failing = () => this.failOn && this.failOn(sql);
    let args = [];
    const statement = {
      bind(...values) { args = values; return statement; },
      async first() { if (failing()) throw new Error('d1-unavailable'); return db.prepare(sql).get(...args) ?? null; },
      async all() { if (failing()) throw new Error('d1-unavailable'); return { results: db.prepare(sql).all(...args) }; },
      async run() { if (failing()) throw new Error('d1-unavailable'); return db.prepare(sql).run(...args); },
    };
    return statement;
  }

  async batch(statements) {
    const out = [];
    for (const statement of statements) out.push(await statement.run());
    return out;
  }
}

class FakeKV {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

async function freshDb() {
  const init = await readFile(new URL('migrations/auth/0001_init.sql', root), 'utf8');
  const faucet = await readFile(new URL('migrations/auth/0009_faucet_claims.sql', root), 'utf8');
  const db = new FakeD1([init, faucet]);
  db.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)')
    .run('u1', JSON.stringify({ userId: 'u1', preferredName: 'Mike Hoydich', identities: [] }), '2026-09-04T00:00:00Z');
  db.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)')
    .run('u2', JSON.stringify({ userId: 'u2', preferredName: 'mhoydich@gmail.com', identities: [] }), '2026-09-04T00:00:00Z');
  db.db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run('tok1', 'u1', Date.now() + 86_400_000);
  return db;
}

const signedIn = (url, init = {}) => new Request(url, {
  ...init,
  headers: { cookie: 'pc_session=tok1', ...(init.headers ?? {}) },
});

const lockRow = (db) => db.db.prepare('SELECT holder, acquired_at FROM faucet_locks WHERE faucet = ?').get('hello');
const statuses = (db, userId = 'u1') => db.db
  .prepare('SELECT status FROM faucet_claims WHERE user_id = ? ORDER BY day ASC')
  .all(userId).map((row) => row.status);

const user = (userId) => ({ userId, createdAt: '2026-09-04T00:00:00Z', identities: [], preferredName: 'Mike' });

function fakeChain(overrides = {}) {
  const sends = [];
  const chain = {
    address: '0x1111111111111111111111111111111111111111',
    sends,
    async snapshot() {
      if (overrides.snapshotError) throw new Error(overrides.snapshotError);
      return { address: chain.address, tokenBalance: 1_000, ethBalance: '0.05', decimals: 18, lowGas: false, lowGasWarning: false, ...overrides.snapshot };
    },
    async send(to, amount) {
      if (overrides.sendError) throw new Error(overrides.sendError);
      sends.push({ to, amount });
      return { txHash: TX };
    },
  };
  return chain;
}

test('claim writes one held line per account per day and honours the cap', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_DAILY_CAP: '2' };
    const faucet = lib.getFaucet('hello');

    const first = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });
    assert.equal(first.ok, true);
    assert.equal(first.claim.status, 'held');
    assert.equal(first.claim.amount, 1);

    const again = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });
    assert.deepEqual([again.ok, again.reason], [false, 'already-claimed']);

    const tomorrow = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-05' });
    assert.equal(tomorrow.ok, true);

    const second = await claims.claimFaucetDrip({ env, user: user('u2'), faucet, day: '2026-09-04' });
    assert.equal(second.ok, true);

    db.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)').run('u3', '{"preferredName":"Ada"}', '2026-09-04T00:00:00Z');
    const capped = await claims.claimFaucetDrip({ env, user: user('u3'), faucet, day: '2026-09-04' });
    assert.deepEqual([capped.ok, capped.reason], [false, 'daily-cap-reached']);

    const pub = await claims.getPublicFaucetClaims(db, faucet, { day: '2026-09-04', cap: 2, configured: false });
    assert.equal(pub.claimedToday, 2);
    assert.equal(pub.remainingToday, 0);
    assert.equal(pub.heldTotal, 3);
    assert.equal(pub.deliveredTotal, 0);
    assert.deepEqual(pub.recent.map((r) => r.firstName), ['Someone', 'Mike', 'Mike']);

    const ledger = await claims.getUserFaucetLedger(db, faucet, user('u1'), '2026-09-04');
    assert.equal(ledger.today.claimed, true);
    assert.equal(ledger.held, 2);
    assert.equal(ledger.claims.length, 2);
  });
});

test('delivery sends every held drip in one transaction and records the receipt', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const kv = new FakeKV();
    const env = { AUTH_DB: db, PC_RATES_KV: kv, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-03' });
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });

    const chain = fakeChain();
    const result = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.equal(result.ok, true);
    assert.equal(result.delivered, 2);
    assert.equal(result.txHash, TX);
    assert.deepEqual(chain.sends, [{ to: ADDRESS.toLowerCase(), amount: 2 }]);
    assert.equal(lockRow(db).holder, null, 'send lock released');

    const ledger = await claims.getUserFaucetLedger(db, faucet, user('u1'), '2026-09-04');
    assert.equal(ledger.held, 0);
    assert.equal(ledger.delivered, 2);
    assert.ok(ledger.claims.every((line) => line.status === 'delivered' && line.txHash === TX));

    const nothing = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.deepEqual([nothing.ok, nothing.reason], [false, 'nothing-held']);
  });
});

test('a failed or blocked send puts the drips back in the ledger', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const kv = new FakeKV();
    const env = { AUTH_DB: db, PC_RATES_KV: kv, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });
    const heldAgain = async () => (await claims.getUserFaucetLedger(db, faucet, user('u1'), '2026-09-04')).held;

    const broken = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain({ sendError: 'rpc-down' }) });
    assert.deepEqual([broken.ok, broken.reason], [false, 'delivery-failed']);
    assert.equal(await heldAgain(), 1);

    const dry = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain({ snapshot: { lowGas: true } }) });
    assert.deepEqual([dry.ok, dry.reason], [false, 'spigot-low-gas']);
    assert.equal(await heldAgain(), 1);

    const empty = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain({ snapshot: { tokenBalance: 0 } }) });
    assert.deepEqual([empty.ok, empty.reason], [false, 'spigot-empty']);
    assert.equal(await heldAgain(), 1);

    db.db.prepare('UPDATE faucet_locks SET holder = ?, acquired_at = ? WHERE faucet = ?')
      .run('someone-else', new Date().toISOString(), 'hello');
    const busy = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain() });
    assert.deepEqual([busy.ok, busy.reason], [false, 'delivery-busy']);
    assert.equal(await heldAgain(), 1, 'a lost lock puts the rows straight back');
    assert.equal(lockRow(db).holder, 'someone-else', 'the other holder keeps its lock');
    db.db.prepare('UPDATE faucet_locks SET holder = NULL, acquired_at = NULL WHERE faucet = ?').run('hello');

    const bad = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: 'tz1notethereum', chainFactory: async () => fakeChain() });
    assert.deepEqual([bad.ok, bad.reason], [false, 'address-required']);

    const unconfigured = await claims.deliverHeldFaucetDrips({ env: { AUTH_DB: db }, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain() });
    assert.deepEqual([unconfigured.ok, unconfigured.reason], [false, 'spigot-not-configured']);
    assert.equal(await heldAgain(), 1);
  });
});

test('the spigot key is only accepted when it looks like a private key', async () => {
  await withModules(async ({ claims, lib }) => {
    const faucet = lib.getFaucet('hello');
    assert.equal(claims.spigotConfigured({ HELLO_FAUCET_SECRET_KEY: SECRET }, faucet), true);
    assert.equal(claims.spigotConfigured({ HELLO_FAUCET_SECRET_KEY: 'edsk-not-ethereum' }, faucet), false);
    assert.equal(claims.spigotConfigured({}, faucet), false);
    assert.equal(lib.getFaucet('HELLO')?.slug, 'hello');
    assert.equal(lib.getFaucet('apizza'), null);
    assert.equal(lib.isEvmAddress(ADDRESS), true);
    assert.equal(lib.isEvmAddress('0x123'), false);
  });
});

test('the deliver endpoint refuses unknown faucets and unauthenticated callers', async () => {
  await withModules(async ({ deliver }) => {
    const missing = await deliver.handleFaucetDelivery(new Request('https://pointcast.xyz/api/faucet/nope/deliver', { method: 'POST' }), { AUTH_DB: await freshDb(), USERS: new FakeKV() }, 'nope');
    assert.equal(missing.status, 404);
    const anon = await deliver.handleFaucetDelivery(new Request('https://pointcast.xyz/api/faucet/hello/deliver', { method: 'POST' }), { AUTH_DB: await freshDb(), USERS: new FakeKV() }, 'hello');
    assert.equal(anon.status, 401);
  });
});

test('a broadcast that the ledger fails to record is never returned to held', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });

    // The send lands; the write that marks it delivered does not.
    const chain = fakeChain();
    db.failOn = (sql) => sql.includes("SET status = 'delivered'");
    const result = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    db.failOn = null;

    assert.deepEqual(chain.sends, [{ to: ADDRESS.toLowerCase(), amount: 1 }], 'the tokens did leave the wallet');
    assert.equal(result.ok, true, 'a broadcast is a success even when the ledger write is lost');
    assert.equal(result.txHash, TX, 'the caller still gets the receipt');
    assert.deepEqual(statuses(db), ['submitting'], 'the row stays mid-flight, never back to held');

    // The whole point: the retry must not send a second time.
    const retry = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.deepEqual([retry.ok, retry.reason], [false, 'delivery-busy']);
    assert.equal(chain.sends.length, 1, 'no second send');
    assert.equal(lockRow(db).holder, null, 'send lock released');
  });
});

test('a stale submitting row is reclaimed, a fresh one is left alone', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    const setSubmittedAt = (iso) => db.db
      .prepare("UPDATE faucet_claims SET status = 'submitting', delivered_to = ?, delivered_at = ? WHERE id = ?")
      .run(ADDRESS.toLowerCase(), iso, 'fct_stuck');
    db.db.prepare(`INSERT INTO faucet_claims (id, user_id, faucet, day, amount, status, tx_hash, delivered_to, created_at, delivered_at)
      VALUES (?, ?, ?, ?, 1, 'held', NULL, NULL, ?, NULL)`).run('fct_stuck', 'u1', 'hello', '2026-09-01', '2026-09-01T00:00:00Z');

    setSubmittedAt(new Date().toISOString());
    const fresh = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain() });
    assert.deepEqual([fresh.ok, fresh.reason], [false, 'delivery-busy']);
    assert.deepEqual(statuses(db), ['submitting'], 'a send that may still be in flight is left where it is');

    setSubmittedAt(new Date(Date.now() - 40 * 60_000).toISOString());
    const chain = fakeChain();
    const stale = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.equal(stale.ok, true);
    assert.deepEqual(chain.sends, [{ to: ADDRESS.toLowerCase(), amount: 1 }]);
    assert.deepEqual(statuses(db), ['delivered']);
  });
});

test('delivery refuses addresses that would burn the drips', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });
    const send = async (deliveredTo, overrides) => claims.deliverHeldFaucetDrips({
      env, userId: 'u1', faucet, deliveredTo, chainFactory: async () => fakeChain(overrides),
    });

    // The same address as ADDRESS with one letter's case flipped: still hex, no longer EIP-55.
    assert.equal((await send('0x000000000000000000000000000000000000DEaD')).reason, 'address-required', 'a mixed-case typo fails EIP-55');
    assert.equal((await send(`0x${'0'.repeat(40)}`)).reason, 'address-required', 'the zero address');
    assert.equal((await send(faucet.contract)).reason, 'address-required', 'the token contract itself');
    assert.equal((await send('0x1111111111111111111111111111111111111111')).reason, 'address-required', 'the spigot itself');
    assert.deepEqual(statuses(db), ['held'], 'every refusal leaves the drip owed');

    // All-lowercase carries no checksum, so it is taken at its word.
    const ok = await send(ADDRESS.toLowerCase());
    assert.equal(ok.ok, true);
  });
});

test('an unreachable spigot is reported as unavailable, not as unfunded', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });
    const down = await claims.deliverHeldFaucetDrips({
      env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain({ snapshotError: 'HTTP request failed' }),
    });
    assert.deepEqual([down.ok, down.reason], [false, 'spigot-unavailable']);
    assert.deepEqual(statuses(db), ['held']);
    assert.equal(lockRow(db).holder, null, 'send lock released');
  });
});

test('the claim endpoint answers 404, 401, 200 and 409', async () => {
  await withModules(async ({ claim }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, USERS: new FakeKV() };
    const url = 'https://pointcast.xyz/api/faucet/hello/claim';

    const unknown = await claim.handleFaucetClaim(new Request(url, { method: 'POST' }), env, 'nope');
    assert.equal(unknown.status, 404);
    const anon = await claim.handleFaucetClaim(new Request(url, { method: 'POST' }), env, 'hello');
    assert.equal(anon.status, 401);

    const first = await claim.handleFaucetClaim(signedIn(url, { method: 'POST' }), env, 'hello');
    assert.equal(first.status, 200);
    const firstBody = await first.json();
    assert.equal(firstBody.ok, true);
    assert.equal(firstBody.claim.status, 'held');

    const again = await claim.handleFaucetClaim(signedIn(url, { method: 'POST' }), env, 'hello');
    assert.equal(again.status, 409);
    assert.equal((await again.json()).reason, 'already-claimed');
  });
});

test('the deliver endpoint carries a signed-in send, a bad address and a dead spigot', async () => {
  await withModules(async ({ claims, deliver, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, USERS: new FakeKV(), HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });
    const url = 'https://pointcast.xyz/api/faucet/hello/deliver';
    const post = (address, chainFactory) => deliver.handleFaucetDelivery(
      signedIn(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }) }),
      env,
      'hello',
      { chainFactory },
    );

    const bad = await post('not-an-address', async () => fakeChain());
    assert.equal(bad.status, 400);
    assert.equal((await bad.json()).reason, 'address-required');

    const down = await post(ADDRESS, async () => fakeChain({ snapshotError: 'fetch failed' }));
    assert.equal(down.status, 503);
    assert.equal((await down.json()).reason, 'spigot-unavailable');

    const chain = fakeChain();
    const sent = await post(ADDRESS, async () => chain);
    assert.equal(sent.status, 200);
    const body = await sent.json();
    assert.deepEqual([body.ok, body.delivered, body.txHash], [true, 1, TX]);
    assert.deepEqual(chain.sends, [{ to: ADDRESS.toLowerCase(), amount: 1 }]);

    const empty = await post(ADDRESS, async () => chain);
    assert.equal(empty.status, 409);
    assert.equal((await empty.json()).reason, 'nothing-held');
  });
});

test('the daily cap clamps whatever the environment says', async () => {
  await withModules(async ({ lib }) => {
    assert.equal(lib.faucetDailyCap(undefined), 50);
    assert.equal(lib.faucetDailyCap(''), 50);
    assert.equal(lib.faucetDailyCap('0'), 50);
    assert.equal(lib.faucetDailyCap('-1'), 50);
    assert.equal(lib.faucetDailyCap('abc'), 50);
    assert.equal(lib.faucetDailyCap('1.5'), 50);
    assert.equal(lib.faucetDailyCap('12'), 12);
    assert.equal(lib.faucetDailyCap('9999'), 500);
  });
});

test('the ledger provisions its own tables when the migration has not been applied', async () => {
  await withModules(async ({ claims, lib }) => {
    const init = await readFile(new URL('migrations/auth/0001_init.sql', root), 'utf8');
    const db = new FakeD1([init]);
    db.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)')
      .run('u1', JSON.stringify({ userId: 'u1', preferredName: 'Mike', identities: [] }), '2026-09-04T00:00:00Z');
    const faucet = lib.getFaucet('hello');
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const first = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });
    assert.equal(first.ok, true);
    const result = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain() });
    assert.equal(result.ok, true);
    assert.equal(lockRow(db).holder, null);
    const tables = db.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'faucet_%' ORDER BY name").all().map((r) => r.name);
    assert.deepEqual(tables, ['faucet_claims', 'faucet_locks']);
  });
});
