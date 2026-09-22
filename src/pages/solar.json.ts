import { SOLAR_BRIEF } from '../lib/solar-ladder';
export const GET = () => new Response(JSON.stringify(SOLAR_BRIEF, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
