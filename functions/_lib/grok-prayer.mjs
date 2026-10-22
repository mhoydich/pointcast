/**
 * Shared prayer tally for /grok.
 *
 * Same idea as /api/drum's drum:total: one number in the VISITS KV
 * namespace, never reset. A session may offer one prayer every 5 seconds.
 * The key is separate from prayer:state so the canonical hours on
 * /api/prayer stay a different ledger.
 *
 *   grok:prayer:total            — cumulative prayers
 *   grok:prayer:rate:{session}   — last offer, ms, 60s TTL
 */

export const TOTAL_KEY = 'grok:prayer:total';
export const RATE_PREFIX = 'grok:prayer:rate:';
export const RATE_WINDOW_MS = 5000;
export const RATE_KV_TTL_SECONDS = 60;

function asCount(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export async function sessionKey(sessionId) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionId));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function readTotal(kv) {
  if (!kv) return { ok: false, reason: 'kv-not-bound', total: 0, storage: 'unbound' };
  const total = asCount(await kv.get(TOTAL_KEY));
  return { ok: true, total, storage: 'kv' };
}

export async function offerPrayer(kv, { sessionId, now = Date.now() } = {}) {
  if (!kv) {
    return { status: 503, body: { ok: false, reason: 'kv-not-bound', total: 0, storage: 'unbound' } };
  }
  const id = typeof sessionId === 'string' ? sessionId.trim().slice(0, 128) : '';
  if (!id) {
    return { status: 400, body: { ok: false, reason: 'missing-session' } };
  }

  const pid = await sessionKey(id);
  const rateKey = `${RATE_PREFIX}${pid}`;
  const last = Number(await kv.get(rateKey));
  const current = asCount(await kv.get(TOTAL_KEY));
  if (Number.isFinite(last) && last > 0 && now - last < RATE_WINDOW_MS) {
    const retryMs = RATE_WINDOW_MS - (now - last);
    return {
      status: 429,
      body: {
        ok: false,
        reason: 'rate-limited',
        retryAfterSec: Math.max(1, Math.ceil(retryMs / 1000)),
        total: current,
        storage: 'kv',
      },
    };
  }

  await kv.put(rateKey, String(now), { expirationTtl: RATE_KV_TTL_SECONDS });
  const total = current + 1;
  await kv.put(TOTAL_KEY, String(total));
  return { status: 200, body: { ok: true, total, storage: 'kv' } };
}
