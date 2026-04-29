/**
 * /api/sounds — cross-client audio event broadcast.
 *
 * When a visitor taps a profile, reacts with an emoji, or drums, they can
 * optionally broadcast that sound event here. Any other visitor who has
 * "hear others" toggled ON polls this endpoint, and plays the matching
 * chime locally. Result: a shared-room audio vibe — you hear the sounds
 * of everyone else interacting with PointCast in near-realtime.
 *
 * Storage: a rolling buffer of the last 50 sound events in KV under
 * `sounds:buffer` (short TTL). Each event is:
 *
 *   {
 *     type: 'profile' | 'emoji' | 'emoji-add' | 'drum',
 *     seed: number,        // e.g. noun_id for profile chimes
 *     t:    number,        // server timestamp ms
 *     pid:  string,        // sender's presence id (so they can self-filter)
 *   }
 *
 * Why KV + polling (not WebSocket / SSE)?
 *   • KV + poll is already what we use for visits + reactions.
 *   • Latency ~2s is fine for a "room vibe" feature; nobody's nashing teeth
 *     over 2s chime lag.
 *   • Durable Objects would give us true sub-second broadcast, but they're
 *     a separate billing + deploy surface — saving that for the DRUM room's
 *     v2 if we need it.
 *
 * POST body:
 *   { type, seed?, sessionId }
 * GET  ?since=<ms timestamp>:
 *   { events: [{type, seed, t, pid}, ...] }
 *     — only events newer than `since`. Responses are bounded to the last
 *     ~30 seconds so a stuck client can't replay the whole buffer.
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const BUFFER_KEY = 'sounds:buffer';
const BUFFER_SIZE = 50;
const BUFFER_TTL_SECONDS = 60;
const MAX_EVENT_AGE_MS = 30_000;
// Allowlist of event families that can fan out across the drum-hub bus.
// Every /drum* surface broadcasts events here; cast surfaces (/drum-tv,
// /drum-tv-v2, /drum-marquee, /drum-radio, /drum-viz, /drum-tv-bingo,
// /drum-tv-gauntlet, /drum-tv-roulette) read them back.
//
// Until 2026-04-29 this set was tight — only 'profile', 'emoji',
// 'emoji-add', 'drum' — which silently rejected every other surface's
// broadcasts (orchestra, choir, lounge, theremin, bells, organ, strings,
// marimba, hang, tr808, harp, rhodes, plus the seven comms tools and
// the games). Tools worked locally (audio played, KV writes succeeded)
// but cross-surface flash was dead. Found 2026-04-29 morning audit
// after the comms-tools sprint exposed the gap.
//
// Now permissively allowlists every event family the hub generates.
const ALLOWED_TYPES = new Set([
  // Original 4
  'profile', 'emoji', 'emoji-add', 'drum',
  // Instrument variants (v2-v18, plus apr26 and the bell rooms)
  'orchestra', 'choir', 'choir-chord', 'symphony', 'lounge',
  'theremin', 'bells', 'organ', 'strings', 'marimba', 'hang',
  'tr808', 'harp', 'rhodes', 'button',
  // Daily / loop / sequencer
  'daily', 'jam', 'jam-amp',
  // Games + meta surfaces
  'potato', 'milestone', 'tap',
  // Kitchen + ritual rooms
  'kettle', 'pace', 'bath',
  // Communication tools shipped 2026-04-28..29
  'shout', 'applause', 'walkie', 'graffiti',
  'letter', 'pin', 'heart',
  'confessional', 'soft',
  // Agent/mcp signaling
  'agent', 'mcp',
]);

interface SoundEvent {
  type: string;
  seed: number;
  t: number;
  pid: string;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function loadBuffer(env: Env): Promise<SoundEvent[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(BUFFER_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' });

  let body: { type?: unknown; seed?: unknown; sessionId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const type = typeof body.type === 'string' ? body.type : '';
  if (!ALLOWED_TYPES.has(type)) {
    return json({ ok: false, reason: 'type-not-allowed' }, { status: 400 });
  }
  const seed = typeof body.seed === 'number' && Number.isFinite(body.seed)
    ? Math.floor(body.seed)
    : 0;
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';

  // Derive a short pid from the session so other clients can self-filter
  // (don't hear your own broadcast back). Separate from presence pid so
  // leaks are minimized.
  const pid = sessionId ? (await sha256(sessionId)).slice(0, 10) : 'anon';

  const now = Date.now();
  const evt: SoundEvent = { type, seed, t: now, pid };

  // Read-modify-write with a soft cap — KV's eventual consistency means
  // two simultaneous POSTs might clobber, acceptable for playful room vibes.
  const buf = await loadBuffer(env);
  buf.unshift(evt);
  const trimmed = buf
    .filter((e) => now - e.t < MAX_EVENT_AGE_MS)
    .slice(0, BUFFER_SIZE);
  await env.VISITS.put(BUFFER_KEY, JSON.stringify(trimmed), {
    expirationTtl: BUFFER_TTL_SECONDS,
  });

  return json({ ok: true });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const sinceParam = url.searchParams.get('since');
  const since = sinceParam ? Number(sinceParam) : 0;
  const now = Date.now();

  const buf = await loadBuffer(env);
  const cutoff = Math.max(since, now - MAX_EVENT_AGE_MS);
  const events = buf
    .filter((e) => e.t > cutoff)
    .sort((a, b) => a.t - b.t);

  return json(
    { events, now },
    { headers: { 'Cache-Control': 'private, max-age=1' } },
  );
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
