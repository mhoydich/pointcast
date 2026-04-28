/**
 * /api/morning-ocean-metadata/[tokenId] - TZIP-21 metadata for PCOCEAN.
 *
 * Token ids are 1..24. The artwork is a generated Morning Ocean series:
 * boats, tankers, sailboats, ferries, planets, sun, fog, and calm water.
 *
 * This endpoint is ready for a dedicated Morning Ocean FA2 contract. The
 * contract should concatenate metadata_base_uri + "/" + tokenId + ".json".
 */

interface Env {}

const ARTIST = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';

type TokenRow = readonly [
  id: number,
  slug: string,
  title: string,
  vessel: string,
  celestial: string,
  horizon: string,
  mood: string,
  rarity: string,
  edition: number,
];

const TOKENS: readonly TokenRow[] = [
  [1, 'sun-tanker', 'Sun Tanker', 'long oil tanker', 'low gold sun', 'sheltered Pacific inlet', 'earned calm at first light', 'rare', 44],
  [2, 'silver-sail', 'Silver Sail', 'single white sailboat', 'silver sun through marine haze', 'island channel', 'slow confidence', 'uncommon', 88],
  [3, 'red-tug-moon', 'Red Tug Moon', 'working harbor tug', 'white morning moon', 'fjord cliffs', 'useful power kept quiet', 'rare', 44],
  [4, 'pearl-fishing-boat', 'Pearl Fishing Boat', 'wooden fishing boat', 'pearl planet', 'open bay', 'patient navigation', 'common', 144],
  [5, 'research-morning', 'Research Morning', 'white research vessel', 'pale sun', 'blue mountain passage', 'clear observation', 'rare', 44],
  [6, 'distant-freighter', 'Distant Freighter', 'far freighter', 'rose sun', 'flowered coastline', 'quiet scale', 'uncommon', 88],
  [7, 'palm-catamaran', 'Palm Catamaran', 'anchored catamaran', 'honey sun', 'tropical harbor', 'soft arrival', 'rare', 44],
  [8, 'champagne-yacht', 'Champagne Yacht', 'low luxury yacht', 'champagne sun', 'rock garden coast', 'polished drift', 'epic', 24],
  [9, 'harbor-ferry', 'Harbor Ferry', 'morning passenger ferry', 'orange sun', 'dawn commuter line', 'gentle momentum', 'uncommon', 88],
  [10, 'blue-tug', 'Blue Tug', 'small blue tug', 'faint star', 'blue hour harbor', 'work before the city wakes', 'common', 144],
  [11, 'crescent-rowboat', 'Crescent Rowboat', 'empty wooden rowboat', 'thin crescent moon', 'still cove', 'held silence', 'rare', 44],
  [12, 'patrol-vessel', 'Patrol Vessel', 'gray patrol vessel', 'clouded sun', 'stone point', 'watchful steadiness', 'uncommon', 88],
  [13, 'whale-ferry', 'Whale Ferry', 'small ferry', 'white sun', 'wild passage', 'rare encounter', 'epic', 24],
  [14, 'coral-trawler', 'Coral Trawler', 'fishing trawler', 'coral sunrise', 'working coast', 'honest harvest', 'common', 144],
  [15, 'rose-skiff', 'Rose Skiff', 'small skiff', 'rose sun', 'glass bay', 'minimum viable voyage', 'rare', 44],
  [16, 'landmark-ferry', 'Landmark Ferry', 'city ferry', 'small planet', 'domed landmark skyline', 'pilgrimage by water', 'rare', 44],
  [17, 'solar-sail', 'Solar Sail', 'heeled racing sailboat', 'bright solar disk', 'wind lane', 'elegant pressure', 'epic', 24],
  [18, 'twin-schooner', 'Twin Schooner', 'two-masted schooner', 'morning sun', 'outer islands', 'old craft, clean line', 'rare', 44],
  [19, 'container-dawn', 'Container Dawn', 'container ship', 'wide sun', 'industrial horizon', 'scale without hurry', 'uncommon', 88],
  [20, 'long-oil-tanker', 'Long Oil Tanker', 'black oil tanker', 'muted morning sun', 'mountain channel', 'heavy vessel, light mind', 'rare', 44],
  [21, 'bay-runner', 'Bay Runner', 'fast bay ferry', 'hazy sun', 'coastal city inlet', 'clean acceleration', 'uncommon', 88],
  [22, 'wooden-launch', 'Wooden Launch', 'varnished wooden launch', 'pale planet', 'private cove', 'quiet ownership', 'rare', 44],
  [23, 'eclipse-carrier', 'Eclipse Carrier', 'distant carrier ship', 'black eclipse sun', 'night-to-morning line', 'threshold moment', 'mythic', 8],
  [24, 'mist-freighter', 'Mist Freighter', 'freighter in fog', 'veiled white sun', 'gray open sea', 'arrival not yet visible', 'rare', 44],
] as const;

function parseTokenId(raw: string): number | null {
  const match = raw.match(/^0*(\d+)(?:\.json)?$/);
  if (!match) return null;
  const tokenId = Number(match[1]);
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > 24) return null;
  return tokenId;
}

export const onRequestGet: PagesFunction<Env> = async ({ params }) => {
  const tokenId = parseTokenId((params.tokenId as string) ?? '');
  if (!tokenId) {
    return new Response(JSON.stringify({ error: 'invalid tokenId; expected 1..24' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const row = TOKENS[tokenId - 1];
  const [, slug, title, vessel, celestial, horizon, mood, rarity, edition] = row;
  const padded = String(tokenId).padStart(2, '0');
  const imageUri = `https://pointcast.xyz/images/morning-ocean/tokens/${padded}-${slug}.png`;
  const externalUri = `https://pointcast.xyz/morning-ocean#token-${tokenId}`;

  const body = {
    name: `Morning Ocean #${padded} - ${title}`,
    symbol: 'PCOCEAN',
    decimals: 0,
    isBooleanAmount: false,
    description:
      `${title} is token ${padded} in Morning Ocean, a 24-piece PointCast collectible series ` +
      `of quiet maritime mornings. Vessel: ${vessel}. Sky object: ${celestial}. ` +
      `Horizon: ${horizon}. Mood: ${mood}.`,
    displayUri: imageUri,
    thumbnailUri: imageUri,
    artifactUri: imageUri,
    mime: 'image/png',
    creators: [ARTIST],
    contributors: [ARTIST, 'PointCast'],
    publishers: ['PointCast'],
    date: '2026-04-27T00:00:00Z',
    language: 'en',
    rights: 'No License / All Rights Reserved',
    rightsUri: 'https://pointcast.xyz/about',
    tags: [
      'pointcast',
      'morning-ocean',
      'tezos',
      'fa2',
      'collectible',
      'maritime',
      rarity,
      slug,
    ],
    royalties: {
      decimals: 4,
      shares: { [ARTIST]: 750 },
    },
    attributes: [
      { name: 'collection', value: 'Morning Ocean' },
      { name: 'series_size', value: '24' },
      { name: 'token_id', value: String(tokenId) },
      { name: 'vessel', value: vessel },
      { name: 'celestial', value: celestial },
      { name: 'horizon', value: horizon },
      { name: 'mood', value: mood },
      { name: 'rarity', value: rarity },
      { name: 'edition_cap', value: String(edition) },
      { name: 'mint', value: 'free / gas-only after PCOCEAN origination' },
    ],
    formats: [
      {
        uri: imageUri,
        mimeType: 'image/png',
      },
    ],
    homepage: 'https://pointcast.xyz/morning-ocean',
    externalUri,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
