/**
 * /nature-yield.json - machine mirror of the Block 0331 value system.
 */
import type { APIRoute } from 'astro';
import {
  ANCHOR,
  NATIVE_PLANTING_PALETTE,
  PLANTING_VALUE_SYSTEM,
  PLANTING_YIELD_SITES,
} from '../lib/local';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/nature-yield.json',
    name: 'PointCast · Native Planting Value Yield',
    description:
      'A practical, non-financial value-yield system for turning Block 0331 into site plans, plant mixes, care loops, and measurable local habitat outcomes.',
    home: 'https://pointcast.xyz/nature#planting-yield',
    generatedAt: new Date().toISOString(),
    anchor: {
      name: ANCHOR.name,
      coords: ANCHOR.coords,
    },
    sourceBlock: {
      id: PLANTING_VALUE_SYSTEM.sourceBlock,
      url: `https://pointcast.xyz/b/${PLANTING_VALUE_SYSTEM.sourceBlock}`,
      jsonUrl: `https://pointcast.xyz/b/${PLANTING_VALUE_SYSTEM.sourceBlock}.json`,
    },
    yieldDefinition: PLANTING_VALUE_SYSTEM.yieldDefinition,
    operatingPrinciple: PLANTING_VALUE_SYSTEM.operatingPrinciple,
    metrics: PLANTING_VALUE_SYSTEM.metrics,
    operatingRules: PLANTING_VALUE_SYSTEM.operatingRules,
    phases: PLANTING_VALUE_SYSTEM.phases,
    palette: NATIVE_PLANTING_PALETTE,
    sitePlans: PLANTING_YIELD_SITES,
    outputContract: {
      chooseSitePlan: 'Pick one sitePlans.slug based on available space and maintenance tolerance.',
      selectMix: 'Use sitePlans.mix as starter counts; adapt down for shade, narrow paths, and container depth.',
      careLoop: 'Use phases plus sitePlans.nextMoves as the 90-day operating checklist.',
      reportBack:
        'Return site type, final plant mix, survival, bloom, water observations, and one photo or note to the PointCast local channel.',
    },
    links: {
      human: 'https://pointcast.xyz/nature#planting-yield',
      block: 'https://pointcast.xyz/b/0331',
      nature: 'https://pointcast.xyz/nature',
      localJson: 'https://pointcast.xyz/local.json',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
