import type { APIRoute } from 'astro';
import {
  AREA_NEXT_STEPS,
  FIRST_TIDE_FORMAT,
  HONEY_LEAGUE_POINTS,
  HONEY_LEAGUE_SEASON,
  LOCAL_AREAS,
  LOCAL_AREA_RADIUS,
  MEETUP_SERIES,
  PADDLE_EXCHANGE_MODES,
  PADDLE_LIBRARY_SLOTS,
  PADDLE_PROFILE_FIELDS,
  UNIVERSITY_PARTICIPATION_TIERS,
  UNIVERSITY_TRACKS,
} from '../lib/localAreas';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/areas.json',
    name: 'PointCast Areas',
    description:
      'Local PointCast participation areas inside the 25-mile El Segundo radius: paddle exchange and library, Mike-led meetups, University of El Segundo, and Local Honey League.',
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/areas',
    radius: LOCAL_AREA_RADIUS,
    areas: LOCAL_AREAS.map((area) => ({
      ...area,
      url: `https://pointcast.xyz${area.path}`,
    })),
    paddleExchange: {
      url: 'https://pointcast.xyz/paddle-exchange',
      modes: PADDLE_EXCHANGE_MODES,
      profileFields: PADDLE_PROFILE_FIELDS,
      librarySlots: PADDLE_LIBRARY_SLOTS,
      storage: 'v0 browser-local profile only; backend and DUPR OAuth intentionally not claimed yet',
    },
    meetups: {
      url: 'https://pointcast.xyz/meetups',
      series: MEETUP_SERIES,
    },
    universityOfElSegundo: {
      url: 'https://pointcast.xyz/university-of-el-segundo',
      tracks: UNIVERSITY_TRACKS,
      participationTiers: UNIVERSITY_PARTICIPATION_TIERS,
      firstTideFormat: FIRST_TIDE_FORMAT,
    },
    honeyLeague: {
      url: 'https://pointcast.xyz/honey-league',
      season: HONEY_LEAGUE_SEASON,
      scoring: HONEY_LEAGUE_POINTS,
    },
    nextSteps: AREA_NEXT_STEPS,
    adjacent: {
      local: 'https://pointcast.xyz/local',
      beacon: 'https://pointcast.xyz/beacon',
      nature: 'https://pointcast.xyz/nature',
      collabs: 'https://pointcast.xyz/collabs',
      ping: 'https://pointcast.xyz/ping',
    },
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
