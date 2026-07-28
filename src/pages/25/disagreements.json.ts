import type { APIRoute } from 'astro';
import { POINTCAST_25 } from '../../lib/pointcast-25';
import {
  POINTCAST_25_DISSENTS,
  POINTCAST_25_REFERENCE,
} from '../../lib/pointcast-25-audience';

export const GET: APIRoute = () => new Response(JSON.stringify({
  spec: 'pointcast.25-disagreement-index/v1',
  season: POINTCAST_25.season,
  board: POINTCAST_25.board,
  publishedAt: POINTCAST_25.publishedAt,
  canonical: 'https://pointcast.xyz/25/disagreements',
  machineEdition: 'https://pointcast.xyz/25/disagreements.json',
  question: 'Which five teams does PointCast believe in more than ESPN preseason FPI?',
  methodology:
    'The index compares PointCast Board 000 with the ESPN preseason FPI Top 25 as reported by College Football HQ on SI. It is a comparison between two differently framed rankings, not a claim of universal consensus.',
  reference: POINTCAST_25_REFERENCE,
  disagreements: POINTCAST_25_DISSENTS.map((team) => ({
    team: team.school,
    canonical: `https://pointcast.xyz/25/teams/${team.slug}`,
    pointcastRank: team.rank,
    referenceRank: team.referenceRank,
    pointcastDifference: team.rankDelta,
    stance: team.dissent,
    reason: team.reason,
    doubt: team.doubt,
    nextProof: team.proof,
  })),
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
