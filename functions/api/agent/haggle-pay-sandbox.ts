/**
 * POST /api/agent/haggle-pay-sandbox — pay a struck Haggle Counter deal with
 * TEST money (x402 v2, test USDC on Base Sepolia, x402.org testnet facilitator).
 *
 *   Body: {"session": "h_..."}
 *   No Payment-Signature → 402 quote for the deal price.
 *   With Payment-Signature → settle on testnet, return a sandbox receipt.
 *
 * The practice run for agent-pays-agent: one AI haggles with Gus and pays
 * through here, another AI's sandbox address receives it. The deal's real
 * status is never touched: no stub is issued and the board is unchanged.
 * Caps: $1 per call, a daily ceiling (default $5). Real money goes through
 * /api/agent/haggle-pay, which this file does not call.
 */
import { tablesExist, type ShopEnv } from '../../_lib/shop-agents.ts';
import { chargeSandbox, ensureSandboxLedger, SANDBOX_HEADERS, SANDBOX_NETWORK, sandboxJson, type SandboxEnv } from '../../_lib/x402-sandbox.ts';
import { cents, itemById } from '../../../src/lib/haggle.ts';
import type { FacilitatorClient } from '@x402/core/server';

type Env = ShopEnv & SandboxEnv;
type Row = { id: string; item_id: string; who: string; status: string; deal_cents: number | null; stub_no: number | null };

export async function handleHagglePaySandbox(request: Request, env: Env, options: { facilitator?: FacilitatorClient; now?: number } = {}): Promise<Response> {
  if (!env.AUTH_DB || !await tablesExist(env.AUTH_DB)) return sandboxJson({ ok: false, sandbox: true, error: 'The Haggle Counter is not open; no payment was submitted.' }, 503);
  let body: Record<string, unknown> = {};
  try {
    const raw = (await request.clone().text()).slice(0, 4096);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') body = parsed;
  } catch { return sandboxJson({ ok: false, sandbox: true, error: 'invalid request body' }, 400); }
  const sessionId = typeof body.session === 'string' ? body.session.trim().slice(0, 40) : '';
  if (!sessionId) return sandboxJson({ ok: false, sandbox: true, error: 'Send {"session": "h_..."} for a struck deal.' }, 400);
  const row = await env.AUTH_DB.prepare('SELECT id, item_id, who, status, deal_cents, stub_no FROM haggle_sessions WHERE id = ?').bind(sessionId).first<Row>();
  if (!row) return sandboxJson({ ok: false, sandbox: true, error: 'No such haggle.' }, 404);
  if (row.status !== 'deal' || !row.deal_cents) return sandboxJson({ ok: false, sandbox: true, error: 'Only a struck, unpaid deal can be practice-paid. Haggle first.' }, 409);
  const item = itemById(row.item_id);
  if (!item) return sandboxJson({ ok: false, sandbox: true, error: 'Unknown item.' }, 409);
  await ensureSandboxLedger(env.AUTH_DB);
  const already = await env.AUTH_DB.prepare("SELECT id FROM x402_sandbox_payments WHERE action = 'haggle' AND resource_id = ? AND status IN ('settling', 'settled')").bind(row.id).first();
  if (already) return sandboxJson({ ok: false, sandbox: true, error: 'This deal was already practice-paid.' }, 409);

  const charged = await chargeSandbox(request, env, {
    action: 'haggle',
    resourceId: row.id,
    units: row.deal_cents * 10_000,
    description: `SANDBOX, test USDC only: practice-pay ${cents(row.deal_cents)} for ${item.name}, haggled down from ${cents(item.list)}.`,
  }, options);
  if (!charged.settled) return charged.response;
  return sandboxJson({
    ok: true, sandbox: true, testnetOnly: true, action: 'haggle',
    note: 'Practice payment settled on Base Sepolia with test USDC. No stub was issued and the real deal is unchanged.',
    receipt: { network: SANDBOX_NETWORK, transaction: charged.tx, payer: charged.payer, amountUsd: charged.units / 1_000_000, session: row.id, item: item.name },
  });
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: SANDBOX_HEADERS });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => handleHagglePaySandbox(request, env);
