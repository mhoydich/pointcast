import type { APIRoute } from 'astro';
import { ACUPUNCTURE_PRINCIPAL_POINTS, CORRIDOR_PRACTICE, FRAMING_POSITION, PAPER_META, PAPER_NOTES, REFERENCES, SCIENTIFIC_HONESTY_FRAMEWORK, SEVEN_CHAKRAS, THREE_TRADITIONS, TWELVE_MERIDIANS } from '../lib/livingBodyPaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/living-body.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentSurface: PAPER_META.parentSurface, relatedSurfaces: PAPER_META.relatedSurfaces,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    framingPosition: FRAMING_POSITION,
    threeTraditions: THREE_TRADITIONS,
    twelveMeridians: TWELVE_MERIDIANS,
    sevenChakras: SEVEN_CHAKRAS,
    acupuncturePrincipalPoints: ACUPUNCTURE_PRINCIPAL_POINTS,
    corridorPractice: CORRIDOR_PRACTICE,
    scientificHonestyFramework: SCIENTIFIC_HONESTY_FRAMEWORK,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      traditions: THREE_TRADITIONS.length,
      meridians: TWELVE_MERIDIANS.length,
      chakras: SEVEN_CHAKRAS.length,
      acupuncturePoints: ACUPUNCTURE_PRINCIPAL_POINTS.length,
      cohortOfferings: CORRIDOR_PRACTICE.cohortOfferings.length,
      practitionerVettingCriteria: CORRIDOR_PRACTICE.practitionerNetwork.vettingCriteria.length,
      evidenceSupports: SCIENTIFIC_HONESTY_FRAMEWORK.whatTheEvidenceSupports.length,
      remainsContested: SCIENTIFIC_HONESTY_FRAMEWORK.whatRemainsContested.length,
      genuinelyUnknown: SCIENTIFIC_HONESTY_FRAMEWORK.whatIsGenuinelyUnknown.length,
      doesNotClaim: SCIENTIFIC_HONESTY_FRAMEWORK.whatTheFederationDoesNotClaim.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/living-body',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: { marineLayer: 'https://pointcast.xyz/marine-layer', bathHouse: 'https://pointcast.xyz/bath-house', time: 'https://pointcast.xyz/time', sabbatical: 'https://pointcast.xyz/sabbatical', federationCouncil: 'https://pointcast.xyz/federation-council', forkableRadius: 'https://pointcast.xyz/forkable-radius', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
