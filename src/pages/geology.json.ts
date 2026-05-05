import type { APIRoute } from 'astro';
import { LOCAL_AREA_RADIUS } from '../lib/localAreas';
import {
  CITATIONS, DEEP_TIME, FIELD_WALKS, GEOLOGICAL_SCALES, GEOLOGY_LIFE,
  GEOLOGY_PRACTICES, GEOLOGY_PRINCIPLES, GLOSSARY, LOCAL_STRATIGRAPHY,
  NEWPORT_INGLEWOOD, STONES,
} from '../lib/geology';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/geology.json',
    name: 'Geology — UES Track 08',
    description: 'The ground beneath the marine layer. Stratigraphic column for the 25-mile radius, the Newport-Inglewood Fault, three scales of time, twelve stones paired to Nouns, four field walks, three practices, glossary, and citations.',
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/geology',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    radius: LOCAL_AREA_RADIUS,
    principles: GEOLOGY_PRINCIPLES,
    localStratigraphy: LOCAL_STRATIGRAPHY,
    fault: NEWPORT_INGLEWOOD,
    scales: GEOLOGICAL_SCALES,
    deepTime: DEEP_TIME,
    stones: STONES.map((s) => ({ ...s, nounArt: `https://noun.pics/${s.nounSeed}.svg` })),
    geologyCoupledLife: GEOLOGY_LIFE,
    fieldWalks: FIELD_WALKS,
    practices: GEOLOGY_PRACTICES,
    glossary: GLOSSARY,
    citations: CITATIONS,
    related: {
      marineLayer: 'https://pointcast.xyz/marine-layer',
      commons: 'https://pointcast.xyz/commons',
      civicLayer: 'https://pointcast.xyz/civic-layer',
      ues: 'https://pointcast.xyz/university-of-el-segundo',
    },
    nounsAttribution: 'Nouns artwork at noun.pics is CC0. Seeds 0-1199 match the original Nouns FA2 supply.',
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
  });
};
