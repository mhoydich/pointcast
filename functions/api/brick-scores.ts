/**
 * /api/brick-scores — the Brick Choir high-score table ("the choir").
 *
 * Storage in env.VISITS KV:
 *   - `bc:scores`        → JSON array of the top 20 { initials, score, round, at }
 *   - `bc:rl:<ip-hash>`  → short-lived marker (60 s TTL) so one visitor can't flood the table
 *
 * GET  → { scores: top 10 }
 * POST { initials, score, round } → { scores: top 10, rank }
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
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: HEADERS });
type Row = { initials: string; score: number; round: number; at: number };

async function load(env: Env): Promise<Row[]> {
  const raw = await env.VISITS?.get(KEY);
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}
async function ipHash(req: Request): Promise<string> {
  const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bc:' + ip));
  return Array.from(new Uint8Array(d).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.VISITS) return json({ scores: [] });
  return json({ scores: (await load(env)).slice(0, 10) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ error: 'storage not bound' }, 503);
  let b: any;
  try { b = JSON.parse((await request.text()).slice(0, 2000)); } catch { return json({ error: 'bad json' }, 400); }
  const initials = String(b?.initials ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 3);
  const score = Math.floor(Number(b?.score));
  const round = Math.floor(Number(b?.round));
  if (initials.length < 1 || !Number.isFinite(score) || score < 1 || score > 5_000_000 || !Number.isFinite(round) || round < 1 || round > 99) {
    return json({ error: 'bad score' }, 400);
  }
  const rl = `bc:rl:${await ipHash(request)}`;
  if (await env.VISITS.get(rl)) return json({ error: 'slow down' }, 429);
  await env.VISITS.put(rl, '1', { expirationTtl: 60 });
  const row: Row = { initials: initials.padEnd(3, '-'), score, round, at: Date.now() };
  const list = [...(await load(env)), row].sort((a, z) => z.score - a.score).slice(0, 20);
  await env.VISITS.put(KEY, JSON.stringify(list));
  return json({ scores: list.slice(0, 10), rank: list.indexOf(row) + 1 });
};
