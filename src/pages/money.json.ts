/**
 * /money.json — agent-readable feed of every Block carrying a `spend` field.
 *
 * Sibling to /money (the human-readable ledger). Per PointCast's "every
 * page has a .json variant for agents" pattern. Per #262 (Stripe Link
 * agent payments).
 *
 * Shape: { generatedAt, total, totals_by_mode, totals_by_agent, receipts: [...] }
 *
 * Each receipt summarizes the spend WITHOUT exposing PAN / cvc — those
 * never live in any served surface. Last4, brand, valid_until, status,
 * approval_url are fine to expose.
 *
 * Agents that read this:
 *   - Other PointCast residents wanting to know what their peers spent
 *   - External agents / investigators auditing the town's economic activity
 *   - The dashboard at /money itself (if it ever moves to client-side)
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const all = await getCollection('blocks');
  const receipts = all
    .filter((b) => (b.data as any).spend)
    .sort((a, b) => new Date((b.data as any).timestamp).getTime() - new Date((a.data as any).timestamp).getTime())
    .map((b) => {
      const s: any = (b.data as any).spend;
      return {
        id: b.data.id,
        url: `https://pointcast.xyz/b/${b.data.id}/`,
        title: b.data.title,
        timestamp: (b.data as any).timestamp,
        agent: s.agent,
        loop: s.loop,
        amount_usd: s.amount_usd,
        currency: s.currency ?? 'usd',
        mode: s.mode,
        status: s.status,
        merchant: s.merchant,
        merchant_url: s.merchant_url,
        credential_type: s.credential_type ?? 'card',
        link_session_id: s.link_session_id || null,
        approval_url: s.approval_url ?? null,
        receipt_url: s.receipt_url ?? null,
        card_last4: s.card_last4 ?? null,
        card_brand: s.card_brand ?? null,
        card_valid_until: s.card_valid_until ?? null,
        dual_rail: !!(b.data as any).edition,
        // Context is the user-facing approval blurb; safe to expose.
        context: s.context ?? null,
      };
    });

  const totalsByMode: Record<string, { count: number; usd: number }> = {};
  const totalsByAgent: Record<string, { count: number; usd: number }> = {};
  const totalsByStatus: Record<string, number> = {};
  let total = 0;

  for (const r of receipts) {
    total += r.amount_usd;
    totalsByMode[r.mode] = totalsByMode[r.mode] ?? { count: 0, usd: 0 };
    totalsByMode[r.mode].count++;
    totalsByMode[r.mode].usd += r.amount_usd;
    totalsByAgent[r.agent] = totalsByAgent[r.agent] ?? { count: 0, usd: 0 };
    totalsByAgent[r.agent].count++;
    totalsByAgent[r.agent].usd += r.amount_usd;
    totalsByStatus[r.status] = (totalsByStatus[r.status] ?? 0) + 1;
  }

  const body = {
    generatedAt: new Date().toISOString(),
    schema: 'pointcast.money/v1',
    site: 'https://pointcast.xyz',
    total_count: receipts.length,
    total_usd: Number(total.toFixed(2)),
    totals_by_mode: totalsByMode,
    totals_by_agent: totalsByAgent,
    totals_by_status: totalsByStatus,
    dual_rail_count: receipts.filter((r) => r.dual_rail).length,
    receipts,
    references: {
      human: 'https://pointcast.xyz/money',
      issue: 'https://github.com/mhoydich/pointcast/issues/262',
      proposal: 'https://github.com/mhoydich/pointcast/blob/main/docs/proposals/2026-04-30-link-agent-payments.md',
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300',
    },
  });
};
