/**
 * /kennel-club.json — the calendar door, answered at request time.
 *
 * This used to be src/pages/kennel-club.json.ts, which baked "today" into the
 * build output and then told every agent the wrong dog until someone deployed
 * again. It is a Pages Function now; the prerendered twin was deleted so Pages
 * cannot shadow this route with a stale static file.
 */
import {
  KENNEL_CLUB,
  KENNEL_CLUB_CANONICAL,
  KENNEL_CLUB_MINT_LIVE_URL,
  calendar,
  losAngelesDate,
  sittingOfTheDay,
  sittingPayload,
} from '../src/lib/kennel-club';
import { getKennelClubMintState, unavailableKennelClubMintState } from '../src/lib/kennel-club-mint';

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
  const date = losAngelesDate();
  const today = sittingOfTheDay(date);
  const snapshotAt = new Date().toISOString();
  const mint = {
    ...(await getKennelClubMintState(today.tokenId).catch(() => unavailableKennelClubMintState(today.tokenId))),
    liveUrl: KENNEL_CLUB_MINT_LIVE_URL,
    snapshotAt,
  };
  return new Response(JSON.stringify({
    spec: 'pointcast.kennel-club-calendar/v1',
    canonical: KENNEL_CLUB_CANONICAL,
    title: 'Kennel Club · The September Sitting',
    timeZone: 'America/Los_Angeles',
    calendarMonth: '2026-09',
    status: KENNEL_CLUB.status,
    resolvedAt: 'request',
    todayUrl: 'https://pointcast.xyz/api/kennel-club/today',
    today: { date, ...sittingPayload(today) },
    lateStartNote: 'The club opened two days late; the first two dogs were already waiting.',
    mint,
    claims: {
      liveUrl: KENNEL_CLUB_MINT_LIVE_URL,
      snapshotAt,
      unavailable: true,
      note: 'Claim counts are session-backed D1 state and are read live from mint.liveUrl.',
      cap: null,
      capUsed: null,
      remaining: null,
      claimed: null,
      held: null,
      delivered: null,
      failed: null,
      recent: [],
    },
    calendar: calendar(date),
  }, null, 2), { headers: HEADERS });
};
