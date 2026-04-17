#!/usr/bin/env node
/**
 * fetch-market — pulls Mike's token inventory from his Tezos contract via
 * objkt's GraphQL API, downloads each token's display image to
 * public/images/tokens/, and writes the manifest to src/data/market.json.
 *
 * Run this when you mint new tokens or want to refresh prices/supply.
 *
 *   node scripts/fetch-market.mjs
 *
 * Why we self-host images: objkt's CDN does hotlink protection and returns
 * 403 when browsers request from non-objkt origins. By caching locally we
 * sidestep that, gain Cloudflare's CDN in front, and become resilient to
 * objkt CDN changes. Cost: ~20MB in public/images/tokens/, git-tracked.
 */

import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Buffer } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../src/data/market.json');
const TOKENS_DIR = resolve(__dirname, '../public/images/tokens');

// Mike's primary contract. Multi-token FA2.
const CONTRACT = 'KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP';

const QUERY = `
  query MikeTokens($contract: String!) {
    token(
      where: { fa_contract: { _eq: $contract }, supply: { _gt: "0" } }
      order_by: { token_id: desc }
    ) {
      token_id
      name
      description
      display_uri
      thumbnail_uri
      artifact_uri
      mime
      supply
      timestamp
      creators {
        holder { alias address }
      }
      listings_active(order_by: { price: asc }, limit: 1) {
        id
        bigmap_key
        price
        currency_id
        marketplace_contract
        amount_left
        seller_address
      }
      royalties {
        amount
        decimals
      }
    }
  }
`;

function ipfsToCdn(uri) {
  if (!uri) return '';
  // objkt serves IPFS assets via their own CDN — faster + more reliable than
  // public gateways. `/display` gives the web-optimized variant.
  const m = uri.match(/^ipfs:\/\/(.+)$/);
  if (m) return `https://assets.objkt.media/file/assets-003/${m[1]}/display`;
  return uri;
}

function extFromMime(mime) {
  if (!mime) return 'png';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('svg')) return 'svg';
  if (mime.includes('mp4')) return 'mp4';
  return 'png';
}

/** Download one token's display image from objkt CDN to public/images/tokens/. */
async function downloadTokenImage(tokenId, displayUri, mime) {
  const ext = extFromMime(mime);
  const localPath = resolve(TOKENS_DIR, `${tokenId}.${ext}`);
  const publicPath = `/images/tokens/${tokenId}.${ext}`;

  // Skip if already cached + non-empty
  if (existsSync(localPath) && statSync(localPath).size > 0) {
    return publicPath;
  }

  const m = displayUri.match(/^ipfs:\/\/(.+)$/);
  if (!m) return null;
  const cdn = `https://assets.objkt.media/file/assets-003/${m[1]}/display`;

  try {
    const res = await fetch(cdn, { redirect: 'follow' });
    if (!res.ok) {
      console.warn(`  ⚠ ${tokenId} HTTP ${res.status}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(localPath, buf);
    return publicPath;
  } catch (err) {
    console.warn(`  ⚠ ${tokenId} download failed:`, err.message);
    return null;
  }
}

async function main() {
  console.log(`Fetching tokens from contract ${CONTRACT}…`);
  const res = await fetch('https://data.objkt.com/v3/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { contract: CONTRACT } }),
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status}`);
    process.exit(1);
  }
  const body = await res.json();
  if (body.errors) {
    console.error('GraphQL errors:', body.errors);
    process.exit(1);
  }

  const raw = body.data.token;

  mkdirSync(TOKENS_DIR, { recursive: true });
  console.log(`Downloading ${raw.length} token images to public/images/tokens/…`);

  const tokens = [];
  for (const t of raw) {
    const creator = t.creators?.[0]?.holder ?? {};
    const listing = t.listings_active?.[0];
    const royalty = t.royalties?.[0];
    const priceMutez = listing ? Number(listing.price) : null;
    const tokenId = String(t.token_id);

    // Download image locally so we don't rely on objkt CDN at render time.
    const localPath = await downloadTokenImage(tokenId, t.display_uri, t.mime);
    if (localPath) process.stdout.write('.');
    else process.stdout.write('x');

    tokens.push({
      tokenId,
      contract: CONTRACT,
      name: t.name ?? '',
      description: t.description ?? '',
      // Self-hosted paths — served from pointcast.xyz via Cloudflare CDN.
      imageDisplay: localPath ?? ipfsToCdn(t.display_uri),
      imageThumb: localPath ?? ipfsToCdn(t.display_uri),
      mime: t.mime ?? 'image/png',
      supply: Number(t.supply) || 0,
      mintedAt: t.timestamp ?? null,
      artist: {
        alias: creator.alias ?? '',
        address: creator.address ?? '',
      },
      priceXtz: priceMutez !== null ? priceMutez / 1_000_000 : null,
      priceMutez: priceMutez,
      listed: Boolean(listing),
      marketplaceContract: listing?.marketplace_contract ?? null,
      // `bigmap_key` is the on-chain ask_id stored in the marketplace's
      // `asks` bigmap — what fulfill_ask actually takes. `listing.id` is
      // objkt's internal GraphQL id (different number) and would cause
      // FAILWITH 625 ("ASK_NOT_FOUND") on-chain.
      askId: listing?.bigmap_key ?? null,
      objktListingId: listing?.id ?? null,
      amountLeft: listing?.amount_left ?? null,
      seller: listing?.seller_address ?? null,
      royaltyBps: royalty ? Math.round((Number(royalty.amount) / Math.pow(10, Number(royalty.decimals))) * 10000) : null,
      objktUrl: `https://objkt.com/tokens/${CONTRACT}/${tokenId}`,
    });
  }
  console.log('');

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  const payload = {
    updatedAt: new Date().toISOString(),
    contract: CONTRACT,
    count: tokens.length,
    tokens,
  };
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8');

  console.log(`✓ wrote ${tokens.length} tokens to src/data/market.json`);
  const listed = tokens.filter((t) => t.listed).length;
  console.log(`  ${listed} actively listed on objkt`);
  const lowest = tokens.filter((t) => t.priceXtz !== null).sort((a, b) => a.priceXtz - b.priceXtz)[0];
  if (lowest) console.log(`  lowest: ${lowest.priceXtz} ꜩ (#${lowest.tokenId} ${lowest.name})`);
}

main().catch((err) => { console.error(err); process.exit(1); });
