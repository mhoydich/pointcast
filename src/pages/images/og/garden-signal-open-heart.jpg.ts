import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { APIRoute } from 'astro';
import sharp from 'sharp';

export const prerender = true;

const sourcePath = fileURLToPath(
  new URL('../../../public/garden-signal/open-heart/door-03.jpg', import.meta.url),
);

export const GET: APIRoute = async () => {
  const image = await sharp(readFileSync(sourcePath))
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();

  return new Response(image, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
