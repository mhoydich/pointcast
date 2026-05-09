import type { APIRoute } from 'astro';
import { QUIET_HOUR_ROOMS, QUIET_HOURS_RELEASE, roomUtcHourMap } from '../lib/quietHours';

export const GET: APIRoute = async () => {
  const rooms = QUIET_HOUR_ROOMS.map((room) => ({
    id: room.id,
    name: room.name,
    subtitle: room.subtitle,
    hourBand: room.hourBand,
    posture: room.postureVerb,
    practice: room.practice,
    romanNumeral: room.romanNumeral,
    accent: room.accent,
  }));

  const payload = {
    $schema: 'https://pointcast.xyz/quiet-hours.json',
    release: QUIET_HOURS_RELEASE,
    rooms,
    roomOfNowFor: {
      signature: 'roomOfNowFor(utcHour: 0-23): roomId',
      note: 'Hour bands are interpreted against the hour passed by the caller. The human page uses visitor-local time; this UTC map is a deterministic machine helper.',
      utcHourMap: roomUtcHourMap(),
    },
    generatedAt: new Date().toISOString(),
    human: QUIET_HOURS_RELEASE.human,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
