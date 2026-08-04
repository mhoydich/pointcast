/**
 * /cartography/home.json - Home Cartography concept, machine-readable.
 */
import type { APIRoute } from 'astro';
import { HOME_CARTOGRAPHY } from '../../lib/home-cartography';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/cartography/home.json',
    generatedAt: new Date().toISOString(),
    note: 'Concept surface. No device exists yet, no inventory data is collected, and nothing here is an offer or financial claim.',
    ...HOME_CARTOGRAPHY,
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
