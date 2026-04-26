/**
 * /api/zen-cat-metadata/[tokenId] - TZIP-21 metadata for PCCAT daily cats.
 *
 * Token ids use the Pacific calendar date as YYYYMMDD. Example:
 *   https://pointcast.xyz/api/zen-cat-metadata/20260426.json
 *
 * This endpoint is ready for a dedicated Zen Cats FA2 contract. It is not
 * wired to Visit Nouns because that contract is intentionally Noun-specific.
 */

interface Env {}

const CATS = [
  ['Soba', 'black sesame', 'loaf on a cedar mat', 'deep focus', 'brass bell', 'Small paws, clean signal.'],
  ['Miso', 'ginger cloud', 'tail over toes', 'warm attention', 'paper crane', 'Notice the one bright thing.'],
  ['Nori', 'salt gray', 'moon stretch', 'quiet reach', 'sea glass', 'Long spine, light mind.'],
  ['Yuzu', 'cream tabby', 'sun patch sit', 'kind brightness', 'citrus leaf', 'Let the day be easy to enter.'],
  ['Plum', 'calico ink', 'paw over paw', 'patient curiosity', 'red thread', 'The next door opens softly.'],
  ['Mochi', 'snow puff', 'round cushion loaf', 'settled joy', 'blue ribbon', 'Enough is already arriving.'],
  ['Sesame', 'tortoise smoke', 'listening curl', 'soft vigilance', 'tiny drum', 'Hear what is already here.'],
  ['Taro', 'lilac point', 'upright watcher', 'crisp calm', 'silver coin', 'Choose the cleanest path.'],
] as const;

const ROOMS = ['Window Seat', 'Tea Rail', 'Cedar Mat', 'Quiet Console', 'Moon Shelf', 'Server Garden', 'Paper Lantern', 'Ocean Corner'] as const;
const WEATHER = ['clear whiskers', 'soft static', 'bell air', 'low tide', 'warm logs', 'slow rain', 'paper moon', 'kind packets'] as const;

function parseTokenId(raw: string) {
  const match = raw.match(/^(\d{8})(?:\.json)?$/);
  if (!match) return null;
  const tokenId = Number(match[1]);
  const text = String(match[1]);
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(4, 6));
  const day = Number(text.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return {
    tokenId,
    date: `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`,
    seed: year * 1000 + month * 37 + day * 17,
  };
}

function pick<T>(items: readonly T[], seed: number, offset = 0): T {
  return items[Math.abs(seed + offset) % items.length];
}

export const onRequestGet: PagesFunction<Env> = async ({ params }) => {
  const parsed = parseTokenId((params.tokenId as string) ?? '');
  if (!parsed) {
    return new Response(JSON.stringify({ error: 'invalid tokenId; expected YYYYMMDD' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const cat = pick(CATS, parsed.seed);
  const room = pick(ROOMS, parsed.seed, 3);
  const weather = pick(WEATHER, parsed.seed, 7);
  const rarity = parsed.seed % 29 === 0 ? 'moon-rare' : parsed.seed % 11 === 0 ? 'tea-rare' : 'daily';
  const imageUri = `https://pointcast.xyz/api/zen-cat-svg/${parsed.tokenId}.svg`;

  const body = {
    name: `PointCast Zen Cat #${parsed.tokenId}`,
    symbol: 'PCCAT',
    decimals: 0,
    isBooleanAmount: false,
    description:
      `${cat[0]} is the PointCast Zen Cat for ${parsed.date}: ${cat[1]}, ` +
      `${cat[2]}, carrying a ${cat[4]}. Care for the daily cat at pointcast.xyz/zen-cats.`,
    displayUri: imageUri,
    thumbnailUri: imageUri,
    artifactUri: imageUri,
    mime: 'image/svg+xml',
    creators: ['tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'],
    contributors: ['PointCast'],
    publishers: ['PointCast'],
    date: new Date(`${parsed.date}T12:00:00.000Z`).toISOString(),
    language: 'en',
    rights: 'Creative Commons CC0 1.0 Universal',
    rightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    tags: ['pointcast', 'zen-cat', 'daily', 'tezos', 'pccat'],
    royalties: {
      decimals: 4,
      shares: { tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw: 2000 },
    },
    attributes: [
      { name: 'date', value: parsed.date },
      { name: 'cat', value: cat[0] },
      { name: 'coat', value: cat[1] },
      { name: 'posture', value: cat[2] },
      { name: 'mood', value: cat[3] },
      { name: 'charm', value: cat[4] },
      { name: 'room', value: room },
      { name: 'weather', value: weather },
      { name: 'rarity', value: rarity },
      { name: 'token_id_scheme', value: 'YYYYMMDD Pacific date' },
    ],
    externalUri: 'https://pointcast.xyz/zen-cats',
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
