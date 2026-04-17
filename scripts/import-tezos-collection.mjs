#!/usr/bin/env node
/**
 * Pull Mike's Tezos-owned tokens from TzKT and write them as LINK-type
 * Blocks on the `SPN` channel. Each token becomes a block like 0300-series
 * (collection IDs reserved above editorial 0200-series).
 *
 * Usage: node scripts/import-tezos-collection.mjs [wallet]
 * Default wallet: tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw (mhoydich collector)
 *
 * This reads on-chain state, writes Block JSONs to src/content/blocks/.
 * Rerun anytime Mike's collection shifts; the script overwrites the same
 * ID range (0300–0319) each time.
 */

import fs from 'node:fs';
import path from 'node:path';

const WALLET = process.argv[2] || 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const TZKT = 'https://api.tzkt.io/v1';
const BLOCK_ID_START = 300;   // 0300-series reserved for imported Tezos collection
const BLOCK_ID_END = 319;     // max 20 tokens imported per run
const OUT_DIR = path.resolve(process.cwd(), 'src/content/blocks');

function log(...args) { console.log('[tzimport]', ...args); }

function resolveIpfs(uri) {
  if (!uri) return null;
  if (uri.startsWith('ipfs://')) return 'https://cloudflare-ipfs.com/ipfs/' + uri.slice(7);
  return uri;
}

async function main() {
  log('wallet:', WALLET);

  const url = `${TZKT}/tokens/balances?account=${WALLET}&balance.gt=0&limit=50&sort.desc=lastLevel&token.metadata.artifactUri.ne=null`;
  const r = await fetch(url);
  if (!r.ok) {
    log('TzKT fetch failed:', r.status, await r.text());
    process.exit(1);
  }
  const balances = await r.json();
  log('tokens with balance > 0:', balances.length);

  // Only take the first N tokens with non-null metadata.
  const picked = [];
  for (const b of balances) {
    if (picked.length >= BLOCK_ID_END - BLOCK_ID_START + 1) break;
    const meta = b.token?.metadata;
    const name = meta?.name;
    if (!name) continue;
    picked.push(b);
  }

  // Purge any existing 0300-series block JSONs so we don't leave stale tokens.
  for (let i = BLOCK_ID_START; i <= BLOCK_ID_END; i++) {
    const p = path.join(OUT_DIR, `${String(i).padStart(4, '0')}.json`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  // Write the fresh set.
  for (let i = 0; i < picked.length; i++) {
    const b = picked[i];
    const meta = b.token.metadata;
    const contract = b.token.contract.address;
    const tokenId = b.token.tokenId;
    const id = String(BLOCK_ID_START + i).padStart(4, '0');

    const artifactUri = resolveIpfs(meta.artifactUri);
    const displayUri = resolveIpfs(meta.displayUri);
    const thumbnailUri = resolveIpfs(meta.thumbnailUri);
    const image = displayUri || thumbnailUri || artifactUri || null;

    const artist = Array.isArray(meta.creators) ? meta.creators[0] : (meta.creators ?? meta.artist ?? 'unknown');
    const title = meta.name.length > 80 ? meta.name.slice(0, 77) + '…' : meta.name;
    const dek = meta.description ? (meta.description.length > 180 ? meta.description.slice(0, 177) + '…' : meta.description) : undefined;

    const block = {
      id,
      channel: 'SPN',
      type: 'LINK',
      title,
      ...(dek ? { dek } : {}),
      timestamp: b.firstTime || b.lastTime || new Date().toISOString(),
      size: i === 0 ? '2x1' : '1x1',
      noun: (Number(tokenId) % 2000),
      ...(image ? { media: { kind: 'image', src: image } } : {}),
      external: {
        label: 'objkt.com',
        url: `https://objkt.com/tokens/${contract}/${tokenId}`,
      },
      meta: {
        source: 'tzkt',
        contract,
        tokenId: String(tokenId),
        artist: String(artist),
        wallet: WALLET,
        importedAt: new Date().toISOString(),
      },
    };

    fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), JSON.stringify(block, null, 2));
    log('wrote', id, '·', title);
  }

  log('done — imported', picked.length, 'tokens as LINK blocks');
}

main().catch((err) => {
  console.error('[tzimport] FAILED:', err?.message || err);
  process.exit(1);
});
