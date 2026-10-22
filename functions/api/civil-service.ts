/**
 * /api/civil-service — the El Segundo Civil Service desk (Notice ESCS-001).
 *
 *   GET  ?action=board          public roster: post → holders → receipt count
 *   GET                         desk description + usage
 *   POST { type, action: 'sign_up', handle, post | 'match', kind }
 *   POST { type, action: 'receipt', handle, post, summary, link? }
 *
 * Storage and rules live in functions/_lib/civil-service-store.ts. Handle-only
 * identity; no email or contact detail is accepted, stored, or shown.
 * Independent PointCast project; no real public employment is offered.
 */
import { rateLimit, rateLimitResponse } from '../_rate-limit';
import { OPS_TYPE, board, fileReceipt, signUp } from '../_lib/civil-service-store.ts';
import { CIVIL_SERVICE_POSTS, ESCS_DISCLAIMER, OFFER_CLOCK_DAYS } from '../../src/data/civil-service.ts';

interface Env {
  PC_QUEUE_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
  YARD_RESIDENT_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return options();
  const url = new URL(request.url);

  if (request.method === 'GET' || request.method === 'HEAD') {
    if (url.searchParams.get('action') === 'board') {
      if (!env.PC_QUEUE_KV) return json({ ok: false, reason: 'kv-unbound', roster: [], hint: 'PC_QUEUE_KV is not bound; the roster is empty until it is.' }, 503);
      try {
        const result = await board(env.PC_QUEUE_KV);
        return json(result.body, result.status, 'public, max-age=30');
      } catch (error: any) {
        return json({ ok: false, error: 'kv-list-failed', message: error?.message || String(error) }, 500);
      }
    }
    return json({
      ok: true,
      endpoint: 'https://pointcast.xyz/api/civil-service',
      kvBound: Boolean(env.PC_QUEUE_KV),
      type: OPS_TYPE,
      offerClockDays: OFFER_CLOCK_DAYS,
      posts: CIVIL_SERVICE_POSTS.map((post) => ({ code: post.code, title: post.title, who: post.who })),
      usage: {
        board: 'GET ?action=board',
        sign_up: { type: OPS_TYPE, action: 'sign_up', handle: 'signal-pup', post: 'ESC-305 | match', kind: 'neighbor | agent | pair' },
        receipt: { type: OPS_TYPE, action: 'receipt', handle: 'signal-pup', post: 'ESC-305', summary: 'what you did, ≤400 chars', link: 'https://… (optional)' },
      },
      privacy: 'Handle only. No email, account, or contact detail is collected, stored, or shown.',
      manifest: 'https://pointcast.xyz/civil-service.json',
      disclaimer: ESCS_DISCLAIMER,
    });
  }

  if (request.method !== 'POST') return json({ ok: false, error: 'method-not-allowed', allowed: ['GET', 'POST', 'OPTIONS'] }, 405);
  if (!env.PC_QUEUE_KV) {
    return json({ ok: false, reason: 'kv-unbound', hint: 'Bind PC_QUEUE_KV in Cloudflare Pages before the desk can store sign-ups.' }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }
  if (!body || body.type !== OPS_TYPE) return json({ ok: false, error: 'unsupported-type', expected: OPS_TYPE }, 400);

  const rl = await rateLimit(request, env, { bucket: 'escs:desk', windowSec: 3600, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl, 'the civil service desk is busy; try again shortly');

  const isResident = Boolean(env.YARD_RESIDENT_KEY) && request.headers.get('X-Yard-Resident') === env.YARD_RESIDENT_KEY;

  try {
    if (body.action === 'sign_up') {
      const result = await signUp(env.PC_QUEUE_KV, body, new Date(), isResident);
      return json(result.body, result.status);
    }
    if (body.action === 'receipt') {
      const result = await fileReceipt(env.PC_QUEUE_KV, body);
      return json(result.body, result.status);
    }
  } catch (error: any) {
    return json({ ok: false, error: 'kv-failed', message: error?.message || String(error) }, 502);
  }
  return json({ ok: false, error: 'bad-action', valid: ['sign_up', 'receipt'] }, 400);
};

function json(body: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': cache,
    },
  });
}

function options(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
