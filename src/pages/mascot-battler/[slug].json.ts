import type { APIRoute } from 'astro';
import {
  MASCOT_ARENAS,
  MASCOT_BATTLER,
  MASCOT_CARDS,
  MASCOT_CLASSES,
} from '../../lib/mascot-battler';

export function getStaticPaths() {
  return MASCOT_CARDS.map((card) => ({
    params: { slug: card.slug },
    props: { card },
  }));
}

export const GET: APIRoute = ({ props }) => {
  const card = props.card as (typeof MASCOT_CARDS)[number];
  const mascotClass = MASCOT_CLASSES.find((entry) => entry.id === card.mascotClass);
  const favoredArenas = MASCOT_ARENAS.filter((arena) => arena.favored.includes(card.mascotClass));

  return new Response(JSON.stringify({
    spec: 'pointcast.mascot-field-card/v1',
    atlas: MASCOT_BATTLER.machineEdition,
    canonical: card.canonical,
    machineEdition: card.machineEdition,
    season: MASCOT_BATTLER.season,
    board: MASCOT_BATTLER.board,
    card,
    class: mascotClass,
    favoredArenas,
    boundary: MASCOT_BATTLER.boundary,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
