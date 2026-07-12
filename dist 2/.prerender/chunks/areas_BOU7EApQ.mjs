import { L as LOCAL_AREAS, A as AREA_NEXT_STEPS, H as HONEY_LEAGUE_POINTS, b as HONEY_LEAGUE_SEASON, F as FIRST_TIDE_FORMAT, U as UNIVERSITY_PARTICIPATION_TIERS, c as UNIVERSITY_TRACKS, M as MEETUP_SERIES, P as PADDLE_LIBRARY_SLOTS, d as PADDLE_PROFILE_FIELDS, e as PADDLE_EXCHANGE_MODES, a as LOCAL_AREA_RADIUS } from './localAreas_mKBCCGeN.mjs';

const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/areas.json",
    name: "PointCast Areas",
    description: "Local PointCast participation areas inside the 25-mile El Segundo radius: paddle exchange and library, Mike-led meetups, University of El Segundo, and Local Honey League.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    human: "https://pointcast.xyz/areas",
    radius: LOCAL_AREA_RADIUS,
    areas: LOCAL_AREAS.map((area) => ({
      ...area,
      url: `https://pointcast.xyz${area.path}`
    })),
    paddleExchange: {
      url: "https://pointcast.xyz/paddle-exchange",
      modes: PADDLE_EXCHANGE_MODES,
      profileFields: PADDLE_PROFILE_FIELDS,
      librarySlots: PADDLE_LIBRARY_SLOTS,
      storage: "v0 browser-local profile only; backend and DUPR OAuth intentionally not claimed yet"
    },
    meetups: {
      url: "https://pointcast.xyz/meetups",
      series: MEETUP_SERIES
    },
    universityOfElSegundo: {
      url: "https://pointcast.xyz/university-of-el-segundo",
      tracks: UNIVERSITY_TRACKS,
      participationTiers: UNIVERSITY_PARTICIPATION_TIERS,
      firstTideFormat: FIRST_TIDE_FORMAT
    },
    honeyLeague: {
      url: "https://pointcast.xyz/honey-league",
      season: HONEY_LEAGUE_SEASON,
      scoring: HONEY_LEAGUE_POINTS
    },
    nextSteps: AREA_NEXT_STEPS,
    adjacent: {
      local: "https://pointcast.xyz/local",
      beacon: "https://pointcast.xyz/beacon",
      nature: "https://pointcast.xyz/nature",
      collabs: "https://pointcast.xyz/collabs",
      ping: "https://pointcast.xyz/ping"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
