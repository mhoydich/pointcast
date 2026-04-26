/**
 * /api/drum/track — collaborative "now playing" track for the v3 drum room.
 *
 * One global track at a time (the room is one room). When any client POSTs
 * a Spotify track id, all polling clients pick it up within a few seconds
 * and load the same iframe player. Stored in KV under `drum:track:current`
 * with a 1-hour TTL so stale tracks expire when nobody's playing.
 *
 * GET  /api/drum/track
 *   response: { track: { id, setBy, setAt, source } | null, now: number }
 *
 * POST /api/drum/track
 *   body: { trackId: string, sessionId: string, source?: 'spotify' }
 *   response: { ok, track, now }
 *
 * Anti-griefing: trackId is loosely validated (Spotify track ids are 22
 * base62 chars). Anyone can change the track, but rate-limited via
 * keepalive batching on the client. If griefing becomes a problem, gate
 * track-set on wallet-connected sessions.
 */

import type { Env } from '../visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const KEY = 'drum:track:current';
const TTL_SECONDS = 60 * 60; // 1h
const SPOTIFY_ID_RE = /^[A-Za-z0-9]{22}$/;

interface RoomTrack {
  id: string;
  setBy: string;       // first 8 chars of sha256(sessionId), anonymized
  setAt: number;
  source: 'spotify';
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function sha256short(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.VISITS) return json({ track: null, now: Date.now() });
  const raw = await env.VISITS.get(KEY);
  let track: RoomTrack | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.id === 'string' &&
        typeof parsed.setBy === 'string' &&
        typeof parsed.setAt === 'number'
      ) {
        track = parsed as RoomTrack;
      }
    } catch { /* ignore */ }
  }
  return json(
    { track, now: Date.now() },
    { headers: { 'Cache-Control': 'public, max-age=3' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) {
    return json({ ok: false, error: 'kv_unavailable' }, { status: 503 });
  }
  let body: { trackId?: unknown; sessionId?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const trackId = typeof body.trackId === 'string' ? body.trackId.trim() : '';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  if (!SPOTIFY_ID_RE.test(trackId)) {
    return json({ ok: false, error: 'invalid_track_id' }, { status: 400 });
  }
  const setBy = sessionId ? await sha256short(sessionId) : 'anon0000';
  const track: RoomTrack = {
    id: trackId,
    setBy,
    setAt: Date.now(),
    source: 'spotify',
  };
  try {
    await env.VISITS.put(KEY, JSON.stringify(track), {
      expirationTtl: TTL_SECONDS,
    });
  } catch {
    return json({ ok: false, error: 'kv_write_failed' }, { status: 500 });
  }
  return json({ ok: true, track, now: Date.now() });
};

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
