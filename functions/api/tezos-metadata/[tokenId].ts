/**
 * /api/tezos-metadata/[tokenId] — TZIP-21 metadata for Visit Nouns FA2 tokens.
 *
 * Serves JSON that objkt, teia, and TzKT all read to display the token.
 * Contract concatenates metadata_base_cid + "/" + tokenId + ".json"
 * (see contracts/v2/visit_nouns_fa2.py line 176-182), so we set the
 * contract's metadata_base_cid to "https://pointcast.xyz/api/tezos-metadata"
 * and this endpoint answers the resulting URI:
 *   https://pointcast.xyz/api/tezos-metadata/137.json
 *
 * Per-token display image = a PointCast SVG card that embeds the canonical
 * noun.pics/{tokenId}.svg Noun. The original Noun URL is preserved in
 * metadata attributes/sourceUri.
 */

interface Env {}

const CREATOR = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';

function parseTokenId(raw: string) {
  const m = raw.match(/^(\d+)(?:\.json)?$/);
  if (!m) return null;
  const tokenId = Number(m[1]);
  if (tokenId < 0 || tokenId > 1199) return null;
  return tokenId;
}

function jsonHeaders() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  };
}

function buildMetadata(tokenId: number) {
  const nounUri = `https://noun.pics/${tokenId}.svg`;
  const cardUri = `https://pointcast.xyz/api/tezos-token-card/${tokenId}.svg`;
  const cardPage = `https://pointcast.xyz/nouns-cards-v3#token-${tokenId}`;

  // TZIP-12 / TZIP-21 compliant. Fields objkt / teia / tzkt consume.
  return {
    name: `PointCast Visit Noun #${tokenId}`,
    symbol: 'PCVN',
    decimals: 0,
    isBooleanAmount: false,
    description:
      'A PointCast Visit Noun: a CC0 Noun staged as a PointCast Tezos collectible. ' +
      'Minted to commemorate a visit to pointcast.xyz, with the canonical Noun art ' +
      'preserved and a marketplace-friendly PointCast card preview.',
    displayUri: cardUri,
    thumbnailUri: cardUri,
    artifactUri: cardUri,
    sourceUri: nounUri,
    mime: 'image/svg+xml',
    formats: [
      {
        uri: cardUri,
        mimeType: 'image/svg+xml',
        dimensions: { value: '1200x1200', unit: 'px' },
      },
      {
        uri: nounUri,
        mimeType: 'image/svg+xml',
      },
    ],
    creators: [CREATOR],
    contributors: [CREATOR],
    publishers: ['PointCast'],
    date: '2026-04-17T00:00:00.000Z',
    language: 'en',
    rights: 'Creative Commons CC0 1.0 Universal',
    rightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    tags: ['pointcast', 'visit-noun', 'cc0', 'nouns', 'tezos', 'objkt'],
    royalties: {
      decimals: 4,
      shares: { [CREATOR]: 2000 },
    },
    attributes: [
      { name: 'Noun ID', value: String(tokenId) },
      { name: 'Collection', value: 'PointCast Visit Nouns' },
      { name: 'Source', value: 'noun.pics' },
      { name: 'License', value: 'CC0' },
      { name: 'Preview', value: 'PointCast card' },
    ],
    externalUri: cardPage,
  };
}

async function handleMetadata(params: Record<string, unknown>, includeBody: boolean) {
  const raw = (params.tokenId as string) ?? '';
  // Strip trailing .json — contract writes URIs as "<tokenId>.json" but
  // Astro route params include the extension literally for a [tokenId]
  // dynamic segment without a file extension constraint.
  const tokenId = parseTokenId(raw);
  if (tokenId === null) {
    return new Response(JSON.stringify({ error: 'invalid tokenId' }), {
      status: 400,
      headers: jsonHeaders(),
    });
  }

  const body = buildMetadata(tokenId);

  return new Response(includeBody ? JSON.stringify(body, null, 2) : null, {
    status: 200,
    headers: jsonHeaders(),
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ params }) => handleMetadata(params, true);

export const onRequestHead: PagesFunction<Env> = async ({ params }) => handleMetadata(params, false);

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    status: 204,
    headers: jsonHeaders(),
  });
