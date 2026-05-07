import type { APIRoute } from 'astro';
import { CORRIDOR_FACTS, CORRIDOR_META, CORRIDOR_NOTES, FEDERATION_COMMITMENTS, FOUR_CITY_SEGMENTS, NEXT_STEPS, REFERENCES, STRAND_PRINCIPLES, STRAND_RISKS } from '../lib/strandCorridor';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/strand-corridor.json',
    name: CORRIDOR_META.title, subtitle: CORRIDOR_META.subtitle, thesis: CORRIDOR_META.thesis,
    paperNumber: CORRIDOR_META.paperNumber, parents: CORRIDOR_META.parents, date: CORRIDOR_META.date,
    corridorFacts: CORRIDOR_FACTS,
    fourCitySegments: FOUR_CITY_SEGMENTS,
    federationCommitments: FEDERATION_COMMITMENTS,
    principles: STRAND_PRINCIPLES,
    risks: STRAND_RISKS,
    nextSteps: NEXT_STEPS,
    notes: CORRIDOR_NOTES,
    references: REFERENCES,
    counts: { segments: FOUR_CITY_SEGMENTS.length, commitments: FEDERATION_COMMITMENTS.length, principles: STRAND_PRINCIPLES.length, risks: STRAND_RISKS.length, steps: NEXT_STEPS.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/strand-corridor',
    parent: 'https://pointcast.xyz/forkable-radius',
    related: { coordinate: 'https://pointcast.xyz/coordinate', forkableRadius: 'https://pointcast.xyz/forkable-radius', manhattanBeach: 'https://pointcast.xyz/manhattan-beach', hermosaBeach: 'https://pointcast.xyz/hermosa-beach', mutualAidMesh: 'https://pointcast.xyz/mutual-aid-mesh', commonForms: 'https://pointcast.xyz/common-forms', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
