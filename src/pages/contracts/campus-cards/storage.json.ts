import type { APIRoute } from 'astro';
import storage from '../../../../contracts/build/campus_cards/step_003_cont_0_storage.json';

// The compiled storage template; /desk swaps in admin, treasury, paused and the pinned metadata pointers.
export const GET: APIRoute = () => new Response(JSON.stringify(storage), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
});
