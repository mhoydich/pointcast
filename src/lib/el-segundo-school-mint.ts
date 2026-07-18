import contractCode from '../../contracts/generated/el-segundo-school-tokens.code.json';
import baseStorage from '../../contracts/generated/el-segundo-school-tokens.storage.json';
import { connectKukai, tezosClient } from './tezos';

type Micheline =
  | { prim: string; args?: Micheline[]; annots?: string[] }
  | { string: string }
  | { int: string }
  | { bytes: string }
  | Micheline[];

export type SchoolWork = {
  id: string;
  number: string;
  title: string;
  category: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  displaySha256: string;
  originalSha256: string;
};

export type SchoolComposition = {
  id: string;
  kind: 'postcard' | 'stamp';
  title: string;
  message: string;
  artifactUri: string;
  metadataUri: string;
};

const PLACEHOLDER_ADMIN = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
const OWNER = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
const CONTRACT = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;
const ARTIST = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const TZKT_API = 'https://api.tzkt.io/v1';
const ASSET_ORIGIN = 'https://el-segundo-school-archive.pages.dev';
const COLLECTION_NAME = 'PointCast · El Segundo School Makers';
const COLLECTION_KIND = 'pointcast-el-segundo-school-makers-mainnet-v1';
const CONTRACT_CACHE = 'pc:el-segundo-school:collector-contract:';

function utf8Hex(value: string) {
  return Array.from(new TextEncoder().encode(value), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

function compareUtf8(left: string, right: string) {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return a.length - b.length;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

const collectionMetadata = {
  name: COLLECTION_NAME,
  description: 'Wallet-owned Passport postcards and Stampz custom stamps made from The El Segundo School archive by Michael Hoydich.',
  version: '1.0.0',
  homepage: 'https://pointcast.xyz/el-segundo-school',
  interfaces: ['TZIP-012', 'TZIP-016', 'TZIP-021'],
  collection_kind: COLLECTION_KIND,
};

function collectionStorage(value: unknown, address: string): unknown {
  if (Array.isArray(value)) return value.map((item) => collectionStorage(item, address));
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  if (record.string === PLACEHOLDER_ADMIN) return { ...record, string: address };
  if (
    record.prim === 'Elt' &&
    Array.isArray(record.args) &&
    (record.args[0] as { string?: unknown } | undefined)?.string === 'data'
  ) {
    return {
      ...record,
      args: [record.args[0], { bytes: utf8Hex(JSON.stringify(collectionMetadata)) }],
    };
  }
  return Object.fromEntries(
    Object.entries(record).map(([key, child]) => [key, collectionStorage(child, address)]),
  );
}

function cachedContract(owner: string) {
  try {
    const value = localStorage.getItem(`${CONTRACT_CACHE}${owner}`) || '';
    return CONTRACT.test(value) ? value : null;
  } catch {
    return null;
  }
}

function cacheContract(owner: string, contract: string) {
  try { localStorage.setItem(`${CONTRACT_CACHE}${owner}`, contract); } catch { /* TzKT can rediscover it. */ }
}

async function verifyContract(contract: string, owner: string) {
  if (!CONTRACT.test(contract) || !OWNER.test(owner)) return false;
  const response = await fetch(`${TZKT_API}/contracts/${encodeURIComponent(contract)}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) return false;
  const value = await response.json() as {
    creator?: { address?: string };
    metadata?: { name?: string; collection_kind?: string };
  };
  return value.creator?.address === owner &&
    value.metadata?.name === COLLECTION_NAME &&
    value.metadata?.collection_kind === COLLECTION_KIND;
}

export async function findSchoolCollector(owner: string) {
  if (!OWNER.test(owner)) return null;
  const cached = cachedContract(owner);
  if (cached && await verifyContract(cached, owner)) return cached;

  const query = new URLSearchParams({ creator: owner, limit: '100', 'sort.desc': 'firstActivity' });
  const response = await fetch(`${TZKT_API}/contracts?${query}`, { headers: { accept: 'application/json' } });
  if (!response.ok) return null;
  const contracts = await response.json() as Array<{
    address?: string;
    metadata?: { name?: string; collection_kind?: string };
  }>;
  const found = contracts.find((item) =>
    CONTRACT.test(item.address || '') &&
    item.metadata?.name === COLLECTION_NAME &&
    item.metadata?.collection_kind === COLLECTION_KIND
  )?.address || null;
  if (found) cacheContract(owner, found);
  return found;
}

export async function connectSchoolWallet() {
  return connectKukai();
}

export async function createSchoolCollector(owner: string) {
  if (!OWNER.test(owner)) throw new Error('INVALID_OWNER');
  const active = await connectKukai();
  if (active !== owner) throw new Error('WALLET_ACCOUNT_CHANGED');
  const tezos = await tezosClient();
  const operation = await tezos.wallet.originate({
    code: contractCode as Micheline[],
    init: collectionStorage(baseStorage, owner) as Micheline,
  } as any).send();
  const contract = await operation.contract();
  cacheContract(owner, contract.address);
  return { contract: contract.address, opHash: operation.opHash };
}

function tokenInfoEntries(owner: string, work: SchoolWork, composition: SchoolComposition) {
  const metadata: Record<string, string> = {
    artifactUri: composition.artifactUri,
    attributes: JSON.stringify([
      { name: 'Maker', value: composition.kind === 'stamp' ? 'Stampz' : 'Passport Postcard' },
      { name: 'Source work', value: work.number },
      { name: 'Archive strand', value: work.category },
      { name: 'Place', value: 'El Segundo, California' },
      { name: 'Price', value: '1 tez' },
    ]),
    creators: JSON.stringify([ARTIST]),
    date: new Date().toISOString(),
    description: `${composition.kind === 'stamp' ? 'Stampz custom stamp' : 'Passport postcard'} made from ${work.title} in The El Segundo School archive. ${composition.message}`.trim(),
    displayUri: composition.artifactUri,
    formats: JSON.stringify([{ uri: composition.artifactUri, mimeType: 'image/svg+xml' }]),
    isBooleanAmount: 'true',
    metadataUri: composition.metadataUri,
    minter: owner,
    mintingTool: 'https://pointcast.xyz/el-segundo-school',
    name: composition.title,
    network: 'Tezos Mainnet',
    originalSha256: work.originalSha256,
    priceMutez: '1000000',
    rightsStatus: 'artist-published',
    schema: 'pointcast.el-segundo-school.maker-token.v1',
    sourceDisclosure: 'AI-assisted source image: Midjourney; composition directed by collector',
    symbol: composition.kind === 'stamp' ? 'STAMPZ' : 'PCARD',
    thumbnailUri: work.thumb.startsWith('http')
      ? work.thumb
      : `${ASSET_ORIGIN}${work.thumb.replace('/images/el-segundo-school', '')}`,
    visualAlt: `${composition.title}, made from ${work.title} by Michael Hoydich.`,
  };
  return Object.entries(metadata)
    .sort(([left], [right]) => compareUtf8(left, right))
    .map(([key, value]) => ({
      prim: 'Elt',
      args: [{ string: key }, { bytes: utf8Hex(value) }],
    }));
}

export async function mintSchoolComposition(params: {
  owner: string;
  contract: string;
  work: SchoolWork;
  composition: SchoolComposition;
}) {
  const { owner, contract, work, composition } = params;
  if (!OWNER.test(owner) || !CONTRACT.test(contract)) throw new Error('INVALID_MINT');
  if (!await verifyContract(contract, owner)) throw new Error('UNVERIFIED_COLLECTOR_CONTRACT');
  const active = await connectKukai();
  if (active !== owner) throw new Error('WALLET_ACCOUNT_CHANGED');
  const contentHash = await sha256(`${work.displaySha256}:${composition.id}:${owner}`);
  const tezos = await tezosClient();
  const operation = await tezos.wallet.batch([
    { kind: 'transaction', to: ARTIST, amount: 1 },
    {
      kind: 'transaction',
      to: contract,
      amount: 0,
      parameter: {
        entrypoint: 'mint',
        value: {
          prim: 'Pair',
          args: [
            { bytes: contentHash },
            tokenInfoEntries(owner, work, composition),
          ],
        },
      },
    },
  ] as any).send();
  return { opHash: operation.opHash, confirmation: operation.confirmation(1) };
}
