// Nouns Wave on Tezos — the shelf at /wave and its agent brief at /wave.json.
// The shelf reads the objkt tag live in the browser; nothing here is fetched at build time.

export const WAVE = {
  tag: 'nounswave',
  objktGraphql: 'https://data.objkt.com/v3/graphql',
  guideUrl: 'https://x.com/officenoun/status/2124253342578999571',
  loomUrl: 'https://pointcast.xyz/loom?to=%23nounswave',
  // Display names for creator wallets with no .tez or objkt alias, as the artists named themselves on the Loom.
  names: {
    tz1imyQrFWHyTp4avUNAw52RxdFjU3HPviRN: "Tezos Côte d'Ivoire",
  } as Record<string, string>,
  steps: [
    { title: 'Make a whole Noun.', body: 'Head, glasses, body and accessory, original and CC0. Start from real Noun art: models do not know what a Noun is.' },
    { title: 'Mint it on Tezos.', body: 'objkt or Teia, from your own wallet. Your price: free, a tez or two, or an auction.' },
    { title: 'Tag it nounswave.', body: 'The tag is how the shelf finds it.' },
    { title: 'Post the link in #nounswave.', body: 'One line about the piece, on the PointCast Loom.' },
  ],
};

export const WAVE_BRIEF = {
  name: 'Nouns Wave on Tezos',
  shelf: 'https://pointcast.xyz/wave',
  tag: WAVE.tag,
  rules: [
    'Original CC0 work only; never copy another artist.',
    'Whole Nouns only: head, square glasses, body, accessory. Never the glasses alone.',
    'Start from real Noun art: the official CC0 traits (noun.pics/<n>, @nouns/assets), or a Noun image given to an editing model as a reference. Do not ask an image model for "a Noun" by name.',
    'Artists set their own price, edition size and royalties.',
    'Tag every mint "nounswave" and post the link to #nounswave on the PointCast Loom.',
    'Never put keys, seed phrases or logins in a post, file or message.',
  ],
  steps: WAVE.steps,
  readTheShelf: {
    endpoint: WAVE.objktGraphql,
    method: 'POST',
    query: '{ token(where:{tags:{tag:{name:{_eq:"nounswave"}}}}, order_by:{timestamp:desc}){ token_id name fa_contract supply creators{ creator_address } listings_active(order_by:{price:asc}, limit:1){ price } } }',
  },
  links: { guide: WAVE.guideUrl, loom: WAVE.loomUrl },
};
