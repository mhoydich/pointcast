/**
 * /api/prayer — the morning hours (prayer-altars).
 *
 * Per Mike 2026-07-18: "create 5 new alters for praying multimedia
 * use midjourney images, 30 as part, enjoy, peace be with you"
 *
 * Five fixed stations named for the canonical morning hours —
 * matins, lauds, prime, terce, sext. Unlike /api/altar there is no
 * weekly rotation: the hours are the hours. Counts accumulate
 * forever; the recent feed shows the last 8 prayers.
 *
 * Storage:
 *   prayer:state → JSON { counts:Record<station, n>, recent:{station,t,pid}[8] }
 *   prayer:rate:{pid}:{station} → ms timestamp · 60s TTL · 5s window
 *
 * GET → { ok, stations, counts, recent, total, now }
 * POST { sessionId, station } → offer a prayer
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const STATIONS = ['matins', 'lauds', 'prime', 'terce', 'sext'] as const;
type Station = (typeof STATIONS)[number];

// 5s between prayers at the same station from the same pid. KV needs
// expirationTtl >= 60, so store a ms timestamp and compare (same
// approach as /api/altar).
const RATE_WINDOW_MS = 5000;
const RATE_KV_TTL_SECONDS = 60;
const RECENT_CAP = 8;
const STATE_KEY = 'prayer:state';

interface PrayerState {
  counts: Record<string, number>;
  recent: Array<{ station: Station; t: number; pid: string }>;
}

function freshState(): PrayerState {
  return { counts: {}, recent: [] };
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function loadState(env: Env): Promise<PrayerState> {
  if (!env.VISITS) return freshState();
  const raw = await env.VISITS.get(STATE_KEY);
  if (!raw) return freshState();
  try {
    const parsed = JSON.parse(raw) as Partial<PrayerState>;
    return {
      counts: parsed.counts ?? {},
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, RECENT_CAP) : [],
    };
  } catch {
    return freshState();
  }
}

async function saveState(env: Env, state: PrayerState): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(STATE_KEY, JSON.stringify(state));
}

function total(state: PrayerState): number {
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
  const state = await loadState(env);
  return json(
    {
      ok: true,
      stations: STATIONS,
      counts: state.counts,
      recent: state.recent,
      total: total(state),
      now: Date.now(),
    },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });

  let body: { sessionId?: unknown; station?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) {
    return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  }
  const station = typeof body.station === 'string' ? (body.station as Station) : null;
  if (!station || !STATIONS.includes(station)) {
    return json({ ok: false, reason: 'not-a-station', stations: STATIONS }, { status: 400 });
  }

  const pid = (await sha256(sessionId)).slice(0, 10);
  const rateKey = `prayer:rate:${pid}:${station}`;
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

  const state = await loadState(env);
  state.counts[station] = (state.counts[station] ?? 0) + 1;
  state.recent.unshift({ station, t: Date.now(), pid });
  state.recent = state.recent.slice(0, RECENT_CAP);
  await saveState(env, state);

  return json({
    ok: true,
    station,
    count: state.counts[station],
    total: total(state),
  });
};
