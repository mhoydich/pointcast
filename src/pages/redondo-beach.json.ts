import type { APIRoute } from 'astro';
import { CORRIDOR_SOUTH_ANCHOR, FIRST_NINETY_DAYS_PLAN, INHERITED_FROM_ES, INSTANCE_META, INSTANCE_NOTES, RB_SIX_SHAPES, RB_SNAPSHOT, RB_SPECIFIC_TERRAIN, REFERENCES } from '../lib/redondoBeach';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/redondo-beach.json',
    name: INSTANCE_META.title, subtitle: INSTANCE_META.subtitle, thesis: INSTANCE_META.thesis,
    paperNumber: INSTANCE_META.paperNumber, parentPaper: INSTANCE_META.parentPaper,
    authors: INSTANCE_META.authors, date: INSTANCE_META.date,
    snapshot: RB_SNAPSHOT, inheritedFromEs: INHERITED_FROM_ES, rbSpecificTerrain: RB_SPECIFIC_TERRAIN,
    sixShapes: RB_SIX_SHAPES, firstNinetyDaysPlan: FIRST_NINETY_DAYS_PLAN,
    corridorSouthAnchor: CORRIDOR_SOUTH_ANCHOR,
    references: REFERENCES, notes: INSTANCE_NOTES,
    counts: { inheritedItems: INHERITED_FROM_ES.length, terrainFeatures: RB_SPECIFIC_TERRAIN.length, shapes: RB_SIX_SHAPES.length, weeks: FIRST_NINETY_DAYS_PLAN.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/redondo-beach', parent: 'https://pointcast.xyz/strand-corridor',
    related: { coordinate: 'https://pointcast.xyz/coordinate', forkableRadius: 'https://pointcast.xyz/forkable-radius', strandCorridor: 'https://pointcast.xyz/strand-corridor', manhattanBeach: 'https://pointcast.xyz/manhattan-beach', hermosaBeach: 'https://pointcast.xyz/hermosa-beach', forkableTemplate: 'https://pointcast.xyz/forkable-template', commons: 'https://pointcast.xyz/commons', marineLayer: 'https://pointcast.xyz/marine-layer', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
