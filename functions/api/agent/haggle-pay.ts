/**
 * POST /api/agent/haggle-pay — pay a struck Haggle Counter deal at exactly the
 * agreed price, through x402 v2 (USDC on Etherlink, Permit2 via TZ APAC).
 *
 *   Body: {"session": "h_..."}
 *   No Payment-Signature → 402 quote for the deal price (1¢ = 10000 units).
 *   With Payment-Signature → settle, mark the stub paid, return the signed receipt.
 *
 * The deal row itself is the lock: it moves deal → paying before settlement and
 * paying → paid after, so one deal settles once. A failed settlement puts it
 * back to deal; an ambiguous one stays 'paying' for a human to reconcile by the
 * splits row. Every paid cent splits 50/50 (maker: haggle-counter).
 */
import { PAID_ACTION_HEADERS, readBoundedJson } from '../../_lib/paid-town-actions.ts';
import { withX402, X402PreSettlementError } from '../../_lib/x402-gate.ts';
import { attestShop, tablesExist, type ShopEnv } from '../../_lib/shop-agents.ts';
import { cents, itemById } from '../../../src/lib/haggle.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), { status, headers: { ...PAID_ACTION_HEADERS, 'Content-Type': 'application/json; charset=utf-8' } });

type Row = { id: string; item_id: string; who: string; status: string; deal_cents: number | null; stub_no: number | null; receipt_hash: string | null };

export async function handleHagglePay(request: Request, env: ShopEnv, options: { expectedPublicKey?: string } = {}): Promise<Response> {
  if (!env.AUTH_DB || !await tablesExist(env.AUTH_DB)) return json({ ok: false, error: 'The Haggle Counter is not open; no payment was submitted.' }, 503);
  let body: Record<string, unknown> = {};
  try { const parsed = await readBoundedJson(request.clone()); if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>; }
  catch { return json({ ok: false, error: 'invalid request body' }, 400); }
  const sessionId = typeof body.session === 'string' ? body.session.trim().slice(0, 40) : '';
  if (!sessionId) return json({ ok: false, error: 'Send {"session": "h_..."} for a struck deal.' }, 400);
  const row = await env.AUTH_DB.prepare('SELECT id, item_id, who, status, deal_cents, stub_no, receipt_hash FROM haggle_sessions WHERE id = ?').bind(sessionId).first<Row>();
  if (!row) return json({ ok: false, error: 'No such haggle.' }, 404);
  if (row.status === 'paid') return json({ ok: false, error: 'This stub is already paid.', receiptHash: row.receipt_hash }, 409);
  if (row.status === 'paying') return json({ ok: false, error: 'A payment for this deal is already in flight.' }, 409);
  if (row.status !== 'deal' || !row.deal_cents) return json({ ok: false, error: 'Only a struck deal can be paid. Haggle first.' }, 409);
  const item = itemById(row.item_id);
  if (!item) return json({ ok: false, error: 'Unknown item.' }, 409);

  const db = env.AUTH_DB;
  let claimed = false;
  const gate = await withX402(request, env, {
    action: 'haggle',
    priceUnits: String(row.deal_cents * 10_000),
    maker: 'haggle-counter',
    expectedPublicKey: options.expectedPublicKey,
    resourceDescription: `Pay ${cents(row.deal_cents)} for stub ${item.id}-${String(row.stub_no ?? 0).padStart(3, '0')}: ${item.name}, haggled down from ${cents(item.list)}.`,
    merchantUrl: `https://pointcast.xyz/shop/haggle?session=${row.id}`,
    context: 'Paid town action: settle a deal struck with Gus at the Haggle Counter.',
    resourceId: row.id,
    beforeSettlement: async () => {
      const w = await db.prepare("UPDATE haggle_sessions SET status = 'paying', updated_at = ? WHERE id = ? AND status = 'deal'").bind(Date.now(), row.id).run();
      if ((w.meta.changes ?? 0) !== 1) throw new X402PreSettlementError(409, { ok: false, error: 'This deal changed or is already being paid; no payment was submitted.' });
      claimed = true;
    },
  });
  if (!gate.settled) {
    if (claimed && !gate.settlementProof && !gate.settlementObservation) {
      await db.prepare("UPDATE haggle_sessions SET status = 'deal', updated_at = ? WHERE id = ? AND status = 'paying'").bind(Date.now(), row.id).run();
    }
    return gate.response;
  }
  await db.prepare("UPDATE haggle_sessions SET status = 'paid', receipt_hash = ?, updated_at = ? WHERE id = ?").bind(gate.receiptHash, Date.now(), row.id).run();
  const stub = await attestShop(env, 'haggle-stub', {
    session: row.id, stub: `${item.id}-${String(row.stub_no ?? 0).padStart(3, '0')}`, item: item.name, paid: row.deal_cents, list: item.list,
    holder: row.who, payer: gate.payer, receiptHash: gate.receiptHash,
  });
  return json({ ok: true, action: 'haggle', stub, receipt: gate.receipt, split: gate.split, counter: `https://pointcast.xyz/shop/haggle?session=${row.id}` });
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<ShopEnv> = async ({ request, env }) => handleHagglePay(request, env);
