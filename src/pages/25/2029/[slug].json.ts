import type { APIRoute } from 'astro';
import {
  POINTCAST_2029,
  POINTCAST_2029_IDENTITIES,
  getPointCast2029Identity,
} from '../../../lib/pointcast-2029';

export function getStaticPaths() {
  return POINTCAST_2029_IDENTITIES.map((identity) => ({
    params: { slug: identity.slug },
  }));
}

export const GET: APIRoute = ({ params }) => {
  const identity = getPointCast2029Identity(params.slug || '');
  if (!identity) {
    return new Response(JSON.stringify({ error: 'Identity system not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify({
    spec: 'pointcast.saturday-rebranded.identity/v1',
    edition: {
      title: POINTCAST_2029.title,
      year: POINTCAST_2029.year,
      human: POINTCAST_2029.canonical,
      machine: POINTCAST_2029.machineEdition,
      board: POINTCAST_2029.board,
    },
    identity,
    status: {
      speculative: true,
      official: false,
      commissioned: false,
      approvedPlan: false,
      licensedMerchandise: false,
      forSale: false,
    },
    boundary: POINTCAST_2029.boundary,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
