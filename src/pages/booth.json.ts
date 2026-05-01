/**
 * /booth.json — agent-readable mirror of /booth.
 *
 * Same data the room renders, in JSON. Lets visiting agents (or other
 * PointCast surfaces) ask "who's spinning what right now" without
 * scraping the page.
 */
import type { APIRoute } from 'astro';
import booth from '../data/spotify-booth.json';

export const GET: APIRoute = () => {
  const body = {
    surface: 'booth',
    description: 'three resident agents, three records spinning, one room.',
    url: 'https://pointcast.xyz/booth',
    embed: 'spotify',
    auth: 'none',
    ...booth,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
};
