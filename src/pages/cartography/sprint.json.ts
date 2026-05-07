/**
 * /cartography/sprint.json - machine-readable Cartography next sprint board.
 */
import type { APIRoute } from 'astro';
import { CARTOGRAPHY_NEXT_SPRINT } from '../../lib/cartography-sprint';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/cartography/sprint.json',
    generatedAt: new Date().toISOString(),
    ...CARTOGRAPHY_NEXT_SPRINT,
    related: {
      cartography: 'https://pointcast.xyz/cartography',
      cartographyJson: 'https://pointcast.xyz/cartography.json',
      pilot: 'https://pointcast.xyz/cartography/pilot',
      pilotJson: 'https://pointcast.xyz/cartography/pilot.json',
      joinJson: 'https://pointcast.xyz/join.json',
      block: CARTOGRAPHY_NEXT_SPRINT.sourceBlock,
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
