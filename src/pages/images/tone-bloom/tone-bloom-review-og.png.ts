import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { APIRoute } from 'astro';

export const prerender = true;

const cardPath = fileURLToPath(
  new URL('../../../public/images/tone-bloom/tone-bloom-review-og.png', import.meta.url),
);

export const GET: APIRoute = () =>
  new Response(readFileSync(cardPath), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
