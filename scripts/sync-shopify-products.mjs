#!/usr/bin/env node
/**
 * Pull Shopify products into PointCast's `products` content collection.
 *
 * Shopify stays the checkout/source of truth. PointCast becomes the
 * agent-readable catalog window that can pair products with moods, blocks,
 * and daily moments.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const USAGE = `
Usage:
  node scripts/sync-shopify-products.mjs [options]

Required environment:
  SHOPIFY_STORE_DOMAIN     Permanent myshopify.com domain, e.g. pointcast.myshopify.com
                           SHOPIFY_SHOP is also accepted for Shopify doc examples

Authentication environment, choose one:
  SHOPIFY_ACCESS_TOKEN     Admin API access token with read_products scope
  SHOPIFY_CLIENT_ID        Dev Dashboard app client ID
  SHOPIFY_CLIENT_SECRET    Dev Dashboard app client secret

Optional environment:
  SHOPIFY_API_VERSION      Defaults to 2026-04
  SHOPIFY_PUBLIC_STORE_URL Canonical customer-facing shop origin
  SHOPIFY_PRODUCT_QUERY    Defaults to status:active
  SHOPIFY_DEFAULT_BRAND    Fallback when product.vendor is absent

Options:
  --dry-run                Print mapped products without writing JSON files
  --limit <n>              Max products to sync. Default: 100
  --query <string>         Shopify product search query. Default: status:active
  --out <dir>              Output directory. Default: src/content/products
  --help                   Show this help
`;

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
    limit: { type: 'string', default: '100' },
    out: { type: 'string', default: 'src/content/products' },
    query: { type: 'string' },
  },
});

if (values.help) {
  console.log(USAGE.trim());
  process.exit(0);
}

const storeDomain = normalizeStoreDomain(process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_SHOP || '');
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN?.trim() || '';
const clientId = process.env.SHOPIFY_CLIENT_ID?.trim() || '';
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim() || '';
const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-04';
const productQuery = values.query ?? process.env.SHOPIFY_PRODUCT_QUERY ?? 'status:active';
const publicStoreUrl = normalizeOrigin(process.env.SHOPIFY_PUBLIC_STORE_URL);
const fallbackBrand = process.env.SHOPIFY_DEFAULT_BRAND || 'PointCast';
const outDir = path.resolve(process.cwd(), values.out);
const limit = parsePositiveInt(values.limit, '--limit');
const authMode = accessToken ? 'access-token' : 'client-credentials';
let cachedAccessToken = '';
let cachedAccessTokenExpiresAt = 0;

if (!storeDomain) {
  console.error(`Missing SHOPIFY_STORE_DOMAIN.\n\n${USAGE.trim()}`);
  process.exit(1);
}

if (!accessToken && (!clientId || !clientSecret)) {
  console.error(`Missing Shopify authentication.\n\n${USAGE.trim()}`);
  process.exit(1);
}

const PRODUCTS_QUERY = `
query PointCastProducts($first: Int!, $after: String, $query: String) {
  shop {
    currencyCode
  }
  products(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
    nodes {
      id
      title
      handle
      description(truncateAt: 1200)
      vendor
      productType
      status
      tags
      onlineStoreUrl
      createdAt
      updatedAt
      seo {
        title
        description
      }
      media(first: 8) {
        nodes {
          ... on MediaImage {
            image {
              url
              altText
            }
          }
        }
      }
      metafields(first: 40, namespace: "pointcast") {
        nodes {
          key
          type
          value
        }
      }
      variants(first: 50) {
        nodes {
          id
          title
          sku
          price
          compareAtPrice
          availableForSale
          selectedOptions {
            name
            value
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;

const runStartedAt = new Date().toISOString();
const { products, currency } = await fetchProducts({ limit, query: productQuery });
const mapped = products.map((product) => toPointCastProduct(product, currency));

if (values['dry-run']) {
  console.log(JSON.stringify({
    dryRun: true,
    storeDomain,
    apiVersion,
    authMode,
    query: productQuery,
    count: mapped.length,
    products: mapped,
  }, null, 2));
  process.exit(0);
}

await mkdir(outDir, { recursive: true });
for (const product of mapped) {
  const file = path.join(outDir, `${product.slug}.json`);
  await writeFile(file, `${JSON.stringify(product, null, 2)}\n`, 'utf8');
  console.log(`synced ${product.slug} -> ${path.relative(process.cwd(), file)}`);
}

console.log(`Shopify sync complete: ${mapped.length} product${mapped.length === 1 ? '' : 's'} from ${storeDomain}`);

async function fetchProducts({ limit, query }) {
  const products = [];
  let cursor = null;
  let currency = 'USD';

  while (products.length < limit) {
    const first = Math.min(100, limit - products.length);
    const payload = await shopifyGraphql(PRODUCTS_QUERY, { first, after: cursor, query });
    currency = payload.data?.shop?.currencyCode || currency;

    const connection = payload.data?.products;
    const nodes = connection?.nodes ?? [];
    products.push(...nodes);

    if (!connection?.pageInfo?.hasNextPage) break;
    cursor = connection.pageInfo.endCursor;
  }

  return { products, currency };
}

async function shopifyGraphql(query, variables) {
  const endpoint = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': await getAccessToken(),
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`Shopify returned non-JSON response (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(`Shopify HTTP ${response.status}: ${JSON.stringify(json.errors ?? json, null, 2)}`);
  }

  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors, null, 2)}`);
  }

  return json;
}

async function getAccessToken() {
  if (accessToken) return accessToken;
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const response = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Shopify token endpoint returned non-JSON response (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok || !json.access_token) {
    throw new Error(`Shopify token request failed (${response.status}): ${JSON.stringify(json.errors ?? json, null, 2)}`);
  }

  cachedAccessToken = json.access_token;
  cachedAccessTokenExpiresAt = Date.now() + Number(json.expires_in ?? 3600) * 1000;
  return cachedAccessToken;
}

function toPointCastProduct(product, currency) {
  const tags = Array.isArray(product.tags) ? product.tags : [];
  const metafields = new Map((product.metafields?.nodes ?? []).map((field) => [field.key, field]));
  const variants = product.variants?.nodes ?? [];
  const prices = variants
    .map((variant) => Number.parseFloat(variant.price))
    .filter((price) => Number.isFinite(price));
  const lowestPrice = prices.length ? Math.min(...prices) : undefined;
  const images = unique((product.media?.nodes ?? [])
    .map((node) => node.image?.url)
    .filter(Boolean));

  const description = firstNonEmpty([
    metafieldString(metafields, 'description'),
    product.description,
    product.seo?.description,
    product.title,
  ]);

  return compactObject({
    slug: product.handle,
    name: product.title,
    description,
    url: publicProductUrl(product),
    brand: product.vendor || fallbackBrand,
    image: images.length ? images : undefined,
    priceUsd: currency === 'USD' && lowestPrice !== undefined ? roundMoney(lowestPrice) : undefined,
    currency,
    availability: inferAvailability(product, variants, tags, metafields),
    category: product.productType || metafieldString(metafields, 'category') || undefined,
    effects: listFromMetafieldOrTags(metafields, tags, 'effects', 'effect:'),
    ingredients: listFromMetafieldOrTags(metafields, tags, 'ingredients', 'ingredient:'),
    dek: firstNonEmpty([
      metafieldString(metafields, 'dek'),
      product.seo?.description,
    ]) || undefined,
    pairsWithMood: listFromMetafieldOrTags(metafields, tags, 'pairs_with_mood', 'mood:')
      .map(slugify)
      .filter(Boolean)
      .slice(0, 8),
    vibeProfile: metafieldString(metafields, 'vibe_profile') || undefined,
    addedAt: (product.createdAt || product.updatedAt || runStartedAt).slice(0, 10),
    syncedAt: runStartedAt,
    author: 'cc',
    source: `Shopify Admin GraphQL sync ${runStartedAt} (${product.id})`,
    draft: product.status !== 'ACTIVE',
  });
}

function publicProductUrl(product) {
  if (publicStoreUrl) return `${publicStoreUrl}/products/${product.handle}`;
  if (product.onlineStoreUrl) return product.onlineStoreUrl;
  return `https://${storeDomain}/products/${product.handle}`;
}

function inferAvailability(product, variants, tags, metafields) {
  const explicit = metafieldString(metafields, 'availability');
  if (['in-stock', 'out-of-stock', 'preorder', 'discontinued'].includes(explicit)) return explicit;

  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  if (normalizedTags.includes('preorder') || normalizedTags.includes('pointcast:preorder')) return 'preorder';
  if (product.status === 'ARCHIVED') return 'discontinued';
  if (product.status !== 'ACTIVE') return 'out-of-stock';
  if (variants.length === 0) return 'in-stock';
  return variants.some((variant) => variant.availableForSale) ? 'in-stock' : 'out-of-stock';
}

function listFromMetafieldOrTags(metafields, tags, key, tagPrefix) {
  const fromMeta = listFromMetafield(metafields, key);
  if (fromMeta.length) return fromMeta;
  return tags
    .filter((tag) => tag.toLowerCase().startsWith(tagPrefix))
    .map((tag) => tag.slice(tagPrefix.length).trim())
    .filter(Boolean);
}

function listFromMetafield(metafields, key) {
  const value = metafieldString(metafields, key);
  if (!value) return [];

  if (value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    } catch {
      // Fall through to comma/newline parsing below.
    }
  }

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function metafieldString(metafields, key) {
  return metafields.get(key)?.value?.trim?.() || '';
}

function firstNonEmpty(values) {
  return values.find((value) => typeof value === 'string' && value.trim().length)?.trim() || '';
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );
}

function unique(values) {
  return Array.from(new Set(values));
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function normalizeOrigin(value) {
  if (!value) return '';
  return value.replace(/\/+$/, '');
}

function normalizeStoreDomain(value) {
  const domain = String(value)
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.myshopify\.com$/i, '.myshopify.com');
  if (!domain) return '';
  return domain.includes('.') ? domain : `${domain}.myshopify.com`;
}

function parsePositiveInt(value, name) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}
