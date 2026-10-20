/**
 * /case-studies/launchpad/coins/{scenario}-{symbol}.svg — simulated coin
 * portraits for the launchpad case study (full CC0 Nouns, SIMULATED ribbon).
 */
import type { APIRoute } from 'astro';
import { SCENARIOS } from '../../../../lib/launchpad/exhibits.mjs';
import { coinSVG, coinSlug } from '../../../../lib/launchpad/coin-art.mjs';

export function getStaticPaths() {
  return SCENARIOS.flatMap((scenario) => scenario.launches.map((l) => ({
    params: { slug: coinSlug(scenario.id, l.symbol) },
    props: { scenarioId: scenario.id, symbol: l.symbol, name: l.name, nounId: l.nounId },
  })));
}

export const GET: APIRoute = ({ props }) =>
  new Response(coinSVG(props as { scenarioId: string; symbol: string; name: string; nounId: number }), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
