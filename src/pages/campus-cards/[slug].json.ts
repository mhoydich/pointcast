import type { APIRoute } from 'astro';
import { CAMPUS_CARD_LIST, cardPayload, type CampusCard } from '../../lib/campus-cards';

export function getStaticPaths() {
  return CAMPUS_CARD_LIST.map((card) => ({ params: { slug: card.slug }, props: { card } }));
}

export const GET: APIRoute = ({ props }) => new Response(JSON.stringify(cardPayload(props.card as CampusCard), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'Access-Control-Allow-Origin': '*' },
});
