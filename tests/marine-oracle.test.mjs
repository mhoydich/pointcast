import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// September in El Segundo is PDT (UTC-7). Build AWC-shaped METARs at local times.
const DAY = '2026-09-23';
const TODAY = '2026-09-24';
function metar(date, hhmm, clouds, type = 'METAR') {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const obsTime = Date.UTC(y, m - 1, d, hh + 7, mm) / 1000;
  return { icaoId: 'KLAX', metarType: type, obsTime, rawOb: `METAR KLAX ${hhmm} ${clouds.map((c) => `${c.cover}${String(c.base / 100).padStart(3, '0')}`).join(' ')}`, clouds };
}
const OVC = (ft) => [{ cover: 'OVC', base: ft }];
const CLR = [];
// Yesterday: overcast from before dawn, clears at 10:53 and stays clear.
const yesterday = [
  ['04:53', OVC(1100)], ['05:53', OVC(1100)], ['06:53', OVC(1000)], ['07:53', OVC(1100)], ['08:53', OVC(1300)],
  ['09:53', [{ cover: 'BKN', base: 1500 }]], ['10:53', [{ cover: 'SCT', base: 1800 }]], ['11:53', CLR], ['12:53', [{ cover: 'FEW', base: 2000 }]], ['13:53', CLR],
].map(([t, c]) => metar(DAY, t, c));
// Today: overcast through 08:53 so far.
const today = [['04:53', OVC(900)], ['05:53', OVC(900)], ['06:53', OVC(1000)], ['07:53', OVC(1000)], ['08:53', OVC(1300)]].map(([t, c]) => metar(TODAY, t, c));
const NOW = new Date(Date.UTC(2026, 8, 24, 16, 30)); // 09:30 PDT on the 24th

async function load() {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const [lib, agent, base] = await Promise.all([
    server.ssrLoadModule('/src/lib/marine-oracle.ts'),
    server.ssrLoadModule('/functions/api/agent/marine-layer.ts'),
    server.ssrLoadModule('/functions/api/oracle/marine-layer.ts'),
  ]);
  return { lib, agent, base, close: () => server.close() };
}

const respond = (text, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => text });

test('a finished morning resolves with the published rule and carries its evidence', async (t) => {
  const { lib, close } = await load(); t.after(close);
  const a = await lib.answerMarine({ date: DAY }, { fetch: async () => respond(JSON.stringify([...today, ...yesterday])), now: NOW });
  assert.equal(a.verdict.state, 'opened');
  assert.equal(a.verdict.final, true);
  assert.equal(a.verdict.openedAt, '10:53 am', 'first clear report after sunrise that holds 2 hours (SCT is not a ceiling)');
  assert.equal(a.verdict.lowestCeilingFt, 1000);
  assert.equal(a.observations.length, 10);
  assert.ok(a.observations.every((o) => o.raw?.startsWith('METAR KLAX')));
  assert.match(a.sources[0].url, /aviationweather\.gov/);
  assert.equal(a.now, null, 'no live "now" block for a past date');
});

test("this morning is provisional until the window closes; the live ceiling is reported", async (t) => {
  const { lib, close } = await load(); t.after(close);
  const a = await lib.answerMarine({ date: null }, { fetch: async () => respond(JSON.stringify([...today, ...yesterday])), now: NOW });
  assert.equal(a.date, TODAY);
  assert.equal(a.verdict.state, 'watching');
  assert.equal(a.verdict.final, false);
  assert.equal(a.now.underTheLayer, true);
  assert.equal(a.now.ceilingFt, 1300);
  assert.match(a.verdict.sentence, /still under the layer/);
});

test('upstream junk is an outage, never an empty morning, and is never cached', async (t) => {
  const { lib, close } = await load(); t.after(close);
  const cachedPuts = [];
  const cached = async (url, ttl, get) => { const text = await get(); cachedPuts.push(url); return text; };
  const old = { date: '2026-06-10' };
  await assert.rejects(
    lib.answerMarine(old, { fetch: async () => respond('Too many requests from your IP address, slow down.'), now: NOW, cached }),
    (e) => e instanceof lib.MarineSourceError && /rate-limiting/.test(e.message),
  );
  await assert.rejects(lib.answerMarine({ date: null }, { fetch: async () => respond('<html>oops</html>'), now: NOW, cached }), lib.MarineSourceError);
  await assert.rejects(lib.answerMarine({ date: null }, { fetch: async () => respond('', 502), now: NOW, cached }), lib.MarineSourceError);
  assert.equal(cachedPuts.length, 0, 'nothing invalid reached the cache');
});

test('older dates read the Iowa State CSV with the same rule', async (t) => {
  const { lib, close } = await load(); t.after(close);
  const csv = [
    'station,valid,skyc1,skyc2,skyc3,skyc4,skyl1,skyl2,skyl3,skyl4',
    'LAX,2026-06-10 05:53,OVC,M,M,M,900.00,M,M,M',
    'LAX,2026-06-10 06:53,OVC,M,M,M,1000.00,M,M,M',
    'LAX,2026-06-10 07:53,FEW,OVC,M,M,800.00,1100.00,M,M',
    'LAX,2026-06-10 08:53,OVC,M,M,M,1200.00,M,M,M',
    'LAX,2026-06-10 09:53,OVC,M,M,M,1400.00,M,M,M',
    'LAX,2026-06-10 10:53,OVC,M,M,M,1500.00,M,M,M',
    'LAX,2026-06-10 11:53,OVC,M,M,M,1600.00,M,M,M',
    'LAX,2026-06-10 12:53,OVC,M,M,M,1700.00,M,M,M',
    'LAX,2026-06-10 13:53,OVC,M,M,M,1800.00,M,M,M',
  ].join('\n');
  let url = '';
  const a = await lib.answerMarine({ date: '2026-06-10' }, { fetch: async (u) => { url = u; return respond(csv); }, now: NOW });
  assert.match(url, /mesonet\.agron\.iastate\.edu/);
  assert.equal(a.verdict.state, 'never');
  assert.equal(a.verdict.final, true);
});

test('questions are bounded', async (t) => {
  const { lib, close } = await load(); t.after(close);
  assert.deepEqual(lib.parseMarineQuery({}), { date: null });
  assert.deepEqual(lib.parseMarineQuery({ date: '2026-09-23' }, NOW), { date: '2026-09-23' });
  assert.match(lib.parseMarineQuery({ date: '2026-09-25' }, NOW), /not happened yet/);
  assert.match(lib.parseMarineQuery({ date: '2026-02-30' }, NOW), /real calendar day/);
  assert.match(lib.parseMarineQuery({ date: '1999-12-31' }, NOW), /2000-01-01/);
  assert.match(lib.parseMarineQuery({ date: '2026-09-23', station: 'SFO' }, NOW), /unknown field/);
});

// ── rails: an upstream outage must never cost the payer anything ──

// Minimal D1 covering the paid-intent + split statements the oracle path uses.
class IntentDB {
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



class DB {
  constructor() { this.rows = new Map(); this.splits = new Map(); }
  prepare() {
    const db = this;
    return { bind() { return this; }, async first() { return null; }, async run() { db.writes = (db.writes ?? 0) + 1; return { meta: { changes: 1 } }; } };
  }
}

test('Base rail: NOAA down → 503 before settlement, facilitator never settles', async (t) => {
  const { base, close } = await load(); t.after(close);
  let settles = 0;
  const facilitator = {
    async getSupported() { return { kinds: [{ x402Version: 2, scheme: 'exact', network: 'eip155:8453' }], extensions: ['bazaar'], signers: {} }; },
    async verify() { return { isValid: true, payer: '0x3333333333333333333333333333333333333333' }; },
    async settle() { settles += 1; return { success: true, transaction: `0x${'ef'.repeat(32)}`, network: 'eip155:8453' }; },
  };
  const env = { AUTH_DB: new DB(), CDP_API_KEY_ID: 'id', CDP_API_KEY_SECRET: 'secret' };
  const opts = { facilitator, authorizationUsed: async () => false };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('upstream down', { status: 502 });
  try {
    const quote = await base.handleMarineBase(new Request('https://pointcast.xyz/api/oracle/marine-layer'), env, opts);
    assert.equal(quote.status, 402);
    const terms = JSON.parse(Buffer.from(quote.headers.get('Payment-Required'), 'base64').toString());
    assert.equal(terms.extensions.bazaar.info.input.method, 'GET');
    const accepted = terms.accepts[0];
    const now = Math.floor(Date.now() / 1000);
    const pay = Buffer.from(JSON.stringify({
      x402Version: 2, accepted, resource: terms.resource, extensions: terms.extensions,
      payload: { signature: `0x${'22'.repeat(65)}`, authorization: { from: '0x3333333333333333333333333333333333333333', to: accepted.payTo, value: accepted.amount, validAfter: String(now - 5), validBefore: String(now + 60), nonce: `0x${'ab'.repeat(32)}` } },
    })).toString('base64');
    const paid = await base.handleMarineBase(new Request('https://pointcast.xyz/api/oracle/marine-layer', { headers: { 'Payment-Signature': pay } }), env, opts);
    assert.equal(paid.status, 503);
    const body = await paid.json();
    assert.equal(body.code, 'oracle_unavailable');
    assert.equal(body.transactionSent, false);
    assert.equal(settles, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('Etherlink rail: bare probe quotes; free preview works; outage refuses before any facilitator call', async (t) => {
  const { agent, close } = await load(); t.after(close);
  const realFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input) => {
    calls.push(String(input));
    if (String(input).includes('aviationweather')) return new Response(JSON.stringify(today), { status: 200 });
    throw new Error(`unexpected fetch ${input}`);
  };
  try {
    const env = { AUTH_DB: new DB() };
    const bare = await agent.handleAgentMarine(new Request('https://pointcast.xyz/api/agent/marine-layer', { method: 'POST' }), env);
    assert.equal(bare.status, 402);
    const preview = await agent.handleMarineGet(new Request('https://pointcast.xyz/api/agent/marine-layer?preview=1'), env);
    assert.equal(preview.status, 200);
    const pj = await preview.json();
    assert.equal(typeof pj.underTheLayerNow, 'boolean');
    assert.equal(pj.verdict, undefined, 'the preview never gives away the verdict');
    assert.ok(!calls.some((u) => u.includes('bubbletez')), 'no facilitator traffic for a quote or preview');

    // Paid request while NOAA is down: refused with 503 before the facilitator is ever called.
    globalThis.fetch = async (input) => { calls.push(String(input)); return new Response('down', { status: 503 }); };
    const intents = new IntentDB();
    const quote = await agent.handleAgentMarine(new Request('https://pointcast.xyz/api/agent/marine-layer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }), { AUTH_DB: intents });
    assert.equal(quote.status, 402);
    const terms = JSON.parse(Buffer.from(quote.headers.get('Payment-Required'), 'base64').toString());
    const accepted = terms.accepts[0];
    const now = Math.floor(Date.now() / 1000);
    const pay = Buffer.from(JSON.stringify({ x402Version: 2, accepted, resource: terms.resource, extensions: terms.extensions, payload: {
      signature: `0x${'11'.repeat(65)}`,
      permit2Authorization: { from: '0x2222222222222222222222222222222222222222', permitted: { token: accepted.asset, amount: accepted.amount }, spender: '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E', nonce: '9', deadline: String(now + 30), witness: { to: accepted.payTo, validAfter: String(now), extra: '0x' } },
    } })).toString('base64');
    const paid = await agent.handleAgentMarine(new Request('https://pointcast.xyz/api/agent/marine-layer', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Payment-Signature': pay, 'Idempotency-Key': 'marine-outage-0001' }, body: '{}' }), { AUTH_DB: intents });
    assert.equal(paid.status, 503);
    assert.equal((await paid.json()).transactionSent, false);
    assert.ok(!calls.some((u) => u.includes('bubbletez')), 'the facilitator was never called');
    assert.equal(intents.splits.size, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('/oracles.json lists live oracles, rail state, and the per-contributor ledger without secrets', async (t) => {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  t.after(() => server.close());
  const { handleOraclesJson } = await server.ssrLoadModule('/functions/oracles.json.ts');
  const db = { prepare() { return { bind() { return this; }, async all() { return { results: [
    { action: 'oracle-marine', maker: 'noaa-asos', maker_address: null, calls: 3, units: 30000, network_units: 15000 },
  ] }; } }; } };
  const res = await handleOraclesJson({ AUTH_DB: db, CDP_API_KEY_ID: 'secret-id', CDP_API_KEY_SECRET: 'secret-value' });
  const text = await res.text();
  assert.ok(!text.includes('secret-id') && !text.includes('secret-value'), 'never echoes keys');
  const body = JSON.parse(text);
  assert.equal(body.rails.base.state, 'open');
  const marine = body.oracles.find((o) => o.id === 'marine-layer');
  assert.equal(marine.ledger.settledCalls, 3);
  assert.equal(marine.ledger.grossUsdc, '0.03');
  assert.deepEqual(marine.ledger.dataDividends[0], { contributor: 'noaa-asos', address: null, calls: 3, networkHalfUsdc: '0.015' });
  assert.equal(body.oracles.find((o) => o.id === 'paddles').ledger.settledCalls, 0);
  assert.ok(body.planned.length >= 5);
  const closed = JSON.parse(await (await handleOraclesJson({})).text());
  assert.equal(closed.rails.base.state, 'awaiting_configuration');
  assert.equal(closed.oracles[0].ledger, null, 'no ledger claims without the database');
});
