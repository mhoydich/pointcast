#!/usr/bin/env node
/**
 * Mirror the public Good Feels Shopify catalog into PointCast products.
 *
 * This uses Shopify's public collection product JSON, so it does not need
 * admin credentials. PointCast remains a catalog and discovery surface;
 * checkout stays at getgoodfeels.com.
 */
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const USAGE = `
Usage:
  node scripts/sync-good-feels-products.mjs [options]

Environment:
  GOOD_FEELS_PRODUCTS_URL  Public Shopify collection JSON.
                           Default: https://getgoodfeels.com/collections/all/products.json?limit=250
  GOOD_FEELS_STORE_URL     Canonical customer-facing origin.
                           Default: https://getgoodfeels.com

Options:
  --dry-run                Print mapped products without writing JSON files
  --limit <n>              Max products to mirror. Default: 250
  --out <dir>              Output directory. Default: src/content/products
  --prune                  Delete stale Good Feels product files not in the current mirror
  --help                   Show this help
`;

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
    limit: { type: 'string', default: '250' },
    out: { type: 'string', default: 'src/content/products' },
    prune: { type: 'boolean', default: false },
  },
});

if (values.help) {
  console.log(USAGE.trim());
  process.exit(0);
}

const productsUrl = process.env.GOOD_FEELS_PRODUCTS_URL || 'https://getgoodfeels.com/collections/all/products.json?limit=250';
const storeUrl = normalizeOrigin(process.env.GOOD_FEELS_STORE_URL || 'https://getgoodfeels.com');
const outDir = path.resolve(process.cwd(), values.out);
const limit = parsePositiveInt(values.limit, '--limit');
const runStartedAt = new Date().toISOString();

const products = await fetchProducts();
const mapped = products.slice(0, limit).map(toPointCastProduct);

if (values['dry-run']) {
  console.log(JSON.stringify({
    dryRun: true,
    productsUrl,
    storeUrl,
    count: mapped.length,
    products: mapped,
  }, null, 2));
  process.exit(0);
}

await mkdir(outDir, { recursive: true });
for (const product of mapped) {
  const file = path.join(outDir, `${product.slug}.json`);
  await writeFile(file, `${JSON.stringify(product, null, 2)}\n`, 'utf8');
  console.log(`mirrored ${product.slug} -> ${path.relative(process.cwd(), file)}`);
}

if (values.prune) {
  const freshSlugs = new Set(mapped.map((product) => product.slug));
  const stale = await findStaleGoodFeelsFiles(freshSlugs);
  for (const file of stale) {
    await unlink(file);
    console.log(`pruned stale Good Feels product -> ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`Good Feels mirror complete: ${mapped.length} product${mapped.length === 1 ? '' : 's'}`);

async function fetchProducts() {
  const response = await fetch(productsUrl, {
    headers: { Accept: 'application/json' },
  });
  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Good Feels returned non-JSON response (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(`Good Feels HTTP ${response.status}: ${JSON.stringify(json, null, 2)}`);
  }

  if (!Array.isArray(json.products)) {
    throw new Error('Good Feels product response did not include a products array.');
  }

  return json.products;
}

function toPointCastProduct(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const prices = variants
    .map((variant) => Number.parseFloat(variant.price))
    .filter((price) => Number.isFinite(price));
  const lowestPrice = prices.length ? Math.min(...prices) : undefined;
  const images = unique((Array.isArray(product.images) ? product.images : [])
    .map((image) => image.src || image)
    .filter(Boolean))
    .slice(0, 6);

  const category = product.product_type || product.type || categoryFromTitle(product.title);
  const rawDescription = cleanDescription(product.body_html || product.description || '');
  const description = rawDescription || `${product.title} from Good Feels${category ? ` (${category})` : ''}. Mirrored from the public Good Feels Shopify catalog.`;
  const effects = inferEffects(product, category);
  const serving = servingLine(product.title, description);

  return compactObject({
    slug: product.handle,
    name: product.title,
    description,
    url: `${storeUrl}/products/${product.handle}`,
    brand: product.vendor || 'Good Feels',
    image: images.length ? images : undefined,
    priceUsd: lowestPrice === undefined ? undefined : roundMoney(lowestPrice),
    currency: 'USD',
    availability: variants.some((variant) => variant.available) ? 'in-stock' : 'out-of-stock',
    category,
    effects,
    dek: firstNonEmpty([
      serving && category ? `${serving} · ${category}` : serving,
      category,
    ]) || undefined,
    pairsWithMood: pairingsForProduct(product, category),
    vibeProfile: 'good-feels',
    addedAt: (product.published_at || product.created_at || runStartedAt).slice(0, 10),
    author: 'codex',
    source: `Good Feels public Shopify catalog mirror (${product.id})`,
  });
}

async function findStaleGoodFeelsFiles(freshSlugs) {
  const stale = [];
  const files = await readdir(outDir, { withFileTypes: true });
  for (const entry of files) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;

    const file = path.join(outDir, entry.name);
    let data;
    try {
      data = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      continue;
    }

    const slug = data.slug || entry.name.replace(/\.json$/, '');
    if (freshSlugs.has(slug)) continue;
    if (isGoodFeelsEntry(data)) stale.push(file);
  }
  return stale;
}

function isGoodFeelsEntry(data) {
  const brand = String(data.brand || '').toLowerCase();
  const url = String(data.url || '').toLowerCase();
  return brand === 'good feels'
    || url.includes('getgoodfeels.com');
}

function cleanDescription(value) {
  return decodeHtml(String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<li[^>]*>/gi, ' ')
    .replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim())
    .slice(0, 1200);
}

function decodeHtml(value) {
  const entities = {
    '&amp;': '&',
    '&apos;': "'",
    '&#39;': "'",
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
  };
  return value.replace(/&(amp|apos|#39|quot|lt|gt|nbsp);/g, (entity) => entities[entity] || entity);
}

function servingLine(title, description) {
  const haystack = `${title} ${description}`;
  const matches = uniqueIgnoreCase(Array.from(haystack.matchAll(/\b\d+(?:\.\d+)?mg\s+(?:THC|CBD|CBN|CBG)\b/gi))
    .map((match) => match[0].replace(/\s+/g, ' ')));
  return matches.slice(0, 3).join(' + ');
}

function inferEffects(product, category) {
  const values = new Set(['hemp-thc']);
  const text = `${product.title} ${product.body_html || ''} ${(product.tags || []).join(' ')} ${category}`.toLowerCase();

  if (text.includes('seltzer') || text.includes('drink')) values.add('seltzer');
  if (text.includes('gumm')) values.add('gummies');
  if (text.includes('enhancer')) values.add('beverage-enhancer');
  if (text.includes('cbd')) values.add('cbd');
  if (text.includes('cbn')) values.add('cbn');
  if (text.includes('cbg')) values.add('cbg');
  if (text.includes('variety') || text.includes('mix pack')) values.add('variety-pack');
  if (text.includes('sample')) values.add('sample');
  if (text.includes('sugar-free') || text.includes('sugar free')) values.add('sugar-free');
  if (text.includes('vegan')) values.add('vegan');

  return Array.from(values).slice(0, 8);
}

function pairingsForProduct(product, category) {
  const text = `${product.title} ${category}`.toLowerCase();
  const pairings = ['good-feels'];

  if (text.includes('seltzer') || text.includes('drink') || text.includes('mix')) {
    pairings.push('pre-shop-ritual');
  }
  if (text.includes('gumm')) {
    pairings.push('quiet-coordination');
  }
  if (text.includes('cbn')) {
    pairings.push('late-night-calm');
  }
  if (text.includes('beverage enhancer')) {
    pairings.push('morning');
  }

  return unique(pairings).slice(0, 8);
}

function categoryFromTitle(title) {
  const text = String(title).toLowerCase();
  if (text.includes('gumm')) return 'Gummies';
  if (text.includes('enhancer')) return 'Beverage Enhancer';
  if (text.includes('seltzer') || text.includes('drink')) return 'THC Seltzer';
  return 'Product';
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (value === '') return false;
      return true;
    }),
  );
}

function firstNonEmpty(values) {
  return values.find((value) => typeof value === 'string' && value.trim().length)?.trim() || '';
}

function unique(values) {
  return Array.from(new Set(values));
}

function uniqueIgnoreCase(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function normalizeOrigin(value) {
  return String(value || '').replace(/\/+$/, '');
}

function parsePositiveInt(value, name) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}
