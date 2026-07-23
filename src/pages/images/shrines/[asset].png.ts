import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { APIRoute, GetStaticPaths } from 'astro';

export const prerender = true;

const SHRINE_IMAGE_ASSETS = [
  'block-shrine-bg',
  'campaign-shrine-bg',
  'element-balance-shrine-bg',
  'element-fire-shrine-bg',
  'element-nature-shrine-bg',
  'element-shrine-background-sheet',
  'element-stone-shrine-bg',
  'room-shrine-bg',
  'shrine-background-sheet',
  'system-shrine-bg',
] as const;

export const getStaticPaths = (() =>
  SHRINE_IMAGE_ASSETS.map((asset) => ({
    params: { asset },
    props: { asset },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const asset = String(props.asset || '');
  if (!SHRINE_IMAGE_ASSETS.includes(asset as (typeof SHRINE_IMAGE_ASSETS)[number])) {
    return new Response('Not found', { status: 404 });
  }

  // Astro prerenders endpoint modules from dist/.prerender/chunks.
  const imagePath = fileURLToPath(
    new URL(`../../../public/images/shrines/${asset}.png`, import.meta.url),
  );
  return new Response(readFileSync(imagePath), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
