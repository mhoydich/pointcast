import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { APIRoute } from 'astro';

export const prerender = true;

// Astro prerenders endpoint modules from dist/.prerender/chunks.
const videoPath = fileURLToPath(
  new URL('../../../public/images/qwen-weather/weather-memory.mp4', import.meta.url),
);

export const GET: APIRoute = () =>
  new Response(readFileSync(videoPath), {
    headers: {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
    },
  });
