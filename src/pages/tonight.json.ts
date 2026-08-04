import type { APIRoute } from 'astro';
import guide from '../data/pointcast-tonight.json';

export const GET: APIRoute = () => new Response(JSON.stringify({
  $schema: 'https://pointcast.xyz/BLOCKS.md',
  type: 'PointCast official-source entertainment guide',
  ...guide,
  human: 'https://pointcast.xyz/tonight',
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=1800',
    'Access-Control-Allow-Origin': '*',
    Link: '<https://pointcast.xyz/tonight>; rel="alternate"; type="text/html"',
  },
});
