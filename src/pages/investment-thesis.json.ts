import type { APIRoute } from 'astro';
import {
  INVESTMENT_THESIS,
  capitalPlan,
  diligencePlan,
  githubSignals,
  returnPaths,
  risks,
  thesisPillars,
  thesisSources,
  whyNow,
} from '../lib/investment-thesis';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify(
      {
        $schema: 'https://pointcast.xyz/for-agents',
        generatedAt: new Date().toISOString(),
        thesis: INVESTMENT_THESIS,
        pillars: thesisPillars,
        whyNow,
        capitalPlan,
        returnPaths,
        githubSignals,
        risks,
        diligencePlan,
        sources: thesisSources,
        disclaimer:
          'Strategic investment memo only. Not personalized financial advice, a public securities offering, or legal advice.',
      },
      null,
      2,
    ),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    },
  );
};
