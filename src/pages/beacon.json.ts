/**
 * /beacon.json — the 25-mile radius structured.
 */
import type { APIRoute } from 'astro';

const NEARBY = [
  { name: 'El Segundo',      distance: 0,  bearing: '·',  status: 'seed',     population: 17000 },
  { name: 'Manhattan Beach', distance: 3,  bearing: 'S',  status: 'target',   population: 35000 },
  { name: 'Playa del Rey',   distance: 3,  bearing: 'N',  status: 'target',   population: 12000 },
  { name: 'Westchester',     distance: 4,  bearing: 'N',  status: 'target',   population: 45000 },
  { name: 'Hawthorne',       distance: 4,  bearing: 'E',  status: 'adjacent', population: 88000 },
  { name: 'Hermosa Beach',   distance: 5,  bearing: 'S',  status: 'target',   population: 19000 },
  { name: 'Mar Vista',       distance: 6,  bearing: 'N',  status: 'target',   population: 38000 },
  { name: 'Venice',          distance: 6,  bearing: 'N',  status: 'target',   population: 40000 },
  { name: 'Redondo Beach',   distance: 7,  bearing: 'S',  status: 'target',   population: 71000 },
  { name: 'Torrance',        distance: 7,  bearing: 'SE', status: 'target',   population: 145000 },
  { name: 'Culver City',     distance: 7,  bearing: 'NE', status: 'adjacent', population: 40000 },
  { name: 'Inglewood',       distance: 7,  bearing: 'NE', status: 'target',   population: 108000 },
  { name: 'Gardena',         distance: 8,  bearing: 'SE', status: 'seed',     population: 61000 },
  { name: 'Santa Monica',    distance: 10, bearing: 'N',  status: 'adjacent', population: 91000 },
  { name: 'Palos Verdes',    distance: 10, bearing: 'S',  status: 'adjacent', population: 41000 },
  { name: 'Compton',         distance: 11, bearing: 'E',  status: 'target',   population: 95000 },
  { name: 'Lomita',          distance: 11, bearing: 'SE', status: 'seed',     population: 20000 },
  { name: 'Downtown LA',     distance: 17, bearing: 'NE', status: 'adjacent', population: 85000 },
  { name: 'Long Beach',      distance: 20, bearing: 'SE', status: 'adjacent', population: 466000 },
];

export const GET: APIRoute = async () => {
  const totalPop = NEARBY.reduce((a, b) => a + b.population, 0);
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    anchor: {
      name: 'El Segundo, CA',
      lat: 33.919,
      lng: -118.416,
    },
    radiusMiles: 25,
    radiusMeters: 40233,
    coveragePopulation: totalPop,
    neighborhoods: NEARBY,
    programs: [
      { id: 'mesh',         reference: '/b/0240', status: 'proposed' },
      { id: 'third-spaces', reference: '/b/0242', status: 'proposed' },
      { id: 'dao-re',       reference: '/b/0241', status: 'vote-open · /dao/PC-0001' },
      { id: 'cross-prog',   reference: null,      status: 'emerging' },
    ],
    links: {
      human: 'https://pointcast.xyz/beacon',
      dao: 'https://pointcast.xyz/dao',
      narrative: 'https://pointcast.xyz/b/0244',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
