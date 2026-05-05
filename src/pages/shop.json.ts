/**
 * /shop.json — storefront mirror for people building against PointCast.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const products = (await getCollection('products', ({ data }) => !data.draft))
    .sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const countMatching = (pattern: RegExp) =>
    products.filter((product) => pattern.test(product.data.category || product.data.name)).length;

  const payload = {
    $schema: 'https://pointcast.xyz/shop.json',
    name: 'Good Feels Shop Mirror',
    description: 'PointCast mirror of the public Good Feels Shopify catalog. Checkout happens on each canonical Good Feels product URL.',
    generatedAt: new Date().toISOString(),
    homepage: 'https://pointcast.xyz/shop',
    productsJson: 'https://pointcast.xyz/products.json',
    productsJsonl: 'https://pointcast.xyz/api/products.jsonl',
    count: products.length,
    lanes: [
      { slug: 'good-feels', label: 'Good Feels', url: 'https://pointcast.xyz/shop#products', count: products.length, source: 'https://getgoodfeels.com' },
      { slug: 'seltzers', label: 'Seltzers', url: 'https://pointcast.xyz/shop#products', count: countMatching(/seltzer|drink|mix seltzer/i) },
      { slug: 'gummies', label: 'Gummies', url: 'https://pointcast.xyz/shop#products', count: countMatching(/gumm/i) },
      { slug: 'enhancers', label: 'Enhancers', url: 'https://pointcast.xyz/shop#products', count: countMatching(/enhancer/i) },
    ],
    products: products.map((product) => ({
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
      image: product.data.image ?? [],
      pairsWithMood: product.data.pairsWithMood ?? [],
      vibeProfile: product.data.vibeProfile ?? null,
      addedAt: product.data.addedAt.toISOString(),
      source: product.data.source ?? null,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
