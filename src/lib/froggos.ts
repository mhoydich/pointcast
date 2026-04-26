const OBJKT_GRAPHQL = 'https://data.objkt.com/v3/graphql';

export const FROGGOS_CONTRACT = 'KT1QqTVamPvqEHMCKkzvYN8mxsxCCYjQKsdD';
export const FROGGOS_PATH = 'froggos';
export const FROGGOS_COLLECTION_URL = 'https://objkt.com/collections/froggos';
export const FROGGOS_WEBSITE = 'https://www.froggos.xyz';
export const FROGGOS_LOGO = 'https://assets.objkt.media/file/assets-002/collection-logos/froggos.png';

export interface FroggosListing {
  id: number | null;
  askId: number | null;
  priceMutez: number | null;
  priceXtz: number | null;
  amountLeft: number | null;
  seller: string | null;
  marketplaceContract: string | null;
}

export interface FroggosToken {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  ipfsFallback: string | null;
  objktUrl: string;
  supply: number | null;
  lowestAskMutez: number | null;
  lowestAskXtz: number | null;
  listing: FroggosListing | null;
}

export interface FroggosData {
  fetchedAt: string;
  source: string;
  collection: {
    name: string;
    path: string;
    contract: string;
    description: string;
    logo: string;
    website: string | null;
    twitter: string | null;
    floorMutez: number | null;
    floorXtz: number | null;
    volumeMutez: number | null;
    volumeXtz: number | null;
    items: number | null;
    editions: number | null;
    owners: number | null;
    type: string | null;
    collectionType: string | null;
    objktUrl: string;
  };
  listedTokens: FroggosToken[];
  sampleTokens: FroggosToken[];
  error: string | null;
}

function mutezToXtz(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n / 1_000_000 : null;
}

function ipfsGateway(uri?: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  return uri;
}

function objktThumb(contract: string, tokenId: string): string {
  return `https://assets.objkt.media/file/assets-003/${contract}/${tokenId}/thumb400`;
}

function normalizeToken(token: any, contract = FROGGOS_CONTRACT): FroggosToken {
  const tokenId = String(token?.token_id ?? '');
  const listing = token?.listings_active?.[0] ?? null;
  const priceMutez = listing ? Number(listing.price ?? listing.price_xtz ?? 0) : null;

  return {
    tokenId,
    name: token?.name ?? `Froggos #${tokenId}`,
    description: token?.description ?? '',
    image: objktThumb(contract, tokenId),
    ipfsFallback: ipfsGateway(token?.thumbnail_uri ?? token?.display_uri ?? token?.artifact_uri),
    objktUrl: `https://objkt.com/tokens/${contract}/${tokenId}`,
    supply: token?.supply ?? null,
    lowestAskMutez: token?.lowest_ask ?? null,
    lowestAskXtz: mutezToXtz(token?.lowest_ask),
    listing: listing
      ? {
          id: listing.id ?? null,
          askId: listing.bigmap_key ?? null,
          priceMutez,
          priceXtz: mutezToXtz(priceMutez),
          amountLeft: listing.amount_left ?? null,
          seller: listing.seller_address ?? null,
          marketplaceContract: listing.marketplace_contract ?? null,
        }
      : null,
  };
}

const FALLBACK: FroggosData = {
  fetchedAt: new Date().toISOString(),
  source: FROGGOS_COLLECTION_URL,
  collection: {
    name: 'Froggos',
    path: FROGGOS_PATH,
    contract: FROGGOS_CONTRACT,
    description: 'Froggos is a generative clean NFT project of hand drawn frogs built on Tezos.',
    logo: FROGGOS_LOGO,
    website: FROGGOS_WEBSITE,
    twitter: 'FroggosTez',
    floorMutez: null,
    floorXtz: null,
    volumeMutez: null,
    volumeXtz: null,
    items: null,
    editions: null,
    owners: null,
    type: 'fa2',
    collectionType: 'collectible',
    objktUrl: FROGGOS_COLLECTION_URL,
  },
  listedTokens: [],
  sampleTokens: [],
  error: null,
};

const QUERY = `
query FroggosMarket($path: String!) {
  fa(where: {path: {_eq: $path}}, limit: 1) {
    contract
    path
    name
    description
    logo
    website
    twitter
    floor_price
    volume_total
    items
    editions
    owners
    collection_type
    type
    tokens(limit: 10, order_by: {token_id: asc}) {
      token_id
      name
      description
      display_uri
      thumbnail_uri
      artifact_uri
      supply
      lowest_ask
      listings_active(limit: 1, order_by: {price: asc}) {
        id
        bigmap_key
        price
        price_xtz
        amount_left
        seller_address
        marketplace_contract
      }
    }
  }
  listed: token(
    where: {fa: {path: {_eq: $path}}, lowest_ask: {_is_null: false}}
    limit: 12
    order_by: {lowest_ask: asc}
  ) {
    token_id
    name
    description
    display_uri
    thumbnail_uri
    artifact_uri
    supply
    lowest_ask
    listings_active(limit: 1, order_by: {price: asc}) {
      id
      bigmap_key
      price
      price_xtz
      amount_left
      seller_address
      marketplace_contract
    }
  }
}`;

export async function fetchFroggosData(): Promise<FroggosData> {
  try {
    const response = await fetch(OBJKT_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { path: FROGGOS_PATH } }),
    });

    if (!response.ok) {
      return { ...FALLBACK, fetchedAt: new Date().toISOString(), error: `objkt GraphQL returned ${response.status}` };
    }

    const body = await response.json();
    if (body.errors?.length) {
      return { ...FALLBACK, fetchedAt: new Date().toISOString(), error: body.errors[0]?.message ?? 'objkt GraphQL error' };
    }

    const raw = body.data?.fa?.[0];
    if (!raw) {
      return { ...FALLBACK, fetchedAt: new Date().toISOString(), error: 'Froggos collection not found on objkt' };
    }

    const contract = raw.contract ?? FROGGOS_CONTRACT;
    return {
      fetchedAt: new Date().toISOString(),
      source: OBJKT_GRAPHQL,
      collection: {
        name: raw.name ?? 'Froggos',
        path: raw.path ?? FROGGOS_PATH,
        contract,
        description: raw.description ?? FALLBACK.collection.description,
        logo: raw.logo ?? FROGGOS_LOGO,
        website: raw.website ?? FROGGOS_WEBSITE,
        twitter: raw.twitter ?? null,
        floorMutez: raw.floor_price ?? null,
        floorXtz: mutezToXtz(raw.floor_price),
        volumeMutez: raw.volume_total ?? null,
        volumeXtz: mutezToXtz(raw.volume_total),
        items: raw.items ?? null,
        editions: raw.editions ?? null,
        owners: raw.owners ?? null,
        type: raw.type ?? null,
        collectionType: raw.collection_type ?? null,
        objktUrl: FROGGOS_COLLECTION_URL,
      },
      listedTokens: (body.data?.listed ?? []).map((token: any) => normalizeToken(token, contract)),
      sampleTokens: (raw.tokens ?? []).map((token: any) => normalizeToken(token, contract)),
      error: null,
    };
  } catch (error: any) {
    return {
      ...FALLBACK,
      fetchedAt: new Date().toISOString(),
      error: error?.message ?? 'objkt GraphQL fetch failed',
    };
  }
}
