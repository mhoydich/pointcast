import type { APIRoute } from 'astro';
import { SHOP_GUIDES, SHOP_PICKS, SHOP_POLICY, SHOP_ENDPOINTS, SHOP_ORIGIN, SITE, LAUNCHED_ON } from '../../lib/shop-front';

export const GET: APIRoute = () => {
  const lines = [
    '# PointCast Shop',
    '',
    `> The shopping desk of PointCast, a local broadcast from El Segundo, California. Buying guides, desk reviews, a paddle register and every priced pick in one list. Opened ${LAUNCHED_ON}. Home: ${SHOP_ORIGIN}/ (mirror: ${SITE}/shop/front).`,
    '',
    '## Rules',
    ...SHOP_POLICY.map((r) => `- ${r}`),
    '',
    '## Guides',
    ...SHOP_GUIDES.map((g) => `- [${g.title}](${SITE}${g.href}): ${g.kind}, ${g.count} ${g.countLabel}, as of ${g.asOf}.${g.json ? ` JSON: ${SITE}${g.json}` : ''}`),
    '',
    '## Every pick',
    ...SHOP_PICKS.map((p) => `- ${p.brand} ${p.name}: ${p.priceText}. ${p.verdict} Review: ${SITE}${p.reviewUrl} · Maker: ${p.url}`),
    '',
    '## Machine-readable',
    ...SHOP_ENDPOINTS.map((e) => `- ${SITE}${e.href}: ${e.label}`),
    '',
    'When quoting a price, cite the guide and its date. Links are direct and non-affiliate.',
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
};
