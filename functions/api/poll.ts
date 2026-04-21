/**
 * functions/api/poll.ts — Schelling-point poll vote endpoint.
 *
 * POST { type: 'pc-poll-v1', slug, optionId, address?, timestamp }
 * GET  ?slug=... → tally for that poll
 * GET  no params → endpoint protocol doc
 *
 * KV layout (PC_POLLS_KV):
 *   - tally:{slug}:{optionId} → integer count (incremented on vote)
 *   - voted:{slug}:{address|fingerprint} → optionId voted (dedup)
 *
 * Per-address dedup. Anonymous polls dedup by request fingerprint
 * (User-Agent + IP hash) — best-effort, not cryptographic.
 *
 * Same env-guarded pattern as /api/ping + /api/queue + /api/drop.
 */

export interface Env {
  PC_POLLS_KV?: KVNamespace;
}

interface PollPayload {
  type?: string;
  slug?: string;
  optionId?: string;
  address?: string;
  timestamp?: string;
  /**
   * Mike 2026-04-18: "how do you ask kana and her friends about what they'd
   * like with drum". Optional cohort tag — a sharer-assigned label (NOT a
   * fingerprint). When someone shares /poll/{slug}?via=kana, votes from
   * that URL carry `via: 'kana'`. Mike can filter tallies by cohort via
   * /api/poll?slug=…&via=kana. Slug-shaped, ≤40 chars.
   */
  via?: string;
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

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') return json({ ok: true }, 204);
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'poll',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_POLLS_KV)),
      },
    });
  }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const slug = url.searchParams.get('slug');
    const viaFilter = url.searchParams.get('via');
    if (!slug) {
      return json({
        ok: true,
        endpoint: 'https://pointcast.xyz/api/poll',
        kvBound: Boolean(env.PC_POLLS_KV),
        usage: 'POST { type: "pc-poll-v1", slug, optionId, via?, address?, timestamp }. GET ?slug=…[&via=cohort] for tally (optionally filtered by cohort).',
        notes: [
          'Schelling-point poll vote store.',
          'Per-address dedup; anonymous votes dedup by UA+IP fingerprint.',
          'Tally keys: tally:{slug}:{optionId}. Vote keys: voted:{slug}:{key}.',
          'Optional cohort tag: tally:{slug}:{optionId}:via:{cohort} for per-cohort counts.',
          'Until PC_POLLS_KV is bound, POST returns 503.',
        ],
        spec: 'https://pointcast.xyz/polls',
      });
    }

    if (!env.PC_POLLS_KV) return json({ ok: false, reason: 'key-not-bound' }, 503);
    if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(slug)) return json({ ok: false, error: 'bad-slug' }, 400);
    if (viaFilter && !/^[a-z0-9][a-z0-9-]{0,40}$/.test(viaFilter)) {
      return json({ ok: false, error: 'bad-via' }, 400);
    }

    try {
      const prefix = viaFilter
        ? `tally:${slug}:`  // we'll post-filter by via sub-key
        : `tally:${slug}:`;
      const list = await env.PC_POLLS_KV.list({ prefix });
      const tally: Record<string, number> = {};
      let total = 0;
      for (const k of list.keys) {
        // Skip via-specific sub-tallies in the main list (they match prefix but
        // have extra `:via:{cohort}` segments). Unless viaFilter is set, in
        // which case we ONLY want those matching the cohort.
        const suffix = k.name.replace(`tally:${slug}:`, '');
        const hasVia = suffix.includes(':via:');
        if (viaFilter) {
          // Want only entries matching `{optionId}:via:{cohort}`.
          if (!hasVia) continue;
          const [optionId, _via, cohort] = suffix.split(':');
          if (cohort !== viaFilter) continue;
          const v = await env.PC_POLLS_KV.get(k.name);
          const count = v ? parseInt(v, 10) || 0 : 0;
          tally[optionId] = (tally[optionId] || 0) + count;
          total += count;
        } else {
          // Want only entries without `:via:` (the aggregate tally).
          if (hasVia) continue;
          const v = await env.PC_POLLS_KV.get(k.name);
          const count = v ? parseInt(v, 10) || 0 : 0;
          tally[suffix] = count;
          total += count;
        }
      }
      return json({ ok: true, slug, via: viaFilter || null, total, tally });
    } catch (err: any) {
      return json({ ok: false, error: 'kv-list-failed', message: err?.message }, 500);
    }
  }

  if (request.method !== 'POST') return json({ ok: false, error: 'method-not-allowed' }, 405);

  if (!env.PC_POLLS_KV) {
    return json({ ok: false, reason: 'key-not-bound', hint: 'Bind PC_POLLS_KV in wrangler.toml or Cloudflare dashboard.' }, 503);
  }

  let body: PollPayload;
  try { body = (await request.json()) as PollPayload; } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }
  if (body.type !== 'pc-poll-v1') return json({ ok: false, error: 'unsupported-type', got: body.type }, 400);
  if (!body.slug || !/^[a-z0-9][a-z0-9-]{0,60}$/.test(body.slug)) return json({ ok: false, error: 'bad-slug' }, 400);
  if (!body.optionId || !/^[a-z0-9][a-z0-9-]{0,30}$/.test(body.optionId)) return json({ ok: false, error: 'bad-option-id' }, 400);
  if (body.address && !/^(tz|KT)[1-3][1-9A-HJ-NP-Za-km-z]{33}$/.test(body.address)) {
    return json({ ok: false, error: 'bad-address' }, 400);
  }
  const via = body.via ? String(body.via).toLowerCase() : '';
  if (via && !/^[a-z0-9][a-z0-9-]{0,40}$/.test(via)) {
    return json({ ok: false, error: 'bad-via' }, 400);
  }

  const voterKey = body.address || (await fingerprint(request));
  const dedupKey = `voted:${body.slug}:${voterKey}`;

  try {
    // Dedup check.
    const prior = await env.PC_POLLS_KV.get(dedupKey);
    if (prior) {
      // Already voted — return current tally without incrementing.
      return json({ ok: false, error: 'already-voted', votedFor: prior, slug: body.slug }, 409);
    }

    // Increment aggregate tally.
    const tallyKey = `tally:${body.slug}:${body.optionId}`;
    const cur = await env.PC_POLLS_KV.get(tallyKey);
    const next = (cur ? parseInt(cur, 10) || 0 : 0) + 1;
    await env.PC_POLLS_KV.put(tallyKey, String(next));

    // If cohort-tagged, also increment the cohort-specific tally.
    let viaCount: number | null = null;
    if (via) {
      const viaKey = `tally:${body.slug}:${body.optionId}:via:${via}`;
      const curVia = await env.PC_POLLS_KV.get(viaKey);
      viaCount = (curVia ? parseInt(curVia, 10) || 0 : 0) + 1;
      await env.PC_POLLS_KV.put(viaKey, String(viaCount));
    }

    // Record dedup. 180-day TTL aligns with the longest poll cycle we'd expect.
    await env.PC_POLLS_KV.put(dedupKey, body.optionId, {
      expirationTtl: 180 * 24 * 3600,
      metadata: { at: body.timestamp || new Date().toISOString(), via: via || null },
    });

    return json({ ok: true, slug: body.slug, optionId: body.optionId, count: next, via: via || null, viaCount });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-write-failed', message: err?.message }, 500);
  }
};
