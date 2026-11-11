/**
 * /api/prayer — the morning hours (prayer-altars).
 *
 * Per Mike 2026-07-18: "create 5 new alters for praying multimedia
 * use midjourney images, 30 as part, enjoy, peace be with you"
 *
 * Ten fixed stations named for the canonical hours — the morning
 * five (matins, lauds, prime, terce, sext → /prayer-altars) and the
 * evening five (none, vespers, lucernarium, compline, vigil →
 * /prayer-altars-evening, added 2026-07-18 per "yah 5 more prayer
 * alters same aprroach"). Unlike /api/altar there is no weekly
 * rotation: the hours are the hours. Counts accumulate forever; the
 * recent feed shows the last 8 prayers across both chambers.
 *
 * Storage:
 *   prayer:state → JSON { counts:Record<station, n>, recent:{station,t,pid}[8] }
 *   prayer:rate:{pid}:{station} → ms timestamp · 60s TTL · 5s window
 *
 * The night hours (/night-hours, added 2026-11-09) are six more stations
 * that follow the real night over El Segundo. That page also runs on
 * elsegundo.xyz and posts here with room 'es', so both rooms share one
 * ledger. `ledger` is the wider feed (24, with rooms) the night wing uses
 * to hear other people; `recent` stays the last 8 daytime-chamber prayers
 * so the older pages render exactly what they did before.
 *
 * GET → { ok, stations, counts, recent, ledger, rooms, total, now }
 * POST { sessionId, station, room? } → offer a prayer
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const STATIONS = [
  // the morning hours — /prayer-altars
  'matins', 'lauds', 'prime', 'terce', 'sext',
  // the evening hours — /prayer-altars-evening
  'none', 'vespers', 'lucernarium', 'compline', 'vigil',
  // the bell that rings them — /prayer-bells
  'angelus',
  // the walk — /prayer-labyrinth
  'labyrinth',
  // the night hours — /night-hours (also served from elsegundo.xyz)
  'night-dusk', 'night-shore', 'night-niche', 'night-bell', 'night-moon', 'night-light',
  // the open hours — /open-hours, the working day (added 2026-11-10)
  'open-bell', 'open-coin', 'open-noon', 'open-deal', 'open-count', 'open-shelf',
] as const;
type Station = (typeof STATIONS)[number];

// 5s between prayers at the same station from the same pid. KV needs
// expirationTtl >= 60, so store a ms timestamp and compare (same
// approach as /api/altar).
const RATE_WINDOW_MS = 5000;
const RATE_KV_TTL_SECONDS = 60;
const RECENT_CAP = 8;
// Stored feed. Wide enough for the night wing to count who rang a bell together.
const LEDGER_CAP = 24;
const STATE_KEY = 'prayer:state';
const ROOMS = ['pc', 'es'] as const;
type Room = (typeof ROOMS)[number];

interface PrayerEntry {
  station: Station;
  t: number;
  pid: string;
  room?: Room;
}

interface PrayerState {
  counts: Record<string, number>;
  recent: PrayerEntry[];
  rooms: Record<string, number>;
}

function freshState(): PrayerState {
  return { counts: {}, recent: [], rooms: {} };
}

function isNight(station: string): boolean {
  return station.startsWith('night-');
}

// The open hours keep their own counts. They stay out of the altar feed and
// out of the night wing's ledger, which counts who rang a bell together.
function isOpen(station: string): boolean {
  return station.startsWith('open-');
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
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, LEDGER_CAP) : [],
      rooms: parsed.rooms ?? {},
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
      recent: state.recent.filter((e) => !isNight(e.station) && !isOpen(e.station)).slice(0, RECENT_CAP),
      ledger: state.recent.filter((e) => !isOpen(e.station)),
      rooms: state.rooms,
      total: total(state),
      now: Date.now(),
    },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });

  let body: { sessionId?: unknown; station?: unknown; room?: unknown };
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

  const room = ROOMS.includes(body.room as Room) ? (body.room as Room) : undefined;

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
  // Open-hours prayers are counted but kept out of the stored feed, so they
  // never push night-wing entries off the end of it.
  if (!isOpen(station)) {
    state.recent.unshift(room ? { station, t: Date.now(), pid, room } : { station, t: Date.now(), pid });
    state.recent = state.recent.slice(0, LEDGER_CAP);
    if (room) state.rooms[room] = (state.rooms[room] ?? 0) + 1;
  }
  await saveState(env, state);

  return json({
    ok: true,
    station,
    count: state.counts[station],
    total: total(state),
  });
};
