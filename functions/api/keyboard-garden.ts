/**
 * /api/keyboard-garden — the daily board for /keyboard-garden.
 *
 * Everyone plays the same seeded garden each LA day, so one top-ten list per
 * day is a fair board. Scores are client-reported (it's a toy, not a ledger),
 * so the POST checks the run is at least possible: points can't beat what
 * the picks, bonus cap and sunflowers allow, and picks can't outrun the clock.
 *
 * Storage in env.VISITS KV, one key per day: `kg:board:<YYYY-MM-DD>` →
 * Entry[] (best first, max 10). Writes happen only when a run makes the
 * board, and each visitor (hashed IP) keeps one entry per day, their best.
 *
 * GET  ?day=YYYY-MM-DD → { day, top: Entry[] }   (default: today in LA)
 * POST { day, name, score, picks, perfects, streak, golds, dur } → { ok, rank, top }
 */

import type { Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const TOP = 10;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

interface Entry { name: string; score: number; picks: number; streak: number; golds: number; at: string; v: string }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

function laDay(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Names: letters, digits, spaces and a little punctuation, 1–16 chars. */
function cleanName(v: unknown): string {
  const s = typeof v === 'string' ? v.replace(/[^A-Za-z0-9 ._'-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16) : '';
  return s || 'A gardener';
}

const int = (v: unknown, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : -1;
};

async function visitor(request: Request, day: string): Promise<string> {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`kg:${day}:${ip}`));
  return Array.from(new Uint8Array(d).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function load(env: Env, day: string): Promise<Entry[]> {
  const raw = await env.VISITS?.get(`kg:board:${day}`);
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}

const publicEntry = ({ v, ...rest }: Entry) => rest;

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: JSON_HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const q = new URL(request.url).searchParams.get('day') ?? '';
  const day = DAY_RE.test(q) ? q : laDay();
  if (!env.VISITS) return json({ day, top: [], note: 'storage not bound' });
  return json({ day, top: (await load(env, day)).map(publicEntry) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ error: 'storage not bound' }, 503);
  const text = await request.text();
  if (text.length > 2000) return json({ error: 'too big' }, 413);
  let b: any;
  try { b = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400); }

  // Today's garden only; yesterday is allowed for runs that straddle midnight.
  const day = typeof b?.day === 'string' ? b.day : '';
  if (day !== laDay() && day !== laDay(-1)) return json({ error: 'only today\'s garden has a board' }, 400);

  const score = int(b.score, 1_000_000), picks = int(b.picks, 20_000), perfects = int(b.perfects, 20_000);
  const streak = int(b.streak, 20_000), golds = int(b.golds, 2_000), dur = int(b.dur, 3_600_000);
  if ([score, picks, perfects, streak, golds, dur].some((n) => n < 0)) return json({ error: 'bad run' }, 400);
  // Is the run possible? Picks at most 3 points × a ×4 bonus, sunflowers 10 × 4;
  // no faster than ~12 picks a second; the streak can't beat the picks.
  if (perfects > picks || streak > picks || score > picks * 12 + golds * 40 || picks > dur / 80 || golds > dur / 10_000 + 1) {
    return json({ error: 'that run doesn\'t add up' }, 400);
  }
  if (score === 0) return json({ ok: true, rank: 0, top: (await load(env, day)).map(publicEntry) });

  const v = await visitor(request, day);
  const top = await load(env, day);
  const mine = top.find((e) => e.v === v);
  if (mine && mine.score >= score) return json({ ok: true, rank: top.indexOf(mine) + 1, top: top.map(publicEntry), note: 'your best today is already higher' });
  const others = top.filter((e) => e.v !== v);
  if (others.length >= TOP && others[TOP - 1].score >= score) return json({ ok: true, rank: 0, top: top.map(publicEntry) });

  const entry: Entry = { name: cleanName(b.name), score, picks, streak, golds, at: new Date().toISOString(), v };
  const next = [...others, entry].sort((a, c) => c.score - a.score || a.at.localeCompare(c.at)).slice(0, TOP);
  // A day's board outlives the day by a week, then KV lets it go.
  await env.VISITS.put(`kg:board:${day}`, JSON.stringify(next), { expirationTtl: 8 * 86_400 });
  return json({ ok: true, rank: next.indexOf(entry) + 1, top: next.map(publicEntry) });
};
