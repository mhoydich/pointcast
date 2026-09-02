/**
 * /cartography/home/field-kit.json - Home Cartography field kit payload.
 */
import type { APIRoute } from 'astro';
import { HOME_FIELD_KIT } from '../../../lib/home-cartography-field-kit';
import { HOME_CARTOGRAPHY } from '../../../lib/home-cartography';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/cartography/home/field-kit.json',
    generatedAt: new Date().toISOString(),
    note: 'Phone-usable protocol for indexing one real room. Nothing here is collected by PointCast — copy the templates, fill them in locally, keep the file.',
    concept: {
      id: HOME_CARTOGRAPHY.id,
      homepage: HOME_CARTOGRAPHY.homepage,
      json: HOME_CARTOGRAPHY.json,
    },
    fieldKit: HOME_FIELD_KIT,
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
