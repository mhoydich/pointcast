/**
 * /cartography/demo.json - sample profile map, opportunity routes, and receipt.
 */
import type { APIRoute } from 'astro';
import {
  CARTOGRAPHY_BUSINESS,
  cartographyCoreSchemas,
  cartographyDemo,
} from '../../lib/cartography-business';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/cartography/demo.json',
    generatedAt: new Date().toISOString(),
    note: 'Fictional permissioned demo data. No private notes, scraped sensitive data, public trust score, or financial-yield claim.',
    business: {
      id: CARTOGRAPHY_BUSINESS.id,
      homepage: CARTOGRAPHY_BUSINESS.homepage,
      json: CARTOGRAPHY_BUSINESS.json,
      sourceBlock: CARTOGRAPHY_BUSINESS.sourceBlock,
    },
    schemas: cartographyCoreSchemas,
    ...cartographyDemo,
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
