import type { APIRoute } from 'astro';
import { listPublicCollectors, type PublicCollector } from '../../lib/collect-public';

export async function getStaticPaths() {
  const collectors = await listPublicCollectors();
  return collectors.map((collector) => ({ params: { handle: collector.handle }, props: { collector } }));
}

export const GET: APIRoute = ({ props }) => {
  const collector = props.collector as PublicCollector;
  return new Response(JSON.stringify(collector, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
};

