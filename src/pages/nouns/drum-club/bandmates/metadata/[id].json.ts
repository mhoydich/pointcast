import type { APIRoute, GetStaticPaths } from 'astro';
import {
  NOUNS_DRUM_CLUB_BANDMATES,
  getNounsDrumClubBandmate,
  nounsDrumClubBandmateMetadata,
} from '../../../../../lib/nouns-drum-club-bandmates.ts';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () => NOUNS_DRUM_CLUB_BANDMATES.map((bandmate) => ({
  params: { id: String(bandmate.id) },
  props: { id: bandmate.id },
}));

export const GET: APIRoute<{ id: number }> = ({ props }) => {
  const bandmate = getNounsDrumClubBandmate(props.id);
  if (!bandmate) {
    return new Response(JSON.stringify({ error: 'bandmate-not-found', status: 'not-minted' }, null, 2), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    });
  }
  return new Response(JSON.stringify(nounsDrumClubBandmateMetadata(bandmate), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'X-PointCast-Collectible-Status': 'not-minted',
    },
  });
};
