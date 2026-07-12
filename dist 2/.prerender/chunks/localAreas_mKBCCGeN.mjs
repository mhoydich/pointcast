import { B as BEACON_CENTER, R as RADIUS_MILES, a as RADIUS_METERS } from './neighborhoods_BtGyzOCy.mjs';

const LOCAL_AREA_RADIUS = {
  name: "PointCast participation radius",
  label: "25-mile local layer",
  radiusMiles: RADIUS_MILES,
  radiusMeters: RADIUS_METERS,
  anchor: {
    name: BEACON_CENTER.placeName,
    coords: {
      latitude: BEACON_CENTER.lat,
      longitude: BEACON_CENTER.lng
    }
  },
  policy: "Start with the 25-mile Beacon radius for anything that needs people to meet, trade, play, teach, or bring something physical. Keep the 100-mile Local lens for broadcast, stations, and broader Southern California context."
};
const LOCAL_AREAS = [
  {
    slug: "paddle-exchange",
    path: "/paddle-exchange",
    name: "Paddle Tide Exchange",
    shortName: "Paddle Tide",
    kicker: "pickleball library",
    noun: "Noun buoy",
    status: "pilot",
    description: "A local paddle shelf for South Bay pickleball players: register a profile, name the paddle you play, list paddles you would trade, lend, try, or donate into the library.",
    radiusFit: "Twenty-five miles is the right start because paddles are physical, trial windows are short, and court handoffs work best inside a Saturday-morning drive.",
    actions: ["profile registry", "DUPR handle field", "trade shelf", "library loans"],
    palette: { ink: "#0f6258", wash: "#e7f4ef", rule: "#8fc9bd" }
  },
  {
    slug: "meetups",
    path: "/meetups",
    name: "Mike-led Meetups",
    shortName: "Meetups",
    kicker: "community calendar",
    noun: "Pier table",
    status: "forming",
    description: "A simple page for Mike Hoydich led events: court office hours, beach walks, build nights, tasting tables, and small local sessions with a clear place to RSVP.",
    radiusFit: "The radius keeps the invite human: close enough for repeat attendance, wide enough to include South Bay, Westside, harbor, and downtown-edge friends.",
    actions: ["event series", "RSVP notes", "host prompts", "post-meetup receipts"],
    palette: { ink: "#185fa5", wash: "#eef4fa", rule: "#9dc2e0" }
  },
  {
    slug: "university-of-el-segundo",
    path: "/university-of-el-segundo",
    name: "University of El Segundo",
    shortName: "UES",
    kicker: "course framework",
    noun: "First Tide",
    status: "seed",
    description: "A neighborhood learning club with course tracks, session notes, and participation roles. No degrees, no campus cosplay: just people teaching what they actually know.",
    radiusFit: "UES can invite beyond city limits, but the first cohort should stay inside the participation radius so sessions turn into repeat relationships.",
    actions: ["course tracks", "host roster", "session notes", "participation tiers"],
    palette: { ink: "#6f4f14", wash: "#fff4dc", rule: "#e3bc69" }
  },
  {
    slug: "honey-league",
    path: "/honey-league",
    name: "Local Honey League",
    shortName: "Honey League",
    kicker: "soft standings",
    noun: "Comb ledger",
    status: "forming",
    description: "A warm local league for reciprocal acts: play a match, lend a paddle, bring local honey, host a tiny lesson, publish a useful note, and keep the standings kind.",
    radiusFit: "A league needs repeat contact and trust. Twenty-five miles gives it a coastal circuit without becoming a spreadsheet for strangers.",
    actions: ["season ladder", "honey table", "service points", "local notes"],
    palette: { ink: "#9a5f0b", wash: "#fff0bf", rule: "#e2a93e" }
  }
];
const PADDLE_EXCHANGE_MODES = [
  {
    id: "try",
    label: "Try-before-trade",
    promise: "Meet at a local court and play one warmup game before anyone swaps anything.",
    signal: "Best for players who are paddle-curious but do not want another blind buy."
  },
  {
    id: "library",
    label: "Library loan",
    promise: "A short loan from the community shelf, logged by name, date, and expected return.",
    signal: "Best for beginners, visiting friends, and UES Court Craft sessions."
  },
  {
    id: "trade",
    label: "Trade shelf",
    promise: "List what you use, what you would move, and what kind of feel you are chasing.",
    signal: "Best for players with one paddle too many and a specific wish."
  },
  {
    id: "dupr",
    label: "DUPR-ready match",
    promise: "Record a DUPR handle or profile link now; real login can be added after API access is confirmed.",
    signal: "Best for pairing test games by approximate level without over-formalizing the exchange."
  }
];
const PADDLE_PROFILE_FIELDS = [
  { id: "name", label: "Name", kind: "text", required: true },
  { id: "neighborhood", label: "Neighborhood", kind: "text", required: true },
  { id: "dupr", label: "DUPR handle or link", kind: "text", required: false },
  { id: "currentPaddle", label: "Paddle you use", kind: "text", required: true },
  { id: "openPaddles", label: "Open to trade, lend, or try", kind: "textarea", required: false },
  { id: "court", label: "Usual court", kind: "text", required: false },
  { id: "notes", label: "Fit notes", kind: "textarea", required: false }
];
const PADDLE_LIBRARY_SLOTS = [
  {
    name: "Sea Glass Control",
    feel: "soft touch, long dink rallies, patient resets",
    status: "library target",
    steward: "Court Craft"
  },
  {
    name: "Main Street Power",
    feel: "drive-heavy games, singles practice, confident counters",
    status: "library target",
    steward: "Paddle Tide"
  },
  {
    name: "Marine Layer Hybrid",
    feel: "middle lane: friendly for newer players, useful for doubles",
    status: "starter shelf",
    steward: "UES"
  },
  {
    name: "Noun Buoy Loaner",
    feel: "durable beginner loaner with a visible return tag",
    status: "starter shelf",
    steward: "Honey League"
  }
];
const MEETUP_SERIES = [
  {
    slug: "court-office-hours",
    title: "Court Office Hours",
    cadence: "weekly pilot",
    where: "El Segundo Rec Park or another in-radius court",
    format: "Warmups, paddle trials, doubles, and one useful local note before leaving.",
    connectedArea: "Paddle Tide"
  },
  {
    slug: "deans-walk",
    title: "Dean's Walk",
    cadence: "monthly",
    where: "beach, Main Street, dunes edge, or a coffee patio",
    format: "Mike-led open walk for new people, ideas, lightweight introductions, and one session topic.",
    connectedArea: "University of El Segundo"
  },
  {
    slug: "pier-table-build",
    title: "Pier Table Build Night",
    cadence: "biweekly when active",
    where: "quiet table, laptop-friendly, inside the radius",
    format: "Bring one thing to make more real: a page, a note, a flyer, a roster, a tiny repair.",
    connectedArea: "PointCast Areas"
  },
  {
    slug: "honey-saturday",
    title: "Honey Saturday",
    cadence: "seasonal",
    where: "rotating local table",
    format: "Taste, trade notes, score a gentle league point, and publish the best source or recipe.",
    connectedArea: "Honey League"
  }
];
const UNIVERSITY_TRACKS = [
  {
    slug: "saltwater-skills",
    title: "Saltwater Skills",
    frame: "Tides, beach reading, marine layer, shoreline safety, and the small practical literacy of living beside the Pacific.",
    firstSession: "Read a tide chart, pick a beach window, and name one ocean condition worth watching.",
    connectsTo: ["Meetups", "Local notes"]
  },
  {
    slug: "court-craft",
    title: "Court Craft",
    frame: "Pickleball fundamentals, doubles etiquette, paddle feel, ladder play, and friendly match structure.",
    firstSession: "Run a dink/reset clinic and open the paddle shelf for ten-minute trials.",
    connectsTo: ["Paddle Tide", "Honey League"]
  },
  {
    slug: "hands-and-trades",
    title: "Hands & Trades",
    frame: "Small repairs, useful craft, bike fixes, planter boxes, food skills, and the dignity of knowing how to do one real thing.",
    firstSession: "Each person brings one broken, dull, loose, or confusing object and leaves with a next move.",
    connectsTo: ["Meetups", "Studio Night"]
  },
  {
    slug: "civic-layer",
    title: "Civic Layer",
    frame: "How El Segundo actually works: city meetings, planning, airport edges, water, schools, parks, and local decisions.",
    firstSession: "Map one local decision path from public notice to meeting to vote to follow-up.",
    connectsTo: ["Beacon", "PointCast blocks"]
  },
  {
    slug: "honey-and-garden",
    title: "Honey & Garden",
    frame: "Local honey, native planting, seasonal harvests, neighborhood tables, and pollinator-aware gardening.",
    firstSession: "Pair a honey tasting with one native planting move and a published field note.",
    connectsTo: ["Honey League", "Nature"]
  },
  {
    slug: "studio-night",
    title: "Studio Night",
    frame: "A low-bar, high-frequency demo room for anything someone made this week.",
    firstSession: "Three seven-minute demos, no slide polish, one receipt per demo.",
    connectsTo: ["Meetups", "PointCast"]
  }
];
const UNIVERSITY_PARTICIPATION_TIERS = [
  {
    name: "Auditor",
    threshold: "show up once",
    role: "Attend a session, learn the room, no commitment required."
  },
  {
    name: "Regular",
    threshold: "three sessions",
    role: "Gets early notice and helps keep one track alive."
  },
  {
    name: "Host",
    threshold: "one prepared session",
    role: "Leads a practical session and publishes a one-page note afterward."
  },
  {
    name: "Steward",
    threshold: "one active track",
    role: "Keeps cadence, welcomes first-timers, and finds the next host."
  }
];
const FIRST_TIDE_FORMAT = [
  { minutes: "0-10", label: "Roll-in", detail: "Coffee, names, neighborhoods, and one thing each person can teach or wants to learn." },
  { minutes: "10-25", label: "Mike's frame", detail: "What UES is, what it is not, the tracks, and how to host without overbuilding." },
  { minutes: "25-55", label: "Three demos", detail: "Court Craft, Saltwater Skills, and Honey & Garden each get one seven-minute practical demo." },
  { minutes: "55-70", label: "Sign-up wall", detail: "People mark auditor, regular, host, or steward for the tracks they care about." },
  { minutes: "70-75", label: "Next date", detail: "Lock the next session before the room dissolves." }
];
const HONEY_LEAGUE_POINTS = [
  { action: "Play", points: 1, detail: "Finish a friendly match or ladder game inside the radius." },
  { action: "Lend", points: 2, detail: "Loan a paddle, tool, book, table item, or useful object and log the return." },
  { action: "Host", points: 3, detail: "Host a meetup, UES session, tasting, repair table, or court window." },
  { action: "Bring", points: 2, detail: "Bring a local honey, recipe, field note, or harvest-adjacent item with its source." },
  { action: "Publish", points: 3, detail: "Turn the thing into a PointCast note, photo receipt, map entry, or session recap." }
];
const HONEY_LEAGUE_SEASON = {
  name: "Season Zero",
  length: "6 weeks",
  cadence: "one table, one court window, one published note per week",
  cap: "Keep the first standings to 24 people so it feels like a table, not a platform.",
  prizes: [
    "First pick from the paddle library shelf for one week.",
    "A named Honey Saturday table slot.",
    "A small PointCast postcard or Nounish receipt when the season closes."
  ]
};
const AREA_NEXT_STEPS = [
  "Open the four pages as public seed surfaces.",
  "Use localStorage signups until the PointCast identity layer is ready.",
  "Collect the first 10 paddle profiles before adding a backend.",
  "Run First Tide as the first UES session and cross-list it on Meetups.",
  "Let Honey League Season Zero score only helpful acts, not money or status."
];

export { AREA_NEXT_STEPS as A, FIRST_TIDE_FORMAT as F, HONEY_LEAGUE_POINTS as H, LOCAL_AREAS as L, MEETUP_SERIES as M, PADDLE_LIBRARY_SLOTS as P, UNIVERSITY_PARTICIPATION_TIERS as U, LOCAL_AREA_RADIUS as a, HONEY_LEAGUE_SEASON as b, UNIVERSITY_TRACKS as c, PADDLE_PROFILE_FIELDS as d, PADDLE_EXCHANGE_MODES as e };
