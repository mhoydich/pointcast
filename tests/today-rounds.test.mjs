import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);

async function withModules(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const [today, faucet, kennel, lib] = await Promise.all([
      server.ssrLoadModule('/functions/api/today.ts'),
      server.ssrLoadModule('/functions/api/faucet/_claims.ts'),
      server.ssrLoadModule('/src/lib/kennel-club.ts'),
      server.ssrLoadModule('/src/lib/faucet.ts'),
    ]);
    return await run({ today, faucet, kennel, lib });
  } finally {
    await server.close();
  }
}

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
  async batch(statements) { const out = []; for (const s of statements) out.push(await s.run()); return out; }
}

class FakeKV {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

async function freshDb() {
  const files = ['0001_init.sql', '0004_kennel_club_claims.sql', '0005_seal_receipts.sql', '0009_faucet_claims.sql'];
  const sql = await Promise.all(files.map((f) => readFile(new URL(`migrations/auth/${f}`, root), 'utf8')));
  const db = new FakeD1(sql);
  const user = { userId: 'u1', createdAt: '2026-09-04T00:00:00Z', identities: [], preferredName: 'Mike' };
  db.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)').run('u1', JSON.stringify(user), user.createdAt);
  db.db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run('tok1', 'u1', Date.now() + 86_400_000);
  return { db, user };
}

test('anonymous today lists five rounds with nothing tracked', async () => {
  await withModules(async ({ today }) => {
    const { db } = await freshDb();
    const payload = await today.readToday(new Request('https://pointcast.xyz/api/today'), { AUTH_DB: db, USERS: new FakeKV() });
    assert.equal(payload.ok, true);
    assert.equal(payload.signedIn, false);
    assert.deepEqual(payload.rounds.map((r) => r.id), ['dog', 'hello', 'bench', 'block', 'race']);
    assert.ok(payload.rounds.every((r) => r.done === null));
    assert.equal(payload.tracked, 0);
    assert.match(payload.date, /^\d{4}-\d{2}-\d{2}$/);
  });
});

test('a signed-in account sees its dog and HELLO rounds flip as it does them', async () => {
  await withModules(async ({ today, faucet, kennel, lib }) => {
    const { db, user } = await freshDb();
    const env = { AUTH_DB: db, USERS: new FakeKV() };
    const request = new Request('https://pointcast.xyz/api/today', { headers: { cookie: 'pc_session=tok1' } });

    const before = await today.readToday(request, env);
    assert.equal(before.signedIn, true);
    assert.equal(before.tracked, 2);
    assert.equal(before.done, 0);
    assert.deepEqual(before.rounds.filter((r) => r.done !== null).map((r) => r.done), [false, false]);

    const date = kennel.losAngelesDate();
    await faucet.claimFaucetDrip({ env, user, faucet: lib.getFaucet('hello'), day: date });
    const sitting = kennel.sittingOfTheDay(date);
    db.db.prepare('INSERT INTO claims (id, user_id, token_id, status, op_hash, delivered_to, created_at) VALUES (?, ?, ?, ?, NULL, NULL, ?)')
      .run('kcc_1', 'u1', sitting.tokenId, 'held', new Date().toISOString());

    const after = await today.readToday(request, env);
    assert.equal(after.done, 2);
    assert.equal(after.rounds.find((r) => r.id === 'dog').done, true);
    assert.equal(after.rounds.find((r) => r.id === 'hello').done, true);
    assert.equal(after.rounds.find((r) => r.id === 'dog').label, `Claim ${sitting.name}`);
  });
});

test('a delivered HELLO still counts as today’s round', async () => {
  await withModules(async ({ today, faucet, kennel, lib }) => {
    const { db, user } = await freshDb();
    const env = { AUTH_DB: db, USERS: new FakeKV() };
    const request = new Request('https://pointcast.xyz/api/today', { headers: { cookie: 'pc_session=tok1' } });
    const date = kennel.losAngelesDate();

    await faucet.claimFaucetDrip({ env, user, faucet: lib.getFaucet('hello'), day: date });
    db.db.prepare("UPDATE faucet_claims SET status = 'delivered', tx_hash = ?, delivered_to = ?, delivered_at = ? WHERE user_id = ?")
      .run(`0x${'a'.repeat(64)}`, '0x000000000000000000000000000000000000dead', new Date().toISOString(), 'u1');

    const payload = await today.readToday(request, env);
    assert.equal(payload.rounds.find((r) => r.id === 'hello').done, true, 'the drip was claimed today, wherever it now lives');
  });
});
