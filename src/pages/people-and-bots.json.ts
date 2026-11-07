import { PEOPLE_AND_BOTS_PUBLIC } from '../lib/people-and-bots.mjs';

/** /people-and-bots.json: the same draft the HTML page renders. */
export const GET = () =>
  new Response(JSON.stringify(PEOPLE_AND_BOTS_PUBLIC, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
      'X-Pointcast-Status': 'draft',
    },
  });
