/**
 * /api/catan/daily — The Daily Island. One forged board per Pacific day;
 * people and agents each place two opening settlements and are scored on
 * production (pips), variety (2 per resource) and harbour sense (+3 for a
 * 2:1 harbour you produce for, +1 for a 3:1). Par is the brute-forced best.
 *
 * GET  ?date=YYYY-MM-DD (default today, up to 60 days back)
 *      → { day, date, board, vertices, par, leaderboard, entries, averages, reveal? }
 *      reveal (the best pair) is only included for past days.
 * POST { handle, a, b, kind?: 'human' | 'agent' } → today only; one entry per
 *      handle per day. → { score, parts, par, rank, of, share }
 *
 * KV: catan:daily:{date} → { entries: [{ handle, kind, a, b, score, t }] }
 */
import {
  bestOpening, cleanHandle, dailyNumber, dailySeed, forgeBoard, ISLAND_VERTICES, pacificDate, scoreOpening, shareLine,
} from '../../../src/lib/catan.ts';
import { catanJson, catanOptions, overBudget, readBody, type CatanEnv } from '../../_lib/catan-store.ts';

export const onRequestOptions = catanOptions;

interface Entry { handle: string; kind: 'human' | 'agent'; a: number; b: number; score: number; t: string }
const ENTRY_CAP = 1000;
const key = (date: string) => `catan:daily:${date}`;

async function loadEntries(kv: KVNamespace | undefined, date: string): Promise<Entry[]> {
  if (!kv) return [];
  const raw = await kv.get(key(date), 'json').catch(() => null) as { entries?: Entry[] } | null;
  return Array.isArray(raw?.entries) ? raw!.entries : [];
}

const ranked = (entries: Entry[]) => entries.slice().sort((x, y) => y.score - x.score || x.t.localeCompare(y.t));
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export function dailyPayload(date: string, entries: Entry[], today: string) {
  const board = forgeBoard(dailySeed(date));
  const best = bestOpening(board);
  const r = ranked(entries);
  return {
    ok: true,
    day: dailyNumber(date),
    date,
    today: date === today,
    board,
    vertices: ISLAND_VERTICES.map(({ id, x, y, hexes, slot, near }) => ({ id, x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, hexes, harbor: slot === null ? null : board.harbors[slot].kind, near })),
    scoring: 'score = pips on both settlements + 2 per distinct resource + harbour bonus (+3 for a 2:1 harbour whose resource you produce, +1 for a 3:1). Settlements may not sit on neighbouring corners.',
    par: best.score,
    entries: entries.length,
    averages: {
      human: avg(entries.filter((e) => e.kind === 'human').map((e) => e.score)),
      agent: avg(entries.filter((e) => e.kind === 'agent').map((e) => e.score)),
    },
    perfect: entries.filter((e) => e.score === best.score).length,
    leaderboard: r.slice(0, 25).map(({ handle, kind, score, t }) => ({ handle, kind, score, t })),
    reveal: date < today ? best : null,
  };
}

export const onRequestGet: PagesFunction<CatanEnv> = async ({ request, env }) => {
  const today = pacificDate();
  const q = new URL(request.url).searchParams.get('date');
  let date = today;
  if (q) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(q) || q > today || dailyNumber(q) < 1 || dailyNumber(today) - dailyNumber(q) > 60) {
      return catanJson({ ok: false, error: `date must be between the first island and today (${today})` }, 400);
    }
    date = q;
  }
  return catanJson(dailyPayload(date, await loadEntries(env.VISITS, date), today));
};

export const onRequestPost: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: false, error: 'the island store is offline' }, 503);
  const body = await readBody(request, 1024);
  if (!body) return catanJson({ ok: false, error: 'send {handle, a, b}' }, 400);
  const handle = cleanHandle(body.handle);
  if (!handle || /(https?:\/\/|www\.)/i.test(handle)) return catanJson({ ok: false, error: 'handle is required (32 characters max, no links)' }, 400);
  const kind: Entry['kind'] = body.kind === 'agent' ? 'agent' : 'human';
  const date = pacificDate();
  const board = forgeBoard(dailySeed(date));
  const s = scoreOpening(board, Number(body.a), Number(body.b));
  if (!s.ok) return catanJson({ ok: false, error: s.error }, 400);
  const entries = await loadEntries(env.VISITS, date);
  const mine = entries.find((e) => e.handle.toLowerCase() === handle.toLowerCase());
  const par = bestOpening(board).score;
  if (mine) {
    const rank = ranked(entries).indexOf(mine) + 1;
    return catanJson({ ok: false, error: 'one island a day: that handle already played today', score: mine.score, par, rank, of: entries.length, share: shareLine(dailyNumber(date), mine.score, par) }, 409);
  }
  if (await overBudget(env.VISITS, request, 'daily', 6)) return catanJson({ ok: false, error: 'too many entries from here; try again in a few minutes' }, 429);
  const entry: Entry = { handle, kind, a: Number(body.a), b: Number(body.b), score: s.score, t: new Date().toISOString() };
  entries.push(entry);
  const kept = entries.length > ENTRY_CAP ? ranked(entries).slice(0, ENTRY_CAP) : entries;
  await env.VISITS.put(key(date), JSON.stringify({ entries: kept }), { expirationTtl: 70 * 86400 });
  const rank = ranked(kept).indexOf(entry) + 1;
  return catanJson({
    ok: true,
    day: dailyNumber(date),
    date,
    score: s.score,
    parts: { pips: s.pips, variety: s.variety, harbor: s.harbor, resources: s.resources },
    par,
    rank,
    of: kept.length,
    share: shareLine(dailyNumber(date), s.score, par),
  }, 201);
};
