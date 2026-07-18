/**
 * /everything.json — machine twin of /everything, the full-town census.
 *
 * Every door on one endpoint: rooms, district doors, dynamic routes,
 * machine feeds. Built from the filesystem at deploy time (src/lib/
 * everything.ts), so an agent reading this sees exactly what shipped.
 */
import type { APIRoute } from 'astro';
import {
  DOORS,
  ROOMS,
  DISTRICT_DOORS,
  DYNAMIC_DOORS,
  MACHINE_DOORS,
  BLOCK_COUNT,
} from '../lib/everything';

export const GET: APIRoute = () => {
  const payload = {
    $schema: 'https://pointcast.xyz/everything.json',
    name: 'PointCast census',
    law: 'if it shipped, it is listed',
    generatedAt: new Date().toISOString(),
    counts: {
      total: DOORS.length,
      rooms: ROOMS.length,
      districtDoors: DISTRICT_DOORS.length,
      dynamicDoors: DYNAMIC_DOORS.length,
      machineDoors: MACHINE_DOORS.length,
      blocks: BLOCK_COUNT,
    },
    otherIndexes: ['/explore', '/explore.json', '/town', '/rooms', '/atlas', '/archive', '/timeline', '/attic'],
    doors: DOORS.map((d) => ({
      route: d.route,
      url: `https://pointcast.xyz${d.route.replace(/\{[^}]+\}.*/, '')}`,
      kind: d.kind,
      title: d.title,
      description: d.description || undefined,
      district: d.district || undefined,
      count: d.count,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
