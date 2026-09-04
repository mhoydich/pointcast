import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

import { decodeBase64Json, encodeBase64Json } from '../src/lib/x402.ts';

const root = new URL('../', import.meta.url);
const PAYER = '0x1111111111111111111111111111111111111111';
const TEZOS_RECIPIENT = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
const OP_HASH = `o${'1'.repeat(50)}`;

async function loadModules() {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const [bench, cast, claim, till, actions] = await Promise.all([
    server.ssrLoadModule('/functions/api/agent/bench.ts'),
    server.ssrLoadModule('/functions/api/agent/cast.ts'),
    server.ssrLoadModule('/functions/api/agent/claim.ts'),
    server.ssrLoadModule('/functions/till.json.ts'),
    server.ssrLoadModule('/functions/api/actions/[id].ts'),
  ]);
  return {
    handleAgentBench: bench.handleAgentBench,
    handleAgentCast: cast.handleAgentCast,
    handleAgentClaim: claim.handleAgentClaim,
    getProjectSafeBalance: till.getProjectSafeBalance,
    handleTillJson: till.handleTillJson,
    handleActionStatus: actions.onRequestGet,
    close: () => server.close(),
  };
}

function testKeypair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const pkcs8 = privateKey.export({ type: 'pkcs8', format: 'der' });
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  return {
    privateKeyBase64: pkcs8.toString('base64'),
    publicKeyBase64: spki.subarray(spki.length - 32).toString('base64'),
  };
}

function actionRequest(path, body, payment, idempotencyKey = `test-${path.replaceAll('/', '-')}`) {
  return new Request(`https://pointcast.xyz${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(payment ? { 'Payment-Signature': payment } : {}),
      ...(payment ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  });
}

function paymentFor(accepted, nonce) {
  const now = Math.floor(Date.now() / 1000);
  return encodeBase64Json({
    x402Version: 2,
    scheme: 'exact',
    network: accepted.network,
    accepted,
    payload: {
      signature: `0x${'11'.repeat(65)}`,
      permit2Authorization: {
        from: PAYER,
        permitted: { token: accepted.asset, amount: accepted.amount },
        spender: '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E',
        nonce: String(nonce),
        deadline: String(now + 30),
        witness: { to: accepted.payTo, validAfter: String(now), extra: '0x' },
      },
    },
  });
}

class FakeKV {
  constructor() { this.values = new Map(); }
  async get(key, type) {
    const value = this.values.get(key) ?? null;
    return type === 'json' && value !== null ? JSON.parse(value) : value;
  }
  async put(key, value) { this.values.set(key, value); }
}

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/gu, ' ').trim();
    this.args = [];
  }

  bind(...args) { this.args = args; return this; }

  async first() {
    const { db, sql, args } = this;
    if (sql.startsWith('UPDATE paid_action_intents') && sql.includes('RETURNING id')) {
      const row = db.intents.get(args[1]);
      if (!row || !['created', 'settlement_failed'].includes(row.status)) return null;
      Object.assign(row, { status: 'settling', error: null, updated_at: args[0] });
      return { id: row.id };
    }
    if (sql.startsWith('DELETE FROM claims') && sql.includes('RETURNING id')) {
      const row = db.claims.get(args[0]);
      const job = db.claimJobs.get(args[0]);
      if (!row || row.status !== 'failed' || job?.state !== 'reserved' || job.operation_id) return null;
      db.claims.delete(args[0]);
      db.claimJobs.delete(args[0]);
      return { id: args[0] };
    }
    if (sql.startsWith('SELECT action, amount_units')) return db.splits.get(args[0]) ?? null;
    if (sql.startsWith('SELECT id, action, idempotency_key') && sql.includes('WHERE id = ?')) {
      return db.intents.get(args[0]) ?? null;
    }
    if (sql.startsWith('SELECT id, action, idempotency_key') && sql.includes('WHERE action = ?')) {
      return [...db.intents.values()].find((row) => row.action === args[0] && row.idempotency_key === args[1]) ?? null;
    }
    if (sql.startsWith('SELECT status, created_at FROM claims')) {
      const row = db.claimFor(args[0], Number(args[1]));
      return row ? { status: row.status, created_at: row.created_at } : null;
    }
    if (sql.startsWith('SELECT COUNT(*) AS count FROM claims')) {
      return { count: [...db.claims.values()].filter((row) => row.token_id === Number(args[0])).length };
    }
    if (sql.startsWith('SELECT id, user_id, token_id, status') && sql.includes('user_id = ? AND token_id = ?')) {
      return db.claimFor(args[0], Number(args[1]));
    }
    if (sql.startsWith('SELECT j.claim_id, j.state')) {
      const job = db.claimJobs.get(args[0]);
      if (!job) return null;
      const operation = job.operation_id ? db.chainOperations.get(job.operation_id) : null;
      return { ...job, op_hash: operation?.op_hash ?? null };
    }
    if (sql.startsWith('INSERT INTO kennel_signer_locks') && sql.includes('RETURNING holder')) {
      const current = db.signerLocks.get(args[0]);
      if (current && current.expires_at > args[3] && current.holder !== args[1]) return null;
      const row = { holder: args[1], expires_at: args[2] };
      db.signerLocks.set(args[0], row);
      return { holder: row.holder };
    }
    if (sql.startsWith('UPDATE claims SET op_hash = NULL')) return null;
    if (sql.startsWith('INSERT INTO claims') && sql.includes('RETURNING')) {
      const [id, userId, tokenId, createdAt, capTokenId, cap, duplicateUser, duplicateToken] = args;
      if (db.claimFor(duplicateUser, Number(duplicateToken))) return null;
      if ([...db.claims.values()].filter((row) => row.token_id === Number(capTokenId)).length >= Number(cap)) return null;
      const row = {
        id, user_id: userId, token_id: Number(tokenId), status: 'failed',
        op_hash: null, delivered_to: null, created_at: createdAt,
      };
      db.claims.set(id, row);
      return { ...row };
    }
    if (sql.startsWith('SELECT COUNT(*) AS count,') && sql.includes('FROM splits')) {
      const rows = [...db.splits.values()].filter((row) => !sql.includes('WHERE action = ?') || row.action === args[0]);
      return {
        count: rows.length,
        house_units: rows.reduce((sum, row) => sum + row.house_units, 0),
        network_units: rows.reduce((sum, row) => sum + row.network_units, 0),
      };
    }
    throw new Error(`Unsupported fake first(): ${sql}`);
  }

  async all() {
    const { db, sql } = this;
    if (sql.startsWith('SELECT action, COUNT(*) AS count')) {
      const groups = new Map();
      for (const row of db.splits.values()) {
        const current = groups.get(row.action) ?? { action: row.action, count: 0, house_units: 0, network_units: 0 };
        current.count += 1;
        current.house_units += row.house_units;
        current.network_units += row.network_units;
        groups.set(row.action, current);
      }
      return { results: [...groups.values()].sort((a, b) => a.action.localeCompare(b.action)) };
    }
    throw new Error(`Unsupported fake all(): ${sql}`);
  }

  async run() {
    const { db, sql, args } = this;
    if (sql.startsWith('INSERT INTO paid_action_intents')) {
      const existing = [...db.intents.values()].find((row) => row.action === args[1] && row.idempotency_key === args[2]);
      if (existing) return { success: true, meta: { changes: 0 } };
      db.intents.set(args[0], {
        id: args[0], action: args[1], idempotency_key: args[2], request_hash: args[3], request_json: args[4],
        status: 'created', capacity_key: null, settlement_json: null, result_json: null, error: null,
        created_at: args[5], updated_at: args[6],
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (sql.startsWith('UPDATE claims SET op_hash = ?, delivered_to = ?')) {
      const row = db.claims.get(args[2]);
      if (row) Object.assign(row, { op_hash: args[0], delivered_to: args[1] });
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }
    if (sql.startsWith('INSERT INTO kennel_claim_jobs')) {
      const current = db.claimJobs.get(args[0]);
      db.claimJobs.set(args[0], {
        claim_id: args[0], state: args[1], target_status: args[2], delivered_to: args[3],
        operation_id: current?.operation_id ?? null, error: args[4], updated_at: args[5],
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (sql.startsWith('UPDATE kennel_claim_jobs SET state = \'submitting\'')) {
      const job = db.claimJobs.get(args[3]);
      if (job) Object.assign(job, { state: 'submitting', target_status: args[0], delivered_to: args[1], error: null, updated_at: args[2] });
      return { success: true, meta: { changes: job ? 1 : 0 } };
    }
    if (sql.startsWith('INSERT INTO kennel_chain_operations')) {
      db.chainOperations.set(args[0], {
        id: args[0], action: args[1], subject_id: args[2], op_hash: args[3],
        status: 'submitted', error: null, submitted_at: args[4], updated_at: args[5],
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (sql.startsWith('UPDATE kennel_claim_jobs SET state = \'submitted\'')) {
      const job = db.claimJobs.get(args[2]);
      if (job) Object.assign(job, { state: 'submitted', operation_id: args[0], error: null, updated_at: args[1] });
      return { success: true, meta: { changes: job ? 1 : 0 } };
    }
    if (sql.startsWith('UPDATE kennel_claim_jobs SET state = \'confirmed\'')) {
      const job = db.claimJobs.get(args[1]);
      if (job) Object.assign(job, { state: 'confirmed', error: null, updated_at: args[0] });
      return { success: true, meta: { changes: job ? 1 : 0 } };
    }
    if (sql.startsWith('UPDATE kennel_chain_operations SET status =')) {
      const operation = db.chainOperations.get(args[3] ?? args[1]);
      if (operation) Object.assign(operation, {
        status: args.length === 4 ? args[0] : 'applied',
        error: args.length === 4 ? args[1] : null,
      });
      return { success: true, meta: { changes: operation ? 1 : 0 } };
    }
    if (sql.startsWith('UPDATE kennel_signer_locks SET holder = NULL')) {
      const lock = db.signerLocks.get(args[0]);
      if (lock?.holder === args[1]) db.signerLocks.delete(args[0]);
      return { success: true, meta: { changes: lock ? 1 : 0 } };
    }
    if (sql.startsWith('UPDATE paid_action_intents SET')) {
      if (sql.includes('capacity_key = NULL')) {
        const row = db.intents.get(args[1]);
        if (row) Object.assign(row, { capacity_key: null, updated_at: args[0] });
        return { success: true, meta: { changes: row ? 1 : 0 } };
      }
      const row = db.intents.get(args[6]);
      if (row) Object.assign(row, {
        status: args[0],
        capacity_key: args[1] ?? row.capacity_key,
        settlement_json: args[2] ?? row.settlement_json,
        result_json: args[3] ?? row.result_json,
        error: args[4],
        updated_at: args[5],
      });
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }
    if (sql.startsWith('INSERT INTO splits')) {
      const [receiptHash, action, amountUnits, houseUnits, networkUnits, maker, makerAddress, settledAt] = args;
      if (db.splits.has(receiptHash)) return { success: true, meta: { changes: 0 } };
      db.splits.set(receiptHash, {
        receipt_hash: receiptHash,
        action,
        amount_units: amountUnits,
        house_units: houseUnits,
        network_units: networkUnits,
        maker,
        maker_address: makerAddress,
        settled_at: settledAt,
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (sql.startsWith('INSERT INTO users')) {
      db.users.set(args[0], JSON.parse(args[1]));
      return { success: true, meta: { changes: 1 } };
    }
    if (sql.startsWith('UPDATE claims SET status = ?, op_hash = ?, delivered_to = ?')) {
      const row = db.claims.get(args[3]);
      if (row) Object.assign(row, { status: args[0], op_hash: args[1], delivered_to: args[2] });
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }
    throw new Error(`Unsupported fake run(): ${sql}`);
  }
}

class FakeD1 {
  constructor() {
    this.intents = new Map();
    this.splits = new Map();
    this.users = new Map();
    this.claims = new Map();
    this.claimJobs = new Map();
    this.chainOperations = new Map();
    this.signerLocks = new Map();
  }
  prepare(sql) { return new FakeStatement(this, sql); }
  claimFor(userId, tokenId) {
    const row = [...this.claims.values()].find((claim) => claim.user_id === userId && claim.token_id === tokenId);
    return row ? { ...row } : null;
  }
  async batch(statements) { return Promise.all(statements.map((statement) => statement.run())); }
}

class FakeClaimChain {
  constructor() {
    this.address = 'tz1Rugft6gx3ZtSj8BUQSUnHEPbbUqVy7qXf';
    this.mints = [];
  }
  async balanceMutez() { return 4_000_000; }
  async ensureRevealed() {}
  async operationStatus() { return 'applied'; }
  async mint(tokenId, deliveredTo) {
    this.mints.push({ tokenId, deliveredTo });
    return { opHash: OP_HASH };
  }
  async deliver() { throw new Error('not used'); }
}

async function termsFrom(response) {
  assert.equal(response.status, 402);
  return decodeBase64Json(response.headers.get('Payment-Required')).accepts[0];
}

test('three agent actions quote 0.01 USDC, settle through a fake facilitator, act, and write exact 50/50 rows', async (t) => {
  const modules = await loadModules();
  t.after(modules.close);
  const { handleAgentBench, handleAgentCast, handleAgentClaim } = modules;
  const pair = testKeypair();
  const db = new FakeD1();
  const visits = new FakeKV();
  const bursts = [];
  const presence = {
    idFromName(name) { assert.equal(name, 'global'); return 'global'; },
    get() {
      return {
        async fetch(request) {
          const body = await request.json();
          bursts.push(body);
          return Response.json({ ok: true, burst: body });
        },
      };
    },
  };
  const env = {
    AUTH_DB: db,
    VISITS: visits,
    PRESENCE: presence,
    KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake',
    X402_RECEIPT_SK: pair.privateKeyBase64,
    X402_MODE: 'test',
  };

  const originalFetch = globalThis.fetch;
  let settlements = 0;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'https://exp-faci.bubbletez.com/settle');
    settlements += 1;
    if (settlements === 3) assert.equal(db.claims.size, 1, 'claim capacity is reserved before settlement');
    const byte = ['ab', 'cd', 'ef'][settlements - 1];
    return Response.json({ success: true, txHash: `0x${byte.repeat(32)}` });
  };
  try {
    const benchBody = { question: 'What should the town build next?' };
    const benchTerms = await termsFrom(await handleAgentBench(actionRequest('/api/agent/bench', benchBody), env, {
      expectedPublicKey: pair.publicKeyBase64,
    }));
    assert.equal(benchTerms.amount, '10000');
    const bench = await handleAgentBench(
      actionRequest('/api/agent/bench', benchBody, paymentFor(benchTerms, 1)),
      env,
      { expectedPublicKey: pair.publicKeyBase64 },
    );
    assert.equal(bench.status, 200);
    assert.equal((await bench.json()).bench.sit.answer, benchBody.question);
    assert.ok([...visits.values.keys()].some((key) => key.startsWith('bench:sit:')));
    const repeatedBench = await handleAgentBench(
      actionRequest('/api/agent/bench', benchBody, paymentFor(benchTerms, 1)),
      env,
      { expectedPublicKey: pair.publicKeyBase64 },
    );
    assert.equal(repeatedBench.status, 200);
    assert.equal((await repeatedBench.json()).bench.sit.answer, benchBody.question);
    assert.equal(settlements, 1, 'successful idempotent retry does not settle twice');

    const castBody = { word: 'confetti' };
    const castTerms = await termsFrom(await handleAgentCast(actionRequest('/api/agent/cast', castBody), env, {
      expectedPublicKey: pair.publicKeyBase64,
    }));
    const cast = await handleAgentCast(
      actionRequest('/api/agent/cast', castBody, paymentFor(castTerms, 2)),
      env,
      { expectedPublicKey: pair.publicKeyBase64 },
    );
    assert.equal(cast.status, 200);
    assert.equal(bursts[0].kind, 'cast');
    assert.equal(bursts[0].meta.spell, 'confetti');
    assert.equal(bursts[0].by.handle, '0x1111…1111');

    const chain = new FakeClaimChain();
    const claimBody = { to: TEZOS_RECIPIENT };
    const claimOptions = {
      expectedPublicKey: pair.publicKeyBase64,
      chainFactory: async () => chain,
      now: new Date('2026-09-03T19:00:00.000Z'),
    };
    const claimTerms = await termsFrom(await handleAgentClaim(actionRequest('/api/agent/claim', claimBody), env, claimOptions));
    const claim = await handleAgentClaim(
      actionRequest('/api/agent/claim', claimBody, paymentFor(claimTerms, 3)),
      env,
      claimOptions,
    );
    assert.equal(claim.status, 200);
    assert.deepEqual(chain.mints, [{ tokenId: 2, deliveredTo: TEZOS_RECIPIENT }]);

    assert.equal(settlements, 3);
    assert.equal(db.splits.size, 3);
    assert.deepEqual([...db.splits.values()].map(({ action, amount_units, house_units, network_units, maker, maker_address }) => ({
      action, amount_units, house_units, network_units, maker, maker_address,
    })), [
      { action: 'bench', amount_units: 10000, house_units: 5000, network_units: 5000, maker: 'town', maker_address: null },
      { action: 'cast', amount_units: 10000, house_units: 5000, network_units: 5000, maker: 'town', maker_address: null },
      { action: 'claim', amount_units: 10000, house_units: 5000, network_units: 5000, maker: 'town', maker_address: null },
    ]);

    const duplicate = await handleAgentClaim(actionRequest('/api/agent/claim', claimBody), env, claimOptions);
    assert.equal(duplicate.status, 409);
    assert.equal(settlements, 3, 'duplicate address is rejected before settlement');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ambiguous settlement is durable, queryable, and never submitted twice', async (t) => {
  const modules = await loadModules();
  t.after(modules.close);
  const pair = testKeypair();
  const db = new FakeD1();
  const env = {
    AUTH_DB: db,
    VISITS: new FakeKV(),
    X402_RECEIPT_SK: pair.privateKeyBase64,
    X402_MODE: 'test',
  };
  const body = { question: 'Will this settle exactly once?' };
  const terms = await termsFrom(await modules.handleAgentBench(
    actionRequest('/api/agent/bench', body),
    env,
    { expectedPublicKey: pair.publicKeyBase64 },
  ));
  const key = 'ambiguous-bench-0001';
  let settlements = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    settlements += 1;
    throw new Error('connection reset after submission');
  };
  try {
    const first = await modules.handleAgentBench(
      actionRequest('/api/agent/bench', body, paymentFor(terms, 80), key),
      env,
      { expectedPublicKey: pair.publicKeyBase64 },
    );
    assert.equal(first.status, 502);
    const actionId = first.headers.get('x-action-id');
    assert.match(actionId, /^pai_[0-9a-f]{32}$/u);
    assert.equal(db.intents.get(actionId).status, 'settlement_ambiguous');

    const retry = await modules.handleAgentBench(
      actionRequest('/api/agent/bench', body, paymentFor(terms, 80), key),
      env,
      { expectedPublicKey: pair.publicKeyBase64 },
    );
    assert.equal(retry.status, 202);
    assert.equal(settlements, 1);

    const status = await modules.handleActionStatus({ env, params: { id: actionId } });
    const statusBody = await status.json();
    assert.equal(statusBody.status, 'settlement_ambiguous');
    assert.equal(statusBody.ambiguous, true);
    assert.equal(statusBody.charged, 'unknown');
    assert.equal(statusBody.statusUrl, `/api/actions/${actionId}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('definitively refused paid claims release scarce capacity before retry', async (t) => {
  const modules = await loadModules();
  t.after(modules.close);
  const pair = testKeypair();
  const db = new FakeD1();
  const env = {
    AUTH_DB: db,
    KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake',
    X402_RECEIPT_SK: pair.privateKeyBase64,
    X402_MODE: 'test',
  };
  const body = { to: TEZOS_RECIPIENT };
  const options = {
    expectedPublicKey: pair.publicKeyBase64,
    chainFactory: async () => new FakeClaimChain(),
    now: new Date('2026-09-03T19:00:00.000Z'),
  };
  const terms = await termsFrom(await modules.handleAgentClaim(
    actionRequest('/api/agent/claim', body), env, options,
  ));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: false, reason: 'invalid-signature' });
  try {
    const response = await modules.handleAgentClaim(
      actionRequest('/api/agent/claim', body, paymentFor(terms, 83), 'refused-claim-0001'),
      env,
      options,
    );
    assert.equal(response.status, 402);
    assert.equal(db.claims.size, 0, 'definitive non-payment must release the claim row');
    const intent = db.intents.get(response.headers.get('x-action-id'));
    assert.equal(intent.status, 'settlement_failed');
    assert.equal(intent.capacity_key, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('settled action failures resume without a second charge and keys cannot change bodies', async (t) => {
  const modules = await loadModules();
  t.after(modules.close);
  const pair = testKeypair();
  const db = new FakeD1();
  let presenceCalls = 0;
  const presence = {
    idFromName() { return 'global'; },
    get() {
      return {
        async fetch(request) {
          presenceCalls += 1;
          if (presenceCalls === 1) throw new Error('room restart');
          return Response.json({ ok: true, burst: await request.json() });
        },
      };
    },
  };
  const env = { AUTH_DB: db, PRESENCE: presence, X402_RECEIPT_SK: pair.privateKeyBase64, X402_MODE: 'test' };
  const body = { word: 'confetti' };
  const terms = await termsFrom(await modules.handleAgentCast(
    actionRequest('/api/agent/cast', body), env, { expectedPublicKey: pair.publicKeyBase64 },
  ));
  let settlements = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    settlements += 1;
    return Response.json({ success: true, txHash: `0x${'98'.repeat(32)}` });
  };
  try {
    const key = 'resume-cast-0001';
    const first = await modules.handleAgentCast(
      actionRequest('/api/agent/cast', body, paymentFor(terms, 81), key), env,
      { expectedPublicKey: pair.publicKeyBase64 },
    );
    assert.equal(first.status, 502);
    assert.equal(db.intents.get(first.headers.get('x-action-id')).status, 'action_failed');

    const resumed = await modules.handleAgentCast(
      actionRequest('/api/agent/cast', body, paymentFor(terms, 81), key), env,
      { expectedPublicKey: pair.publicKeyBase64 },
    );
    assert.equal(resumed.status, 200);
    assert.equal(settlements, 1);
    assert.equal(presenceCalls, 2);

    const conflict = await modules.handleAgentCast(
      actionRequest('/api/agent/cast', { word: 'cat' }, paymentFor(terms, 81), key), env,
      { expectedPublicKey: pair.publicKeyBase64 },
    );
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).error, 'idempotency-key-conflict');

    const noKey = await modules.handleAgentCast(new Request('https://pointcast.xyz/api/agent/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Payment-Signature': paymentFor(terms, 82) },
      body: JSON.stringify(body),
    }), env, { expectedPublicKey: pair.publicKeyBase64 });
    assert.equal(noKey.status, 400);
    assert.equal(settlements, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('invalid action input and missing services refuse before a facilitator can be called', async (t) => {
  const modules = await loadModules();
  t.after(modules.close);
  const { handleAgentBench, handleAgentCast, handleAgentClaim } = modules;
  const pair = testKeypair();
  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { calls += 1; return Response.json({}); };
  try {
    const db = new FakeD1();
    assert.equal((await handleAgentBench(actionRequest('/api/agent/bench', { question: 'x'.repeat(281) }), { AUTH_DB: db, VISITS: new FakeKV() }, {
      expectedPublicKey: pair.publicKeyBase64,
    })).status, 400);
    assert.equal((await handleAgentCast(actionRequest('/api/agent/cast', { word: 'not-a-spell' }), { AUTH_DB: db }, {
      expectedPublicKey: pair.publicKeyBase64,
    })).status, 400);
    assert.equal((await handleAgentClaim(actionRequest('/api/agent/claim', { to: 'tz3bad' }), { AUTH_DB: db }, {
      expectedPublicKey: pair.publicKeyBase64,
    })).status, 400);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/till.json caches the TzKT balance for five minutes and reports split totals', async (t) => {
  const modules = await loadModules();
  t.after(modules.close);
  const { getProjectSafeBalance, handleTillJson } = modules;
  const db = new FakeD1();
  for (const [index, action] of ['bench', 'cast'].entries()) {
    db.splits.set(String(index).padStart(64, '0'), {
      action, amount_units: 10000, house_units: 5000, network_units: 5000,
      maker: 'town', maker_address: null, settled_at: '2026-09-03T19:00:00.000Z',
    });
  }
  let fetches = 0;
  let cached;
  const cache = {
    async match() { return cached?.clone(); },
    async put(_request, response) { cached = response.clone(); },
  };
  const fetcher = async () => {
    fetches += 1;
    return Response.json({ address: 'KT19Xcb8UuUUUaYTJ2Z7cdqYAhRaFi7UThwG', balance: 1_250_000 });
  };
  const first = await getProjectSafeBalance(fetcher, cache);
  const second = await getProjectSafeBalance(fetcher, cache);
  assert.equal(first.balanceTez, 1.25);
  assert.equal(second.cached, true);
  assert.equal(fetches, 1);

  const response = await handleTillJson({ AUTH_DB: db }, { fetcher, cache });
  const till = await response.json();
  assert.equal(till.safe.address, 'KT19Xcb8UuUUUaYTJ2Z7cdqYAhRaFi7UThwG');
  assert.equal(till.safe.balanceCacheSeconds, 300);
  assert.deepEqual(till.ledger.totals, { count: 2, houseUnits: 10000, networkUnits: 10000 });
  assert.match(till.ledger.note, /not moved cross-chain/u);
});

test('migrations, room twins, till, register, and agents discovery expose the paid-town contract', async () => {
  const [migration, intentsMigration, bench, spells, kennel, till, register, agents, decision] = await Promise.all([
    readFile(new URL('migrations/auth/0008_paid_town_splits.sql', root), 'utf8'),
    readFile(new URL('migrations/auth/0012_paid_action_intents.sql', root), 'utf8'),
    readFile(new URL('functions/bench.json.ts', root), 'utf8'),
    readFile(new URL('functions/spells.json.ts', root), 'utf8'),
    readFile(new URL('functions/kennel-club.json.ts', root), 'utf8'),
    readFile(new URL('src/pages/till.astro', root), 'utf8'),
    readFile(new URL('src/pages/register.astro', root), 'utf8'),
    readFile(new URL('src/pages/agents.json.ts', root), 'utf8'),
    readFile(new URL('docs/decisions/2026-09-03-paid-town-actions.md', root), 'utf8'),
  ]);
  for (const column of ['receipt_hash', 'action', 'amount_units', 'house_units', 'network_units', 'maker', 'maker_address', 'settled_at']) {
    assert.match(migration, new RegExp(column));
  }
  for (const column of ['idempotency_key', 'request_hash', 'status', 'capacity_key', 'settlement_json', 'result_json']) {
    assert.match(intentsMigration, new RegExp(column));
  }
  for (const source of [bench, spells, kennel]) {
    assert.match(source, /paid,/u);
    assert.match(source, /receipt/u);
  }
  assert.match(till, /PROJECT_SAFE_ADDRESS/u);
  assert.match(register, /paid town actions split 50\/50/u);
  assert.match(agents, /paidTownActions: PAID_TOWN_DISCOVERY/u);
  assert.match(decision, /does not bridge, swap, withdraw, or distribute funds/u);
});
