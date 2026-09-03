/**
 * /api/x402/receipt — PointCast's first paid HTTP endpoint (x402 on Etherlink).
 *
 * The idea in one line: an agent GETs this URL, gets HTTP 402 with a
 * machine-readable price (0.01 USDC on Etherlink, Tezos' EVM L2), signs a
 * Permit2 authorization off-chain, retries with `Payment-Signature`, the
 * TZ APAC facilitator settles on-chain (it pays gas), and PointCast hands
 * back a **countersigned spend receipt** in the pointcast.agent-payments/v1
 * shape — the same shape /money already uses for Stripe Link receipts.
 *
 * So the dual-rail thesis ("Tezos = identity of artifact, rails = money of
 * action") gets its first live on-chain rail. The receipt is the product:
 * a portable proof that *this agent paid PointCast, on this chain, in this
 * tx*, verifiable by anyone with the public key in agent-identities.json.
 *
 * Protocol: x402 v2 (github.com/x402-foundation/x402), Permit2 witness
 * scheme as adapted for Etherlink by TZ APAC (tzapac/tzapac-x402-permit2).
 *
 * Flow:
 *   GET  /api/x402/receipt                     → 402 + `Payment-Required` (b64 JSON)
 *   GET  /api/x402/receipt  + Payment-Signature → validate, POST facilitator /settle,
 *                                                200 + receipt JSON + `X-Payment-Response`
 *   GET  /api/x402/receipt?list=1              → last receipts (public ledger, no auth)
 *
 * Env (all optional — sane mainnet defaults baked in):
 *   X402_PAY_TO           EVM address that receives USDC (default: PointCast EVM wallet)
 *   X402_FACILITATOR_URL  default https://exp-faci.bubbletez.com
 *   X402_PRICE_UNITS      USDC base units (6 dec). default "10000" = $0.01
 *   X402_ASSET            ERC-20 address. default USDC on Etherlink
 *   X402_RECEIPT_SK       Ed25519 private key, base64 PKCS8 DER. Required to
 *                         accept payment; quotes remain available when unset.
 *   X402_RECEIPT_AGENT_ID id whose public key is in agent-identities.json
 *   X402_MODE             "live" (default) | "test"  — labels the receipt only
 *
 * Storage: VISITS KV (already bound), keys `x402:receipt:<tx>` (1 year) and a
 * rolling `x402:recent` list (last 50). No IPs, no UAs — only what the
 * chain already makes public (payer address, tx hash, amount).
 */

import {
  X402_CHAIN_ID,
  X402_DEFAULT_ASSET,
  X402_DEFAULT_FACILITATOR,
  X402_DEFAULT_PAY_TO,
  X402_DEFAULT_PRICE_UNITS,
  X402_KEYS_ENDPOINT,
  X402_NETWORK,
  X402_PERMIT2,
  X402_PROXY,
  X402_SCHEME,
  X402_SPEC,
  X402_TREASURY_AGENT_ID,
  X402_TREASURY_PUBLIC_KEY,
  X402_VERIFY_ENDPOINT,
  X402_VERSION,
  buildCanonicalReceiptPayload,
  buildSpendManifest,
  decodeBase64Json,
  encodeBase64Json,
  importReceiptPrivateKey,
  isJsonRecord,
  signCanonicalPayload,
  verifyCanonicalPayload,
  type JsonRecord,
} from '../../../src/lib/x402.ts';

const EXPLORER = 'https://explorer.etherlink.com/tx/';
const MAX_HEADER_B64 = 16384;
const MAX_FACILITATOR_RESPONSE = 65_536;

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Payment-Signature, Content-Type',
  'Access-Control-Expose-Headers': 'Payment-Required, X-Payment-Response, X-Facilitator-Url',
  'Cache-Control': 'no-store',
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { ...JSON_HEADERS, ...extra } });

const sameAddr = (a: unknown, b: unknown) =>
  typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

function unsignedInteger(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value);
  if (!/^\d+$/.test(text)) return null;
  try { return BigInt(text); } catch { return null; }
}

async function readBoundedText(response: Response) {
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > MAX_FACILITATOR_RESPONSE) throw new Error('facilitator response too large');
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_FACILITATOR_RESPONSE) {
      await reader.cancel();
      throw new Error('facilitator response too large');
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function requirements(env: Cloudflare.Env) {
  const amount = env.X402_PRICE_UNITS || X402_DEFAULT_PRICE_UNITS;
  return {
    scheme: X402_SCHEME,
    network: X402_NETWORK,
    amount,
    payTo: env.X402_PAY_TO || X402_DEFAULT_PAY_TO,
    maxTimeoutSeconds: 60,
    asset: env.X402_ASSET || X402_DEFAULT_ASSET,
    extra: { name: 'USDC', version: '2', assetTransferMethod: 'permit2' },
  };
}

function paymentRequired(env: Cloudflare.Env, url: string) {
  return {
    x402Version: X402_VERSION,
    accepts: [requirements(env)],
    resource: {
      description: 'PointCast countersigned spend receipt (pointcast.agent-payments/v1) — proof you paid PointCast on Etherlink.',
      mimeType: 'application/json',
      url,
    },
    error: null,
  };
}

async function listRecent(env: Cloudflare.Env) {
  if (!env.VISITS) return json({ receipts: [], note: 'kv-not-bound' });
  const raw = await env.VISITS.get('x402:recent');
  const ids: string[] = raw ? JSON.parse(raw) : [];
  const receipts = (await Promise.all(ids.slice(0, 20).map((id) => env.VISITS!.get(`x402:receipt:${id}`, 'json')))).filter(Boolean);
  return json({ spec: X402_SPEC, rail: 'x402', network: X402_NETWORK, total_count: ids.length, receipts });
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: JSON_HEADERS });

export async function handleReceiptRequest(
  request: Request,
  env: Cloudflare.Env,
  expectedPublicKey = X402_TREASURY_PUBLIC_KEY,
) {
  const url = new URL(request.url);
  if (url.searchParams.get('list')) return listRecent(env);

  const facilitator = (env.X402_FACILITATOR_URL || X402_DEFAULT_FACILITATOR).replace(/\/$/, '');
  const resourceUrl = `${url.origin}${url.pathname}`;
  const required = requirements(env);
  const header = request.headers.get('Payment-Signature') || request.headers.get('payment-signature');

  if (!header) {
    return json(
      {
        error: 'Payment Required',
        message: 'Send a Payment-Signature header (x402 v2, Permit2 on Etherlink). Decode Payment-Required for terms.',
        price: { amount_units: required.amount, asset: required.asset, symbol: 'USDC', decimals: 6, usd: Number(required.amount) / 1e6 },
        network: X402_NETWORK,
        facilitator,
        permit2: X402_PERMIT2,
        x402_proxy: X402_PROXY,
        how: 'https://pointcast.xyz/x402',
      },
      402,
      { 'Payment-Required': encodeBase64Json(paymentRequired(env, resourceUrl)), 'X-Facilitator-Url': facilitator },
    );
  }

  if (header.length > MAX_HEADER_B64) return json({ error: 'Payment-Signature too large' }, 400);
  let payload: JsonRecord;
  try {
    const decoded = decodeBase64Json(header);
    if (!isJsonRecord(decoded)) throw new Error('payload is not an object');
    payload = decoded;
  } catch {
    return json({ error: 'Payment-Signature is not base64 JSON' }, 400);
  }
  if (payload.x402Version !== X402_VERSION || payload.scheme !== X402_SCHEME) return json({ error: 'Unsupported x402 payload' }, 400);

  const accepted = isJsonRecord(payload.accepted) ? payload.accepted : {};
  for (const k of ['scheme', 'network', 'amount', 'payTo', 'asset'] as const) {
    const a = String(accepted[k] ?? ''), r = String(required[k]);
    if (k === 'payTo' || k === 'asset' ? !sameAddr(a, r) : a !== r) return json({ error: `Accepted terms mismatch on ${k}`, required }, 402);
  }
  const paymentBody = isJsonRecord(payload.payload) ? payload.payload : {};
  const p2 = isJsonRecord(paymentBody.permit2Authorization) ? paymentBody.permit2Authorization : null;
  const sig = paymentBody.signature;
  if (!p2 || typeof sig !== 'string' || !/^0x(?:[0-9a-fA-F]{2})+$/.test(sig)) return json({ error: 'Missing or invalid permit2Authorization/signature' }, 400);
  const permitted = isJsonRecord(p2.permitted) ? p2.permitted : {};
  const witness = isJsonRecord(p2.witness) ? p2.witness : {};
  if (!sameAddr(p2.spender, X402_PROXY)) return json({ error: 'spender must be the x402 Permit2 proxy', expected: X402_PROXY }, 400);
  if (!sameAddr(permitted.token, required.asset)) return json({ error: 'Payment asset mismatch' }, 402);
  if (String(permitted.amount ?? '') !== required.amount) return json({ error: 'Payment amount mismatch' }, 402);
  if (!sameAddr(witness.to, required.payTo)) return json({ error: 'witness.to must equal payTo' }, 400);
  if (typeof p2.from !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(p2.from)) return json({ error: 'Permit2 payer address is invalid' }, 400);
  const nonce = unsignedInteger(p2.nonce);
  const deadline = unsignedInteger(p2.deadline);
  const validAfter = unsignedInteger(witness.validAfter);
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (nonce === null || deadline === null || validAfter === null) return json({ error: 'Permit2 nonce/deadline/validAfter must be unsigned integers' }, 400);
  if (deadline <= now || deadline > now + BigInt(required.maxTimeoutSeconds + 6)) return json({ error: 'Permit2 deadline is expired or exceeds maxTimeoutSeconds' }, 400);
  if (validAfter > deadline || validAfter > now + 6n) return json({ error: 'Permit2 validAfter is outside the settlement window' }, 400);
  if (witness.extra !== '0x') return json({ error: 'Permit2 witness.extra must be 0x' }, 400);

  // Never settle a payment unless PointCast can issue the promised signed receipt.
  let signingKey: CryptoKey;
  try {
    signingKey = await importReceiptPrivateKey(env.X402_RECEIPT_SK || '');
    const signerId = env.X402_RECEIPT_AGENT_ID || X402_TREASURY_AGENT_ID;
    if (signerId !== X402_TREASURY_AGENT_ID) throw new Error('receipt signer id does not match the published key');
    const keyCheck = 'pointcast.x402/receipt-key-check/v1\n';
    const keyCheckSignature = await signCanonicalPayload(keyCheck, signingKey);
    if (!await verifyCanonicalPayload(keyCheck, keyCheckSignature, expectedPublicKey)) {
      throw new Error('receipt private key does not match the published public key');
    }
  } catch {
    return json({ error: 'Receipt signer unavailable; payment was not submitted for settlement' }, 503);
  }

  // Settle via facilitator (it sponsors gas; payer only signed typed data).
  let settle: JsonRecord = {};
  try {
    const r = await fetch(`${facilitator}/settle`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ x402Version: X402_VERSION, paymentPayload: payload, paymentRequirements: required }),
    });
    const text = await readBoundedText(r);
    try {
      const decoded = JSON.parse(text) as unknown;
      settle = isJsonRecord(decoded) ? decoded : { response: decoded };
    } catch {
      settle = { raw: text.slice(0, 2000) };
    }
    if (!r.ok || settle.success === false) return json({ error: 'Facilitator refused settlement', facilitator_status: r.status, facilitator_response: settle }, 402);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    return json({ error: 'Facilitator unreachable or returned an invalid response', detail }, 502);
  }
  const transaction = isJsonRecord(settle.transaction) ? settle.transaction : {};
  const txCandidate = settle.txHash ?? transaction.hash ?? settle.transaction;
  const tx = typeof txCandidate === 'string' ? txCandidate : null;
  if (!tx || !/^0x[0-9a-fA-F]{64}$/.test(tx)) return json({ error: 'Settled but no valid tx hash returned', facilitator_response: settle }, 502);

  // Countersigned receipt — pointcast.agent-payments/v1 spend block + settlement extension.
  const timestamp = new Date().toISOString();
  const blockId = `x402-${tx.slice(2, 14)}`;
  const spend: JsonRecord = {
    agent: 'external',
    agent_id: null,
    loop: 'x402',
    amount_usd: Number(required.amount) / 1e6,
    currency: 'usd',
    merchant: 'pointcast.xyz',
    merchant_url: 'https://pointcast.xyz/x402',
    payee_agent: 'pointcast',
    payee_agent_id: X402_TREASURY_AGENT_ID,
    mode: env.X402_MODE === 'test' ? 'test' : 'live',
    status: 'settled',
    credential_type: 'onchain-permit2',
    context: 'x402 v2 payment on Etherlink settled through the TZ APAC facilitator; PointCast countersigns this receipt so the payer can prove the spend anywhere.',
  };
  const spendManifest = buildSpendManifest(spend, blockId, timestamp);
  const spendSignature = await signCanonicalPayload(spendManifest, signingKey);
  const signedSpend: JsonRecord = {
    ...spend,
    spec: X402_SPEC,
    signature: spendSignature,
    signing_alg: 'ed25519',
  };
  const receiptCore: JsonRecord = {
    id: blockId,
    timestamp,
    type: 'RECEIPT',
    spend: signedSpend,
    settlement: {
      rail: 'x402',
      x402_version: X402_VERSION,
      scheme: X402_SCHEME,
      network: X402_NETWORK,
      chain_id: X402_CHAIN_ID,
      asset: required.asset,
      asset_symbol: 'USDC',
      amount_units: required.amount,
      payer: p2.from,
      pay_to: required.payTo,
      tx,
      explorer: `${EXPLORER}${tx}`,
      facilitator,
      gas_payer: 'facilitator',
    },
    verify: {
      endpoint: X402_VERIFY_ENDPOINT,
      keys: X402_KEYS_ENDPOINT,
      identities: 'https://pointcast.xyz/data/agent-identities.json',
      spec: 'https://pointcast.xyz/.well-known/agent-payments.json',
    },
    manifest_signed: spendManifest,
  };

  // Keep the original spend-block signature for pointcast.agent-payments/v1
  // consumers, and add a full receipt signature binding every settled field.
  const receiptPayload = buildCanonicalReceiptPayload(receiptCore);
  const receiptSignature = await signCanonicalPayload(receiptPayload, signingKey);
  const receipt: JsonRecord = {
    ...receiptCore,
    receipt_payload: receiptPayload,
    receipt_signature: {
      alg: 'EdDSA',
      key_type: 'OKP',
      crv: 'Ed25519',
      kid: X402_TREASURY_AGENT_ID,
      value: receiptSignature,
    },
  };

  if (env.VISITS) {
    try {
      await env.VISITS.put(`x402:receipt:${tx}`, JSON.stringify(receipt), { expirationTtl: 60 * 60 * 24 * 365 });
      const raw = await env.VISITS.get('x402:recent');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      await env.VISITS.put('x402:recent', JSON.stringify([tx, ...ids.filter((x) => x !== tx)].slice(0, 50)));
    } catch { /* ledger write is best-effort */ }
  }

  const xpr = encodeBase64Json({ success: true, txHash: tx, network: X402_NETWORK, gasPayer: 'facilitator', explorer: `${EXPLORER}${tx}`, receipt_id: blockId });
  return json(receipt, 200, { 'X-Payment-Response': xpr, 'X-Facilitator-Url': facilitator });
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Cloudflare.Env }) =>
  handleReceiptRequest(request, env);
