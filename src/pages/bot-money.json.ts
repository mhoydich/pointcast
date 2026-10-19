import type { APIRoute } from 'astro';
import { botMoneyManifest } from '../lib/bot-money.mjs';
export const GET: APIRoute = () => new Response(JSON.stringify(botMoneyManifest(), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
});
