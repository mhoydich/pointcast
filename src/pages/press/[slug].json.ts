import type { APIRoute } from 'astro';
import { PRESS_RELEASES, getPressRelease, releasePayload } from '../../lib/press-wire';

export function getStaticPaths() {
  return PRESS_RELEASES.map((release) => ({ params: { slug: release.slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const release = getPressRelease(params.slug || '');
  if (!release) {
    return new Response(JSON.stringify({ error: 'press release not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify(releasePayload(release), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
