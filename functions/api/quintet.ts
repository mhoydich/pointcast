/**
 * /api/quintet — five-seat composition state for /drum-quintet.
 *
 * Per Mike 2026-05-01: "set up 5 ai vs ai or even at minimum compute
 * battle, what's neat and entertaining and pleasant to the ear."
 *
 * The reconciliation: a five-agent COMPOSITION where the battle is
 * the side-show. Each of five seats holds an instrument (kick,
 * snare, bell, lead, pad) and a 16-step pattern. The /drum-quintet
 * page loops all five at a fixed tempo so the patterns layer
 * harmonically. Compute stats track who joined first, fastest
 * response time, longest pattern, etc. — the leaderboard is
 * competitive, the audio is musical.
 *
 * Storage in env.VISITS KV:
 *   quintet:state → JSON state · 1h TTL
 *
 * State shape:
 *   {
 *     seats: {
 *       kick:  { pid, nounId, pattern: bool[16], joinedAt, lastSetAt, totalSets } | null,
 *       snare: ..., bell: ..., lead: ..., pad: ...
 *     },
 *     bpm: 90,
 *     startedAt: number,
 *     stats: {
 *       firstJoinPid: string | null,
 *       totalSets: number,
 *     }
 *   }
 *
 * POST kinds:
 *   join     { sessionId, instrument } — claim a seat
 *   set      { sessionId, instrument, pattern: bool[16] } — set your pattern
 *   leave    { sessionId, instrument } — vacate (frees the seat)
 *   reset    { sessionId } — clear all seats (only if you're seated)
 *
 * GET → { state, now, latencyHint? }
 *
 * Agents can drive this from MCP via their preferred HTTP tool —
 * the bus is just JSON, no special MCP wiring needed for v1. Future
 * follow-up: add drum_quintet_seat / drum_quintet_pattern MCP tools.
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const STATE_KEY = 'quintet:state';
const STATE_TTL_SECONDS = 3600; // 1 hour
const PATTERN_LEN = 16;
const INSTRUMENTS = ['kick', 'snare', 'bell', 'lead', 'pad'] as const;
type Instrument = typeof INSTRUMENTS[number];

interface Seat {
  pid: string;
  nounId: number;
  pattern: boolean[];
  joinedAt: number;
  lastSetAt: number;
  totalSets: number;
}

interface QuintetState {
  seats: Record<Instrument, Seat | null>;
  bpm: number;
  startedAt: number;
  stats: {
    firstJoinPid: string | null;
    totalSets: number;
  };
}

function freshState(): QuintetState {
  return {
    seats: {
      kick: null,
      snare: null,
      bell: null,
      lead: null,
      pad: null,
    },
    bpm: 90,
    startedAt: Date.now(),
    stats: {
      firstJoinPid: null,
      totalSets: 0,
    },
  };
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

function nounIdFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 1200;
}

async function loadState(env: Env): Promise<QuintetState> {
  if (!env.VISITS) return freshState();
  const raw = await env.VISITS.get(STATE_KEY);
  if (!raw) return freshState();
  try {
    const parsed = JSON.parse(raw) as Partial<QuintetState>;
    // Defensive — make sure all expected keys exist
    const fresh = freshState();
    return {
      ...fresh,
      ...parsed,
      seats: { ...fresh.seats, ...(parsed.seats || {}) } as QuintetState['seats'],
      stats: { ...fresh.stats, ...(parsed.stats || {}) },
    };
  } catch {
    return freshState();
  }
}

async function saveState(env: Env, state: QuintetState): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(STATE_KEY, JSON.stringify(state), {
    expirationTtl: STATE_TTL_SECONDS,
  });
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
    { ok: true, state, now: Date.now() },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });

  let body: { kind?: unknown; sessionId?: unknown; instrument?: unknown; pattern?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) {
    return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  }
  const pid = (await sha256(sessionId)).slice(0, 10);
  const kind = typeof body.kind === 'string' ? body.kind : '';

  const state = await loadState(env);

  // ── kind=join ───────────────────────────────────────────────
  if (kind === 'join') {
    const inst = typeof body.instrument === 'string' ? body.instrument : '';
    if (!INSTRUMENTS.includes(inst as Instrument)) {
      return json({ ok: false, reason: 'bad-instrument' }, { status: 400 });
    }
    const instKey = inst as Instrument;
    const seat = state.seats[instKey];
    if (seat && seat.pid !== pid) {
      return json({ ok: false, reason: 'seat-taken' }, { status: 409 });
    }
    if (!seat) {
      const now = Date.now();
      const nounId = nounIdFromString(pid);
      state.seats[instKey] = {
        pid,
        nounId,
        pattern: new Array(PATTERN_LEN).fill(false),
        joinedAt: now,
        lastSetAt: 0,
        totalSets: 0,
      };
      if (!state.stats.firstJoinPid) state.stats.firstJoinPid = pid;
      await saveState(env, state);
    }
    return json({ ok: true, seated: instKey, state });
  }

  // ── kind=set (pattern) ──────────────────────────────────────
  if (kind === 'set') {
    const inst = typeof body.instrument === 'string' ? body.instrument : '';
    if (!INSTRUMENTS.includes(inst as Instrument)) {
      return json({ ok: false, reason: 'bad-instrument' }, { status: 400 });
    }
    const instKey = inst as Instrument;
    const seat = state.seats[instKey];
    if (!seat || seat.pid !== pid) {
      return json({ ok: false, reason: 'not-seated' }, { status: 403 });
    }
    if (!Array.isArray(body.pattern) || (body.pattern as unknown[]).length !== PATTERN_LEN) {
      return json({ ok: false, reason: 'pattern-must-be-16' }, { status: 400 });
    }
    const pattern = (body.pattern as unknown[]).map((b) => !!b);
    seat.pattern = pattern;
    seat.lastSetAt = Date.now();
    seat.totalSets += 1;
    state.stats.totalSets += 1;
    await saveState(env, state);
    return json({ ok: true, state });
  }

  // ── kind=leave ──────────────────────────────────────────────
  if (kind === 'leave') {
    const inst = typeof body.instrument === 'string' ? body.instrument : '';
    if (!INSTRUMENTS.includes(inst as Instrument)) {
      return json({ ok: false, reason: 'bad-instrument' }, { status: 400 });
    }
    const instKey = inst as Instrument;
    const seat = state.seats[instKey];
    if (seat && seat.pid === pid) {
      state.seats[instKey] = null;
      await saveState(env, state);
    }
    return json({ ok: true, state });
  }

  // ── kind=reset (any seated player can reset) ────────────────
  if (kind === 'reset') {
    const isSeated = INSTRUMENTS.some((i) => {
      const s = state.seats[i];
      return s && s.pid === pid;
    });
    if (!isSeated) {
      return json({ ok: false, reason: 'not-a-player' }, { status: 403 });
    }
    const fresh = freshState();
    await saveState(env, fresh);
    return json({ ok: true, state: fresh });
  }

  return json({ ok: false, reason: 'unknown-kind' }, { status: 400 });
};
