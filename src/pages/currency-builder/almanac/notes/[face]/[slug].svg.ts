/**
 * /currency-builder/almanac/notes/{front|back}/{slug}.svg — print-size
 * (150 × 75 mm at 2:1) SVG faces for each of the 52 Almanac weeks.
 */
import type { APIRoute } from 'astro';
import { ALMANAC, noteFrontSVG, noteBackSVG } from '../../../../../lib/currency-builder/almanac.mjs';

export function getStaticPaths() {
  return ALMANAC.currencies.flatMap((entry) => (['front', 'back'] as const).map((face) => ({
    params: { face, slug: entry.slug },
    props: { entry, face },
  })));
}

export const GET: APIRoute = ({ props }) => {
  const { entry, face } = props as { entry: (typeof ALMANAC.currencies)[number]; face: 'front' | 'back' };
  const svg = face === 'front' ? noteFrontSVG(entry) : noteBackSVG(entry);
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
