/**
 * /api/intercom — KV-backed message log: bug reports + chat-to-Mike.
 *
 * Mike 2026-05-08: "have some type of bug report possibility, easy, and
 * maybe set up a chat that sends messages to me like an intercom."
 *
 * One unified endpoint for both kinds. POST to append, GET to read.
 *
 * POST { kind: 'bug' | 'chat', body, contact?, page, sessionId }
 *   → appends to KV list, returns { ok, id }
 *   → bodies > 2KB rejected; contact > 200 chars rejected; page > 500 chars truncated
 *   → keeps last 500 messages
 *
 * GET → { ok, messages: [...] }
 *   → no auth (private list at /intercom; site is publicly readable)
 *   → returns most recent first
 *
 * GET ?count=1 → { ok, total }
 *   → minimal payload for the floating widget's unread badge
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

interface Message {
  id: string;
  kind: 'bug' | 'chat';
  body: string;
  contact: string;
  page: string;
  pid: string;
  ua: string;
  t: number;
}

const KV_KEY = 'intercom:messages:v1';
const MAX_KEEP = 500;
const TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

async function loadAll(env: Env): Promise<Message[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(KV_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Message[]; } catch { return []; }
}
async function save(env: Env, msgs: Message[]): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(KV_KEY, JSON.stringify(msgs), { expirationTtl: TTL_SECONDS });
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
  const countOnly = url.searchParams.get('count') === '1';
  const messages = await loadAll(env);
  if (countOnly) {
    return json(
      { ok: true, total: messages.length, lastT: messages[0]?.t ?? 0 },
      { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
    );
  }
  return json(
    { ok: true, messages },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });

  let body: { kind?: unknown; body?: unknown; contact?: unknown; page?: unknown; sessionId?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return json({ ok: false, reason: 'bad-body' }, { status: 400 }); }

  const kind = body.kind === 'bug' ? 'bug' : 'chat';
  const text = String(body.body || '').trim().replace(/[<>]/g, '').slice(0, 2000);
  if (!text) return json({ ok: false, reason: 'empty' }, { status: 400 });
  const contact = String(body.contact || '').trim().replace(/[<>]/g, '').slice(0, 200);
  const page = String(body.page || '').trim().slice(0, 500);
  const sessionId = String(body.sessionId || '').slice(0, 128);
  const pid = sessionId ? (await sha256(sessionId)).slice(0, 10) : 'anon';
  const ua = (request.headers.get('user-agent') || '').slice(0, 200);

  const msg: Message = {
    id: `${kind[0]}-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffff).toString(36)}`,
    kind, body: text, contact, page, pid, ua, t: Date.now(),
  };

  const all = await loadAll(env);
  all.unshift(msg);
  if (all.length > MAX_KEEP) all.length = MAX_KEEP;
  await save(env, all);

  return json({ ok: true, id: msg.id, total: all.length });
};
