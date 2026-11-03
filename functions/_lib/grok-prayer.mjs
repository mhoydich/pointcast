/**
 * Shared prayer tally for /grok.
 *
 * The count lives in AUTH_DB (D1), which Pages already binds. A new Durable
 * Object class would have to be added to the separate pointcast-drum worker
 * and deployed before Pages could call it. A binding to a class that worker
 * does not export yet can fail the Pages deploy, so this route does not add one.
 *
 * D1 batch() is one transaction. The offer is a single INSERT ... WHERE NOT
 * EXISTS, and AFTER INSERT trigger grok_prayer_apply increments
 * grok_prayer_total in that same statement. Two prayers cannot both pass the
 * address window. Offers older than a day are deleted, so a lost response can
 * be retried with the same id; after that the id can count again.
 *
 * Until migration 0033 is applied, or when AUTH_DB is unbound, the route uses
 * VISITS KV. That path is still a read-then-write. It is labeled approximate.
 * A D1 error other than a missing table does not also write KV: the row may
 * already have committed, and the client retries the same id.
 *
 * The rate limit is a hash of CF-Connecting-IP (Cloudflare sets that header),
 * not an id the browser chooses. Nothing here stores the address itself.
 * POST from another site is refused. GET stays public.
 */

export const TOTAL_KEY = 'grok:prayer:total';
export const RATE_PREFIX = 'grok:prayer:rate:';
export const ID_PREFIX = 'grok:prayer:id:';
export const RATE_WINDOW_MS = 5000;
export const RATE_KV_TTL_SECONDS = 60;
export const OFFER_KEEP_MS = 24 * 60 * 60 * 1000;
export const ID_KV_TTL_SECONDS = 24 * 60 * 60;
export const ID_RE = /^[a-zA-Z0-9-]{8,80}$/;

const SITE_ORIGINS = new Set(['https://pointcast.xyz', 'https://www.pointcast.xyz']);

function asCount(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function missingTable(err) {
  return /no such table/i.test(String(err?.message || err));
}

function changesOf(result) {
  const n = Number(result?.meta?.changes ?? result?.changes);
  return Number.isFinite(n) ? n : 0;
}

export function allowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  if (SITE_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    return local && (url.protocol === 'http:' || url.protocol === 'https:');
  } catch {
    return false;
  }
}

export async function hashIp(ip) {
  const basis = `grok-prayer:${typeof ip === 'string' && ip.trim() ? ip.trim() : 'unknown'}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(basis));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function readD1(db) {
  const row = await db.prepare('SELECT total FROM grok_prayer_total WHERE id = 1').first();
  return { ok: true, total: row ? asCount(row.total) : 0, storage: 'd1', approximate: false };
}

async function offerD1(db, { id, ipHash, now }) {
  const results = await db.batch([
    db.prepare('DELETE FROM grok_prayer_offers WHERE created_at < ?').bind(now - OFFER_KEEP_MS),
    db.prepare('INSERT INTO grok_prayer_total (id, total) VALUES (1, 0) ON CONFLICT(id) DO NOTHING'),
    db.prepare(
      `INSERT INTO grok_prayer_offers (idempotency_key, ip_hash, created_at)
       SELECT ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM grok_prayer_offers WHERE idempotency_key = ?)
         AND NOT EXISTS (SELECT 1 FROM grok_prayer_offers WHERE ip_hash = ? AND created_at > ?)`,
    ).bind(id, ipHash, now, id, ipHash, now - RATE_WINDOW_MS),
    db.prepare('SELECT total FROM grok_prayer_total WHERE id = 1'),
    db.prepare('SELECT created_at FROM grok_prayer_offers WHERE idempotency_key = ?').bind(id),
    db.prepare('SELECT MAX(created_at) AS last_at FROM grok_prayer_offers WHERE ip_hash = ?').bind(ipHash),
  ]);
  const inserted = changesOf(results[2]) === 1;
  const totalRow = results[3]?.results?.[0];
  const keyRow = results[4]?.results?.[0];
  const lastAt = Number(results[5]?.results?.[0]?.last_at);
  const total = totalRow ? asCount(totalRow.total) : 0;
  if (!totalRow && inserted) {
    return { status: 503, body: { ok: false, reason: 'store-unavailable', total: 0, storage: 'd1', approximate: false } };
  }
  if (inserted) {
    return { status: 200, body: { ok: true, total, storage: 'd1', approximate: false } };
  }
  if (keyRow) {
    return { status: 200, body: { ok: true, total, storage: 'd1', approximate: false, duplicate: true } };
  }
  const retryMs = Number.isFinite(lastAt) ? Math.max(0, RATE_WINDOW_MS - (now - lastAt)) : RATE_WINDOW_MS;
  return {
    status: 429,
    body: {
      ok: false,
      reason: 'rate-limited',
      retryAfterSec: Math.max(1, Math.ceil(retryMs / 1000)),
      total,
      storage: 'd1',
      approximate: false,
    },
  };
}

async function readKv(kv) {
  const total = asCount(await kv.get(TOTAL_KEY));
  return { ok: true, total, storage: 'kv', approximate: true };
}

async function offerKv(kv, { id, ipHash, now }) {
  const seenKey = `${ID_PREFIX}${id}`;
  const rateKey = `${RATE_PREFIX}${ipHash}`;
  const seen = await kv.get(seenKey);
  const total = asCount(await kv.get(TOTAL_KEY));
  if (seen) {
    return { status: 200, body: { ok: true, total, storage: 'kv', approximate: true, duplicate: true } };
  }
  const last = Number(await kv.get(rateKey));
  if (Number.isFinite(last) && last > 0 && now - last < RATE_WINDOW_MS) {
    return {
      status: 429,
      body: {
        ok: false,
        reason: 'rate-limited',
        retryAfterSec: Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - last)) / 1000)),
        total,
        storage: 'kv',
        approximate: true,
      },
    };
  }
  await kv.put(seenKey, '1', { expirationTtl: ID_KV_TTL_SECONDS });
  await kv.put(rateKey, String(now), { expirationTtl: RATE_KV_TTL_SECONDS });
  const next = total + 1;
  await kv.put(TOTAL_KEY, String(next));
  return { status: 200, body: { ok: true, total: next, storage: 'kv', approximate: true } };
}

async function useStore(env, d1Fn, kvFn) {
  if (env?.AUTH_DB) {
    try {
      return await d1Fn(env.AUTH_DB);
    } catch (err) {
      if (!missingTable(err)) {
        return { ok: false, reason: 'store-unavailable', total: 0, storage: 'd1', approximate: false, status: 503 };
      }
    }
  }
  if (env?.VISITS) {
    try {
      return await kvFn(env.VISITS);
    } catch {
      return { ok: false, reason: 'store-unavailable', total: 0, storage: 'kv', approximate: true, status: 503 };
    }
  }
  return { ok: false, reason: 'unbound', total: 0, storage: 'unbound', approximate: false, status: 503 };
}

function asResult(result) {
  if (result?.body && result?.status) return result;
  const status = result?.ok ? 200 : result?.status || 503;
  const body = { ...result };
  delete body.status;
  return { status, body };
}

export async function readPrayer(env) {
  return asResult(await useStore(env, readD1, readKv));
}

export async function offerPrayer(env, { id, ip, now = Date.now() } = {}) {
  if (typeof id !== 'string' || !ID_RE.test(id)) {
    return { status: 400, body: { ok: false, reason: 'bad-id' } };
  }
  const ipHash = await hashIp(ip);
  return asResult(await useStore(
    env,
    (db) => offerD1(db, { id, ipHash, now }),
    (kv) => offerKv(kv, { id, ipHash, now }),
  ));
}

function jsonHeaders(origin, { pub = false } = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  });
  if (pub) headers.set('Access-Control-Allow-Origin', '*');
  else if (origin && allowedOrigin(origin)) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function json(body, status, origin, pub = false) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders(origin, { pub }) });
}

function forbid() {
  return json({ ok: false, reason: 'origin' }, 403, null, false);
}

/**
 * Pages entry. prayer.ts delegates every method here so tests can call it
 * without loading the TypeScript route.
 */
export async function handlePrayer(request, env = {}) {
  const origin = request.headers.get('Origin');
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    if (origin && !allowedOrigin(origin)) return forbid();
    const headers = jsonHeaders(origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Access-Control-Max-Age', '86400');
    return new Response(null, { status: 204, headers });
  }

  if (method === 'GET') {
    const result = await readPrayer(env);
    return json(result.body, result.status, origin, true);
  }

  if (method !== 'POST') {
    return json({ ok: false, reason: 'method' }, 405, origin, false);
  }

  if (origin && !allowedOrigin(origin)) return forbid();

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad-body' }, 400, origin, false);
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return json({ ok: false, reason: 'bad-body' }, 400, origin, false);
  }

  const result = await offerPrayer(env, {
    id: payload.id,
    ip: request.headers.get('CF-Connecting-IP') || '',
  });
  return json(result.body, result.status, origin, false);
}
