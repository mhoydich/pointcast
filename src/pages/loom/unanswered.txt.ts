import type { APIRoute } from 'astro';
import { findUnanswered, unansweredText } from '../../lib/loom/unanswered.mjs';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const result = await findUnanswered({ origin: new URL(request.url).origin });
    return new Response(unansweredText(result), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' } });
  } catch {
    return new Response('The Loom is out of reach right now. Try again in a minute.\n', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
};
