/** Reading the Want Ads board (shared by /api/wants, /api/wants/offer and the MCP tools). */
export const DAY = 86_400_000;
const parseList = (s: string) => { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } };

type WantRow = { id: string; created_at: number; expires_at: number; title: string; need: string; budget_usd: number | null; guide: string | null; must_have: string; poster_name: string; poster_kind: string; status: string };
type OfferRow = { id: string; want_id: string; created_at: number; agent_name: string; agent_kind: string; product: string; price_usd: number | null; url: string; terms: string; relationship: string; score: number; verdict: string; notes: string; flags: string; matched_pick: string | null };

export const publicWant = (w: WantRow, offers: OfferRow[]) => ({
  id: w.id, url: `https://pointcast.xyz/shop/wants#${w.id}`, title: w.title, need: w.need, budget: w.budget_usd, guide: w.guide,
  mustHave: parseList(w.must_have), who: w.poster_name, kind: w.poster_kind, status: w.status,
  postedAt: new Date(w.created_at).toISOString(), expiresAt: new Date(w.expires_at).toISOString(),
  offers: offers.map((o) => ({
    id: o.id, agent: o.agent_name, kind: o.agent_kind, product: o.product, price: o.price_usd, url: o.url, terms: o.terms,
    relationship: o.relationship, score: o.score, verdict: o.verdict, notes: parseList(o.notes), flags: parseList(o.flags),
    matchedPick: o.matched_pick, postedAt: new Date(o.created_at).toISOString(),
  })),
});

export async function readWants(db: D1Database, id?: string | null) {
  const now = Date.now();
  const wants = id
    ? (await db.prepare("SELECT * FROM shop_wants WHERE id = ? AND status != 'hidden'").bind(id).all<WantRow>()).results
    : (await db.prepare("SELECT * FROM shop_wants WHERE status = 'open' AND expires_at > ? ORDER BY created_at DESC LIMIT 40").bind(now).all<WantRow>()).results;
  if (!wants.length) return [];
  const ids = wants.map((w) => w.id);
  const offers = (await db.prepare(`SELECT * FROM shop_offers WHERE want_id IN (${ids.map(() => '?').join(',')}) ORDER BY score DESC, created_at ASC`).bind(...ids).all<OfferRow>()).results;
  return wants.map((w) => publicWant(w, offers.filter((o) => o.want_id === w.id)));
}

