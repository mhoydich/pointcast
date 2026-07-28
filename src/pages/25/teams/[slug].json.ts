import type { APIRoute } from 'astro';
import { POINTCAST_25 } from '../../../lib/pointcast-25';
import {
  POINTCAST_25_REFERENCE,
  POINTCAST_25_TEAMS,
} from '../../../lib/pointcast-25-audience';

export function getStaticPaths() {
  return POINTCAST_25_TEAMS.map((team) => ({
    params: { slug: team.slug },
    props: { team },
  }));
}

export const GET: APIRoute = ({ props }) => {
  const team = props.team as (typeof POINTCAST_25_TEAMS)[number];
  return new Response(JSON.stringify({
    spec: 'pointcast.25-team-receipt/v1',
    season: POINTCAST_25.season,
    board: POINTCAST_25.board,
    status: POINTCAST_25.status,
    canonical: `https://pointcast.xyz/25/teams/${team.slug}`,
    machineEdition: `https://pointcast.xyz/25/teams/${team.slug}.json`,
    team,
    reference: POINTCAST_25_REFERENCE,
    receiptBook: 'https://pointcast.xyz/25/receipts.json',
    completeBoard: 'https://pointcast.xyz/25.json',
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
