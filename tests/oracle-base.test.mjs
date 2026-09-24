import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const PAYER = '0x3333333333333333333333333333333333333333';
const PAY_TO = '0x48E8479b4906D45fBE702a18ac2454f800238B37';
const TX = `0x${'cd'.repeat(32)}`;

async function load() {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const mod = await server.ssrLoadModule('/functions/api/oracle/paddles.ts');
  return { ...mod, close: () => server.close() };
}

// D1 double covering the statements this route issues.
class DB {
  constructor() { this.rows = new Map(); this.splits = new Map(); }
  prepare(sql) {
    const db = this; const q = sql.replace(/\s+/gu, ' ').trim(); let a = [];
    const k = (action, key) => `${action}|${key}`;
    return {
      bind(...args) { a = args; return this; },
      async first() {
        if (q.startsWith('SELECT status, request_hash, result_json')) return db.rows.get(k(a[0], a[1])) ?? null;
        if (q.startsWith("UPDATE paid_action_intents SET status = 'settling'")) {
          const row = db.rows.get(k(a[2], a[3]));
          if (!row || !['created', 'settlement_failed'].includes(row.status)) return null;
          Object.assign(row, { status: 'settling', result_json: a[0], updated_at: a[1] }); return { id: row.id };
        }
        throw new Error(`first(): ${q}`);
      },
      async run() {
        if (q.startsWith('INSERT INTO paid_action_intents')) {
          const [id, action, key, requestHash, , result, now] = a;
          if (!db.rows.has(k(action, key))) db.rows.set(k(action, key), { id, status: 'created', request_hash: requestHash, result_json: result, tx_hash: null, updated_at: now });
          return { meta: { changes: 1 } };
        }
        if (q.startsWith('UPDATE paid_action_intents SET status = ?')) {
          const [status, result, tx, error, now, action, key, ...from] = a;
          const row = db.rows.get(k(action, key));
          if (row && (!from.length || from.includes(row.status))) Object.assign(row, { status, result_json: result ?? row.result_json, tx_hash: tx ?? row.tx_hash, error, updated_at: now });
          return { meta: { changes: row ? 1 : 0 } };
        }
        if (q.startsWith('INSERT INTO splits')) {
          if (!db.splits.has(a[0])) db.splits.set(a[0], { amount: a[1], house: a[2], network: a[3] });
          return { meta: { changes: 1 } };
        }
        throw new Error(`run(): ${q}`);
      },
    };
  }
}

function fakeFacilitator(state) {
  return {
    async getSupported() {
      return { kinds: [{ x402Version: 2, scheme: 'exact', network: 'eip155:8453' }], extensions: ['bazaar'], signers: {} };
    },
    async verify() { state.verifies += 1; return { isValid: true, payer: PAYER }; },
    async settle(payload) {
      state.settles += 1;
      state.lastSettlePayload = payload;
      if (state.settleThrows) throw new Error('timeout');
      return { success: true, transaction: TX, network: 'eip155:8453', payer: PAYER };
    },
  };
}

function paymentFor(terms, nonceByte = 'aa', to = PAY_TO) {
  const accepted = terms.accepts[0];
  const now = Math.floor(Date.now() / 1000);
  return Buffer.from(JSON.stringify({
    x402Version: 2, accepted, resource: terms.resource, extensions: terms.extensions,
    payload: {
      signature: `0x${'22'.repeat(65)}`,
      authorization: { from: PAYER, to, value: accepted.amount, validAfter: String(now - 5), validBefore: String(now + 60), nonce: `0x${nonceByte.repeat(32)}` },
    },
  })).toString('base64');
}

const get = (qs, payment) => new Request(`https://pointcast.xyz/api/oracle/paddles${qs}`, { headers: payment ? { 'Payment-Signature': payment } : {} });

test('Base rail is closed and honest without CDP keys', async (t) => {
  const m = await load(); t.after(m.close);
  const res = await m.handleOracleBase(get('?q=aurelius'), { AUTH_DB: new DB() });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.code, 'base_rail_not_configured');
  assert.deepEqual(body.state, 'awaiting_configuration');
});

test('Base rail: 402 with bazaar discovery, pay once, answer, split row, free replay', async (t) => {
  const m = await load(); t.after(m.close);
  const state = { verifies: 0, settles: 0 };
  const db = new DB();
  const env = { AUTH_DB: db, CDP_API_KEY_ID: 'test-id', CDP_API_KEY_SECRET: 'test-secret' };
  const opts = { facilitator: fakeFacilitator(state), authorizationUsed: async () => true };

  const bare = await m.handleOracleBase(get(''), env, opts);
  assert.equal(bare.status, 402);
  const terms = JSON.parse(Buffer.from(bare.headers.get('Payment-Required'), 'base64').toString());
  const accept = terms.accepts[0];
  assert.equal(accept.network, 'eip155:8453');
  assert.equal(accept.amount, '10000');
  assert.equal(accept.asset.toLowerCase(), '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');
  assert.equal(accept.payTo.toLowerCase(), PAY_TO.toLowerCase());
  assert.ok(terms.extensions?.bazaar, 'bazaar discovery extension is declared on the 402');
  assert.equal(terms.extensions.bazaar.info.input.method, 'GET');
  assert.ok(terms.resource.description.length <= 500, 'CDP rejects descriptions over 500 chars');

  const qs = '?q=Franklin%20Aurelius';
  const quote = await m.handleOracleBase(get(qs), env, opts);
  const qterms = JSON.parse(Buffer.from(quote.headers.get('Payment-Required'), 'base64').toString());
  const pay = paymentFor(qterms);
  const paid = await m.handleOracleBase(get(qs, pay), env, opts);
  assert.equal(paid.status, 200, JSON.stringify(await paid.clone().json()));
  assert.ok(paid.headers.get('Payment-Response') || paid.headers.get('PAYMENT-RESPONSE'), 'settlement header returned');
  const body = await paid.json();
  assert.equal(body.oracle.paddles[0].id, 'franklin-c45-aurelius');
  assert.equal(body.payment.transaction, TX);
  assert.equal(state.settles, 1);
  assert.ok(state.lastSettlePayload.extensions?.bazaar, 'the settled payload carries extensions.bazaar, which is what lists us');
  assert.equal(db.splits.get(`base:${TX}`).house, 5000);

  const replay = await m.handleOracleBase(get(qs, pay), env, opts);
  assert.equal(replay.status, 200);
  const rb = await replay.json();
  assert.equal(rb.replay, true);
  assert.equal(rb.oracle.paddles[0].id, 'franklin-c45-aurelius');
  assert.equal(state.settles, 1, 'a resent payment never settles twice');

  // Same payer + nonce (public on-chain) but a different header: no free answer.
  const forged = JSON.parse(Buffer.from(pay, 'base64').toString());
  forged.payload.signature = `0x${'99'.repeat(65)}`;
  const stolen = await m.handleOracleBase(get(qs, Buffer.from(JSON.stringify(forged)).toString('base64')), env, opts);
  assert.equal(stolen.status, 409);
  assert.equal(state.settles, 1);
});

test('Base rail refuses bad questions and wrong payees before settlement', async (t) => {
  const m = await load(); t.after(m.close);
  const state = { verifies: 0, settles: 0 };
  const env = { AUTH_DB: new DB(), CDP_API_KEY_ID: 'test-id', CDP_API_KEY_SECRET: 'test-secret' };
  const opts = { facilitator: fakeFacilitator(state), authorizationUsed: async () => false };
  const quote = await m.handleOracleBase(get('?build=wood'), env, opts);
  const terms = JSON.parse(Buffer.from(quote.headers.get('Payment-Required'), 'base64').toString());
  const bad = await m.handleOracleBase(get('?build=wood', paymentFor(terms, 'bb')), env, opts);
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).code, 'invalid_question');
  const wrongTo = await m.handleOracleBase(get('?build=wood', paymentFor(terms, 'cc', '0x4444444444444444444444444444444444444444')), env, opts);
  assert.ok([400, 402].includes(wrongTo.status));
  assert.equal(state.settles, 0);
});

test('a settlement timeout holds the payment; a resend after chain confirmation returns the answer', async (t) => {
  const m = await load(); t.after(m.close);
  const state = { verifies: 0, settles: 0, settleThrows: true };
  const db = new DB();
  const env = { AUTH_DB: db, CDP_API_KEY_ID: 'test-id', CDP_API_KEY_SECRET: 'test-secret' };
  let used = null;
  const opts = { facilitator: fakeFacilitator(state), authorizationUsed: async () => used };
  const qs = '?q=aurelius';
  const quote = await m.handleOracleBase(get(qs), env, opts);
  const terms = JSON.parse(Buffer.from(quote.headers.get('Payment-Required'), 'base64').toString());
  const pay = paymentFor(terms, 'dd');
  assert.equal((await m.handleOracleBase(get(qs, pay), env, opts)).status, 402, 'facilitator error + chain unknown → reported unsettled');
  assert.equal([...db.rows.values()][0].status, 'settling', 'but the row stays open so a resend re-checks the chain');
  assert.equal((await m.handleOracleBase(get(qs, pay), env, opts)).status, 202, 'resend while chain is unknown → pending, no second settle');
  used = true;
  const later = await m.handleOracleBase(get(qs, pay), env, opts);
  assert.equal(later.status, 200);
  assert.equal((await later.json()).oracle.paddles[0].id, 'franklin-c45-aurelius');
  assert.equal(state.settles, 1);
});
