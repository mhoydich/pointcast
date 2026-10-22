/**
 * /currency-builder/security/{commons|barter}/{front|back}/{slug}.svg — Security
 * Edition (v2) print faces, 150 × 75 mm, for every Currency Builder note.
 */
import type { APIRoute } from 'astro';
import { securityEntries, securitySVG } from '../../../../../lib/currency-builder/security-edition.mjs';

export function getStaticPaths() {
  return securityEntries().flatMap(({ collection, entry }) => (['front', 'back'] as const).map((face) => ({
    params: { collection, face, slug: entry.slug },
    props: { collection, entry, face },
  })));
}

export const GET: APIRoute = ({ props }) => {
  const { collection, entry, face } = props as { collection: string; entry: { slug: string }; face: 'front' | 'back' };
  return new Response(securitySVG(collection, entry, face), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
