import { WAVE_BRIEF } from '../lib/nounswave';
export const GET = () => new Response(JSON.stringify(WAVE_BRIEF, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
