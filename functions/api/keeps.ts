/**
 * /api/keeps — a member's kept Shortwave posts and links (their shelf on /me).
 *
 * Private to the signed-in account: the session cookie names the user, the
 * shelf is one KV document per user, newest first, capped. Visitors without
 * an account keep things in their own browser instead and can bring them
 * along when they sign in (POST { items: [...] } merges). Writes must come
 * from our own pages. Every field is bounded plain text; image and url must
 * be https. Callers render with textContent.
 */
import { readSessionFromRequest, type AuthEnv } from './auth/session.ts';

const PREFIX = 'keeps:v1:';
const CAP = 300;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
type KeepsEnv = AuthEnv & Pick<Cloudflare.Env, 'VISITS'>;
type SessionReader = (request: Request, env: KeepsEnv) => Promise<{ user: { userId: string } } | null>;
export type Keep = { id: string; kind: 'post' | 'link'; keptAt: string; text: string; who: string; noun: number; postId: string; postAt: string; source: 'bar' | 'chain' | 'web'; url: string; title: string; site: string; image: string; description: string; note: string };

const text = (v: unknown, max: number) => (typeof v === 'string' ? v : '').replace(/[\x00-\x1F\x7F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const https = (v: unknown) => { const s = text(v, 600); if (!s) return ''; try { const u = new URL(s); return u.protocol === 'https:' && !u.username && !u.password ? u.toString() : ''; } catch { return ''; } };

export function normalizeKeep(input: unknown, now = Date.now()): Keep {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('A keep is a JSON object.');
  const b = input as Record<string, unknown>;
  const kind = b.kind === 'link' ? 'link' : b.kind === 'post' ? 'post' : null;
  if (!kind) throw new Error('kind must be post or link.');
  const url = https(b.url), postId = text(b.postId, 80), body = Array.from(text(b.text, 1200)).slice(0, 280).join('');
  if (kind === 'link' && !url) throw new Error('A kept link needs a public https url.');
  if (kind === 'post' && !postId) throw new Error('A kept post needs its postId.');
  if (kind === 'post' && !body) throw new Error('A kept post needs its text.');
  const nounRaw = Number(b.noun); const keptAtMs = Date.parse(text(b.keptAt, 40));
  const postAtMs = Date.parse(text(b.postAt, 40));
  return {
    id: kind === 'post' ? `post:${postId}` : `link:${url}`,
    kind, keptAt: new Date(Number.isFinite(keptAtMs) && keptAtMs <= now ? keptAtMs : now).toISOString(),
    text: body, who: text(b.who, 40), noun: Number.isInteger(nounRaw) && nounRaw >= 0 && nounRaw <= 1199 ? nounRaw : 0,
    postId, postAt: Number.isFinite(postAtMs) ? new Date(postAtMs).toISOString() : '',
    source: b.source === 'chain' ? 'chain' : b.source === 'bar' ? 'bar' : 'web',
    url, title: text(b.title, 160), site: text(b.site, 60), image: https(b.image), description: text(b.description, 240), note: text(b.note, 140),
  };
}

function sameSite(request: Request): boolean {
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none';
  const origin = request.headers.get('Origin');
  if (origin) { try { return origin === new URL(request.url).origin; } catch { return false; } }
  return false;
}

export async function handleKeeps(request: Request, env: KeepsEnv, readSession: SessionReader = readSessionFromRequest as unknown as SessionReader): Promise<Response> {
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) return json({ ok: false, reason: 'method-not-allowed' }, 405);
  if (!env.VISITS) return json({ ok: false, reason: 'unavailable' }, 503);
  if (request.method !== 'GET' && !sameSite(request)) return json({ ok: false, reason: 'cross-site' }, 403);
  let current: Awaited<ReturnType<SessionReader>> = null;
  try { current = await readSession(request, env); } catch { return json({ ok: false, reason: 'session-unavailable' }, 503); }
  if (!current) return json({ ok: false, reason: 'unauthorized' }, 401);
  const key = PREFIX + current.user.userId;
  try {
    const stored = (await env.VISITS.get<{ items: Keep[] }>(key, 'json')) || { items: [] };
    let items = Array.isArray(stored.items) ? stored.items : [];
    if (request.method === 'GET') return json({ ok: true, keeps: items, cap: CAP });
    let body: Record<string, unknown>;
    try { const raw = await request.text(); if (raw.length > 120000) throw new Error('too large'); body = JSON.parse(raw); } catch { return json({ ok: false, reason: 'invalid-json' }, 400); }
    if (request.method === 'DELETE') {
      const id = text(body.id, 700);
      items = items.filter((k) => k.id !== id);
    } else {
      const incoming = Array.isArray(body.items) ? body.items.slice(0, 100) : [body.item ?? body];
      const fresh: Keep[] = [];
      for (const raw of incoming) { try { fresh.push(normalizeKeep(raw)); } catch (e) { if (incoming.length === 1) return json({ ok: false, reason: 'invalid-keep', error: e instanceof Error ? e.message : 'Invalid keep.' }, 400); } }
      const ids = new Set(fresh.map((k) => k.id));
      items = [...fresh, ...items.filter((k) => !ids.has(k.id))].sort((a, b) => b.keptAt.localeCompare(a.keptAt)).slice(0, CAP);
    }
    await env.VISITS.put(key, JSON.stringify({ items, updatedAt: new Date().toISOString() }));
    return json({ ok: true, keeps: items, cap: CAP });
  } catch { return json({ ok: false, reason: 'storage-unavailable' }, 503); }
}
export const onRequest: PagesFunction<KeepsEnv> = ({ request, env }) => handleKeeps(request, env);
