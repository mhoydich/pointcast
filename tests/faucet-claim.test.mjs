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
    const [claims, lib, deliver] = await Promise.all([
      server.ssrLoadModule('/functions/api/faucet/_claims.ts'),
      server.ssrLoadModule('/src/lib/faucet.ts'),
      server.ssrLoadModule('/functions/api/faucet/[slug]/deliver.ts'),
    ]);
    return await run({ claims, lib, deliver });
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
    let args = [];
    const statement = {
      bind(...values) { args = values; return statement; },
      async first() { return db.prepare(sql).get(...args) ?? null; },
      async all() { return { results: db.prepare(sql).all(...args) }; },
      async run() { return db.prepare(sql).run(...args); },
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
  return db;
}

const user = (userId) => ({ userId, createdAt: '2026-09-04T00:00:00Z', identities: [], preferredName: 'Mike' });

function fakeChain(overrides = {}) {
  const sends = [];
  const chain = {
    address: '0x1111111111111111111111111111111111111111',
    sends,
    async snapshot() {
      return { address: chain.address, tokenBalance: 1_000, ethBalance: '0.05', decimals: 18, lowGas: false, ...overrides.snapshot };
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
    assert.equal(kv.values.size, 0, 'send lock released');

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

    await kv.put('faucet:hello:send-lock', '1');
    const busy = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain() });
    assert.deepEqual([busy.ok, busy.reason], [false, 'delivery-busy']);
    assert.equal(await heldAgain(), 1);
    await kv.delete('faucet:hello:send-lock');

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
