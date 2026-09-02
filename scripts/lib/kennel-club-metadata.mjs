import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const TOKEN_COUNT = 30;
export const TREASURY_PLACEHOLDER = '__KENNEL_CLUB_TREASURY_ADDRESS__';
export const CONTRACT_METADATA_CID_PLACEHOLDER = '__KENNEL_CLUB_CONTRACT_METADATA_CID__';

export function imageCidPlaceholder(tokenId, format) {
  return `__KENNEL_CLUB_${String(tokenId).padStart(2, '0')}_${format.toUpperCase()}_CID__`;
}

export function tokenCidPlaceholder(tokenId) {
  return `__KENNEL_CLUB_${String(tokenId).padStart(2, '0')}_TOKEN_METADATA_CID__`;
}

export async function loadKennelClubSeries(root) {
  const source = path.join(root, 'src/data/kennel-club-september-sitting.json');
  return JSON.parse(await readFile(source, 'utf8'));
}

export function buildTokenMetadata(sitting, options = {}) {
  const tokenId = sitting.tokenId;
  const pngCid = options.pngCid || imageCidPlaceholder(tokenId, 'png');
  const webpCid = options.webpCid || imageCidPlaceholder(tokenId, 'webp');
  const treasury = options.treasury || TREASURY_PLACEHOLDER;
  const pngUri = `ipfs://${pngCid}`;
  const webpUri = `ipfs://${webpCid}`;

  return {
    name: sitting.tokenMetadata.name,
    description: sitting.tokenMetadata.description,
    tags: [...sitting.tags],
    attributes: [
      { name: 'breed', value: sitting.breed },
      { name: 'wardrobe', value: sitting.wardrobe },
      { name: 'title', value: sitting.title },
      { name: 'sitting', value: String(sitting.day).padStart(2, '0') },
      { name: 'mintDate', value: sitting.mintDate },
    ],
    artifactUri: pngUri,
    displayUri: webpUri,
    thumbnailUri: webpUri,
    formats: [
      {
        uri: pngUri,
        mimeType: 'image/png',
        fileName: `${sitting.slug}.png`,
        dimensions: { value: `${sitting.image.width}x${sitting.image.height}`, unit: 'px' },
      },
      {
        uri: webpUri,
        mimeType: 'image/webp',
        fileName: `${sitting.slug}.webp`,
        dimensions: { value: `${sitting.image.width}x${sitting.image.height}`, unit: 'px' },
      },
    ],
    decimals: 0,
    creators: [treasury],
  };
}

export function buildContractMetadata() {
  return {
    name: 'Kennel Club · The September Sitting',
    description: 'Thirty daily dog portrait sittings for September 2026, issued as a Tezos FA2 collection with per-day mint windows.',
    version: '1.0.0',
    license: { name: 'CC0-1.0' },
    interfaces: ['TZIP-012', 'TZIP-016', 'TZIP-021'],
  };
}

export async function writeMetadataSet(root, options = {}) {
  const series = options.series || await loadKennelClubSeries(root);
  if (series.sittings?.length !== TOKEN_COUNT) {
    throw new Error(`Expected ${TOKEN_COUNT} sittings, found ${series.sittings?.length ?? 0}`);
  }

  const metadataDir = path.join(root, 'contracts/kennel-club/metadata');
  await mkdir(metadataDir, { recursive: true });

  for (const sitting of series.sittings) {
    const media = options.media?.[String(sitting.tokenId)] || {};
    const metadata = buildTokenMetadata(sitting, {
      ...media,
      treasury: options.treasury,
    });
    await writeFile(
      path.join(metadataDir, `${sitting.tokenId}.json`),
      `${JSON.stringify(metadata, null, 2)}\n`,
    );
  }

  await writeFile(
    path.join(metadataDir, 'contract.json'),
    `${JSON.stringify(buildContractMetadata(), null, 2)}\n`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  await writeMetadataSet(root);
  console.log(`Wrote ${TOKEN_COUNT} token metadata files and contract metadata.`);
}
