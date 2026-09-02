#!/usr/bin/env node

import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TOKEN_COUNT,
  buildContractMetadata,
  buildTokenMetadata,
  loadKennelClubSeries,
} from './lib/kennel-club-metadata.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PINS_PATH = path.join(ROOT, 'contracts/kennel-club/pins.json');
const METADATA_DIR = path.join(ROOT, 'contracts/kennel-club/metadata');
const CONTRACT_METADATA_PATH = path.join(METADATA_DIR, 'contract.json');
const IMAGE_DIR = path.join(ROOT, 'public/images/kennel-club/september-sitting');
const DEFAULT_TREASURY = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';

function parseArgs(argv) {
  const options = { dryRun: false, verify: false, verifyOnly: false, provider: null, treasury: DEFAULT_TREASURY };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--verify') options.verify = true;
    else if (arg === '--verify-only') options.verifyOnly = true;
    else if (arg === '--provider') options.provider = argv[++i];
    else if (arg === '--treasury') options.treasury = argv[++i];
    else if (arg === '--help') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (options.provider && !['pinata', 'nft-storage'].includes(options.provider)) {
    throw new Error('--provider must be pinata or nft-storage');
  }
  if (!/^tz[123][1-9A-HJ-NP-Za-km-z]{33}$/.test(options.treasury)) {
    throw new Error(`Invalid --treasury Tezos address: ${options.treasury}`);
  }
  return options;
}

function usage() {
  console.log(`Usage: node scripts/kennel-club-pin.mjs [options]\n\n` +
    `  --dry-run              Print the 91-file plan; make no network calls or writes\n` +
    `  --provider NAME         pinata or nft-storage (auto-selected from env otherwise)\n` +
    `  --treasury tz...        TZIP-21 creator address (default: Mike's active Kukai)\n` +
    `  --verify               Fetch every CID and compare it byte-for-byte after pinning\n` +
    `  --verify-only          Verify the existing pins.json without pinning\n\n` +
    `Environment: PINATA_JWT or NFT_STORAGE_KEY; optional IPFS_GATEWAY.`);
}

function providerFromEnv(requested) {
  if (requested === 'pinata') {
    if (!process.env.PINATA_JWT) throw new Error('PINATA_JWT is required for --provider pinata.');
    return 'pinata';
  }
  if (requested === 'nft-storage') {
    if (!process.env.NFT_STORAGE_KEY) throw new Error('NFT_STORAGE_KEY is required for --provider nft-storage.');
    return 'nft-storage';
  }
  if (process.env.PINATA_JWT) return 'pinata';
  if (process.env.NFT_STORAGE_KEY) return 'nft-storage';
  throw new Error('No pinning credential found. Set PINATA_JWT or NFT_STORAGE_KEY (dry-run does not require one).');
}

async function loadPins() {
  try {
    return JSON.parse(await readFile(PINS_PATH, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return { version: 1, series: 'kennel-club-september-sitting-2026', images: {}, tokens: {}, contract: null };
  }
}

async function savePins(pins) {
  await writeFile(PINS_PATH, `${JSON.stringify(pins, null, 2)}\n`);
}

function assertCid(cid, label) {
  if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/.test(cid || '')) {
    throw new Error(`${label} returned an invalid IPFS CID: ${JSON.stringify(cid)}`);
  }
  return cid;
}

async function pinFile(provider, filePath, mimeType, pinName) {
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mimeType }), path.basename(filePath));

  let url;
  let headers;
  if (provider === 'pinata') {
    url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    headers = { Authorization: `Bearer ${process.env.PINATA_JWT}` };
    form.append('pinataMetadata', JSON.stringify({ name: pinName }));
    form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));
  } else {
    url = 'https://api.nft.storage/upload';
    headers = { Authorization: `Bearer ${process.env.NFT_STORAGE_KEY}` };
  }

  const response = await fetch(url, { method: 'POST', headers, body: form });
  const body = await response.text();
  let json;
  try { json = JSON.parse(body); } catch { json = null; }
  if (!response.ok) {
    throw new Error(`${provider} rejected ${pinName} (${response.status}): ${body.slice(0, 500)}`);
  }
  const cid = json?.IpfsHash || json?.value?.cid || json?.data?.cid || json?.cid;
  return { cid: assertCid(cid, pinName), bytes: bytes.length };
}

async function pinAndRecord({ provider, filePath, mimeType, pinName, existing, record }) {
  if (existing?.cid) {
    console.log(`[skip] ${pinName} -> ${existing.cid}`);
    return existing;
  }
  console.log(`[pin] ${pinName}`);
  const result = await pinFile(provider, filePath, mimeType, pinName);
  const entry = {
    cid: result.cid,
    path: path.relative(ROOT, filePath),
    mimeType,
    bytes: result.bytes,
    provider,
    pinnedAt: new Date().toISOString(),
  };
  await record(entry);
  console.log(`[ok]  ${pinName} -> ${entry.cid}`);
  return entry;
}

function allPinEntries(pins) {
  const entries = [];
  for (let tokenId = 0; tokenId < TOKEN_COUNT; tokenId += 1) {
    const image = pins.images?.[String(tokenId)];
    if (image?.png) entries.push(image.png);
    if (image?.webp) entries.push(image.webp);
    if (pins.tokens?.[String(tokenId)]) entries.push(pins.tokens[String(tokenId)]);
  }
  if (pins.contract) entries.push(pins.contract);
  return entries;
}

async function verifyPins(pins) {
  const entries = allPinEntries(pins);
  if (entries.length !== 91) throw new Error(`pins.json has ${entries.length}/91 CID records; pinning is incomplete.`);
  const gateway = (process.env.IPFS_GATEWAY || 'https://nftstorage.link/ipfs').replace(/\/$/, '');
  for (const entry of entries) {
    const local = await readFile(path.join(ROOT, entry.path));
    const response = await fetch(`${gateway}/${entry.cid}`);
    if (!response.ok) throw new Error(`Gateway verification failed for ${entry.cid}: HTTP ${response.status}`);
    const remote = Buffer.from(await response.arrayBuffer());
    if (!local.equals(remote)) throw new Error(`CID content mismatch: ${entry.path} != ${entry.cid}`);
    console.log(`[verify] ${entry.path} == ${entry.cid}`);
  }
  console.log('Verified 91/91 pinned files byte-for-byte.');
}

async function dryRun(series, options) {
  console.log('Kennel Club 91-file plan (no writes, no network calls)');
  console.log(`Provider: ${options.provider || (process.env.PINATA_JWT ? 'pinata' : process.env.NFT_STORAGE_KEY ? 'nft-storage' : 'not selected')}`);
  console.log(`Creator/treasury: ${options.treasury}`);
  console.log('Phase 1: pin 30 PNG artifacts and 30 WebP display files.');
  for (const sitting of series.sittings) console.log(`  ${sitting.tokenId}: ${sitting.slug}.png + ${sitting.slug}.webp`);
  console.log('Phase 2: rewrite image CID and treasury placeholders, then pin metadata/0.json through metadata/29.json.');
  console.log('Phase 3: pin contract.json and write all 91 CID records to pins.json.');
  console.log('Nothing was pinned or modified.');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();
  const series = await loadKennelClubSeries(ROOT);
  if (series.sittings.length !== TOKEN_COUNT) throw new Error(`Expected 30 sittings, found ${series.sittings.length}`);
  if (options.dryRun) return dryRun(series, options);

  const pins = await loadPins();
  if (options.verifyOnly) return verifyPins(pins);
  const provider = providerFromEnv(options.provider);
  const hasPinnedTokens = Object.values(pins.tokens || {}).some((entry) => entry?.cid);
  if (hasPinnedTokens && pins.treasury && pins.treasury !== options.treasury) {
    throw new Error(`pins.json already contains token metadata for treasury ${pins.treasury}; refusing to mix creator addresses.`);
  }
  pins.provider = provider;
  pins.treasury = options.treasury;
  pins.updatedAt = new Date().toISOString();
  await savePins(pins);

  for (const sitting of series.sittings) {
    const key = String(sitting.tokenId);
    pins.images[key] ||= {};
    for (const format of ['png', 'webp']) {
      const filePath = path.join(IMAGE_DIR, `${sitting.slug}.${format}`);
      await stat(filePath);
      const entry = await pinAndRecord({
        provider,
        filePath,
        mimeType: format === 'png' ? 'image/png' : 'image/webp',
        pinName: `kennel-club-${sitting.slug}.${format}`,
        existing: pins.images[key][format],
        record: async (value) => { pins.images[key][format] = value; await savePins(pins); },
      });
      pins.images[key][format] = entry;
    }
  }

  for (const sitting of series.sittings) {
    const key = String(sitting.tokenId);
    const metadata = buildTokenMetadata(sitting, {
      pngCid: pins.images[key].png.cid,
      webpCid: pins.images[key].webp.cid,
      treasury: options.treasury,
    });
    const filePath = path.join(METADATA_DIR, `${key}.json`);
    await writeFile(filePath, `${JSON.stringify(metadata, null, 2)}\n`);
    pins.tokens[key] = await pinAndRecord({
      provider,
      filePath,
      mimeType: 'application/json',
      pinName: `kennel-club-token-${key}.json`,
      existing: pins.tokens[key],
      record: async (value) => { pins.tokens[key] = value; await savePins(pins); },
    });
  }

  await writeFile(CONTRACT_METADATA_PATH, `${JSON.stringify(buildContractMetadata(), null, 2)}\n`);
  pins.contract = await pinAndRecord({
    provider,
    filePath: CONTRACT_METADATA_PATH,
    mimeType: 'application/json',
    pinName: 'kennel-club-contract.json',
    existing: pins.contract,
    record: async (value) => { pins.contract = value; await savePins(pins); },
  });
  pins.completedAt = new Date().toISOString();
  await savePins(pins);
  console.log(`Pinned 91 files. Manifest: ${path.relative(ROOT, PINS_PATH)}`);
  if (options.verify) await verifyPins(pins);
}

main().catch((error) => {
  console.error(`[kennel-club-pin] ${error.message}`);
  process.exitCode = 1;
});
