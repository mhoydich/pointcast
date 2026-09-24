/**
 * /api/still-hour — the Thursday sitting's quiet ledger.
 *
 * Three numbers, nothing else: who is sitting right now, how many sits
 * finished today, how many minutes that added up to. No names, no login,
 * no leaderboard. A sit is only counted when its timer runs all the way
 * out; leaving early leaves no trace.
 *
 * Storage in env.VISITS KV (same namespace as /api/visit and /api/votive):
 *   still:now              → JSON { [pid]: lastSeenMs }, pruned to NOW_WINDOW_MS
 *   still:day:<YYYY-MM-DD> → JSON { sits, minutes }, LA day, TTL 3 days
 *   still:rate:<pid>       → "1", TTL 60s. One finished sit per minute per pid.
 *
 * GET                                  → { ok, day, sitting_now, sits, minutes, now }
 * POST { sessionId, action: 'join' }   → heartbeat (send every ~2 min while sitting)
 * POST { sessionId, action: 'leave' }  → drop from sitting_now
 * POST { sessionId, action: 'done', minutes } → count a finished sit (1..30 min)
 *
 * No KV bound → GET answers zeros with ok:false so the page falls back to
 * counting only you. The page never blocks on this. The room is the room.
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

const NOW_KEY = 'still:now';
const NOW_WINDOW_MS = 5 * 60_000;
const NOW_CAP = 500;
const DAY_TTL_SEC = 60 * 60 * 24 * 3;
const RATE_TTL_SEC = 60;
const MAX_MINUTES = 30;

interface DayTotals {
  sits: number;
  minutes: number;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

/** LA calendar day, so the count rolls over at El Segundo midnight, not UTC. */
export function laDay(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function dayKey(day: string): string {
  return `still:day:${day}`;
}
function rateKey(pid: string): string {
  return `still:rate:${pid}`;
}

async function loadNow(kv: KVNamespace, now: number): Promise<Record<string, number>> {
  const raw = await kv.get(NOW_KEY);
  let map: Record<string, number> = {};
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') map = parsed;
    } catch {
      map = {};
    }
  }
  const pruned: Record<string, number> = {};
  for (const [pid, t] of Object.entries(map)) {
    if (typeof t === 'number' && now - t < NOW_WINDOW_MS) pruned[pid] = t;
  }
  return pruned;
}

async function saveNow(kv: KVNamespace, map: Record<string, number>): Promise<void> {
  const entries = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, NOW_CAP);
  await kv.put(NOW_KEY, JSON.stringify(Object.fromEntries(entries)), { expirationTtl: 600 });
}

async function loadDay(kv: KVNamespace, day: string): Promise<DayTotals> {
  const raw = await kv.get(dayKey(day));
  if (!raw) return { sits: 0, minutes: 0 };
  try {
    const parsed = JSON.parse(raw);
    return {
      sits: Number(parsed?.sits) || 0,
      minutes: Number(parsed?.minutes) || 0,
    };
  } catch {
    return { sits: 0, minutes: 0 };
  }
}

async function pidFor(request: Request, sessionId: string): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const hash = await sha256(`still|${ip}|${sessionId}`);
  return hash.slice(0, 12);
}

async function snapshot(kv: KVNamespace | undefined, now: number) {
  const day = laDay(new Date(now));
  if (!kv) return { ok: false, day, sitting_now: 0, sits: 0, minutes: 0, now };
  const [nowMap, totals] = await Promise.all([loadNow(kv, now), loadDay(kv, day)]);
  return {
    ok: true,
    day,
    sitting_now: Object.keys(nowMap).length,
    sits: totals.sits,
    minutes: totals.minutes,
    now,
  };
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: JSON_HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return json(await snapshot(env.VISITS, Date.now()));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = env.VISITS;
  const now = Date.now();
  if (!kv) return json({ ok: false, error: 'no-kv', ...(await snapshot(undefined, now)) }, { status: 503 });

  let body: { sessionId?: unknown; action?: unknown; minutes?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'bad-json' }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : '';
  const action = typeof body.action === 'string' ? body.action : '';
  if (!sessionId || !['join', 'leave', 'done'].includes(action)) {
    return json({ ok: false, error: 'bad-request' }, { status: 400 });
  }
  const pid = await pidFor(request, sessionId);

  if (action === 'join' || action === 'leave') {
    const map = await loadNow(kv, now);
    if (action === 'join') map[pid] = now;
    else delete map[pid];
    await saveNow(kv, map);
    return json(await snapshot(kv, now));
  }

  // action === 'done'
  const minutes = Math.max(1, Math.min(MAX_MINUTES, Math.round(Number(body.minutes)) || 0));
  const limited = await kv.get(rateKey(pid));
  if (limited) {
    return json({ ok: true, counted: false, reason: 'rate', ...(await snapshot(kv, now)) });
  }
  const day = laDay(new Date(now));
  const totals = await loadDay(kv, day);
  totals.sits += 1;
  totals.minutes += minutes;
  await Promise.all([
    kv.put(dayKey(day), JSON.stringify(totals), { expirationTtl: DAY_TTL_SEC }),
    kv.put(rateKey(pid), '1', { expirationTtl: RATE_TTL_SEC }),
  ]);
  // A finished sit also means you stood up.
  const map = await loadNow(kv, now);
  delete map[pid];
  await saveNow(kv, map);
  return json({ counted: true, ...(await snapshot(kv, now)) });
};
