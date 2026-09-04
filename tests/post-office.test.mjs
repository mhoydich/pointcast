import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { handleAliasRequest } from '../functions/api/post-office/alias.ts';
import { handleAliasStatus } from '../functions/api/post-office/alias/[name].ts';
import { registryResponse } from '../functions/_lib/post-office-registry.ts';
import { routePostOfficeInbound } from '../functions/_lib/post-office-inbound.ts';
import {
  POST_OFFICE_ENVELOPE_SPEC,
  parseAliasInput,
} from '../src/lib/post-office.ts';
import {
  X402_TREASURY_AGENT_ID,
  decodeBase64Json,
  encodeBase64Json,
  verifyCanonicalPayload,
} from '../src/lib/x402.ts';

function testKeypair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const pkcs8 = privateKey.export({ type: 'pkcs8', format: 'der' });
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  return {
    privateKeyBase64: pkcs8.toString('base64'),
    publicKeyBase64: spki.subarray(spki.length - 32).toString('base64'),
  };
}

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/gu, ' ').trim();
    this.args = [];
  }
  bind(...args) { this.args = args; return this; }
  async first() {
    if (this.sql.includes('FROM aliases WHERE name = ?')) return this.db.aliases.get(this.args[0]) ?? null;
    if (this.sql.startsWith('SELECT delivery_id, outcome FROM post_office_deliveries')) {
      return [...this.db.deliveries.values()].find((row) => (
        row.webhook_hash === this.args[0] && row.alias_hash === this.args[1]
      )) ?? null;
    }
    if (this.sql.startsWith('INSERT INTO post_office_counter_locks') && this.sql.includes('RETURNING holder')) {
      const [day, holder, expiresAt, now] = this.args;
      const current = this.db.locks.get(day);
      if (current && current.holder !== holder && current.expires_at > now) return null;
      this.db.locks.set(day, { holder, expires_at: expiresAt });
      return { holder };
    }
    if (this.sql.startsWith('SELECT COALESCE((SELECT count FROM post_office_daily_counters')) {
      return {
        global_count: this.db.counters.get(`${this.args[0]}:global`) ?? 0,
        alias_count: this.db.counters.get(`${this.args[1]}:${this.args[2]}`) ?? 0,
      };
    }
    throw new Error(`Unsupported first: ${this.sql}`);
  }
  async all() {
    if (this.sql.includes('FROM aliases')) {
      return { success: true, results: [...this.db.aliases.values()] };
    }
    throw new Error(`Unsupported all: ${this.sql}`);
  }
  async run() {
    if (this.sql.startsWith('INSERT INTO post_office_deliveries')) {
      const [deliveryId, webhookHash, aliasHash, day, downstreamKey, acceptedAt, completedAt] = this.args;
      if (this.db.deliveries.has(deliveryId)) return { success: true, meta: { changes: 0 } };
      this.db.deliveries.set(deliveryId, {
        delivery_id: deliveryId, webhook_hash: webhookHash, alias_hash: aliasHash, day,
        downstream_idempotency_key: downstreamKey, provider_accepted: 1,
        outcome: this.sql.includes("'rate_limited'") ? 'rate_limited' : 'reserved',
        error: null, accepted_at: acceptedAt, completed_at: completedAt ?? null,
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.startsWith('INSERT INTO post_office_daily_counters')) {
      const scope = this.sql.includes("VALUES (?, 'global'") ? 'global' : this.args[1];
      const updatedAt = this.sql.includes("VALUES (?, 'global'") ? this.args[1] : this.args[2];
      const key = `${this.args[0]}:${scope}`;
      this.db.counters.set(key, (this.db.counters.get(key) ?? 0) + 1);
      this.db.counterUpdates = [...(this.db.counterUpdates ?? []), updatedAt];
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.startsWith('UPDATE post_office_counter_locks SET holder = NULL')) {
      const row = this.db.locks.get(this.args[0]);
      if (row?.holder === this.args[1]) this.db.locks.delete(this.args[0]);
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }
    if (this.sql.startsWith('UPDATE post_office_deliveries')) {
      const deliveryId = this.args.at(-1);
      const row = this.db.deliveries.get(deliveryId);
      if (!row || row.outcome !== 'reserved') return { success: true, meta: { changes: 0 } };
      if (this.sql.includes("outcome = 'forwarded'")) {
        Object.assign(row, { outcome: 'forwarded', error: null, completed_at: this.args[0] });
      } else if (this.sql.includes("outcome = 'failed'")) {
        Object.assign(row, { outcome: 'failed', error: this.args[0], completed_at: this.args[1] });
      } else if (this.sql.includes('error = NULL')) {
        Object.assign(row, { outcome: this.args[0], error: null, completed_at: this.args[1] });
      } else {
        Object.assign(row, { outcome: this.args[0], error: this.args[1], completed_at: this.args[2] });
      }
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.startsWith('INSERT INTO alias_receipts')) {
      const [hash, name, action, eventAt, aliasName = name, aliasHash = hash] = this.args;
      if (this.db.aliases.get(aliasName)?.receipt_hash !== aliasHash) return { success: true, meta: { changes: 0 } };
      if (this.db.receipts.has(hash)) throw new Error('UNIQUE constraint failed: alias_receipts.receipt_hash');
      this.db.receipts.set(hash, { name, action, eventAt });
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.startsWith('INSERT INTO aliases')) {
      const [name, kind, target, owner, hash, agentId, createdAt, renewedAt, expiresAt] = this.args;
      const prior = this.db.aliases.get(name);
      this.db.aliases.set(name, {
        name,
        forward_kind: kind,
        forward_target: target,
        owner,
        receipt_hash: hash,
        agent_id: agentId ?? null,
        created_at: prior?.owner === owner ? prior.created_at : createdAt,
        renewed_at: renewedAt,
        expires_at: expiresAt,
        forwarded_count: prior?.owner === owner ? prior.forwarded_count : 0,
        status: 'active',
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.startsWith('UPDATE aliases SET forwarded_count')) {
      const [name, now] = this.args;
      const row = this.db.aliases.get(name);
      if (!row || row.status !== 'active' || row.expires_at <= now) return { success: true, meta: { changes: 0 } };
      row.forwarded_count += 1;
      return { success: true, meta: { changes: 1 } };
    }
    throw new Error(`Unsupported run: ${this.sql}`);
  }
}

class FakeD1 {
  constructor() {
    this.aliases = new Map();
    this.receipts = new Map();
    this.deliveries = new Map();
    this.counters = new Map();
    this.locks = new Map();
  }
  prepare(sql) { return new FakeStatement(this, sql); }
  async batch(statements) {
    const results = [];
    for (const statement of statements) results.push(await statement.run());
    return results;
  }
}

class FakeKV {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
}

function aliasRequest(body, payment) {
  return new Request('https://pointcast.xyz/api/post-office/alias', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(payment ? { 'Payment-Signature': payment } : {}),
    },
    body: JSON.stringify(body),
  });
}

function paymentFor(accepted, nonce = '1', payer = '0x1111111111111111111111111111111111111111') {
  const now = Math.floor(Date.now() / 1000);
  return encodeBase64Json({
    x402Version: 2,
    scheme: 'exact',
    network: accepted.network,
    accepted,
    payload: {
      signature: `0x${'11'.repeat(65)}`,
      permit2Authorization: {
        from: payer,
        permitted: { token: accepted.asset, amount: accepted.amount },
        spender: '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E',
        nonce,
        deadline: String(now + 30),
        witness: { to: accepted.payTo, validAfter: String(now), extra: '0x' },
      },
    },
  });
}

const body = {
  name: 'field-agent',
  forward: { kind: 'email', target: 'agent@example.com' },
};

test('alias rules reject reserved, malformed, looped, and private webhook targets', () => {
  assert.throws(() => parseAliasInput({ ...body, name: 'admin' }), /reserved/u);
  assert.throws(() => parseAliasInput({ ...body, name: 'Bad_Name' }), /lowercase/u);
  assert.throws(() => parseAliasInput({ ...body, forward: { kind: 'email', target: 'x@agents.pointcast.xyz' } }), /cannot point back/u);
  assert.throws(() => parseAliasInput({ ...body, forward: { kind: 'webhook', target: 'https://127.0.0.1/hook' } }), /public HTTPS/u);
});

test('alias endpoint quotes x402, settles through a fake facilitator, and writes one private registry row', async () => {
  const db = new FakeD1();
  const pair = testKeypair();
  const env = { AUTH_DB: db, X402_RECEIPT_SK: pair.privateKeyBase64, X402_MODE: 'test' };
  const quote = await handleAliasRequest(aliasRequest(body), env, pair.publicKeyBase64);
  assert.equal(quote.status, 402);
  const terms = decodeBase64Json(quote.headers.get('payment-required'));
  assert.equal(terms.accepts[0].amount, '10000');
  assert.match(terms.resource.description, /field-agent@agents\.pointcast\.xyz/u);

  const originalFetch = globalThis.fetch;
  let facilitatorCalls = 0;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'https://exp-faci.bubbletez.com/settle');
    facilitatorCalls += 1;
    return Response.json({ success: true, txHash: `0x${'ab'.repeat(32)}` });
  };
  try {
    const response = await handleAliasRequest(
      aliasRequest(body, paymentFor(terms.accepts[0])),
      env,
      pair.publicKeyBase64,
      new Date('2026-09-03T18:00:00.000Z'),
    );
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.alias, 'field-agent@agents.pointcast.xyz');
    assert.equal(payload.expiresAt, '2026-10-03T18:00:00.000Z');
    assert.equal(payload.receipt.spend.loop, 'post-office-alias');
    assert.equal(facilitatorCalls, 1);
    const stored = db.aliases.get('field-agent');
    assert.equal(stored.forward_target, 'agent@example.com');
    assert.equal(stored.owner, '0x1111111111111111111111111111111111111111');
    assert.match(stored.receipt_hash, /^[0-9a-f]{64}$/u);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('public alias and registry responses omit owner and forwarding target', async () => {
  const db = new FakeD1();
  db.aliases.set('field-agent', {
    name: 'field-agent', forward_kind: 'email', forward_target: 'private@example.com',
    owner: '0x1111111111111111111111111111111111111111', receipt_hash: 'a'.repeat(64),
    created_at: '2026-09-03T18:00:00.000Z', renewed_at: '2026-09-03T18:00:00.000Z',
    expires_at: '2026-10-03T18:00:00.000Z', forwarded_count: 7, status: 'active',
  });
  const now = new Date('2026-09-04T00:00:00.000Z');
  const status = await handleAliasStatus({ AUTH_DB: db }, 'field-agent', now);
  const statusText = await status.text();
  assert.doesNotMatch(statusText, /private@example|0x111111/u);
  assert.deepEqual(JSON.parse(statusText), {
    alias: 'field-agent@agents.pointcast.xyz', status: 'active', since: '2026-09-03T18:00:00.000Z',
    expiresAt: '2026-10-03T18:00:00.000Z', count: 7, agentId: null,
  });
  const registryText = await (await registryResponse({ AUTH_DB: db }, now)).text();
  assert.doesNotMatch(registryText, /private@example|0x111111|forward_target/u);
  assert.equal(JSON.parse(registryText).aliases[0].receiptHashShort, 'aaaaaaaaaaaa');
});

test('active renewal is payer-owned, uses a new receipt, and extends the current term by 30 days', async () => {
  const db = new FakeD1();
  db.aliases.set('field-agent', activeAlias('email', 'old@example.com'));
  const pair = testKeypair();
  const env = { AUTH_DB: db, X402_RECEIPT_SK: pair.privateKeyBase64, X402_MODE: 'test' };
  const renewalBody = { ...body, forward: { kind: 'email', target: 'new@example.com' } };
  const quote = await handleAliasRequest(aliasRequest(renewalBody), env, pair.publicKeyBase64);
  const accepted = decodeBase64Json(quote.headers.get('payment-required')).accepts[0];

  let facilitatorCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    facilitatorCalls += 1;
    return Response.json({ success: true, txHash: `0x${'cd'.repeat(32)}` });
  };
  try {
    const denied = await handleAliasRequest(
      aliasRequest(renewalBody, paymentFor(accepted, '2', '0x2222222222222222222222222222222222222222')),
      env,
      pair.publicKeyBase64,
      new Date('2026-09-10T18:00:00.000Z'),
    );
    assert.equal(denied.status, 409);
    assert.equal(facilitatorCalls, 0);

    const renewed = await handleAliasRequest(
      aliasRequest(renewalBody, paymentFor(accepted, '3')),
      env,
      pair.publicKeyBase64,
      new Date('2026-09-10T18:00:00.000Z'),
    );
    assert.equal(renewed.status, 200);
    assert.equal((await renewed.json()).expiresAt, '2026-11-02T18:00:00.000Z');
    assert.equal(db.aliases.get('field-agent').forward_target, 'new@example.com');
    assert.equal(db.receipts.size, 1);
    assert.equal(facilitatorCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function activeAlias(kind, target) {
  return {
    name: 'field-agent', forward_kind: kind, forward_target: target,
    owner: '0x1111111111111111111111111111111111111111', receipt_hash: 'a'.repeat(64),
    created_at: '2026-09-03T18:00:00.000Z', renewed_at: '2026-09-03T18:00:00.000Z',
    expires_at: '2026-10-03T18:00:00.000Z', forwarded_count: 0, status: 'active',
  };
}

const inboundEmail = {
  from: 'Sender <sender@example.com>',
  to: ['field-agent@agents.pointcast.xyz'],
  subject: 'Original note',
  text: 'First line\nSecond line',
  receivedAt: '2026-09-03T19:00:00.000Z',
};

test('email aliases forward a quoted attachment-free body through a fake mail adapter and increment only the counter', async () => {
  const db = new FakeD1();
  db.aliases.set('field-agent', activeAlias('email', 'private@example.com'));
  const kv = new FakeKV();
  const messages = [];
  const response = await routePostOfficeInbound({
    AUTH_DB: db,
    PC_RATES_KV: kv,
    SEND_EMAIL: { async send(message) { messages.push(message); return { messageId: 'mail-1' }; } },
  }, 'webhook-email-1', inboundEmail, { now: new Date('2026-09-03T19:01:00.000Z') });
  const outcome = await response.json();
  assert.deepEqual(outcome.providerAcceptance, { accepted: true });
  assert.deepEqual(outcome.delivery, { forwarded: 1, bounced: false, duplicate: 0, rateLimited: 0, failed: 0 });
  assert.equal(messages[0].to, 'private@example.com');
  assert.equal(messages[0].from.email, 'post@agents.pointcast.xyz');
  assert.match(messages[0].text, /> First line\n> Second line/u);
  assert.equal('attachments' in messages[0], false);
  assert.match(messages[0].headers['Idempotency-Key'], /^post-office:[0-9a-f]{64}$/u);
  assert.equal(messages[0].headers['X-PointCast-Delivery-Id'], messages[0].headers['Idempotency-Key'].slice('post-office:'.length));
  assert.equal(db.aliases.get('field-agent').forwarded_count, 1);
});

test('webhook aliases sign canonical JSON, retry once, and suppress a replay with an opaque D1 reservation', async () => {
  const db = new FakeD1();
  db.aliases.set('field-agent', activeAlias('webhook', 'https://agent.example/hook'));
  const kv = new FakeKV();
  const pair = testKeypair();
  const calls = [];
  const fetcher = async (input, init) => {
    calls.push({ input: String(input), init });
    return calls.length === 1 ? new Response('retry', { status: 503 }) : new Response(null, { status: 204 });
  };
  const env = { AUTH_DB: db, PC_RATES_KV: kv, X402_RECEIPT_SK: pair.privateKeyBase64 };
  const response = await routePostOfficeInbound(env, 'webhook-hook-1', inboundEmail, {
    fetcher,
    now: new Date('2026-09-03T19:01:00.000Z'),
  });
  assert.equal((await response.json()).forwarded, 1);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].input, 'https://agent.example/hook');
  assert.equal(calls[1].init.headers['X-PointCast-Key-Id'], X402_TREASURY_AGENT_ID);
  assert.equal(calls[1].init.headers['Idempotency-Key'], `post-office:${calls[1].init.headers['X-PointCast-Delivery-Id']}`);
  const envelope = JSON.parse(calls[1].init.body);
  assert.equal(envelope.spec, POST_OFFICE_ENVELOPE_SPEC);
  assert.equal(await verifyCanonicalPayload(calls[1].init.body, calls[1].init.headers['X-PointCast-Signature'], pair.publicKeyBase64), true);

  const replay = await routePostOfficeInbound(env, 'webhook-hook-1', inboundEmail, { fetcher });
  const replayBody = await replay.json();
  assert.deepEqual(replayBody.providerAcceptance, { accepted: true });
  assert.deepEqual(replayBody.delivery, { forwarded: 0, bounced: false, duplicate: 1, rateLimited: 0, failed: 0 });
  assert.equal(calls.length, 2);
  assert.equal([...kv.values.values()].some((value) => String(value).includes('sender@example.com')), false);
  assert.equal(db.deliveries.size, 1);
  assert.equal([...db.deliveries.values()][0].outcome, 'forwarded');
  assert.doesNotMatch(JSON.stringify([...db.deliveries.values()][0]), /sender@example|Original note|First line/u);
});

test('unknown aliases bounce once with the 402 terms URL and store no message content', async () => {
  const db = new FakeD1();
  const kv = new FakeKV();
  const messages = [];
  const env = {
    AUTH_DB: db,
    PC_RATES_KV: kv,
    SEND_EMAIL: { async send(message) { messages.push(message); return { messageId: 'bounce-1' }; } },
  };
  const response = await routePostOfficeInbound(env, 'webhook-missing-1', inboundEmail);
  assert.equal((await response.json()).bounced, true);
  assert.match(messages[0].text, /https:\/\/pointcast\.xyz\/api\/post-office\/alias/u);
  const replay = await routePostOfficeInbound(env, 'webhook-missing-1', inboundEmail);
  assert.equal((await replay.json()).duplicate, 1);
  assert.equal(messages.length, 1);
  assert.equal(db.aliases.size, 0);
});

test('D1 enforces the per-alias daily forwarding cap atomically', async () => {
  const db = new FakeD1();
  db.aliases.set('field-agent', activeAlias('email', 'private@example.com'));
  const kv = new FakeKV();
  const messages = [];
  const env = {
    AUTH_DB: db,
    PC_RATES_KV: kv,
    POST_OFFICE_ALIAS_DAILY_CAP: '1',
    POST_OFFICE_GLOBAL_DAILY_CAP: '10',
    SEND_EMAIL: { async send(message) { messages.push(message); return { messageId: 'mail-cap' }; } },
  };
  const now = new Date('2026-09-03T19:01:00.000Z');
  assert.equal((await (await routePostOfficeInbound(env, 'cap-1', inboundEmail, { now })).json()).forwarded, 1);
  const limited = await (await routePostOfficeInbound(env, 'cap-2', inboundEmail, { now })).json();
  assert.equal(limited.rateLimited, 1);
  assert.equal(limited.forwarded, 0);
  assert.equal(messages.length, 1);
  assert.equal(db.counters.get('2026-09-03:global'), 1);
  assert.equal([...db.deliveries.values()].filter((row) => row.outcome === 'rate_limited').length, 1);
});

test('migration and registry surfaces explicitly preserve the registry-not-mailbox contract', async () => {
  const [migration, deliveryMigration, inbound] = await Promise.all([
    readFile(new URL('../migrations/auth/0007_post_office_aliases.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/auth/0013_post_office_delivery_reservations.sql', import.meta.url), 'utf8'),
    readFile(new URL('../functions/_lib/post-office-inbound.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS aliases/u);
  assert.match(migration, /forwarded_count INTEGER NOT NULL DEFAULT 0/u);
  assert.doesNotMatch(migration, /subject|body|attachment|raw_mime/u);
  assert.match(deliveryMigration, /CREATE TABLE post_office_deliveries/u);
  assert.match(deliveryMigration, /CREATE TABLE post_office_daily_counters/u);
  assert.match(deliveryMigration, /UNIQUE/u);
  assert.doesNotMatch(deliveryMigration, /from_address|to_addresses|subject|body|attachment|raw_mime/u);
  assert.doesNotMatch(inbound, /post-office:processed|post-office:rate/u);
  const page = await readFile(new URL('../src/pages/post-office.astro', import.meta.url), 'utf8');
  assert.match(page, /An address for an agent/u);
  assert.match(page, /Never a mailbox/u);
  const agents = await readFile(new URL('../src/pages/agents.json.ts', import.meta.url), 'utf8');
  assert.match(agents, /postOffice: POST_OFFICE_DISCOVERY/u);
  const daily = await readFile(new URL('../workers/kennel-daily/src/index.ts', import.meta.url), 'utf8');
  assert.match(daily, /blockLine: `post office · \$\{newAliases\} new · \$\{renewedAliases\} renewed`/u);
  assert.doesNotMatch(daily, /postOfficeBlockId/u);
});
