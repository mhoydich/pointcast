/**
 * /api/light — Light Companion. A circle of people, one light each. Page: /light/.
 * Library: functions/_lib/light-store.mjs. Signal format: docs/light-signal.md.
 *
 * The circle link is the only key. Anyone who has it can read the circle,
 * join it, light or snuff a light, rename, and put the circle out. There are
 * no accounts. The circle id travels in a header or a JSON body, never in a
 * query string, so it stays out of URL logs.
 *
 * GET, header X-Light-Circle: <id>
 *   { ok, schema, now, version, store, notice,
 *     circle: { createdAt, memberCap, members: [{ id, name, colour, mode, lit, litAt, expiresAt }] },
 *     signals: [light signal], drum: { room, page } }
 *
 * POST { action: "create" }                                    201 { ok, id, path, ...state }
 * POST { action: "join",   circle, name, colour }              { ok, member, ...state }
 * POST { action: "update", circle, member, name?, colour?, mode? }
 * POST { action: "light",  circle, member, mode?: "tonight"|"hour", until?: <UTC ms> }
 * POST { action: "snuff",  circle, member }
 * POST { action: "remove", circle, member }                    take one light out of the circle
 * POST { action: "put_out", circle, confirm: "put out" }       delete the circle and everything in it
 *
 * Limits: 2 KB bodies, 12 lights a circle, 24-character names, 40 changes a
 * minute per circle, 6 new circles an hour per caller, circles untouched for
 * 90 days are deleted. Reads are not counted against a limit.
 *
 * Not an emergency or monitoring service. It cannot call for help.
 */
import { rateLimit } from '../_rate-limit.ts';
import { NOTICE, actOnCircle, createCircle, putOutCircle, readCircle, storeFor } from '../_lib/light-store.mjs';

type LightEnv = { AUTH_DB?: D1Database; PC_RATES_KV?: KVNamespace };

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Light-Circle',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
};
const BODY_MAX = 2 * 1024;
const ACTIONS = new Set(['join', 'update', 'light', 'snuff', 'remove']);

function json(body: Record<string, unknown>, status = 200, extra: Record<string, string> = {}) {
  const { status: _drop, ...rest } = body;
  return new Response(JSON.stringify(rest), { status, headers: { ...HEADERS, ...extra } });
}

/**
 * Who is asking to make a circle, for the create limit only. The shared
 * limiter would key on the raw address; this hands it a hash that changes
 * every UTC day instead, so no address is written anywhere by this endpoint.
 */
async function callerKey(request: Request): Promise<string> {
  const address = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`pointcast-light:${day}:${address}`));
  return `light:${Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export const onRequestOptions: PagesFunction<LightEnv> = () =>
  new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<LightEnv> = async ({ request, env }) => {
  const circle = request.headers.get('x-light-circle') || '';
  if (!circle) {
    return json({
      ok: true,
      schema: 'pointcast.light/v0',
      what: 'Light Companion: a small shared light between people. Presence only. No messages, no feed, no accounts.',
      page: 'https://pointcast.xyz/light/',
      about: 'https://pointcast.xyz/light.json',
      read: 'GET /api/light with header X-Light-Circle: <the id at the end of a circle link>',
      notice: NOTICE,
    });
  }
  try {
    const result = await readCircle(storeFor(env), circle);
    return json(result, result.status);
  } catch {
    return json({ ok: false, error: 'The circle store is not answering right now.' }, 503);
  }
};

export const onRequestPost: PagesFunction<LightEnv> = async ({ request, env }) => {
  if (Number(request.headers.get('content-length') || 0) > BODY_MAX) return json({ ok: false, error: 'body too large' }, 413);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > BODY_MAX) return json({ ok: false, error: 'body too large' }, 413);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    body = parsed;
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }

  const action = String(body.action || '');
  const store = storeFor(env);
  try {
    if (action === 'create') {
      const limited = await rateLimit(request, env, { bucket: 'light:create', windowSec: 3600, maxRequests: 6, clientId: await callerKey(request) });
      if (!limited.allowed) return json({ ok: false, error: 'Six new circles an hour, please.' }, 429, { 'Retry-After': String(limited.retryAfter) });
      const made = await createCircle(store);
      return json({ ...made.state, id: made.id, path: `/light/c/${made.id}` }, 201);
    }
    const circle = typeof body.circle === 'string' ? body.circle : '';
    if (action === 'put_out') {
      if (body.confirm !== 'put out') return json({ ok: false, error: 'To delete the circle, send confirm: "put out".' }, 400);
      const result = await putOutCircle(store, circle);
      return json(result, result.status);
    }
    if (!ACTIONS.has(action)) return json({ ok: false, error: 'action must be create, join, update, light, snuff, remove or put_out.' }, 400);
    const result = await actOnCircle(store, circle, action, body);
    return json(result, result.status);
  } catch {
    return json({ ok: false, error: 'The circle store is not answering right now.' }, 503);
  }
};
