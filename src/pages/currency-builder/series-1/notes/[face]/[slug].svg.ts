/**
 * /currency-builder/series-1/notes/{front|back}/{slug}.svg — print-size
 * (150 × 75 mm at 2:1) SVG faces for the three Nouns Money Series 1 notes.
 */
import type { APIRoute } from 'astro';
import { SERIES_ONE, noteFrontSVG, noteBackSVG } from '../../../../../lib/currency-builder/series-one.mjs';

export function getStaticPaths() {
  return SERIES_ONE.notes.flatMap((entry) => (['front', 'back'] as const).map((face) => ({
    params: { face, slug: entry.slug },
    props: { entry, face },
  })));
}

export const GET: APIRoute = ({ props }) => {
  const { entry, face } = props as { entry: (typeof SERIES_ONE.notes)[number]; face: 'front' | 'back' };
  const svg = face === 'front' ? noteFrontSVG(entry) : noteBackSVG(entry);
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
};
