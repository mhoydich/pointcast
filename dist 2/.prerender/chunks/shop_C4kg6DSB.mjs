import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { s as sourceKind, p as pairingsUrls, a as sourceLabel, c as checkoutHost, C as CHECKOUT_POLICY, d as COMMERCE_VERSION } from './commerce_DCJpkdIb.mjs';

const GET = async () => {
  const products = (await getCollection("products", ({ data }) => !data.draft)).sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const countMatching = (pattern) => products.filter((product) => pattern.test(product.data.category || product.data.name)).length;
  const countSource = (kind) => products.filter((product) => sourceKind(product.data) === kind).length;
  const moodSlugs = Array.from(new Set(products.flatMap((product) => product.data.pairsWithMood ?? []))).sort();
  const payload = {
    $schema: "https://pointcast.xyz/shop.json",
    version: COMMERCE_VERSION,
    name: "PointCast Commerce",
    description: "Unified commerce hub for Good Feels product discovery, PointCast merch lanes, pairings, and agent-readable catalog routes. Checkout stays outbound at canonical shop surfaces.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    homepage: "https://pointcast.xyz/shop",
    productsJson: "https://pointcast.xyz/products.json",
    productsJsonl: "https://pointcast.xyz/api/products.jsonl",
    checkoutPolicy: CHECKOUT_POLICY,
    count: products.length,
    sources: [
      {
        slug: "good-feels",
        label: "Good Feels",
        sourceKind: "good-feels",
        url: "https://getgoodfeels.com",
        checkoutHost: "getgoodfeels.com",
        count: countSource("good-feels"),
        status: "live"
      },
      {
        slug: "pointcast-merch",
        label: "PointCast Merch",
        sourceKind: "pointcast-merch",
        url: "https://pointcast.xyz/shop#pointcast-merch",
        checkoutHost: null,
        count: countSource("pointcast-merch"),
        status: "coming-soon",
        note: "Draft or unavailable PointCast Shopify products stay hidden until active."
      }
    ],
    lanes: [
      { slug: "good-feels", label: "Good Feels", url: "https://pointcast.xyz/shop#catalog", count: countSource("good-feels"), source: "https://getgoodfeels.com", sourceKind: "good-feels", status: "live" },
      { slug: "seltzers", label: "Seltzers", url: "https://pointcast.xyz/shop#catalog", count: countMatching(/seltzer|drink|mix seltzer/i), sourceKind: "good-feels", status: "live" },
      { slug: "gummies", label: "Gummies", url: "https://pointcast.xyz/shop#catalog", count: countMatching(/gumm/i), sourceKind: "good-feels", status: "live" },
      { slug: "enhancers", label: "Enhancers", url: "https://pointcast.xyz/shop#catalog", count: countMatching(/enhancer/i), sourceKind: "good-feels", status: "live" },
      { slug: "pointcast-merch", label: "PointCast Merch", url: "https://pointcast.xyz/shop#pointcast-merch", count: countSource("pointcast-merch"), sourceKind: "pointcast-merch", status: "coming-soon" },
      { slug: "pairings", label: "Pairings", url: "https://pointcast.xyz/pairings", count: moodSlugs.length, sourceKind: "pointcast", status: "live" },
      { slug: "json-api", label: "JSON / API", url: "https://pointcast.xyz/shop.json", count: 3, sourceKind: "pointcast", status: "live" }
    ],
    products: products.map((product) => {
      const kind = sourceKind(product.data);
      const moods = product.data.pairsWithMood ?? [];
      return {
        slug: product.data.slug,
        name: product.data.name,
        brand: product.data.brand,
        description: product.data.description,
        dek: product.data.dek ?? null,
        category: product.data.category ?? null,
        availability: product.data.availability,
        priceUsd: product.data.priceUsd ?? null,
        currency: product.data.currency,
        productPage: `https://pointcast.xyz/products/${product.data.slug}`,
        checkoutUrl: product.data.url,
        checkoutHost: checkoutHost(product.data.url),
        sourceKind: kind,
        sourceLabel: sourceLabel(kind),
        image: product.data.image ?? [],
        pairsWithMood: moods,
        pairingsUrls: pairingsUrls(moods),
        vibeProfile: product.data.vibeProfile ?? null,
        addedAt: product.data.addedAt.toISOString(),
        source: product.data.source ?? null
      };
    })
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
