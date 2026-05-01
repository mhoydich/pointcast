/**
 * /api/altar — Noun tribute altars (drum-altars).
 *
 * Per Mike 2026-05-01: "make some nouns drums tribute alters"
 *
 * Five altars per ISO week, each dedicated to a deterministic Noun
 * seed. Visitors "ring the bell" to leave a tribute. Counts live in
 * KV under a week-scoped key so each week's tributes are their own
 * shrine. Old weeks linger 14 days then expire.
 *
 * Storage:
 *   altar:tributes:{week} → JSON { seeds:number[5], counts:Record<seed, n>, recent:{seed,t,pid}[8] }
 *   altar:rate:{pid}:{seed} → marker · 5s TTL · per-pid per-seed rate-limit
 *
 * GET → { ok, week, seeds, counts, recent, totalThisWeek, now }
 * POST { sessionId, seed } → leave a tribute
 *
 * The five seats per week are derived from the ISO-week number with a
 * deterministic mix function so they're predictable, distinct, and
 * rotate every Monday morning. Each seat has a fixed instrument
 * timbre on the page (bell, bowl, chime, gong, drone) — that mapping
 * lives client-side; the server only tracks counts by seed.
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const TRIBUTE_TTL_SECONDS = 14 * 24 * 3600; // 14 days
// 5s between offerings to same altar from same pid. CF Workers KV
// requires expirationTtl >= 60, so we store a millisecond timestamp
// with a 60s TTL and compare against now to enforce the 5s window.
const RATE_WINDOW_MS = 5000;
const RATE_KV_TTL_SECONDS = 60;
const RECENT_CAP = 8;

interface AltarState {
  week: number;
  seeds: number[];
  counts: Record<string, number>;
  recent: Array<{ seed: number; t: number; pid: string }>;
}

function isoWeekNumber(d = new Date()): number {
  // ISO week — ASIA-Pacific friendly enough for our purposes
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  // Encode as YYYYWW so cross-year keys don't collide
  return date.getUTCFullYear() * 100 + week;
}

/**
 * Deterministic mix — 5 distinct seeds 0..1199 rotating per ISO week.
 * Mixed with prime offsets so adjacent weeks produce distinct sets.
 */
function seedsForWeek(week: number): number[] {
  const PRIMES_A = [17, 73, 211, 419, 587];
  const PRIMES_B = [0, 100, 333, 666, 999];
  const out: number[] = [];
  for (let i = 0; i < 5; i++) {
    const v = (week * PRIMES_A[i] + PRIMES_B[i]) % 1200;
    // Avoid duplicates by linear probe
    let s = v;
    while (out.includes(s)) s = (s + 1) % 1200;
    out.push(s);
  }
  return out;
}

function freshState(week: number): AltarState {
  return {
    week,
    seeds: seedsForWeek(week),
    counts: {},
    recent: [],
  };
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function loadState(env: Env, week: number): Promise<AltarState> {
  if (!env.VISITS) return freshState(week);
  const raw = await env.VISITS.get(`altar:tributes:${week}`);
  if (!raw) return freshState(week);
  try {
    const parsed = JSON.parse(raw) as Partial<AltarState>;
    const fresh = freshState(week);
    return {
      week,
      seeds: parsed.seeds && parsed.seeds.length === 5 ? parsed.seeds : fresh.seeds,
      counts: parsed.counts ?? {},
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, RECENT_CAP) : [],
    };
  } catch {
    return freshState(week);
  }
}

async function saveState(env: Env, state: AltarState): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(`altar:tributes:${state.week}`, JSON.stringify(state), {
    expirationTtl: TRIBUTE_TTL_SECONDS,
  });
}

function totalThisWeek(state: AltarState): number {
  let n = 0;
  for (const v of Object.values(state.counts)) n += v;
  return n;
}

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const week = isoWeekNumber();
  const state = await loadState(env, week);
  return json(
    {
      ok: true,
      week,
      seeds: state.seeds,
      counts: state.counts,
      recent: state.recent,
      totalThisWeek: totalThisWeek(state),
      now: Date.now(),
    },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });

  let body: { sessionId?: unknown; seed?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) {
    return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  }
  const seed = typeof body.seed === 'number' ? body.seed | 0 : -1;
  if (seed < 0 || seed > 1199) {
    return json({ ok: false, reason: 'bad-seed' }, { status: 400 });
  }

  const week = isoWeekNumber();
  const state = await loadState(env, week);

  // Seed must be one of the current week's altars
  if (!state.seeds.includes(seed)) {
    return json({ ok: false, reason: 'not-an-altar', seeds: state.seeds }, { status: 400 });
  }

  const pid = (await sha256(sessionId)).slice(0, 10);
  const rateKey = `altar:rate:${pid}:${seed}`;
  const lastRaw = await env.VISITS.get(rateKey);
  const lastTs = lastRaw ? parseInt(lastRaw, 10) : 0;
  const now = Date.now();
  if (Number.isFinite(lastTs) && now - lastTs < RATE_WINDOW_MS) {
    const retryMs = RATE_WINDOW_MS - (now - lastTs);
    return json(
      { ok: false, reason: 'rate-limited', retryAfterSec: Math.max(1, Math.ceil(retryMs / 1000)) },
      { status: 429 },
    );
  }
  await env.VISITS.put(rateKey, String(now), { expirationTtl: RATE_KV_TTL_SECONDS });

  // Increment count + push recent
  const key = String(seed);
  state.counts[key] = (state.counts[key] ?? 0) + 1;
  state.recent.unshift({ seed, t: Date.now(), pid });
  state.recent = state.recent.slice(0, RECENT_CAP);
  await saveState(env, state);

  return json({
    ok: true,
    week,
    seed,
    count: state.counts[key],
    totalThisWeek: totalThisWeek(state),
  });
};
