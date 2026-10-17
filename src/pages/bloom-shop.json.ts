import { BLOOM_META, BLOOM_FAMILIES, BLOOM_WORKS, BLOOM_PRICING } from '../lib/bloom-shop.mjs';

export function GET() {
  const body = {
    name: `${BLOOM_META.title} — ${BLOOM_META.subtitle}`,
    url: `https://pointcast.xyz${BLOOM_META.route}`,
    label: BLOOM_META.label,
    checkoutActive: BLOOM_META.checkoutActive,
    story: BLOOM_META.story,
    families: BLOOM_FAMILIES,
    works: BLOOM_WORKS.map((w) => ({ ...w, url: `https://pointcast.xyz/bloom-shop/${w.slug}` })),
    pricing: BLOOM_PRICING,
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
