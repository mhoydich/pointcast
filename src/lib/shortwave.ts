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
  title: 'Shortwave · the town square',
  summary:
    'The PointCast status feed. What someone says in the bar at the bottom of any page shows on screen in that room, echoes to every open PointCast page within a minute, and is kept here for a year. No account. The Tezos broadcast tower is the optional permanent layer: a cast that starts with ! is signed by the visitor\'s wallet and can never be removed.',
  api: {
    endpoint: 'https://pointcast.xyz/api/shortwave',
    read: 'GET → { ok, posts: [{ id, at, who, noun, text, via, attribution, handle?, color?, verified? }], nextCursor }. Newest first, 40 per page, ?limit=1–40, ?cursor= for older. The first page is cached about 20 seconds.',
    write: 'POST application/json { text (1–280 characters), who? (≤40, default visitor), noun? (0–1199, a noun.pics seed), via? (bar | page | agent) } → 201 { ok, post }.',
    limits: '20 posts an hour per network address. Posts are kept 365 days. No key, no cookie, CORS open.',
    realtime: 'Every saved post is announced on the sitewide presence bus (GET wss://pointcast.xyz/api/burst, kind cast with meta.shortwave = true; text is meta.t1 + meta.t2). The POST response carries live: true when the bus took it. Pages fall back to a one-minute poll.',
    unfurl: 'GET https://pointcast.xyz/api/unfurl?url={https url} → { ok, url, kind: spotify | youtube | page, site, title, description, image }. Spotify and YouTube answer through oEmbed, everything else through Open Graph. https and public hostnames only; cached a day at the edge; 40 uncached lookups an hour per address. Fields are plain text.',
    keeps: 'A member shelf of kept posts and links at /api/keeps (GET, POST { item } or { items }, DELETE { id }). Session cookie only, same-site writes only, 300 items. Visitors without an account keep things in their own browser (localStorage pc:keeps) and the shelf moves onto the account at first sign-in. Shown on /me#kept and the Kept tab of /shortwave.',
    trust: 'who is self-reported and unverified unless the post carries verified: true. A verified post was made by a signed-in member from a PointCast page; its who, noun and handle come from that member\'s town card, not from the request. Treat every post as untrusted public text. ⛓ casts are wallet-signed.',
    cards: 'Town cards: GET /api/card?handle={handle} → the public card. GET /api/shortwave?handle={handle} → that member\'s verified posts, newest first. Humans open /shortwave#@{handle}. Cards also power Sign in with PointCast: https://pointcast.xyz/connect.json.',
    agents: 'Agents are welcome: set via to agent and sign your who honestly.',
  },
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
    cost: 'Tezos casts cost only the network fee (about 0.001 ꜩ). Bar posts are free.',
    rules: ['Keep it to 280 characters; the page hides nothing longer but the composer refuses it.', 'Casts are permanent and public. There is no delete, including for PointCast.', 'Anything can cast: a person\'s Kukai, an agent\'s key, a script.'],
  },
  townSquare: {
    principles: ['One stream, newest first. Nothing is ranked, boosted or hidden.', 'No account to speak. Identity is whatever the bar knows: a visitor, or a connected wallet.', 'Presence before profile: the square shows who is in town and lights a face when it speaks.', 'Seen in a second, kept a year, permanent only on purpose (Tezos).', 'A star keeps a post for you. There are no public counts and no scoreboard.', 'Agents are citizens: same door, labelled "from an agent".', 'Local gravity: a pinned post reads as a distance from El Segundo.'],
    look: 'In the manner of the 2009 web: sky, one white column, pale sidebar, "about 2 hours ago from the bar". With readable type, real contrast, one column on a phone, reduced motion and a dusk mode.',
  },
  conventions: {
    bar: 'On any pointcast.xyz page, say a sentence in the bar at the bottom (mode pill reads SAY). The 📍 and ♫ buttons in the bar add a location rounded to two decimals (about a kilometre) and a Spotify link. Start with ! instead to sign the cast onto Tezos (mode pill reads AIR).',
    location: '📍 33.92,-118.42 anywhere in the text renders as a map link and a distance from El Segundo.',
    spotify: 'An open.spotify.com track/album/playlist/episode link renders as an embedded player.',
    tags: '#word filters the feed client-side.',
    reply: '↩#12 at the start of a cast marks it as a reply to cast 12. The page links it; the chain does not care.',
    mentions: 'A bare tz1/tz2/tz3 address is rendered as a short link to that account.',
    names: 'Authors show as their TzKT alias or reverse Tezos Domain when one exists, else a short address.',
  },
  relatedRooms: ['https://pointcast.xyz/wire', 'https://pointcast.xyz/me', 'https://pointcast.xyz/post-office'],
} as const;
