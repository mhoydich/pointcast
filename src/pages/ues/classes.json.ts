import type { APIRoute } from 'astro';
import { ONLINE_SEASON_ONE, UES_SEASON_ONE_BUDGET, UES_SEASON_ONE_COURSES } from '../../lib/ues-classes';
import { ONLINE_SEASON_ZERO, UES_COURSES } from '../../lib/ues-program';

export const GET: APIRoute = () => {
  const body = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    name: 'University of El Segundo Online Class Catalog',
    human: 'https://pointcast.xyz/ues',
    current: {
      term: ONLINE_SEASON_ONE,
      courses: UES_SEASON_ONE_COURSES,
      budget: UES_SEASON_ONE_BUDGET,
    },
    foundations: {
      term: ONLINE_SEASON_ZERO,
      courses: UES_COURSES,
    },
    previousCurriculum: [{ code: 'UES-05', title: 'The Rebuildable Town', path: '/ues/track-05', status: 'historical' }],
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
