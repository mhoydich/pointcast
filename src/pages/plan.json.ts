/**
 * /plan.json — agent-readable mirror of src/data/plan.json.
 *
 * Sibling to /operating-mode.json. Different lane:
 *
 *   - /operating-mode.json   granular sprint state — what's in flight today
 *                             (queued / in-progress / blocked, with kind +
 *                             ref + owner).
 *   - /plan.json             editorial weekly view + decisions queue —
 *                             this-week dated goals (GOAL / MERGE /
 *                             ORIGINATE / INCIDENT), things only Mike can
 *                             resolve, what's queued behind the week.
 *
 * The HTML view at /plan layers due-date tone coloring on top of this same
 * data. Agents reading /plan.json get the raw structured version.
 *
 * Cache-control mirrors operating-mode: a few updates per day, so 60s
 * fresh + 10min stale-while-revalidate keeps the surface lively without
 * thrashing the CDN.
 */
import type { APIRoute } from 'astro';
import planData from '../data/plan.json';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(planData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
      'X-Pc-Surface': 'plan',
      'X-Pc-Sibling': 'https://pointcast.xyz/operating-mode.json',
    },
  });
};
