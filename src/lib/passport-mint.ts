import contracts from '../data/contracts.json';
import { POINTCAST_IMAGE_GENERATOR } from './image-generation';

type StampLike = {
  slug: string;
  code: string;
  name: string;
  shortName: string;
  miles: number;
  direction: string;
  band: string;
  prompt: string;
  proof: string;
  reward: string;
  routeNote: string;
  localAction: string;
  color: string;
};

const visitNouns = (contracts as any).visit_nouns ?? {};
const passportStamps = (contracts as any).passport_stamps ?? {};
const passportStampContract = String(passportStamps.mainnet ?? '');

export const PASSPORT_STAMP_PRD_PATH = '/docs/prd/2026-04-21-passport-stamps-tezos.md';

export const PASSPORT_STAMP_COLLECTION = {
  name: 'PointCast Passport Stamps',
  chain: 'tezos',
  network: 'mainnet',
  standard: 'FA2',
  status: passportStampContract ? 'live' : 'prd-ready-contract-pending',
  contract: passportStampContract,
  entrypoint: 'mint_stamp',
  tokenModel: 'one tokenId per station stamp; open editions unless Mike caps a route',
  mintPriceMutez: Number(passportStamps.mintPriceMutez ?? 0),
  source: 'contracts/v2/passport_stamps_fa2.py',
  deployNotes: 'contracts/v2/DEPLOY_NOTES_PASSPORT_STAMPS.md',
  prd: PASSPORT_STAMP_PRD_PATH,
} as const;

export const PASSPORT_COMPANION_COLLECTION = {
  name: 'PointCast Visit Nouns',
  chain: 'tezos',
  network: 'mainnet',
  standard: 'FA2',
  status: visitNouns.mainnet ? 'live' : 'not-configured',
  contract: String(visitNouns.mainnet ?? ''),
  entrypoint: 'mint_noun',
  mintPriceMutez: Number(visitNouns.mintPriceMutez ?? 0),
} as const;

export function passportCompanionNounId(stamp: StampLike): number {
  const n = Number(stamp.code.replace(/^P/i, ''));
  return 900 + (Number.isFinite(n) ? n : 0);
}

export function passportStampTokenId(stamp: StampLike): number {
  const n = Number(stamp.code.replace(/^P/i, ''));
  return Number.isFinite(n) ? n : 0;
}

export function passportStampArtUrl(stamp: StampLike, absolute = true): string {
  const path = `/passport/art/${stamp.slug}.svg`;
  return absolute ? `https://pointcast.xyz${path}` : path;
}

export function passportStampMetadataUrl(stamp: StampLike, absolute = true): string {
  const path = `/passport/stamps/${stamp.slug}.json`;
  return absolute ? `https://pointcast.xyz${path}` : path;
}

export function passportStampMintPlan(stamp: StampLike) {
  const stampTokenId = passportStampTokenId(stamp);
  const companionTokenId = passportCompanionNounId(stamp);
  const companionContract = PASSPORT_COMPANION_COLLECTION.contract;
  const nativeContract = PASSPORT_STAMP_COLLECTION.contract;
  const nativeReady = nativeContract.startsWith('KT1');
  const native = {
    label: 'Mint station stamp',
    mode: 'passport-stamp-native',
    chain: PASSPORT_STAMP_COLLECTION.chain,
    network: PASSPORT_STAMP_COLLECTION.network,
    standard: PASSPORT_STAMP_COLLECTION.standard,
    contract: nativeContract || null,
    entrypoint: PASSPORT_STAMP_COLLECTION.entrypoint,
    tokenId: stampTokenId,
    code: stamp.code,
    priceMutez: PASSPORT_STAMP_COLLECTION.mintPriceMutez,
    priceLabel: PASSPORT_STAMP_COLLECTION.mintPriceMutez === 0 ? 'gas only' : `${PASSPORT_STAMP_COLLECTION.mintPriceMutez} mutez`,
    tzkt: nativeContract ? `https://tzkt.io/${nativeContract}/tokens/${stampTokenId}` : null,
    objkt: nativeContract ? `https://objkt.com/tokens/${nativeContract}/${stampTokenId}` : null,
    metadataUri: passportStampMetadataUrl(stamp),
    artifactUri: passportStampArtUrl(stamp),
  };
  const companion = {
    label: 'Mint Tezos proof',
    mode: 'visit-noun-companion',
    chain: PASSPORT_COMPANION_COLLECTION.chain,
    network: PASSPORT_COMPANION_COLLECTION.network,
    standard: PASSPORT_COMPANION_COLLECTION.standard,
    contract: companionContract || null,
    entrypoint: PASSPORT_COMPANION_COLLECTION.entrypoint,
    tokenId: companionTokenId,
    priceMutez: PASSPORT_COMPANION_COLLECTION.mintPriceMutez,
    priceLabel: PASSPORT_COMPANION_COLLECTION.mintPriceMutez === 0 ? 'gas only' : `${PASSPORT_COMPANION_COLLECTION.mintPriceMutez} mutez`,
    tzkt: companionContract ? `https://tzkt.io/${companionContract}/tokens/${companionTokenId}` : null,
    objkt: companionContract ? `https://objkt.com/tokens/${companionContract}/${companionTokenId}` : null,
    metadataUri: `https://pointcast.xyz/api/tezos-metadata/${companionTokenId}.json`,
  };

  return {
    status: nativeReady
      ? 'native-stamp-live'
      : companionContract
        ? 'companion-live-stamp-contract-pending'
        : 'stamp-contract-pending',
    summary: nativeReady
      ? 'Mint the native generated station stamp art on the Passport Stamps FA2.'
      : 'Mint a live Visit Noun companion proof now; mint the actual generated stamp art when the Passport Stamps FA2 is originated.',
    current: nativeReady ? native : companion,
    companion,
    future: {
      ...PASSPORT_STAMP_COLLECTION,
      tokenId: stampTokenId,
      code: stamp.code,
      metadataUri: passportStampMetadataUrl(stamp),
      artifactUri: passportStampArtUrl(stamp),
      imageGenerator: POINTCAST_IMAGE_GENERATOR.model,
    },
  };
}
