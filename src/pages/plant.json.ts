import type { APIRoute } from 'astro';
import { ADAPTOGEN_VS_NOOTROPIC, ADVANCED_TIER, HONEST_CAUTIONS_SECTION, INTERMEDIATE_TIER, NINETY_DAY_PROTOCOL, PAPER_META, PAPER_NOTES, PLANT_YEAR_COHORT, REFERENCES, SOURCING_PRINCIPLES, STARTER_TIER, THE_FRAMING } from '../lib/plantPaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/plant.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentSurface: PAPER_META.parentSurface, relatedSurfaces: PAPER_META.relatedSurfaces,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    framing: THE_FRAMING,
    adaptogenVsNootropic: ADAPTOGEN_VS_NOOTROPIC,
    starterTier: STARTER_TIER,
    intermediateTier: INTERMEDIATE_TIER,
    advancedTier: ADVANCED_TIER,
    sourcingPrinciples: SOURCING_PRINCIPLES,
    ninetyDayProtocol: NINETY_DAY_PROTOCOL,
    plantYearCohort: PLANT_YEAR_COHORT,
    honestCautions: HONEST_CAUTIONS_SECTION,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      starterPlants: STARTER_TIER.length,
      intermediatePlants: INTERMEDIATE_TIER.length,
      advancedPlants: ADVANCED_TIER.length,
      totalPlants: STARTER_TIER.length + INTERMEDIATE_TIER.length + ADVANCED_TIER.length,
      sourcingPrinciples: SOURCING_PRINCIPLES.length,
      protocolWeeks: NINETY_DAY_PROTOCOL.weekByWeek.length,
      cautionAreas: 7,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/plant',
    parent: 'https://pointcast.xyz/practice',
    related: { livingBody: 'https://pointcast.xyz/living-body', practice: 'https://pointcast.xyz/practice', time: 'https://pointcast.xyz/time', marineLayer: 'https://pointcast.xyz/marine-layer', civicFederation: 'https://pointcast.xyz/civic-federation', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
