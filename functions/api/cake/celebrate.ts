/**
 * functions/api/cake/celebrate.ts — birthday block celebration / guestbook.
 *
 * The Schelling-point mechanic: on a birthday block, anyone can drop a
 * confetti + signature. Stacks up over the day. The block becomes denser
 * the more it's celebrated. Permanent + visible.
 *
 * POST { type: 'pc-cake-celebrate-v1', blockId, handle, message? }
 *   → 200 { ok: true, count, entry }
 *   → 409 if this fingerprint already celebrated this block
 *   → 503 if PC_CAKE_KV is not bound
 *
 * GET ?blockId=0366 → list of celebrations for the block (chrono asc)
 * GET no params → endpoint protocol doc
 *
 * KV layout (PC_CAKE_KV):
 *   - celebrate:{blockId}:{ts}-{fp} → JSON entry
 *   - celebratefp:{blockId}:{fp} → handle (one celebration per blockId per fp)
 *
 * One celebration per fingerprint per block. The handle can be anything
 * (no registration required to celebrate someone) — the guestbook is the
 * public ritual; registration is for permanent /cake/{handle} pages.
 */

export interface Env {
  PC_CAKE_KV?: KVNamespace;
}

interface CelebratePayload {
  type?: string;
  blockId?: string;
  handle?: string;
  message?: string;
  timestamp?: string;
}

interface CelebrateEntry {
  blockId: string;
  handle: string;
  message: string | null;
  fp: string;
  at: string;
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

const BLOCK_ID_RE = /^\d{4}$/;
// Loose handle rule for celebrations — anyone can sign; we just don't want
// HTML / control chars / huge strings. 1-40 visible chars after trim.
const HANDLE_LOOSE_RE = /^[A-Za-z0-9][A-Za-z0-9_\-. ]{0,39}$/;

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') return json({ ok: true }, 204);
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'cake-celebrate',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_CAKE_KV)),
      },
    });
  }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const blockId = url.searchParams.get('blockId');
    if (!blockId) {
      return json({
        ok: true,
        endpoint: 'https://pointcast.xyz/api/cake/celebrate',
        kvBound: Boolean(env.PC_CAKE_KV),
        usage: 'POST { type: "pc-cake-celebrate-v1", blockId, handle, message? }. GET ?blockId=0366 for the guestbook.',
        notes: [
          'One celebration per fingerprint per blockId.',
          'Handle is free-text (1-40 chars, alphanumerics + spaces/_/-/.) — registration not required.',
          'Message is optional, ≤200 chars.',
          'Guestbook is permanent + public.',
        ],
      });
    }

    if (!env.PC_CAKE_KV) return json({ ok: false, reason: 'kv-unbound' }, 503);
    if (!BLOCK_ID_RE.test(blockId)) return json({ ok: false, error: 'bad-block-id' }, 400);

    try {
      const list = await env.PC_CAKE_KV.list({ prefix: `celebrate:${blockId}:` });
      const entries: CelebrateEntry[] = [];
      for (const k of list.keys) {
        const v = await env.PC_CAKE_KV.get(k.name);
        if (v) {
          try { entries.push(JSON.parse(v) as CelebrateEntry); } catch {}
        }
      }
      entries.sort((a, b) => a.at.localeCompare(b.at));
      return json({ ok: true, blockId, count: entries.length, entries });
    } catch (err: any) {
      return json({ ok: false, error: 'kv-list-failed', message: err?.message }, 500);
    }
  }

  if (request.method !== 'POST') return json({ ok: false, error: 'method-not-allowed' }, 405);

  if (!env.PC_CAKE_KV) {
    return json({ ok: false, reason: 'kv-unbound', hint: 'Bind PC_CAKE_KV in wrangler.toml or Cloudflare dashboard.' }, 503);
  }

  let body: CelebratePayload;
  try { body = (await request.json()) as CelebratePayload; } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  if (body.type !== 'pc-cake-celebrate-v1') return json({ ok: false, error: 'unsupported-type', got: body.type }, 400);

  const blockId = (body.blockId ?? '').trim();
  if (!BLOCK_ID_RE.test(blockId)) return json({ ok: false, error: 'bad-block-id' }, 400);

  const handle = (body.handle ?? '').trim();
  if (!HANDLE_LOOSE_RE.test(handle)) return json({ ok: false, error: 'bad-handle', rule: '1-40 chars, alphanumerics + space/_/-/.' }, 400);

  const message = body.message ? String(body.message).trim().slice(0, 200) : null;

  const fp = await fingerprint(request);
  const dedupKey = `celebratefp:${blockId}:${fp}`;

  try {
    const prior = await env.PC_CAKE_KV.get(dedupKey);
    if (prior) {
      return json({ ok: false, error: 'already-celebrated', priorHandle: prior, blockId }, 409);
    }

    const at = body.timestamp || new Date().toISOString();
    const entry: CelebrateEntry = { blockId, handle, message, fp, at };
    const ts = at.replace(/[^0-9]/g, '').slice(0, 14); // YYYYMMDDHHMMSS for sortable keys

    // No TTL — celebrations are permanent.
    await env.PC_CAKE_KV.put(`celebrate:${blockId}:${ts}-${fp}`, JSON.stringify(entry));
    await env.PC_CAKE_KV.put(dedupKey, handle);

    // Recount for the response (cheap; lists are tiny).
    const list = await env.PC_CAKE_KV.list({ prefix: `celebrate:${blockId}:` });
    return json({ ok: true, blockId, count: list.keys.length, entry });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-write-failed', message: err?.message }, 500);
  }
};
