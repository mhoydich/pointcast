import type { APIRoute } from 'astro';
import { KENNEL_CLUB, KENNEL_CLUB_CANONICAL, KENNEL_CLUB_MINT_LIVE_URL, calendar, losAngelesDate, sittingOfTheDay, sittingPayload } from '../lib/kennel-club';
import { getKennelClubMintState, unavailableKennelClubMintState } from '../lib/kennel-club-mint';

export const GET: APIRoute = async () => {
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
    today: { date, ...sittingPayload(today) },
    lateStartNote: 'The club opened two days late; the first two dogs were already waiting.',
    mint,
    calendar: calendar(date),
  }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'Access-Control-Allow-Origin': '*' } });
};
