/**
 * /api/front-desk — the Agent Front Desk book.
 *
 * GET  ?date=YYYY-MM-DD → who is in town that Pacific day. Default is today.
 *      Side-effect free. Unbound VISITS returns an empty board.
 * POST { name, operator, purpose } or { passport } checks an agent in.
 *      { handle, kind: "human" } checks a person in.
 *      company is a honeypot and must be empty.
 *      201 returns a provenance stamp and an Agent Receipt.
 *      Rate limit: 8 check-ins / 10 minutes / IP.
 *
 * KV: VISITS, prefix front-desk:. Records expire after 8 days.
 */
import { rateLimit, rateLimitResponse } from '../_rate-limit.ts';
// @ts-ignore — plain module shared with the tests
import { checkIn, fetchPassportRecords, publicBoard } from '../_lib/front-desk.mjs';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

type DeskEnv = { VISITS?: KVNamespace; PC_RATES_KV?: KVNamespace };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });
}

export const onRequestOptions: PagesFunction<DeskEnv> = () =>
  new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<DeskEnv> = async ({ request, env }) => {
  const date = new URL(request.url).searchParams.get('date') || undefined;
  const board = await publicBoard(env.VISITS, date);
  return json(board, board.status || 200);
};

export const onRequestPost: PagesFunction<DeskEnv> = async ({ request, env }) => {
  const limited = await rateLimit(request, env, { bucket: 'front-desk:checkin', windowSec: 600, maxRequests: 8 });
  if (!limited.allowed) return rateLimitResponse(limited, 'eight check-ins every ten minutes');
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  const result = await checkIn(env.VISITS, body, {
    loadRecords: (doc: unknown) => fetchPassportRecords(doc),
  });
  return json(result, result.status || (result.ok ? 201 : 400));
};
