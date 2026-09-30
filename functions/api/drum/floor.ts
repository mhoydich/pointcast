/**
 * /api/drum/floor — The Floor: Polymarket markets + drum calls + Floor Bot.
 *
 * GET /api/drum/floor
 *   → { markets: [{ id, slug, question, outcomes, prices, change24h, volume24h,
 *                   endDate, image, calls: [a, b], bot: { up, down } }],
 *       moves: FloorMove[], botCheckedAt }
 *
 * Markets come from Polymarket's public Gamma API (read only, cached a
 * minute). Calls are drum beats people played on a side of a market
 * (places pm:<id>:a / pm:<id>:b). Bot beats are Floor Bot's drum hits when a
 * market moved (pm:<id>:up / pm:<id>:down). Nothing here trades.
 */

interface Env {
  VISITS?: KVNamespace;
  DRUM_COUNTER?: DurableObjectNamespace;
}

const GAMMA = 'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=16&order=volume24hr&ascending=false';
const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=10' };

function list(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  try { const v = JSON.parse(String(raw)); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [marketsRaw, floorRaw, state] = await Promise.all([
    fetch(GAMMA, { headers: { accept: 'application/json' }, cf: { cacheTtl: 60, cacheEverything: true } } as RequestInit)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    env.DRUM_COUNTER
      ? env.DRUM_COUNTER.get(env.DRUM_COUNTER.idFromName('global')).fetch('https://drum-counter.internal/?floor=1')
        .then((r) => r.json() as Promise<{ places?: Array<{ place: string; total: number }> }>)
        .catch(() => ({ places: [] }))
      : Promise.resolve({ places: [] }),
    env.VISITS ? env.VISITS.get<{ checkedAt: number; moves: unknown[] }>('floor:state', 'json').catch(() => null) : Promise.resolve(null),
  ]);

  const tally = new Map((floorRaw.places || []).map((p) => [p.place, p.total]));
  const markets = (Array.isArray(marketsRaw) ? marketsRaw : [])
    .filter((m: any) => /^\d{1,12}$/.test(String(m?.id || '')))
    .map((m: any) => {
      const id = String(m.id);
      return {
        id,
        slug: String(m.slug || ''),
        question: String(m.question || '').slice(0, 160),
        outcomes: list(m.outcomes).slice(0, 2),
        prices: list(m.outcomePrices).slice(0, 2).map(Number),
        change24h: Number(m.oneDayPriceChange) || 0,
        volume24h: Number(m.volume24hr) || 0,
        endDate: m.endDate || null,
        image: typeof m.image === 'string' && m.image.startsWith('https://') ? m.image : null,
        calls: [tally.get(`pm:${id}:a`) || 0, tally.get(`pm:${id}:b`) || 0],
        bot: { up: tally.get(`pm:${id}:up`) || 0, down: tally.get(`pm:${id}:down`) || 0 },
      };
    });

  return new Response(JSON.stringify({
    markets,
    moves: Array.isArray(state?.moves) ? state!.moves.slice(0, 20) : [],
    botCheckedAt: state?.checkedAt ?? null,
  }), { headers: HEADERS });
};
