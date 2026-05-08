/**
 * /api/intercom — KV-backed message log: bug + chat + replies.
 *
 * Mike 2026-05-08 v2: "build out intercom" — replies, resolve/read flags,
 * per-pid GET for the visitor inbox.
 */
import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
function json(b: unknown, init?: ResponseInit): Response { return new Response(JSON.stringify(b), { ...init, headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) } }); }
interface Reply { body: string; t: number; from: 'mike' }
interface Message { id: string; kind: 'bug'|'chat'; body: string; contact: string; page: string; pid: string; ua: string; t: number; replies?: Reply[]; resolved?: boolean; readByMike?: boolean }
const KV_KEY = 'intercom:messages:v1';
const MAX_KEEP = 500;
const TTL_SECONDS = 60 * 60 * 24 * 365;
async function loadAll(env: Env): Promise<Message[]> { if (!env.VISITS) return []; const raw = await env.VISITS.get(KV_KEY); if (!raw) return []; try { return JSON.parse(raw) as Message[]; } catch { return []; } }
async function save(env: Env, msgs: Message[]): Promise<void> { if (!env.VISITS) return; await env.VISITS.put(KV_KEY, JSON.stringify(msgs), { expirationTtl: TTL_SECONDS }); }
function clean(s: string, max: number): string { return String(s || '').trim().replace(/[<>]/g, '').slice(0, max); }

export const onRequestOptions: PagesFunction<Env> = () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const countOnly = url.searchParams.get('count') === '1';
  const sessionId = url.searchParams.get('sessionId') || '';
  const messages = await loadAll(env);
  if (countOnly) {
    const unreplied = messages.filter(m => !m.replies || m.replies.length === 0).length;
    const unread = messages.filter(m => !m.readByMike).length;
    return json({ ok: true, total: messages.length, unrepliedCount: unreplied, unreadByMikeCount: unread, lastT: messages[0]?.t ?? 0 }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  }
  if (sessionId) {
    const pid = (await sha256(sessionId)).slice(0, 10);
    const mine = messages.filter(m => m.pid === pid);
    return json({ ok: true, messages: mine, pid }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  }
  return json({ ok: true, messages }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });
  let body: any;
  try { body = await request.json(); } catch { return json({ ok: false, reason: 'bad-body' }, { status: 400 }); }
  const kind = String(body.kind || '');
  const all = await loadAll(env);

  if (kind === 'reply') {
    const parentId = clean(body.parentId, 60);
    const text = clean(body.body, 2000);
    if (!parentId) return json({ ok: false, reason: 'missing-parent' }, { status: 400 });
    if (!text) return json({ ok: false, reason: 'empty' }, { status: 400 });
    const msg = all.find(m => m.id === parentId);
    if (!msg) return json({ ok: false, reason: 'not-found' }, { status: 404 });
    msg.replies = msg.replies || [];
    msg.replies.push({ body: text, t: Date.now(), from: 'mike' });
    msg.readByMike = true;
    await save(env, all);
    return json({ ok: true, id: parentId, replies: msg.replies.length });
  }

  if (kind === 'mark') {
    const parentId = clean(body.parentId, 60);
    const action = String(body.action || '');
    if (!parentId) return json({ ok: false, reason: 'missing-parent' }, { status: 400 });
    const msg = all.find(m => m.id === parentId);
    if (!msg) return json({ ok: false, reason: 'not-found' }, { status: 404 });
    if (action === 'resolve') msg.resolved = true;
    else if (action === 'unresolve') msg.resolved = false;
    else if (action === 'read') msg.readByMike = true;
    else if (action === 'unread') msg.readByMike = false;
    else return json({ ok: false, reason: 'bad-action' }, { status: 400 });
    await save(env, all);
    return json({ ok: true, id: parentId, resolved: msg.resolved, readByMike: msg.readByMike });
  }

  const newKind = kind === 'bug' ? 'bug' : 'chat';
  const text = clean(body.body, 2000);
  if (!text) return json({ ok: false, reason: 'empty' }, { status: 400 });
  const contact = clean(body.contact, 200);
  const page = clean(body.page, 500);
  const sessionId = String(body.sessionId || '').slice(0, 128);
  const pid = sessionId ? (await sha256(sessionId)).slice(0, 10) : 'anon';
  const ua = (request.headers.get('user-agent') || '').slice(0, 200);
  const msg: Message = { id: `${newKind[0]}-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffff).toString(36)}`, kind: newKind, body: text, contact, page, pid, ua, t: Date.now(), replies: [], resolved: false, readByMike: false };
  all.unshift(msg);
  if (all.length > MAX_KEEP) all.length = MAX_KEEP;
  await save(env, all);
  return json({ ok: true, id: msg.id, total: all.length, pid });
};
