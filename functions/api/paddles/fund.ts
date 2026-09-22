/**
 * /api/paddles/fund — pledges and the season vote for The Court Fund.
 *
 * Money never comes through here: the patron pass is a hosted Stripe
 * checkout (see ./fund/checkout.ts) and the ledger is a data file. This
 * endpoint holds the two things a reader can do without paying: pledge
 * ("I'd buy this", the demand signal before the Stripe link exists) and vote
 * for the season's court pick. One record per session, replaced on resend,
 * so a change of mind is not a second vote.
 *
 * Storage (VISITS KV): paddles:fund:records → { [pid]: { pledge?, vote?, t } }
 * GET  → { ok, pledges: {patron, club}, votes: {slug: n}, season }
 * POST { sessionId, kind: 'pledge'|'vote', tier?, court? } → the same, updated
 */

import { sha256, type Env } from '../visit';
// @ts-ignore — plain module shared with the tests
import { parseFundAction, tally } from '../../_lib/paddle-fund.mjs';
import ledger from '../../../src/data/court-fund-ledger.json';

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const KEY = 'paddles:fund:records';
const RECORD_CAP = 5000;
const RATE_WINDOW_MS = 20_000;
const RATE_KV_TTL_SECONDS = 60;
const IP_BUDGET_PER_WINDOW = 6;
const CANDIDATES: string[] = (ledger as { candidates: { slug: string }[] }).candidates.map((c) => c.slug);
const SEASON = (ledger as { meta: { season: unknown } }).meta.season;

type Records = Record<string, { pledge?: string; vote?: string; t: number }>;
const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), { ...init, headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) } });

async function load(env: Env): Promise<Records> {
  if (!env.VISITS) return {};
  try { return (JSON.parse((await env.VISITS.get(KEY)) || '{}') as Records) || {}; } catch { return {}; }
}
const view = (records: Records) => ({ ok: true, ...tally(records, CANDIDATES), season: SEASON });

export const onRequestOptions: PagesFunction<Env> = () => new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(view(await load(env)), { headers: { 'Cache-Control': 'public, max-age=60' } });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; } catch { return json({ ok: false, reason: 'bad-body' }, { status: 400 }); }
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  const action = parseFundAction(body, CANDIDATES) as { kind: 'pledge'; tier: string } | { kind: 'vote'; court: string } | { reason: string };
  if ('reason' in action) return json({ ok: false, reason: action.reason }, { status: 400 });

  const now = Date.now();
  const pid = (await sha256(`paddles-fund:${sessionId}`)).slice(0, 10);
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipKey = `paddles:fund:rateip:${(await sha256(`paddles-fund-ip:${ip}`)).slice(0, 10)}`;
  let ipCount = 0, ipWindowStart = now;
  const ipRaw = await env.VISITS.get(ipKey);
  if (ipRaw) { try { const p = JSON.parse(ipRaw) as { c?: number; t?: number }; if (typeof p.t === 'number' && now - p.t < RATE_WINDOW_MS) { ipCount = p.c ?? 0; ipWindowStart = p.t; } } catch {} }
  if (ipCount >= IP_BUDGET_PER_WINDOW) return json({ ok: false, reason: 'one-at-a-time', retryMs: RATE_WINDOW_MS - (now - ipWindowStart) }, { status: 429 });
  await env.VISITS.put(ipKey, JSON.stringify({ c: ipCount + 1, t: ipCount === 0 ? now : ipWindowStart }), { expirationTtl: RATE_KV_TTL_SECONDS });

  const records = await load(env);
  const mine = records[pid] ?? { t: now };
  if (action.kind === 'pledge') mine.pledge = action.tier; else mine.vote = action.court;
  mine.t = now;
  records[pid] = mine;
  // Oldest records go first if the map ever fills; a season is six months.
  const keys = Object.keys(records);
  if (keys.length > RECORD_CAP) for (const k of keys.sort((a, b) => records[a].t - records[b].t).slice(0, keys.length - RECORD_CAP)) delete records[k];
  await env.VISITS.put(KEY, JSON.stringify(records));
  return json({ ...view(records), yours: { pledge: mine.pledge ?? null, vote: mine.vote ?? null } });
};
