#!/usr/bin/env node
/** Offline only. Imports canonical stills, makes gallery previews, hashes exact
 * artifact/metadata bytes, and creates the reusable TZIP-21 publication package.
 * No secrets, uploads, signatures, minting, or network operations. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const args = process.argv.slice(2);
const verify = args.includes('--verify');
const inputFlag = args.indexOf('--input');
const input = inputFlag < 0 ? null : args[inputFlag + 1];
if (args.some((arg, i) => !['--verify', '--input'].includes(arg) && !(inputFlag >= 0 && i === inputFlag + 1)) || (inputFlag >= 0 && !input)) {
  throw new Error('Usage: node scripts/prepare-other-worlds.mjs [--input DIRECTORY] [--verify]');
}
const series = JSON.parse(await readFile(path.join(root, 'src/data/other-worlds.json'), 'utf8'));
const closesMs = Date.parse(series.closesAt);
if (series.artworks.length !== 9 || series.editionsPerArtwork !== 27 || series.totalEditions !== 243 ||
    !Number.isFinite(closesMs) || new Date(closesMs).toISOString() !== series.closesAt || new Set(series.artworks.map((a) => a.id)).size !== 9) {
  throw new Error('The exhibition must contain exactly nine works, 27 editions each, and an explicit ISO closing instant.');
}
const base = path.join(root, 'public/collectibles/other-worlds');
const images = path.join(root, 'public/images/other-worlds');
if (!verify) {
  await mkdir(path.join(base, 'metadata'), { recursive: true });
  await mkdir(images, { recursive: true });
}
const items = [];
const checksums = [];
const creator = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
for (const art of series.artworks) {
  const imageFile = path.join(images, `${art.slug}.png`);
  const previewFile = path.join(images, `${art.slug}.webp`);
  if (input && !verify) await copyFile(path.join(path.resolve(input), `${art.slug}.png`), imageFile);
  const bytes = await readFile(imageFile);
  const image = await sharp(bytes).metadata();
  if (image.format !== 'png' || image.pages > 1 || image.width !== 1024 || image.height !== 1536) {
    throw new Error(`Invalid canonical still: ${art.slug}; expected 1024x1536 single-frame PNG.`);
  }
  if (bytes.length > 25 * 1024 * 1024) throw new Error(`Asset exceeds Pages file limit: ${art.slug}`);
  if (!verify) await sharp(bytes).resize({ width: 720 }).webp({ quality: 86 }).toFile(previewFile);
  const preview = await readFile(previewFile);
  const artifactUri = `https://pointcast.xyz${art.image}`;
  const metadata = {
    name: `${art.title} — LOS ANGELES / OTHER WORLDS`,
    description: `${art.description} Transmission ${String(art.id).padStart(2, '0')} of nine. ${series.collectionLine} ${series.credit}. Published by Pointcast.`,
    symbol: 'OTHER', decimals: 0, isBooleanAmount: false, shouldPreferSymbol: false,
    creators: [creator], artist: series.artist, credit: series.credit, publisher: series.publisher,
    collection: series.title, collectionLine: series.collectionLine,
    artifactUri, displayUri: artifactUri, thumbnailUri: `https://pointcast.xyz${art.preview}`,
    artifactSha256: hash(bytes),
    formats: [{ uri: artifactUri, mimeType: 'image/png', fileName: `${art.slug}.png`,
      fileSize: bytes.length, dimensions: { value: '1024x1536', unit: 'px' }, sha256: hash(bytes) }],
    tags: ['Los Angeles', 'metaphysical', 'poster', 'still image', 'Other Worlds'],
    attributes: [{ name: 'Transmission', value: String(art.id).padStart(2, '0') },
      { name: 'Editions', value: '27' }, { name: 'City', value: 'Los Angeles' },
      { name: 'Medium', value: 'AI-assisted digital poster; canonical still PNG' }],
    editionSupply: 27,
    sourceDisclosure: 'Art direction by Michael Hoydich; produced with Codex built-in image generation.',
    rights: 'Copyright Michael Hoydich. Collecting an edition does not transfer copyright.',
    provenance: { schema: 'pointcast.other-worlds.artwork/v1', algorithm: 'SHA-256',
      canonicalStill: true, artifactSha256: hash(bytes), exhibition: 'https://pointcast.xyz/other-worlds' },
  };
  const metadataBytes = json(metadata);
  const metadataSha256 = hash(metadataBytes);
  const metadataUri = `https://pointcast.xyz/collectibles/other-worlds/metadata/${metadataSha256}.json`;
  const numericMetadataFile = path.join(base, 'metadata', `${art.id}.json`);
  const addressedMetadataFile = path.join(base, 'metadata', `${metadataSha256}.json`);
  if (verify) {
    for (const file of [numericMetadataFile, addressedMetadataFile]) {
      if (hash(await readFile(file)) !== metadataSha256) throw new Error(`Metadata bytes changed: ${file}`);
    }
  } else {
    await writeFile(numericMetadataFile, metadataBytes);
    await writeFile(addressedMetadataFile, metadataBytes);
  }
  items.push({ id: art.id, slug: art.slug, title: art.title, editions: 27, artifactUri,
    artifactSha256: hash(bytes), metadataUri, metadataSha256,
    previewUri: `https://pointcast.xyz${art.preview}`, previewSha256: hash(preview),
    width: image.width, height: image.height, bytes: bytes.length });
  checksums.push(`${hash(bytes)}  images/other-worlds/${art.slug}.png`,
    `${hash(preview)}  images/other-worlds/${art.slug}.webp`,
    `${metadataSha256}  collectibles/other-worlds/metadata/${art.id}.json`,
    `${metadataSha256}  collectibles/other-worlds/metadata/${metadataSha256}.json`);
}
const manifest = { schema: 'pointcast.other-worlds.provenance/v1', collection: series.id,
  title: series.title, artist: series.artist, credit: series.credit, publisher: series.publisher,
  collectionLine: series.collectionLine, closesAt: series.closesAt,
  editionSupply: 243, editionSupplyPerArtwork: 27,
  canonicalImages: 'still PNG', generatedWith: 'Codex built-in image generator',
  publicationStatus: 'prepared; not minted', items };
const files = [path.join(base, 'manifest.json'), path.join(root, 'src/data/other-worlds-provenance.json')];
for (const file of files) {
  if (verify) {
    if ((await readFile(file, 'utf8')) !== json(manifest)) throw new Error(`Manifest mismatch: ${file}`);
  } else await writeFile(file, json(manifest));
}
const sums = checksums.join('\n') + '\n';
if (verify) {
  if (await readFile(path.join(base, 'SHA256SUMS'), 'utf8') !== sums) throw new Error('Checksum listing mismatch');
} else await writeFile(path.join(base, 'SHA256SUMS'), sums);
console.log(`${verify ? 'Verified' : 'Prepared'} 9 canonical PNGs, 9 previews, 9 TZIP-21 records, content-addressed metadata, and SHA-256 manifest. No chain action.`);
