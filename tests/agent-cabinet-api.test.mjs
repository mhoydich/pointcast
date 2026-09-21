import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import utils from '@taquito/utils';
import signerModule from '@taquito/signer';

const { b58Encode, PrefixV2, encodeOpHash, stringToBytes } = utils;
const { InMemorySigner } = signerModule;
const ORIGIN = 'https://pointcast.xyz';
let server;
let api;
let shared;
let chainModule;
let receiptLookup;
let x402Gate;
let agentIdentityModule;
let publication;
let provenance;

before(async () => {
  server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  api = await server.ssrLoadModule('/functions/api/agent-cabinet/_handlers.ts');
  shared = await server.ssrLoadModule('/functions/api/agent-cabinet/_shared.ts');
  chainModule = await server.ssrLoadModule('/functions/api/agent-cabinet/_chain.ts');
  receiptLookup = await server.ssrLoadModule('/functions/api/x402/receipt/[txHash].ts');
  x402Gate = await server.ssrLoadModule('/functions/_lib/x402-gate.ts');
  agentIdentityModule = await server.ssrLoadModule('/functions/_lib/agent-identity.ts');
  publication = JSON.parse(await readFile(new URL('../src/data/agent-cabinet-publication.json', import.meta.url), 'utf8'));
  provenance = JSON.parse(await readFile(new URL('../src/data/agent-cabinet-provenance.json', import.meta.url), 'utf8'));
});
after(async () => server?.close());

class SqliteD1 {
  constructor(sql) {
    this.db = new DatabaseSync(':memory:');
    this.db.exec(sql);
  }
  prepare(sql) {
    let args = [];
    const owner = this;
    const execute = (mode) => {
      if (owner.failOn?.(sql)) throw new Error('database-unavailable');
      const statement = owner.db.prepare(sql);
      const value = mode === 'first'
        ? statement.get(...args) ?? null
        : mode === 'all'
          ? { results: statement.all(...args) }
          : { meta: { changes: Number(statement.run(...args).changes) } };
      if (owner.throwAfter?.(sql)) throw new Error('database-response-lost-after-commit');
      return value;
    };
    const result = {
      bind(...values) { args = values; return result; },
      async first() { return execute('first'); },
      async all() { return execute('all'); },
      async run() { return execute('run'); },
      execute,
    };
    return result;
  }
  async batch(statements) {
    this.db.exec('BEGIN');
    try {
      const result = statements.map((statement) => statement.execute('run'));
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

async function key(seed) {
  const secretKey = b58Encode(new Uint8Array(32).fill(seed), PrefixV2.Ed25519Seed);
  const signer = await InMemorySigner.fromSecretKey(secretKey);
  return { signer, secretKey, address: await signer.publicKeyHash(), publicKey: await signer.publicKey() };
}

function fakeChain() {
  let sequence = 0;
  return {
    readies: [], preflights: [], prepares: [], broadcasts: [], statuses: new Map(),
    async ready(counts) { this.readies.push(counts); if (this.readyError) throw this.readyError; },
    async preflight(row, budget) {
      this.preflights.push({ row, budget });
      if (this.preflightError) throw this.preflightError;
      return 1200;
    },
    async prepare(row, budget) {
      this.prepares.push({ row, budget });
      if (this.prepareError) throw this.prepareError;
      sequence += 1;
      const bytes = sequence.toString(16).padStart(2, '0').repeat(160);
      return { bytes, hash: encodeOpHash(bytes), maximumCostMutez: 1200 };
    },
    async broadcast(bytes) {
      this.broadcasts.push(bytes);
      if (this.broadcastError) throw this.broadcastError;
      return encodeOpHash(bytes);
    },
    async status(row) { return this.statuses.get(row.operation_hash) || 'pending'; },
  };
}

function fakePayment(mode = 'settled') {
  let sequence = 0;
  const gate = async (request, _env, options) => {
    gate.calls += 1;
    gate.requestHashes.push(options.requestHash);
    if (!request.headers.get('payment-signature')) {
      gate.quotes += 1;
      return { settled: false, response: new Response(JSON.stringify({ error: 'Payment Required' }), { status: 402, headers: { 'Payment-Required': 'test-quote' } }) };
    }
    try {
      await options.beforeSettlement?.();
    } catch (error) {
      if (mode === 'reservation-response-lost') {
        return x402Gate.withX402(
          new Request('https://pointcast.xyz/test-no-submission', { method: 'POST' }),
          {},
          { action: 'test', priceUnits: '1', maker: 'test' },
        );
      }
      return { settled: false, response: new Response(JSON.stringify(error.payload || { error: error.message }), { status: error.status || 503 }) };
    }
    gate.submissions += 1;
    if (mode === 'ambiguous') {
      return { settled: false, response: new Response(JSON.stringify({ settlement: 'ambiguous' }), { status: 502 }) };
    }
    sequence += 1;
    const tx = `0x${sequence.toString(16).padStart(64, '0')}`;
    const authorization = x402Gate.x402AuthorizationSummary(request.headers.get('payment-signature'));
    const payer = authorization?.owner || '0x1111111111111111111111111111111111111111';
    const pending = mode === 'observed-pending';
    const observation = {
      schema: 'pointcast.x402-settlement-observation/v1',
      outcome: pending ? 'pending' : 'settled',
      transaction: tx,
      network: 'eip155:42793',
      payer,
      amount: options.priceUnits,
      errorReason: pending ? 'settlement_pending' : null,
      facilitatorStatus: pending ? 202 : 200,
    };
    await options.afterSettlementObserved?.(observation);
    if (mode === 'observed-success-crash' || pending) {
      return {
        settled: false,
        response: new Response(JSON.stringify({
          settlement: pending ? 'pending' : 'observed',
          transaction: tx,
          network: observation.network,
          settlementObservation: observation,
        }), {
          status: pending ? 202 : 502,
          headers: { 'Payment-Response': Buffer.from(JSON.stringify({
            success: !pending,
            ...(pending ? { errorReason: 'settlement_pending' } : {}),
            transaction: tx,
            network: observation.network,
          })).toString('base64') },
        }),
        settlementObservation: observation,
      };
    }
    const receipt = {
      timestamp: new Date().toISOString(),
      action: 'cabinet_collect',
      request_hash: options.requestHash,
      resource_id: options.resourceId,
      action_result: { status: 'pending' },
      settlement: {
        tx,
        payer,
        network: 'eip155:42793',
        asset: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9',
        amount_units: options.priceUnits,
        pay_to: '0x48e8479b4906d45fbe702a18ac2454f800238b37',
      },
    };
    const proof = {
      receipt,
      receiptHash: await x402Gate.hashReceipt(receipt),
      payer: receipt.settlement.payer,
    };
    if (mode === 'split-ledger-failed') {
      return {
        settled: false,
        response: new Response(JSON.stringify({ error: 'split failed', receipt }), { status: 502 }),
        settlementProof: proof,
      };
    }
    return {
      settled: true,
      response: new Response(JSON.stringify(receipt), { status: 200, headers: { 'Payment-Response': 'settled' } }),
      ...proof,
      split: { action: options.action, amountUnits: Number(options.priceUnits), houseUnits: 5000, networkUnits: 5000, maker: options.maker, makerAddress: null, settledAt: receipt.timestamp },
    };
  };
  gate.calls = 0;
  gate.quotes = 0;
  gate.submissions = 0;
  gate.requestHashes = [];
  return gate;
}

const paymentNonces = new Map();
function fakePaymentHeader(label) {
  if (label && typeof label === 'object' && typeof label.raw === 'string') return label.raw;
  if (!paymentNonces.has(label)) paymentNonces.set(label, paymentNonces.size + 1);
  return Buffer.from(JSON.stringify({
    x402Version: 2,
    payload: {
      permit2Authorization: {
        from: '0x1111111111111111111111111111111111111111',
        permitted: {
          token: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9',
          amount: '10000',
        },
        spender: '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E',
        nonce: String(paymentNonces.get(label)),
        deadline: '2000000000',
        witness: {
          to: '0x48e8479b4906d45fbe702a18ac2454f800238b37',
          validAfter: '1700000000',
          extra: '0x',
        },
      },
      signature: '0x11',
    },
  })).toString('base64');
}

const post = (path, body, idempotency, payment, extraHeaders = {}) => new Request(`${ORIGIN}/api/agent-cabinet/${path}`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'idempotency-key': idempotency,
    ...(payment ? { 'payment-signature': fakePaymentHeader(payment) } : {}),
    ...extraHeaders,
  },
  body: JSON.stringify(body),
});

async function registerTestAgent(db, at) {
  db.db.exec(`CREATE TABLE IF NOT EXISTS agent_keys (
    key_id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, public_key TEXT NOT NULL,
    operator TEXT NOT NULL, scopes_json TEXT NOT NULL, expires_at TEXT NOT NULL,
    status TEXT NOT NULL, replaces_key_id TEXT, created_at TEXT NOT NULL,
    rotated_at TEXT, revoked_at TEXT
  )`);
  const keys = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const id = `pci_${'ab'.repeat(16)}`;
  const publicKey = Buffer.from(await crypto.subtle.exportKey('raw', keys.publicKey)).toString('base64');
  db.db.prepare(`INSERT INTO agent_keys
    (key_id,agent_id,public_key,operator,scopes_json,expires_at,status,replaces_key_id,created_at,rotated_at,revoked_at)
    VALUES(?,?,?,?,?,?,'active',NULL,?,NULL,NULL)`)
    .run('pck_test', id, publicKey, 'Agent Cabinet test', JSON.stringify(['cabinet:collect']), new Date(at + 60 * 60_000).toISOString(), new Date(at).toISOString());
  return { id, privateKey: keys.privateKey };
}

async function agentHeaders(agent, action, payload, at) {
  const requestHash = await agentIdentityModule.hashAgentActionRequest(action, payload);
  const timestamp = new Date(at).toISOString();
  const signed = agentIdentityModule.buildAgentRequestPayload(agent.id, timestamp, requestHash);
  const signature = Buffer.from(await crypto.subtle.sign('Ed25519', agent.privateKey, new TextEncoder().encode(signed))).toString('base64');
  return {
    'PointCast-Agent-Id': agent.id,
    'PointCast-Agent-Timestamp': timestamp,
    'PointCast-Agent-Signature': signature,
  };
}

async function setup(paymentMode = 'settled') {
  const migrations = await Promise.all([
    readFile(new URL('../migrations/auth/0020_other_worlds.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/auth/0021_agent_cabinet.sql', import.meta.url), 'utf8'),
  ]);
  const db = new SqliteD1(migrations.join('\n'));
  const operationHash = encodeOpHash('ef'.repeat(160));
  const livePublication = {
    ...publication,
    schema: 'pointcast.agent-cabinet.verified-publication/v1',
    status: 'minted',
    verified: true,
    verifiedAt: '2026-09-21T21:59:00.000Z',
    mainnetApproved: true,
    requestable: true,
    operationHash,
    level: 10_000_000,
    publisherAuthorization: {
      status: 'approved',
      administrator: publication.administrator,
      operationHash,
    },
    inventoryEvidence: provenance.items.map((item) => ({
      slug: item.slug,
      tokenId: String(item.id),
      metadataSha256: item.metadataSha256,
      artifactSha256: item.artifactSha256,
      totalSupply: item.editions,
      inventoryBalance: item.editions,
      confirmations: 2,
    })),
  };
  const env = {
    AUTH_DB: db,
    AGENT_CABINET_ENABLED: 'true',
    AGENT_CABINET_MAINNET_APPROVED: 'true',
    AGENT_CABINET_PUBLICATION_JSON: JSON.stringify(livePublication),
    AGENT_CABINET_SPONSOR_ADDRESS: publication.inventoryRecipient,
    AGENT_CABINET_SPONSOR_SECRET_KEY: 'test-secret-never-used-by-fake',
    AGENT_CABINET_RPC_URL: 'https://rpc.invalid',
    AGENT_CABINET_MAX_OPERATION_MUTEZ: '5000',
    AGENT_CABINET_TOTAL_BUDGET_MUTEZ: '500000',
    AGENT_CABINET_PRICE_UNITS: '10000',
    AGENT_CABINET_X402_PROFILE_APPROVED: 'pointcast.bubbletez-permit2-exact/v1',
  };
  const chain = fakeChain();
  const payment = fakePayment(paymentMode);
  let time = Date.parse('2026-09-21T22:00:00Z');
  const options = {
    now: () => time,
    chainFactory: async () => chain,
    statusChain: chain,
    paymentGate: payment,
    publicationRecord: livePublication,
  };
  return {
    db, env, chain, payment, options,
    currentTime() { return time; },
    advance(ms) { time += ms; },
    async challenge(identity, offer = 'listening-tile-001', idempotency = `challenge-${identity.address.slice(-8)}`, headers = {}) {
      const response = await api.handleCabinetChallenge(post('challenge', { offer, recipient: identity.address }, idempotency, undefined, headers), env, options);
      const result = await response.json();
      return { response, result, idempotency, offer, identity };
    },
    async proof(challenge) {
      return {
        offer: challenge.offer,
        recipient: challenge.identity.address,
        challengeId: challenge.result.challengeId,
        publicKey: challenge.identity.publicKey,
        signature: (await challenge.identity.signer.sign(challenge.result.payload)).prefixSig,
      };
    },
  };
}

const intentRows = (db) => db.db.prepare('SELECT * FROM agent_cabinet_intents ORDER BY created_at,id').all();
const locks = (db) => db.db.prepare('SELECT * FROM tezos_sponsor_locks').all();

test('prepared-only publication and environment gates fail closed before readiness or signing', async () => {
  const s = await setup();
  s.env.AGENT_CABINET_PUBLICATION_JSON = JSON.stringify(publication);
  const identity = await key(1);
  const response = await api.handleCabinetChallenge(post('challenge', { offer: 'listening-tile-001', recipient: identity.address }, 'prepared-only'), s.env, s.options);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'collection-not-enabled');
  assert.equal(s.chain.readies.length, 0);
  assert.equal(s.chain.prepares.length, 0);
});

test('a cookie-free agent gets exact Tezos approval, then an x402 quote without reserving inventory', async () => {
  const s = await setup();
  const identity = await key(2);
  const challenge = await s.challenge(identity);
  assert.equal(challenge.response.status, 201);
  assert.match(challenge.result.message, new RegExp(`Recipient: ${identity.address}`));
  assert.match(challenge.result.message, /FA2 contract: KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb/u);
  assert.match(challenge.result.message, /Payment: 10000 units/u);
  const body = await s.proof(challenge);
  const quote = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  assert.equal(quote.status, 402);
  assert.equal(quote.headers.get('payment-required'), 'test-quote');
  const row = intentRows(s.db)[0];
  assert.equal(row.approval_status, 'verified');
  assert.match(row.collect_request_hash, /^[a-f0-9]{64}$/u);
  assert.equal(s.payment.requestHashes.at(-1), row.collect_request_hash);
  assert.notEqual(row.collect_request_hash, row.request_hash);
  assert.equal(row.payment_status, 'required');
  assert.equal(row.delivery_status, 'blocked');
  assert.equal(s.chain.readies.length, 2, 'proof forces a fresh readiness audit before the quote');
  assert.equal(s.chain.preflights.length, 1, 'quote verifies one unsigned recipient-specific delivery estimate');
  assert.equal(s.chain.prepares.length, 0);
});

test('known delivery misconfiguration fails before an x402 quote or settlement attempt', async () => {
  const s = await setup();
  s.chain.preflightError = new shared.CabinetError('sponsor-balance-low', 503);
  const identity = await key(21);
  const challenge = await s.challenge(identity, 'listening-tile-001', 'preflight-fails-closed');
  const body = await s.proof(challenge);
  const response = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'sponsor-balance-low');
  assert.equal(s.payment.calls, 0);
  assert.equal(intentRows(s.db)[0].delivery_status, 'blocked');
  assert.equal(s.chain.prepares.length, 0);
});

test('the real preflight key guard rejects a sponsor secret for any other Tezos address without signing', async () => {
  const s = await setup();
  const config = await shared.configuration(s.env, s.options.publicationRecord);
  s.env.AGENT_CABINET_SPONSOR_SECRET_KEY = (await key(26)).secretKey;
  await assert.rejects(
    () => chainModule.assertCabinetSponsorKey(s.env, config),
    /sponsor-address-mismatch/u,
  );
  assert.equal(s.payment.calls, 0);
  assert.equal(s.chain.prepares.length, 0);
});

test('runtime payment terms cannot drift from the checked-in catalog', async () => {
  const s = await setup();
  s.env.AGENT_CABINET_PRICE_UNITS = '10001';
  const identity = await key(22);
  const response = await api.handleCabinetChallenge(post('challenge', { offer: 'listening-tile-001', recipient: identity.address }, 'mutated-payment-terms'), s.env, s.options);
  assert.equal(response.status, 503);
  assert.equal(s.chain.readies.length, 0);
  assert.equal(intentRows(s.db).length, 0);
});

test('idempotency, expiry, wallet substitution, and signature replay are bound to one immutable intent', async () => {
  const s = await setup();
  const first = await key(3);
  const other = await key(4);
  const challenge = await s.challenge(first, 'night-shift-field-note', 'stable-challenge-key');
  const replay = await s.challenge(first, 'night-shift-field-note', 'stable-challenge-key');
  assert.equal(replay.response.status, 200);
  assert.equal(replay.result.intentId, challenge.result.intentId);
  const conflict = await s.challenge(other, 'night-shift-field-note', 'stable-challenge-key');
  assert.equal(conflict.response.status, 409);
  const proof = await s.proof(challenge);
  const substituted = { ...proof, recipient: other.address };
  assert.equal((await api.handleCabinetCollect(post('collect', substituted, challenge.idempotency), s.env, s.options)).status, 401);
  assert.equal((await api.handleCabinetCollect(post('collect', { ...proof, signature: 'edsiginvalid' }, challenge.idempotency), s.env, s.options)).status, 401);
  const expiring = await s.challenge(other, 'rain-crow-receipt', 'expires-challenge');
  const expiredProof = await s.proof(expiring);
  s.advance(300_001);
  assert.equal((await api.handleCabinetCollect(post('collect', expiredProof, expiring.idempotency), s.env, s.options)).status, 401);
  assert.equal(intentRows(s.db).filter((row) => row.delivery_status !== 'blocked').length, 0);
});

test('unauthenticated challenge creation is bounded per recipient and stale unpaid rows are pruned', async () => {
  const s = await setup();
  const identity = await key(25);
  for (let index = 0; index < 10; index += 1) {
    const challenge = await s.challenge(identity, 'listening-tile-001', `bounded-challenge-${index}`);
    assert.equal(challenge.response.status, 201);
  }
  const limited = await s.challenge(identity, 'listening-tile-001', 'bounded-challenge-overflow');
  assert.equal(limited.response.status, 429);
  assert.equal(limited.result.error, 'too-many-challenges');
  assert.equal(intentRows(s.db).length, 10);
  s.advance(60_001);
  assert.equal((await s.challenge(identity, 'listening-tile-001', 'bounded-challenge-after-window')).response.status, 201);
  s.advance(24 * 60 * 60_000 + 300_001);
  const fresh = await s.challenge(identity, 'listening-tile-001', 'bounded-challenge-after-retention');
  assert.equal(fresh.response.status, 201);
  assert.equal(intentRows(s.db).length, 1, 'only the fresh unpaid challenge remains after retention cleanup');
});

test('a pinned wallet proof cannot quote or settle after its five-minute consent expires', async () => {
  const s = await setup();
  const identity = await key(23);
  const challenge = await s.challenge(identity, 'listening-tile-001', 'expired-pinned-proof');
  const body = await s.proof(challenge);
  assert.equal((await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options)).status, 402);
  s.advance(300_001);
  const expired = await api.handleCabinetCollect(post('collect', body, challenge.idempotency, 'late-payment'), s.env, s.options);
  assert.equal(expired.status, 401);
  assert.equal((await expired.json()).error, 'challenge-expired');
  assert.equal(s.payment.submissions, 0);
  assert.equal(intentRows(s.db)[0].approval_status, 'expired');
  assert.equal(intentRows(s.db)[0].delivery_status, 'blocked');
});

test('payment settlement is durable and separate from one exact sponsored FA2 delivery', async () => {
  const s = await setup();
  const identity = await key(5);
  const challenge = await s.challenge(identity, 'listening-tile-001', 'paid-delivery-key');
  const body = await s.proof(challenge);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  const paid = await api.handleCabinetCollect(post('collect', body, challenge.idempotency, 'authorization-one'), s.env, s.options);
  const paidBody = await paid.json();
  assert.equal(paid.status, 202);
  assert.equal(paidBody.intent.status, 'payment-settled');
  assert.equal(paidBody.intent.next.action, 'resume-delivery');
  assert.equal(paid.headers.get('retry-after'), '2');
  assert.equal(paidBody.intent.proofs.combinedReceipt, null);
  assert.equal(paidBody.receipt.settlement.tx, paidBody.intent.lanes.payment.transactionHash);
  const durableReceipt = await receiptLookup.handleReceiptByTransaction(
    { AUTH_DB: s.db },
    paidBody.receipt.settlement.tx,
  );
  assert.equal(durableReceipt.status, 200);
  assert.deepEqual((await durableReceipt.json()).receipt, paidBody.receipt);
  assert.equal(s.payment.submissions, 1);
  assert.equal(s.chain.prepares.length, 0, 'payment request never signs a Tezos operation');
  assert.equal(intentRows(s.db)[0].maximum_cost_mutez, 5000, 'payment atomically reserves the conservative delivery ceiling');
  const retiredOfferRow = { ...intentRows(s.db)[0], offer_slug: 'retired-offer' };
  const retiredOfferConfig = await shared.settledDeliveryConfiguration(s.env, retiredOfferRow);
  assert.equal(retiredOfferConfig.items[0].slug, 'retired-offer',
    'an immutable paid row remains reconstructable after its offer leaves the current catalog');
  assert.equal(retiredOfferConfig.items[0].tokenId, retiredOfferRow.token_id);
  // New sales may be paused and future catalog/economic settings may rotate,
  // but the exact paid row remains the authority for its owed delivery.
  s.env.AGENT_CABINET_ENABLED = 'false';
  s.env.AGENT_CABINET_MAINNET_APPROVED = 'false';
  s.env.AGENT_CABINET_PUBLICATION_JSON = '{}';
  s.env.AGENT_CABINET_PRICE_UNITS = '999999';
  s.env.X402_PAY_TO = '0x2222222222222222222222222222222222222222';
  s.env.AGENT_CABINET_SPONSOR_ADDRESS = (await key(33)).address;
  s.env.AGENT_CABINET_TOTAL_BUDGET_MUTEZ = '1';
  const delivered = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  const deliveredBody = await delivered.json();
  assert.equal(delivered.status, 202);
  assert.equal(deliveredBody.intent.lanes.delivery.status, 'submitted');
  assert.equal(deliveredBody.intent.next.action, 'poll-status');
  assert.equal(delivered.headers.get('retry-after'), '4');
  assert.equal(s.payment.submissions, 1, 'delivery replay cannot submit payment again');
  assert.equal(s.chain.prepares.length, 1);
  assert.equal(intentRows(s.db)[0].maximum_cost_mutez, 1200, 'signed preparation refines its own reservation without double-counting');
  assert.equal(s.chain.broadcasts.length, 1);
  assert.equal(intentRows(s.db)[0].signed_bytes, s.chain.broadcasts[0]);
  assert.equal(locks(s.db)[0].owner_kind, 'agent-cabinet');
  const operationHash = deliveredBody.intent.lanes.delivery.operationHash;
  s.chain.statuses.set(operationHash, 'confirmed');
  delete s.env.AGENT_CABINET_SPONSOR_SECRET_KEY;
  const status = await api.handleCabinetStatus(new Request(`${ORIGIN}/api/agent-cabinet/status?id=${challenge.result.intentId}`), s.env, s.options);
  assert.equal((await status.json()).intent.status, 'complete');
  assert.equal(s.chain.broadcasts.length, 1, 'GET only reconciles and never broadcasts');
  assert.equal(locks(s.db).length, 0);
});

test('revoking optional caller attribution cannot strand an already-paid wallet-approved delivery', async () => {
  const s = await setup();
  const recipient = await key(29);
  const agent = await registerTestAgent(s.db, s.currentTime());
  const offer = 'night-shift-field-note';
  const challengeHeaders = await agentHeaders(agent, 'agent-cabinet:challenge', { offer, recipient: recipient.address }, s.currentTime());
  const challenge = await s.challenge(recipient, offer, 'attributed-delivery-recovery', challengeHeaders);
  assert.equal(challenge.response.status, 201);
  const body = await s.proof(challenge);
  const collectHeaders = await agentHeaders(agent, 'agent-cabinet:collect', body, s.currentTime());
  assert.equal((await api.handleCabinetCollect(post('collect', body, challenge.idempotency, undefined, collectHeaders), s.env, s.options)).status, 402);
  const paid = await api.handleCabinetCollect(post('collect', body, challenge.idempotency, 'attributed-payment', collectHeaders), s.env, s.options);
  assert.equal(paid.status, 202);
  assert.equal((await paid.json()).intent.status, 'payment-settled');
  s.db.db.prepare("UPDATE agent_keys SET status='revoked',revoked_at=? WHERE agent_id=?")
    .run(new Date(s.currentTime()).toISOString(), agent.id);

  const resumed = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  assert.equal(resumed.status, 202);
  assert.equal((await resumed.json()).intent.lanes.delivery.status, 'submitted');
  assert.equal(s.payment.submissions, 1);
});

test('ambiguous payment holds its edition and is never submitted a second time', async () => {
  const s = await setup('ambiguous');
  const identity = await key(6);
  const challenge = await s.challenge(identity, 'listening-tile-001', 'ambiguous-payment');
  const body = await s.proof(challenge);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  const first = await api.handleCabinetCollect(post('collect', body, challenge.idempotency, 'ambiguous-auth'), s.env, s.options);
  assert.equal(first.status, 202);
  assert.equal((await first.json()).intent.status, 'payment-ambiguous');
  const repeat = await api.handleCabinetCollect(post('collect', body, challenge.idempotency, 'ambiguous-auth'), s.env, s.options);
  assert.equal(repeat.status, 202);
  assert.equal(s.payment.submissions, 1);
  assert.equal(intentRows(s.db)[0].delivery_status, 'reserved');
  assert.equal(s.chain.prepares.length, 0);
});

test('concurrent identical Payment-Signature retries cannot roll back the winning settlement reservation', async () => {
  const s = await setup();
  const identity = await key(43);
  const challenge = await s.challenge(identity, 'listening-tile-001', 'concurrent-identical-authorization');
  const body = await s.proof(challenge);

  let arrivals = 0;
  let releaseArrivals;
  let releaseWinner;
  const bothArrived = new Promise((resolve) => { releaseArrivals = resolve; });
  const winnerMayFinish = new Promise((resolve) => { releaseWinner = resolve; });
  const paymentGate = async (request, _env, options) => {
    paymentGate.calls += 1;
    if (!request.headers.get('payment-signature')) {
      return {
        settled: false,
        response: new Response(JSON.stringify({ error: 'Payment Required' }), {
          status: 402,
          headers: { 'Payment-Required': 'test-quote' },
        }),
      };
    }

    arrivals += 1;
    if (arrivals === 2) releaseArrivals();
    await bothArrived;
    try {
      await options.beforeSettlement?.();
    } catch {
      // Use the real gate's locally branded pre-submission response so this
      // exercises the production rollback classification, not a lookalike.
      return x402Gate.withX402(
        new Request('https://pointcast.xyz/test-no-submission', { method: 'POST' }),
        {},
        { action: 'test', priceUnits: '1', maker: 'test' },
      );
    }

    paymentGate.submissions += 1;
    await winnerMayFinish;
    const authorization = x402Gate.x402AuthorizationSummary(request.headers.get('payment-signature'));
    const payer = authorization.owner;
    const tx = `0x${'43'.repeat(32)}`;
    const observation = {
      schema: 'pointcast.x402-settlement-observation/v1',
      outcome: 'settled',
      transaction: tx,
      network: 'eip155:42793',
      payer,
      amount: options.priceUnits,
      errorReason: null,
      facilitatorStatus: 200,
    };
    await options.afterSettlementObserved?.(observation);
    const receipt = {
      timestamp: new Date().toISOString(),
      action: 'cabinet_collect',
      request_hash: options.requestHash,
      resource_id: options.resourceId,
      action_result: { status: 'pending' },
      settlement: {
        tx,
        payer,
        network: 'eip155:42793',
        asset: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9',
        amount_units: options.priceUnits,
        pay_to: '0x48e8479b4906d45fbe702a18ac2454f800238b37',
      },
    };
    return {
      settled: true,
      response: new Response(JSON.stringify(receipt), { status: 200 }),
      receipt,
      receiptHash: await x402Gate.hashReceipt(receipt),
      payer,
      split: {
        action: options.action,
        amountUnits: Number(options.priceUnits),
        houseUnits: 5000,
        networkUnits: 5000,
        maker: options.maker,
        makerAddress: null,
        settledAt: receipt.timestamp,
      },
    };
  };
  paymentGate.calls = 0;
  paymentGate.submissions = 0;
  s.options.paymentGate = paymentGate;

  assert.equal((await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options)).status, 402);
  const rawAuthorization = fakePaymentHeader('concurrent-identical-authorization');
  const first = api.handleCabinetCollect(
    post('collect', body, challenge.idempotency, { raw: rawAuthorization }), s.env, s.options,
  );
  const second = api.handleCabinetCollect(
    post('collect', body, challenge.idempotency, { raw: rawAuthorization }), s.env, s.options,
  );

  const losingResponse = await Promise.race([first, second]);
  assert.equal(losingResponse.status, 503);
  let held = intentRows(s.db)[0];
  assert.equal(held.payment_status, 'settling', 'the losing retry cannot reset the winner to payment-required');
  assert.equal(held.delivery_status, 'reserved');
  assert.match(held.payment_attempt_id, /^[0-9a-f-]{36}$/u);
  assert.equal(JSON.parse(held.payment_attempt_json).paymentAttemptId, held.payment_attempt_id);

  releaseWinner();
  const responses = await Promise.all([first, second]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [202, 503]);
  held = intentRows(s.db)[0];
  assert.equal(held.payment_status, 'settled');
  assert.equal(held.delivery_status, 'reserved');
  assert.equal(paymentGate.submissions, 1, 'only the reservation winner may call the facilitator');

  const calls = paymentGate.calls;
  const replay = await api.handleCabinetCollect(
    post('collect', body, challenge.idempotency, { raw: rawAuthorization }), s.env, s.options,
  );
  assert.equal(replay.status, 202);
  assert.equal(paymentGate.calls, calls, 'a settled replay advances delivery without re-entering payment');
});

test('durable canonical settlement observations survive later failure or pending response without resubmission', async () => {
  for (const [mode, expectedOutcome] of [
    ['observed-success-crash', 'settled'],
    ['observed-pending', 'pending'],
  ]) {
    const s = await setup(mode);
    const identity = await key(mode === 'observed-pending' ? 42 : 41);
    const challenge = await s.challenge(identity, 'listening-tile-001', `observation-${expectedOutcome}`);
    const body = await s.proof(challenge);
    await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
    if (expectedOutcome === 'pending') {
      let lost = false;
      s.db.throwAfter = (sql) => {
        if (!lost && /SET payment_evidence_json=\?, last_error='settlement-observed'/u.test(sql)) {
          lost = true;
          return true;
        }
        return false;
      };
    }
    const paid = await api.handleCabinetCollect(
      post('collect', body, challenge.idempotency, `observation-auth-${expectedOutcome}`), s.env, s.options,
    );
    assert.equal(paid.status, 202, mode);
    const result = await paid.json();
    assert.equal(result.error, 'payment-outcome-ambiguous', mode);
    assert.equal(result.settlementObservation.outcome, expectedOutcome, mode);
    assert.match(result.settlementObservation.transaction, /^0x[0-9a-f]{64}$/u, mode);
    assert.equal(result.settlementObservation.network, 'eip155:42793', mode);
    assert.equal(result.intent.lanes.payment.transactionHash, result.settlementObservation.transaction, mode);
    assert.equal(result.intent.lanes.payment.network, 'eip155:42793', mode);
    assert.equal(result.intent.lanes.payment.settlementObservation.outcome, expectedOutcome, mode);

    const persisted = intentRows(s.db)[0];
    assert.equal(persisted.payment_status, 'ambiguous', mode);
    assert.equal(persisted.delivery_status, 'reserved', mode);
    const evidence = JSON.parse(persisted.payment_evidence_json);
    assert.equal(evidence.schema, 'pointcast.agent-cabinet-settlement-observation/v1', mode);
    assert.equal(evidence.authorizationHash, persisted.payment_authorization_hash, mode);
    assert.equal(evidence.requestHash, persisted.collect_request_hash, mode);
    assert.equal(evidence.resourceId, persisted.id, mode);
    assert.deepEqual(evidence.observation, result.settlementObservation, mode);
    assert.equal(persisted.payment_evidence_json.includes('signature'), false, mode);

    s.db.throwAfter = null;
    const calls = s.payment.calls;
    const repeat = await api.handleCabinetCollect(
      post('collect', body, challenge.idempotency, `observation-auth-${expectedOutcome}`), s.env, s.options,
    );
    assert.equal(repeat.status, 202, mode);
    assert.equal(s.payment.calls, calls, `${mode}: replay does not re-enter the payment gate`);
    assert.equal(s.payment.submissions, 1, `${mode}: facilitator is called exactly once`);
    const repeated = await repeat.json();
    assert.equal(repeated.intent.lanes.payment.transactionHash, result.settlementObservation.transaction, mode);
    assert.equal(repeated.intent.lanes.payment.network, 'eip155:42793', mode);

    const status = await api.handleCabinetStatus(
      new Request(`${ORIGIN}/api/agent-cabinet/status?id=${challenge.result.intentId}`), s.env, s.options,
    );
    assert.equal(status.status, 200, mode);
    const statusBody = await status.json();
    assert.equal(statusBody.intent.lanes.payment.transactionHash, result.settlementObservation.transaction, mode);
    assert.equal(statusBody.intent.lanes.payment.settlementObservation.outcome, expectedOutcome, mode);
    assert.equal(s.payment.submissions, 1, mode);
  }
});

test('a signed settlement receipt still settles the intent when split analytics persistence fails', async () => {
  const s = await setup('split-ledger-failed');
  const identity = await key(34);
  const challenge = await s.challenge(identity, 'rain-crow-receipt', 'split-failure-settlement');
  const body = await s.proof(challenge);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  const paid = await api.handleCabinetCollect(
    post('collect', body, challenge.idempotency, 'split-failure-auth'), s.env, s.options,
  );
  const result = await paid.json();
  assert.equal(paid.status, 202);
  assert.equal(result.intent.status, 'payment-settled');
  assert.equal(result.receipt.resource_id, challenge.result.intentId);
  assert.equal(s.payment.submissions, 1);
  assert.equal(intentRows(s.db)[0].payment_status, 'settled');
});

test('staged signed settlement evidence recovers a failed final intent write without resubmission', async () => {
  const s = await setup();
  const identity = await key(35);
  const challenge = await s.challenge(identity, 'night-shift-field-note', 'settlement-stage-recovery');
  const body = await s.proof(challenge);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  let failed = false;
  s.db.failOn = (sql) => {
    if (!failed && /SET payment_status='settled', payment_tx_hash=/u.test(sql)) {
      failed = true;
      return true;
    }
    return false;
  };
  const uncertain = await api.handleCabinetCollect(
    post('collect', body, challenge.idempotency, 'staged-settlement-auth'), s.env, s.options,
  );
  const uncertainBody = await uncertain.json();
  assert.equal(uncertain.status, 503);
  assert.equal(uncertainBody.error, 'settlement-persistence-uncertain');
  assert.match(uncertainBody.transactionHash, /^0x[0-9a-f]{64}$/u);
  assert.equal(s.payment.submissions, 1);
  let persisted = intentRows(s.db)[0];
  assert.equal(persisted.payment_status, 'settling');
  assert.ok(persisted.payment_evidence_json);
  assert.ok(persisted.payment_attempt_json);
  assert.equal(persisted.payment_attempt_json.includes('signature'), false, 'raw payer signature is never retained');

  s.db.failOn = null;
  const recovered = await api.handleCabinetStatus(
    new Request(`${ORIGIN}/api/agent-cabinet/status?id=${challenge.result.intentId}`), s.env, s.options,
  );
  assert.equal(recovered.status, 200);
  assert.equal((await recovered.json()).intent.status, 'payment-settled');
  persisted = intentRows(s.db)[0];
  assert.equal(persisted.payment_status, 'settled');
  assert.match(persisted.payment_tx_hash, /^0x[0-9a-f]{64}$/u);
  assert.equal(s.payment.submissions, 1);

  const delivery = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  assert.equal((await delivery.json()).intent.lanes.delivery.status, 'submitted');
  assert.equal(s.payment.submissions, 1);
});

test('a lost reservation response is rolled back when no facilitator submission occurred', async () => {
  const s = await setup('reservation-response-lost');
  const identity = await key(30);
  const challenge = await s.challenge(identity, 'listening-tile-001', 'reservation-response-lost');
  const body = await s.proof(challenge);
  assert.equal((await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options)).status, 402);
  let lost = false;
  s.db.throwAfter = (sql) => {
    if (!lost && /SET payment_status='settling', delivery_status='reserved'/u.test(sql)) {
      lost = true;
      return true;
    }
    return false;
  };
  const response = await api.handleCabinetCollect(
    post('collect', body, challenge.idempotency, 'reservation-response-loss-auth'),
    s.env,
    s.options,
  );
  assert.equal(response.status, 503);
  assert.equal(s.payment.submissions, 0);
  const persisted = intentRows(s.db)[0];
  assert.equal(persisted.payment_status, 'required');
  assert.equal(persisted.delivery_status, 'blocked');
  assert.equal(persisted.payment_authorization_hash, null);
  assert.equal(persisted.maximum_cost_mutez, 0);

  s.db.throwAfter = null;
  const retry = await api.handleCabinetCollect(
    post('collect', body, challenge.idempotency, 'reservation-response-loss-retry'),
    s.env,
    s.options,
  );
  assert.equal(retry.status, 202);
  assert.equal(s.payment.submissions, 1);
});

test('equivalent encodings of one Permit2 owner nonce cannot reserve two intents', async () => {
  const s = await setup();
  const firstIdentity = await key(31);
  const secondIdentity = await key(32);
  const first = await s.challenge(firstIdentity, 'listening-tile-001', 'semantic-auth-one');
  const second = await s.challenge(secondIdentity, 'night-shift-field-note', 'semantic-auth-two');
  const firstProof = await s.proof(first);
  const secondProof = await s.proof(second);
  await api.handleCabinetCollect(post('collect', firstProof, first.idempotency), s.env, s.options);
  await api.handleCabinetCollect(post('collect', secondProof, second.idempotency), s.env, s.options);
  const permit = {
    from: '0xA111111111111111111111111111111111111111',
    permitted: { token: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', amount: '10000' },
    spender: '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E',
    nonce: '987654321',
    deadline: '2000000000',
    witness: { to: '0x48e8479b4906d45fbe702a18ac2454f800238b37', validAfter: '1700000000', extra: '0x' },
  };
  const compact = Buffer.from(JSON.stringify({
    x402Version: 2,
    payload: { permit2Authorization: permit, signature: '0x11' },
  })).toString('base64');
  const reordered = Buffer.from(JSON.stringify({
    payload: { signature: '0x11', permit2Authorization: {
      witness: { extra: '0x', validAfter: 1700000000, to: permit.witness.to.toUpperCase() },
      nonce: 987654321,
      deadline: 2000000000,
      spender: permit.spender.toLowerCase(),
      permitted: { amount: 10000, token: permit.permitted.token.toLowerCase() },
      from: permit.from.toLowerCase(),
    } },
    x402Version: 2,
  })).toString('base64url');
  assert.equal(await x402Gate.x402AuthorizationHash(compact), await x402Gate.x402AuthorizationHash(reordered));

  const firstPaid = await api.handleCabinetCollect(
    post('collect', firstProof, first.idempotency, { raw: compact }), s.env, s.options,
  );
  assert.equal(firstPaid.status, 202);
  const replay = await api.handleCabinetCollect(
    post('collect', secondProof, second.idempotency, { raw: reordered }), s.env, s.options,
  );
  assert.equal(replay.status, 409);
  assert.equal((await replay.json()).error, 'payment-authorization-already-used');
  assert.equal(s.payment.submissions, 1);
  assert.equal(intentRows(s.db).filter((row) => row.delivery_status === 'reserved').length, 1);
});

test('concurrent buyers cannot settle beyond the atomically reserved Tezos delivery budget', async () => {
  const s = await setup();
  s.env.AGENT_CABINET_TOTAL_BUDGET_MUTEZ = '5000';
  const firstIdentity = await key(27);
  const secondIdentity = await key(28);
  const first = await s.challenge(firstIdentity, 'listening-tile-001', 'budget-race-one');
  const second = await s.challenge(secondIdentity, 'night-shift-field-note', 'budget-race-two');
  const firstProof = await s.proof(first);
  const secondProof = await s.proof(second);
  assert.equal((await api.handleCabinetCollect(post('collect', firstProof, first.idempotency), s.env, s.options)).status, 402);
  assert.equal((await api.handleCabinetCollect(post('collect', secondProof, second.idempotency), s.env, s.options)).status, 402);

  const responses = await Promise.all([
    api.handleCabinetCollect(post('collect', firstProof, first.idempotency, 'budget-auth-one'), s.env, s.options),
    api.handleCabinetCollect(post('collect', secondProof, second.idempotency, 'budget-auth-two'), s.env, s.options),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [202, 503]);
  const rejected = responses.find((response) => response.status === 503);
  assert.equal((await rejected.json()).error, 'sponsor-budget-limit');
  assert.equal(s.payment.submissions, 1, 'only one authorization reaches the facilitator settlement call');
  const rows = intentRows(s.db);
  assert.equal(rows.filter((row) => row.delivery_status === 'reserved').length, 1);
  assert.equal(rows.reduce((total, row) => total + row.maximum_cost_mutez, 0), 5000);
  const winnerIndex = responses.findIndex((response) => response.status === 202);
  const winner = winnerIndex === 0 ? first : second;
  const winnerProof = winnerIndex === 0 ? firstProof : secondProof;
  const delivery = await api.handleCabinetCollect(post('collect', winnerProof, winner.idempotency), s.env, s.options);
  assert.equal((await delivery.json()).intent.lanes.delivery.status, 'submitted');
  assert.equal(intentRows(s.db).find((row) => row.id === winner.result.intentId).maximum_cost_mutez, 1200);
});

test('one wallet cannot collect the same offer twice through fresh idempotency keys', async () => {
  const s = await setup();
  const identity = await key(7);
  const first = await s.challenge(identity, 'listening-tile-001', 'wallet-edition-one');
  const second = await s.challenge(identity, 'listening-tile-001', 'wallet-edition-two');
  const firstProof = await s.proof(first);
  const secondProof = await s.proof(second);
  await api.handleCabinetCollect(post('collect', firstProof, first.idempotency), s.env, s.options);
  await api.handleCabinetCollect(post('collect', secondProof, second.idempotency), s.env, s.options);
  assert.equal((await api.handleCabinetCollect(post('collect', firstProof, first.idempotency, 'wallet-payment-one'), s.env, s.options)).status, 202);
  const blocked = await api.handleCabinetCollect(post('collect', secondProof, second.idempotency, 'wallet-payment-two'), s.env, s.options);
  assert.equal(blocked.status, 409);
  assert.equal(s.payment.submissions, 1);
  assert.equal(intentRows(s.db).filter((row) => row.delivery_status !== 'blocked').length, 1);
});

test('the generic Tezos signer lock serializes Cabinet behind Other Worlds', async () => {
  const s = await setup();
  const identity = await key(8);
  const challenge = await s.challenge(identity, 'rain-crow-receipt', 'cross-rail-lock');
  const body = await s.proof(challenge);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency, 'cross-rail-payment'), s.env, s.options);
  s.db.db.prepare(`INSERT INTO other_worlds_challenges(nonce,address,artwork_id,origin,message,config_hash,expires_at,created_at)
    VALUES(?,?,?,?,?,?,?,?)`).run('ow-lock-nonce', identity.address, 1, ORIGIN, 'lock fixture', 'ow-config', Date.now() + 60_000, Date.now());
  s.db.db.prepare(`INSERT INTO other_worlds_claims(id,address,artwork_id,nonce,config_hash,contract,token_id,sponsor,metadata_sha256,status,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,'reserved',?,?)`).run('ow_shared-signer', identity.address, 1, 'ow-lock-nonce', 'ow-config',
      publication.contract, '1', publication.inventoryRecipient, 'a'.repeat(64), Date.now(), Date.now());
  s.db.db.prepare(`INSERT INTO tezos_sponsor_locks(sponsor,owner_kind,owner_id,acquired_at) VALUES(?,'other-worlds',?,?)`)
    .run(publication.inventoryRecipient, 'ow_shared-signer', Date.now());
  let response = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  assert.equal((await response.json()).intent.lanes.delivery.status, 'reserved');
  assert.equal(s.chain.prepares.length, 0);
  const otherWorldsHash = encodeOpHash('ab'.repeat(160));
  s.db.db.prepare("UPDATE other_worlds_claims SET status='submitted',operation_hash=? WHERE id='ow_shared-signer'")
    .run(otherWorldsHash);
  s.options.otherWorldsStatus = async (row) => row.operation_hash === otherWorldsHash ? 'confirmed' : 'pending';
  response = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  assert.equal((await response.json()).intent.lanes.delivery.status, 'submitted');
  assert.equal(s.chain.prepares.length, 1);
  assert.equal(s.db.db.prepare("SELECT status FROM other_worlds_claims WHERE id='ow_shared-signer'").get().status, 'confirmed');
  assert.equal(locks(s.db)[0].owner_kind, 'agent-cabinet');
});

test('a stale non-broadcasting preparation resumes while retaining its own signer lock', async () => {
  const s = await setup();
  const identity = await key(9);
  const challenge = await s.challenge(identity, 'listening-tile-001', 'stale-preparation');
  const body = await s.proof(challenge);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency, 'stale-preparation-payment'), s.env, s.options);
  const row = intentRows(s.db)[0];
  s.db.db.prepare("UPDATE agent_cabinet_intents SET delivery_status='preparing',updated_at=? WHERE id=?")
    .run(row.updated_at, row.id);
  s.db.db.prepare(`INSERT INTO tezos_sponsor_locks(sponsor,owner_kind,owner_id,acquired_at) VALUES(?,'agent-cabinet',?,?)`)
    .run(row.sponsor, row.id, row.updated_at);
  s.advance(120_001);
  const response = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  assert.equal((await response.json()).intent.lanes.delivery.status, 'submitted');
  assert.equal(s.chain.prepares.length, 1);
  assert.equal(locks(s.db)[0].owner_id, row.id);
});

test('a lost D1 response after signed bytes commit retains the global signer lock', async () => {
  const s = await setup();
  const identity = await key(24);
  const challenge = await s.challenge(identity, 'night-shift-field-note', 'signed-commit-response-lost');
  const body = await s.proof(challenge);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  await api.handleCabinetCollect(post('collect', body, challenge.idempotency, 'signed-commit-payment'), s.env, s.options);
  let threw = false;
  s.db.throwAfter = (sql) => {
    if (!threw && /SET delivery_status='signed', signed_bytes=/u.test(sql)) {
      threw = true;
      return true;
    }
    return false;
  };
  const uncertain = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  assert.equal(uncertain.status, 202);
  const persisted = intentRows(s.db)[0];
  assert.equal(persisted.delivery_status, 'signed');
  assert.match(persisted.signed_bytes, /^[a-f0-9]+$/u);
  assert.match(persisted.operation_hash, /^o/u);
  assert.equal(locks(s.db)[0].owner_id, persisted.id);
  assert.equal(s.chain.broadcasts.length, 0);
  s.db.throwAfter = null;
  const resumed = await api.handleCabinetCollect(post('collect', body, challenge.idempotency), s.env, s.options);
  assert.equal((await resumed.json()).intent.lanes.delivery.status, 'submitted');
  assert.equal(s.chain.broadcasts.length, 1);
  assert.equal(s.chain.broadcasts[0], persisted.signed_bytes);
});

test('real readiness hashes each canonical artifact as well as its metadata', async () => {
  const s = await setup();
  const config = await shared.configuration(s.env, s.options.publicationRecord);
  const chain = await chainModule.createCabinetTezosChain(s.env, config);
  const bytes = new Map();
  for (const item of provenance.items) {
    bytes.set(item.metadataUri, await readFile(new URL(`../public/collectibles/agent-cabinet/metadata/${item.metadataSha256}.json`, import.meta.url), 'utf8'));
    bytes.set(item.artifactUri, await readFile(new URL(`../public${new URL(item.artifactUri).pathname}`, import.meta.url), 'utf8'));
  }
  const originalFetch = globalThis.fetch;
  let corruptArtifact = false;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    let value;
    if (url.pathname === '/chains/main/chain_id') value = shared.CABINET_CHAIN_ID;
    else if (url.pathname.endsWith('/bigmaps')) value = [{ ptr: 7, path: 'assets.token_metadata' }];
    else if (url.pathname.startsWith('/v1/bigmaps/')) {
      const tokenId = url.pathname.split('/').at(-1);
      const item = provenance.items.find((candidate) => String(candidate.id) === tokenId);
      value = { active: true, value: { token_info: { '': stringToBytes(item.metadataUri) } } };
    } else if (url.pathname === '/v1/tokens') {
      const tokenId = url.searchParams.get('tokenId');
      const item = provenance.items.find((candidate) => String(candidate.id) === tokenId);
      value = [{ standard: 'fa2', totalSupply: '27', metadata: JSON.parse(bytes.get(item.metadataUri)) }];
    } else if (url.pathname === '/v1/tokens/balances') value = [{ balance: '27' }];
    else if (bytes.has(String(input))) {
      const body = corruptArtifact && String(input) === provenance.items[0].artifactUri ? '<svg>substituted</svg>' : bytes.get(String(input));
      return new Response(body);
    } else throw new Error(`unexpected request ${url}`);
    return new Response(JSON.stringify(value));
  };
  try {
    await chain.ready({});
    corruptArtifact = true;
    await assert.rejects(() => chain.ready({}), /artifact-hash-mismatch/u);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
