/**
 * /currency-builder/desk-notes/notes/{front|back}/{slug}.svg — print-size
 * SVG faces for the five Desk Notes (one per house agent).
 */
import type { APIRoute } from 'astro';
import { DESK_NOTES, noteFrontSVG, noteBackSVG } from '../../../../../lib/currency-builder/desk-notes.mjs';

export function getStaticPaths() {
  return DESK_NOTES.notes.flatMap((entry) => (['front', 'back'] as const).map((face) => ({
    params: { face, slug: entry.slug },
    props: { entry, face },
  })));
}

export const GET: APIRoute = ({ props }) => {
  const { entry, face } = props as { entry: (typeof DESK_NOTES.notes)[number]; face: 'front' | 'back' };
  const svg = face === 'front' ? noteFrontSVG(entry) : noteBackSVG(entry);
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
};
