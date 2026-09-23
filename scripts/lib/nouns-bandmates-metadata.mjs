import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const CREATOR = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
export const BASE = 'https://pointcast.xyz';
export const BANDMATES_PATH = '/nouns/drum-club/bandmates/';
export const ART_DIR = 'public/images/nouns-drum-club/bandmates';
export const METADATA_DIR = 'contracts/nouns-bandmates/metadata';
export const CONTENT_ART_DIR = 'public/collectibles/nouns-bandmates/art';
export const TOKEN_COUNT = 12;

export async function loadBandmates(root) {
  const raw = JSON.parse(await readFile(path.join(root, 'src/data/nouns-drum-club-bandmates.json'), 'utf8'));
  if (!Array.isArray(raw) || raw.length !== TOKEN_COUNT) throw new Error(`Expected ${TOKEN_COUNT} canonical Bandmates`);
  return raw;
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function canonicalScoreBytes(score) {
  return Buffer.from(JSON.stringify(score));
}

export function scoreSha256(score) {
  return sha256(canonicalScoreBytes(score));
}

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function playUrl(bandmate, base = BASE) {
  const url = new URL('/nouns/drum-club/', base);
  url.searchParams.set('beat', base64Url(bandmate.score));
  return url.href;
}

export function buildTokenMetadata(bandmate, {
  artifactUri = `${BASE}${bandmate.artwork.png}`,
  displayUri = `${BASE}${bandmate.artwork.webp}`,
  thumbnailUri = `${BASE}${bandmate.artwork.webp}`,
  metadataUri = `${BASE}${BANDMATES_PATH}metadata/${bandmate.id}.json`,
  provenanceUri = `${BASE}/images/nouns-drum-club/bandmates/provenance.json`,
} = {}) {
  const externalUri = playUrl(bandmate);
  return {
    name: `Nouns Drum Club Bandmate ${bandmate.number} · ${bandmate.name}`,
    symbol: 'NCBM',
    decimals: 0,
    isBooleanAmount: false,
    description: `${bandmate.description} Play the ${bandmate.role} part in the Nouns Drum Club.`,
    displayUri,
    thumbnailUri,
    artifactUri,
    mime: 'image/png',
    creators: [CREATOR],
    contributors: [CREATOR],
    publishers: ['PointCast'],
    date: '2026-09-22T00:00:00Z',
    language: 'en',
    rights: 'Underlying Noun artwork is CC0. The PointCast Bandmate card and score are presented for remixing; no additional rights transfer is stated.',
    rightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    formats: [
      { uri: artifactUri, mimeType: 'image/png', dimensions: { value: '1600x1600', unit: 'px' } },
      { uri: displayUri, mimeType: 'image/webp', dimensions: { value: '800x800', unit: 'px' } },
      { uri: `${BASE}${bandmate.artwork.svg}`, mimeType: 'image/svg+xml' },
    ],
    attributes: [
      { name: 'Collection', value: 'Nouns Drum Club Bandmates' },
      { name: 'Bandmate number', value: bandmate.number },
      { name: 'Catalog ID', value: String(bandmate.id) },
      { name: 'Source Noun ID', value: String(bandmate.nounId) },
      { name: 'Role', value: bandmate.role },
      { name: 'BPM', value: String(bandmate.tempo) },
      { name: 'Swing', value: String(bandmate.swing) },
      { name: 'Score version', value: String(bandmate.score.version) },
      { name: 'Steps', value: '16' },
    ],
    tags: ['pointcast', 'nouns', 'nouns-drum-club', 'bandmate', bandmate.role, 'music', 'remix', 'tezos'],
    homepage: `${BASE}${BANDMATES_PATH}`,
    externalUri,
    playUri: externalUri,
    metadataUri,
    sourceArtworkUri: `https://noun.pics/${bandmate.nounId}.svg`,
    sourceArtworkRights: 'Creative Commons CC0 1.0 Universal',
    sourceArtworkRightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    provenanceUri,
    score: bandmate.score,
  };
}

export async function buildOnchainMetadata(bandmate, { root, artBase = `${BASE}/collectibles/nouns-bandmates/art` } = {}) {
  if (!root) throw new Error('buildOnchainMetadata requires the repository root');
  const pngBytes = await readFile(path.join(root, 'public', bandmate.artwork.png));
  const webpBytes = await readFile(path.join(root, 'public', bandmate.artwork.webp));
  const pngHash = sha256(pngBytes);
  const webpHash = sha256(webpBytes);
  const artifactUri = `${artBase}/${pngHash}.png`;
  const displayUri = `${artBase}/${webpHash}.webp`;
  const scoreHash = scoreSha256(bandmate.score);
  const rich = buildTokenMetadata(bandmate, {
    artifactUri,
    displayUri,
    thumbnailUri: displayUri,
    metadataUri: `tezos-storage:bandmate-${bandmate.id}`,
  });
  // The contract stores this compact immutable form. The exact score remains
  // in externalUri; artwork hashes make the two content-addressed files auditable.
  const metadata = {
    name: rich.name,
    symbol: rich.symbol,
    decimals: 0,
    isBooleanAmount: false,
    artifactUri,
    displayUri,
    mime: 'image/png',
    creators: [CREATOR],
    externalUri: `${BASE}${BANDMATES_PATH}play/${scoreHash}/`,
    scoreSha256: scoreHash,
    artifactSha256: pngHash,
    displaySha256: webpHash,
    attributes: [
      { name: 'Source Noun ID', value: String(bandmate.nounId) },
      { name: 'Role', value: bandmate.role },
      { name: 'BPM', value: String(bandmate.tempo) },
    ],
    underlyingNoun: { id: bandmate.nounId, rights: 'CC0 1.0' },
    rights: 'Underlying Noun artwork is CC0; no additional rights transfer is stated.',
  };
  const json = `${JSON.stringify(metadata)}\n`;
  return {
    id: bandmate.id,
    key: `bandmate-${bandmate.id}`,
    uri: `tezos-storage:bandmate-${bandmate.id}`,
    metadata,
    json,
    metadataHash: sha256(Buffer.from(json)),
    artwork: {
      png: { source: path.join(root, 'public', bandmate.artwork.png), destination: path.join(root, CONTENT_ART_DIR, `${pngHash}.png`), hash: pngHash, bytes: pngBytes.length },
      webp: { source: path.join(root, 'public', bandmate.artwork.webp), destination: path.join(root, CONTENT_ART_DIR, `${webpHash}.webp`), hash: webpHash, bytes: webpBytes.length },
    },
  };
}

export function buildContractMetadata(metadataBaseUri = 'tezos-storage:bandmate-') {
  return {
    name: 'Nouns Drum Club Bandmates',
    description: 'Twelve playable Nouns Drum Club companions with original scores, artwork, and remix links.',
    version: '1.0.0',
    interfaces: ['TZIP-012', 'TZIP-016', 'TZIP-021'],
    homepage: `${BASE}${BANDMATES_PATH}`,
    authors: [`PointCast <${BASE}>`],
    source: { tools: ['SmartPy'], location: 'https://github.com/MikeHoydich/pointcast' },
    metadata_base_uri: metadataBaseUri,
    metadata_mode: 'tezos-storage',
    token_uri_pattern: 'tezos-storage:bandmate-{token_id}',
  };
}
