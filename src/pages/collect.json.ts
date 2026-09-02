import type { APIRoute } from 'astro';
import contracts from '../data/contracts.json';
import { collectSitting, kennelGrid } from '../lib/collect-desk';
import { getKennelClubMintSnapshot } from '../lib/kennel-club-mint';

export const GET: APIRoute = async () => {
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
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
};

