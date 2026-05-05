/**
 * /api/special-brew — KV-backed sip log for /special-brew.
 *
 * GET  → { count_24h, recent: [{brew, ts, sid}] }
 * POST → record one sip. Body: { brew: string, sid?: string }.
 *
 * Storage: KV namespace PC_BREW_KV (preferred). Falls back to PC_CAKE_KV
 * (already bound for /sing) if PC_BREW_KV isn't set, so the page works
 * during binding setup. If neither is bound, all writes silently no-op
 * and reads return zeros — the room degrades gracefully to single-player.
 *
 * Keys:
 *   sb:sip:<utc_iso>:<random>  — individual sip records, 24h TTL
 *   sb:sip:list                — list of recent sip keys (cached, 5-min)
 *
 * The 24h TTL means the count naturally rolls forward without needing
 * a separate clock — old sips just expire. This matches the daily
 * rotation rhythm of /special-brew itself.
 */

interface Env {
  PC_BREW_KV?: KVNamespace;
  PC_CAKE_KV?: KVNamespace;
}

interface SipRecord {
  brew: string;
  ts: string; // ISO
  sid: string; // 8-char client identifier (NOT auth)
}

const VALID_BREW_RE = /^[a-z][a-z0-9-]{0,40}$/;
const VALID_SID_RE = /^[a-z0-9]{1,16}$/i;
const SIP_TTL_SECONDS = 60 * 60 * 24; // 24h
const MAX_RECENT = 64;

function getKv(env: Env): KVNamespace | null {
  return env.PC_BREW_KV ?? env.PC_CAKE_KV ?? null;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
    ...init,
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const kv = getKv(env);
  if (!kv) {
    return jsonResponse({ count_24h: 0, recent: [], note: 'no KV bound — single-player mode' });
  }

  // List sip keys (paginated; we only care about recent)
  const list = await kv.list({ prefix: 'sb:sip:', limit: MAX_RECENT * 2 });
  const sips: SipRecord[] = [];
  // Fetch sip records concurrently, capped at MAX_RECENT
  const keys = list.keys.slice(0, MAX_RECENT);
  const records = await Promise.all(
    keys.map(async (k) => {
      try {
        const v = await kv.get(k.name, 'json');
        return v as SipRecord | null;
      } catch {
        return null;
      }
    }),
  );
  for (const r of records) {
    if (r && r.brew && r.ts && r.sid) sips.push(r);
  }

  // Sort newest-first by timestamp
  sips.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));

  return jsonResponse({
    count_24h: sips.length,
    recent: sips.slice(0, MAX_RECENT),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let body: { brew?: unknown; sid?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'bad-json' }, { status: 400 });
  }

  const brew = typeof body.brew === 'string' ? body.brew.toLowerCase() : '';
  const sid = typeof body.sid === 'string' ? body.sid.slice(0, 16) : 'anon';

  if (!VALID_BREW_RE.test(brew)) {
    return jsonResponse({ ok: false, error: 'bad-brew' }, { status: 400 });
  }
  if (sid !== 'anon' && !VALID_SID_RE.test(sid)) {
    return jsonResponse({ ok: false, error: 'bad-sid' }, { status: 400 });
  }

  const kv = getKv(env);
  if (!kv) {
    // Graceful no-op so the page still feels responsive
    return jsonResponse({ ok: true, stored: false, note: 'no KV bound' });
  }

  const now = new Date();
  const ts = now.toISOString();
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `sb:sip:${ts}:${rand}`;
  const record: SipRecord = { brew, ts, sid };

  try {
    await kv.put(key, JSON.stringify(record), { expirationTtl: SIP_TTL_SECONDS });
  } catch (e) {
    return jsonResponse({ ok: false, error: 'kv-write-failed' }, { status: 502 });
  }

  return jsonResponse({ ok: true, stored: true, ts });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    },
  });
