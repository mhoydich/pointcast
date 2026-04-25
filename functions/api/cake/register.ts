/**
 * functions/api/cake/register.ts — public birthday registry endpoint.
 *
 * POST { type: 'pc-cake-register-v1', handle, birthday (MM-DD), name?, about? }
 *   → 200 { ok: true, handle, status: 'registered' }
 *   → 409 if handle taken / fingerprint already registered
 *   → 503 if PC_CAKE_KV is not bound
 *
 * GET ?handle=xyz → { ok, taken, since? } — handle availability check
 * GET no params  → endpoint protocol doc
 *
 * KV layout (PC_CAKE_KV):
 *   - register:{handle} → JSON entry
 *   - takenfp:{fp} → handle (1 registration per fingerprint, soft spam gate)
 *
 * Auto-approves on registration; Mike retains override by deleting the KV
 * key. The Cake Circle is open by social pressure, not by moderation queue.
 *
 * Same env-guarded pattern as /api/poll, /api/ping, /api/drop.
 */

export interface Env {
  PC_CAKE_KV?: KVNamespace;
}

interface RegisterPayload {
  type?: string;
  handle?: string;
  birthday?: string;
  name?: string;
  about?: string;
  timestamp?: string;
}

interface RegisterEntry {
  handle: string;
  birthday: string;
  name: string | null;
  about: string | null;
  fp: string;
  at: string;
  status: 'registered';
}

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...((ri.headers as Record<string, string>) ?? {}),
    },
  });
}

async function fingerprint(req: Request): Promise<string> {
  const ua = req.headers.get('user-agent') || 'unknown';
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'noip';
  const enc = new TextEncoder().encode(ua + ':' + ip);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,29}$/;
const MMDD_RE = /^\d{2}-\d{2}$/;

function validMmdd(s: string): boolean {
  if (!MMDD_RE.test(s)) return false;
  const [m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // Light per-month max-day check (treat Feb as 29 to allow leap-day birthdays).
  const max = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  return d <= max;
}

// Reserved handles — avoid collisions with built-in routes / family slugs.
// Keep small + obvious; not exhaustive (the handle just lives at /cake/{h}).
const RESERVED = new Set([
  'register', 'admin', 'morgan', 'mike', 'michael', 'kana', 'kenzo',
  'family', 'circle', 'all', 'recent', 'upcoming', 'archive', 'json',
  'rss', 'feed', 'api', 'b', 'c', 'cake', 'index', 'new',
]);

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') return json({ ok: true }, 204);
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'cake-register',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_CAKE_KV)),
      },
    });
  }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const handle = url.searchParams.get('handle')?.toLowerCase().trim();
    const list = url.searchParams.get('list');

    if (list === '1' || list === 'true') {
      // Public list — handle, birthday, name, about. No fingerprint exposed.
      if (!env.PC_CAKE_KV) return json({ ok: false, reason: 'kv-unbound', registrations: [] }, 503);
      try {
        const all = await env.PC_CAKE_KV.list({ prefix: 'register:' });
        const out: Array<Pick<RegisterEntry, 'handle' | 'birthday' | 'name' | 'about' | 'at'>> = [];
        for (const k of all.keys) {
          const v = await env.PC_CAKE_KV.get(k.name);
          if (!v) continue;
          try {
            const e = JSON.parse(v) as RegisterEntry;
            out.push({ handle: e.handle, birthday: e.birthday, name: e.name, about: e.about, at: e.at });
          } catch {}
        }
        out.sort((a, b) => a.at.localeCompare(b.at));
        return json({ ok: true, count: out.length, registrations: out });
      } catch (err: any) {
        return json({ ok: false, error: 'kv-list-failed', message: err?.message, registrations: [] }, 500);
      }
    }

    if (!handle) {
      return json({
        ok: true,
        endpoint: 'https://pointcast.xyz/api/cake/register',
        kvBound: Boolean(env.PC_CAKE_KV),
        usage: 'POST { type: "pc-cake-register-v1", handle, birthday (MM-DD), name?, about? }. GET ?handle=xyz for availability. GET ?list=1 for public list.',
        rules: {
          handle: 'lowercase alphanumeric + hyphens, 2-30 chars, must start with alphanumeric, reserved-list applies',
          birthday: 'MM-DD only (year omitted on purpose — privacy + age-agnostic). Feb 29 allowed.',
          name: 'optional, ≤80 chars',
          about: 'optional, ≤140 chars (one-line)',
        },
        moderation: 'Auto-approved on registration. Mike can revoke by deleting the KV key.',
        spec: 'https://pointcast.xyz/cake/register',
        notes: ['One registration per fingerprint (UA+IP hash, soft spam gate).', 'Reserved handles list is in source.'],
      });
    }

    if (!env.PC_CAKE_KV) return json({ ok: false, reason: 'kv-unbound' }, 503);
    if (RESERVED.has(handle)) return json({ ok: true, taken: true, reason: 'reserved' });
    if (!HANDLE_RE.test(handle)) return json({ ok: false, error: 'bad-handle' }, 400);

    try {
      const existing = await env.PC_CAKE_KV.get(`register:${handle}`);
      if (!existing) return json({ ok: true, taken: false });
      const parsed = JSON.parse(existing) as RegisterEntry;
      return json({ ok: true, taken: true, since: parsed.at });
    } catch (err: any) {
      return json({ ok: false, error: 'kv-read-failed', message: err?.message }, 500);
    }
  }

  if (request.method !== 'POST') return json({ ok: false, error: 'method-not-allowed' }, 405);

  if (!env.PC_CAKE_KV) {
    return json({ ok: false, reason: 'kv-unbound', hint: 'Bind PC_CAKE_KV in wrangler.toml or Cloudflare dashboard.' }, 503);
  }

  let body: RegisterPayload;
  try { body = (await request.json()) as RegisterPayload; } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  if (body.type !== 'pc-cake-register-v1') return json({ ok: false, error: 'unsupported-type', got: body.type }, 400);

  const handle = (body.handle ?? '').toLowerCase().trim();
  if (!HANDLE_RE.test(handle)) return json({ ok: false, error: 'bad-handle', rule: '2-30 chars, lowercase alphanumeric + hyphens, starts with alphanumeric' }, 400);
  if (RESERVED.has(handle)) return json({ ok: false, error: 'reserved-handle' }, 400);

  const birthday = (body.birthday ?? '').trim();
  if (!validMmdd(birthday)) return json({ ok: false, error: 'bad-birthday', rule: 'MM-DD' }, 400);

  const name = body.name ? String(body.name).trim().slice(0, 80) : null;
  const about = body.about ? String(body.about).trim().slice(0, 140) : null;

  const fp = await fingerprint(request);

  try {
    const existingHandle = await env.PC_CAKE_KV.get(`register:${handle}`);
    if (existingHandle) return json({ ok: false, error: 'handle-taken' }, 409);

    const existingFp = await env.PC_CAKE_KV.get(`takenfp:${fp}`);
    if (existingFp) return json({ ok: false, error: 'already-registered', existingHandle: existingFp }, 409);

    const entry: RegisterEntry = {
      handle,
      birthday,
      name,
      about,
      fp,
      at: body.timestamp || new Date().toISOString(),
      status: 'registered',
    };

    // No TTL — registrations are permanent unless Mike deletes the key.
    await env.PC_CAKE_KV.put(`register:${handle}`, JSON.stringify(entry));
    await env.PC_CAKE_KV.put(`takenfp:${fp}`, handle);

    return json({ ok: true, handle, status: 'registered', cakeUrl: `https://pointcast.xyz/cake/${handle}` });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-write-failed', message: err?.message }, 500);
  }
};
