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
 *   X402_RECEIPT_SK       Ed25519 private key, base64 PKCS8 DER. If unset the
 *                         receipt is still returned but `signature` is null.
 *   X402_RECEIPT_AGENT_ID pcr_ id whose public key is in agent-identities.json
 *   X402_MODE             "live" (default) | "test"  — labels the receipt only
 *
 * Storage: VISITS KV (already bound), keys `x402:receipt:<tx>` (1 year) and a
 * rolling `x402:recent` list (last 50). No IPs, no UAs — only what the
 * chain already makes public (payer address, tx hash, amount).
 */

interface Env {
  VISITS?: KVNamespace;
  X402_PAY_TO?: string;
  X402_FACILITATOR_URL?: string;
  X402_PRICE_UNITS?: string;
  X402_ASSET?: string;
  X402_RECEIPT_SK?: string;
  X402_RECEIPT_AGENT_ID?: string;
  X402_MODE?: string;
}

const NETWORK = 'eip155:42793'; // Etherlink mainnet
const CHAIN_ID = 42793;
const EXPLORER = 'https://explorer.etherlink.com/tx/';
const DEFAULT_FACILITATOR = 'https://exp-faci.bubbletez.com';
const DEFAULT_ASSET = '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9'; // USDC.e on Etherlink, 6 dec
const DEFAULT_PAY_TO = '0x48e8479b4906d45fbe702a18ac2454f800238b37'; // PointCast / DRUM MONEY owner wallet
const DEFAULT_PRICE_UNITS = '10000'; // $0.01
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const X402_PROXY = '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E';
const MAX_HEADER_B64 = 16384;
const SPEC = 'pointcast.agent-payments/v1';
const MANIFEST_FIELDS = [
  'agent', 'agent_id', 'amount_usd', 'currency', 'link_session_id', 'loop',
  'merchant', 'merchant_url', 'mode', 'payee_agent', 'payee_agent_id', 'status',
];

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Payment-Signature, Content-Type',
  'Access-Control-Expose-Headers': 'Payment-Required, X-Payment-Response, X-Facilitator-Url',
  'Cache-Control': 'no-store',
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { ...JSON_HEADERS, ...extra } });

const b64e = (obj: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
const b64d = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s))));
const sameAddr = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

function requirements(env: Env) {
  const amount = env.X402_PRICE_UNITS || DEFAULT_PRICE_UNITS;
  return {
    scheme: 'exact',
    network: NETWORK,
    amount,
    payTo: env.X402_PAY_TO || DEFAULT_PAY_TO,
    maxTimeoutSeconds: 60,
    asset: env.X402_ASSET || DEFAULT_ASSET,
    extra: { name: 'USDC', version: '2', assetTransferMethod: 'permit2' },
  };
}

function paymentRequired(env: Env, url: string) {
  return {
    x402Version: 2,
    accepts: [requirements(env)],
    resource: {
      description: 'PointCast countersigned spend receipt (pointcast.agent-payments/v1) — proof you paid PointCast on Etherlink.',
      mimeType: 'application/json',
      url,
    },
    error: null,
  };
}

async function signManifest(spend: Record<string, unknown>, blockId: string, timestamp: string, skB64?: string) {
  const m: Record<string, unknown> = {};
  for (const f of MANIFEST_FIELDS) if (spend[f] !== undefined && spend[f] !== null) m[f] = spend[f];
  m.block_id = blockId; m.block_timestamp = timestamp; m.spec = SPEC;
  const canonical = JSON.stringify(m, Object.keys(m).sort()) + '\n';
  if (!skB64) return { manifest: canonical, signature: null };
  try {
    const der = Uint8Array.from(atob(skB64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('pkcs8', der, { name: 'Ed25519' }, false, ['sign']);
    const sig = await crypto.subtle.sign('Ed25519', key, new TextEncoder().encode(canonical));
    return { manifest: canonical, signature: btoa(String.fromCharCode(...new Uint8Array(sig))) };
  } catch {
    return { manifest: canonical, signature: null };
  }
}

async function listRecent(env: Env) {
  if (!env.VISITS) return json({ receipts: [], note: 'kv-not-bound' });
  const raw = await env.VISITS.get('x402:recent');
  const ids: string[] = raw ? JSON.parse(raw) : [];
  const receipts = (await Promise.all(ids.slice(0, 20).map((id) => env.VISITS!.get(`x402:receipt:${id}`, 'json')))).filter(Boolean);
  return json({ spec: SPEC, rail: 'x402', network: NETWORK, total_count: ids.length, receipts });
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: JSON_HEADERS });

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const url = new URL(request.url);
  if (url.searchParams.get('list')) return listRecent(env);

  const facilitator = (env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR).replace(/\/$/, '');
  const resourceUrl = `${url.origin}${url.pathname}`;
  const required = requirements(env);
  const header = request.headers.get('Payment-Signature') || request.headers.get('payment-signature');

  if (!header) {
    return json(
      {
        error: 'Payment Required',
        message: 'Send a Payment-Signature header (x402 v2, Permit2 on Etherlink). Decode Payment-Required for terms.',
        price: { amount_units: required.amount, asset: required.asset, symbol: 'USDC', decimals: 6, usd: Number(required.amount) / 1e6 },
        network: NETWORK,
        facilitator,
        permit2: PERMIT2,
        x402_proxy: X402_PROXY,
        how: 'https://pointcast.xyz/x402',
      },
      402,
      { 'Payment-Required': b64e(paymentRequired(env, resourceUrl)), 'X-Facilitator-Url': facilitator },
    );
  }

  if (header.length > MAX_HEADER_B64) return json({ error: 'Payment-Signature too large' }, 400);
  let payload: any;
  try { payload = b64d(header); } catch { return json({ error: 'Payment-Signature is not base64 JSON' }, 400); }
  if (payload?.x402Version !== 2 || payload?.scheme !== 'exact') return json({ error: 'Unsupported x402 payload' }, 400);

  const accepted = payload.accepted || {};
  for (const k of ['scheme', 'network', 'amount', 'payTo', 'asset'] as const) {
    const a = String(accepted[k] ?? ''), r = String((required as any)[k]);
    if (k === 'payTo' || k === 'asset' ? !sameAddr(a, r) : a !== r) return json({ error: `Accepted terms mismatch on ${k}`, required }, 402);
  }
  const p2 = payload.payload?.permit2Authorization;
  const sig = payload.payload?.signature;
  if (!p2 || typeof sig !== 'string' || !sig.startsWith('0x')) return json({ error: 'Missing permit2Authorization/signature' }, 400);
  if (!sameAddr(p2.spender, X402_PROXY)) return json({ error: 'spender must be the x402 Permit2 proxy', expected: X402_PROXY }, 400);
  if (!sameAddr(p2.permitted?.token, required.asset)) return json({ error: 'Payment asset mismatch' }, 402);
  if (String(p2.permitted?.amount) !== required.amount) return json({ error: 'Payment amount mismatch' }, 402);
  if (!sameAddr(p2.witness?.to, required.payTo)) return json({ error: 'witness.to must equal payTo' }, 400);
  const deadline = Number(p2.deadline || 0), now = Math.floor(Date.now() / 1000);
  if (!deadline || deadline > now + required.maxTimeoutSeconds + 6) return json({ error: 'Permit2 deadline invalid or exceeds maxTimeoutSeconds' }, 400);

  // Settle via facilitator (it sponsors gas; payer only signed typed data).
  let settle: any;
  try {
    const r = await fetch(`${facilitator}/settle`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ x402Version: 2, paymentPayload: payload, paymentRequirements: required }),
    });
    const text = await r.text();
    try { settle = JSON.parse(text); } catch { settle = { raw: text.slice(0, 2000) }; }
    if (!r.ok || settle?.success === false) return json({ error: 'Facilitator refused settlement', facilitator_status: r.status, facilitator_response: settle }, 402);
  } catch (e: any) {
    return json({ error: 'Facilitator unreachable', detail: String(e?.message || e) }, 502);
  }
  const tx: string | null = settle?.txHash || settle?.transaction?.hash || (typeof settle?.transaction === 'string' ? settle.transaction : null);
  if (!tx) return json({ error: 'Settled but no tx hash returned', facilitator_response: settle }, 502);

  // Countersigned receipt — pointcast.agent-payments/v1 spend block + settlement extension.
  const timestamp = new Date().toISOString();
  const blockId = `x402-${tx.slice(2, 14)}`;
  const spend: Record<string, unknown> = {
    agent: 'external',
    agent_id: null,
    loop: 'x402',
    amount_usd: Number(required.amount) / 1e6,
    currency: 'usd',
    merchant: 'pointcast.xyz',
    merchant_url: 'https://pointcast.xyz/x402',
    payee_agent: 'pointcast',
    payee_agent_id: env.X402_RECEIPT_AGENT_ID || null,
    mode: env.X402_MODE === 'test' ? 'test' : 'live',
    status: 'settled',
    credential_type: 'onchain-permit2',
    context: 'x402 v2 payment on Etherlink settled through the TZ APAC facilitator; PointCast countersigns this receipt so the payer can prove the spend anywhere.',
  };
  const { manifest, signature } = await signManifest(spend, blockId, timestamp, env.X402_RECEIPT_SK);
  const receipt = {
    id: blockId,
    timestamp,
    type: 'RECEIPT',
    spend: { ...spend, signature, signing_alg: signature ? 'ed25519' : null, spec: SPEC },
    settlement: {
      rail: 'x402',
      x402_version: 2,
      scheme: 'exact',
      network: NETWORK,
      chain_id: CHAIN_ID,
      asset: required.asset,
      asset_symbol: 'USDC',
      amount_units: required.amount,
      payer: p2.from || null,
      pay_to: required.payTo,
      tx,
      explorer: `${EXPLORER}${tx}`,
      facilitator,
      gas_payer: 'facilitator',
    },
    manifest_signed: manifest,
    verify: { identities: 'https://pointcast.xyz/data/agent-identities.json', spec: 'https://pointcast.xyz/.well-known/agent-payments.json' },
  };

  if (env.VISITS) {
    try {
      await env.VISITS.put(`x402:receipt:${tx}`, JSON.stringify(receipt), { expirationTtl: 60 * 60 * 24 * 365 });
      const raw = await env.VISITS.get('x402:recent');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      await env.VISITS.put('x402:recent', JSON.stringify([tx, ...ids.filter((x) => x !== tx)].slice(0, 50)));
    } catch { /* ledger write is best-effort */ }
  }

  const xpr = b64e({ success: true, txHash: tx, network: NETWORK, gasPayer: 'facilitator', explorer: `${EXPLORER}${tx}`, receipt_id: blockId });
  return json(receipt, 200, { 'X-Payment-Response': xpr, 'X-Facilitator-Url': facilitator });
};
