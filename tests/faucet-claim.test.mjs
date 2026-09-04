import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);
const SECRET = `0x${'1'.repeat(64)}`;
const ADDRESS = '0x000000000000000000000000000000000000dEaD';
const TX = `0x${'a'.repeat(64)}`;
const TX2 = `0x${'b'.repeat(64)}`;
const RAW = '0x02f8someraw';

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
  const signedTx = await readFile(new URL('migrations/auth/0010_faucet_signed_tx.sql', root), 'utf8');
  const db = new FakeD1([init, faucet, signedTx]);
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

const row = (db, id) => (id
  ? db.db.prepare('SELECT * FROM faucet_claims WHERE id = ?').get(id)
  : db.db.prepare('SELECT * FROM faucet_claims ORDER BY day ASC LIMIT 1').get());

const user = (userId) => ({ userId, createdAt: '2026-09-04T00:00:00Z', identities: [], preferredName: 'Mike' });

/**
 * The spigot, doubled. `prepares` and `broadcasts` record what was signed and
 * what went on the wire; `probe` answers whatever the test says the chain says.
 * The default probe is the honest one for a transaction just broadcast: the
 * node has it, nothing has mined yet.
 */
function fakeChain(overrides = {}) {
  const prepares = [];
  const broadcasts = [];
  const probes = [];
  let nonce = overrides.nonce ?? 7;
  const chain = {
    address: '0x1111111111111111111111111111111111111111',
    prepares,
    broadcasts,
    probes,
    probe_result: overrides.probe ?? { mined: false, known: true, nonceConsumed: false },
    async snapshot() {
      if (overrides.snapshotError) throw new Error(overrides.snapshotError);
      return { address: chain.address, tokenBalance: 1_000, ethBalance: '0.05', decimals: 18, lowGas: false, lowGasWarning: false, ...overrides.snapshot };
    },
    async prepare(to, amount) {
      if (overrides.prepareError) throw new Error(overrides.prepareError);
      const txHash = overrides.txHashes?.[prepares.length] ?? TX;
      prepares.push({ to, amount, nonce, txHash });
      return { nonce: nonce++, txHash, signedTx: `${RAW}${prepares.length}` };
    },
    async broadcast(signedTx) {
      broadcasts.push(signedTx);
      if (chain.broadcastError) throw new Error(chain.broadcastError);
      return prepares.at(-1)?.txHash ?? TX;
    },
    async probe(txHash, txNonce) {
      probes.push({ txHash, nonce: txNonce });
      if (chain.probeError) throw new Error(chain.probeError);
      return chain.probe_result;
    },
  };
  chain.broadcastError = overrides.broadcastError ?? null;
  chain.probeError = overrides.probeError ?? null;
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
    assert.deepEqual(chain.prepares.map((p) => [p.to, p.amount]), [[ADDRESS.toLowerCase(), 2]]);
    assert.equal(chain.broadcasts.length, 1);
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

    // A signing failure is the only send failure that can still go back: nothing
    // has been signed, so nothing can be in flight.
    const broken = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain({ prepareError: 'rpc-down' }) });
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

    assert.equal(chain.broadcasts.length, 1, 'the tokens did leave the wallet');
    assert.equal(result.ok, true, 'a broadcast is a success even when the ledger write is lost');
    assert.equal(result.txHash, TX, 'the caller still gets the receipt');
    assert.deepEqual(statuses(db), ['submitting'], 'the row stays mid-flight, never back to held');

    // The whole point: the retry must not send a second time.
    const retry = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.deepEqual([retry.ok, retry.reason], [false, 'delivery-busy']);
    assert.equal(chain.broadcasts.length, 1, 'no second send');
    assert.equal(lockRow(db).holder, null, 'send lock released');
    assert.equal(row(db).tx_hash, TX, 'the lost write left the hash on the row');

    // And the receipt the log was holding gets written by the next reconcile.
    chain.probe_result = { mined: true, known: true, nonceConsumed: true };
    const settled = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.deepEqual([settled.ok, settled.reason], [false, 'nothing-held']);
    assert.deepEqual(statuses(db), ['delivered']);
    assert.equal(chain.broadcasts.length, 1, 'still no second send');
  });
});

test('a broadcast that times out after the transaction landed is settled, not sent again', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });

    // The RPC never answered, but the chain has the transaction in a block.
    const chain = fakeChain({ broadcastError: 'timeout', probe: { mined: true, known: true, nonceConsumed: true } });
    const result = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });

    assert.deepEqual([result.ok, result.delivered, result.txHash], [true, 1, TX]);
    assert.deepEqual(statuses(db), ['delivered']);
    assert.equal(row(db).tx_hash, TX);
    assert.equal(chain.broadcasts.length, 1, 'one broadcast, whatever it threw');
    assert.equal(lockRow(db).holder, null, 'send lock released');
  });
});

test('a broadcast the chain cannot account for is quarantined, then settled by the next call', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });

    // Nobody has heard of it and the nonce is still free: it may or may not be
    // on its way. The one answer the desk must never give here is "held".
    const chain = fakeChain({ broadcastError: 'timeout', probe: { mined: false, known: false, nonceConsumed: false } });
    const first = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.deepEqual([first.ok, first.reason, first.txHash], [false, 'delivery-uncertain', TX]);
    assert.deepEqual(statuses(db), ['submitting']);
    assert.equal(row(db).tx_hash, TX, 'the hash is on the row, so the chain can be asked again');
    assert.equal(row(db).nonce, 7);
    assert.ok(row(db).signed_tx, 'the signed transaction is kept for a re-broadcast');

    // Ethereum caught up. The next call reconciles before it takes anything.
    chain.probe_result = { mined: true, known: true, nonceConsumed: true };
    const second = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.deepEqual([second.ok, second.reason], [false, 'nothing-held']);
    assert.deepEqual(statuses(db), ['delivered']);
    assert.equal(chain.prepares.length, 1, 'nothing was signed a second time');
    assert.equal(chain.broadcasts.length, 1, 'nothing was sent a second time');
  });
});

test('a transaction whose nonce was spent elsewhere is dead, and only then are the drips owed again', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });

    const chain = fakeChain({ broadcastError: 'timeout', probe: { mined: false, known: false, nonceConsumed: true } });
    const first = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.deepEqual([first.ok, first.reason], [false, 'delivery-failed']);
    assert.deepEqual(statuses(db), ['held'], 'that transaction can never mine, so the drip is owed');
    assert.equal(row(db).tx_hash, null, 'and it carries no dead hash');

    const next = fakeChain({ txHashes: [TX2] });
    const second = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => next });
    assert.deepEqual([second.ok, second.txHash], [true, TX2]);
    assert.equal(next.broadcasts.length, 1, 'exactly one broadcast on the new attempt');
    assert.deepEqual(statuses(db), ['delivered']);
  });
});

test('an old submitting row with a transaction on it is settled against the chain, never released on a timer', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    const stick = (iso) => {
      db.db.prepare('DELETE FROM faucet_claims').run();
      db.db.prepare(`INSERT INTO faucet_claims (id, user_id, faucet, day, amount, status, tx_hash, nonce, signed_tx, delivered_to, created_at, delivered_at)
        VALUES (?, ?, ?, ?, 1, 'submitting', ?, 7, ?, ?, ?, ?)`)
        .run('fct_stuck', 'u1', 'hello', '2026-09-01', TX, `${RAW}1`, ADDRESS.toLowerCase(), '2026-09-01T00:00:00Z', iso);
    };
    const longAgo = new Date(Date.now() - 40 * 60_000).toISOString();

    // Half an hour used to be enough to hand these back. It never was.
    stick(longAgo);
    const mined = fakeChain({ probe: { mined: true, known: true, nonceConsumed: true } });
    const settled = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => mined });
    assert.deepEqual([settled.ok, settled.reason], [false, 'nothing-held']);
    assert.deepEqual(statuses(db), ['delivered']);
    assert.equal(mined.broadcasts.length, 0, 'a mined transaction is not sent again');
    assert.equal(row(db).tx_hash, TX);

    // Still nobody has heard of it: re-broadcast the bytes we already signed.
    stick(longAgo);
    const lost = fakeChain({ probe: { mined: false, known: false, nonceConsumed: false } });
    const waiting = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => lost });
    assert.deepEqual([waiting.ok, waiting.reason], [false, 'delivery-busy']);
    assert.deepEqual(lost.broadcasts, [`${RAW}1`], 'the same signed transaction, not a new one');
    assert.equal(lost.prepares.length, 0, 'nothing new was signed');
    assert.deepEqual(statuses(db), ['submitting']);

    // A fresh one is left alone: too young to have stalled.
    stick(new Date().toISOString());
    const fresh = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => fakeChain({ probe: { mined: false, known: true, nonceConsumed: false } }) });
    assert.deepEqual([fresh.ok, fresh.reason], [false, 'delivery-busy']);
    assert.deepEqual(statuses(db), ['submitting']);
  });
});

test('an old submitting row with nothing signed for it is the one case a clock may reclaim', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    db.db.prepare(`INSERT INTO faucet_claims (id, user_id, faucet, day, amount, status, tx_hash, delivered_to, created_at, delivered_at)
      VALUES (?, ?, ?, ?, 1, 'submitting', NULL, ?, ?, ?)`)
      .run('fct_stuck', 'u1', 'hello', '2026-09-01', ADDRESS.toLowerCase(), '2026-09-01T00:00:00Z', new Date(Date.now() - 40 * 60_000).toISOString());

    const chain = fakeChain();
    const result = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    assert.equal(result.ok, true, 'the crashed take is owed again and goes out with this send');
    assert.equal(result.delivered, 1);
    assert.deepEqual(statuses(db), ['delivered']);
    assert.equal(chain.broadcasts.length, 1);
  });
});

test('a signature the ledger cannot record is released before anything is broadcast', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = { AUTH_DB: db, HELLO_FAUCET_SECRET_KEY: SECRET };
    const faucet = lib.getFaucet('hello');
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-04' });

    const chain = fakeChain();
    db.failOn = (sql) => sql.includes('SET tx_hash = ?');
    const result = await claims.deliverHeldFaucetDrips({ env, userId: 'u1', faucet, deliveredTo: ADDRESS, chainFactory: async () => chain });
    db.failOn = null;

    assert.deepEqual([result.ok, result.reason], [false, 'delivery-failed']);
    assert.equal(chain.broadcasts.length, 0, 'a row we could not name is a row we could never settle');
    assert.deepEqual(statuses(db), ['held']);
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
    assert.deepEqual(chain.prepares.map((p) => [p.to, p.amount]), [[ADDRESS.toLowerCase(), 1]]);

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

test('the sign-first columns are added to a faucet_claims table that predates them', async () => {
  await withModules(async ({ claims }) => {
    // Production's table was created by 0009 and CREATE TABLE IF NOT EXISTS
    // will never touch it, so the ALTERs have to carry the upgrade.
    const init = await readFile(new URL('migrations/auth/0001_init.sql', root), 'utf8');
    const faucet = await readFile(new URL('migrations/auth/0009_faucet_claims.sql', root), 'utf8');
    const db = new FakeD1([init, faucet]);
    const columns = () => db.db.prepare('PRAGMA table_info(faucet_claims)').all().map((c) => c.name);
    assert.equal(columns().includes('nonce'), false, 'not there before');

    await claims.ensureFaucetSchema(db);
    assert.ok(columns().includes('nonce'));
    assert.ok(columns().includes('signed_tx'));

    // And running again on a table that already has them is a no-op, not an error.
    const twice = new FakeD1([init, faucet, await readFile(new URL('migrations/auth/0010_faucet_signed_tx.sql', root), 'utf8')]);
    await claims.ensureFaucetSchema(twice);
    assert.equal(twice.db.prepare('PRAGMA table_info(faucet_claims)').all().filter((c) => c.name === 'nonce').length, 1);
  });
});
