import type { APIRoute } from 'astro';
import { CITIES, CS_META, CS_NOTES, FEDERATION_SHAPE, REFERENCES } from '../lib/corridorStrengths';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/corridor-strengths.json',
    name: CS_META.title, subtitle: CS_META.subtitle, thesis: CS_META.thesis,
    paperNumber: CS_META.paperNumber, parentPaper: CS_META.parentPaper, date: CS_META.date,
    cities: CITIES,
    federationShape: FEDERATION_SHAPE,
    notes: CS_NOTES,
    references: REFERENCES,
    counts: {
      total: CITIES.length,
      byStatus: {
        parent: CITIES.filter((c) => c.status === 'parent').length,
        scaffolded: CITIES.filter((c) => c.status === 'scaffolded').length,
        candidate: CITIES.filter((c) => c.status === 'candidate').length,
        edge: CITIES.filter((c) => c.status === 'edge').length,
        neighbor: CITIES.filter((c) => c.status === 'neighbor').length,
      },
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/corridor-strengths',
    parent: 'https://pointcast.xyz/strand-corridor',
    related: { strandCorridor: 'https://pointcast.xyz/strand-corridor', forkableRadius: 'https://pointcast.xyz/forkable-radius', coordinate: 'https://pointcast.xyz/coordinate', giantWorks: 'https://pointcast.xyz/giant-works', manhattanBeach: 'https://pointcast.xyz/manhattan-beach', hermosaBeach: 'https://pointcast.xyz/hermosa-beach', redondoBeach: 'https://pointcast.xyz/redondo-beach', torrance: 'https://pointcast.xyz/torrance', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
