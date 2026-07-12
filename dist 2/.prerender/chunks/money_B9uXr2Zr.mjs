import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const GET = async () => {
  const all = await getCollection("blocks");
  const receipts = all.filter((b) => b.data.spend).sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime()).map((b) => {
    const s = b.data.spend;
    return {
      id: b.data.id,
      url: `https://pointcast.xyz/b/${b.data.id}/`,
      title: b.data.title,
      timestamp: b.data.timestamp,
      agent: s.agent,
      loop: s.loop,
      amount_usd: s.amount_usd,
      currency: s.currency ?? "usd",
      mode: s.mode,
      status: s.status,
      merchant: s.merchant,
      merchant_url: s.merchant_url,
      credential_type: s.credential_type ?? "card",
      link_session_id: s.link_session_id || null,
      approval_url: s.approval_url ?? null,
      receipt_url: s.receipt_url ?? null,
      card_last4: s.card_last4 ?? null,
      card_brand: s.card_brand ?? null,
      card_valid_until: s.card_valid_until ?? null,
      // Future-think fields (2026-05-01). Today every receipt has
      // payee_agent: null and payouts: null. When the +12-18mo agent-
      // earns inversion lands, payee_agent becomes who-the-agent-paid
      // (another agent). When the +18-24mo programmable splits land,
      // payouts becomes the ordered split for when this artifact earns.
      payee_agent: s.payee_agent ?? null,
      is_a2a: !!s.payee_agent,
      mcp_server_id: s.mcp_server_id ?? null,
      payouts: b.data.payouts ?? null,
      has_payouts: Array.isArray(b.data.payouts) && b.data.payouts.length > 0,
      dual_rail: !!b.data.edition,
      // Context is the user-facing approval blurb; safe to expose.
      context: s.context ?? null
    };
  });
  const totalsByMode = {};
  const totalsByAgent = {};
  const totalsByStatus = {};
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
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    schema: "pointcast.money/v2",
    site: "https://pointcast.xyz",
    total_count: receipts.length,
    total_usd: Number(total.toFixed(2)),
    totals_by_mode: totalsByMode,
    totals_by_agent: totalsByAgent,
    totals_by_status: totalsByStatus,
    dual_rail_count: receipts.filter((r) => r.dual_rail).length,
    a2a_count: receipts.filter((r) => r.is_a2a).length,
    payout_count: receipts.filter((r) => r.has_payouts).length,
    receipts,
    references: {
      human: "https://pointcast.xyz/money",
      issue: "https://github.com/mhoydich/pointcast/issues/262",
      proposal: "https://github.com/mhoydich/pointcast/blob/main/docs/proposals/2026-04-30-link-agent-payments.md"
    },
    // Schema notes for future-thinking integrators.
    schema_notes: {
      v1: "Initial receipt feed. spend metadata, totals.",
      v2: "Adds payee_agent + is_a2a (agent-to-agent), mcp_server_id, payouts + has_payouts (programmable revenue splits). All optional; today every receipt has them null/false."
    }
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
