/**
 * The sandbox rail: x402 v2 "exact" test USDC on Base Sepolia, settled through
 * the public x402.org testnet facilitator. Test money only. Nothing here can
 * move real funds: the network, the asset and the facilitator are fixed
 * constants, and the terms check refuses anything else.
 *
 * Asked for by Mike, 2026-11-01 ("Fold it in", "do all"), from the November
 * capability brief: a sandbox pay-per-call path on one PointCast tool, SDK
 * 2.27 or later, a $1 per-call cap and a daily ceiling, so one agent can pay
 * another before any real rail is used. Real USDC or mainnet needs his
 * separate yes; this file never reads a mainnet setting.
 *
 * Closed until both Pages variables are set:
 *   X402_SANDBOX_ENABLED=true
 *   X402_SANDBOX_PAY_TO=<a Base Sepolia address that receives test USDC>
 * Optional: X402_SANDBOX_DAILY_CEILING_USD (default 5, never above 20).
 */
import { HTTPFacilitatorClient, x402HTTPResourceServer, x402ResourceServer, type FacilitatorClient, type RouteConfig } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { getAddress, isAddressEqual, type Address } from 'viem';
import { baseRequestContext, protocolResponse } from './x402-base.ts';

export const SANDBOX_NETWORK = 'eip155:84532' as const; // Base Sepolia
export const SANDBOX_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const; // test USDC, no value
export const SANDBOX_FACILITATOR = 'https://x402.org/facilitator' as const;
export const PER_CALL_CAP_UNITS = 1_000_000; // $1.00 in 6-decimal USDC units
export const DEFAULT_DAILY_CEILING_USD = 5;
export const MAX_DAILY_CEILING_USD = 20;
const TZ = 'America/Los_Angeles';

export interface SandboxEnv {
  X402_SANDBOX_ENABLED?: string;
  X402_SANDBOX_PAY_TO?: string;
  X402_SANDBOX_DAILY_CEILING_USD?: string;
}

export type SandboxConfig =
  | { ready: true; payTo: Address; dailyCeilingUnits: number }
  | { ready: false; missing: string[] };

export function sandboxConfig(env: SandboxEnv): SandboxConfig {
  const missing: string[] = [];
  if ((env.X402_SANDBOX_ENABLED ?? '').trim() !== 'true') missing.push('X402_SANDBOX_ENABLED=true');
  let payTo: Address | null = null;
  try { payTo = getAddress((env.X402_SANDBOX_PAY_TO ?? '').trim()); } catch { missing.push('X402_SANDBOX_PAY_TO'); }
  if (missing.length || !payTo) return { ready: false, missing };
  const usd = Number(env.X402_SANDBOX_DAILY_CEILING_USD ?? DEFAULT_DAILY_CEILING_USD);
  const ceiling = Number.isFinite(usd) && usd > 0 ? Math.min(usd, MAX_DAILY_CEILING_USD) : DEFAULT_DAILY_CEILING_USD;
  return { ready: true, payTo, dailyCeilingUnits: Math.round(ceiling * 1_000_000) };
}

export const sandboxDay = (now = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));

/** "$0.37" for 370000 units. Whole cents only. */
export const unitsToPrice = (units: number) => `$${(units / 1_000_000).toFixed(2)}`;

const servers = new Map<string, Promise<x402HTTPResourceServer>>();

/** One SDK server per (route, price, payTo). Tests inject a facilitator. */
export function sandboxServer(cfg: Extract<SandboxConfig, { ready: true }>, route: string, units: number, description: string, facilitator?: FacilitatorClient) {
  const key = `${route}|${units}|${cfg.payTo}|${facilitator ? 'injected' : 'x402.org'}`;
  const cached = servers.get(key);
  if (cached) return cached;
  const client = facilitator ?? new HTTPFacilitatorClient({ url: SANDBOX_FACILITATOR });
  const resourceServer = new x402ResourceServer(client).register(SANDBOX_NETWORK, new ExactEvmScheme());
  const http402 = new x402HTTPResourceServer(resourceServer, {
    [route]: {
      description,
      mimeType: 'application/json',
      accepts: { scheme: 'exact', network: SANDBOX_NETWORK, payTo: cfg.payTo, price: unitsToPrice(units), maxTimeoutSeconds: 60 },
    } as RouteConfig,
  });
  const promise = http402.initialize().then(() => http402);
  promise.catch(() => servers.delete(key));
  servers.set(key, promise);
  return promise;
}

/** The payer, recipient, value and nonce the payment signs, read without trusting it. */
export function sandboxIdentity(header: string | undefined | null): { from: Address; to: Address; value: string; nonce: string } | null {
  if (!header) return null;
  try {
    const decoded = JSON.parse(atob(header)) as Record<string, any>;
    const auth = decoded?.payload?.authorization;
    if (decoded?.x402Version !== 2 || decoded?.accepted?.network !== SANDBOX_NETWORK || !auth) return null;
    if (!/^0x[0-9a-fA-F]{64}$/.test(String(auth.nonce)) || !/^\d+$/.test(String(auth.value))) return null;
    return { from: getAddress(auth.from), to: getAddress(auth.to), value: String(auth.value), nonce: String(auth.nonce).toLowerCase() };
  } catch {
    return null;
  }
}

/** Testnet, exact, test USDC, the agreed amount, under the cap, to our sandbox address. Fails closed. */
export function sandboxTermsOk(
  cfg: Extract<SandboxConfig, { ready: true }>,
  units: number,
  requirements: { network?: string; scheme?: string; asset?: string; amount?: string; payTo?: string },
  identity: { to: Address; value: string } | null,
): boolean {
  try {
    return units > 0 && units <= PER_CALL_CAP_UNITS
      && requirements.network === SANDBOX_NETWORK && requirements.scheme === 'exact'
      && isAddressEqual(getAddress(String(requirements.asset)), SANDBOX_USDC)
      && requirements.amount === String(units)
      && isAddressEqual(getAddress(String(requirements.payTo)), cfg.payTo)
      && !!identity && identity.value === String(units) && isAddressEqual(identity.to, cfg.payTo);
  } catch {
    return false;
  }
}

const LEDGER = [
  `CREATE TABLE IF NOT EXISTS x402_sandbox_payments (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    payer TEXT NOT NULL,
    nonce TEXT NOT NULL,
    units INTEGER NOT NULL,
    day TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('settling', 'settled', 'failed')),
    tx_hash TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE (payer, nonce)
  )`,
  'CREATE INDEX IF NOT EXISTS x402_sandbox_payments_day ON x402_sandbox_payments (day, status)',
];
const provisioned = new WeakMap<object, Promise<void>>();
export function ensureSandboxLedger(db: D1Database): Promise<void> {
  let pending = provisioned.get(db);
  if (!pending) {
    pending = (async () => { for (const s of LEDGER) await db.prepare(s).run(); })();
    pending.catch(() => provisioned.delete(db));
    provisioned.set(db, pending);
  }
  return pending;
}

/** Units spent or in flight today (settling counts, so the ceiling holds under concurrency). */
export async function spentToday(db: D1Database, day: string): Promise<number> {
  const row = await db.prepare("SELECT COALESCE(SUM(units), 0) AS n FROM x402_sandbox_payments WHERE day = ? AND status IN ('settling', 'settled')").bind(day).first<{ n: number }>();
  return Number(row?.n ?? 0);
}

export const SANDBOX_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Payment-Signature, X-Payment',
  'Access-Control-Expose-Headers': 'Payment-Required, Payment-Response, X-Payment-Response',
  'Cache-Control': 'private, no-store',
  'X-PointCast-Sandbox': 'testnet-only',
};
export const sandboxJson = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { ...SANDBOX_HEADERS, ...extra } });

export interface SandboxCharge {
  action: string;
  resourceId: string;
  units: number;
  description: string;
}

/**
 * Charge one sandbox payment for `charge`, or answer with the 402 quote.
 * Returns { settled: true, payer, tx } or { settled: false, response }.
 */
export async function chargeSandbox(
  request: Request,
  env: SandboxEnv & { AUTH_DB?: D1Database },
  charge: SandboxCharge,
  options: { facilitator?: FacilitatorClient; now?: number } = {},
): Promise<{ settled: true; payer: string; tx: string | null; units: number } | { settled: false; response: Response }> {
  const no = (body: Record<string, unknown>, status: number) => ({ settled: false as const, response: sandboxJson({ ok: false, sandbox: true, transactionSent: false, ...body }, status) });
  const cfg = sandboxConfig(env);
  if (!cfg.ready) return no({ code: 'sandbox_not_configured', missing: cfg.missing }, 503);
  if (!env.AUTH_DB) return no({ code: 'ledger_unavailable' }, 503);
  if (!Number.isSafeInteger(charge.units) || charge.units <= 0) return no({ code: 'nothing_to_charge' }, 400);
  if (charge.units > PER_CALL_CAP_UNITS) return no({ code: 'over_per_call_cap', capUsd: 1, askedUsd: charge.units / 1_000_000 }, 400);
  const db = env.AUTH_DB;
  await ensureSandboxLedger(db);
  const day = sandboxDay(options.now);
  if (await spentToday(db, day) + charge.units > cfg.dailyCeilingUnits) {
    return no({ code: 'daily_ceiling_reached', ceilingUsd: cfg.dailyCeilingUnits / 1_000_000, day }, 429);
  }

  const route = `POST ${new URL(request.url).pathname}`;
  const context = baseRequestContext(request);
  const identity = sandboxIdentity(context.paymentHeader);
  let server;
  let payment;
  try {
    server = await sandboxServer(cfg, route, charge.units, charge.description, options.facilitator);
    payment = await server.processHTTPRequest(context);
  } catch {
    return no({ code: 'facilitator_unavailable' }, 502);
  }
  if (payment.type === 'payment-error') return { settled: false, response: protocolResponse(payment.response) };
  if (payment.type !== 'payment-verified') return no({ code: 'payment_gate_misconfigured' }, 503);
  const cancel = async (status: number) => {
    try { await payment.cancellationDispatcher.cancel({ reason: 'handler_failed', responseStatus: status }); } catch { /* unsettled either way */ }
  };
  if (!identity || !sandboxTermsOk(cfg, charge.units, payment.paymentRequirements, identity)) {
    await cancel(400);
    return no({ code: 'payment_terms_mismatch' }, 400);
  }

  // Reserve the spend before settling, then re-check the ceiling with the reservation in.
  const id = `sbx_${crypto.randomUUID().replaceAll('-', '')}`;
  const now = options.now ?? Date.now();
  try {
    await db.prepare("INSERT INTO x402_sandbox_payments (id, action, resource_id, payer, nonce, units, day, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'settling', ?)")
      .bind(id, charge.action, charge.resourceId, identity.from.toLowerCase(), identity.nonce, charge.units, day, now).run();
  } catch {
    await cancel(409);
    return no({ code: 'authorization_already_used' }, 409);
  }
  if (await spentToday(db, day) > cfg.dailyCeilingUnits) {
    await db.prepare('DELETE FROM x402_sandbox_payments WHERE id = ?').bind(id).run();
    await cancel(429);
    return no({ code: 'daily_ceiling_reached', ceilingUsd: cfg.dailyCeilingUnits / 1_000_000, day }, 429);
  }

  let settled;
  try {
    settled = await server.processSettlement(
      payment.paymentPayload, payment.paymentRequirements, payment.declaredExtensions,
      { request: context, responseBody: new TextEncoder().encode('{}') as never, responseHeaders: { 'content-type': 'application/json' } },
      undefined, payment.beforeHandlerSettlement,
    );
  } catch {
    // Testnet money, but the reservation stays 'settling' so the ceiling still counts it.
    return no({ code: 'settlement_pending', retry: 'Unknown outcome on testnet. The reservation still counts toward today\'s ceiling.' }, 202);
  }
  if (!settled.success) {
    await db.prepare("UPDATE x402_sandbox_payments SET status = 'failed' WHERE id = ?").bind(id).run();
    return { settled: false, response: protocolResponse(settled.response) };
  }
  const tx = /^0x[0-9a-fA-F]{64}$/.test(settled.transaction ?? '') ? settled.transaction! : null;
  await db.prepare("UPDATE x402_sandbox_payments SET status = 'settled', tx_hash = ? WHERE id = ?").bind(tx, id).run();
  return { settled: true, payer: settled.payer || identity.from, tx, units: charge.units };
}
