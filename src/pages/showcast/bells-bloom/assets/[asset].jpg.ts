import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { APIRoute, GetStaticPaths } from 'astro';

export const prerender = true;

// Astro prerenders endpoint modules from dist/.prerender/chunks.
const assetDirectory = fileURLToPath(
  new URL('../../../public/showcast/bells-bloom/assets', import.meta.url),
);
const assets = readdirSync(assetDirectory)
  .filter((name) => /^\d{2}-[a-z0-9-]+\.jpg$/.test(name))
  .sort();

export const getStaticPaths = (() =>
  assets.map((name) => ({
    params: { asset: name.slice(0, -4) },
    props: { name },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const name = String(props.name || '');
  if (!assets.includes(name)) return new Response('Not found', { status: 404 });

  return new Response(readFileSync(join(assetDirectory, name)), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
