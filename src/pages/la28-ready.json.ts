import type { APIRoute } from 'astro';
import { FEDERATION_POSITION, LA28_CONTEXT, LEGACY_CIRCLE_FUNDERS, PAPER_META, PAPER_NOTES, REFERENCES, TIER_D_AGAINST_LA28, TIMELINE } from '../lib/la28Paper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/la28-ready.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords, relatedSurfaces: PAPER_META.relatedSurfaces,
    la28Context: LA28_CONTEXT,
    legacyCircleFunders: LEGACY_CIRCLE_FUNDERS,
    tierDAgainstLa28: TIER_D_AGAINST_LA28,
    federationPosition: FEDERATION_POSITION,
    timeline: TIMELINE,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      funders: LEGACY_CIRCLE_FUNDERS.length,
      aligned: TIER_D_AGAINST_LA28.aligned.length,
      neutral: TIER_D_AGAINST_LA28.neutral.length,
      antiAligned: TIER_D_AGAINST_LA28.antiAligned.length,
      timelineMilestones: TIMELINE.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/la28-ready',
    parent: 'https://pointcast.xyz/giant-works',
    related: { giantWorks: 'https://pointcast.xyz/giant-works', giantWorksArt: 'https://pointcast.xyz/giant-works-art', strandCorridor: 'https://pointcast.xyz/strand-corridor', forkableRadius: 'https://pointcast.xyz/forkable-radius', coordinate: 'https://pointcast.xyz/coordinate', federationCouncil: 'https://pointcast.xyz/federation-council', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
