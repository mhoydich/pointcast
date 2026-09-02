import type { APIRoute } from 'astro';
import { KENNEL_CLUB, sittingPayload } from '../../lib/kennel-club';

export function getStaticPaths() {
  return KENNEL_CLUB.sittings.map((sitting) => ({ params: { slug: sitting.slug }, props: { sitting } }));
}

export const GET: APIRoute = ({ props }) => new Response(JSON.stringify(sittingPayload(props.sitting as (typeof KENNEL_CLUB.sittings)[number]), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'Access-Control-Allow-Origin': '*' },
});
