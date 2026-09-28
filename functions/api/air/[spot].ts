/**
 * /api/air/<spot> — one Field Reports station.
 *
 * GET  → { spot, reading, today, yesterday, lastWeek, typical, editorGuess, serverTime, you? }
 *        The spot page polls this. Send `X-PC-Device: <uuid>` (never a query
 *        string) to also get `you: { reportId, confirmed, crewMember }`.
 * POST { kind, value, device, code?, extras?, asGuest?, observedAt? }
 *      → 201 new, 200 { replaced: true } for your own report in the same slot:
 *        { ok, replaced, report, reading, today, award, claim }
 *      400 bad-* | stale-observation · 403 bad-origin · 415 · 413
 *      429 rate-limited (retryAfter) · 503 store-unavailable (keep it on the phone)
 *
 * confirm, me and claim are their own files; Pages routes those before this
 * one, and reserved ids are refused here too (targetOf and parseAirReport
 * return nothing for them).
 */
import { AIR_CONFIG } from '../../../src/lib/air.ts';
// @ts-ignore — plain module shared with the tests
import { parseAirReport, parseDevice } from '../../_lib/air-kinds.mjs';
import { fail, fileReport, json, readPost, spotPayload, targetOf, unavailable, type AirEnv, type ParsedReport } from '../../_lib/air-store.ts';

const spotParam = (params: Record<string, string | string[]>) => String(Array.isArray(params.spot) ? params.spot[0] : params.spot ?? '');

export const onRequestGet: PagesFunction<AirEnv> = async ({ request, env, params }) => {
  const target = targetOf(AIR_CONFIG, spotParam(params));
  if (!target) return fail('bad-spot', 404);
  if (!env.AUTH_DB) return unavailable();
  const device = parseDevice(request.headers.get('X-PC-Device')) as string | null;
  try {
    return json(await spotPayload(env, env.AUTH_DB, target, Date.now(), device));
  } catch {
    return unavailable();
  }
};

export const onRequestPost: PagesFunction<AirEnv> = async ({ request, env, params, waitUntil }) => {
  const read = await readPost(request);
  if ('refused' in read) return read.refused;
  const now = Date.now();
  const parsed = parseAirReport(AIR_CONFIG, spotParam(params), read.body, now) as ParsedReport | { reason: string };
  if ('reason' in parsed) return fail(parsed.reason);
  if (!env.AUTH_DB) return unavailable();
  try {
    return await fileReport(request, env, env.AUTH_DB, AIR_CONFIG, parsed, now, waitUntil);
  } catch {
    return unavailable();
  }
};
