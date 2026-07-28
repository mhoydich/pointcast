import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { APIRoute } from 'astro';

export const prerender = true;

const briefPath = fileURLToPath(
  // Astro prerenders endpoint modules from dist/.prerender/chunks.
  new URL('../../../src/assets/downloads/my-pet-has-retained-counsel-brief.pdf', import.meta.url),
);

export const GET: APIRoute = () =>
  new Response(readFileSync(briefPath), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="my-pet-has-retained-counsel-brief.pdf"',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
