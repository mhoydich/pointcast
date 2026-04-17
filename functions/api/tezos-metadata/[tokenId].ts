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
 * Per-token image = noun.pics/{tokenId}.svg (Nouns DAO CC0 canonical).
 */

interface Env {}

export const onRequestGet: PagesFunction<Env> = async ({ params, request }) => {
  const raw = (params.tokenId as string) ?? '';
  // Strip trailing .json — contract writes URIs as "<tokenId>.json" but
  // Astro route params include the extension literally for a [tokenId]
  // dynamic segment without a file extension constraint.
  const m = raw.match(/^(\d+)(?:\.json)?$/);
  if (!m) {
    return new Response(JSON.stringify({ error: 'invalid tokenId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const tokenId = Number(m[1]);
  if (tokenId < 0 || tokenId > 1199) {
    return new Response(JSON.stringify({ error: 'tokenId out of range (0-1199)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const imageUri = `https://noun.pics/${tokenId}.svg`;
  // TZIP-12 / TZIP-21 compliant. Fields objkt / teia / tzkt consume.
  const body = {
    name: `PointCast Visit Noun #${tokenId}`,
    symbol: 'PCVN',
    decimals: 0,
    isBooleanAmount: false,
    description:
      'A PointCast Visit Noun. One of 1200 CC0 Nouns (nouns.wtf), minted on ' +
      'Tezos to commemorate your visit to pointcast.xyz — analog heart, ' +
      'agentic brain.',
    displayUri: imageUri,
    thumbnailUri: imageUri,
    artifactUri: imageUri,
    mime: 'image/svg+xml',
    creators: ['tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'],
    contributors: ['tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'],
    publishers: ['PointCast'],
    date: new Date().toISOString(),
    language: 'en',
    rights: 'Creative Commons CC0 1.0 Universal',
    rightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    tags: ['pointcast', 'visit-noun', 'cc0', 'nouns', 'tezos'],
    royalties: {
      decimals: 4,
      shares: { tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw: 2000 },
    },
    attributes: [
      { name: 'noun_id', value: String(tokenId) },
      { name: 'source', value: 'noun.pics' },
      { name: 'issuer', value: 'PointCast' },
    ],
    externalUri: `https://pointcast.xyz/b/${String(230 + (tokenId % 50)).padStart(4, '0')}`,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // 24h cache — metadata is immutable per-tokenId once pinned.
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
