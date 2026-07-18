/**
 * /door.json — machine twin of /door, the daily dusting.
 *
 * Ships the pool, the formula, and the pick as of generation time. An
 * agent can re-run the formula (fnv1a(PT date) % pool.length) for any
 * date — the pick is deterministic, no cron behind it.
 */
import type { APIRoute } from 'astro';
import { doorPool, pickForDate, ptDate, POOL_DAYS } from '../lib/door-of-the-day';

export const GET: APIRoute = () => {
  const pool = doorPool();
  const today = ptDate();
  const pick = pickForDate(pool, today);

  const payload = {
    $schema: 'https://pointcast.xyz/door.json',
    name: 'Door of the Day',
    law: 'opening it counts as dusting',
    formula: 'fnv1a(PT date "YYYY-MM-DD") % pool.length, pool sorted oldest-first',
    poolCriteria: `pages untouched for ${POOL_DAYS}+ days by last git commit`,
    generatedAt: new Date().toISOString(),
    date: today,
    today: pick
      ? { ...pick, url: `https://pointcast.xyz${pick.slug}` }
      : null,
    poolSize: pool.length,
    pool: pool.map((f) => ({ ...f, url: `https://pointcast.xyz${f.slug}` })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
