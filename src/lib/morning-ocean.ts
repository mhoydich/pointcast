import {
  MORNING_OCEAN_STYLE_PROMPT,
  MORNING_OCEAN_TOKENS,
  morningOceanTokenById,
  type MorningOceanToken,
} from '../data/morning-ocean';

export const MORNING_OCEAN_VERSION = '0.1.0';
export const MORNING_OCEAN_SYMBOL = 'PCOCEAN';
export const MORNING_OCEAN_STORAGE_KEYS = {
  collection: 'pc:morning-ocean:collection',
  selected: 'pc:morning-ocean:selected-token',
} as const;

export const MORNING_OCEAN_BASE_URL = 'https://pointcast.xyz';
export const MORNING_OCEAN_METADATA_BASE = `${MORNING_OCEAN_BASE_URL}/api/morning-ocean-metadata`;
export const MORNING_OCEAN_COVER_IMAGE = '/images/morning-ocean/series-contact-sheet.png';

export function morningOceanAbsoluteImageUrl(token: MorningOceanToken): string {
  return `${MORNING_OCEAN_BASE_URL}${token.imageUrl}`;
}

export function morningOceanMetadataUrl(token: MorningOceanToken): string {
  return `${MORNING_OCEAN_METADATA_BASE}/${token.tokenId}.json`;
}

export function getMorningOceanToken(tokenId: number): MorningOceanToken | undefined {
  return morningOceanTokenById(tokenId);
}

export function buildMorningOceanManifest() {
  const tokens = MORNING_OCEAN_TOKENS.map((token) => ({
    ...token,
    imageUrl: morningOceanAbsoluteImageUrl(token),
    localImageUrl: token.imageUrl,
    metadataUrl: morningOceanMetadataUrl(token),
    externalUrl: `${MORNING_OCEAN_BASE_URL}/morning-ocean#token-${token.tokenId}`,
  }));

  return {
    version: MORNING_OCEAN_VERSION,
    title: 'Morning Ocean',
    slug: 'morning-ocean',
    symbol: MORNING_OCEAN_SYMBOL,
    description:
      'A 24-piece PointCast collectible NFT series: morning water, boats on the horizon, quiet planets, oil tankers, sailboats, ferries, and luxury vessels.',
    coverImage: `${MORNING_OCEAN_BASE_URL}${MORNING_OCEAN_COVER_IMAGE}`,
    count: tokens.length,
    storageKeys: MORNING_OCEAN_STORAGE_KEYS,
    stylePrompt: MORNING_OCEAN_STYLE_PROMPT,
    tezos: {
      standard: 'FA2 / TZIP-21',
      metadataBase: MORNING_OCEAN_METADATA_BASE,
      mintEntrypoint: 'mint_ocean',
      tokenIdScheme: '1..24, row-wise from the generated Morning Ocean collector sheet',
      defaultMintPriceMutez: 0,
    },
    tokens,
  };
}
