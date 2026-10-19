/**
 * /currency-builder/commons/notes/{front|back}/{slug}.svg — print-size
 * (150 × 75 mm at 2:1) SVG faces for each of the 40 Commons currencies.
 */
import type { APIRoute } from 'astro';
import { COMMONS, noteFrontSVG, noteBackSVG } from '../../../../../lib/currency-builder/commons.mjs';

export function getStaticPaths() {
  return COMMONS.currencies.flatMap((entry) => (['front', 'back'] as const).map((face) => ({
    params: { face, slug: entry.slug },
    props: { entry, face },
  })));
}

export const GET: APIRoute = ({ props }) => {
  const { entry, face } = props as { entry: (typeof COMMONS.currencies)[number]; face: 'front' | 'back' };
  const svg = face === 'front' ? noteFrontSVG(entry) : noteBackSVG(entry);
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
