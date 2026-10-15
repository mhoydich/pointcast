/**
 * /currency-builder/barter/notes/{front|back}/{slug}.svg — 150 × 75 mm print
 * faces for each of the 100 Global Barter currencies.
 */
import type { APIRoute } from 'astro';
import { BARTER, noteFrontSVG, noteBackSVG } from '../../../../../lib/currency-builder/barter.mjs';

export function getStaticPaths() {
  return BARTER.currencies.flatMap((entry) => (['front', 'back'] as const).map((face) => ({
    params: { face, slug: entry.slug },
    props: { entry, face },
  })));
}

export const GET: APIRoute = ({ props }) => {
  const { entry, face } = props as { entry: (typeof BARTER.currencies)[number]; face: 'front' | 'back' };
  const svg = face === 'front' ? noteFrontSVG(entry) : noteBackSVG(entry);
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
