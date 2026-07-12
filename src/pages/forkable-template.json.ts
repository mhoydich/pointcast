import type { APIRoute } from 'astro';
import { FAQ, PREREQUISITES, REFERENCES, TEMPLATE_META, TEMPLATE_NOTES, TEN_STEP_FORK, WHAT_NOT_TO_FORK, WHAT_TO_CUSTOMIZE, WHAT_TO_KEEP } from '../lib/forkableTemplate';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/forkable-template.json',
    name: TEMPLATE_META.title, subtitle: TEMPLATE_META.subtitle, thesis: TEMPLATE_META.thesis,
    paperNumber: TEMPLATE_META.paperNumber, audience: TEMPLATE_META.audience, date: TEMPLATE_META.date,
    prerequisites: PREREQUISITES,
    tenStepFork: TEN_STEP_FORK,
    whatToKeep: WHAT_TO_KEEP,
    whatToCustomize: WHAT_TO_CUSTOMIZE,
    whatNotToFork: WHAT_NOT_TO_FORK,
    faq: FAQ,
    notes: TEMPLATE_NOTES,
    references: REFERENCES,
    counts: { prerequisites: PREREQUISITES.length, steps: TEN_STEP_FORK.length, keep: WHAT_TO_KEEP.length, customize: WHAT_TO_CUSTOMIZE.length, dont: WHAT_NOT_TO_FORK.length, faq: FAQ.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/forkable-template',
    parent: 'https://pointcast.xyz/forkable-radius',
    related: { forkableRadius: 'https://pointcast.xyz/forkable-radius', coordinate: 'https://pointcast.xyz/coordinate', manhattanBeach: 'https://pointcast.xyz/manhattan-beach', hermosaBeach: 'https://pointcast.xyz/hermosa-beach', strandCorridor: 'https://pointcast.xyz/strand-corridor', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
