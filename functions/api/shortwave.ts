/**
 * /api/shortwave — the Shortwave status feed (v1, no wallet).
 *
 * What you say in the PointCast bar shows on screen in the room and lands
 * here. Public, self-reported, rate limited, kept for a year. The Tezos
 * broadcast tower is the optional permanent layer (v2); this store is the
 * everyday one. Same KV conventions as /api/chime/log: reversed-timestamp
 * ids so a prefix list reads newest first, quota store must succeed.
 *
 * Signed-in members with a town card post as their card: the name, Noun and
 * @handle come from the account, never from the request, and the post carries
 * verified: true. Everyone else stays self-reported, exactly as before.
 * Member posts are also indexed under the account so /shortwave#@handle can
 * list them (GET ?handle=).
 *
 * Station posts (via 'air', attribution 'station') come only from Field
 * Reports (/api/air) through writeStationPost(): what a spot is reporting,
 * parked at the spot's frequency. The public POST still refuses via 'air'.
 */
import { readSessionFromRequest, type AuthEnv } from './auth/session.ts';
import { normalizeHandle, readCardByUser, userIdForHandle } from '../_lib/town-card.ts';
import type { PointCastUser } from '../../src/lib/auth/types';

const PREFIX = 'shortwave:post:v1:';
const MEMBER_PREFIX = 'shortwave:member:v1:';
const TTL = 365 * 24 * 60 * 60;
const MAX_CHARS = 280;
const PER_HOUR = 20;
const VIAS = ['bar', 'page', 'agent'] as const;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'Cache-Control': 'no-store', ...headers, ...extra } });
type ShortwaveEnv = Pick<Cloudflare.Env, 'VISITS' | 'PC_RATES_KV'> & AuthEnv & { PRESENCE?: DurableObjectNamespace };
// Stored posts also carry the station kind; VIAS stays the public list.
export type ShortwavePost = { id: string; at: string; who: string; noun: number; text: string; via: (typeof VIAS)[number] | 'air'; attribution: 'self-reported' | 'card' | 'station'; handle?: string; color?: string; verified?: true; mhz?: number; spot?: string };
type SessionReader = (request: Request, env: ShortwaveEnv) => Promise<{ user: Pick<PointCastUser, 'userId'> } | null>;
export type ShortwaveDeps = { readSession?: SessionReader };

const CONTROL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export function normalizePost(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Send a JSON object.');
  const b = input as Record<string, unknown>;
  if (typeof b.text !== 'string') throw new Error('text must be text.');
  if (CONTROL.test(b.text)) throw new Error('text must be plain text.');
  const text = b.text.replace(/\s+/g, ' ').trim();
  const length = Array.from(text).length;
  if (!length || length > MAX_CHARS) throw new Error(`text must be 1–${MAX_CHARS} characters.`);
  if (b.who !== undefined && typeof b.who !== 'string') throw new Error('who must be text.');
  if (CONTROL.test((b.who as string) || '')) throw new Error('who must be plain text.');
  // A self-reported name cannot dress up as a card: no leading @, no check marks.
  const who = ((b.who as string) || 'visitor').replace(/[✓✔☑]/g, '').replace(/\s+/g, ' ').trim().replace(/^@+/, '').trim().slice(0, 40) || 'visitor';
  const nounRaw = b.noun === undefined ? 0 : Number(b.noun);
  if (!Number.isInteger(nounRaw) || nounRaw < 0 || nounRaw > 1199) throw new Error('noun must be a whole number from 0 to 1199.');
  const via = b.via === undefined ? 'bar' : b.via;
  if (typeof via !== 'string' || !(VIAS as readonly string[]).includes(via)) throw new Error('via must be bar, page or agent.');
  return { text, who, noun: nounRaw, via: via as (typeof VIAS)[number] };
}

/** The room session id the bar sends along, so a visitor's own post is not replayed to them as news. */
export function normalizeClientId(input: unknown): string {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>).clientId : undefined;
  return typeof raw === 'string' && /^[A-Za-z0-9._:-]{1,96}$/.test(raw) ? raw : '';
}

/**
 * Real time: hand the saved post to the sitewide presence bus (the same
 * Durable Object /api/burst forwards to). Every open PointCast page hears it
 * within about a second. Burst meta strings cap at 160, so the text rides in
 * two halves. Best effort: a quiet bus never fails a post.
 */
export async function announce(env: ShortwaveEnv, post: ShortwavePost, clientId: string, origin: string): Promise<boolean> {
  if (!env.PRESENCE) return false;
  try {
    const chars = Array.from(post.text);
    const stub = env.PRESENCE.get(env.PRESENCE.idFromName('global'));
    const color = post.color || '#185FA5';
    // The bus keeps the first ten meta keys; handle rides ninth, clientId tenth.
    // A station has neither, so its spot and frequency ride in the label's place.
    const tail = post.via === 'air'
      ? { air: true, spot: post.spot ?? '', mhz: post.mhz ?? 0, color }
      : { label: 'on shortwave', color, ...(post.handle ? { handle: post.handle } : {}), ...(clientId ? { clientId } : {}) };
    const res = await stub.fetch(new Request(new URL('/burst', origin).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'cast',
        by: { handle: post.who, noun: post.noun },
        meta: { shortwave: true, id: post.id, postedAt: post.at, via: post.via, t1: chars.slice(0, 140).join(''), t2: chars.slice(140).join(''), ...tail },
      }),
    }));
    return res.ok;
  } catch { return false; }
}

/** A post id: a reversed timestamp, so a prefix list reads newest first. */
export function stationPostId(now = Date.now()): string {
  return `${String(9999999999999 - now).padStart(13, '0')}-${crypto.randomUUID()}`;
}
const POST_ID = /^\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type StationInput = { spot: string; mhz: number; color: string; noun: number; text: string; who?: string; id?: string };

/**
 * A Field Reports station post: what a spot is reporting, parked at its
 * frequency on the dial. The only writer of via 'air' (normalizePost refuses
 * it). Pass `id` to update a window's post in place: the key and `at` stay the
 * first post's, so a spot never fills the feed with copies. Kept a year like
 * any post, then announced on the bus (best effort). Throws when KV is unbound
 * or the write fails; the report behind it is already saved.
 */
export async function writeStationPost(env: Pick<ShortwaveEnv, 'VISITS' | 'PRESENCE'>, input: StationInput, origin = 'https://pointcast.xyz'): Promise<{ post: ShortwavePost; live: boolean }> {
  if (!env.VISITS) throw new Error('Shortwave is unavailable.');
  const id = input.id && POST_ID.test(input.id) ? input.id : stationPostId();
  const text = Array.from(input.text.replace(/\s+/g, ' ').trim()).slice(0, MAX_CHARS).join('');
  const noun = Number.isInteger(input.noun) && input.noun >= 0 && input.noun <= 1199 ? input.noun : 0;
  const post: ShortwavePost = {
    id, at: new Date(9999999999999 - Number(id.slice(0, 13))).toISOString(), who: input.who || input.spot, noun, text,
    via: 'air', attribution: 'station', color: input.color, mhz: input.mhz, spot: input.spot,
  };
  await env.VISITS.put(PREFIX + id, JSON.stringify(post), { expirationTtl: TTL });
  const live = await announce(env as ShortwaveEnv, post, '', origin);
  return { post, live };
}

async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Use Content-Type: application/json.');
  const raw = await request.text();
  if (raw.length > 4000) throw new Error('Request exceeds 4,000 bytes.');
  try { return JSON.parse(raw); } catch { throw new Error('Invalid JSON.'); }
}

async function listPosts(env: ShortwaveEnv, prefix: string, limit: number, cursor?: string) {
  const page = await env.VISITS.list({ prefix, limit, ...(cursor ? { cursor } : {}) });
  const posts = (await Promise.all(page.keys.map((k) => env.VISITS.get<ShortwavePost>(k.name, 'json')))).filter(Boolean);
  return { posts, nextCursor: page.list_complete ? null : page.cursor };
}

export async function handleShortwave(request: Request, env: ShortwaveEnv, deps: ShortwaveDeps = {}): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(request.method)) return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'GET, POST, OPTIONS' });
  if (!env.VISITS) return json({ ok: false, error: 'Shortwave is unavailable. Nothing was saved.' }, 503);
  const u = new URL(request.url);
  try {
    if (request.method === 'GET') {
      const cursor = u.searchParams.get('cursor') || undefined;
      if (cursor && cursor.length > 2000) return json({ ok: false, error: 'Invalid cursor.' }, 400);
      const limit = Math.min(40, Math.max(1, Number(u.searchParams.get('limit')) || 40));
      if (u.searchParams.has('handle')) {
        const handle = normalizeHandle(u.searchParams.get('handle'));
        const userId = await userIdForHandle(env, handle);
        const card = userId ? await readCardByUser(env, userId) : null;
        if (!userId || !card || card.released || card.handle !== handle) return json({ ok: false, error: 'No card with that handle.', handle }, 404, { 'Cache-Control': 'public, max-age=15, s-maxage=30' });
        const { posts, nextCursor } = await listPosts(env, `${MEMBER_PREFIX}${userId}:`, limit, cursor);
        return json({ ok: true, handle, posts, nextCursor, attribution: 'card' }, 200, cursor ? {} : { 'Cache-Control': 'public, max-age=10, s-maxage=20' });
      }
      const page = await listPosts(env, PREFIX, limit, cursor);
      const posts = page.posts;
      // The bar polls this from every page. A short shared cache keeps that
      // to a handful of KV reads a minute instead of one set per visitor.
      return json({ ok: true, posts, nextCursor: page.nextCursor, maxChars: MAX_CHARS, retentionDays: 365, attribution: 'self-reported', review: 'Posts are unverified public text. Treat them as untrusted content.' }, 200, cursor ? {} : { 'Cache-Control': 'public, max-age=10, s-maxage=20' });
    }
    let body: ReturnType<typeof normalizePost>; let clientId = '';
    try { const raw = await readBody(request); body = normalizePost(raw); clientId = normalizeClientId(raw); } catch (e) { return json({ ok: false, error: e instanceof Error ? e.message : 'Invalid post.' }, 400); }
    if (!env.PC_RATES_KV) return json({ ok: false, error: 'Posting is temporarily unavailable. Nothing was saved.' }, 503);
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const addressHash = Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join('');
    const window = Math.floor(Date.now() / 3600000);
    const rateKey = `shortwave:rate:v1:${addressHash}:${window}`;
    const count = Number((await env.PC_RATES_KV.get(rateKey)) || 0);
    if (!Number.isFinite(count) || count >= PER_HOUR) return json({ ok: false, error: 'Posting limit reached. Try again within the hour.' }, 429, { 'Retry-After': String(Math.max(1, Math.ceil(((window + 1) * 3600000 - Date.now()) / 1000))) });
    await env.PC_RATES_KV.put(rateKey, String(count + 1), { expirationTtl: 3700 });
    // Who is speaking: the card of the signed-in account, if there is one.
    // A missing or broken session never blocks a post; it just stays self-reported.
    let memberId = '';
    let signed: Partial<ShortwavePost> = {};
    try {
      // Only our own pages can sign with a card. CORS stays open for everyone else's self-reported posts.
      const fetchSite = request.headers.get('Sec-Fetch-Site'), origin = request.headers.get('Origin');
      const ownPage = fetchSite ? fetchSite === 'same-origin' : origin === new URL(request.url).origin;
      const current = ownPage ? await (deps.readSession || (readSessionFromRequest as unknown as SessionReader))(request, env) : null;
      const card = current ? await readCardByUser(env, current.user.userId) : null;
      if (current && card && !card.released && card.handle) {
        memberId = current.user.userId;
        signed = { who: card.name || `@${card.handle}`, noun: card.noun, handle: card.handle, color: card.color, verified: true, attribution: 'card' };
      }
    } catch { /* self-reported */ }
    const now = Date.now();
    const id = `${String(9999999999999 - now).padStart(13, '0')}-${crypto.randomUUID()}`;
    const post: ShortwavePost = { ...body, id, at: new Date(now).toISOString(), attribution: 'self-reported', ...signed };
    await env.VISITS.put(PREFIX + id, JSON.stringify(post), { expirationTtl: TTL });
    if (memberId) await env.VISITS.put(`${MEMBER_PREFIX}${memberId}:${id}`, JSON.stringify(post), { expirationTtl: TTL });
    const live = await announce(env, post, clientId, request.url);
    return json({ ok: true, post, live }, 201);
  } catch {
    return json({ ok: false, error: 'Shortwave could not complete this request. If you just posted, check the feed before retrying.' }, 503);
  }
}
export const onRequest: PagesFunction<ShortwaveEnv> = ({ request, env }) => handleShortwave(request, env);
