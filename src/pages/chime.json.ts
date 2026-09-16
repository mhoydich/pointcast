import { CHIME_PROJECT } from '../lib/chime';
export const GET = () => new Response(JSON.stringify(CHIME_PROJECT, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
