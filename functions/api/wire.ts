/**
 * /api/wire — The Wire. Twitter-style live message stream for PointCast.
 *
 * Anyone in the room can drop a short line (≤200 chars). It shows up on
 * everyone else's screen within ~2s (polling) and plays the author's
 * Noun chime on arrival so every message has its own little voice.
 *
 * Storage: rolling buffer of the last 50 messages in KV under `wire:buffer`,
 * TTL short so stale stuff auto-expires. Each message:
 *
 *   {
 *     id:     string,   // 10-char random (for dedup on client)
 *     t:      number,   // server timestamp ms
 *     text:   string,   // ≤200 chars, stripped + collapsed whitespace
 *     nounId: number,   // 0-1199 — drives chime voice + avatar
 *     pid:    string,   // author's presence id (12 chars of sha256(ip))
 *   }
 *
 * Rate limiting: 1 post per 15s per pid, enforced via
 * `wire:rl:{pid}` KV key with 15s TTL (set on each post).
 *
 * Max message age served: 1 hour. Anything older is filtered out at read
 * time — so even if the buffer writes don't trim, the feed stays fresh.
 *
 * Why KV + polling (same reasoning as /api/sounds): we already poll for
 * presence, reactions, drums, and sounds, so the Wire piggybacks on the
 * same client polling loop and the same infra. ~2s latency is fine for
 * a "live room" feel. If we ever want sub-second we'd graduate to a
 * Cloudflare Durable Object; deferred until traffic demands it.
 *
 * POST body:
 *   { text: string, nounId: number, sessionId: string }
 * GET  ?since=<ms timestamp>:
 *   { messages: [...], now }
 *     — only messages newer than `since`, max 20 returned.
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const BUFFER_KEY = 'wire:buffer';
const RATE_LIMIT_PREFIX = 'wire:rl:';
const BUFFER_SIZE = 50;
const BUFFER_TTL_SECONDS = 3600;        // 1 hour — buffer auto-expires
const MAX_MESSAGE_AGE_MS = 3600_000;    // only serve messages <1h old
const MAX_TEXT_LEN = 200;
const RATE_LIMIT_SECONDS = 15;

export interface WireMessage {
  id: string;
  t: number;
  text: string;
  nounId: number;
  pid: string;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function loadBuffer(env: Env): Promise<WireMessage[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(BUFFER_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

/** Clean user text: strip control chars, collapse whitespace, cap length.
 *  No HTML allowed — we render text-only on the client with textContent
 *  assignment, so even if something slipped through it wouldn't be an XSS
 *  vector, but we strip proactively for display sanity. */
function cleanText(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .replace(/\s+/g, ' ')                             // collapse whitespace
    .trim()
    .slice(0, MAX_TEXT_LEN);
}

function genId(): string {
  // 10 base36 chars ≈ 51 bits — more than enough for dedup collision
  // avoidance within our 50-message buffer.
  return Math.random().toString(36).slice(2, 12);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' });

  let body: { text?: unknown; nounId?: unknown; sessionId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const rawText = typeof body.text === 'string' ? body.text : '';
  const text = cleanText(rawText);
  if (!text) return json({ ok: false, reason: 'empty' }, { status: 400 });

  const nounId = typeof body.nounId === 'number' && Number.isFinite(body.nounId)
    ? Math.max(0, Math.min(1199, Math.floor(body.nounId)))
    : 0;

  // Derive pid from IP (real signal — so rate limiting can't be bypassed by
  // rolling a new session). Falls back to sessionId-only if IP missing
  // (local dev). 12-char sha256 slice — can't be reversed to an IP.
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  const pidSource = ip || sessionId || 'anon';
  const pid = (await sha256(pidSource)).slice(0, 12);

  // Rate limit check — existing key = blocked.
  const rlKey = `${RATE_LIMIT_PREFIX}${pid}`;
  const existing = await env.VISITS.get(rlKey);
  if (existing) {
    return json({ ok: false, reason: 'rate-limited', retryIn: RATE_LIMIT_SECONDS }, { status: 429 });
  }

  const now = Date.now();
  const msg: WireMessage = { id: genId(), t: now, text, nounId, pid };

  // Read-modify-write. KV eventual consistency means two simultaneous posts
  // might race — acceptable; worst case one gets dropped and the sender
  // sees their own optimistic message disappear on next poll.
  const buf = await loadBuffer(env);
  buf.unshift(msg);
  const trimmed = buf
    .filter((m) => now - m.t < MAX_MESSAGE_AGE_MS)
    .slice(0, BUFFER_SIZE);

  await Promise.all([
    env.VISITS.put(BUFFER_KEY, JSON.stringify(trimmed), {
      expirationTtl: BUFFER_TTL_SECONDS,
    }),
    env.VISITS.put(rlKey, '1', { expirationTtl: RATE_LIMIT_SECONDS }),
  ]);

  return json({ ok: true, message: msg });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const sinceParam = url.searchParams.get('since');
  const since = sinceParam ? Number(sinceParam) : 0;
  const now = Date.now();

  const buf = await loadBuffer(env);
  const cutoff = Math.max(since, now - MAX_MESSAGE_AGE_MS);
  // Return newest-first for paint; client sorts to chronological for display.
  const messages = buf
    .filter((m) => m.t > cutoff)
    .sort((a, b) => b.t - a.t)
    .slice(0, 20);

  return json(
    { messages, now },
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
