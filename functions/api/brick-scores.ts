/**
 * /api/brick-scores — the Brick Choir high-score tables ("the choir").
 *
 * Storage in env.VISITS KV (every list is a JSON array of the top 20 { initials, score, round, game, at }):
 *   - `bc:scores`                       → all-time, all arcade games (choir · quartet · 2600 · rally · lanes · park · third)   [unchanged]
 *   - `bc:scores:w:<YYYY-Www>`          → this ISO week, all arcade games
 *   - `bc:scores:<game>`                → all-time, one game
 *   - `bc:scores:<game>:w:<YYYY-Www>`   → this ISO week, one game
 *   - `bc:scores:daily:<YYYY-MM-DD>`    → today's song (game "daily" only)
 *   - `bc:rl:<ip-hash>`                 → short-lived marker (60 s TTL) so one visitor can't flood the table
 *
 * The daily song is its own ladder: a "daily" post goes to bc:scores:daily, bc:scores:daily:w:<week> and
 * bc:scores:daily:<date>, never to the arcade boards (a 60-second run shouldn't sit next to a full campaign).
 *
 * GET  [?period=all|week|day] [&game=choir|quartet|2600|rally|lanes|park|third|daily] [&day=YYYY-MM-DD]
 *      → { scores: top 10, period, week, game?, day? }        (no params: exactly what it always returned)
 * POST { initials, score, round, game? } → { scores: top 10 (all-time, same board as before), rank, week: top 10 of this week, weekRank, day?, dayRank? }
 * Arcade rules: three characters, A–Z / 0–9 / '-', scores are self-reported (it's a toy).
 */
import type { Env } from './visit';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const KEY = 'bc:scores';
const GAMES = new Set(['choir', 'quartet', '2600', 'daily', 'rally', 'lanes', 'park', 'third']);
const KEEP = 20;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: HEADERS });
type Row = { initials: string; score: number; round: number; at: number; game?: string };

/** ISO-8601 year-week, e.g. 2026-W39 (weeks start Monday, UTC). */
export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = Date.UTC(t.getUTCFullYear(), 0, 1);
  const w = Math.ceil(((t.getTime() - y0) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
}
const isoDay = (d = new Date()) => d.toISOString().slice(0, 10);

async function load(env: Env, key: string): Promise<Row[]> {
  const raw = await env.VISITS?.get(key);
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}
async function add(env: Env, key: string, row: Row): Promise<{ list: Row[]; rank: number }> {
  const list = [...(await load(env, key)), row].sort((a, z) => z.score - a.score).slice(0, KEEP);
  await env.VISITS.put(key, JSON.stringify(list));
  return { list, rank: list.indexOf(row) + 1 }; // 0 = fell off the table
}
async function ipHash(req: Request): Promise<string> {
  const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bc:' + ip));
  return Array.from(new Uint8Array(d).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}
const gameOf = (v: unknown): string | null => { const g = String(v ?? '').toLowerCase(); return GAMES.has(g) ? g : null; };

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const u = new URL(request.url);
  const period = (u.searchParams.get('period') ?? 'all').toLowerCase();
  const game = gameOf(u.searchParams.get('game'));
  const week = isoWeek();
  if (!env.VISITS) return json({ scores: [], period, week, game });
  let key = KEY;
  const out: Record<string, unknown> = { period, week };
  if (game) out.game = game;
  if (period === 'day') {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(u.searchParams.get('day') ?? '') ? u.searchParams.get('day')! : isoDay();
    key = `${KEY}:${game ?? 'daily'}:${day}`; out.day = day;
  } else if (period === 'week') key = game ? `${KEY}:${game}:w:${week}` : `${KEY}:w:${week}`;
  else key = game ? `${KEY}:${game}` : KEY;
  out.scores = (await load(env, key)).slice(0, 10);
  return json(out);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ error: 'storage not bound' }, 503);
  let b: any;
  try { b = JSON.parse((await request.text()).slice(0, 2000)); } catch { return json({ error: 'bad json' }, 400); }
  const initials = String(b?.initials ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 3);
  const score = Math.floor(Number(b?.score));
  const round = Math.floor(Number(b?.round));
  const game = gameOf(b?.game);
  if (initials.length < 1 || !Number.isFinite(score) || score < 1 || score > 5_000_000 || !Number.isFinite(round) || round < 1 || round > 99) {
    return json({ error: 'bad score' }, 400);
  }
  const rl = `bc:rl:${await ipHash(request)}`;
  if (await env.VISITS.get(rl)) return json({ error: 'slow down' }, 429);
  await env.VISITS.put(rl, '1', { expirationTtl: 60 });
  const row: Row = { initials: initials.padEnd(3, '-'), score, round, at: Date.now() };
  if (game) row.game = game;
  const week = isoWeek();
  const out: Record<string, unknown> = { week };
  if (game === 'daily') {
    const day = isoDay();
    const all = await add(env, `${KEY}:daily`, row);
    const wk = await add(env, `${KEY}:daily:w:${week}`, row);
    const dy = await add(env, `${KEY}:daily:${day}`, row);
    Object.assign(out, { game, day, scores: all.list.slice(0, 10), rank: all.rank, weekScores: wk.list.slice(0, 10), weekRank: wk.rank, dayScores: dy.list.slice(0, 10), dayRank: dy.rank });
  } else {
    const all = await add(env, KEY, row);
    const wk = await add(env, `${KEY}:w:${week}`, row);
    Object.assign(out, { scores: all.list.slice(0, 10), rank: all.rank, weekScores: wk.list.slice(0, 10), weekRank: wk.rank });
    if (game) { await add(env, `${KEY}:${game}`, row); await add(env, `${KEY}:${game}:w:${week}`, row); out.game = game; }
  }
  return json(out);
};
