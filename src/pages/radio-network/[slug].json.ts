import type { APIRoute } from 'astro';
import { STATIONS, buildStationDetail } from '../../data/radio-network';

export function getStaticPaths() {
  return STATIONS.map((s) => ({ params: { slug: s.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  const body = buildStationDetail(String(params.slug))!;
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
