import type { APIRoute } from 'astro';
import { COHORT_OFFERINGS, FOUR_FOODWAYS, FRAMING_POSITION, HONEST_CAUTIONS, NINETY_DAY_FOOD_PROTOCOL, PAPER_META, PAPER_NOTES, REFERENCES, SEASONAL_CYCLE, SEVEN_CORRIDOR_FOOD_PRINCIPLES, SOURCING, THE_COHORT_TABLE, THE_PLATE } from '../lib/foodPaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/food.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentSurface: PAPER_META.parentSurface, relatedSurfaces: PAPER_META.relatedSurfaces,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    framingPosition: FRAMING_POSITION,
    sevenCorridorFoodPrinciples: SEVEN_CORRIDOR_FOOD_PRINCIPLES,
    seasonalCycle: SEASONAL_CYCLE,
    fourFoodways: FOUR_FOODWAYS,
    thePlate: THE_PLATE,
    theCohortTable: THE_COHORT_TABLE,
    sourcing: SOURCING,
    ninetyDayFoodProtocol: NINETY_DAY_FOOD_PROTOCOL,
    cohortOfferings: COHORT_OFFERINGS,
    honestCautions: HONEST_CAUTIONS,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      principles: SEVEN_CORRIDOR_FOOD_PRINCIPLES.length,
      foodways: FOUR_FOODWAYS.length,
      plateProportions: THE_PLATE.proportions.length,
      ritualElements: THE_COHORT_TABLE.ritualElements.length,
      protocolFortnights: NINETY_DAY_FOOD_PROTOCOL.fortnightShifts.length,
      cohortOfferings: COHORT_OFFERINGS.length,
      cautionAreas: 6,
      references: REFERENCES.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/food',
    parent: 'https://pointcast.xyz/plant',
    related: { plant: 'https://pointcast.xyz/plant', practice: 'https://pointcast.xyz/practice', livingBody: 'https://pointcast.xyz/living-body', time: 'https://pointcast.xyz/time', marineLayer: 'https://pointcast.xyz/marine-layer', civicFederation: 'https://pointcast.xyz/civic-federation', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
