import contracts from '../data/contracts.json';
import { getWalletHoldings } from '../../functions/api/me/_holdings';
import { claimedStreak, collectSitting, kennelGrid } from './collect-desk';
import { listProfilePages } from './profile-object.mjs';

export type PublicCollector = {
  schema: 'pointcast.public-collector/v1';
  handle: string;
  owner: string;
  profile: Awaited<ReturnType<typeof listProfilePages>>[number]['page'];
  noun: string;
  url: string;
  json: string;
  og: string;
  claimedDays: number[];
  streak: number;
  counts: {
    dogs: number;
    seals: number;
    mugs: number;
    nouns: number;
  };
  calendar: ReturnType<typeof kennelGrid>;
  source: string;
};

let collectorsPromise: Promise<PublicCollector[]> | null = null;

async function listProfilesForBuild() {
  const attempts = 4;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await listProfilePages(contracts.profile_objects.mainnet);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable = /TzKT .* read failed \((?:429|5\d\d)\)/.test(message);
      if (!retryable || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  return [];
}

export function listPublicCollectors(): Promise<PublicCollector[]> {
  if (collectorsPromise) return collectorsPromise;
  collectorsPromise = (async () => {
    const profiles = await listProfilesForBuild();
    const today = collectSitting();
    return Promise.all(profiles.map(async (profile) => {
      const wallet = await getWalletHoldings(profile.owner, { cache: null });
      const tokens = (slug: string) => wallet.collections
        .filter((collection) => collection.slug === slug)
        .flatMap((collection) => collection.tokens.map((token) => token.tokenId));
      const claimedDays = [...new Set(tokens('kennel_club')
        .map((tokenId) => Number(tokenId) + 1)
        .filter((day) => Number.isSafeInteger(day) && day >= 1 && day <= 30))]
        .sort((a, b) => a - b);
      return {
        schema: 'pointcast.public-collector/v1' as const,
        handle: profile.handle,
        owner: profile.owner,
        profile: profile.page,
        noun: profile.noun,
        url: `https://pointcast.xyz/collect/@${profile.handle}`,
        json: `https://pointcast.xyz/collect/@${profile.handle}.json`,
        og: `https://pointcast.xyz/collect/@${profile.handle}.og.png`,
        claimedDays,
        streak: claimedStreak(claimedDays, today.day),
        counts: {
          dogs: claimedDays.length,
          seals: new Set(tokens('seal_soulbound')).size,
          mugs: new Set(tokens('coffee_mugs')).size,
          nouns: new Set(tokens('visit_nouns')).size,
        },
        calendar: kennelGrid(),
        source: 'Public Profile Objects ownership and public FA2 balances read through TzKT at build time.',
      };
    }));
  })();
  return collectorsPromise;
}
