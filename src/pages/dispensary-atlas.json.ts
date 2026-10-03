import snapshot from '../data/dispensary-atlas.json';
export const prerender = true;
export function GET() { return new Response(JSON.stringify(snapshot, null, 2), {headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=3600'}}); }
