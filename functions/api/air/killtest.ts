/**
 * GET /api/air/killtest — the Field Reports kill test, counted honestly:
 * on-site answers to a spot's main question, by people, Sep 28 to Oct 23,
 * read on Sat Oct 24 (docs/plans/2026-10-18-field-reports-v2-paper-spec.md
 * §3.2, §7.2). Agents, house phones and accounts, remote reports and side
 * questions never count (air-killtest.mjs, air-house.mjs).
 *
 * → 200 { ok, window: {from, to}, needs: {reports, people}, reports, people,
 *   pass, final, asOf }. Public, `Cache-Control: public, max-age=60`, CORS *.
 *   Numbers and dates only: no ids, no bylines, no per-day or per-person
 *   figures. 503 store-unavailable without D1, on any read failure, and before
 *   migrations/auth/0031_field_reports_paper.sql is applied.
 */
import { AIR_CONFIG } from '../../../src/lib/air.ts';
// @ts-ignore — plain module shared with the tests
import { killTestCount } from '../../_lib/air-killtest.mjs';
import { killTestRows } from '../../_lib/air-count-store.ts';
import { json, unavailable, type AirEnv } from '../../_lib/air-store.ts';

const PUBLIC = { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' };

export const onRequestGet: PagesFunction<AirEnv> = async ({ env }) => {
  if (!env.AUTH_DB) return unavailable();
  try {
    const count = killTestCount(AIR_CONFIG, await killTestRows(env.AUTH_DB), Date.now());
    return json({ ok: true, ...count }, 200, PUBLIC);
  } catch {
    return unavailable();
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' } });
