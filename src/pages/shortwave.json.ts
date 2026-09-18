import { SHORTWAVE_BRIEF } from '../lib/shortwave';
export const GET = () => new Response(JSON.stringify(SHORTWAVE_BRIEF, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
