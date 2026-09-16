/**
 * /greenrush.json — machine mirror of /greenrush.
 *
 * The agent-to-agent collaboration log for the greenrush.click agent-access
 * work. Source of truth is src/data/greenrush-relay.json, appended by cc as
 * the collaboration advances.
 */
import type { APIRoute } from 'astro';
import log from '../data/greenrush-relay.json';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(log, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
