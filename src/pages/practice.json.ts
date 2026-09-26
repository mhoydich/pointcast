import type { APIRoute } from 'astro';
import { ACUPRESSURE_PROTOCOLS, BREATH_PRACTICES, COHORT_OFFERINGS_EXTENDED, DAILY_PRACTICE_ATLAS, EIGHT_WEEK_BEGINNER_LADDER, FOUNDATIONAL_PRINCIPLES, MOVEMENT_PRACTICES, PAPER_META, PAPER_NOTES, REFERENCES, STILLNESS_PRACTICES, TEACHER_REFERENCES } from '../lib/practicePaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/practice.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentPaper: PAPER_META.parentPaper, relatedSurfaces: PAPER_META.relatedSurfaces,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    foundationalPrinciples: FOUNDATIONAL_PRINCIPLES,
    dailyPracticeAtlas: DAILY_PRACTICE_ATLAS,
    movementPractices: MOVEMENT_PRACTICES,
    stillnessPractices: STILLNESS_PRACTICES,
    breathPractices: BREATH_PRACTICES,
    acupressureProtocols: ACUPRESSURE_PROTOCOLS,
    eightWeekBeginnerLadder: EIGHT_WEEK_BEGINNER_LADDER,
    cohortOfferingsExtended: COHORT_OFFERINGS_EXTENDED,
    teacherReferences: TEACHER_REFERENCES,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      principles: FOUNDATIONAL_PRINCIPLES.length,
      atlasMorning: DAILY_PRACTICE_ATLAS.morning.length,
      atlasMidday: DAILY_PRACTICE_ATLAS.midday.length,
      atlasAfternoon: DAILY_PRACTICE_ATLAS.afternoon.length,
      atlasEvening: DAILY_PRACTICE_ATLAS.evening.length,
      atlasWeekly: DAILY_PRACTICE_ATLAS.weekly.length,
      movementPractices: MOVEMENT_PRACTICES.length,
      stillnessPractices: STILLNESS_PRACTICES.length,
      breathPractices: BREATH_PRACTICES.length,
      acupressurePoints: ACUPRESSURE_PROTOCOLS.length,
      ladderWeeks: EIGHT_WEEK_BEGINNER_LADDER.length,
      cohortOfferings: COHORT_OFFERINGS_EXTENDED.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/practice',
    parent: 'https://pointcast.xyz/living-body',
    related: { livingBody: 'https://pointcast.xyz/living-body', marineLayer: 'https://pointcast.xyz/marine-layer', bathHouse: 'https://pointcast.xyz/bath-house', time: 'https://pointcast.xyz/time', sabbatical: 'https://pointcast.xyz/sabbatical', civicFederation: 'https://pointcast.xyz/civic-federation', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
