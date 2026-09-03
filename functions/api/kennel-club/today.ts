/**
 * /api/kennel-club/today — which dog is sitting right now.
 *
 * The site is prerendered and deployed by hand, so no built page can be
 * trusted about the date. This is the one door that always knows: it resolves
 * the sitting from the Los Angeles clock at request time and hands back the
 * plate, the token id, and whatever the chain currently reports.
 *
 * The answer is shared with /api/kennel-club/mint through
 * readKennelClubLiveState, so the room and the claim desk cannot disagree.
 * NOTE: public/_headers must detach this path from the site-wide `/* no-store`
 * rule, or Pages will serve it uncached however this handler is written.
 */
import { kennelTodayPayload } from '../../../src/lib/kennel-today';
import { readKennelClubLiveState } from './mint';
import type { KennelClaimEnv } from './_claims';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  // A minute of shared cache. Short enough that midnight Pacific lands within
  // a minute; long enough that a busy room does not hammer TzKT.
  'Cache-Control': 'public, max-age=60, s-maxage=60',
};

export const onRequestOptions: PagesFunction = () => new Response(null, {
  status: 204,
  headers: { ...JSON_HEADERS, 'Access-Control-Max-Age': '86400' },
});

export const onRequestGet: PagesFunction<KennelClaimEnv> = async ({ env = {} }) => {
  const state = await readKennelClubLiveState(env);
  const payload = kennelTodayPayload({
    date: state.date,
    windowOpen: state.mint.today.windowOpen,
    minted: state.live ? state.mint.today.minted : null,
    claimsRemaining: state.claims.configured ? state.claims.remaining : null,
    claimsClaimed: state.claims.configured ? state.claims.claimed : null,
    live: state.live,
  });
  return new Response(JSON.stringify(payload), {
    headers: state.live ? JSON_HEADERS : { ...JSON_HEADERS, 'Cache-Control': 'no-store' },
  });
};
