import type { APIRoute } from 'astro';
import {
  POINTCAST_2029,
  POINTCAST_2029_IDENTITIES,
} from '../../lib/pointcast-2029';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...POINTCAST_2029,
  methodology: {
    rankingBasis:
      'School order follows PointCast 25 preseason Board 000. This edition redesigns the board; it does not predict institutional adoption.',
    identityBasis:
      'Each original abstract mark begins with a published local-resource field from the adjacent Saturday Myth Machine atlas, then moves through PointCast editorial interpretation.',
    stadiumBasis:
      'Speculative civic-infrastructure concepts, not architectural proposals, feasibility studies, approvals, budgets, or announced projects.',
    gearBasis:
      'Speculative material and participation direction, not licensed merchandise or products for sale.',
    authorship:
      'Michael Hoydich directed the 2029 college-football expansion. Codex / OpenAI developed the first-edition identity systems, original generated plates, editorial copy, data structure, and PointCast implementation.',
  },
  identities: POINTCAST_2029_IDENTITIES,
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
