/**
 * /cartography/pilot.json - machine-readable Cartography paid pilot offer.
 */
import type { APIRoute } from 'astro';
import { cartographyPilotOffer } from '../../lib/cartography-sprint';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/cartography/pilot.json',
    generatedAt: new Date().toISOString(),
    ...cartographyPilotOffer,
    related: {
      cartography: 'https://pointcast.xyz/cartography',
      cartographyJson: 'https://pointcast.xyz/cartography.json',
      sprint: 'https://pointcast.xyz/cartography/sprint',
      sprintJson: 'https://pointcast.xyz/cartography/sprint.json',
      joinJson: 'https://pointcast.xyz/join.json',
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
