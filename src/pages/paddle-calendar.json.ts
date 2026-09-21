import { PADDLE_CALENDAR_BRIEF } from '../lib/paddle-calendar';
export const GET = () => new Response(JSON.stringify(PADDLE_CALENDAR_BRIEF, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
