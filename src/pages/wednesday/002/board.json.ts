import type { APIRoute } from 'astro';
import {
  GOOD_WORK_PINBOARD,
  absoluteWednesdayPinboard,
} from '../../../lib/wednesday-pinboards';

export const GET: APIRoute = () => {
  const payload = absoluteWednesdayPinboard(GOOD_WORK_PINBOARD);

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      Link: `<${GOOD_WORK_PINBOARD.canonicalUrl}>; rel="alternate"; type="text/html"`,
    },
  });
};
