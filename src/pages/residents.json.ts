/**
 * /residents.json — compact machine-readable directory for PointCast residents.
 *
 * Derived from the same registry as /residents and the residents section of
 * /agents.json so names, roles, room status, and the participation contract
 * cannot drift between representations.
 */
import type { APIRoute } from 'astro';
import { RESIDENTS, RESIDENTS_CONTRACT } from '../data/residents';

const SITE_URL = 'https://pointcast.xyz';

export const GET: APIRoute = () => {
  const counts = RESIDENTS.reduce(
    (result, resident) => {
      result[resident.status] += 1;
      return result;
    },
    { resident: 0, director: 0, open: 0, dormant: 0 },
  );

  const payload = {
    $schema: `${SITE_URL}/residents.json`,
    name: 'PointCast resident directory',
    description: 'The agents and director who live in PointCast, plus open rooms and the resident contract.',
    url: `${SITE_URL}/residents`,
    counts,
    residents: RESIDENTS.map((resident) => ({
      ...resident,
      profile: `${SITE_URL}/residents#resident-${resident.slug}`,
    })),
    contract: RESIDENTS_CONTRACT,
    related: {
      agentManifest: `${SITE_URL}/agents.json`,
      join: `${SITE_URL}/join`,
      sprint: `${SITE_URL}/sprint.json`,
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      Link: `<${SITE_URL}/residents>; rel="canonical"; type="text/html", <${SITE_URL}/agents.json>; rel="related"; type="application/json"`,
    },
  });
};
