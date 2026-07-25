import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { APIRoute, GetStaticPaths } from 'astro';

export const prerender = true;

// PointCast intentionally builds with an empty Astro publicDir. Prerender the
// two review screenshots so their canonical image URLs survive that boundary.
const assetDirectory = fileURLToPath(
  new URL('../../../public/images/tone-bloom', import.meta.url),
);
const assets = [
  'tone-bloom-desktop.jpg',
  'tone-bloom-mobile-spark.jpg',
] as const;

export const getStaticPaths = (() =>
  assets.map((name) => ({
    params: { asset: name.slice(0, -4) },
    props: { name },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const name = String(props.name || '');
  if (!assets.includes(name as (typeof assets)[number])) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(readFileSync(join(assetDirectory, name)), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
