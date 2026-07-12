import type { APIRoute } from 'astro';
import { FIRST_NINETY_DAYS_PLAN, INHERITED_FROM_ES, INLAND_DEPTH_POSITION, INSTANCE_META, INSTANCE_NOTES, REFERENCES, TR_SIX_SHAPES, TR_SNAPSHOT, TR_SPECIFIC_TERRAIN } from '../lib/torrance';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/torrance.json',
    name: INSTANCE_META.title, subtitle: INSTANCE_META.subtitle, thesis: INSTANCE_META.thesis,
    paperNumber: INSTANCE_META.paperNumber, parentPaper: INSTANCE_META.parentPaper,
    authors: INSTANCE_META.authors, date: INSTANCE_META.date,
    snapshot: TR_SNAPSHOT, inheritedFromEs: INHERITED_FROM_ES, trSpecificTerrain: TR_SPECIFIC_TERRAIN,
    sixShapes: TR_SIX_SHAPES, firstNinetyDaysPlan: FIRST_NINETY_DAYS_PLAN,
    inlandDepthPosition: INLAND_DEPTH_POSITION,
    references: REFERENCES, notes: INSTANCE_NOTES,
    counts: { inheritedItems: INHERITED_FROM_ES.length, terrainFeatures: TR_SPECIFIC_TERRAIN.length, shapes: TR_SIX_SHAPES.length, weeks: FIRST_NINETY_DAYS_PLAN.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/torrance', parent: 'https://pointcast.xyz/strand-corridor',
    related: { coordinate: 'https://pointcast.xyz/coordinate', forkableRadius: 'https://pointcast.xyz/forkable-radius', strandCorridor: 'https://pointcast.xyz/strand-corridor', corridorStrengths: 'https://pointcast.xyz/corridor-strengths', giantWorks: 'https://pointcast.xyz/giant-works', manhattanBeach: 'https://pointcast.xyz/manhattan-beach', hermosaBeach: 'https://pointcast.xyz/hermosa-beach', redondoBeach: 'https://pointcast.xyz/redondo-beach', forkableTemplate: 'https://pointcast.xyz/forkable-template', commons: 'https://pointcast.xyz/commons', marineLayer: 'https://pointcast.xyz/marine-layer', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
