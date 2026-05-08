import type { APIRoute } from 'astro';
import { COLLECTIVE_TOOLS_SPECULATION, FOUR_TRANSITIONS, MIST_PRECEDENT, PAPER_META, PAPER_NOTES, PERMISSIONING_RECOMMENDATIONS, REFERENCES, RESEARCH_FRAMEWORK, THE_CASE_STUDY } from '../lib/p2pAiPaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/p2p-ai.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentSurface: PAPER_META.parentSurface, relatedSurfaces: PAPER_META.relatedSurfaces,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    caseStudy: THE_CASE_STUDY,
    fourTransitions: FOUR_TRANSITIONS,
    mistPrecedent: MIST_PRECEDENT,
    researchFramework: RESEARCH_FRAMEWORK,
    collectiveToolsSpeculation: COLLECTIVE_TOOLS_SPECULATION,
    permissioningRecommendations: PERMISSIONING_RECOMMENDATIONS,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      surfacesConnected: THE_CASE_STUDY.surfacesConnected.length,
      transitions: FOUR_TRANSITIONS.length,
      mistRight: MIST_PRECEDENT.whatItGotRight.length,
      mistWrong: MIST_PRECEDENT.whatItGotWrong.length,
      mistLessons: MIST_PRECEDENT.whatTheAiClientEmergenceCanLearn.length,
      cohortWeeks: RESEARCH_FRAMEWORK.weeklyCadence.length,
      collectiveTools: COLLECTIVE_TOOLS_SPECULATION.length,
      permissioningRecs: PERMISSIONING_RECOMMENDATIONS.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/p2p-ai',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: { ethLegacy: 'https://pointcast.xyz/eth-legacy', pointcastConnectors: 'https://pointcast.xyz/pointcast-connectors', federationCouncil: 'https://pointcast.xyz/federation-council', forkableRadius: 'https://pointcast.xyz/forkable-radius', marineLayer: 'https://pointcast.xyz/marine-layer', commons: 'https://pointcast.xyz/commons', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
