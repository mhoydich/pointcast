/**
 * /api/kennel-club/mint — small, edge-cached live state for the daily FA2.
 *
 * This is deliberately the only browser-facing TzKT read for Kennel Club.
 * The static JSON twins retain their build snapshot and link here for the
 * current contract state.
 */
import {
  getKennelClubMintSnapshot,
  unavailableKennelClubMintSnapshot,
} from '../../../src/lib/kennel-club-mint';
import { losAngelesDate, sittingOfTheDay } from '../../../src/lib/kennel-club';
import {
  claimConfigured,
  claimDailyCap,
  emptyPublicKennelClaims,
  getPublicKennelClaims,
  type KennelClaimEnv,
} from './_claims';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  // Cloudflare may keep a shared response for 30 seconds; clients must not
  // treat a changing mint window as a long-lived browser artifact.
  'Cache-Control': 'public, max-age=30, s-maxage=30',
};

const NO_STORE_JSON_HEADERS = {
  ...JSON_HEADERS,
  'Cache-Control': 'no-store',
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

export const onRequestOptions: PagesFunction = () => new Response(null, {
  status: 204,
  headers: { ...JSON_HEADERS, 'Access-Control-Max-Age': '86400' },
});

export const onRequestGet: PagesFunction<KennelClaimEnv> = async ({ env = {} }) => {
  const date = losAngelesDate();
  const today = sittingOfTheDay(date);
  const cap = claimDailyCap(env.KENNEL_CLUB_CLAIM_DAILY_CAP);
  const configured = claimConfigured(env);
  try {
    const [mint, claims] = await Promise.all([
      getKennelClubMintSnapshot(today.tokenId),
      getPublicKennelClaims(env.AUTH_DB, today.tokenId, { cap, configured })
        .catch(() => emptyPublicKennelClaims(cap, configured)),
    ]);
    return json({
      ...mint,
      claims,
      live: true,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return json({
      ...unavailableKennelClubMintSnapshot(today.tokenId),
      claims: emptyPublicKennelClaims(cap, configured),
      live: false,
      updatedAt: new Date().toISOString(),
    }, { headers: NO_STORE_JSON_HEADERS });
  }
};
