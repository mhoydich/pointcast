import type { APIRoute } from 'astro';
import { COHORT_OFFERINGS, COMMON_DISRUPTORS, ENVIRONMENT_AND_RITUAL, FRAMING_POSITION, HONEST_CAUTIONS, NINETY_DAY_PROTOCOL, PAPER_META, PAPER_NOTES, REFERENCES, SEVEN_SLEEP_PRINCIPLES, SLEEP_ARCHITECTURE } from '../lib/sleepPaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/sleep.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentSurface: PAPER_META.parentSurface, relatedSurfaces: PAPER_META.relatedSurfaces,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    framingPosition: FRAMING_POSITION,
    sleepArchitecture: SLEEP_ARCHITECTURE,
    sevenSleepPrinciples: SEVEN_SLEEP_PRINCIPLES,
    commonDisruptors: COMMON_DISRUPTORS,
    environmentAndRitual: ENVIRONMENT_AND_RITUAL,
    ninetyDayProtocol: NINETY_DAY_PROTOCOL,
    cohortOfferings: COHORT_OFFERINGS,
    honestCautions: HONEST_CAUTIONS,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      sleepStages: SLEEP_ARCHITECTURE.stages.length,
      principles: SEVEN_SLEEP_PRINCIPLES.length,
      disruptors: COMMON_DISRUPTORS.length,
      environmentElements: ENVIRONMENT_AND_RITUAL.bedroomEnvironment.length,
      ritualSteps: ENVIRONMENT_AND_RITUAL.preSleepRitual.length,
      protocolFortnights: NINETY_DAY_PROTOCOL.fortnightShifts.length,
      cohortOfferings: COHORT_OFFERINGS.length,
      cautionAreas: 7,
      references: REFERENCES.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/sleep',
    parent: 'https://pointcast.xyz/time',
    related: { time: 'https://pointcast.xyz/time', marineLayer: 'https://pointcast.xyz/marine-layer', food: 'https://pointcast.xyz/food', plant: 'https://pointcast.xyz/plant', practice: 'https://pointcast.xyz/practice', sabbatical: 'https://pointcast.xyz/sabbatical', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
