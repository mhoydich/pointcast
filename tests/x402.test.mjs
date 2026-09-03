import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  X402_DISCOVERY,
  X402_TREASURY_AGENT_ID,
  X402_TREASURY_PUBLIC_KEY,
  buildCanonicalReceiptPayload,
  buildSpendManifest,
  canonicalJson,
  decodeBase64Json,
  encodeBase64Json,
  importReceiptPrivateKey,
  signCanonicalPayload,
  verifyX402Receipt,
} from '../src/lib/x402.ts';
import { onRequestGet as getKeys } from '../functions/api/x402/keys.ts';
import { handleReceiptRequest, onRequestGet as getReceipt } from '../functions/api/x402/receipt.ts';
import { verifyReceiptRequest } from '../functions/api/x402/verify.ts';

const root = new URL('../', import.meta.url);

function testKeypair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const pkcs8 = privateKey.export({ type: 'pkcs8', format: 'der' });
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  return {
    privateKeyBase64: pkcs8.toString('base64'),
    publicKeyBase64: spki.subarray(spki.length - 32).toString('base64'),
  };
}

function fixtureReceipt() {
  return {
    id: 'x402-0123456789ab',
    timestamp: '2026-09-03T18:00:00.000Z',
    type: 'RECEIPT',
    spend: {
      agent: 'external',
      agent_id: null,
      loop: 'x402',
      amount_usd: 0.01,
      currency: 'usd',
      merchant: 'pointcast.xyz',
      merchant_url: 'https://pointcast.xyz/x402',
      payee_agent: 'pointcast',
      payee_agent_id: X402_TREASURY_AGENT_ID,
      mode: 'test',
      status: 'settled',
      credential_type: 'onchain-permit2',
    },
    settlement: {
      rail: 'x402',
      x402_version: 2,
      scheme: 'exact',
      network: 'eip155:42793',
      chain_id: 42793,
      asset: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9',
      asset_symbol: 'USDC',
      amount_units: '10000',
      payer: '0x1111111111111111111111111111111111111111',
      pay_to: '0x48e8479b4906d45fbe702a18ac2454f800238b37',
      tx: '0x0123456789abcdef',
      explorer: 'https://explorer.etherlink.com/tx/0x0123456789abcdef',
      facilitator: 'https://exp-faci.bubbletez.com',
      gas_payer: 'facilitator',
    },
  };
}

async function signFixture() {
  const pair = testKeypair();
  const key = await importReceiptPrivateKey(pair.privateKeyBase64);
  const receipt = fixtureReceipt();
  const spendManifest = buildSpendManifest(receipt.spend, receipt.id, receipt.timestamp);
  receipt.spend.signature = await signCanonicalPayload(spendManifest, key);
  receipt.spend.signing_alg = 'ed25519';
  receipt.manifest_signed = spendManifest;
  receipt.receipt_payload = buildCanonicalReceiptPayload(receipt);
  receipt.receipt_signature = {
    alg: 'EdDSA',
    key_type: 'OKP',
    crv: 'Ed25519',
    kid: X402_TREASURY_AGENT_ID,
    value: await signCanonicalPayload(receipt.receipt_payload, key),
  };
  return { receipt, ...pair };
}

test('canonicalJson sorts nested receipt fields deterministically', () => {
  assert.equal(
    canonicalJson({ z: { b: 2, a: 1 }, a: [{ d: 4, c: 3 }] }),
    '{"a":[{"c":3,"d":4}],"z":{"a":1,"b":2}}',
  );
});

test('receipt signature round-trips with a raw Ed25519 public key and binds settlement', async () => {
  const { receipt, publicKeyBase64 } = await signFixture();
  const verified = await verifyX402Receipt(receipt, publicKeyBase64);
  assert.equal(verified.valid, true, verified.reason);

  const tampered = structuredClone(receipt);
  tampered.settlement.amount_units = '99999';
  const rejected = await verifyX402Receipt(tampered, publicKeyBase64);
  assert.equal(rejected.valid, false);
  assert.match(rejected.reason, /canonical|match/);
});

test('receipt endpoint quotes exact terms and countersigns a mocked settled transaction', async () => {
  const pair = testKeypair();
  const quote = await getReceipt({
    request: new Request('https://pointcast.xyz/api/x402/receipt'),
    env: {},
  });
  assert.equal(quote.status, 402);
  const required = decodeBase64Json(quote.headers.get('Payment-Required'));
  const accepted = required.accepts[0];
  assert.equal(accepted.amount, '10000');
  assert.equal(accepted.network, 'eip155:42793');
  assert.equal(accepted.extra.assetTransferMethod, 'permit2');

  const now = Math.floor(Date.now() / 1000);
  const payment = {
    x402Version: 2,
    scheme: 'exact',
    network: accepted.network,
    accepted,
    payload: {
      signature: `0x${'11'.repeat(65)}`,
      permit2Authorization: {
        from: '0x1111111111111111111111111111111111111111',
        permitted: { token: accepted.asset, amount: accepted.amount },
        spender: '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E',
        nonce: '1',
        deadline: String(now + 30),
        witness: { to: accepted.payTo, validAfter: String(now), extra: '0x' },
      },
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    txHash: `0x${'ab'.repeat(32)}`,
  }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const response = await handleReceiptRequest(
      new Request('https://pointcast.xyz/api/x402/receipt', {
        headers: { 'Payment-Signature': encodeBase64Json(payment) },
      }),
      { X402_RECEIPT_SK: pair.privateKeyBase64, X402_MODE: 'test' },
      pair.publicKeyBase64,
    );
    assert.equal(response.status, 200);
    const receipt = await response.json();
    assert.equal(receipt.spend.payee_agent_id, X402_TREASURY_AGENT_ID);
    assert.equal(receipt.settlement.tx, `0x${'ab'.repeat(32)}`);
    const verified = await verifyX402Receipt(receipt, pair.publicKeyBase64);
    assert.equal(verified.valid, true, verified.reason);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('receipt endpoint refuses settlement when the receipt key cannot be published', async () => {
  const signer = testKeypair();
  const published = testKeypair();
  const quote = await getReceipt({
    request: new Request('https://pointcast.xyz/api/x402/receipt'),
    env: {},
  });
  const required = decodeBase64Json(quote.headers.get('Payment-Required'));
  const accepted = required.accepts[0];
  const now = Math.floor(Date.now() / 1000);
  const payment = {
    x402Version: 2,
    scheme: 'exact',
    network: accepted.network,
    accepted,
    payload: {
      signature: `0x${'11'.repeat(65)}`,
      permit2Authorization: {
        from: '0x1111111111111111111111111111111111111111',
        permitted: { token: accepted.asset, amount: accepted.amount },
        spender: '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E',
        nonce: '2',
        deadline: String(now + 30),
        witness: { to: accepted.payTo, validAfter: String(now), extra: '0x' },
      },
    },
  };
  let facilitatorCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    facilitatorCalls += 1;
    return new Response('{}');
  };
  try {
    const response = await handleReceiptRequest(
      new Request('https://pointcast.xyz/api/x402/receipt', {
        headers: { 'Payment-Signature': encodeBase64Json(payment) },
      }),
      { X402_RECEIPT_SK: signer.privateKeyBase64 },
      published.publicKeyBase64,
    );
    assert.equal(response.status, 503);
    assert.equal(facilitatorCalls, 0);
    assert.match((await response.json()).error, /not submitted for settlement/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('verify endpoint accepts a base64 receipt and echoes the signed settled fields', async () => {
  const { receipt, publicKeyBase64 } = await signFixture();
  const encoded = Buffer.from(JSON.stringify(receipt), 'utf8').toString('base64');
  const request = new Request(`https://pointcast.xyz/api/x402/verify?receipt=${encodeURIComponent(encoded)}`);
  const response = await verifyReceiptRequest(request, publicKeyBase64);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.valid, true);
  assert.equal(body.signer.agent_id, X402_TREASURY_AGENT_ID);
  assert.equal(body.settled.tx, receipt.settlement.tx);
  assert.equal(body.settled.amount_units, '10000');
  assert.equal(body.settled.network, 'eip155:42793');
});

test('verify endpoint rejects a tampered receipt', async () => {
  const { receipt, publicKeyBase64 } = await signFixture();
  receipt.settlement.tx = '0xdeadbeef';
  const request = new Request('https://pointcast.xyz/api/x402/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ receipt }),
  });
  const response = await verifyReceiptRequest(request, publicKeyBase64);
  assert.equal(response.status, 422);
  assert.equal((await response.json()).valid, false);
});

test('keys endpoint publishes the registered raw key as an Ed25519 JWK for one hour', async () => {
  const response = await getKeys();
  const body = await response.json();
  assert.equal(response.headers.get('cache-control'), 'public, max-age=3600, s-maxage=3600');
  assert.equal(body.keys[0].kid, X402_TREASURY_AGENT_ID);
  assert.equal(body.keys[0].kty, 'OKP');
  assert.equal(body.keys[0].crv, 'Ed25519');
  assert.equal(body.keys[0].public_key_base64, X402_TREASURY_PUBLIC_KEY);

  const identities = JSON.parse(await readFile(new URL('src/data/agent-identities.json', root), 'utf8'));
  const treasury = identities.instances['pointcast-treasury-x402'];
  assert.equal(treasury.kind, 'treasury');
  assert.equal(treasury.created, '2026-09-03');
  assert.equal(treasury.public_key, body.keys[0].public_key_base64);
});

test('/agents.json carries the complete shared x402 discovery shape', async (t) => {
  assert.deepEqual(Object.keys(X402_DISCOVERY).filter((key) => ['endpoint', 'price', 'network', 'verify', 'keys'].includes(key)), [
    'endpoint',
    'price',
    'network',
    'verify',
    'keys',
  ]);
  assert.equal(X402_DISCOVERY.price.amount, '0.01');
  assert.equal(X402_DISCOVERY.price.currency, 'USDC');
  assert.equal(X402_DISCOVERY.network, 'eip155:42793');

  const source = await readFile(new URL('src/pages/agents.json.ts', root), 'utf8');
  assert.match(source, /import \{ X402_DISCOVERY \} from '\.\.\/lib\/x402';/);
  assert.match(source, /x402: X402_DISCOVERY,/);

  const built = new URL('dist/agents.json', root);
  if (!existsSync(built)) {
    t.diagnostic('dist/agents.json not present; built shape is checked after npm run build:bare');
    return;
  }
  const manifest = JSON.parse(await readFile(built, 'utf8'));
  assert.deepEqual(manifest.endpoints.x402, X402_DISCOVERY);
});
