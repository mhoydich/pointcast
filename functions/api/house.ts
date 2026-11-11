/**
 * /api/house — House Channel pairing. Pages: /house/ (the TV) and /house/r/ (the phone).
 * Library: functions/_lib/house-pairing.mjs. About: /house.json.
 *
 * A TV asks for a short code. A phone trades the code for the name of a party
 * room on the existing drum-room relay (/api/drum/room, `bc-` rooms). After
 * that the TV and the phones talk over the relay and this endpoint is not
 * involved. No accounts. Nothing about what is on the TV is stored here.
 *
 * GET                                        what this is
 * POST { action: "open" }                    201 { ok, code, room, key, drum, expiresAt, ttlSec, store }
 * POST { action: "open", room, key }         a fresh code for the same room; the old code stops working
 * POST { action: "join", code }              { ok, room, expiresAt }   404 no-such-code
 * POST { action: "end",  room, key }         the code and the room record are deleted
 *
 * Limits: 512-byte bodies; 8 join tries a minute and 20 opens per ten minutes
 * per caller; codes last ten minutes; a room record lasts six hours at most.
 * The caller is counted by a hash of its address that changes every UTC day;
 * no address is written anywhere by this endpoint.
 *
 * Storage: HOUSE_KV if bound, else PC_RATES_KV, else memory (store: "memory",
 * which only works on one machine and is for local runs).
 */
import { rateLimit } from '../_rate-limit.ts';
// @ts-ignore — plain module shared with the tests
import { endPairing, joinPairing, openPairing, storeFor } from '../_lib/house-pairing.mjs';

type HouseEnv = { HOUSE_KV?: KVNamespace; PC_RATES_KV?: KVNamespace };

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
};
const BODY_MAX = 512;

function json(body: Record<string, unknown>, status = 200, extra: Record<string, string> = {}) {
  const { status: _drop, ...rest } = body;
  return new Response(JSON.stringify(rest), { status, headers: { ...HEADERS, ...extra } });
}

async function callerKey(request: Request): Promise<string> {
  const address = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`pointcast-house:${day}:${address}`));
  return `house:${Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export const onRequestOptions: PagesFunction<HouseEnv> = () =>
  new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<HouseEnv> = ({ env }) =>
  json({
    ok: true,
    schema: 'pointcast.house/v0',
    what: 'House Channel: a TV page and a phone remote, paired by a short code. No accounts, no app.',
    tv: 'https://pointcast.xyz/house/',
    remote: 'https://pointcast.xyz/house/r/',
    about: 'https://pointcast.xyz/house.json',
    pair: 'POST { action: "open" } from the TV, then POST { action: "join", code } from the phone.',
    relay: '/api/drum/room?room=<room>&sid=<id> (WebSocket, party frames)',
    store: storeFor(env).kind,
  });

export const onRequestPost: PagesFunction<HouseEnv> = async ({ request, env }) => {
  if (Number(request.headers.get('content-length') || 0) > BODY_MAX) return json({ ok: false, error: 'body-too-large' }, 413);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > BODY_MAX) return json({ ok: false, error: 'body-too-large' }, 413);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    body = parsed;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  const action = String(body.action || '');
  const store = storeFor(env);
  try {
    if (action === 'open') {
      const limited = await rateLimit(request, env, { bucket: 'house:open', windowSec: 600, maxRequests: 20, clientId: await callerKey(request) });
      if (!limited.allowed) return json({ ok: false, error: 'rate-limited', message: 'Too many new codes from here. Try again in a few minutes.' }, 429, { 'Retry-After': String(limited.retryAfter) });
      const args = body.room !== undefined || body.key !== undefined ? { room: body.room, key: body.key } : {};
      const result = await openPairing(store, args);
      return json(result, result.status);
    }
    if (action === 'join') {
      const limited = await rateLimit(request, env, { bucket: 'house:join', windowSec: 60, maxRequests: 8, clientId: await callerKey(request) });
      if (!limited.allowed) return json({ ok: false, error: 'rate-limited', message: 'Too many tries. Wait a minute, then enter the code on the TV.' }, 429, { 'Retry-After': String(limited.retryAfter) });
      const result = await joinPairing(store, body.code);
      return json(result, result.status);
    }
    if (action === 'end') {
      const result = await endPairing(store, { room: body.room, key: body.key });
      return json(result, result.status);
    }
    return json({ ok: false, error: 'bad-action', message: 'action must be open, join or end.' }, 400);
  } catch {
    return json({ ok: false, error: 'store-down', message: 'The pairing store is not answering right now.' }, 503);
  }
};
