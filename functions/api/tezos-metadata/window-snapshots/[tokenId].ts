/**
 * /api/tezos-metadata/window-snapshots/[tokenId] — TZIP-21 metadata for
 * the Window Snapshots FA2 contract.
 *
 * Contract concatenates metadata_base_uri + "/" + tokenId + ".json"
 * (see contracts/v2/window_snapshots_fa2.py register_tokens). The
 * on-chain metadata_base_uri is set to
 *   https://pointcast.xyz/api/tezos-metadata/window-snapshots
 * so this endpoint answers requests like:
 *   https://pointcast.xyz/api/tezos-metadata/window-snapshots/0.json
 *
 * Three painted interiors, free open-edition, 100 each. Image URIs
 * point to JPGs in public/images/window-snapshots/.
 */

interface Env {}

type Slug = 'galley' | 'long-room' | 'lamp-wall';

interface SnapshotMeta {
  slug: Slug;
  name: string;
  description: string;
}

const TOKEN_ID_TO_SNAPSHOT: Record<number, SnapshotMeta> = {
  0: {
    slug: 'galley',
    name: 'Galley',
    description:
      "A 1970s mobile-home galley kitchen seen from the next room. Red banquette, " +
      "blue floral curtains, dark wood paneling, yellow rug. Mid-afternoon light through " +
      "the window. Free open-edition, 100 ever, gas-only mint.",
  },
  1: {
    slug: 'long-room',
    name: 'Long Room',
    description:
      "A long living room with mustard banquettes, red floral curtains, a hat " +
      "left on the seat. Wine bottle and a small plant on the table. The far window " +
      "looks out at hills. Free open-edition, 100 ever, gas-only mint.",
  },
  2: {
    slug: 'lamp-wall',
    name: 'Lamp Wall',
    description:
      "A row of lampshades on a low table in front of a wall papered with bottle " +
      "and vase silhouettes. Cool blues, warm pink floor, a single dark vase as the " +
      "anchor. Free open-edition, 100 ever, gas-only mint.",
  },
};

const ARTIST = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'; // Mike's mainwallet
// Contract KT1 — set after origination via /admin/deploy/new.
// Until then the externalUri falls back to the /market page.
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
  const snap = TOKEN_ID_TO_SNAPSHOT[tokenId];
  if (!snap) {
    return new Response(
      JSON.stringify({ error: 'tokenId out of range', valid: '0..2' }),
      { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    );
  }

  const imageUri = `https://pointcast.xyz/images/window-snapshots/${tokenId}-${snap.slug}.jpg`;
  const externalUri = CONTRACT_KT1
    ? `https://objkt.com/asset/${CONTRACT_KT1}/${tokenId}`
    : 'https://pointcast.xyz/market';

  const body = {
    name: `PointCast · ${snap.name}`,
    symbol: 'PCWIN',
    decimals: 0,
    isBooleanAmount: false,
    description: snap.description,
    displayUri: imageUri,
    thumbnailUri: imageUri,
    artifactUri: imageUri,
    mime: 'image/jpeg',
    creators: [ARTIST],
    contributors: [ARTIST],
    publishers: ['PointCast'],
    date: '2026-04-26T00:00:00Z',
    language: 'en',
    rights: 'No License / All Rights Reserved',
    rightsUri: 'https://pointcast.xyz/about',
    attributes: [
      { name: 'collection', value: 'Window Snapshots' },
      { name: 'edition', value: '100' },
      { name: 'mint', value: 'free / gas-only' },
      { name: 'token_id', value: String(tokenId) },
    ],
    tags: ['pointcast', 'window-snapshots', 'tezos', 'fa2', 'painting', 'interior', snap.slug],
    royalties: {
      decimals: 4,
      shares: { [ARTIST]: 750 }, // 7.5%
    },
    formats: [
      {
        uri: imageUri,
        mimeType: 'image/jpeg',
      },
    ],
    homepage: 'https://pointcast.xyz/market',
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
