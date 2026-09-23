#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ART_DIR,
  BASE,
  BANDMATES_PATH,
  CREATOR,
  METADATA_DIR,
  TOKEN_COUNT,
  buildContractMetadata,
  buildTokenMetadata,
  loadBandmates,
  sha256,
} from './lib/nouns-bandmates-metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pinsPath = path.join(root, 'contracts/nouns-bandmates/pins.json');
const metadataDir = path.join(root, METADATA_DIR);
const pinCount = TOKEN_COUNT * 3 + 1;

function parseArgs(argv) {
  const options = { execute: false, verify: false, provider: 'pinata', help: false };
  for (const arg of argv) {
    if (arg === '--execute') options.execute = true;
    else if (arg === '--verify') options.verify = true;
    else if (arg === '--dry-run') options.execute = false;
    else if (arg === '--help') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  console.log(`Usage: node scripts/nouns-bandmates-pin.mjs [--execute] [--verify]\n\n` +
    `Default is a dry run. --execute is required for network calls and writes pins.json.\n` +
    `Pinata is selected from PINATA_JWT; credentials are never printed.`);
}

async function loadPins() {
  try { return JSON.parse(await readFile(pinsPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; return { version: 1, collection: 'nouns-drum-club-bandmates', images: {}, tokens: {}, contract: null, files: {} }; }
}

function assertCid(cid, label) {
  if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/.test(cid || '')) throw new Error(`${label} returned an invalid CID`);
  return cid;
}

async function pinFile(filePath, mimeType, name) {
  if (!process.env.PINATA_JWT) throw new Error('PINATA_JWT is required for --execute.');
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mimeType }), path.basename(filePath));
  form.append('pinataMetadata', JSON.stringify({ name }));
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', { method: 'POST', headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` }, body: form });
  const body = await response.text();
  if (!response.ok) throw new Error(`Pinata rejected ${name} (${response.status})`);
  let json; try { json = JSON.parse(body); } catch { json = null; }
  return { cid: assertCid(json?.IpfsHash || json?.cid || json?.data?.cid, name), bytes: bytes.length, sha256: sha256(bytes) };
}

async function savePins(pins) { await writeFile(pinsPath, `${JSON.stringify(pins, null, 2)}\n`); }

function recordKey(kind, id, format) { return `${kind}:${id}${format ? `:${format}` : ''}`; }

async function pinRecorded({ pins, key, filePath, mimeType, name, uri }) {
  if (pins.files[key]?.cid) return pins.files[key];
  const result = await pinFile(filePath, mimeType, name);
  const entry = { ...result, path: path.relative(root, filePath), uri, provider: 'pinata' };
  pins.files[key] = entry;
  await savePins(pins);
  return entry;
}

async function verifyPins(pins) {
  const entries = Object.values(pins.files || {});
  if (entries.length !== pinCount) throw new Error(`Expected ${pinCount} records, found ${entries.length}`);
  const gateway = (process.env.IPFS_GATEWAY || 'https://nftstorage.link/ipfs').replace(/\/$/, '');
  for (const entry of entries) {
    const local = await readFile(path.join(root, entry.path));
    const response = await fetch(`${gateway}/${entry.cid}`);
    if (!response.ok) throw new Error(`Gateway returned HTTP ${response.status} for ${entry.cid}`);
    const remote = Buffer.from(await response.arrayBuffer());
    if (!remote.equals(local) || sha256(remote) !== entry.sha256) throw new Error(`Byte/hash mismatch for ${entry.path}`);
  }
  console.log(`Verified ${entries.length}/${pinCount} pinned files byte-for-byte.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();
  const bandmates = await loadBandmates(root);
  if (!options.execute) {
    console.log(`Nouns Drum Club Bandmates ${pinCount}-file plan (dry run; no network, credentials, or writes)`);
    console.log(`Creator: ${CREATOR}`);
    console.log('Phase 1: 12 PNG artifacts + 12 WebP display files.');
    console.log('Phase 2: 12 immutable metadata JSON files.');
    console.log('Phase 3: 1 TZIP-16 contract metadata file.');
    console.log('Use --execute only after the contract, creator address, and pricing policy are approved.');
    return;
  }
  if (options.provider !== 'pinata') throw new Error('Only Pinata is configured for this workflow.');
  await mkdir(metadataDir, { recursive: true });
  const pins = await loadPins();
  pins.version = 1; pins.collection = 'nouns-drum-club-bandmates'; pins.creator = CREATOR; pins.provider = 'pinata';
  for (const bandmate of bandmates) {
    const key = String(bandmate.id);
    pins.images[key] ||= {};
    for (const format of ['png', 'webp']) {
      const filePath = path.join(root, ART_DIR, path.basename(bandmate.artwork[format]));
      const entry = await pinRecorded({ pins, key: recordKey('image', bandmate.id, format), filePath, mimeType: format === 'png' ? 'image/png' : 'image/webp', name: `nouns-bandmate-${bandmate.number}-${format}`, uri: `ipfs://pending/${format}` });
      pins.images[key][format] = entry;
    }
  }
  for (const bandmate of bandmates) {
    const key = String(bandmate.id);
    const metadata = buildTokenMetadata(bandmate, {
      artifactUri: `ipfs://${pins.images[key].png.cid}`,
      displayUri: `ipfs://${pins.images[key].webp.cid}`,
      thumbnailUri: `ipfs://${pins.images[key].webp.cid}`,
    });
    const filePath = path.join(metadataDir, `${key}.json`);
    await writeFile(filePath, `${JSON.stringify(metadata, null, 2)}\n`);
    pins.tokens[key] = await pinRecorded({ pins, key: recordKey('metadata', bandmate.id), filePath, mimeType: 'application/json', name: `nouns-bandmate-${bandmate.number}-metadata`, uri: `ipfs://pending/${key}.json` });
  }
  const contractPath = path.join(metadataDir, 'contract.json');
  await writeFile(contractPath, `${JSON.stringify(buildContractMetadata(`${BASE}${BANDMATES_PATH}metadata/`), null, 2)}\n`);
  pins.contract = await pinRecorded({ pins, key: 'contract', filePath: contractPath, mimeType: 'application/json', name: 'nouns-drum-club-bandmates-contract', uri: 'ipfs://pending/contract.json' });
  pins.count = pinCount; pins.updatedAt = new Date().toISOString();
  await savePins(pins);
  if (options.verify) await verifyPins(pins);
  console.log(`Pinned ${Object.keys(pins.files).length}/${pinCount} files. Manifest: ${path.relative(root, pinsPath)}`);
}

main().catch((error) => { console.error(`[nouns-bandmates-pin] ${error.message}`); process.exitCode = 1; });
