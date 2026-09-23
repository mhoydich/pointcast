import type { APIRoute } from 'astro';
import code from '../../../../contracts/build/campus_cards/step_003_cont_0_contract.json';

// The compiled Michelson the /desk console originates. Same bytes as the repo artifact.
export const GET: APIRoute = () => new Response(JSON.stringify(code), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
});
