/**
 * GET /api/air/killtest — the Field Reports kill test, counted honestly:
 * on-site answers to a spot's main question, by people, Sep 28 to Oct 23,
 * Fridays left out, read on Sat Oct 24
 * (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §3.2, §7.2). Agents,
 * house phones and accounts, reports without the spot's code and side
 * questions never count (air-killtest.mjs, air-house.mjs).
 *
 * → 200 { ok, window: {from, to}, needs: {reports, people}, reports, people,
 *   pass, final, asOf }. Once `final`, reports/people/pass are the read as
 *   first taken (air_killtest_reads), with `readAt`, and `recount:
 *   {reports, people}` when the live figure has moved since. Public,
 *   `Cache-Control: public, max-age=60`, CORS *. Numbers and dates only: no
 *   ids, no bylines, no per-day or per-person figures. 503 store-unavailable
 *   without D1, on any read failure, and before
 *   migrations/auth/0031_field_reports_paper.sql is applied.
 */
import { AIR_CONFIG } from '../../../src/lib/air.ts';
// @ts-ignore — plain module shared with the tests
import { KILL_TEST, killTestCount } from '../../_lib/air-killtest.mjs';
// @ts-ignore — plain module shared with the tests
import { isoSec } from '../../_lib/air-reading.mjs';
import { keepKillTestRead, killTestRows } from '../../_lib/air-count-store.ts';
import { json, unavailable, type AirEnv } from '../../_lib/air-store.ts';

const PUBLIC = { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' };

export const onRequestGet: PagesFunction<AirEnv> = async ({ env }) => {
  if (!env.AUTH_DB) return unavailable();
  try {
    const now = Date.now();
    const count = killTestCount(AIR_CONFIG, await killTestRows(env.AUTH_DB), now);
    if (!count.final) return json({ ok: true, ...count }, 200, PUBLIC);
    const kept = await keepKillTestRead(env.AUTH_DB, KILL_TEST.readOn, count, now);
    if (!kept) return unavailable();
    const moved = kept.reports !== count.reports || kept.people !== count.people;
    return json({
      ok: true,
      ...count,
      reports: kept.reports,
      people: kept.people,
      pass: kept.pass,
      readAt: isoSec(kept.readAt),
      ...(moved ? { recount: { reports: count.reports, people: count.people } } : {}),
    }, 200, PUBLIC);
  } catch {
    return unavailable();
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' } });
