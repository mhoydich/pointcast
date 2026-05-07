import type { APIRoute } from 'astro';
import { ART_FUNDING_NOTES, ART_TIER_D_PRINCIPLES, ART_WORKS, GWA_META, GWA_NOTES, REFERENCES } from '../lib/giantWorksArt';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/giant-works-art.json',
    name: GWA_META.title, subtitle: GWA_META.subtitle, thesis: GWA_META.thesis,
    paperNumber: GWA_META.paperNumber, parentPaper: GWA_META.parentPaper, audience: GWA_META.audience, date: GWA_META.date,
    artTierDPrinciples: ART_TIER_D_PRINCIPLES,
    artWorks: ART_WORKS,
    artFundingNotes: ART_FUNDING_NOTES,
    notes: GWA_NOTES,
    references: REFERENCES,
    counts: {
      works: ART_WORKS.length,
      byCategory: {
        audio: ART_WORKS.filter((w) => w.category === 'audio').length,
        light: ART_WORKS.filter((w) => w.category === 'light').length,
        art: ART_WORKS.filter((w) => w.category === 'art').length,
      },
      principles: ART_TIER_D_PRINCIPLES.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/giant-works-art',
    parent: 'https://pointcast.xyz/giant-works',
    related: { giantWorks: 'https://pointcast.xyz/giant-works', strandCorridor: 'https://pointcast.xyz/strand-corridor', forkableRadius: 'https://pointcast.xyz/forkable-radius', corridorStrengths: 'https://pointcast.xyz/corridor-strengths', torrance: 'https://pointcast.xyz/torrance', stones: 'https://pointcast.xyz/stones', commons: 'https://pointcast.xyz/commons', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
