/**
 * /api/drum/signal — the universal drum channel.
 *
 * Anything can beat the PointCast drum: a page on another site, a Claude
 * artifact, a script, an agent. Every beat lands on the same global counter
 * as /drum and is tallied by source so /drum-signal can show where the beat
 * is coming from.
 *
 * POST /api/drum/signal
 *   body (JSON, or text/plain JSON so navigator.sendBeacon works):
 *     { beats?: 1-100, app?: string, kind?: string, place?: string, sessionId?: string }
 *   → { ok, globalTotal, yourTotal, source }
 *
 *   `sessionId` is optional. With one, the beats also count toward that
 *   drummer on the /drum leaderboard; without one they count globally and
 *   by source only.
 *
 * GET /api/drum/signal
 *   → { globalTotal, attributed, unattributed, kinds, sources, places, days, recent }
 */

import { sha256, type Env as VisitsEnv } from '../visit.ts';
import { drumMemberKey, requestCountry, resolveSource } from '../../_lib/drum-signal.ts';
import { readSessionFromRequest, type AuthEnv } from '../auth/session.ts';

interface Env extends VisitsEnv {
  DRUM_COUNTER?: DurableObjectNamespace;
}

const MAX_BEATS_PER_REQ = 100;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...CORS, ...(init?.headers ?? {}) },
  });
}

function counter(env: Env, query: string, init: RequestInit): Promise<Response> | null {
  if (!env.DRUM_COUNTER) return null;
  const id = env.DRUM_COUNTER.idFromName('global');
  return env.DRUM_COUNTER.get(id).fetch(`https://drum-counter.internal/?${query}`, init);
}

/** Same-origin beats from a signed-in member also count on their account. */
async function memberKey(request: Request, env: Env): Promise<string | undefined> {
  try {
    const current = await readSessionFromRequest(request, env as unknown as AuthEnv);
    return current ? await drumMemberKey(current.user.userId) : undefined;
  } catch {
    return undefined;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: {
    beats?: unknown; app?: unknown; kind?: unknown; place?: unknown; sessionId?: unknown; source?: unknown;
  };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return json({ ok: false, reason: 'bad-body' }, { status: 400 });

  const beatsRaw = typeof body.beats === 'number' && Number.isFinite(body.beats) ? Math.floor(body.beats) : 1;
  const beats = Math.max(1, Math.min(MAX_BEATS_PER_REQ, beatsRaw));
  const declared = body.source && typeof body.source === 'object'
    ? body.source
    : { kind: body.kind, app: body.app, place: body.place };
  const source = resolveSource(request, declared, requestCountry(request));

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  let query = '';
  let identity: { leaderboardHash?: string; nounId?: number } = {};
  if (sessionId) {
    const digest = await sha256(sessionId);
    query = `session=${digest.slice(0, 16)}`;
    identity = {
      leaderboardHash: digest.slice(0, 8),
      nounId: parseInt((await sha256(`${sessionId}:noun`)).slice(0, 6), 16) % 1200,
    };
  }

  try {
    const pending = counter(env, query, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: beats, source, ...identity, userKey: await memberKey(request, env) }),
    });
    if (!pending) return json({ ok: false, reason: 'counter-unavailable' }, { status: 503 });
    const response = await pending;
    return new Response(response.body, { status: response.status, headers: { 'Content-Type': 'application/json', ...CORS } });
  } catch {
    return json({ ok: false, reason: 'counter-unavailable' }, { status: 503 });
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const pending = counter(env, 'signal=1', { method: 'GET' });
    if (!pending) return json({ ok: false, reason: 'counter-unavailable' }, { status: 503 });
    const response = await pending;
    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
    });
  } catch {
    return json({ ok: false, reason: 'counter-unavailable' }, { status: 503 });
  }
};

export const onRequestOptions: PagesFunction<Env> = () => new Response(null, { status: 204, headers: CORS });
