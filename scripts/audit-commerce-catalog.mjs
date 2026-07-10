#!/usr/bin/env node
/** Validate that published catalog entries only route to safe outbound checkout pages. */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const productsDir = path.resolve(process.cwd(), 'src/content/products');
const files = (await readdir(productsDir)).filter((file) => file.endsWith('.json')).sort();
const errors = [];
let publicCount = 0;
let hiddenCount = 0;

for (const file of files) {
  const product = JSON.parse(await readFile(path.join(productsDir, file), 'utf8'));
  const label = product.slug || file;
  const isPointCastMerch = /pointcast/i.test(product.brand || '');
  const isHidden = product.draft === true
    || (isPointCastMerch && product.availability !== 'in-stock');

  if (isHidden) {
    hiddenCount += 1;
    continue;
  }
  publicCount += 1;

  let checkout;
  try {
    checkout = new URL(product.url);
  } catch {
    errors.push(`${label}: checkout URL is invalid`);
    continue;
  }

  if (checkout.protocol !== 'https:') errors.push(`${label}: checkout must use HTTPS`);
  if (checkout.username || checkout.password) errors.push(`${label}: checkout URL must not contain credentials`);
  if (checkout.search || checkout.hash) errors.push(`${label}: checkout URL must be canonical (no query or fragment)`);
  if (checkout.hostname === 'pointcast.xyz' || checkout.hostname.endsWith('.pointcast.xyz')) {
    errors.push(`${label}: checkout must stay outbound from PointCast`);
  }

  const isGoodFeels = /good feels/i.test(product.brand || '')
    || checkout.hostname.replace(/^www\./, '') === 'getgoodfeels.com';
  if (isGoodFeels) {
    if (checkout.hostname.replace(/^www\./, '') !== 'getgoodfeels.com') {
      errors.push(`${label}: Good Feels checkout must use getgoodfeels.com`);
    }
    if (!checkout.pathname.startsWith('/products/')) {
      errors.push(`${label}: Good Feels checkout must deep-link to a product page`);
    }
  }
}

if (errors.length) {
  console.error(`Commerce catalog audit failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Commerce catalog audit passed: ${publicCount} public products, ${hiddenCount} hidden products, all checkout routes outbound and canonical.`);
