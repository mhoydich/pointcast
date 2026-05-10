import type { APIRoute } from 'astro';
import { FOUR_CANONICAL_FORMS, HISTORICAL_PRECEDENTS, HOW_TO_FORK_A_FEDERATION, HOW_TO_RECOGNIZE_A_FEDERATION, PAPER_META, PAPER_NOTES, REFERENCES, STRUCTURAL_INNOVATIONS, THE_CIVIC_FEDERATION, THE_FOUNDING_DECLARATION, TWENTY_FIRST_CENTURY_PROBLEMS, WHAT_THIS_PAPER_DOES_NOT_CLAIM } from '../lib/civicFederationPaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/civic-federation.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentSurface: PAPER_META.parentSurface, relatedSurfaces: PAPER_META.relatedSurfaces, classification: PAPER_META.classification,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    foundingDeclaration: THE_FOUNDING_DECLARATION,
    fourCanonicalForms: FOUR_CANONICAL_FORMS,
    theCivicFederation: THE_CIVIC_FEDERATION,
    historicalPrecedents: HISTORICAL_PRECEDENTS,
    structuralInnovations: STRUCTURAL_INNOVATIONS,
    twentyFirstCenturyProblems: TWENTY_FIRST_CENTURY_PROBLEMS,
    howToRecognizeAFederation: HOW_TO_RECOGNIZE_A_FEDERATION,
    howToForkAFederation: HOW_TO_FORK_A_FEDERATION,
    whatThisPaperDoesNotClaim: WHAT_THIS_PAPER_DOES_NOT_CLAIM,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      propositions: THE_FOUNDING_DECLARATION.fivePropositions.length,
      canonicalForms: FOUR_CANONICAL_FORMS.length,
      historicalPrecedents: HISTORICAL_PRECEDENTS.length,
      structuralInnovations: STRUCTURAL_INNOVATIONS.length,
      coordinationProblems: TWENTY_FIRST_CENTURY_PROBLEMS.length,
      recognitionSigns: HOW_TO_RECOGNIZE_A_FEDERATION.length,
      forkSteps: HOW_TO_FORK_A_FEDERATION.length,
      doesNotClaim: WHAT_THIS_PAPER_DOES_NOT_CLAIM.length,
      references: REFERENCES.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/civic-federation',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: { forkableRadius: 'https://pointcast.xyz/forkable-radius', federationCouncil: 'https://pointcast.xyz/federation-council', forkableTemplate: 'https://pointcast.xyz/forkable-template', corridorStrengths: 'https://pointcast.xyz/corridor-strengths', giantWorks: 'https://pointcast.xyz/giant-works', marineLayer: 'https://pointcast.xyz/marine-layer', livingBody: 'https://pointcast.xyz/living-body', time: 'https://pointcast.xyz/time', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
