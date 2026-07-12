import { M as MORNING_OCEAN_TOKENS, a as MORNING_OCEAN_STYLE_PROMPT } from './morning-ocean__lLVjAWo.mjs';

const MORNING_OCEAN_VERSION = "0.1.0";
const MORNING_OCEAN_SYMBOL = "PCOCEAN";
const MORNING_OCEAN_STORAGE_KEYS = {
  collection: "pc:morning-ocean:collection",
  selected: "pc:morning-ocean:selected-token"
};
const MORNING_OCEAN_BASE_URL = "https://pointcast.xyz";
const MORNING_OCEAN_METADATA_BASE = `${MORNING_OCEAN_BASE_URL}/api/morning-ocean-metadata`;
const MORNING_OCEAN_COVER_IMAGE = "/images/morning-ocean/series-contact-sheet.png";
function morningOceanAbsoluteImageUrl(token) {
  return `${MORNING_OCEAN_BASE_URL}${token.imageUrl}`;
}
function morningOceanMetadataUrl(token) {
  return `${MORNING_OCEAN_METADATA_BASE}/${token.tokenId}.json`;
}
function buildMorningOceanManifest() {
  const tokens = MORNING_OCEAN_TOKENS.map((token) => ({
    ...token,
    imageUrl: morningOceanAbsoluteImageUrl(token),
    localImageUrl: token.imageUrl,
    metadataUrl: morningOceanMetadataUrl(token),
    externalUrl: `${MORNING_OCEAN_BASE_URL}/morning-ocean#token-${token.tokenId}`
  }));
  return {
    version: MORNING_OCEAN_VERSION,
    title: "Morning Ocean",
    slug: "morning-ocean",
    symbol: MORNING_OCEAN_SYMBOL,
    description: "A 24-piece PointCast collectible NFT series: morning water, boats on the horizon, quiet planets, oil tankers, sailboats, ferries, and luxury vessels.",
    coverImage: `${MORNING_OCEAN_BASE_URL}${MORNING_OCEAN_COVER_IMAGE}`,
    count: tokens.length,
    storageKeys: MORNING_OCEAN_STORAGE_KEYS,
    stylePrompt: MORNING_OCEAN_STYLE_PROMPT,
    tezos: {
      standard: "FA2 / TZIP-21",
      metadataBase: MORNING_OCEAN_METADATA_BASE,
      mintEntrypoint: "mint_ocean",
      tokenIdScheme: "1..24, row-wise from the generated Morning Ocean collector sheet",
      defaultMintPriceMutez: 0
    },
    tokens
  };
}

export { MORNING_OCEAN_SYMBOL as M, MORNING_OCEAN_STORAGE_KEYS as a, buildMorningOceanManifest as b, MORNING_OCEAN_COVER_IMAGE as c };
