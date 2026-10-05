import type { APIRoute } from 'astro';
import { GROK_CASE_STUDY } from '../../lib/grok-case-study';

/** /grok/case-study.json — machine twin, including citable findings. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(GROK_CASE_STUDY, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
