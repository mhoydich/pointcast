import config from '../../../data/art-v2-commerce.json';
export const prerender = true;
export function GET() {
  return new Response(JSON.stringify(config), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
}
