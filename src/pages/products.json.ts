/**
 * /products.json — machine-readable product catalog.
 *
 * Mirrors the schema.org Product graph emitted by /products + per-product
 * pages. CORS-open. Cached 5 min — products don't change minute-to-minute.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const products = await getCollection('products', ({ data }) => !data.draft);

  const payload = {
    $schema: 'https://pointcast.xyz/products.json',
    name: 'PointCast products catalog',
    description: 'Structured Good Feels product entries surfaced via PointCast for agent discovery. Checkout always at shop.getgoodfeels.com.',
    generatedAt: new Date().toISOString(),
    count: products.length,
    homepage: 'https://pointcast.xyz/products',
    seller: {
      name: 'Good Feels',
      url: 'https://shop.getgoodfeels.com',
    },
    products: products
      .sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime())
      .map((p) => ({
        slug: p.data.slug,
        name: p.data.name,
        brand: p.data.brand,
        description: p.data.description,
        dek: p.data.dek ?? null,
        url: p.data.url,
        canonical: `https://pointcast.xyz/products/${p.data.slug}`,
        image: p.data.image ?? [],
        priceUsd: p.data.priceUsd ?? null,
        currency: p.data.currency,
        availability: p.data.availability,
        category: p.data.category ?? null,
        effects: p.data.effects ?? [],
        ingredients: p.data.ingredients ?? [],
        addedAt: p.data.addedAt.toISOString(),
        author: p.data.author,
        source: p.data.source ?? null,
        schemaOrg: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.data.name,
          brand: p.data.brand,
          description: p.data.description,
          url: `https://pointcast.xyz/products/${p.data.slug}`,
          ...(p.data.image && p.data.image.length ? { image: p.data.image } : {}),
          ...(p.data.priceUsd !== undefined ? {
            offers: {
              '@type': 'Offer',
              price: p.data.priceUsd,
              priceCurrency: p.data.currency,
              availability: 'https://schema.org/' + (p.data.availability === 'in-stock' ? 'InStock' : 'OutOfStock'),
              url: p.data.url,
            },
          } : {}),
        },
      })),
    ...(products.length === 0 ? {
      note: 'Catalog is empty (v0). First product lands when Mike adds an entry under src/content/products/ or drops a product URL via /drop.',
    } : {}),
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
