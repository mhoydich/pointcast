import type { APIRoute } from 'astro';
import { POLYGON_BELL_TOKEN, polygonBellMetadata } from '../../lib/polygon-bell-token';

export function getStaticPaths() {
  return [{ params: { tokenId: POLYGON_BELL_TOKEN.tokenId } }];
}

export const GET: APIRoute = ({ site }) => {
  return new Response(JSON.stringify(polygonBellMetadata(site), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
