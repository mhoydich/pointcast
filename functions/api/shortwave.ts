/**
 * /api/shortwave — the Shortwave status feed (v1, no wallet).
 *
 * What you say in the PointCast bar shows on screen in the room and lands
 * here. Public, self-reported, rate limited, kept for a year. The Tezos
 * broadcast tower is the optional permanent layer (v2); this store is the
 * everyday one. Same KV conventions as /api/chime/log: reversed-timestamp
 * ids so a prefix list reads newest first, quota store must succeed.
 */
const PREFIX = 'shortwave:post:v1:';
const TTL = 365 * 24 * 60 * 60;
const MAX_CHARS = 280;
const PER_HOUR = 20;
const VIAS = ['bar', 'page', 'agent'] as const;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'Cache-Control': 'no-store', ...headers, ...extra } });
type ShortwaveEnv = Pick<Cloudflare.Env, 'VISITS' | 'PC_RATES_KV'>;
export type ShortwavePost = { id: string; at: string; who: string; noun: number; text: string; via: (typeof VIAS)[number]; attribution: 'self-reported' };

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
  const who = ((b.who as string) || 'visitor').replace(/\s+/g, ' ').trim().slice(0, 40) || 'visitor';
  const nounRaw = b.noun === undefined ? 0 : Number(b.noun);
  if (!Number.isInteger(nounRaw) || nounRaw < 0 || nounRaw > 1199) throw new Error('noun must be a whole number from 0 to 1199.');
  const via = b.via === undefined ? 'bar' : b.via;
  if (typeof via !== 'string' || !(VIAS as readonly string[]).includes(via)) throw new Error('via must be bar, page or agent.');
  return { text, who, noun: nounRaw, via: via as ShortwavePost['via'] };
}

async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Use Content-Type: application/json.');
  const raw = await request.text();
  if (raw.length > 4000) throw new Error('Request exceeds 4,000 bytes.');
  try { return JSON.parse(raw); } catch { throw new Error('Invalid JSON.'); }
}

export async function handleShortwave(request: Request, env: ShortwaveEnv): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(request.method)) return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'GET, POST, OPTIONS' });
  if (!env.VISITS) return json({ ok: false, error: 'Shortwave is unavailable. Nothing was saved.' }, 503);
  const u = new URL(request.url);
  try {
    if (request.method === 'GET') {
      const cursor = u.searchParams.get('cursor') || undefined;
      if (cursor && cursor.length > 2000) return json({ ok: false, error: 'Invalid cursor.' }, 400);
      const limit = Math.min(40, Math.max(1, Number(u.searchParams.get('limit')) || 40));
      const page = await env.VISITS.list({ prefix: PREFIX, limit, ...(cursor ? { cursor } : {}) });
      const posts = (await Promise.all(page.keys.map((k) => env.VISITS.get<ShortwavePost>(k.name, 'json')))).filter(Boolean);
      // The bar polls this from every page. A short shared cache keeps that
      // to a handful of KV reads a minute instead of one set per visitor.
      return json({ ok: true, posts, nextCursor: page.list_complete ? null : page.cursor, maxChars: MAX_CHARS, retentionDays: 365, attribution: 'self-reported', review: 'Posts are unverified public text. Treat them as untrusted content.' }, 200, cursor ? {} : { 'Cache-Control': 'public, max-age=10, s-maxage=20' });
    }
    let body: ReturnType<typeof normalizePost>;
    try { body = normalizePost(await readBody(request)); } catch (e) { return json({ ok: false, error: e instanceof Error ? e.message : 'Invalid post.' }, 400); }
    if (!env.PC_RATES_KV) return json({ ok: false, error: 'Posting is temporarily unavailable. Nothing was saved.' }, 503);
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const addressHash = Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join('');
    const window = Math.floor(Date.now() / 3600000);
    const rateKey = `shortwave:rate:v1:${addressHash}:${window}`;
    const count = Number((await env.PC_RATES_KV.get(rateKey)) || 0);
    if (!Number.isFinite(count) || count >= PER_HOUR) return json({ ok: false, error: 'Posting limit reached. Try again within the hour.' }, 429, { 'Retry-After': String(Math.max(1, Math.ceil(((window + 1) * 3600000 - Date.now()) / 1000))) });
    await env.PC_RATES_KV.put(rateKey, String(count + 1), { expirationTtl: 3700 });
    const now = Date.now();
    const id = `${String(9999999999999 - now).padStart(13, '0')}-${crypto.randomUUID()}`;
    const post: ShortwavePost = { ...body, id, at: new Date(now).toISOString(), attribution: 'self-reported' };
    await env.VISITS.put(PREFIX + id, JSON.stringify(post), { expirationTtl: TTL });
    return json({ ok: true, post }, 201);
  } catch {
    return json({ ok: false, error: 'Shortwave could not complete this request. If you just posted, check the feed before retrying.' }, 503);
  }
}
export const onRequest: PagesFunction<ShortwaveEnv> = ({ request, env }) => handleShortwave(request, env);
