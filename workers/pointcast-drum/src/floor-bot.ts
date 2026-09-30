/**
 * Floor Bot: a drum trader bot that never trades.
 *
 * Every five minutes (cron) it reads the busiest Polymarket markets from the
 * public Gamma API and compares each market's first-outcome price with the
 * last check. When a market moves FLOOR_MIN_MOVE or more, the bot hits the
 * PointCast drum: one beat per five points moved (capped at 12), tagged
 * kind "agent", app "floor-bot", place "pm:<marketId>:up|down". Anyone
 * listening to the drum (the Beat Tower, /drums, /drum-floor) hears the
 * market move. Nothing is bought or sold, and nothing here is advice.
 *
 * State: one KV key, `floor:state` in VISITS: { checkedAt, prices, moves }.
 */

export const GAMMA_MARKETS =
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=24&order=volume24hr&ascending=false";
export const FLOOR_MIN_MOVE = 0.05;
export const FLOOR_STATE_KEY = "floor:state";
const MAX_MOVES = 40;
const MAX_BEATS = 12;

export interface FloorMove {
  at: number;
  id: string;
  question: string;
  outcome: string;
  from: number;
  to: number;
  direction: "up" | "down";
  beats: number;
}

export interface FloorState {
  checkedAt: number;
  prices: Record<string, number>;
  moves: FloorMove[];
}

interface GammaMarket {
  id?: string;
  question?: string;
  outcomes?: string;
  outcomePrices?: string;
}

interface FloorEnv {
  VISITS: KVNamespace;
  DRUM_COUNTER: DurableObjectNamespace;
}

function parseList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string") return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** Compare a fresh market list with the last snapshot. Pure, for tests. */
export function diffMarkets(markets: GammaMarket[], prev: FloorState | null, now: number) {
  const prices: Record<string, number> = {};
  const moves: FloorMove[] = [];
  for (const m of markets) {
    const id = String(m.id || "");
    const price = Number(parseList(m.outcomePrices)[0]);
    if (!/^\d{1,12}$/.test(id) || !Number.isFinite(price)) continue;
    prices[id] = price;
    const before = prev?.prices[id];
    if (before === undefined) continue;
    const delta = price - before;
    if (Math.abs(delta) < FLOOR_MIN_MOVE - 1e-9) continue;
    const outcomes = parseList(m.outcomes);
    moves.push({
      at: now,
      id,
      question: String(m.question || "").slice(0, 140),
      outcome: (outcomes[0] || "Yes").slice(0, 40),
      from: before,
      to: price,
      direction: delta > 0 ? "up" : "down",
      beats: Math.max(1, Math.min(MAX_BEATS, Math.round(Math.abs(delta) * 20))),
    });
  }
  return { prices, moves };
}

export async function runFloorBot(env: FloorEnv, fetchImpl: typeof fetch = fetch, now = Date.now()): Promise<FloorState> {
  const res = await fetchImpl(GAMMA_MARKETS, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`gamma ${res.status}`);
  const markets = (await res.json()) as GammaMarket[];
  const prev = await env.VISITS.get<FloorState>(FLOOR_STATE_KEY, "json");
  const { prices, moves } = diffMarkets(Array.isArray(markets) ? markets : [], prev, now);

  const counter = env.DRUM_COUNTER.get(env.DRUM_COUNTER.idFromName("global"));
  for (const move of moves) {
    await counter.fetch("https://drum-counter.internal/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delta: move.beats,
        source: { kind: "agent", app: "floor-bot", place: `pm:${move.id}:${move.direction}` },
      }),
    });
  }

  const state: FloorState = { checkedAt: now, prices, moves: [...moves, ...(prev?.moves || [])].slice(0, MAX_MOVES) };
  await env.VISITS.put(FLOOR_STATE_KEY, JSON.stringify(state));
  return state;
}
