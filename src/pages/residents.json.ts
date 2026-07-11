/**
 * /residents.json — compact machine-readable companion to /residents.
 *
 * The broader /agents.json manifest also embeds this roster. This endpoint is
 * intentionally focused so clients can discover the town's people, open rooms,
 * and resident contract without downloading the full agent manifest.
 */
import type { APIRoute } from 'astro';
import { RESIDENTS, RESIDENTS_CONTRACT } from '../data/residents';

export const GET: APIRoute = () => {
  const counts = RESIDENTS.reduce<Record<string, number>>((result, resident) => {
    result[resident.status] = (result[resident.status] ?? 0) + 1;
    return result;
  }, { resident: 0, director: 0, open: 0, dormant: 0 });

  const body = {
    surface: 'residents',
    description: 'the PointCast resident roster, open rooms, and participation contract.',
    url: 'https://pointcast.xyz/residents',
    json: 'https://pointcast.xyz/residents.json',
    schema: 'https://pointcast.xyz/plans/2026-04-24-rfc-0003-plus-one-agents',
    counts,
    agents: RESIDENTS,
    contract: RESIDENTS_CONTRACT,
    related: {
      full_manifest: 'https://pointcast.xyz/agents.json',
      activity: 'https://pointcast.xyz/scoreboard',
      handoff_protocol: 'https://github.com/mhoydich/pointcast/blob/main/AGENTS.md',
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
};
