import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { createServer } from 'vite';

import { decodeBase64Json, encodeBase64Json } from '../src/lib/x402.ts';

const PAYER = '0x2222222222222222222222222222222222222222';

async function load() {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const [oracle, lib] = await Promise.all([
    server.ssrLoadModule('/functions/api/agent/oracle.ts'),
    server.ssrLoadModule('/src/lib/paddle-oracle.ts'),
  ]);
  return { ...oracle, ...lib, close: () => server.close() };
}

function keypair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  return {
    sk: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
    pk: spki.subarray(spki.length - 32).toString('base64'),
  };
}

function payFor(terms, nonce) {
  const accepted = terms.accepts[0];
  const now = Math.floor(Date.now() / 1000);
  return encodeBase64Json({
    x402Version: 2, accepted, resource: terms.resource, extensions: terms.extensions,
    payload: {
      signature: `0x${'11'.repeat(65)}`,
      permit2Authorization: {
        from: PAYER, permitted: { token: accepted.asset, amount: accepted.amount },
        spender: '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E', nonce: String(nonce), deadline: String(now + 30),
        witness: { to: accepted.payTo, validAfter: String(now), extra: '0x' },
      },
    },
  });
}

// Minimal D1 covering the paid-intent + split statements the oracle path uses.
class DB {
  constructor() { this.intents = new Map(); this.splits = new Map(); }
  prepare(sql) {
    const db = this; const q = sql.replace(/\s+/gu, ' ').trim(); let a = [];
    return {
      bind(...args) { a = args; return this; },
      async first() {
        if (q.startsWith('UPDATE paid_action_intents') && q.includes('RETURNING id')) {
          const row = db.intents.get(a[1]);
          if (!row || !['created', 'settlement_failed'].includes(row.status)) return null;
          Object.assign(row, { status: 'settling', updated_at: a[0] }); return { id: row.id };
        }
        if (q.startsWith('SELECT action, amount_units')) return db.splits.get(a[0]) ?? null;
        if (q.startsWith('SELECT id, action, idempotency_key') && q.includes('WHERE id = ?')) return db.intents.get(a[0]) ?? null;
        if (q.startsWith('SELECT id, action, idempotency_key')) return [...db.intents.values()].find((r) => r.action === a[0] && r.idempotency_key === a[1]) ?? null;
        throw new Error(`first(): ${q}`);
      },
      async run() {
        if (q.startsWith('INSERT INTO paid_action_intents')) {
          const [id, action, key, hash, json, agentId, now] = a;
          if (![...db.intents.values()].some((r) => r.action === action && r.idempotency_key === key)) {
            db.intents.set(id, { id, action, idempotency_key: key, request_hash: hash, request_json: json, status: 'created', capacity_key: null, settlement_json: null, result_json: null, tx_hash: null, agent_id: agentId, error: null, created_at: now, updated_at: now });
          }
          return { meta: { changes: 1 } };
        }
        if (q.startsWith('UPDATE paid_action_intents')) {
          const row = db.intents.get(a[8]);
          if (row) Object.assign(row, { status: a[0], capacity_key: a[1] ?? row.capacity_key, settlement_json: a[2] ?? row.settlement_json, result_json: a[3] ?? row.result_json, tx_hash: a[4] ?? row.tx_hash, agent_id: a[5] ?? row.agent_id, error: a[6], updated_at: a[7] });
          return { meta: { changes: row ? 1 : 0 } };
        }
        if (q.startsWith('INSERT INTO splits')) {
          const [receipt_hash, action, amount_units, house_units, network_units, maker, maker_address, settled_at] = a;
          if (db.splits.has(receipt_hash)) return { meta: { changes: 0 } };
          db.splits.set(receipt_hash, { action, amount_units, house_units, network_units, maker, maker_address, settled_at });
          return { meta: { changes: 1 } };
        }
        throw new Error(`run(): ${q}`);
      },
    };
  }
}

const post = (body, headers = {}) => new Request('https://pointcast.xyz/api/agent/oracle', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
});

test('parseOracleQuery bounds input and requires a question or filter', async (t) => {
  const m = await load(); t.after(m.close);
  assert.match(m.parseOracleQuery({}), /ask something/);
  assert.match(m.parseOracleQuery({ q: 'x'.repeat(201) }), /200 characters/);
  assert.match(m.parseOracleQuery({ build: 'wood' }), /build must be/);
  assert.match(m.parseOracleQuery({ maxPrice: -4 }), /maxPrice/);
  assert.match(m.parseOracleQuery({ usap: 'yes' }), /usap/);
  assert.deepEqual(m.parseOracleQuery({ q: 'aurelius' }), { q: 'aurelius', maxPrice: null, build: null, thicknessMm: null, usap: null, year: null, limit: 3 });
});

test('answers are deterministic, filtered, and sourced', async (t) => {
  const m = await load(); t.after(m.close);
  const byName = m.answerOracle(m.parseOracleQuery({ q: 'Franklin Aurelius' }));
  assert.equal(byName.paddles[0].id, 'franklin-c45-aurelius');
  assert.ok(byName.paddles[0].sources.length > 0, 'every returned record carries sources');
  assert.deepEqual(m.answerOracle(m.parseOracleQuery({ q: 'Franklin Aurelius' })), byName);
  const cheap = m.answerOracle(m.parseOracleQuery({ maxPrice: 150, usap: true, limit: 5 }));
  for (const p of cheap.paddles) {
    assert.ok(p.listPriceUsd != null && p.listPriceUsd <= 150);
    assert.equal(p.status.usap, 'yes');
  }
  const none = m.answerOracle(m.parseOracleQuery({ q: 'zzzqqq nonexistent' }));
  assert.equal(none.matched, 0);
  assert.match(none.answer, /No paddle/);
  const q150 = m.parseOracleQuery({ maxPrice: 150 });
  assert.equal(m.previewOracle(q150).matched, m.answerOracle(q150).matched);
});

test('bare probes get a 402 quote; a paid question settles once and returns sourced records', async (t) => {
  const m = await load(); t.after(m.close);
  const kp = keypair();
  const db = new DB();
  const env = { AUTH_DB: db, X402_RECEIPT_SK: kp.sk, X402_MODE: 'test' };
  const opts = { expectedPublicKey: kp.pk };
  const realFetch = globalThis.fetch;
  let settles = 0;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'https://exp-faci.bubbletez.com/settle');
    settles += 1;
    return Response.json({ success: true, transaction: `0x${'ab'.repeat(32)}`, network: 'eip155:42793', payer: PAYER });
  };
  try {
    const bareGet = await m.handleOracleGet(new Request('https://pointcast.xyz/api/agent/oracle'), env, opts);
    assert.equal(bareGet.status, 402);
    const barePost = await m.handleAgentOracle(post(undefined), env, opts);
    assert.equal(barePost.status, 402);
    const emptyPost = await m.handleAgentOracle(post(''), env, opts);
    assert.equal(emptyPost.status, 402);
    assert.equal((await m.handleAgentOracle(post('{nope'), env, opts)).status, 400);

    const body = { q: 'Franklin Aurelius' };
    const quote = await m.handleAgentOracle(post(body), env, opts);
    assert.equal(quote.status, 402);
    const terms = decodeBase64Json(quote.headers.get('Payment-Required'));
    assert.equal(terms.accepts[0].amount, '10000');

    const pay = payFor(terms, 7);
    const paid = await m.handleAgentOracle(post(body, { 'Payment-Signature': pay, 'Idempotency-Key': 'oracle-test-0001' }), env, opts);
    assert.equal(paid.status, 200);
    const json = await paid.json();
    assert.equal(json.oracle.paddles[0].id, 'franklin-c45-aurelius');
    assert.ok(json.receipt);
    assert.equal(json.split.action, 'oracle');
    assert.equal(json.split.maker, 'paddle-register');

    const again = await m.handleAgentOracle(post(body, { 'Payment-Signature': pay, 'Idempotency-Key': 'oracle-test-0001' }), env, opts);
    assert.equal(again.status, 200);
    assert.equal((await again.json()).oracle.paddles[0].id, 'franklin-c45-aurelius');
    assert.equal(settles, 1, 'idempotent retry never settles twice');
    assert.equal(db.splits.size, 1);

    const bad = await m.handleAgentOracle(post({ build: 'wood' }, { 'Payment-Signature': pay, 'Idempotency-Key': 'oracle-test-0002' }), env, opts);
    assert.equal(bad.status, 400);
    assert.equal(settles, 1, 'invalid questions are refused before settlement');

    const preview = await m.handleOracleGet(new Request('https://pointcast.xyz/api/agent/oracle?preview=1&maxPrice=150'), env, opts);
    assert.equal(preview.status, 200);
    const pj = await preview.json();
    assert.equal(typeof pj.matched, 'number');
    assert.equal(pj.paddles, undefined, 'free preview never returns records');
  } finally {
    globalThis.fetch = realFetch;
  }
});
