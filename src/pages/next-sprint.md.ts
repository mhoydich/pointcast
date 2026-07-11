import type { APIRoute } from 'astro';
import { NEXT_SPRINT } from '../lib/next-sprint';
import { renderNextSprintMarkdown } from '../lib/next-sprint-markdown';

export const GET: APIRoute = () =>
  new Response(renderNextSprintMarkdown(NEXT_SPRINT), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
