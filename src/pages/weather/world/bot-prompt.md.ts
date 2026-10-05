import type { APIRoute } from 'astro';
import body from '../../../content/weather/world-bot-prompt.md?raw';

/** /weather/world/bot-prompt.md — paste-in prompt for one wx: report. The board never posts. */

export const GET: APIRoute = () =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
