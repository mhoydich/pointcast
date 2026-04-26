/**
 * /froggos.json - machine-readable mirror of /froggos.
 */
import type { APIRoute } from 'astro';
import { fetchFroggosData } from '../lib/froggos';

export const GET: APIRoute = async () => {
  const market = await fetchFroggosData();
  const payload = {
    $schema: 'https://pointcast.xyz/froggos.json',
    name: 'PointCast Froggos',
    description:
      'Hosted front door for the Froggos objkt collection. Sales route to objkt; PointCast provides HTML, schema.org markup, and this JSON mirror.',
    home: 'https://pointcast.xyz/froggos',
    generatedAt: new Date().toISOString(),
    market,
    hostAndSell: [
      {
        step: 'host',
        description: 'PointCast hosts the canonical landing page, OG metadata, schema.org offers, and JSON mirror.',
      },
      {
        step: 'sell',
        description: 'Listings and checkout stay on objkt, where wallet signing, royalties, and settlement already live.',
      },
      {
        step: 'upgrade',
        description:
          'PointCast can later reuse its Beacon/Taquito collect flow to fulfill objkt asks directly on-site after an explicit product decision.',
      },
    ],
    related: [
      { label: 'objkt collection', url: 'https://objkt.com/collections/froggos' },
      { label: 'Froggos site', url: 'https://www.froggos.xyz' },
      { label: 'TzKT contract', url: `https://tzkt.io/${market.collection.contract}/tokens` },
      { label: 'PointCast collection', url: 'https://pointcast.xyz/collection' },
    ],
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
