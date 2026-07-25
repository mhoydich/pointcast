import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { APIRoute } from 'astro';

export const prerender = true;

// Astro prerenders endpoint modules from dist/.prerender/chunks.
const imagePath = fileURLToPath(
  new URL('../../../public/images/qwen-weather/weather-organism.jpg', import.meta.url),
);

export const GET: APIRoute = () =>
  new Response(readFileSync(imagePath), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
