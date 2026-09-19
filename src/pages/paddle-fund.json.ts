import { PADDLE_FUND_BRIEF } from '../lib/paddle-fund';
export const GET = () => new Response(JSON.stringify(PADDLE_FUND_BRIEF, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
