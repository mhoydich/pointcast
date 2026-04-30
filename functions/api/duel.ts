/**
 * /api/duel — room-scoped 1v1 drum-game bus.
 *
 * Backs /drum-vs (tug-of-war) and any future 1v1 surfaces. Per Mike
 * 2026-04-30: "more drum, this time, as games to send to friends 1v1,
 * try to get best latency, nouns."
 *
 * Why a separate endpoint from /api/sounds:
 *   - /api/sounds is a global single-buffer-key bus. Two visitors
 *     tapping simultaneously can race the read-modify-write and lose
 *     events. For a 1v1 game the per-tap visibility matters; we don't
 *     want Mike's pull to vanish because Morgan tapped in the same ms.
 *   - /api/duel is room-scoped: each room has its own KV key, so a
 *     race only affects taps within ONE room (where both players are
 *     by definition tapping the same buffer). We mitigate further by
 *     polling tightly (400ms) and reconciling from server-truth scores
 *     rather than relying on event delivery.
 *
 * Storage in env.VISITS KV:
 *   - `duel:{room}:state` → { p1Pid, p2Pid, startedAt, winner?,
 *                              p1Score, p2Score, mode } · 1h TTL
 *   - `duel:{room}:events` → array of last 30 events
 *                            { side: 1|2, t, pid, n } · 60s TTL
 *
 * Room ids are 6-char base32 (A-Z2-9, no I/O/0/1 to avoid confusion).
 *
 * POST body:
 *   { room, sessionId, kind: 'join'|'tap'|'reset', side?: 1|2 }
 *   For 'join', the server assigns side based on first-come.
 *   For 'tap', side must be the caller's assigned side; server does
 *   not double-check (best-effort — the room is private by share).
 *
 * GET ?room=XXX&since=<t>
 *   → { state, events: [...], now }
 *     Events newer than `since`. State always returned for reconcile.
 *
 * Win condition: first side to reach 50 taps wins. Either side can
 * call kind=reset to start a new round (score = 0, winner = null).
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const STATE_TTL = 3600;       // 1 hour — long enough for a chat session
const EVENTS_TTL = 60;        // 60s — events are ephemeral signal
const EVENTS_CAP = 30;        // last 30 events per room
const SIGNALS_TTL = 90;
const SIGNALS_CAP = 40;
const SIGNAL_PAYLOAD_CAP = 4096;
const ROOM_RE = /^[A-HJ-NP-Za-hj-np-z2-9]{4,8}$/; // 4-8 chars, no I/O/0/1
const WIN_TAPS = 50;

interface DuelState {
  p1Pid: string | null;
  p2Pid: string | null;
  startedAt: number;
  winner: 0 | 1 | 2;     // 0 = no winner yet
  p1Score: number;
  p2Score: number;
  mode: 'tug' | 'race' | 'duel';
  // duel-mode fields (ignored for tug/race)
  p1Ready?: boolean;
  p2Ready?: boolean;
  bellAt?: number;       // 0 = not armed; otherwise UTC ms when bell rings
  roundState?: 'idle' | 'arming' | 'resolved';
  falseStart?: 0 | 1 | 2;
}

interface DuelEvent {
  side: 1 | 2;
  t: number;
  pid: string;
  n: number;             // server-side score for this side AFTER this event
}

interface DuelSignal {
  from: string;
  to: string;
  payload: string;
  kind: 'offer' | 'answer' | 'ice' | 'bye';
  t: number;
  id: string;
}

function freshState(): DuelState {
  return {
    p1Pid: null,
    p2Pid: null,
    startedAt: Date.now(),
    winner: 0,
    p1Score: 0,
    p2Score: 0,
    mode: 'tug',
    p1Ready: false,
    p2Ready: false,
    bellAt: 0,
    roundState: 'idle',
    falseStart: 0,
  };
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function loadState(env: Env, room: string): Promise<DuelState> {
  if (!env.VISITS) return freshState();
  const raw = await env.VISITS.get(`duel:${room}:state`);
  if (!raw) return freshState();
  try {
    const parsed = JSON.parse(raw);
    return parsed as DuelState;
  } catch {
    return freshState();
  }
}

async function saveState(env: Env, room: string, state: DuelState): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(`duel:${room}:state`, JSON.stringify(state), {
    expirationTtl: STATE_TTL,
  });
}

async function loadEvents(env: Env, room: string): Promise<DuelEvent[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(`duel:${room}:events`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveEvents(env: Env, room: string, events: DuelEvent[]): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(`duel:${room}:events`, JSON.stringify(events), {
    expirationTtl: EVENTS_TTL,
  });
}

async function loadSignals(env: Env, room: string): Promise<DuelSignal[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(`duel:${room}:signals`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSignals(env: Env, room: string, signals: DuelSignal[]): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(`duel:${room}:signals`, JSON.stringify(signals), {
    expirationTtl: SIGNALS_TTL,
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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const room = url.searchParams.get('room') || '';
  if (!ROOM_RE.test(room)) {
    return json({ ok: false, reason: 'bad-room' }, { status: 400 });
  }
  const since = Number(url.searchParams.get('since')) || 0;
  const forPid = url.searchParams.get('for') || '';
  const sigSince = Number(url.searchParams.get('sigSince')) || 0;
  const state = await loadState(env, room);
  const events = await loadEvents(env, room);
  const filtered = events.filter((e) => (e.t || 0) > since);
  let signals: DuelSignal[] = [];
  if (forPid) {
    const all = await loadSignals(env, room);
    signals = all.filter((s) => s.to === forPid && (s.t || 0) > sigSince);
  }
  return json(
    { ok: true, state, events: filtered, signals, now: Date.now() },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });

  let body: {
    room?: unknown;
    sessionId?: unknown;
    kind?: unknown;
    side?: unknown;
    to?: unknown;
    signal?: unknown;
    mode?: unknown;       // for kind=join: requested mode (first join wins)
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const room = typeof body.room === 'string' ? body.room : '';
  if (!ROOM_RE.test(room)) {
    return json({ ok: false, reason: 'bad-room' }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) {
    return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  }
  const pid = (await sha256(sessionId)).slice(0, 10);
  const kind = typeof body.kind === 'string' ? body.kind : 'tap';

  const state = await loadState(env, room);

  // ── kind=join: assign side, idempotent if pid already seated ──
  if (kind === 'join') {
    if (state.p1Pid === pid) {
      return json({ ok: true, side: 1, state });
    }
    if (state.p2Pid === pid) {
      return json({ ok: true, side: 2, state });
    }
    if (!state.p1Pid) {
      state.p1Pid = pid;
      // First join sets the room mode. Subsequent joins read the mode
      // out of state (we don't let the second player override).
      if (typeof body.mode === 'string') {
        const m = body.mode;
        if (m === 'tug' || m === 'race' || m === 'duel') state.mode = m;
      }
      await saveState(env, room, state);
      return json({ ok: true, side: 1, state });
    }
    if (!state.p2Pid) {
      state.p2Pid = pid;
      await saveState(env, room, state);
      return json({ ok: true, side: 2, state });
    }
    // Room is full and pid isn't a seated player → spectator
    return json({ ok: true, side: 0, state, role: 'spectator' });
  }

  // ── kind=ready (duel mode only): mark this side ready. When both
  // sides are ready, server picks a random bell time 2-5s out and
  // broadcasts it via state. Either side tapping before the bell
  // forfeits the round (false start); first to tap after wins.
  if (kind === 'ready') {
    if (state.mode !== 'duel') {
      return json({ ok: false, reason: 'not-duel-mode' }, { status: 400 });
    }
    if (state.p1Pid !== pid && state.p2Pid !== pid) {
      return json({ ok: false, reason: 'not-a-player' }, { status: 403 });
    }
    if (state.roundState === 'arming' || state.roundState === 'resolved') {
      return json({ ok: true, state });
    }
    if (state.p1Pid === pid) state.p1Ready = true;
    if (state.p2Pid === pid) state.p2Ready = true;
    if (state.p1Ready && state.p2Ready) {
      const offset = DUEL_BELL_MIN_MS + Math.floor(Math.random() * (DUEL_BELL_MAX_MS - DUEL_BELL_MIN_MS));
      state.bellAt = Date.now() + offset;
      state.roundState = 'arming';
    }
    await saveState(env, room, state);
    return json({ ok: true, state });
  }

  if (kind === 'signal') {
    if (state.p1Pid !== pid && state.p2Pid !== pid) {
      return json({ ok: false, reason: 'not-a-player' }, { status: 403 });
    }
    const to = typeof body.to === 'string' ? body.to.slice(0, 12) : '';
    if (!to || (to !== state.p1Pid && to !== state.p2Pid)) {
      return json({ ok: false, reason: 'bad-recipient' }, { status: 400 });
    }
    const sig = body.signal;
    if (
      !sig ||
      typeof sig !== 'object' ||
      typeof (sig as Record<string, unknown>).payload !== 'string' ||
      typeof (sig as Record<string, unknown>).kind !== 'string'
    ) {
      return json({ ok: false, reason: 'bad-signal' }, { status: 400 });
    }
    const sigKind = (sig as { kind: string }).kind;
    if (sigKind !== 'offer' && sigKind !== 'answer' && sigKind !== 'ice' && sigKind !== 'bye') {
      return json({ ok: false, reason: 'bad-signal-kind' }, { status: 400 });
    }
    const payload = (sig as { payload: string }).payload;
    if (payload.length > SIGNAL_PAYLOAD_CAP) {
      return json({ ok: false, reason: 'signal-too-large' }, { status: 413 });
    }
    const t = Date.now();
    const id = (
      Math.random().toString(36).slice(2, 6) +
      Math.random().toString(36).slice(2, 6)
    );
    const newSignal: DuelSignal = {
      from: pid,
      to,
      payload,
      kind: sigKind as 'offer' | 'answer' | 'ice' | 'bye',
      t,
      id,
    };
    const all = await loadSignals(env, room);
    all.push(newSignal);
    const trimmed = all
      .filter((s) => t - (s.t || 0) < SIGNALS_TTL * 1000)
      .slice(-SIGNALS_CAP);
    await saveSignals(env, room, trimmed);
    return json({ ok: true, t, id });
  }

  // ── kind=reset: zero the score, keep the seats ──
  if (kind === 'reset') {
    if (state.p1Pid !== pid && state.p2Pid !== pid) {
      return json({ ok: false, reason: 'not-a-player' }, { status: 403 });
    }
    state.p1Score = 0;
    state.p2Score = 0;
    state.winner = 0;
    state.startedAt = Date.now();
    state.p1Ready = false;
    state.p2Ready = false;
    state.bellAt = 0;
    state.roundState = 'idle';
    state.falseStart = 0;
    await saveState(env, room, state);
    await saveEvents(env, room, []);
    return json({ ok: true, state });
  }

  // ── kind=tap (default) ──
  if (kind !== 'tap') {
    return json({ ok: false, reason: 'unknown-kind' }, { status: 400 });
  }
  const side = body.side === 1 || body.side === 2 ? body.side : 0;
  if (side === 0) {
    return json({ ok: false, reason: 'bad-side' }, { status: 400 });
  }
  // Validate the side matches the seat
  if (side === 1 && state.p1Pid !== pid) {
    return json({ ok: false, reason: 'not-p1' }, { status: 403 });
  }
  if (side === 2 && state.p2Pid !== pid) {
    return json({ ok: false, reason: 'not-p2' }, { status: 403 });
  }
  if (state.winner !== 0) {
    // Game over, taps ignored until reset
    return json({ ok: true, state, ignored: 'winner-set' });
  }

  const t = Date.now();

  // duel mode: tap timing decides the round
  if (state.mode === 'duel') {
    if (state.roundState !== 'arming') {
      return json({ ok: true, state, ignored: 'not-armed' });
    }
    const bell = state.bellAt || 0;
    if (t < bell) {
      // FALSE START — tapper loses, opponent wins
      state.falseStart = side as 0 | 1 | 2;
      state.winner = side === 1 ? 2 : 1;
      state.roundState = 'resolved';
    } else {
      // Valid tap after bell — first to land wins
      state.winner = side as 0 | 1 | 2;
      state.roundState = 'resolved';
    }
    await saveState(env, room, state);
    return json({ ok: true, state, t });
  }

  // tug / race mode: same scoring
  if (side === 1) {
    state.p1Score += 1;
    if (state.p1Score >= WIN_TAPS) state.winner = 1;
  } else {
    state.p2Score += 1;
    if (state.p2Score >= WIN_TAPS) state.winner = 2;
  }

  const evt: DuelEvent = {
    side,
    t,
    pid,
    n: side === 1 ? state.p1Score : state.p2Score,
  };
  const events = await loadEvents(env, room);
  events.push(evt);
  // Trim to last EVENTS_CAP and drop > 60s old
  const trimmed = events
    .filter((e) => t - (e.t || 0) < EVENTS_TTL * 1000)
    .slice(-EVENTS_CAP);
  await saveEvents(env, room, trimmed);
  await saveState(env, room, state);

  return json({ ok: true, state, t, n: evt.n });
};
