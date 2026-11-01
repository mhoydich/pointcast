/**
 * Sandbox x402 rail: test USDC on Base Sepolia only, $1 per-call cap, a daily
 * ceiling, closed until configured. functions/_lib/x402-sandbox.ts and
 * functions/api/agent/haggle-pay-sandbox.ts.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'vite';

const PAYER = '0x3333333333333333333333333333333333333333';
const PAY_TO = '0x4444444444444444444444444444444444444444';
const TX = `0x${'ab'.repeat(32)}`;
const ENV = { X402_SANDBOX_ENABLED: 'true', X402_SANDBOX_PAY_TO: PAY_TO, X402_SANDBOX_DAILY_CEILING_USD: '1' };

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

function fakeFacilitator(state) {
  return {
    async getSupported() { return { kinds: [{ x402Version: 2, scheme: 'exact', network: 'eip155:84532' }], extensions: [], signers: {} }; },
    async verify() { state.verifies += 1; return { isValid: true, payer: PAYER }; },
    async settle() { state.settles += 1; return { success: true, transaction: TX, network: 'eip155:84532', payer: PAYER }; },
  };
}

function paymentFor(terms, nonceByte, overrides = {}) {
  const accepted = { ...terms.accepts[0], ...overrides.accepted };
  const now = Math.floor(Date.now() / 1000);
  return Buffer.from(JSON.stringify({
    x402Version: 2, accepted, resource: terms.resource,
    payload: { signature: `0x${'22'.repeat(65)}`, authorization: { from: PAYER, to: overrides.to ?? PAY_TO, value: accepted.amount, validAfter: String(now - 5), validBefore: String(now + 60), nonce: `0x${nonceByte.repeat(32)}` } },
  })).toString('base64');
}

async function load() {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const mod = await server.ssrLoadModule('/functions/api/agent/haggle-pay-sandbox.ts');
  const lib = await server.ssrLoadModule('/functions/_lib/x402-sandbox.ts');
  return { ...mod, lib, close: () => server.close() };
}
const post = (session, payment) => new Request('https://pointcast.xyz/api/agent/haggle-pay-sandbox', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(payment ? { 'Payment-Signature': payment } : {}) }, body: JSON.stringify({ session }) });
const decodeTerms = (res) => JSON.parse(Buffer.from(res.headers.get('payment-required'), 'base64').toString());

test('closed until configured, and only ever on Base Sepolia', async (t) => {
  const m = await load(); t.after(m.close);
  const db = d1();
  db.raw.exec("INSERT INTO haggle_sessions VALUES ('h_1', 'service-bell', 'shwa', 'deal', 20, 1, NULL)");
  const closed = await m.handleHagglePaySandbox(post('h_1'), { AUTH_DB: db });
  assert.equal(closed.status, 503);
  assert.equal((await closed.json()).code, 'sandbox_not_configured');
  assert.equal(m.lib.SANDBOX_NETWORK, 'eip155:84532');
  assert.equal(m.lib.SANDBOX_FACILITATOR, 'https://x402.org/facilitator');
  assert.equal(m.lib.sandboxConfig({ ...ENV, X402_SANDBOX_DAILY_CEILING_USD: '500' }).dailyCeilingUnits, 20_000_000, 'ceiling never above $20');
});

test('quote, settle, receipt; the real deal is untouched; a second practice pay is refused', async (t) => {
  const m = await load(); t.after(m.close);
  const db = d1();
  db.raw.exec("INSERT INTO haggle_sessions VALUES ('h_1', 'service-bell', 'shwa', 'deal', 20, 1, NULL)");
  const state = { verifies: 0, settles: 0 };
  const env = { AUTH_DB: db, ...ENV };
  const quote = await m.handleHagglePaySandbox(post('h_1'), env, { facilitator: fakeFacilitator(state) });
  assert.equal(quote.status, 402);
  const terms = decodeTerms(quote);
  assert.equal(terms.accepts[0].network, 'eip155:84532');
  assert.equal(terms.accepts[0].amount, '200000');

  const paid = await m.handleHagglePaySandbox(post('h_1', paymentFor(terms, 'aa')), env, { facilitator: fakeFacilitator(state) });
  assert.equal(paid.status, 200);
  const body = await paid.json();
  assert.equal(body.sandbox, true);
  assert.equal(body.receipt.transaction, TX);
  assert.equal(state.settles, 1);
  assert.equal(db.raw.prepare("SELECT status FROM haggle_sessions WHERE id = 'h_1'").get().status, 'deal');

  const again = await m.handleHagglePaySandbox(post('h_1', paymentFor(terms, 'bb')), env, { facilitator: fakeFacilitator(state) });
  assert.equal(again.status, 409);
});

test('a payment to another address is refused before settlement', async (t) => {
  const m = await load(); t.after(m.close);
  const db = d1();
  db.raw.exec("INSERT INTO haggle_sessions VALUES ('h_2', 'wax-seal', 'shwa', 'deal', 30, 2, NULL)");
  const state = { verifies: 0, settles: 0 };
  const env = { AUTH_DB: db, ...ENV };
  const terms = decodeTerms(await m.handleHagglePaySandbox(post('h_2'), env, { facilitator: fakeFacilitator(state) }));
  const res = await m.handleHagglePaySandbox(post('h_2', paymentFor(terms, 'cc', { to: '0x5555555555555555555555555555555555555555' })), env, { facilitator: fakeFacilitator(state) });
  assert.equal(res.status, 400);
  assert.equal(state.settles, 0);
});

test('daily ceiling and per-call cap hold', async (t) => {
  const m = await load(); t.after(m.close);
  const db = d1();
  // Ceiling is $1: 40c + 40c fit, the third 40c does not.
  db.raw.exec("INSERT INTO haggle_sessions VALUES ('a', 'wax-seal', 'x', 'deal', 40, 1, NULL), ('b', 'wax-seal', 'x', 'deal', 40, 2, NULL), ('c', 'wax-seal', 'x', 'deal', 40, 3, NULL), ('big', 'wax-seal', 'x', 'deal', 150, 4, NULL)");
  const state = { verifies: 0, settles: 0 };
  const env = { AUTH_DB: db, ...ENV };
  const pay = async (id, nonce) => {
    const terms = decodeTerms(await m.handleHagglePaySandbox(post(id), env, { facilitator: fakeFacilitator(state) }));
    return m.handleHagglePaySandbox(post(id, paymentFor(terms, nonce)), env, { facilitator: fakeFacilitator(state) });
  };
  assert.equal((await pay('a', '01')).status, 200);
  assert.equal((await pay('b', '02')).status, 200);
  const third = await m.handleHagglePaySandbox(post('c'), env, { facilitator: fakeFacilitator(state) });
  assert.equal(third.status, 429);
  assert.equal((await third.json()).code, 'daily_ceiling_reached');
  const big = await m.handleHagglePaySandbox(post('big'), { ...env, X402_SANDBOX_DAILY_CEILING_USD: '20' }, { facilitator: fakeFacilitator(state) });
  assert.equal(big.status, 400);
  assert.equal((await big.json()).code, 'over_per_call_cap');
});
