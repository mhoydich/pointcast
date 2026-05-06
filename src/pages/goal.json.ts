import type { APIRoute } from 'astro';
import { GOAL_TYPE_LABELS, HORIZON_BANDS, MACHINE_LOOPS, MACHINE_META, MACHINE_NOTES, MACHINE_PRINCIPLES, SEED_GOALS } from '../lib/goalMachine';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/goal.json',
    name: MACHINE_META.title,
    subtitle: MACHINE_META.subtitle,
    tagline: MACHINE_META.tagline,
    thesis: MACHINE_META.thesis,
    authors: MACHINE_META.authors,
    principles: MACHINE_PRINCIPLES,
    goalTypes: GOAL_TYPE_LABELS,
    seedGoals: SEED_GOALS,
    machineLoops: MACHINE_LOOPS,
    horizonBands: HORIZON_BANDS,
    notes: MACHINE_NOTES,
    counts: {
      seedGoals: SEED_GOALS.length,
      principles: MACHINE_PRINCIPLES.length,
      loops: MACHINE_LOOPS.length,
      bands: HORIZON_BANDS.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/goal',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: {
      ues: 'https://pointcast.xyz/university-of-el-segundo',
      commons: 'https://pointcast.xyz/commons',
      marineLayer: 'https://pointcast.xyz/marine-layer',
      civicLayer: 'https://pointcast.xyz/civic-layer',
      commonForms: 'https://pointcast.xyz/common-forms',
    },
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
  });
};
