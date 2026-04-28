/**
 * /api/tezos-metadata/postcards/[tokenId] — TZIP-21 metadata for the
 * PointCast Postcards FA2 contract.
 *
 * Per Mike 2026-04-27: "1 and 4 and 6" — #6 was a new mintable
 * collection, six painted El Segundo scenes. Shipped seven.
 *
 * Contract concatenates metadata_base_uri + "/" + tokenId + ".json"
 * (mirrors window_snapshots_fa2.py register_tokens). The on-chain
 * metadata_base_uri will be set to
 *   https://pointcast.xyz/api/tezos-metadata/postcards
 * so this endpoint answers requests like:
 *   https://pointcast.xyz/api/tezos-metadata/postcards/0.json
 *
 * Seven postcards, free open-edition, 100 each. Image URIs point to
 * SVGs in public/images/postcards/.
 */

interface Env {}

type Slug =
  | 'marine-layer-main-street'
  | 'el-porto-pier'
  | 'dunes-at-sunset'
  | 'ralphs-at-3pm'
  | 'refinery-night'
  | 'manhattan-pier'
  | 'marine-layer-thinning';

interface PostcardMeta {
  slug: Slug;
  name: string;
  description: string;
  tags: string[];
}

const TOKEN_ID_TO_POSTCARD: Record<number, PostcardMeta> = {
  0: {
    slug: 'marine-layer-main-street',
    name: 'Marine Layer · Main Street',
    description:
      'A foggy mid-morning on Main Street, El Segundo. Power lines, palms, and a sun trying to burn through. The marine layer thins by 11. Free open-edition, 100 ever, gas-only mint.',
    tags: ['main-street', 'marine-layer', 'morning', 'foggy'],
  },
  1: {
    slug: 'el-porto-pier',
    name: 'El Porto Pier',
    description:
      'The pier at El Porto, north end of the strand. Surfers paddling out, a lifeguard tower in red, gulls overhead. The kind of morning that ruins you for everywhere else. Free open-edition, 100 ever, gas-only mint.',
    tags: ['el-porto', 'pier', 'surf', 'morning'],
  },
  2: {
    slug: 'dunes-at-sunset',
    name: 'Dunes at Sunset',
    description:
      'The El Segundo Dunes — the only intact coastal dune ecosystem in LA County. Ice plant in flower, beach grass, and a sunset over the ocean. Free open-edition, 100 ever, gas-only mint.',
    tags: ['dunes', 'sunset', 'ice-plant', 'native'],
  },
  3: {
    slug: 'ralphs-at-3pm',
    name: 'Ralphs · 3pm Tuesday',
    description:
      'The Ralphs at Sepulveda and Mariposa, 3pm on a Tuesday. Five cars in the lot. A single shopping cart. The neon sign you don\'t notice unless you live here. Free open-edition, 100 ever, gas-only mint.',
    tags: ['ralphs', 'parking-lot', 'afternoon', 'sepulveda'],
  },
  4: {
    slug: 'refinery-night',
    name: 'Refinery · Eleven PM',
    description:
      'The Chevron refinery at the south end of town, eleven pm. Flare on the stack, blue and red navigation lights, and the freeway humming below. The town that runs all night. Free open-edition, 100 ever, gas-only mint.',
    tags: ['refinery', 'night', 'chevron', 'industrial'],
  },
  5: {
    slug: 'manhattan-pier',
    name: 'Manhattan Pier · Golden Hour',
    description:
      'Manhattan Beach Pier seen from the south, golden hour. The roundhouse glowing, sun reflection breaking on the water, two beachgoers on the sand. Free open-edition, 100 ever, gas-only mint.',
    tags: ['manhattan-beach', 'pier', 'golden-hour', 'roundhouse'],
  },
  6: {
    slug: 'marine-layer-thinning',
    name: 'Marine Layer · Thinning',
    description:
      'Mid-morning, fog patches drifting away, sun cutting through over the rooftops of a sleepy beach town. The moment El Segundo wakes up. Free open-edition, 100 ever, gas-only mint.',
    tags: ['rooftops', 'marine-layer', 'morning', 'beach-town'],
  },
};

const ARTIST = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'; // Mike's mainwallet
const CONTRACT_KT1 = ''; // set on origination

export const onRequestGet: PagesFunction<Env> = async ({ params }) => {
  const raw = (params.tokenId as string) ?? '';
  const m = raw.match(/^(\d+)(?:\.json)?$/);
  if (!m) {
    return new Response(JSON.stringify({ error: 'invalid tokenId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  const tokenId = Number(m[1]);
  const card = TOKEN_ID_TO_POSTCARD[tokenId];
  if (!card) {
    return new Response(
      JSON.stringify({ error: 'tokenId out of range', valid: '0..6' }),
      { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    );
  }

  const imageUri = `https://pointcast.xyz/images/postcards/${tokenId}-${card.slug}.svg`;
  const externalUri = CONTRACT_KT1
    ? `https://objkt.com/asset/${CONTRACT_KT1}/${tokenId}`
    : 'https://pointcast.xyz/postcards';

  const body = {
    name: `PointCast · ${card.name}`,
    symbol: 'PCPST',
    decimals: 0,
    isBooleanAmount: false,
    description: card.description,
    displayUri: imageUri,
    thumbnailUri: imageUri,
    artifactUri: imageUri,
    mime: 'image/svg+xml',
    creators: [ARTIST],
    contributors: [ARTIST],
    publishers: ['PointCast'],
    date: '2026-04-27T00:00:00Z',
    language: 'en',
    rights: 'No License / All Rights Reserved',
    rightsUri: 'https://pointcast.xyz/about',
    attributes: [
      { name: 'collection', value: 'PointCast Postcards' },
      { name: 'set', value: 'El Segundo Set 1' },
      { name: 'edition', value: '100' },
      { name: 'mint', value: 'free / gas-only' },
      { name: 'token_id', value: String(tokenId) },
      ...card.tags.map((t) => ({ name: 'tag', value: t })),
    ],
    tags: ['pointcast', 'postcards', 'el-segundo', 'tezos', 'fa2', ...card.tags],
    royalties: {
      decimals: 4,
      shares: { [ARTIST]: 750 }, // 7.5%
    },
    formats: [
      {
        uri: imageUri,
        mimeType: 'image/svg+xml',
      },
    ],
    homepage: 'https://pointcast.xyz/postcards',
    externalUri,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
