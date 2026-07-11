#!/usr/bin/env node
/** Validate that published catalog entries only route to safe outbound checkout pages. */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const productsDir = path.resolve(
  process.cwd(),
  process.env.COMMERCE_PRODUCTS_DIR || 'src/content/products',
);
const files = (await readdir(productsDir)).filter((file) => file.endsWith('.json')).sort();
const errors = [];
let publicCount = 0;
let hiddenCount = 0;

for (const file of files) {
  const product = JSON.parse(await readFile(path.join(productsDir, file), 'utf8'));
  const label = product.slug || file;
  let checkout;
  try {
    checkout = new URL(product.url);
  } catch {
    errors.push(`${label}: checkout URL is invalid`);
    continue;
  }

  const checkoutHost = checkout.hostname.replace(/^www\./, '').toLowerCase();
  // Keep this aligned with src/lib/commerce.ts#sourceKind: Shopify-hosted
  // products are PointCast merch even when the upstream vendor name changes.
  const isPointCastMerch = /pointcast/i.test(product.brand || '')
    || checkoutHost.endsWith('.myshopify.com');
  const isHidden = product.draft === true
    || (isPointCastMerch && product.availability !== 'in-stock');

  if (isHidden) {
    hiddenCount += 1;
  } else {
    publicCount += 1;
  }

  if (checkout.protocol !== 'https:') errors.push(`${label}: checkout must use HTTPS`);
  if (checkout.username || checkout.password) errors.push(`${label}: checkout URL must not contain credentials`);
  if (checkout.port) errors.push(`${label}: checkout URL must not use a custom port`);
  if (checkout.search || checkout.hash) errors.push(`${label}: checkout URL must be canonical (no query or fragment)`);
  if (checkout.hostname === 'pointcast.xyz' || checkout.hostname.endsWith('.pointcast.xyz')) {
    errors.push(`${label}: checkout must stay outbound from PointCast`);
  }

  const isGoodFeels = /good feels/i.test(product.brand || '')
    || checkoutHost === 'getgoodfeels.com';
  if (isGoodFeels) {
    if (checkoutHost !== 'getgoodfeels.com') {
      errors.push(`${label}: Good Feels checkout must use getgoodfeels.com`);
    }
    const expectedPath = `/products/${product.slug}`;
    const checkoutPath = checkout.pathname.replace(/\/$/, '');
    if (checkoutPath !== expectedPath) {
      errors.push(`${label}: Good Feels checkout must use canonical path ${expectedPath}`);
    }
  }
}

if (errors.length) {
  console.error(`Commerce catalog audit failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Commerce catalog audit passed: ${publicCount} public products, ${hiddenCount} hidden products, all current and staged checkout routes outbound and canonical.`);
