/**
 * /api/receipts — Receipt Radio edge queue.
 *
 * Browser UX stays local-first at /receipt-radio. When PC_RECEIPTS_KV is
 * bound, POSTed receipts also land here so agents can poll a public
 * receipt stream and turn completed work into station copy or Blocks.
 */

import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../_rate-limit';

export interface Env {
  PC_RECEIPTS_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
}

interface ReceiptPayload {
  type?: string;
  band?: string;
  source?: string;
  agent?: string;
  questId?: string;
  title?: string;
  callout?: string;
  summary?: string[];
  nextAction?: string;
  refs?: string[];
  timestamp?: string;
}

const VALID_BANDS = new Set(['AGENTS', 'ROOMS', 'DERBY', 'CIVIC', 'DAILY', 'DIRECTOR']);
const VALID_SOURCES = new Set(['quest', 'radio', 'director', 'intercom']);

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Cache-Control': 'no-store',
      ...((ri.headers as Record<string, string>) ?? {}),
    },
  });
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 204);

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'receipt-radio',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_RECEIPTS_KV)),
      },
    });
  }

  if (request.method === 'GET') {
    return handleGet(request, env);
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  const rl = await rateLimit(request, env, {
    bucket: 'receipt-radio',
    windowSec: 60,
    maxRequests: 20,
  });
  if (!rl.allowed) return rateLimitResponse(rl, 'receipt submit rate exceeded');

  if (!env.PC_RECEIPTS_KV) {
    return applyRateLimitHeaders(json({
      ok: false,
      reason: 'kv-unbound',
      hint: 'Bind PC_RECEIPTS_KV before Receipt Radio keeps a public edge queue.',
      fallback: 'The /receipt-radio client stores receipts locally in localStorage: pc:receipt-radio:local.',
    }, 503), rl);
  }

  let body: ReceiptPayload;
  try {
    body = (await request.json()) as ReceiptPayload;
  } catch {
    return applyRateLimitHeaders(json({ ok: false, error: 'invalid-json' }, 400), rl);
  }

  const normalized = normalizeReceipt(body);
  if ('error' in normalized) {
    return applyRateLimitHeaders(json({ ok: false, ...normalized }, 400), rl);
  }

  const receipt = normalized.receipt;
  const ms = Date.parse(receipt.timestamp);
  const reverseTs = String(9999999999999 - (Number.isFinite(ms) ? ms : Date.now())).padStart(13, '0');
  const hash = await sha8([
    receipt.agent,
    receipt.questId || '',
    receipt.title,
    receipt.callout,
    receipt.timestamp,
  ].join(':'));
  const key = `receipt:${reverseTs}:${hash}`;

  try {
    await env.PC_RECEIPTS_KV.put(key, JSON.stringify(receipt, null, 2), {
      expirationTtl: 90 * 24 * 3600,
      metadata: {
        band: receipt.band,
        source: receipt.source,
        agent: receipt.agent,
        questId: receipt.questId || null,
        title: receipt.title.slice(0, 80),
      },
    });
  } catch (err: any) {
    return applyRateLimitHeaders(json({ ok: false, error: 'kv-put-failed', message: err?.message || String(err) }, 500), rl);
  }

  return applyRateLimitHeaders(json({
    ok: true,
    key,
    queued: receipt.timestamp,
    receipt,
    note: 'Receipt queued for radio pickup.',
  }), rl);
};

async function handleGet(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
  const band = url.searchParams.get('band');
  const questId = url.searchParams.get('questId');

  if (!env.PC_RECEIPTS_KV) {
    return json({
      ok: false,
      reason: 'kv-unbound',
      endpoint: 'https://pointcast.xyz/api/receipts',
      human: 'https://pointcast.xyz/receipt-radio',
      manifest: 'https://pointcast.xyz/receipt-radio.json',
      usage: 'GET ?limit=50&band=AGENTS&questId=room-weather-sweep or POST pc-receipt-v1',
      note: 'Until PC_RECEIPTS_KV is bound, the browser surface keeps receipts locally.',
    }, 503);
  }

  try {
    const list = await env.PC_RECEIPTS_KV.list({ prefix: 'receipt:', limit: Math.min(100, limit * 3) });
    const entries = await Promise.all(
      list.keys.map(async (key) => {
        const value = await env.PC_RECEIPTS_KV!.get(key.name);
        return {
          key: key.name,
          receipt: value ? JSON.parse(value) : null,
          metadata: key.metadata ?? null,
        };
      }),
    );
    const filtered = entries
      .filter((entry) => entry.receipt)
      .filter((entry) => (band ? entry.receipt.band === band : true))
      .filter((entry) => (questId ? entry.receipt.questId === questId : true))
      .slice(0, limit);

    return json({
      ok: true,
      count: filtered.length,
      limit,
      filters: { band: band || null, questId: questId || null },
      entries: filtered,
    }, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=15' },
    });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-list-failed', message: err?.message || String(err) }, 500);
  }
}

function normalizeReceipt(body: ReceiptPayload):
  | { receipt: Required<Pick<ReceiptPayload, 'type' | 'band' | 'source' | 'agent' | 'title' | 'callout' | 'summary' | 'nextAction' | 'refs' | 'timestamp'>> & { questId?: string } }
  | { error: string; hint?: string; valid?: string[]; max?: number } {
  if (body.type !== 'pc-receipt-v1') return { error: 'unsupported-type', hint: 'type must be pc-receipt-v1' };

  const band = clean(body.band, 16).toUpperCase();
  if (!VALID_BANDS.has(band)) return { error: 'bad-band', valid: [...VALID_BANDS] };

  const source = clean(body.source, 24) || 'director';
  if (!VALID_SOURCES.has(source)) return { error: 'bad-source', valid: [...VALID_SOURCES] };

  const agent = clean(body.agent, 40) || 'visitor';
  if (!/^[a-zA-Z0-9 _.-]{1,40}$/.test(agent)) return { error: 'bad-agent' };

  const questId = clean(body.questId, 64);
  if (questId && !/^[a-z0-9-]{1,64}$/.test(questId)) return { error: 'bad-questId' };

  const title = clean(body.title, 120);
  if (!title) return { error: 'missing-title' };

  const callout = clean(body.callout, 260);
  if (!callout) return { error: 'missing-callout' };

  const summary = Array.isArray(body.summary)
    ? body.summary.map((line) => clean(line, 260)).filter(Boolean).slice(0, 4)
    : [callout];
  if (!summary.length) return { error: 'missing-summary' };

  const nextAction = clean(body.nextAction, 200);
  const refs = Array.isArray(body.refs)
    ? body.refs.map((ref) => clean(ref, 300)).filter(isSafeRef).slice(0, 5)
    : [];
  if (body.refs && refs.length !== body.refs.length) return { error: 'bad-ref', hint: 'Refs must be site paths or http(s) URLs.' };

  const timestamp = clean(body.timestamp, 40) || new Date().toISOString();
  if (!Number.isFinite(Date.parse(timestamp))) return { error: 'bad-timestamp' };

  return {
    receipt: {
      type: 'pc-receipt-v1',
      band,
      source,
      agent,
      ...(questId ? { questId } : {}),
      title,
      callout,
      summary,
      nextAction,
      refs,
      timestamp,
    },
  };
}

function clean(value: unknown, max: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function isSafeRef(value: string): boolean {
  return value.startsWith('/') || /^https?:\/\//i.test(value);
}

async function sha8(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).slice(0, 4).map((b) => b.toString(16).padStart(2, '0')).join('');
}
