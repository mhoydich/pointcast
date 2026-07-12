import type { APIRoute } from 'astro';
import { FUNDING_PRINCIPLES, GIANT_WORKS, GW_META, GW_NOTES, REFERENCES, SCALING_PRINCIPLES, TIER_D_DEFINITION } from '../lib/giantWorks';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/giant-works.json',
    name: GW_META.title, subtitle: GW_META.subtitle, thesis: GW_META.thesis,
    paperNumber: GW_META.paperNumber, parentPaper: GW_META.parentPaper, audience: GW_META.audience, date: GW_META.date,
    tierDDefinition: TIER_D_DEFINITION,
    giantWorks: GIANT_WORKS,
    fundingPrinciples: FUNDING_PRINCIPLES,
    scalingPrinciples: SCALING_PRINCIPLES,
    notes: GW_NOTES,
    references: REFERENCES,
    counts: {
      works: GIANT_WORKS.length,
      byElement: {
        earth: GIANT_WORKS.filter((w) => w.element === 'earth').length,
        water: GIANT_WORKS.filter((w) => w.element === 'water').length,
        fire: GIANT_WORKS.filter((w) => w.element === 'fire').length,
        air: GIANT_WORKS.filter((w) => w.element === 'air').length,
        synthesis: GIANT_WORKS.filter((w) => w.element === 'synthesis').length,
      },
      fundingPrinciples: FUNDING_PRINCIPLES.length,
      scalingPrinciples: SCALING_PRINCIPLES.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/giant-works',
    parent: 'https://pointcast.xyz/strand-corridor',
    related: { strandCorridor: 'https://pointcast.xyz/strand-corridor', forkableRadius: 'https://pointcast.xyz/forkable-radius', commonForms: 'https://pointcast.xyz/common-forms', stones: 'https://pointcast.xyz/stones', marineLayer: 'https://pointcast.xyz/marine-layer', fire: 'https://pointcast.xyz/fire', geology: 'https://pointcast.xyz/geology', oceanWing: 'https://pointcast.xyz/ocean-wing', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
