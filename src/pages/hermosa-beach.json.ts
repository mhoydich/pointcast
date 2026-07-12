import type { APIRoute } from 'astro';
import { FIRST_NINETY_DAYS_PLAN, INHERITED_FROM_ES, INSTANCE_META, INSTANCE_NOTES, HB_SIX_SHAPES, HB_SNAPSHOT, HB_SPECIFIC_TERRAIN, REFERENCES, STRAND_CORRIDOR_POSITION } from '../lib/hermosaBeach';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/hermosa-beach.json',
    name: INSTANCE_META.title, subtitle: INSTANCE_META.subtitle, thesis: INSTANCE_META.thesis,
    paperNumber: INSTANCE_META.paperNumber, parentPaper: INSTANCE_META.parentPaper,
    authors: INSTANCE_META.authors, date: INSTANCE_META.date,
    snapshot: HB_SNAPSHOT, inheritedFromEs: INHERITED_FROM_ES, hbSpecificTerrain: HB_SPECIFIC_TERRAIN,
    sixShapes: HB_SIX_SHAPES, firstNinetyDaysPlan: FIRST_NINETY_DAYS_PLAN,
    strandCorridorPosition: STRAND_CORRIDOR_POSITION,
    references: REFERENCES, notes: INSTANCE_NOTES,
    counts: { inheritedItems: INHERITED_FROM_ES.length, terrainFeatures: HB_SPECIFIC_TERRAIN.length, shapes: HB_SIX_SHAPES.length, weeks: FIRST_NINETY_DAYS_PLAN.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/hermosa-beach', parent: 'https://pointcast.xyz/coordinate',
    related: { coordinate: 'https://pointcast.xyz/coordinate', forkableRadius: 'https://pointcast.xyz/forkable-radius', manhattanBeach: 'https://pointcast.xyz/manhattan-beach', commons: 'https://pointcast.xyz/commons', marineLayer: 'https://pointcast.xyz/marine-layer', commonForms: 'https://pointcast.xyz/common-forms', civicPersonalAgent: 'https://pointcast.xyz/civic-personal-agent', mutualAidMesh: 'https://pointcast.xyz/mutual-aid-mesh', civicTranslation: 'https://pointcast.xyz/civic-translation', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
