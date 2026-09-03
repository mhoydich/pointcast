import { collectSitting, claimedStreak, kennelGrid, nextSealAt } from '../../../src/lib/collect-desk.ts';
import { listProfilePages } from '../../../src/lib/profile-object.mjs';
import contracts from '../../../src/data/contracts.json';
import {
  authJson,
  readSessionFromRequest,
} from '../auth/session.ts';
import {
  getMeHoldingsPayload,
  tezosIdentities,
  type MeCollectionHoldings,
} from '../me/_holdings.ts';
import { requireCollectDb, type CollectEnv } from './_shared.ts';
import { getUserKennelClaims } from '../kennel-club/_claims.ts';

function allCollections(wallets: Awaited<ReturnType<typeof getMeHoldingsPayload>>['wallets']): MeCollectionHoldings[] {
  return wallets.flatMap((wallet) => wallet.collections);
}

function uniqueTokenIds(collections: MeCollectionHoldings[], slug: string): string[] {
  return [...new Set(collections
    .filter((collection) => collection.slug === slug)
    .flatMap((collection) => collection.tokens.map((token) => token.tokenId)))];
}

export const onRequestGet: PagesFunction<CollectEnv> = async ({ request, env }) => {
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, signedIn: false, reason: 'unauthorized' }, { status: 401 });

  const cache = typeof caches === 'undefined' ? null : caches.default;
  const db = requireCollectDb(env);
  const dogs = await getUserKennelClaims(db ?? undefined, current.user.userId);
  const holdings = await getMeHoldingsPayload(current.user, { cache, dogs });
  const collections = allCollections(holdings.wallets);
  const kennelTokenIds = uniqueTokenIds(collections, 'kennel_club');
  const chainClaimedDays = kennelTokenIds
    .map((tokenId) => Number(tokenId) + 1)
    .filter((day) => Number.isSafeInteger(day) && day >= 1 && day <= 30)
  const ledgerClaimedDays = dogs
    .filter((dog) => dog.status === 'held' || dog.status === 'delivered')
    .map((dog) => dog.tokenId + 1);
  const claimedDays = [...new Set([...chainClaimedDays, ...ledgerClaimedDays])].sort((a, b) => a - b);
  const sitting = collectSitting();
  const addresses = tezosIdentities(current.user.identities);
  let profile: Awaited<ReturnType<typeof listProfilePages>>[number] | null = null;
  try {
    const profiles = await listProfilePages(contracts.profile_objects.mainnet);
    profile = profiles.find((candidate) => addresses.includes(candidate.owner)) ?? null;
  } catch {
    // The profile contract is an enhancement; the private collection still renders.
  }
  let emailStatus: 'none' | 'pending' | 'confirmed' | 'unsubscribed' = 'none';
  if (db) {
    const row = await db.prepare(`
      SELECT status FROM subscribers
      WHERE user_id = ?
      ORDER BY confirmed_at DESC, created_at DESC
      LIMIT 1
    `).bind(current.user.userId).first<{ status: typeof emailStatus }>();
    if (row?.status) emailStatus = row.status;
  }

  const response = {
    ok: true,
    signedIn: true,
    collector: {
      userId: current.user.userId,
      name: current.user.preferredName.includes('@') ? 'Collector' : current.user.preferredName,
      providers: [...new Set(current.user.identities.map((identity) => identity.provider))],
      wallets: addresses,
    },
    subscription: { status: emailStatus },
    today: {
      day: sitting.day,
      tokenId: sitting.tokenId,
      name: sitting.name,
      claimEndpoint: '/api/kennel-club/claim',
    },
    calendar: kennelGrid(),
    claimedDays,
    heldDogs: dogs.filter((dog) => dog.status === 'held').length,
    streak: claimedStreak(claimedDays, sitting.day),
    nextSealAt: nextSealAt(claimedDays),
    completion: {
      claimed: claimedDays.length,
      total: 30,
      promise: 'Complete September to earn the September Sitting seal.',
    },
    handle: profile ? {
      status: 'claimed',
      handle: profile.handle,
      href: `/collect/@${profile.handle}`,
    } : {
      status: 'available',
      label: 'Claim yours',
      href: '/me',
    },
    objects: {
      sealsEarned: new Set(holdings.wallets.flatMap((wallet) => wallet.seals.map((seal) => seal.tokenId))).size,
      mugsHeld: uniqueTokenIds(collections, 'coffee_mugs').length,
      nounsHeld: uniqueTokenIds(collections, 'visit_nouns').length,
    },
    generatedAt: new Date().toISOString(),
  };
  return authJson(response, {
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  });
};
