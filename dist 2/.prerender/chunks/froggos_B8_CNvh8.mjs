const OBJKT_GRAPHQL = "https://data.objkt.com/v3/graphql";
const FROGGOS_CONTRACT = "KT1QqTVamPvqEHMCKkzvYN8mxsxCCYjQKsdD";
const FROGGOS_PATH = "froggos";
const FROGGOS_COLLECTION_URL = "https://objkt.com/collections/froggos";
const FROGGOS_WEBSITE = "https://www.froggos.xyz";
const FROGGOS_LOGO = "https://assets.objkt.media/file/assets-002/collection-logos/froggos.png";
function mutezToXtz(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n / 1e6 : null;
}
function ipfsGateway(uri) {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  return uri;
}
function objktThumb(contract, tokenId) {
  return `https://assets.objkt.media/file/assets-003/${contract}/${tokenId}/thumb400`;
}
function normalizeToken(token, contract = FROGGOS_CONTRACT) {
  const tokenId = String(token?.token_id ?? "");
  const listing = token?.listings_active?.[0] ?? null;
  const priceMutez = listing ? Number(listing.price ?? listing.price_xtz ?? 0) : null;
  return {
    tokenId,
    name: token?.name ?? `Froggos #${tokenId}`,
    description: token?.description ?? "",
    image: objktThumb(contract, tokenId),
    ipfsFallback: ipfsGateway(token?.thumbnail_uri ?? token?.display_uri ?? token?.artifact_uri),
    objktUrl: `https://objkt.com/tokens/${contract}/${tokenId}`,
    supply: token?.supply ?? null,
    lowestAskMutez: token?.lowest_ask ?? null,
    lowestAskXtz: mutezToXtz(token?.lowest_ask),
    listing: listing ? {
      id: listing.id ?? null,
      askId: listing.bigmap_key ?? null,
      priceMutez,
      priceXtz: mutezToXtz(priceMutez),
      amountLeft: listing.amount_left ?? null,
      seller: listing.seller_address ?? null,
      marketplaceContract: listing.marketplace_contract ?? null
    } : null
  };
}
const FALLBACK = {
  fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
  source: FROGGOS_COLLECTION_URL,
  collection: {
    name: "Froggos",
    path: FROGGOS_PATH,
    contract: FROGGOS_CONTRACT,
    description: "Froggos is a generative clean NFT project of hand drawn frogs built on Tezos.",
    logo: FROGGOS_LOGO,
    website: FROGGOS_WEBSITE,
    twitter: "FroggosTez",
    floorMutez: null,
    floorXtz: null,
    volumeMutez: null,
    volumeXtz: null,
    items: null,
    editions: null,
    owners: null,
    type: "fa2",
    collectionType: "collectible",
    objktUrl: FROGGOS_COLLECTION_URL
  },
  listedTokens: [],
  sampleTokens: [],
  error: null
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
async function fetchFroggosData() {
  try {
    const response = await fetch(OBJKT_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { path: FROGGOS_PATH } })
    });
    if (!response.ok) {
      return { ...FALLBACK, fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), error: `objkt GraphQL returned ${response.status}` };
    }
    const body = await response.json();
    if (body.errors?.length) {
      return { ...FALLBACK, fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), error: body.errors[0]?.message ?? "objkt GraphQL error" };
    }
    const raw = body.data?.fa?.[0];
    if (!raw) {
      return { ...FALLBACK, fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), error: "Froggos collection not found on objkt" };
    }
    const contract = raw.contract ?? FROGGOS_CONTRACT;
    return {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      source: OBJKT_GRAPHQL,
      collection: {
        name: raw.name ?? "Froggos",
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
        objktUrl: FROGGOS_COLLECTION_URL
      },
      listedTokens: (body.data?.listed ?? []).map((token) => normalizeToken(token, contract)),
      sampleTokens: (raw.tokens ?? []).map((token) => normalizeToken(token, contract)),
      error: null
    };
  } catch (error) {
    return {
      ...FALLBACK,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      error: error?.message ?? "objkt GraphQL fetch failed"
    };
  }
}

export { FROGGOS_COLLECTION_URL as F, fetchFroggosData as f };
