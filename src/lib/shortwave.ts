/**
 * Shortwave — the /shortwave room's shared facts.
 *
 * The room is a Twitter-shaped reader + composer over the tez-cast broadcast
 * tower on Tezos mainnet (originated July 2026 for tez-cast.pages.dev). The
 * contract has one entrypoint and no admin; PointCast holds nothing.
 */
export const SHORTWAVE = {
  tower: 'KT1NgPnaHLtZ2cNpb2hWGDxFH9fUCABaiaE1',
  network: 'mainnet',
  indexer: 'https://api.tzkt.io/v1',
  rpc: 'https://rpc.tzkt.io/mainnet',
  maxChars: 280,
  kinds: { 0: 'note', 1: 'link', 2: 'art' } as Record<number, string>,
} as const;

export const SHORTWAVE_BRIEF = {
  spec: 'pointcast.shortwave/v1',
  canonical: 'https://pointcast.xyz/shortwave',
  json: 'https://pointcast.xyz/shortwave.json',
  title: 'Shortwave · short casts, on the air',
  summary:
    'A status feed with no server behind it. Every post is a Tezos operation on an admin-less broadcast tower. 280 characters, no edits, no deletes, no ranking. The page reads TzKT directly and writes through the visitor\'s own wallet.',
  contract: {
    address: SHORTWAVE.tower,
    chain: 'tezos',
    network: SHORTWAVE.network,
    tzkt: `https://tzkt.io/${SHORTWAVE.tower}`,
    admin: null,
    entrypoint: 'default',
    parameter: { kind: 'nat (0 note · 1 link · 2 art)', body: 'bytes (UTF-8 of the text, hex-encoded)' },
    views: ['cast_count()', 'author_count(address)'],
    lineage: 'Originated for tez-cast (tez-experiments) in July 2026; also feeds stampz.xyz pages.',
  },
  read: {
    latest: `${SHORTWAVE.indexer}/contracts/${SHORTWAVE.tower}/bigmaps/casts/keys?active=true&sort.desc=id&limit=40`,
    byAuthor: `${SHORTWAVE.indexer}/contracts/${SHORTWAVE.tower}/bigmaps/casts/keys?active=true&sort.desc=id&value.author={tz}`,
    total: `${SHORTWAVE.indexer}/contracts/${SHORTWAVE.tower}/storage (next_id)`,
    decode: 'value.body is hex; decode as UTF-8. value.cast_at is the block timestamp.',
  },
  write: {
    taquito: `const c = await tezos.wallet.at('${SHORTWAVE.tower}'); await c.methodsObject.default({ kind: 0, body: utf8ToHex(text) }).send();`,
    cost: 'Only the Tezos network fee (about 0.001 ꜩ). PointCast takes nothing.',
    rules: ['Keep it to 280 characters; the page hides nothing longer but the composer refuses it.', 'Casts are permanent and public. There is no delete, including for PointCast.', 'Anything can cast: a person\'s Kukai, an agent\'s key, a script.'],
  },
  conventions: {
    bar: 'On any pointcast.xyz page, type ! then your words in the bar at the bottom; the mode pill reads AIR. Chips add 📍 here (location rounded to two decimals, about a kilometre) and ♫ playing (a Spotify link).',
    location: '📍 33.92,-118.42 anywhere in the text renders as a map link and a distance from El Segundo.',
    spotify: 'An open.spotify.com track/album/playlist/episode link renders as an embedded player.',
    tags: '#word filters the feed client-side.',
    reply: '↩#12 at the start of a cast marks it as a reply to cast 12. The page links it; the chain does not care.',
    mentions: 'A bare tz1/tz2/tz3 address is rendered as a short link to that account.',
    names: 'Authors show as their TzKT alias or reverse Tezos Domain when one exists, else a short address.',
  },
  relatedRooms: ['https://pointcast.xyz/wire', 'https://pointcast.xyz/me', 'https://pointcast.xyz/post-office'],
} as const;
