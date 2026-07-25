/**
 * /constellation.json — the register of satellites, machine-readable.
 *
 * PointCast's summer 2026 problem: a dozen live sibling sites shipped and
 * the machine layer never heard about any of them. This endpoint is the
 * fix — a curated roll of every satellite in the practice, with verified
 * URLs, Tezos contracts where a chain backs the site, and the
 * house/network model the network is steering toward. Curation lives in
 * src/data/constellation.json; this route serves it with open CORS.
 */
import type { APIRoute } from 'astro';
import register from '../data/constellation.json';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...register,
        generatedAt: new Date().toISOString(),
        count: register.satellites.length,
        human: 'https://pointcast.xyz/constellation',
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
