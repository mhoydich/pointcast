import type { APIRoute } from 'astro';
import { basketSnapshot } from '../lib/local-costs.mjs';
export const GET: APIRoute = () => new Response(JSON.stringify({...basketSnapshot(),home:'https://pointcast.xyz/local-costs',live:'https://pointcast.xyz/api/local-costs',note:'Build snapshot. For current freshness and intake readiness, use live API.'}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
