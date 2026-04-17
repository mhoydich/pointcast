#!/usr/bin/env node
/**
 * upload-nouns-ipfs — generates + pins the PointCast Visit Nouns metadata
 * directory to IPFS via Pinata. The directory CID this prints becomes the
 * on-chain `metadata_base_cid` that the FA2 contract uses to build each
 * token's TZIP-12 URI:
 *
 *     token_metadata[n] = ipfs://{metadata_base_cid}/{n}.json
 *
 * Design — metadata points at noun.pics for image URIs (not IPFS-pinned
 * artwork). Rationale:
 *   • noun.pics is run by the Nouns DAO, CC0, stable, free, and already
 *     backs every other Noun-aware surface on pointcast.xyz.
 *   • The *metadata* is what needs to be immutable & decentralized — it
 *     carries the token identity + royalty claims.
 *   • If we ever want fully on-IPFS art, run this script with --with-svgs:
 *     it'll also pin 1200 SVGs and rewrite displayUri to ipfs://…, then
 *     re-run `set_metadata_base_cid` on the contract with the new CID.
 *
 * Usage:
 *
 *   export PINATA_JWT=<your Pinata JWT>
 *   node scripts/upload-nouns-ipfs.mjs            # default: 1200 metadata JSONs
 *   node scripts/upload-nouns-ipfs.mjs --dry-run  # build locally, no upload
 *   node scripts/upload-nouns-ipfs.mjs --with-svgs  # also pin SVGs to IPFS
 *
 * Free Pinata tier (plenty for this use case):
 *   • 1 GB total storage
 *   • 500 pins (we use 1-2 pins — the whole metadata directory = 1 pin)
 *   • Standard rate limits on the API
 *
 * Get your JWT: https://app.pinata.cloud → API Keys → New Key → paste JWT.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Buffer } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../out/nouns-metadata');

// --- Config -----------------------------------------------------------------
const PINATA_JWT = process.env.PINATA_JWT;
const CREATOR_ADDRESS = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';   // Mike
const NOUN_COUNT = 1200;                                          // 0..1199
const ROYALTY_BPS = 2000;                                         // 20% — heavy
const COLLECTION_NAME = 'PointCast Visit Nouns';
const SYMBOL = 'PCVN';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const WITH_SVGS = args.has('--with-svgs');

// --- Metadata template ------------------------------------------------------

function buildTokenMetadata(nounId, imageUri) {
  // TZIP-12 / TZIP-21 compliant. Fields objkt / teia / tzkt all consume.
  return {
    name: `PointCast Visit Noun #${nounId}`,
    symbol: SYMBOL,
    decimals: 0,
    isBooleanAmount: false,
    description:
      'A PointCast Visit Noun. One of 1200 CC0 Nouns (nouns.wtf), ' +
      'minted on Tezos to commemorate your visit to pointcast.xyz — ' +
      'analog heart, agentic brain.',
    displayUri: imageUri,
    thumbnailUri: imageUri,
    artifactUri: imageUri,
    mime: 'image/svg+xml',
    creators: [CREATOR_ADDRESS],
    contributors: [CREATOR_ADDRESS],
    publishers: ['PointCast'],
    date: new Date().toISOString(),
    language: 'en',
    rights: 'Creative Commons CC0 1.0 Universal',
    rightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    tags: ['pointcast', 'visit-noun', 'cc0', 'nouns', 'tezos'],
    royalties: {
      decimals: 4,               // 10^-4 granularity
      shares: { [CREATOR_ADDRESS]: ROYALTY_BPS },
    },
    attributes: [
      { name: 'Noun ID',    value: String(nounId) },
      { name: 'Collection', value: COLLECTION_NAME },
      { name: 'Source',     value: 'noun.pics' },
      { name: 'License',    value: 'CC0' },
    ],
  };
}

function buildContractMetadata(metadataBaseCid) {
  // TZIP-16 contract-level metadata. Points explorers at the collection.
  return {
    name: COLLECTION_NAME,
    description:
      'PointCast Visit Nouns on Tezos. Each of 1200 CC0 Nouns (nouns.wtf) ' +
      'can be minted as an open-edition FA2 token, commemorating a visit ' +
      'to pointcast.xyz. Analog heart, agentic brain.',
    version: '1.0.0',
    license: { name: 'CC0 1.0' },
    authors: ['Mike Hoydich <https://pointcast.xyz>'],
    homepage: 'https://pointcast.xyz',
    source: { tools: ['SmartPy'], location: 'https://github.com/MikeHoydich/pointcast' },
    interfaces: ['TZIP-012', 'TZIP-016', 'TZIP-021'],
    // Per TZIP-16, explorers walk `metadata_base_cid` to resolve per-token.
    metadata_base_cid: metadataBaseCid,
  };
}

// --- Pinata API helpers -----------------------------------------------------

async function pinataAuth() {
  if (!PINATA_JWT) {
    console.error('ERROR: missing PINATA_JWT env var.');
    console.error('  1. Sign up at https://app.pinata.cloud');
    console.error('  2. API Keys → New Key → copy the JWT (not the API key/secret pair)');
    console.error('  3. export PINATA_JWT="eyJ..."');
    console.error('  4. Re-run this script.');
    process.exit(1);
  }
  const res = await fetch('https://api.pinata.cloud/data/testAuthentication', {
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
  });
  if (!res.ok) {
    console.error(`Pinata auth failed (HTTP ${res.status}). Check your JWT.`);
    process.exit(1);
  }
  console.log('✓ Pinata authenticated');
}

async function pinDirectory(files, name) {
  // files: Array<{ path: string, data: Buffer|string, contentType: string }>
  // Builds a multipart form with wrapWithDirectory so Pinata returns a
  // single parent CID you can address as `ipfs://CID/<path>`.
  const form = new FormData();
  for (const f of files) {
    const blob = new Blob([f.data], { type: f.contentType });
    form.append('file', blob, f.path);
  }
  form.append('pinataOptions', JSON.stringify({
    wrapWithDirectory: true,
    cidVersion: 1,
  }));
  form.append('pinataMetadata', JSON.stringify({ name }));

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pinata pinDirectory failed: HTTP ${res.status} — ${body}`);
  }
  const data = await res.json();
  return data.IpfsHash;
}

async function pinJson(obj, name) {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: obj,
      pinataMetadata: { name },
      pinataOptions: { cidVersion: 1 },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pinata pinJson failed: HTTP ${res.status} — ${body}`);
  }
  const data = await res.json();
  return data.IpfsHash;
}

// --- Main -------------------------------------------------------------------

async function main() {
  console.log(`PointCast Visit Nouns — IPFS metadata upload`);
  console.log(`  count:     ${NOUN_COUNT}`);
  console.log(`  creator:   ${CREATOR_ADDRESS}`);
  console.log(`  royalties: ${ROYALTY_BPS / 100}%`);
  console.log(`  mode:      ${DRY_RUN ? 'DRY RUN (local only)' : 'UPLOAD to Pinata'}${WITH_SVGS ? ' + SVGs' : ''}`);
  console.log('');

  if (!DRY_RUN) await pinataAuth();

  // Optionally pin all 1200 Noun SVGs. This mirrors the art on-IPFS so
  // metadata URIs can be 100% ipfs://… with no noun.pics dependency.
  let imagesDirCid = null;
  if (WITH_SVGS) {
    console.log('Fetching + pinning 1200 Noun SVGs...');
    const imageFiles = [];
    for (let i = 0; i < NOUN_COUNT; i++) {
      const r = await fetch(`https://noun.pics/${i}.svg`);
      if (!r.ok) {
        console.warn(`  ⚠ noun.pics/${i}.svg → HTTP ${r.status}, skipping`);
        continue;
      }
      const svg = await r.text();
      imageFiles.push({ path: `${i}.svg`, data: svg, contentType: 'image/svg+xml' });
      if (i % 50 === 0) process.stdout.write(`.${i}.`);
    }
    process.stdout.write('\n');
    if (!DRY_RUN) {
      console.log(`Pinning ${imageFiles.length} SVGs as a directory...`);
      imagesDirCid = await pinDirectory(imageFiles, 'PointCast Visit Noun Images');
      console.log(`✓ images dir CID: ${imagesDirCid}`);
    }
  }

  // Build metadata JSONs.
  console.log(`Building ${NOUN_COUNT} metadata JSONs...`);
  const metadataFiles = [];
  for (let i = 0; i < NOUN_COUNT; i++) {
    const imageUri = imagesDirCid
      ? `ipfs://${imagesDirCid}/${i}.svg`
      : `https://noun.pics/${i}.svg`;
    const meta = buildTokenMetadata(i, imageUri);
    metadataFiles.push({
      path: `${i}.json`,
      data: JSON.stringify(meta, null, 2),
      contentType: 'application/json',
    });
  }
  const totalBytes = metadataFiles.reduce((s, f) => s + Buffer.byteLength(f.data), 0);
  console.log(`  total size: ${(totalBytes / 1024).toFixed(1)} KB`);

  if (DRY_RUN) {
    console.log(`Writing metadata locally to ${OUT_DIR}...`);
    mkdirSync(OUT_DIR, { recursive: true });
    for (const f of metadataFiles) {
      writeFileSync(resolve(OUT_DIR, f.path), f.data);
    }
    console.log(`✓ wrote ${metadataFiles.length} files to ${OUT_DIR}`);
    console.log('');
    console.log('DRY RUN complete. Inspect the files, then re-run without --dry-run to upload.');
    return;
  }

  // Pin the metadata directory.
  console.log(`Pinning ${metadataFiles.length} metadata JSONs as a directory...`);
  const metadataDirCid = await pinDirectory(metadataFiles, 'PointCast Visit Nouns Metadata');
  console.log(`✓ metadata dir CID: ${metadataDirCid}`);

  // Pin the contract-level metadata pointing at the directory.
  const contractMeta = buildContractMetadata(metadataDirCid);
  const contractMetaCid = await pinJson(contractMeta, 'PointCast Visit Nouns Contract Metadata');
  console.log(`✓ contract metadata CID: ${contractMetaCid}`);

  console.log('');
  console.log('==========================================');
  console.log('UPLOAD COMPLETE');
  console.log('==========================================');
  console.log(`  metadata_base_cid:  ${metadataDirCid}`);
  console.log(`  contract_metadata:  ipfs://${contractMetaCid}`);
  if (imagesDirCid) console.log(`  images_dir_cid:     ${imagesDirCid}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Originate the FA2 contract with contract metadata URI = ipfs://${contractMetaCid}`);
  console.log(`  2. After origination, call set_metadata_base_cid("${metadataDirCid}") from your admin wallet.`);
  console.log(`  3. Test: https://ipfs.io/ipfs/${metadataDirCid}/137.json should return PointCast Noun #137.`);
  console.log('');

  // Write a small JSON artifact so other scripts (deploy) can read the CIDs
  // without having to re-upload.
  const artifactPath = resolve(__dirname, '../contracts/build/ipfs-cids.json');
  mkdirSync(dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, JSON.stringify({
    metadataDirCid,
    contractMetaCid,
    imagesDirCid,
    generatedAt: new Date().toISOString(),
  }, null, 2));
  console.log(`  Wrote CIDs → ${artifactPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
