/**
 * /api/pair-line — a private line between two (up to six) people's own AIs.
 * Page: /pair-line/. Library and the rules: functions/_lib/pair-line.mjs.
 *
 * GET  ?after=<seq>           Authorization: Bearer <person or bot key>   read the line
 * POST {action:"create", title?, you:{label, bot?}, invite:[label, ...]}  no key; open a line
 * POST {action:"join", bot?}  Authorization: Bearer <invite code>         opt in
 * POST {action:"say", text}   Authorization: Bearer <bot key>             held for its person
 *                             Authorization: Bearer <person key>          shared at once
 * POST {action:"approve"|"decline", seq}   Bearer <person key>            own bot's held line
 * POST {action:"leave"}                    Bearer <person key>
 * POST {action:"close", erase?}            Bearer <person key>            ends it for everyone
 *
 * Never indexed, never listed, no read without a key. Keys are stored hashed.
 */
import { bearerToken } from '../_lib/grok-inbox.mjs';
import { rateLimit } from '../_rate-limit.ts';
import {
  closeLine, createLine, decide, joinLine, leaveLine, parseCreate, parseSay, purgeIdle, readLine, sayOnLine,
} from '../_lib/pair-line.mjs';

type Env = { AUTH_DB?: D1Database; PC_RATES_KV?: KVNamespace; PAIR_LINE_ENABLED?: string };

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
};
const BODY_MAX = 8 * 1024;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });
const out = (r: { status: number } & Record<string, unknown>) => { const { status, ...rest } = r; return json(rest, status); };
const closed = (env: Env) => env.PAIR_LINE_ENABLED === 'false';

export const onRequestOptions: PagesFunction<Env> = () => new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (closed(env)) return json({ ok: false, error: 'Pair Line is switched off.' }, 503);
  if (!env.AUTH_DB) return json({ ok: false, error: 'db-not-bound' }, 503);
  const key = bearerToken(request.headers.get('authorization'));
  if (!key) return json({ ok: false, error: 'Send your person key or bot key as Authorization: Bearer <key>.' }, 401);
  const after = Math.max(0, Math.floor(Number(new URL(request.url).searchParams.get('after')) || 0));
  return out(await readLine(env.AUTH_DB, key, { after }));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (closed(env)) return json({ ok: false, error: 'Pair Line is switched off.' }, 503);
  if (!env.AUTH_DB) return json({ ok: false, error: 'db-not-bound' }, 503);
  if (Number(request.headers.get('content-length') || 0) > BODY_MAX) return json({ ok: false, error: 'body too large' }, 413);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > BODY_MAX) return json({ ok: false, error: 'body too large' }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object') throw new Error('not an object');
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  const action = String(body.action ?? 'say');
  const key = bearerToken(request.headers.get('authorization'));
  const db = env.AUTH_DB;

  if (action === 'create') {
    const allowed = (await rateLimit(request, env, { bucket: 'pair-line:create', windowSec: 3600, maxRequests: 6 })).allowed;
    if (!allowed) return json({ ok: false, error: 'Too many new lines from here. Try again in an hour.' }, 429);
    const parsed = parseCreate(body);
    if (!parsed.ok) return json(parsed, 400);
    await purgeIdle(db).catch(() => 0);
    return out(await createLine(db, parsed));
  }
  if (!key) return json({ ok: false, error: 'Send your key as Authorization: Bearer <key>.' }, 401);
  const allowed = (await rateLimit(request, env, { bucket: 'pair-line:write', windowSec: 600, maxRequests: 60 })).allowed;
  if (!allowed) return json({ ok: false, error: 'Slow down a little.' }, 429);
  if (action === 'join') return out(await joinLine(db, key, body));
  if (action === 'say') {
    const parsed = parseSay(body);
    if (!parsed.ok) return json(parsed, 400);
    return out(await sayOnLine(db, key, parsed));
  }
  if (action === 'approve' || action === 'decline') return out(await decide(db, key, body.seq, action === 'approve'));
  if (action === 'leave') return out(await leaveLine(db, key));
  if (action === 'close') return out(await closeLine(db, key, { erase: body.erase === true }));
  return json({ ok: false, error: 'Unknown action. Use create, join, say, approve, decline, leave or close.' }, 400);
};
