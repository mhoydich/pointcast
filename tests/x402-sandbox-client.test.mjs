/**
 * The sandbox payer (scripts/x402-sandbox-client.mjs) against the sandbox
 * route, end to end in memory: quote, guarded sign, settle, receipt. The key
 * is a throwaway generated per run; nothing touches a network.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'vite';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { SANDBOX, sandboxTermsProblems, sandboxOnly, quote, pay } from '../scripts/x402-sandbox-client.mjs';

const PAY_TO = '0x4444444444444444444444444444444444444444';
const TX = `0x${'cd'.repeat(32)}`;
const ENV = { X402_SANDBOX_ENABLED: 'true', X402_SANDBOX_PAY_TO: PAY_TO, X402_SANDBOX_DAILY_CEILING_USD: '5' };

function d1() {
  const db = new DatabaseSync(':memory:');
  for (const t of ['shop_wants', 'shop_offers']) db.exec(`CREATE TABLE ${t} (id TEXT)`);
  db.exec('CREATE TABLE haggle_sessions (id TEXT PRIMARY KEY, item_id TEXT, who TEXT, status TEXT, deal_cents INTEGER, stub_no INTEGER, receipt_hash TEXT)');
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async all() { return { results: db.prepare(sql).all(...args) }; },
    async run() { const r = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(r.changes) } }; },
  });
  return { raw: db, prepare: (sql) => statement(sql) };
}

function facilitator(state) {
  return {
    async getSupported() { return { kinds: [{ x402Version: 2, scheme: 'exact', network: SANDBOX.network }], extensions: [], signers: {} }; },
    async verify(payload) { state.seen = payload; return { isValid: true, payer: payload.payload.authorization.from }; },
    async settle(payload) { state.settles += 1; return { success: true, transaction: TX, network: SANDBOX.network, payer: payload.payload.authorization.from }; },
  };
}

async function load() {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const mod = await server.ssrLoadModule('/functions/api/agent/haggle-pay-sandbox.ts');
  return { ...mod, close: () => server.close() };
}

const routeFetch = (handler, env, state) => async (input, init) =>
  handler(input instanceof Request ? input : new Request(input, init), env, { facilitator: facilitator(state) });

const good = { scheme: 'exact', network: SANDBOX.network, asset: SANDBOX.asset, amount: '250000', payTo: PAY_TO };

test('terms check: only Base Sepolia test USDC, exact, at most $1', () => {
  assert.deepEqual(sandboxTermsProblems(good), []);
  assert.equal(sandboxTermsProblems({ ...good, network: 'eip155:8453' }).length, 1, 'Base mainnet refused');
  assert.equal(sandboxTermsProblems({ ...good, asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }).length, 1, 'real USDC refused');
  assert.equal(sandboxTermsProblems({ ...good, amount: '1000001' }).length, 1, 'over $1 refused');
  assert.equal(sandboxTermsProblems({ ...good, scheme: 'upto' }).length, 1);
  assert.deepEqual(sandboxOnly(2, [{ ...good, network: 'eip155:8453' }, good]), [good]);
});

test('dry run quotes and signs nothing; a closed route says why', async (t) => {
  const m = await load(); t.after(m.close);
  const db = d1();
  db.raw.exec("INSERT INTO haggle_sessions VALUES ('h_q', 'paper-plane', 'shwa', 'deal', 9, 1, NULL)");
  const state = { settles: 0 };
  const q = await quote('h_q', { fetchImpl: routeFetch(m.handleHagglePaySandbox, { AUTH_DB: db, ...ENV }, state) });
  assert.equal(q.ok, true, q.problems.join('; '));
  assert.equal(q.terms.accepts[0].amount, '90000');
  assert.equal(state.settles, 0);
  const closed = await quote('h_q', { fetchImpl: routeFetch(m.handleHagglePaySandbox, { AUTH_DB: db }, state) });
  assert.equal(closed.ok, false);
  assert.notEqual(closed.status, 402);
});

test('Shwa pays Frog: quote, guarded sign, settle, sandbox receipt', async (t) => {
  const m = await load(); t.after(m.close);
  const db = d1();
  db.raw.exec("INSERT INTO haggle_sessions VALUES ('h_pay', 'service-bell', 'shwa', 'deal', 20, 1, NULL)");
  const state = { settles: 0 };
  const shwa = privateKeyToAccount(generatePrivateKey());
  const result = await pay('h_pay', shwa, { fetchImpl: routeFetch(m.handleHagglePaySandbox, { AUTH_DB: db, ...ENV }, state) });
  assert.equal(result.ok, true, JSON.stringify(result.body));
  assert.equal(state.settles, 1);
  assert.equal(result.body.sandbox, true);
  assert.equal(result.body.receipt.network, SANDBOX.network);
  assert.equal(result.body.receipt.transaction, TX);
  assert.equal(state.seen.payload.authorization.from.toLowerCase(), shwa.address.toLowerCase());
  assert.equal(state.seen.payload.authorization.to.toLowerCase(), PAY_TO.toLowerCase(), 'paid to the sandbox address');
  assert.equal(state.seen.payload.authorization.value, '200000');
  assert.equal(db.raw.prepare("SELECT status FROM haggle_sessions WHERE id = 'h_pay'").get().status, 'deal', 'real deal untouched');
});
