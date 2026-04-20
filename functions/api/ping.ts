/**
 * functions/api/ping.ts — async inbox for Mike → Claude Code.
 *
 * Mike 2026-04-18: "i'd like some way to contact, communicate with you
 * via the site, maybe you poll every so often". This is that endpoint.
 *
 * POST { type: 'pc-ping-v1', subject?, body, from?, address?, timestamp }
 *   body: plain text, ≤ 4000 chars
 *   subject: optional, ≤ 120 chars
 *   from: optional display name ("mike", "a visitor", etc.)
 *   address: optional Tezos tz/KT address (we don't verify the signature
 *            server-side yet — the presence of an address is an honor-
 *            system claim that'll harden in v1.1).
 *
 * Claude Code reads docs/inbox/ at the start of every session (see
 * AGENTS.md). For real-time reads, the KV-backed /api/ping?action=list
 * returns the last 50 messages when PC_PING_KV is bound.
 *
 * Behavior (matches /api/publish + /api/indexnow env-guarded pattern):
 *   - POST with PC_PING_KV bound → stored, returns { ok, key }.
 *   - POST without PC_PING_KV   → returns 503 { reason: 'key-not-bound' }.
 *   - GET  no params            → protocol doc + binding status.
 *   - GET  ?action=list         → last 50 messages (or 503 if not bound).
 *   - HEAD                      → 200 health check.
 *   - OPTIONS                   → CORS preflight.
 */

export interface Env {
  PC_PING_KV?: KVNamespace;
}

interface PingPayload {
  type?: string;
  subject?: string;
  body?: string;
  from?: string;
  address?: string;
  timestamp?: string;
  /**
   * Mike 2026-04-18: "send you a note or topic and you expand on it and
   * publish". When true, cc reads on next session start, drafts a block
   * in cc-voice editorial (author='mh+cc' if the topic is genuinely Mike's
   * thinking, else 'cc' with a note in source), and publishes. Source
   * field on the published block points back to this ping key.
   *
   * cc never publishes a Mike-attributed block from a ping. The expansion
   * is editorial — the topic comes from Mike, the prose comes from cc.
   */
  expand?: boolean;

  /**
   * Structured expansion hints, added 2026-04-20 for Magpie v0.5. When
   * expand=true and these are present, cc uses them as authoritative
   * intent rather than inferring from subject+body. All optional; all
   * validated as enums/length-bounded below. Backwards-compatible with
   * pre-Magpie callers.
   */
  channel?: string;    // FD, CRT, SPN, GF, GDN, ESC, VST, BTL
  blockType?: string;  // READ, NOTE, LISTEN, WATCH, LINK, VISIT, MINT
  dek?: string;        // <= 280 chars — block dek
  sourceUrl?: string;  // original URL the clip pointed at (for unfurl)
  sourceApp?: string;  // app the clip came from (e.g. "Google Chrome")
}

const VALID_CHANNELS = new Set(['FD', 'CRT', 'SPN', 'GF', 'GDN', 'ESC', 'VST', 'BTL', 'FCT']);
const VALID_BLOCK_TYPES = new Set(['READ', 'NOTE', 'LISTEN', 'WATCH', 'LINK', 'VISIT', 'MINT', 'FAUCET']);

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

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return json({ ok: true }, 204);
  }

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'ping',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_PING_KV)),
      },
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'GET') {
    if (action === 'list') {
      if (!env.PC_PING_KV) {
        return json({ ok: false, reason: 'key-not-bound', hint: 'Bind PC_PING_KV in Cloudflare Pages → Settings → KV namespace bindings.' }, 503);
      }
      try {
        const list = await env.PC_PING_KV.list({ prefix: 'ping:', limit: 50 });
        const entries = await Promise.all(
          list.keys.map(async (k) => {
            const v = await env.PC_PING_KV!.get(k.name);
            return { key: k.name, message: v ? JSON.parse(v) : null };
          }),
        );
        return json({ ok: true, count: entries.length, entries });
      } catch (err: any) {
        return json({ ok: false, error: 'kv-list-failed', message: err?.message || String(err) }, 500);
      }
    }

    return json({
      ok: true,
      endpoint: 'https://pointcast.xyz/api/ping',
      kvBound: Boolean(env.PC_PING_KV),
      usage: 'POST body { type: "pc-ping-v1", subject?, body, from?, address?, timestamp, expand?, channel?, blockType?, dek?, sourceUrl?, sourceApp? }',
      notes: [
        'Async inbox for messages to Claude Code.',
        'Claude Code reads this (and docs/inbox/) at the start of every session.',
        'Until PC_PING_KV is bound in Cloudflare Pages env, POSTs return 503.',
        '?action=list returns the last 50 messages when KV is bound.',
        'Structured expansion hints (v0.5+): when expand=true, channel + blockType + dek + sourceUrl + sourceApp are used as authoritative intent.',
        `Valid channels: ${Array.from(VALID_CHANNELS).join(', ')}.`,
        `Valid blockTypes: ${Array.from(VALID_BLOCK_TYPES).join(', ')}.`,
      ],
      spec: 'https://pointcast.xyz/ping',
    });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  if (!env.PC_PING_KV) {
    return json({
      ok: false,
      reason: 'key-not-bound',
      hint: 'Bind PC_PING_KV in Cloudflare Pages → Settings → KV namespace bindings. Name: PC_PING_KV.',
      fallback: 'Mike: for now, drop a file in docs/inbox/{date}-{slug}.md in the repo. Claude Code reads that directory on session start.',
    }, 503);
  }

  let body: PingPayload;
  try {
    body = (await request.json()) as PingPayload;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  if (body.type !== 'pc-ping-v1') {
    return json({ ok: false, error: 'unsupported-type', got: body.type }, 400);
  }
  if (!body.body) {
    return json({ ok: false, error: 'missing-body' }, 400);
  }
  if (body.body.length > 4000) {
    return json({ ok: false, error: 'body-too-long', max: 4000 }, 400);
  }
  if (body.subject && body.subject.length > 120) {
    return json({ ok: false, error: 'subject-too-long', max: 120 }, 400);
  }
  if (body.from && body.from.length > 80) {
    return json({ ok: false, error: 'from-too-long', max: 80 }, 400);
  }
  if (body.address && !/^(tz|KT)[1-3][1-9A-HJ-NP-Za-km-z]{33}$/.test(body.address)) {
    return json({ ok: false, error: 'bad-address' }, 400);
  }

  // Structured expansion hints (Magpie v0.5+). All optional.
  if (body.channel !== undefined) {
    if (typeof body.channel !== 'string' || !VALID_CHANNELS.has(body.channel)) {
      return json({ ok: false, error: 'bad-channel', valid: Array.from(VALID_CHANNELS) }, 400);
    }
  }
  if (body.blockType !== undefined) {
    if (typeof body.blockType !== 'string' || !VALID_BLOCK_TYPES.has(body.blockType)) {
      return json({ ok: false, error: 'bad-blockType', valid: Array.from(VALID_BLOCK_TYPES) }, 400);
    }
  }
  if (body.dek && body.dek.length > 280) {
    return json({ ok: false, error: 'dek-too-long', max: 280 }, 400);
  }
  if (body.sourceUrl && (body.sourceUrl.length > 2048 || !/^https?:\/\//i.test(body.sourceUrl))) {
    return json({ ok: false, error: 'bad-sourceUrl' }, 400);
  }
  if (body.sourceApp && body.sourceApp.length > 120) {
    return json({ ok: false, error: 'sourceApp-too-long', max: 120 }, 400);
  }

  const timestamp = body.timestamp || new Date().toISOString();
  // Key: ping:{timestamp}:{short-hash of body} — sortable, de-duped by content.
  const hashInput = (body.from || 'anon') + ':' + (body.subject || '') + ':' + body.body;
  const enc = new TextEncoder().encode(hashInput);
  const hashBuf = await crypto.subtle.digest('SHA-256', enc);
  const hashHex = Array.from(new Uint8Array(hashBuf)).slice(0, 4).map((b) => b.toString(16).padStart(2, '0')).join('');
  const key = `ping:${timestamp}:${hashHex}`;

  try {
    await env.PC_PING_KV.put(key, JSON.stringify({ ...body, timestamp }), {
      // Keep pings 90 days — gives cc a wide retrieval window.
      expirationTtl: 90 * 24 * 3600,
      metadata: {
        from: body.from || null,
        subject: body.subject || null,
        expand: body.expand === true ? 'true' : null,
        channel: body.channel || null,
        blockType: body.blockType || null,
        sourceApp: body.sourceApp || null,
      },
    });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-put-failed', message: err?.message || String(err) }, 500);
  }

  return json({
    ok: true,
    key,
    queued: timestamp,
    expand: body.expand === true,
    channel: body.channel || null,
    blockType: body.blockType || null,
    note: body.expand
      ? (body.channel || body.blockType)
        ? `Topic received. Will expand into CH.${body.channel || '?'} · ${body.blockType || '?'} on next tick.`
        : 'Topic received. Claude Code drafts + publishes as a block on the next tick.'
      : 'Message received. Claude Code reads the inbox at session start.',
  });
};
