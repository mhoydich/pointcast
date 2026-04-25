/**
 * /api/tezos-metadata/birthdays/[tokenId] — TZIP-21 metadata for the
 * Birthdays FA2 contract.
 *
 * Contract concatenates metadata_base_uri + "/" + tokenId + ".json"
 * (see contracts/v2/birthdays_fa2.py register_birthday). Origination
 * sets metadata_base_uri = "https://pointcast.xyz/api/tezos-metadata/birthdays"
 * and this endpoint answers the resulting URI:
 *   https://pointcast.xyz/api/tezos-metadata/birthdays/366.json
 *
 * Token IDs are PointCast block IDs as numbers — token_id 366 = block 0366.
 * We fetch the block's static JSON from same-origin (/b/{id}.json) and
 * project its fields into a TZIP-12/TZIP-21 token metadata record.
 *
 * The recipient's permanent Noun (block.noun, e.g. 888 for Morgan) drives
 * the token image via noun.pics — same CC0 source the rest of /cake uses.
 */

interface Env {}

interface BlockData {
  id?: string;
  channel?: string;
  type?: string;
  title?: string;
  dek?: string;
  noun?: number;
  timestamp?: string;
  meta?: Record<string, unknown>;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, request }) => {
  const raw = (params.tokenId as string) ?? '';
  const m = raw.match(/^(\d+)(?:\.json)?$/);
  if (!m) {
    return new Response(JSON.stringify({ error: 'invalid tokenId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  const tokenIdNum = Number(m[1]);
  if (tokenIdNum < 0 || tokenIdNum > 9999) {
    return new Response(JSON.stringify({ error: 'tokenId out of range (0-9999)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Block IDs are zero-padded to 4 digits.
  const blockId = String(tokenIdNum).padStart(4, '0');

  // Fetch the block's static JSON from same-origin.
  const origin = new URL(request.url).origin;
  const blockUrl = `${origin}/b/${blockId}.json`;

  let block: BlockData | null = null;
  try {
    const r = await fetch(blockUrl);
    if (r.ok) block = (await r.json()) as BlockData;
  } catch {
    // fall through to generic fallback below
  }

  if (!block) {
    return new Response(
      JSON.stringify({ error: 'block-not-found', blockId, tokenId: tokenIdNum }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    );
  }

  if (block.channel !== 'BDY' && block.type !== 'BIRTHDAY') {
    return new Response(
      JSON.stringify({
        error: 'block-not-a-birthday',
        blockId,
        tokenId: tokenIdNum,
        channel: block.channel,
        type: block.type,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    );
  }

  const noun = typeof block.noun === 'number' ? block.noun : null;
  const imageUri = noun != null ? `https://noun.pics/${noun}.svg` : 'https://pointcast.xyz/images/og/cake.png';
  const recipientSlug = (block.meta?.for as string | undefined) ?? 'unknown';
  const recipientName = recipientSlug.charAt(0).toUpperCase() + recipientSlug.slice(1);
  const year = block.timestamp ? new Date(block.timestamp).getUTCFullYear() : null;
  const blockUrlPublic = `https://pointcast.xyz/b/${blockId}`;

  const body = {
    name: `Happy birthday, ${recipientName}` + (year ? ` · ${year}` : ''),
    symbol: 'PCBDAY',
    decimals: 0,
    isBooleanAmount: false,
    description:
      block.dek ||
      `A PointCast birthday card for ${recipientName}. Free open-edition mint on Tezos. ` +
      `Numbered like Nouns, indexed at /cake. The block lives forever at ${blockUrlPublic}.`,
    displayUri: imageUri,
    thumbnailUri: imageUri,
    artifactUri: imageUri,
    mime: 'image/svg+xml',
    creators: ['tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'],
    contributors: ['tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'],
    publishers: ['PointCast'],
    date: block.timestamp || new Date().toISOString(),
    language: 'en',
    rights: 'Creative Commons CC0 1.0 Universal',
    rightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    tags: ['pointcast', 'birthday', 'cake', 'cc0', 'nouns', 'tezos', recipientSlug],
    // No royalties on birthday cards — free editions, no secondary expectation.
    attributes: [
      { name: 'recipient', value: recipientName },
      { name: 'recipient_slug', value: recipientSlug },
      { name: 'permanent_noun', value: noun != null ? String(noun) : 'none' },
      { name: 'block_id', value: blockId },
      { name: 'birthday_year', value: year != null ? String(year) : 'unknown' },
      { name: 'channel', value: 'BDY' },
      { name: 'type', value: 'BIRTHDAY' },
    ],
    externalUri: blockUrlPublic,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // 1h cache — metadata is mostly immutable, but block edits possible.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
