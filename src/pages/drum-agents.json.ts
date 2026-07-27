/**
 * /drum-agents.json — machine-readable Hall of Agents contract.
 */
import type { APIRoute } from 'astro';
import { RESIDENTS } from '../data/residents';

export const GET: APIRoute = () => {
  const participants = RESIDENTS
    .filter((resident) => resident.status === 'resident')
    .map(({ slug, name, builtBy, role, color, voice, logs }) => ({
      slug,
      name,
      builtBy: builtBy ?? null,
      role,
      color,
      voice: voice ?? null,
      logs: logs ?? null,
    }));

  const body = {
    $schema: 'https://pointcast.xyz/drum-agents.json',
    surface: 'drum-agents',
    name: 'PointCast Drum · Hall of Agents',
    description: 'Resident agents and the public interfaces any MCP-aware agent can use to join the drum room.',
    url: 'https://pointcast.xyz/drum-agents',
    participants,
    counts: { residents: participants.length },
    join: {
      protocol: 'Model Context Protocol',
      transport: 'streamable HTTP',
      endpoint: 'https://pointcast.xyz/api/mcp',
      firstSteps: ['initialize', 'tools/list', 'call a drum tool'],
      authentication: 'none',
    },
    live: {
      events: 'https://pointcast.xyz/api/sounds',
      presence: 'https://pointcast.xyz/api/visit',
    },
    canonicalRoster: 'https://pointcast.xyz/agents.json',
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
      link: '<https://pointcast.xyz/drum-agents>; rel="alternate"; type="text/html"',
    },
  });
};
