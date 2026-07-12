import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { s as sourceKind, p as pairingsUrls, a as sourceLabel, c as checkoutHost } from './commerce_DCJpkdIb.mjs';

const GET = async () => {
  const products = (await getCollection("products", ({ data }) => !data.draft)).sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const lines = products.map((p) => {
    const kind = sourceKind(p.data);
    const moods = p.data.pairsWithMood ?? [];
    return JSON.stringify({
      slug: p.data.slug,
      name: p.data.name,
      brand: p.data.brand,
      description: p.data.description,
      dek: p.data.dek ?? null,
      productPage: `https://pointcast.xyz/products/${p.data.slug}`,
      shopUrl: p.data.url,
      checkoutUrl: p.data.url,
      checkoutHost: checkoutHost(p.data.url),
      sourceKind: kind,
      sourceLabel: sourceLabel(kind),
      image: p.data.image ?? null,
      priceUsd: p.data.priceUsd ?? null,
      currency: p.data.currency,
      availability: p.data.availability,
      category: p.data.category ?? null,
      effects: p.data.effects ?? [],
      ingredients: p.data.ingredients ?? [],
      pairsWithMood: moods,
      vibeProfile: p.data.vibeProfile ?? null,
      pairingsUrls: pairingsUrls(moods),
      addedAt: p.data.addedAt.toISOString(),
      author: p.data.author,
      source: p.data.source ?? null
    });
  }).join("\n") + "\n";
  return new Response(lines, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Total-Count": String(products.length)
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
