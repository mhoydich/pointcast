/** Pages entry for invitation-only, append-only Keyboard Studio rooms. */
import { rateLimit } from '../_rate-limit';

interface Env {
  KEYBOARD_STUDIO?: DurableObjectNamespace;
  PC_RATES_KV?: KVNamespace;
}

const ROOM_ID_PATTERN = /^[0-9a-f]{32}$/;
const MAX_BODY_BYTES = 12_000;

function json(value: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const request = ctx.request;
  const url = new URL(request.url);
  const room = url.searchParams.get('room');
  if (!room || !ROOM_ID_PATTERN.test(room)) return json({ error: 'invalid-room' }, 400);
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'method-not-allowed' }, 405, { Allow: 'GET, POST' });
  }
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');
    const site = request.headers.get('sec-fetch-site');
    if ((origin && origin !== url.origin) || (site && site !== 'same-origin' && site !== 'none')) {
      return json({ error: 'same-origin-only' }, 403);
    }
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
      return json({ error: 'expected-json' }, 415);
    }
    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return json({ error: 'body-too-large' }, 413);
    }
  }

  const studio = ctx.env.KEYBOARD_STUDIO;
  if (!studio) return json({ error: 'studio-unavailable' }, 503);

  if (request.method === 'POST') {
    const rate = await rateLimit(request, ctx.env, { bucket: 'keyboard-studio:post', windowSec: 60, maxRequests: 12 });
    if (!rate.allowed) return json({ error: 'rate-limited', retryAfter: rate.retryAfter }, 429, { 'Retry-After': String(rate.retryAfter) });
  }

  try {
    const id = studio.idFromName(`keyboard-studio:${room}`);
    return await studio.get(id).fetch(request);
  } catch {
    return json({ error: 'studio-unavailable' }, 503);
  }
};
