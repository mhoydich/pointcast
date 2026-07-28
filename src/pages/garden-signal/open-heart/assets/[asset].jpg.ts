import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { APIRoute, GetStaticPaths } from 'astro';

export const prerender = true;

const names = ['door-01', 'door-02', 'door-03', 'door-04'] as const;
// Astro prerenders endpoint modules from dist/.prerender/chunks.
const assetRoot = new URL('../../../public/garden-signal/open-heart/', import.meta.url);

export const getStaticPaths: GetStaticPaths = () =>
  names.map((asset) => ({ params: { asset } }));

export const GET: APIRoute = ({ params }) => {
  if (!names.includes(params.asset as (typeof names)[number])) {
    return new Response('Not found', { status: 404 });
  }

  const path = fileURLToPath(new URL(`${params.asset}.jpg`, assetRoot));
  return new Response(readFileSync(path), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
