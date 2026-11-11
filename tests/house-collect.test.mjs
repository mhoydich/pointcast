import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const OP = (n) => `o${String(n).repeat(50).slice(0, 50)}`;
const NOW = new Date('2026-11-11T20:00:00Z');

async function withModule(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    return await run(await server.ssrLoadModule('/functions/api/house/_collect.ts'));
  } finally {
    await server.close();
  }
}

class FakeKV {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
}

class FakeLockDb {
  constructor() { this.holder = null; this.expiresAt = 0; }
  prepare(sql) {
    const db = this;
    return {
      bind(...args) {
        return {
          async first() {
            const [, holder, expiresAt, now] = args;
            if (db.holder === null || db.expiresAt <= now || db.holder === holder) {
              db.holder = holder; db.expiresAt = expiresAt;
              return { holder };
            }
            return null;
          },
          async run() {
            if (sql.includes('UPDATE') && db.holder === args[1]) { db.holder = null; db.expiresAt = 0; }
            return {};
          },
        };
      },
    };
  }
}

function fixture(overrides = {}) {
  const calls = [];
  const env = {
    AUTH_DB: new FakeLockDb(), PC_RATES_KV: new FakeKV(), KENNEL_CLUB_CLAIM_SECRET_KEY: 'edsk-test',
    ...overrides.env,
  };
  const chainFactory = async () => ({
    address: 'tz1UvNjifVKhP6Hm3ytVfWtmTiCxKozcYsSG',
    balanceMutez: async () => overrides.balance ?? 16_000_000,
    mintNoun: async (nounId) => {
      calls.push(nounId);
      if (overrides.fail) throw new Error('rpc');
      return { opHash: OP(calls.length) };
    },
  });
  return { env, chainFactory, calls };
}

test('mints once, records it, and replays the same ask without spending again', async () => {
  await withModule(async (m) => {
    const f = fixture();
    const ask = { env: f.env, chainFactory: f.chainFactory, now: NOW, agent: 'Duet <script>', nounId: 42, idempotencyKey: 'ask-0001-abcd' };
    const first = await m.houseCollect(ask);
    assert.equal(first.ok, true);
    assert.equal(first.replayed, false);
    assert.equal(first.record.nounId, 42);
    assert.equal(first.record.agent, 'Duet script');
    assert.equal(first.usedToday, 1);
    const second = await m.houseCollect(ask);
    assert.equal(second.replayed, true);
    assert.equal(second.record.opHash, first.record.opHash);
    assert.deepEqual(f.calls, [42]);
    assert.equal(f.env.AUTH_DB.holder, null);
    const status = await m.houseCollectStatus(f.env, NOW);
    assert.equal(status.usedToday, 1);
    assert.equal(status.recent.length, 1);
  });
});

test('stops at the daily cap and counts failed attempts against it', async () => {
  await withModule(async (m) => {
    const f = fixture({ fail: true });
    for (let i = 0; i < 3; i += 1) {
      const r = await m.houseCollect({ env: f.env, chainFactory: f.chainFactory, now: NOW, idempotencyKey: `ask-fail-000${i}` });
      assert.equal(r.reason, 'mint-failed');
    }
    const capped = await m.houseCollect({ env: f.env, chainFactory: f.chainFactory, now: NOW, idempotencyKey: 'ask-fail-0004' });
    assert.equal(capped.status, 429);
    assert.equal(capped.reason, 'daily-cap-reached');
    assert.equal(f.calls.length, 3);
  });
});

test('refuses below the balance floor without counting an attempt', async () => {
  await withModule(async (m) => {
    const f = fixture({ balance: 2_999_999 });
    const r = await m.houseCollect({ env: f.env, chainFactory: f.chainFactory, now: NOW, idempotencyKey: 'ask-low-0001' });
    assert.equal(r.reason, 'house-wallet-low-balance');
    assert.equal(f.calls.length, 0);
    assert.equal((await m.houseCollectStatus(f.env, NOW)).usedToday, 0);
  });
});

test('validates input, configuration and the shared signer lock', async () => {
  await withModule(async (m) => {
    const f = fixture();
    const base = { env: f.env, chainFactory: f.chainFactory, now: NOW };
    assert.equal((await m.houseCollect({ ...base, nounId: 1200, idempotencyKey: 'ask-bad-0001' })).reason, 'invalid-noun-id');
    assert.equal((await m.houseCollect({ ...base, nounId: 1.5, idempotencyKey: 'ask-bad-0002' })).reason, 'invalid-noun-id');
    assert.equal((await m.houseCollect({ ...base, idempotencyKey: 'short' })).reason, 'idempotency-key-required');
    assert.equal((await m.houseCollect({ ...base, env: { ...f.env, KENNEL_CLUB_CLAIM_SECRET_KEY: ' ' }, idempotencyKey: 'ask-cfg-0001' })).reason, 'house-wallet-not-configured');
    f.env.AUTH_DB.holder = 'kennel-claim:someone'; f.env.AUTH_DB.expiresAt = NOW.getTime() + 60_000;
    const busy = await m.houseCollect({ ...base, idempotencyKey: 'ask-busy-0001' });
    assert.equal(busy.status, 409);
    assert.equal(busy.reason, 'signer-busy');
    assert.equal(f.calls.length, 0);
    assert.equal(m.houseCollectDailyCap('500'), 20);
    assert.equal(m.houseCollectDailyCap(undefined), 3);
    assert.equal(m.houseCollectDay(new Date('2026-11-12T07:30:00Z')), '2026-11-11');
  });
});
