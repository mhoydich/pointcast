import type { APIRoute } from 'astro';
import {
  NOUNS_NATION_ROADMAP,
  aiToolingCurve,
  capitalGatesV2,
  ninetyDayMoves,
  roadmapGithubSignals,
  roadmapSources,
  threeYearRoadmap,
  venueLadder,
} from '../../lib/nouns-nation-roadmap';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify(
      {
        $schema: 'https://pointcast.xyz/for-agents',
        generatedAt: new Date().toISOString(),
        roadmap: NOUNS_NATION_ROADMAP,
        aiToolingCurve,
        threeYearRoadmap,
        venueLadder,
        capitalGates: capitalGatesV2,
        ninetyDayMoves,
        githubSignals: roadmapGithubSignals,
        sources: roadmapSources,
        disclaimer:
          'Strategic roadmap only. Not personalized financial advice, a public securities offering, or legal advice.',
      },
      null,
      2,
    ),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300',
        'access-control-allow-origin': '*',
      },
    },
  );
};
