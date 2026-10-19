import assert from 'node:assert/strict';
import test from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';

import { canonicalPassport } from '../src/lib/passport-check.mjs';
import {
  checkIn, containsSecret, pacificDay, publicBoard,
} from '../functions/_lib/front-desk.mjs';

function memoryKv() {
  const store = new Map();
  let puts = 0;
  return {
    store,
    get puts() { return puts; },
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value) {
      puts += 1;
      store.set(key, String(value));
    },
  };
}

const NOW = Date.parse('2026-10-05T20:00:00Z');

function minimal(extra = {}) {
  return { name: 'grok', operator: 'Mike Hoydich', purpose: 'Read the rooms and leave a labeled trace.', ...extra };
}

test('a Pacific day rolls at midnight in Los Angeles', () => {
  assert.equal(pacificDay(NOW), '2026-10-05');
  assert.equal(pacificDay(Date.parse('2026-10-06T06:30:00Z')), '2026-10-05');
  assert.equal(pacificDay(Date.parse('2026-10-06T07:00:00Z')), '2026-10-06');
});

test('a minimal agent check-in is self-declared and leaves a stamp and a receipt', async () => {
  const kv = memoryKv();
  const result = await checkIn(kv, minimal(), { now: NOW, records: [] });
  assert.equal(result.ok, true);
  assert.equal(result.status, 201);
  assert.equal(result.visit.kind, 'agent');
  assert.equal(result.visit.level, 'self-declared');
  assert.equal(result.visit.stamp.schema, 'pointcast.provenance/v0.1');
  assert.equal(result.visit.stamp.wordsOf, 'agent');
  assert.equal(result.visit.stamp.madeBy[0].name, 'grok');
  assert.match(result.visit.stamp.contentHash, /^[0-9a-f]{64}$/);
  assert.equal(result.visit.receipt.schema, 'pointcast.agent-receipt/v0.1');
  assert.equal(result.visit.receipt.action, 'front_desk_checkin');
  assert.equal(result.visit.receipt.agent, 'grok');
  assert.equal(result.visit.receipt.signature.status, 'pending');
  assert.match(result.visit.receipt.id, /^rcpt_[a-z0-9]{8}$/);
  assert.match(result.visit.passportHash, /^[0-9a-f]{64}$/);
  const board = await publicBoard(kv, undefined, NOW);
  assert.equal(board.counts.agent, 1);
  assert.equal(board.counts.human, 0);
  assert.equal(board.counts.levels['self-declared'], 1);
  assert.equal(board.visitors[0].name, 'grok');
});

test('a person and an agent sit side by side', async () => {
  const kv = memoryKv();
  await checkIn(kv, minimal(), { now: NOW, records: [] });
  const human = await checkIn(kv, { handle: 'Ada', kind: 'human' }, { now: NOW });
  assert.equal(human.ok, true);
  assert.equal(human.visit.kind, 'human');
  assert.equal(human.visit.level, 'self-declared');
  assert.equal(human.visit.receipt.agent, null);
  assert.equal(human.visit.receipt.person, 'Ada');
  assert.equal(human.visit.stamp.wordsOf, 'person');
  const board = await publicBoard(kv, '2026-10-05', NOW);
  assert.equal(board.counts.all, 2);
  assert.equal(board.counts.human, 1);
  assert.equal(board.counts.agent, 1);
});

test('honeypot and secrets are refused and nothing is stored', async () => {
  const kv = memoryKv();
  const honey = await checkIn(kv, minimal({ company: 'acme' }), { now: NOW, records: [] });
  assert.equal(honey.honeypot, true);
  assert.equal(honey.status, 400);
  const secret = await checkIn(kv, minimal({ apiKey: 'sk-live' }), { now: NOW, records: [] });
  assert.equal(secret.ok, false);
  assert.match(secret.error, /secrets/);
  assert.equal(containsSecret({ publicKey: { key: 'abcd' } }), false);
  assert.equal(kv.puts, 0);
  assert.equal((await publicBoard(kv, '2026-10-05', NOW)).counts.all, 0);
});

test('an invalid passport is refused', async () => {
  const kv = memoryKv();
  const result = await checkIn(kv, { passport: { schema: 'nope', name: 'x' } }, { now: NOW, records: [] });
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(kv.puts, 0);
});

test('a repeat visit does not write a second receipt', async () => {
  const kv = memoryKv();
  const first = await checkIn(kv, minimal(), { now: NOW, records: [] });
  const puts = kv.puts;
  const again = await checkIn(kv, minimal({ purpose: 'A different sentence.' }), { now: NOW, records: [] });
  assert.equal(again.status, 200);
  assert.equal(again.repeat, true);
  assert.equal(again.visit.receipt.id, first.visit.receipt.id);
  assert.equal(kv.puts, puts);
  assert.equal((await publicBoard(kv, '2026-10-05', NOW)).counts.all, 1);
});

test('GET reads without writing, including when the store is unbound', async () => {
  const kv = memoryKv();
  await checkIn(kv, minimal(), { now: NOW, records: [] });
  const puts = kv.puts;
  const board = await publicBoard(kv, '2026-10-05', NOW);
  assert.equal(board.counts.all, 1);
  assert.equal(kv.puts, puts);
  const empty = await publicBoard(null, '2026-10-05', NOW);
  assert.equal(empty.ok, true);
  assert.equal(empty.kvBound, false);
  assert.equal(empty.counts.all, 0);
  assert.equal((await publicBoard(kv, 'not-a-date', NOW)).status, 400);
});

test('operator-vouched and registered-onchain are assigned only when the checker can reach them', async () => {
  const kv = memoryKv();
  const vouched = await checkIn(kv, {
    passport: {
      schema: 'pointcast.agent-passport/v0.1',
      name: 'clerk',
      operator: { name: 'Mike Hoydich' },
      purpose: 'Keep the desk.',
      capabilities: ['visit'],
      consent: ['label-as-bot'],
      level: 'self-declared',
      updated: '2026-10-05T20:00:00Z',
      ethereum: { easUID: '0xabc' },
    },
  }, { now: NOW, records: [] });
  assert.equal(vouched.visit.level, 'operator-vouched');

  const claimed = await checkIn(kv, {
    passport: {
      schema: 'pointcast.agent-passport/v0.1',
      name: 'ledger',
      operator: { name: 'Mike Hoydich' },
      purpose: 'Practice a registry.',
      capabilities: ['visit'],
      consent: ['label-as-bot'],
      level: 'registered-onchain',
      updated: '2026-10-05T20:00:00Z',
      devnet: { bot: 'ledger' },
    },
  }, { now: NOW, records: [] });
  assert.equal(claimed.visit.level, 'self-declared');
  assert.equal(claimed.visit.claimed, 'registered-onchain');

  const registered = await checkIn(kv, {
    passport: {
      schema: 'pointcast.agent-passport/v0.1',
      name: 'onchain',
      operator: { name: 'Mike Hoydich' },
      purpose: 'The hash is on the devnet.',
      capabilities: ['visit'],
      consent: ['label-as-bot'],
      level: 'registered-onchain',
      updated: '2026-10-05T20:00:00Z',
      devnet: { bot: 'onchain' },
    },
  }, { now: NOW, records: [{ cited: true, hashMatches: true }] });
  assert.equal(registered.visit.level, 'registered-onchain');
});

test('a key-signed passport reaches key-signed and the signature is not stored', async () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const der = publicKey.export({ type: 'spki', format: 'der' });
  const rawHex = Buffer.from(der.subarray(der.length - 32)).toString('hex');
  const doc = {
    schema: 'pointcast.agent-passport/v0.1',
    name: 'keyed',
    operator: { name: 'Mike Hoydich' },
    purpose: 'Sign the visit.',
    capabilities: ['visit'],
    consent: ['label-as-bot'],
    level: 'key-signed',
    updated: '2026-10-05T20:00:00Z',
    publicKey: { scheme: 'ed25519', key: rawHex, status: 'active' },
  };
  const sig = sign(null, Buffer.from(canonicalPassport(doc)), privateKey).toString('hex');
  doc.signature = { alg: 'ed25519', value: sig };
  const kv = memoryKv();
  const result = await checkIn(kv, { passport: doc }, { now: NOW, records: [] });
  assert.equal(result.ok, true, result.error);
  assert.equal(result.visit.level, 'key-signed');
  assert.equal(result.visit.checks.keySigned, true);
  const stored = [...kv.store.values()].join('\n');
  assert.equal(stored.includes(sig), false);
});

test('the MCP tool files as an agent even when the body says human', async () => {
  const kv = memoryKv();
  const refused = await checkIn(kv, { handle: 'Ada', kind: 'human' }, { now: NOW, forceAgent: true });
  assert.equal(refused.ok, false);
  const filed = await checkIn(kv, { ...minimal(), kind: 'human' }, { now: NOW, records: [], forceAgent: true });
  assert.equal(filed.visit.kind, 'agent');
});

async function loadHandler(t, path) {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: false,
    appType: 'custom',
    logLevel: 'error',
    resolve: { preserveSymlinks: true },
    cacheDir: '.astro/front-desk-test-cache',
  });
  t.after(() => server.close());
  return server.ssrLoadModule(path);
}

test('the HTTP book is side-effect free on GET and rate-limits POST', async (t) => {
  const { onRequestGet, onRequestPost } = await loadHandler(t, '/functions/api/front-desk.ts');
  const kv = memoryKv();
  await checkIn(kv, minimal(), { now: NOW, records: [] });
  const puts = kv.puts;
  const rates = memoryKv();
  const env = { VISITS: kv, PC_RATES_KV: rates };
  const got = await onRequestGet({
    request: new Request('https://pointcast.xyz/api/front-desk?date=2026-10-05'),
    env,
  });
  const body = await got.json();
  assert.equal(got.status, 200);
  assert.equal(body.counts.all, 1);
  assert.equal(kv.puts, puts);

  let last = 201;
  for (let i = 0; i < 9; i += 1) {
    const res = await onRequestPost({
      request: new Request('https://pointcast.xyz/api/front-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.8' },
        body: JSON.stringify(minimal({ name: `bot${i}` })),
      }),
      env,
    });
    last = res.status;
  }
  assert.equal(last, 429);
});

test('MCP lists the desk tools with check-in not marked read-only', async (t) => {
  const { onRequestPost } = await loadHandler(t, '/functions/api/mcp.ts');
  const res = await onRequestPost({
    env: {},
    request: new Request('https://pointcast.xyz/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
    }),
  });
  const list = await res.json();
  const tools = list.result.tools;
  const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
  assert.equal(byName.front_desk_today.annotations.readOnlyHint, true);
  assert.equal(byName.front_desk_checkin.annotations.readOnlyHint, false);
  assert.equal(byName.front_desk_checkin.annotations.destructiveHint, false);
  assert.equal(byName.front_desk_checkin.inputSchema.properties.kind, undefined);
});


function privacyFixturePassport(extra = {}) {
  return {
    schema: 'pointcast.agent-passport/v0.1',
    name: 'privacy-fixture',
    operator: { name: 'Public Operator' },
    purpose: 'A public visitor check-in.',
    capabilities: ['visit'],
    consent: ['label-as-bot'],
    level: 'self-declared',
    updated: '2026-10-05T20:00:00Z',
    ...extra,
  };
}

test('secret fields in object and JSON-string passports are both refused before ledger writes', async () => {
  const doc = privacyFixturePassport({ apiKey: 'fixture-only-never-publish' });
  for (const passport of [doc, JSON.stringify(doc)]) {
    const kv = memoryKv();
    const result = await checkIn(kv, { passport }, { now: NOW, records: [] });
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
    assert.match(result.error, /secrets/);
    assert.equal(kv.puts, 0);
    assert.equal(kv.store.size, 0);
    assert.equal((await publicBoard(kv, '2026-10-05', NOW)).counts.all, 0);
  }
});

test('untrusted signature failure text never enters stored or public visit notes', async () => {
  const marker = 'untrusted-raw-passport-marker-do-not-publish';
  const passport = privacyFixturePassport({
    publicKey: { scheme: 'ed25519', key: '00'.repeat(32), status: 'active' },
    signature: { alg: marker, value: '00'.repeat(64) },
  });
  const kv = memoryKv();
  const result = await checkIn(kv, { passport }, { now: NOW, records: [] });
  assert.equal(result.ok, true);
  assert.equal(result.visit.level, 'self-declared');
  assert.equal(result.visit.checks.keySigned, false);
  assert.equal(result.visit.checks.keyNote, 'No ed25519 signature was verified.');
  assert.equal(JSON.stringify(result).includes(marker), false);
  assert.equal([...kv.store.values()].join('\n').includes(marker), false);
  const board = await publicBoard(kv, '2026-10-05', NOW);
  assert.equal(board.counts.agent, 1);
  assert.equal(JSON.stringify(board).includes(marker), false);
});

test('ordinary public object and JSON-string passports still receive the same self-declared visit shape', async () => {
  const doc = privacyFixturePassport();
  for (const passport of [doc, JSON.stringify(doc)]) {
    const kv = memoryKv();
    const result = await checkIn(kv, { passport }, { now: NOW, records: [] });
    assert.equal(result.ok, true);
    assert.equal(result.status, 201);
    assert.equal(result.visit.name, doc.name);
    assert.equal(result.visit.level, 'self-declared');
    assert.equal(result.visit.stamp.humanApproved, false);
    assert.equal(result.visit.receipt.signature.status, 'pending');
    assert.equal(kv.puts, 2);
    const board = await publicBoard(kv, '2026-10-05', NOW);
    assert.equal(board.counts.all, 1);
    assert.equal(board.visitors[0].name, doc.name);
  }
});
