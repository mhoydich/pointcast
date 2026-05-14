import contracts from '../data/contracts.json';

const polygonBellConfig = (contracts as any).polygon_bell ?? {};
const polygonBellAddress = typeof polygonBellConfig.polygon === 'string'
  && /^0x[a-fA-F0-9]{40}$/.test(polygonBellConfig.polygon)
  ? polygonBellConfig.polygon as `0x${string}`
  : null;

export const POLYGON_BELL_TOKEN = {
  slug: 'polygon-bell',
  name: 'PointCast Polygon Bell #001',
  shortName: 'Polygon Bell',
  symbol: 'PCBELL',
  tokenId: '1',
  chain: 'Polygon',
  chainId: 137,
  chainHex: '0x89',
  standard: 'ERC-1155-ready',
  status: polygonBellAddress ? 'mint-ready' : 'wallet-publish-ready',
  contract: polygonBellAddress,
  editionCap: 100,
  unlockRings: 5,
  imagePath: '/images/polygon-bell-token.svg',
  pageHref: '/polygon-bell',
  publishHref: '/polygon-bell#publish',
  metadataHref: '/polygon-bell/1.json',
  sourceHref: '/lobby#noun-bells',
  projectLead: 'Codex',
  updatedAt: '2026-05-14',
} as const;

export const POLYGON_BELL_ATTRIBUTES = [
  { trait_type: 'Instrument', value: 'Nouns Bell Ladder' },
  { trait_type: 'Unlock', value: `${POLYGON_BELL_TOKEN.unlockRings} unique rungs` },
  { trait_type: 'Network', value: POLYGON_BELL_TOKEN.chain },
  { trait_type: 'Chain ID', value: String(POLYGON_BELL_TOKEN.chainId) },
  { trait_type: 'Edition Cap', value: String(POLYGON_BELL_TOKEN.editionCap) },
  { trait_type: 'Status', value: POLYGON_BELL_TOKEN.status },
] as const;

export function polygonBellAbsoluteUrl(path: string, site?: URL | string | null): string {
  const base = site ? new URL(String(site)) : new URL('https://pointcast.xyz');
  return new URL(path, base).href;
}

export function polygonBellMetadata(site?: URL | string | null) {
  const pageUrl = polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.pageHref, site);
  return {
    name: POLYGON_BELL_TOKEN.name,
    description:
      'A PointCast collectible earned by ringing five unique rungs on the lobby Nouns Bell Ladder. Polygon-ready metadata for the first bell token.',
    image: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.imagePath, site),
    external_url: pageUrl,
    animation_url: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.sourceHref, site),
    proof_publish_url: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.publishHref, site),
    background_color: 'FFF8E6',
    attributes: POLYGON_BELL_ATTRIBUTES,
    properties: {
      token_id: POLYGON_BELL_TOKEN.tokenId,
      symbol: POLYGON_BELL_TOKEN.symbol,
      standard: POLYGON_BELL_TOKEN.standard,
      chain: POLYGON_BELL_TOKEN.chain,
      chain_id: POLYGON_BELL_TOKEN.chainId,
      contract: POLYGON_BELL_TOKEN.contract,
      edition_cap: POLYGON_BELL_TOKEN.editionCap,
      source: pageUrl,
    },
  };
}
