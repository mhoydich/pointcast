import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { APIRoute } from 'astro';

export const prerender = true;

const screenshotPath = fileURLToPath(
  new URL('../../../public/images/tone-bloom/tone-bloom-mobile-spark.jpg', import.meta.url),
);

export const GET: APIRoute = () =>
  new Response(readFileSync(screenshotPath), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
