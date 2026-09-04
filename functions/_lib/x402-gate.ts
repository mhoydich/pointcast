/**
 * Shared x402 gate for PointCast paid actions.
 *
 * The settlement and receipt code lives here so /api/x402/receipt and every
 * paid action validate exactly the same Permit2 payload, call the same
 * facilitator, and issue the same countersigned receipt shape.
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
  canonicalJson,
  decodeBase64Json,
  encodeBase64Json,
  importReceiptPrivateKey,
  isJsonRecord,
  signCanonicalPayload,
  verifyCanonicalPayload,
  type JsonRecord,
} from '../../src/lib/x402.ts';

const EXPLORER = 'https://explorer.etherlink.com/tx/';
const MAX_HEADER_B64 = 16_384;
const MAX_FACILITATOR_RESPONSE = 65_536;

export const X402_JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Payment-Signature, Content-Type',
  'Access-Control-Expose-Headers': 'Payment-Required, X-Payment-Response, X-Facilitator-Url',
  'Cache-Control': 'no-store',
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { ...X402_JSON_HEADERS, ...extra } });

const sameAddr = (a: unknown, b: unknown) =>
  typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

function unsignedInteger(value: unknown): bigint | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value);
  if (!/^\d+$/.test(text)) return null;
  try { return BigInt(text); } catch { return null; }
}

async function readBoundedText(response: Response): Promise<string> {
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

export interface X402ReceiptProduct {
  priceUnits?: string;
  resourceDescription?: string;
  merchantUrl?: string;
  loop?: string;
  context?: string;
  action?: string;
  beforeSettlement?: () => Promise<void>;
}

export class X402PreSettlementError extends Error {
  readonly status: number;
  readonly payload: Record<string, unknown>;

  constructor(
    status: number,
    payload: Record<string, unknown>,
  ) {
    super(typeof payload.error === 'string' ? payload.error : 'pre-settlement check failed');
    this.name = 'X402PreSettlementError';
    this.status = status;
    this.payload = payload;
  }
}

type X402Env = Cloudflare.Env & {
  VISITS?: KVNamespace;
  X402_PRICE_UNITS?: string;
  X402_PAY_TO?: string;
  X402_ASSET?: string;
  X402_FACILITATOR_URL?: string;
  X402_RECEIPT_SK?: string;
  X402_RECEIPT_AGENT_ID?: string;
  X402_MODE?: string;
};

interface D1StatementLike {
  bind(...values: unknown[]): D1StatementLike;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1StatementLike;
}

function requirements(env: X402Env, product: X402ReceiptProduct = {}) {
  const amount = product.priceUnits || env.X402_PRICE_UNITS || X402_DEFAULT_PRICE_UNITS;
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

function paymentRequired(env: X402Env, url: string, product: X402ReceiptProduct = {}) {
  return {
    x402Version: X402_VERSION,
    accepts: [requirements(env, product)],
    resource: {
      description: product.resourceDescription || 'PointCast countersigned spend receipt (pointcast.agent-payments/v1) — proof you paid PointCast on Etherlink.',
      mimeType: 'application/json',
      url,
    },
    error: null,
  };
}

export async function getRecentReceipts(
  env: Pick<X402Env, 'VISITS'>,
  action?: string | null,
  limit = 20,
): Promise<JsonRecord[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get('x402:recent');
  const ids: string[] = raw ? JSON.parse(raw) : [];
  const recent: JsonRecord[] = (await Promise.all(
    ids.slice(0, 50).map((id) => env.VISITS!.get(`x402:receipt:${id}`, 'json')),
  )).filter((receipt: unknown): receipt is JsonRecord => isJsonRecord(receipt));
  return (action ? recent.filter((receipt) => receipt.action === action) : recent)
    .slice(0, Math.max(0, Math.min(limit, 50)));
}

async function listRecent(env: X402Env, action: string | null): Promise<Response> {
  if (!env.VISITS) return json({ receipts: [], note: 'kv-not-bound' });
  const raw = await env.VISITS.get('x402:recent');
  const ids: string[] = raw ? JSON.parse(raw) : [];
  const matching = await getRecentReceipts(env, action, 50);
  return json({
    spec: X402_SPEC,
    rail: 'x402',
    network: X402_NETWORK,
    action: action || null,
    total_count: action ? matching.length : ids.length,
    receipts: matching.slice(0, 20),
  });
}

/** Core quote/settle/receipt flow used by the receipt route and action gate. */
export async function handleReceiptRequest(
  request: Request,
  env: X402Env,
  expectedPublicKey = X402_TREASURY_PUBLIC_KEY,
  product: X402ReceiptProduct = {},
): Promise<Response> {
  const url = new URL(request.url);
  if (url.searchParams.get('list')) return listRecent(env, url.searchParams.get('action'));

  const facilitator = (env.X402_FACILITATOR_URL || X402_DEFAULT_FACILITATOR).replace(/\/$/, '');
  const resourceUrl = `${url.origin}${url.pathname}`;
  const required = requirements(env, product);
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
      { 'Payment-Required': encodeBase64Json(paymentRequired(env, resourceUrl, product)), 'X-Facilitator-Url': facilitator },
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
  if (payload.x402Version !== X402_VERSION || payload.scheme !== X402_SCHEME) {
    return json({ error: 'Unsupported x402 payload' }, 400);
  }

  const accepted = isJsonRecord(payload.accepted) ? payload.accepted : {};
  for (const key of ['scheme', 'network', 'amount', 'payTo', 'asset'] as const) {
    const acceptedValue = String(accepted[key] ?? '');
    const requiredValue = String(required[key]);
    if (key === 'payTo' || key === 'asset'
      ? !sameAddr(acceptedValue, requiredValue)
      : acceptedValue !== requiredValue) {
      return json({ error: `Accepted terms mismatch on ${key}`, required }, 402);
    }
  }

  const paymentBody = isJsonRecord(payload.payload) ? payload.payload : {};
  const permit = isJsonRecord(paymentBody.permit2Authorization)
    ? paymentBody.permit2Authorization
    : null;
  const signature = paymentBody.signature;
  if (!permit || typeof signature !== 'string' || !/^0x(?:[0-9a-fA-F]{2})+$/.test(signature)) {
    return json({ error: 'Missing or invalid permit2Authorization/signature' }, 400);
  }
  const permitted = isJsonRecord(permit.permitted) ? permit.permitted : {};
  const witness = isJsonRecord(permit.witness) ? permit.witness : {};
  if (!sameAddr(permit.spender, X402_PROXY)) {
    return json({ error: 'spender must be the x402 Permit2 proxy', expected: X402_PROXY }, 400);
  }
  if (!sameAddr(permitted.token, required.asset)) return json({ error: 'Payment asset mismatch' }, 402);
  if (String(permitted.amount ?? '') !== required.amount) return json({ error: 'Payment amount mismatch' }, 402);
  if (!sameAddr(witness.to, required.payTo)) return json({ error: 'witness.to must equal payTo' }, 400);
  if (typeof permit.from !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(permit.from)) {
    return json({ error: 'Permit2 payer address is invalid' }, 400);
  }
  const nonce = unsignedInteger(permit.nonce);
  const deadline = unsignedInteger(permit.deadline);
  const validAfter = unsignedInteger(witness.validAfter);
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (nonce === null || deadline === null || validAfter === null) {
    return json({ error: 'Permit2 nonce/deadline/validAfter must be unsigned integers' }, 400);
  }
  if (deadline <= now || deadline > now + BigInt(required.maxTimeoutSeconds + 6)) {
    return json({ error: 'Permit2 deadline is expired or exceeds maxTimeoutSeconds' }, 400);
  }
  if (validAfter > deadline || validAfter > now + 6n) {
    return json({ error: 'Permit2 validAfter is outside the settlement window' }, 400);
  }
  if (witness.extra !== '0x') return json({ error: 'Permit2 witness.extra must be 0x' }, 400);

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

  if (product.beforeSettlement) {
    try {
      await product.beforeSettlement();
    } catch (error) {
      if (error instanceof X402PreSettlementError) return json(error.payload, error.status);
      console.error('[x402] pre-settlement reservation failed', error);
      return json({ error: 'Pre-settlement reservation failed; payment was not submitted.' }, 503);
    }
  }

  let settle: JsonRecord = {};
  try {
    const response = await fetch(`${facilitator}/settle`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ x402Version: X402_VERSION, paymentPayload: payload, paymentRequirements: required }),
    });
    const text = await readBoundedText(response);
    try {
      const decoded = JSON.parse(text) as unknown;
      settle = isJsonRecord(decoded) ? decoded : { response: decoded };
    } catch {
      settle = { raw: text.slice(0, 2000) };
    }
    if (!response.ok || settle.success === false) {
      return json({ error: 'Facilitator refused settlement', facilitator_status: response.status, facilitator_response: settle }, 402);
    }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    return json({ error: 'Facilitator unreachable or returned an invalid response', detail }, 502);
  }
  const transaction = isJsonRecord(settle.transaction) ? settle.transaction : {};
  const transactionCandidate = settle.txHash ?? transaction.hash ?? settle.transaction;
  const transactionHash = typeof transactionCandidate === 'string' ? transactionCandidate : null;
  if (!transactionHash || !/^0x[0-9a-fA-F]{64}$/.test(transactionHash)) {
    return json({ error: 'Settled but no valid tx hash returned', facilitator_response: settle }, 502);
  }

  const timestamp = new Date().toISOString();
  const blockId = `x402-${transactionHash.slice(2, 14)}`;
  const spend: JsonRecord = {
    agent: 'external',
    agent_id: null,
    loop: product.loop || 'x402',
    amount_usd: Number(required.amount) / 1e6,
    currency: 'usd',
    merchant: 'pointcast.xyz',
    merchant_url: product.merchantUrl || 'https://pointcast.xyz/x402',
    payee_agent: 'pointcast',
    payee_agent_id: X402_TREASURY_AGENT_ID,
    mode: env.X402_MODE === 'test' ? 'test' : 'live',
    status: 'settled',
    credential_type: 'onchain-permit2',
    context: product.context || 'x402 v2 payment on Etherlink settled through the TZ APAC facilitator; PointCast countersigns this receipt so the payer can prove the spend anywhere.',
  };
  const spendManifest = buildSpendManifest(spend, blockId, timestamp);
  const spendSignature = await signCanonicalPayload(spendManifest, signingKey);
  const signedSpend: JsonRecord = { ...spend, spec: X402_SPEC, signature: spendSignature, signing_alg: 'ed25519' };
  const receiptCore: JsonRecord = {
    id: blockId,
    timestamp,
    type: 'RECEIPT',
    ...(product.action ? { action: product.action } : {}),
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
      payer: permit.from,
      pay_to: required.payTo,
      tx: transactionHash,
      explorer: `${EXPLORER}${transactionHash}`,
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

  const receiptPayload = buildCanonicalReceiptPayload(receiptCore);
  const receiptSignature = await signCanonicalPayload(receiptPayload, signingKey);
  const receipt: JsonRecord = {
    ...receiptCore,
    receipt_payload: receiptPayload,
    receipt_signature: {
      alg: 'EdDSA', key_type: 'OKP', crv: 'Ed25519', kid: X402_TREASURY_AGENT_ID, value: receiptSignature,
    },
  };

  if (env.VISITS) {
    try {
      await env.VISITS.put(`x402:receipt:${transactionHash}`, JSON.stringify(receipt), { expirationTtl: 60 * 60 * 24 * 365 });
      const raw = await env.VISITS.get('x402:recent');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      await env.VISITS.put('x402:recent', JSON.stringify([transactionHash, ...ids.filter((id) => id !== transactionHash)].slice(0, 50)));
    } catch {
      // Public receipt retention is best-effort; settlement itself is already final.
    }
  }

  const paymentResponse = encodeBase64Json({
    success: true,
    txHash: transactionHash,
    network: X402_NETWORK,
    gasPayer: 'facilitator',
    explorer: `${EXPLORER}${transactionHash}`,
    receipt_id: blockId,
  });
  return json(receipt, 200, { 'X-Payment-Response': paymentResponse, 'X-Facilitator-Url': facilitator });
}

export interface PaidTotals {
  count: number;
  houseUnits: number;
  networkUnits: number;
}

export interface PaidActionTotals extends PaidTotals {
  action: string;
}

type SplitEnv = X402Env & { AUTH_DB?: D1DatabaseLike };

interface TotalsRow {
  count: number | string | null;
  house_units: number | string | null;
  network_units: number | string | null;
}

interface ActionTotalsRow extends TotalsRow {
  action: string;
}

const zeroTotals = (): PaidTotals => ({ count: 0, houseUnits: 0, networkUnits: 0 });

function totalsFromRow(row: TotalsRow | null): PaidTotals {
  return {
    count: Number(row?.count ?? 0),
    houseUnits: Number(row?.house_units ?? 0),
    networkUnits: Number(row?.network_units ?? 0),
  };
}

export async function getPaidTotals(db: D1DatabaseLike | undefined, action?: string): Promise<PaidTotals> {
  if (!db) return zeroTotals();
  const statement = action
    ? db.prepare(`
        SELECT COUNT(*) AS count,
               COALESCE(SUM(house_units), 0) AS house_units,
               COALESCE(SUM(network_units), 0) AS network_units
        FROM splits WHERE action = ?
      `).bind(action)
    : db.prepare(`
        SELECT COUNT(*) AS count,
               COALESCE(SUM(house_units), 0) AS house_units,
               COALESCE(SUM(network_units), 0) AS network_units
        FROM splits
      `);
  return totalsFromRow(await statement.first<TotalsRow>());
}

export async function getPaidTotalsByAction(db: D1DatabaseLike | undefined): Promise<PaidActionTotals[]> {
  if (!db) return [];
  const result = await db.prepare(`
    SELECT action, COUNT(*) AS count,
           COALESCE(SUM(house_units), 0) AS house_units,
           COALESCE(SUM(network_units), 0) AS network_units
    FROM splits GROUP BY action ORDER BY action ASC
  `).all<ActionTotalsRow>();
  return result.results.map((row) => ({ action: row.action, ...totalsFromRow(row) }));
}

export async function hashReceipt(receipt: JsonRecord): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(receipt)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function shortEvmAddress(address: string): string {
  return /^0x[0-9a-fA-F]{40}$/.test(address) ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'payer';
}

export interface X402GateOptions {
  action: string;
  priceUnits: string;
  maker: string;
  makerAddress?: string | null;
  resourceDescription?: string;
  merchantUrl?: string;
  context?: string;
  expectedPublicKey?: string;
  beforeSettlement?: () => Promise<void>;
}

export type X402GateResult =
  | { settled: false; response: Response }
  | {
      settled: true;
      response: Response;
      receipt: JsonRecord;
      receiptHash: string;
      payer: string;
      split: {
        action: string;
        amountUnits: number;
        houseUnits: number;
        networkUnits: number;
        maker: string;
        makerAddress: string | null;
        settledAt: string;
      };
    };

/** Quote or settle one paid action, then atomically record its 50/50 ledger row. */
export async function withX402(
  request: Request,
  env: SplitEnv,
  options: X402GateOptions,
): Promise<X402GateResult> {
  if (!env.AUTH_DB) {
    return { settled: false, response: json({ error: 'Split ledger is not configured; no payment was submitted.' }, 503) };
  }
  if (!/^\d+$/.test(options.priceUnits)) {
    return { settled: false, response: json({ error: 'Action price is not configured; no payment was submitted.' }, 503) };
  }
  const amount = Number(options.priceUnits);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    return { settled: false, response: json({ error: 'Action price is not configured; no payment was submitted.' }, 503) };
  }
  const maker = options.maker.trim().slice(0, 120);
  if (!maker) {
    return { settled: false, response: json({ error: 'Action maker is not configured; no payment was submitted.' }, 503) };
  }

  const response = await handleReceiptRequest(request, env, options.expectedPublicKey || X402_TREASURY_PUBLIC_KEY, {
    action: options.action,
    priceUnits: options.priceUnits,
    resourceDescription: options.resourceDescription,
    merchantUrl: options.merchantUrl,
    loop: `paid-town-${options.action}`,
    context: options.context,
    beforeSettlement: options.beforeSettlement,
  });
  if (response.status !== 200) return { settled: false, response };

  let receipt: JsonRecord;
  let payer: string;
  let settledAt: string;
  try {
    const decoded: unknown = await response.clone().json();
    if (!isJsonRecord(decoded) || !isJsonRecord(decoded.settlement)) throw new Error('invalid receipt');
    if (typeof decoded.settlement.payer !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(decoded.settlement.payer)) {
      throw new Error('invalid payer');
    }
    receipt = decoded;
    payer = decoded.settlement.payer;
    settledAt = typeof decoded.timestamp === 'string' ? decoded.timestamp : new Date().toISOString();
  } catch {
    return { settled: false, response: json({ error: 'Payment settled but the signed receipt could not be read; contact abuse@pointcast.xyz.' }, 502) };
  }

  const receiptHash = await hashReceipt(receipt);
  const houseUnits = Math.floor(amount / 2);
  const networkUnits = amount - houseUnits;
  const makerAddress = options.makerAddress?.trim() || null;
  try {
    const write = await env.AUTH_DB.prepare(`
      INSERT INTO splits
        (receipt_hash, action, amount_units, house_units, network_units, maker, maker_address, settled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(receipt_hash) DO NOTHING
    `).bind(receiptHash, options.action, amount, houseUnits, networkUnits, maker, makerAddress, settledAt).run();
    if ((write.meta.changes ?? 0) !== 1) {
      const existing = await env.AUTH_DB.prepare(`
        SELECT action, amount_units, house_units, network_units, maker, maker_address, settled_at
        FROM splits WHERE receipt_hash = ? LIMIT 1
      `).bind(receiptHash).first<{
        action: string;
        amount_units: number;
        house_units: number;
        network_units: number;
        maker: string;
        maker_address: string | null;
        settled_at: string;
      }>();
      if (!existing
        || existing.action !== options.action
        || Number(existing.amount_units) !== amount
        || Number(existing.house_units) !== houseUnits
        || Number(existing.network_units) !== networkUnits
        || existing.maker !== maker
        || (existing.maker_address ?? null) !== makerAddress) {
        throw new Error('receipt hash is already attached to a different split');
      }
      settledAt = existing.settled_at;
    }
  } catch (error) {
    console.error(JSON.stringify({
      message: 'paid town split write failed after settlement',
      action: options.action,
      receiptHash,
      error: error instanceof Error ? error.message : String(error),
    }));
    return {
      settled: false,
      response: json(
        { error: 'Payment settled but the split ledger write failed; contact abuse@pointcast.xyz.', receipt },
        502,
        Object.fromEntries(response.headers.entries()),
      ),
    };
  }

  return {
    settled: true,
    response,
    receipt,
    receiptHash,
    payer,
    split: { action: options.action, amountUnits: amount, houseUnits, networkUnits, maker, makerAddress, settledAt },
  };
}
