/**
 * /collect.json — the collecting desk's machine door, answered per request.
 *
 * Moved out of src/pages/collect.json.ts on 2026-09-03: as a prerendered
 * endpoint it kept announcing the sitting from the last manual deploy, which
 * is how /collect.json and /api/kennel-club/mint ended up naming two
 * different dogs on the same morning. The static twin is deleted so this
 * Function actually gets the route.
 */
import contracts from '../src/data/contracts.json';
import { collectSitting, kennelGrid } from '../src/lib/collect-desk';
import { getKennelClubMintSnapshot } from '../src/lib/kennel-club-mint';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=60, s-maxage=60',
};

export const onRequestOptions: PagesFunction = () => new Response(null, {
  status: 204,
  headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' },
});

export const onRequestGet: PagesFunction = async () => {
  const today = collectSitting();
  let minted: number | null = null;
  try {
    minted = (await getKennelClubMintSnapshot(today.tokenId)).today.minted;
  } catch {
    // The manifest remains useful when TzKT is temporarily unavailable.
  }
  const payload = {
    spec: 'pointcast.collect/v1',
    canonical: 'https://pointcast.xyz/collect',
    privacy: 'No subscriber email, user identity, or private session data is exposed here.',
    resolvedAt: 'request',
    todayUrl: 'https://pointcast.xyz/api/kennel-club/today',
    today: {
      day: today.day,
      tokenId: today.tokenId,
      name: today.name,
      breed: today.breed,
      title: today.title,
      image: `https://pointcast.xyz${today.image.png}`,
      claim: 'https://pointcast.xyz/collect?claim=1',
      price: 'free',
      minted,
    },
    counts: { sittings: 30, availableToday: 1, mintedToday: minted },
    contracts: {
      kennelClub: contracts.kennel_club.mainnet,
      profileObjects: contracts.profile_objects.mainnet,
      soulboundSeals: contracts.seal_soulbound.mainnet,
    },
    endpoints: {
      today: 'https://pointcast.xyz/api/kennel-club/today',
      signedInCollection: 'https://pointcast.xyz/api/collect/me',
      subscribe: 'https://pointcast.xyz/api/collect/subscribe',
      dailyStatus: 'https://pointcast.xyz/api/kennel-club/daily/status',
      publicCollectorPattern: 'https://pointcast.xyz/collect/@{handle}',
      publicCollectorJsonPattern: 'https://pointcast.xyz/collect/@{handle}.json',
      legacyShelf: 'https://pointcast.xyz/collect/shelf',
    },
    calendar: kennelGrid(),
    generatedAt: new Date().toISOString(),
  };
  return new Response(JSON.stringify(payload, null, 2), { headers: HEADERS });
};
