import type { APIRoute } from 'astro';
import { publishedSeminars, seminarBySlug } from '../../../lib/ues-philosophy';

export function getStaticPaths() {
  return publishedSeminars().map((seminar) => ({
    params: { slug: seminar.slug },
  }));
}

/** /ues/philosophy/{slug}.json — one published seminar. */
export const GET: APIRoute = ({ params }) => {
  const seminar = seminarBySlug(String(params.slug));
  if (!seminar || seminar.status !== 'published') {
    return new Response(JSON.stringify({ error: 'not-found' }), { status: 404 });
  }
  return new Response(JSON.stringify(seminar, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
