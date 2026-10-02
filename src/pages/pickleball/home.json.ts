import type { APIRoute } from 'astro';
import learning from '../../lib/pickleball-home/learning.json' with { type: 'json' };
import courts from '../../lib/pickleball-home/courts.json' with { type: 'json' };

export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'Pickleball Home · RALLY × PointCast',
  url: 'https://pointcast.xyz/pickleball/home',
  primarySite: 'https://tez-rally.pages.dev/',
  board: 'https://pointcast.xyz/pickleball',
  learning,
  courts,
  availability: 'Directory facts are sourced and dated. This feed does not claim current court availability.',
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } });
