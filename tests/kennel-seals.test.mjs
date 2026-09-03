import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);
const WALLET_A = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
const WALLET_B = 'tz2CfwkUFqB9LYwhQ5zu6gH1hgbKYdNwmLQp';
const OP_HASH = `o${'1'.repeat(50)}`;

async function withWorker(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const worker = await server.ssrLoadModule('/workers/kennel-seals/src/index.ts');
    return await run(worker);
  } finally {
    await server.close();
  }
}

class FakeD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async all() {
    const { db, sql, args } = this;
    if (sql.startsWith('SELECT c.id AS claim_id')) {
      const rows = [];
      for (const claim of db.claims.values()) {
        if (!['held', 'delivered'].includes(claim.status) || claim.token_id > Number(args[0])) continue;
        const identities = db.identities.filter((identity) => identity.user_id === claim.user_id);
        const receipt = db.receipts.get(`${claim.id}:showed-up`) ?? null;
        for (const identity of identities.length ? identities : [null]) {
          rows.push({
            claim_id: claim.id,
            user_id: claim.user_id,
            token_id: claim.token_id,
            claim_status: claim.status,
            identity_provider: identity?.provider ?? null,
            identity_id: identity?.id ?? null,
            receipt_id: receipt?.id ?? null,
            receipt_status: receipt?.status ?? null,
            receipt_holder: receipt?.holder ?? null,
            receipt_op_hash: receipt?.op_hash ?? null,
          });
        }
      }
      return { results: rows.sort((a, b) => a.token_id - b.token_id || a.claim_id.localeCompare(b.claim_id)) };
    }
    if (sql.startsWith('SELECT status, COUNT(*) AS count')) {
      const counts = new Map();
      for (const receipt of db.receipts.values()) counts.set(receipt.status, (counts.get(receipt.status) ?? 0) + 1);
      return { results: [...counts].map(([status, count]) => ({ status, count })) };
    }
    throw new Error(`Unsupported fake D1 all(): ${sql}`);
  }

  async first() {
    const { db, sql, args } = this;
    if (sql.startsWith("UPDATE seal_receipts SET status = 'submitting'")) {
      const [holder, runId, updatedAt, claimId] = args;
      const receipt = db.receipts.get(`${claimId}:showed-up`);
      if (!receipt || !['pending', 'pending_wallet', 'failed'].includes(receipt.status)) return null;
      Object.assign(receipt, { status: 'submitting', holder, run_id: runId, error: null, updated_at: updatedAt });
      return { ...receipt };
    }
    throw new Error(`Unsupported fake D1 first(): ${sql}`);
  }

  async run() {
    const { db, sql, args } = this;
    if (sql.startsWith('INSERT INTO seal_receipts')) {
      const [id, claimId, userId, tokenId, evidence, status, holder, createdAt, updatedAt] = args;
      const key = `${claimId}:showed-up`;
      const current = db.receipts.get(key);
      if (!current) {
        db.receipts.set(key, {
          id, claim_id: claimId, user_id: userId, token_id: Number(tokenId), kind: 'showed-up',
          evidence, status, holder, op_hash: null, run_id: null, error: null,
          created_at: createdAt, updated_at: updatedAt, attested_at: null,
        });
      } else {
        current.holder = holder ?? current.holder;
        current.evidence = evidence;
        if (!['submitting', 'submitted', 'attested'].includes(current.status)) current.status = holder ? 'pending' : 'pending_wallet';
        current.updated_at = updatedAt;
      }
      return { success: true, meta: { changes: 1 } };
    }
    if (sql.startsWith("UPDATE seal_receipts SET status = 'submitted'")) {
      const [opHash, updatedAt, id, runId] = args;
      const receipt = db.byId(id);
      if (receipt?.run_id === runId && receipt.status === 'submitting') Object.assign(receipt, { status: 'submitted', op_hash: opHash, updated_at: updatedAt });
      return { success: true, meta: { changes: receipt ? 1 : 0 } };
    }
    if (sql.startsWith("UPDATE seal_receipts SET status = 'attested'")) {
      const [opHash, updatedAt, attestedAt, id, runId] = args;
      const receipt = db.byId(id);
      if (receipt?.run_id === runId && ['submitting', 'submitted'].includes(receipt.status)) {
        Object.assign(receipt, { status: 'attested', op_hash: opHash, error: null, updated_at: updatedAt, attested_at: attestedAt });
      }
      return { success: true, meta: { changes: receipt ? 1 : 0 } };
    }
    if (sql.startsWith("UPDATE seal_receipts SET status = 'failed'")) {
      const [error, updatedAt, id, runId] = args;
      const receipt = db.byId(id);
      if (receipt?.run_id === runId && receipt.status === 'submitting') Object.assign(receipt, { status: 'failed', error, updated_at: updatedAt });
      return { success: true, meta: { changes: receipt ? 1 : 0 } };
    }
    throw new Error(`Unsupported fake D1 run(): ${sql}`);
  }
}

class FakeD1 {
  constructor() {
    this.claims = new Map();
    this.identities = [];
    this.receipts = new Map();
  }

  prepare(sql) { return new FakeD1Statement(this, sql); }
  async batch(statements) { return Promise.all(statements.map((statement) => statement.run())); }
  byId(id) { return [...this.receipts.values()].find((receipt) => receipt.id === id); }
  addClaim(id, userId, tokenId, status = 'delivered') {
    this.claims.set(id, { id, user_id: userId, token_id: tokenId, status });
  }
  link(userId, provider, id) { this.identities.push({ user_id: userId, provider, id }); }
}

class FakePresence {
  constructor() { this.requests = []; }
  async fetch(input, init) {
    this.requests.push({ input, init, body: JSON.parse(init.body) });
    return Response.json({ ok: true });
  }
}

class FakeTaquito {
  constructor(mode = 'success') {
    this.issuerAddress = 'tz1Rugft6gx3ZtSj8BUQSUnHEPbbUqVy7qXf';
    this.mode = mode;
    this.batches = [];
  }

  async attestBatch(attestations, onInjected) {
    this.batches.push(attestations);
    if (this.mode === 'before-injection') throw new Error('fake injection stopped');
    await onInjected(OP_HASH);
    if (this.mode === 'after-injection') throw new Error('fake confirmation stopped');
    return { opHash: OP_HASH };
  }
}

function env(db, presence = new FakePresence()) {
  return {
    AUTH_DB: db,
    PRESENCE_BUS: presence,
    SEAL_DRY_RUN: 'false',
    SEAL_RPC: 'https://mainnet.smartpy.io',
    SEAL_ISSUER_SECRET_KEY: 'unencrypted:fake',
  };
}

test('Los Angeles cron date, evidence bytes, and milestone helper are deterministic', async () => {
  await withWorker(({ sealDay, utf8Hex }) => {
    assert.deepEqual(sealDay(new Date('2026-09-03T07:15:00Z')), {
      day: '2026-09-02', sitting: 2, throughTokenId: 1,
    });
    assert.equal(utf8Hex('showed-up'), '73686f7765642d7570');
  });
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const { longestClaimedStreak, nextSealAt } = await server.ssrLoadModule('/src/lib/collect-desk.ts');
    assert.equal(longestClaimedStreak([1, 2, 4, 5, 6, 7, 8, 9, 10]), 7);
    assert.equal(nextSealAt([1, 2, 3, 4, 5, 6]), 7);
    assert.equal(nextSealAt([4, 5, 6, 7, 8, 9, 10]), 30);
    assert.equal(nextSealAt(Array.from({ length: 30 }, (_, index) => index + 1)), null);
  } finally {
    await server.close();
  }
});

test('one run batches eligible claims, records walletless claims, bursts once, and is idempotent', async () => {
  await withWorker(async ({ runKennelSeals }) => {
    const db = new FakeD1();
    db.addClaim('claim_delivered', 'user_a', 1, 'delivered');
    db.addClaim('claim_held_linked', 'user_b', 0, 'held');
    db.addClaim('claim_walletless', 'user_c', 1, 'held');
    db.link('user_a', 'kukai', WALLET_A);
    db.link('user_b', 'temple', WALLET_B);
    db.link('user_c', 'google', 'person@example.com');
    const presence = new FakePresence();
    const chain = new FakeTaquito();
    const first = await runKennelSeals(env(db, presence), {
      now: new Date('2026-09-03T07:15:00Z'),
      chainFactory: async () => chain,
    });

    assert.equal(first.ok, true);
    assert.equal(first.claims, 3);
    assert.equal(first.pendingWallet, 1);
    assert.equal(first.attested, 2);
    assert.equal(chain.batches.length, 1, 'all attests share one Taquito batch');
    assert.deepEqual(chain.batches[0].map(({ holder, kind, evidence }) => ({ holder, kind, evidence })), [
      { holder: WALLET_B, kind: 'showed-up', evidence: 'sitting:01 claim:claim_held_linked' },
      { holder: WALLET_A, kind: 'showed-up', evidence: 'sitting:02 claim:claim_delivered' },
    ]);
    assert.equal(db.receipts.get('claim_walletless:showed-up').status, 'pending_wallet');
    assert.equal(db.receipts.get('claim_delivered:showed-up').status, 'attested');
    assert.equal(presence.requests.length, 1);
    assert.equal(presence.requests[0].body.kind, 'seal');

    const secondChain = new FakeTaquito();
    const second = await runKennelSeals(env(db, presence), {
      now: new Date('2026-09-03T07:15:00Z'),
      chainFactory: async () => secondChain,
    });
    assert.equal(second.attempted, 0);
    assert.equal(secondChain.batches.length, 0);
    assert.equal(presence.requests.length, 1);

    db.link('user_c', 'kukai', WALLET_A);
    const deliveryChain = new FakeTaquito();
    const delivered = await runKennelSeals(env(db, presence), {
      now: new Date('2026-09-04T07:15:00Z'),
      chainFactory: async () => deliveryChain,
    });
    assert.equal(delivered.attested, 1, 'the next cron resolves seal pending wallet');
    assert.equal(deliveryChain.batches[0][0].holder, WALLET_A);
  });
});

test('dry run is read-only; failures before and after injection remain safely distinguishable', async () => {
  await withWorker(async ({ runKennelSeals }) => {
    const dryDb = new FakeD1();
    dryDb.addClaim('claim_dry', 'user_dry', 1);
    dryDb.link('user_dry', 'kukai', WALLET_A);
    const dry = await runKennelSeals(env(dryDb), {
      now: new Date('2026-09-03T07:15:00Z'), dryRun: true,
      chainFactory: async () => { throw new Error('dry run touched signer'); },
    });
    assert.equal(dry.attempted, 1);
    assert.equal(dryDb.receipts.size, 0);

    const failedDb = new FakeD1();
    failedDb.addClaim('claim_failed', 'user_failed', 1);
    failedDb.link('user_failed', 'kukai', WALLET_A);
    const failed = await runKennelSeals(env(failedDb), {
      now: new Date('2026-09-03T07:15:00Z'),
      chainFactory: async () => new FakeTaquito('before-injection'),
    });
    assert.equal(failed.reason, 'seal-batch-failed');
    assert.equal(failedDb.receipts.get('claim_failed:showed-up').status, 'failed');

    const submittedDb = new FakeD1();
    submittedDb.addClaim('claim_submitted', 'user_submitted', 1);
    submittedDb.link('user_submitted', 'kukai', WALLET_A);
    const submitted = await runKennelSeals(env(submittedDb), {
      now: new Date('2026-09-03T07:15:00Z'),
      chainFactory: async () => new FakeTaquito('after-injection'),
    });
    assert.equal(submitted.reason, 'seal-confirmation-pending');
    assert.equal(submittedDb.receipts.get('claim_submitted:showed-up').status, 'submitted');
    assert.equal(submittedDb.receipts.get('claim_submitted:showed-up').op_hash, OP_HASH);
    const retryChain = new FakeTaquito();
    const retry = await runKennelSeals(env(submittedDb), {
      now: new Date('2026-09-03T07:15:00Z'),
      chainFactory: async () => retryChain,
    });
    assert.equal(retry.attempted, 0);
    assert.equal(retryChain.batches.length, 0, 'an injected receipt is never submitted twice');
  });
});

test('migration, APIs, Worker config, presence bus, and immutable kind limitation are explicit', async () => {
  const [migration, config, worker, contract, gateway, presence, decision, collectApi, holdingsApi, collectPage, mePage] = await Promise.all([
    readFile(new URL('migrations/auth/0005_seal_receipts.sql', root), 'utf8'),
    readFile(new URL('workers/kennel-seals/wrangler.jsonc', root), 'utf8'),
    readFile(new URL('workers/kennel-seals/src/index.ts', root), 'utf8'),
    readFile(new URL('contracts/v2/seal_soulbound_fa2.py', root), 'utf8'),
    readFile(new URL('functions/api/burst.ts', root), 'utf8'),
    readFile(new URL('workers/presence/src/index.ts', root), 'utf8'),
    readFile(new URL('docs/decisions/2026-09-03-streak-seals.md', root), 'utf8'),
    readFile(new URL('functions/api/collect/me.ts', root), 'utf8'),
    readFile(new URL('functions/api/me/_holdings.ts', root), 'utf8'),
    readFile(new URL('src/pages/collect.astro', root), 'utf8'),
    readFile(new URL('src/pages/me.astro', root), 'utf8'),
  ]);
  assert.match(migration, /UNIQUE \(claim_id, kind\)/);
  assert.match(migration, /pending_wallet/);
  assert.match(config, /"15 7 \* \* \*"/);
  assert.doesNotMatch(config, /SEAL_ISSUER_SECRET_KEY/);
  assert.match(worker, /methodsObject\.attest!?\(\{/);
  assert.match(worker, /kind: utf8Hex\(attestation\.kind\)/);
  assert.match(worker, /const batch = tezos\.contract\.batch\(\)/);
  assert.match(gateway, /seal-worker-only/);
  assert.match(presence, /'seal'/);
  assert.doesNotMatch(contract, /def set_kind/);
  assert.match(decision, /UNKNOWN_SEAL_KIND/);
  assert.match(decision, /tz1UvNjifVKhP6Hm3ytVfWtmTiCxKozcYsSG/);
  for (const source of [collectApi, holdingsApi]) {
    assert.match(source, /streak:/);
    assert.match(source, /nextSealAt:/);
  }
  assert.match(collectPage, /data-next-seal/);
  assert.match(mePage, /seal pending wallet/);
});
