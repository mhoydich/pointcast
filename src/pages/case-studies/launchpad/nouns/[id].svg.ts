/**
 * /case-studies/launchpad/nouns/{0–99}.svg — simulated coin faces for each
 * verified Noun, before a coin has a symbol: the live board's Create preview
 * and the coins viewers launch there (full CC0 Noun, SIMULATED ribbon).
 */
import type { APIRoute } from 'astro';
import { previewSVG } from '../../../../lib/launchpad/coin-art.mjs';

export function getStaticPaths() {
  return Array.from({ length: 100 }, (_, id) => ({ params: { id: String(id) }, props: { nounId: id } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(previewSVG((props as { nounId: number }).nounId), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
