import type { APIRoute } from 'astro';
import { LANE_META, NEXT_MODELS, NEXT_MODELS_SUMMARY, RESEARCH_AS_OF } from '../lib/next-models';

export const prerender = true;

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    id: 'pointcast:next-models:2026-08-31',
    title: NEXT_MODELS_SUMMARY.title,
    description: NEXT_MODELS_SUMMARY.description,
    site: 'https://pointcast.xyz',
    humanUrl: 'https://pointcast.xyz/next-models',
    self: 'https://pointcast.xyz/next-models.json',
    researchAsOf: RESEARCH_AS_OF,
    generatedAt: new Date().toISOString(),
    modelCount: NEXT_MODELS.length,
    vocabulary: {
      lane: Object.fromEntries(Object.entries(LANE_META).map(([id, lane]) => [id, lane.label])),
      releaseState: {
        upcoming: 'Officially acknowledged but not publicly released.',
        controlled: 'Released only to a limited or vetted audience.',
        available: 'Available through at least one first-party product or API.',
        'open-weights': 'Model weights are downloadable; inspect each model license before use.',
      },
    },
    editorialPolicy: {
      primarySourcesFirst: true,
      vendorBenchmarksAreVendorClaims: true,
      rumorsExcluded: true,
      terminology: 'Open-weight is used unless a release includes enough of the full training stack to support a stronger open-source claim.',
    },
    thesis: NEXT_MODELS_SUMMARY.thesis,
    lanes: Object.entries(LANE_META).map(([id, lane]) => ({
      id,
      ...lane,
      modelIds: NEXT_MODELS.filter((model) => model.lane === id).map((model) => model.id),
    })),
    models: NEXT_MODELS,
    agentNotes: [
      'Prefer model.id as the stable key; names and product packaging may change.',
      'Before production use, re-check the linked primary source for access, license, pricing and model identifiers.',
      'Do not infer unreleased Astra specifications from this packet. Missing fields are intentionally unknown.',
      'For hosted video systems, confirm which first-party model variant a provider endpoint actually serves.',
    ],
    related: {
      currentStack: 'https://pointcast.xyz/ai-stack.json',
      agentManifest: 'https://pointcast.xyz/agents.json',
      humanAgentGuide: 'https://pointcast.xyz/for-agents',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
