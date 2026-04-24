/**
 * /taproom.json — machine-readable twin of /taproom. Curated SoCal
 * craft beer carry list. Refreshed from src/data/taproom.json at
 * build time.
 */
import type { APIRoute } from 'astro';
import taproomData from '../data/taproom.json';

export const GET: APIRoute = async () => {
  const d = taproomData as Record<string, unknown> & {
    breweries: Array<{ beers: unknown[] }>;
  };
  const totalBeers = (d.breweries || []).reduce((acc, b) => acc + (b.beers?.length ?? 0), 0);
  const payload = {
    $schema: 'https://pointcast.xyz/agents.json',
    name: 'PointCast Taproom',
    description:
      'Curated SoCal craft beer carry list. Hand-maintained — not scraped. Mike\u2019s selection: El Segundo Brewing, Monkish, Smog City, Sugar Monkey, Paperback, Almanac, Absolution, Three Weavers.',
    generatedAt: new Date().toISOString(),
    lastReviewed: d._lastReviewed,
    breweryCount: (d.breweries || []).length,
    totalBeers,
    breweries: d.breweries,
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
