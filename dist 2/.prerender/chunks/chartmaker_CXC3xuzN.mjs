const CHARTMAKER_SOURCES = [
  {
    slug: "pointcast-blocks",
    name: "PointCast block ledger",
    category: "pointcast",
    status: "native",
    endpoint: "/blocks.json",
    cadence: "build-time + publish",
    measures: ["blocks per day", "channels", "latest receipt", "publishing velocity"],
    joinKeys: ["date", "channel", "blockId"],
    note: "Canonical immutable receipt stream. This is the trusted spine for Chart of the Day."
  },
  {
    slug: "pointcast-now",
    name: "PointCast Now state",
    category: "pointcast",
    status: "native",
    endpoint: "/now.json",
    cadence: "publish-time snapshot",
    measures: ["current block", "front-door state", "featured route", "broadcast payloads"],
    joinKeys: ["date", "route", "blockId"],
    note: "Best source for the current action card and front-door context."
  },
  {
    slug: "pointcast-apps",
    name: "PointCast app shelf",
    category: "pointcast",
    status: "native",
    endpoint: "/apps.json",
    cadence: "publish-time snapshot",
    measures: ["apps", "channels", "kinds", "paths"],
    joinKeys: ["path", "channel", "kind"],
    note: "Turns the app layer itself into a chartable catalog."
  },
  {
    slug: "el-segundo-weather",
    name: "El Segundo weather",
    category: "weather",
    status: "addable",
    endpoint: "https://api.open-meteo.com/v1/forecast?latitude=33.9192&longitude=-118.4165&hourly=temperature_2m,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FLos_Angeles",
    cadence: "hourly forecast",
    measures: ["temperature", "wind speed", "humidity", "precipitation"],
    joinKeys: ["date", "hour", "location"],
    note: "No-key weather feed suited for local mood, shipping weather, and beach-day overlays."
  },
  {
    slug: "market-watchlist",
    name: "Market watchlist",
    category: "markets",
    status: "addable",
    endpoint: "https://stooq.com/q/l/?s=aapl.us,tsla.us,btc.v&f=sd2t2ohlcv&h&e=csv",
    cadence: "near-market refresh",
    measures: ["open", "high", "low", "close", "volume"],
    joinKeys: ["symbol", "date"],
    note: "CSV watchlist adapter for equities and crypto-style symbols; good enough for public trend cards, not trading advice."
  },
  {
    slug: "coingecko-crypto",
    name: "CoinGecko simple prices",
    category: "markets",
    status: "addable",
    endpoint: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tezos&vs_currencies=usd&include_24hr_change=true",
    cadence: "near-real-time public quote",
    measures: ["usd price", "24h change"],
    joinKeys: ["asset", "date"],
    note: "Crypto watchlist source for public price mood, collectible context, and treasury-adjacent charts."
  },
  {
    slug: "nba-scoreboard",
    name: "NBA scoreboard",
    category: "sports",
    status: "candidate",
    endpoint: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    cadence: "game-day refresh",
    measures: ["score", "status", "teams", "start time"],
    joinKeys: ["date", "team", "league"],
    note: "Candidate sports feed for live scoreboard strips and sports-versus-market/weather experiments."
  },
  {
    slug: "open-meteo-air-quality",
    name: "El Segundo air quality",
    category: "weather",
    status: "addable",
    endpoint: "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=33.9192&longitude=-118.4165&hourly=pm10,pm2_5,us_aqi&timezone=America%2FLos_Angeles",
    cadence: "hourly forecast",
    measures: ["US AQI", "PM2.5", "PM10"],
    joinKeys: ["date", "hour", "location"],
    note: "No-key air-quality lane for local comfort, outdoor-room readiness, and health-of-the-day overlays."
  },
  {
    slug: "open-meteo-marine",
    name: "South Bay marine forecast",
    category: "ocean",
    status: "addable",
    endpoint: "https://marine-api.open-meteo.com/v1/marine?latitude=33.9192&longitude=-118.4165&hourly=wave_height,wave_period,sea_surface_temperature&timezone=America%2FLos_Angeles",
    cadence: "hourly forecast",
    measures: ["wave height", "wave period", "sea surface temperature"],
    joinKeys: ["date", "hour", "location"],
    note: "Ocean lane for tidepool, beach, and local field-note charts."
  },
  {
    slug: "usgs-earthquakes",
    name: "USGS earthquakes",
    category: "earth",
    status: "addable",
    endpoint: "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-05-05&endtime=2026-05-06&minmagnitude=4.5",
    cadence: "event stream",
    measures: ["magnitude", "place", "time"],
    joinKeys: ["date", "place", "magnitude"],
    note: "A global geology pulse that makes the daily board feel planetary without needing credentials."
  },
  {
    slug: "nasa-apod",
    name: "NASA Astronomy Picture of the Day",
    category: "culture",
    status: "addable",
    endpoint: "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
    cadence: "daily",
    measures: ["title", "media type", "date"],
    joinKeys: ["date"],
    note: "Daily sky image metadata for culture, mood, and visual prompt context."
  },
  {
    slug: "hacker-news-frontpage",
    name: "Hacker News front page",
    category: "web",
    status: "addable",
    endpoint: "https://hn.algolia.com/api/v1/search_by_date?tags=front_page",
    cadence: "near-real-time feed",
    measures: ["title", "points", "author", "created time"],
    joinKeys: ["date", "story id", "author"],
    note: "Ambient internet-intensity feed for tech/culture overlays."
  },
  {
    slug: "mlb-scoreboard",
    name: "MLB scoreboard",
    category: "sports",
    status: "candidate",
    endpoint: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
    cadence: "game-day refresh",
    measures: ["score", "status", "teams", "start time"],
    joinKeys: ["date", "team", "league"],
    note: "Useful for daily slate density and local-team timeline overlays."
  },
  {
    slug: "rss-feed-slot",
    name: "RSS / JSON feed slot",
    category: "web",
    status: "addable",
    endpoint: "/chartmaker.json#feeds",
    cadence: "source-defined",
    measures: ["items", "published time", "authors", "tags"],
    joinKeys: ["url", "date", "tag"],
    note: "Open slot for hand-picked feeds: news, blogs, releases, weather alerts, or product drops."
  },
  {
    slug: "browser-local-saves",
    name: "Browser-local saves",
    category: "local",
    status: "candidate",
    endpoint: "localStorage:pc:*",
    cadence: "client-side only",
    measures: ["visited rooms", "saved blocks", "wallet-local hints", "collected drops"],
    joinKeys: ["route", "date", "local id"],
    note: "Private, accountless overlay for personal timelines. Never shipped back to the server."
  }
];
const CHARTMAKER_TODAY_CHARTS = [
  {
    slug: "may-5-shipping-velocity",
    title: "PointCast Shipping Velocity",
    kicker: "LEDGER · TUESDAY MAY 5",
    source: "PointCast block ledger",
    sourceUrl: "/blocks.json",
    mode: "bar",
    unit: "blocks",
    summary: "Block 0429 is live on the May 5 board, so today has a visible receipt to anchor the charts.",
    read: "Use this as the local truth lane: every other source can be compared against what PointCast actually shipped.",
    points: [
      { label: "Fri", value: 3 },
      { label: "Sat", value: 3 },
      { label: "Sun", value: 0 },
      { label: "Mon", value: 3 },
      { label: "Tue", value: 1, note: "0429" }
    ]
  },
  {
    slug: "el-segundo-weather-window",
    title: "El Segundo Weather Window",
    kicker: "OPEN-METEO · LOCAL",
    source: "Open-Meteo forecast",
    sourceUrl: "https://api.open-meteo.com/",
    mode: "line",
    unit: "deg C",
    summary: "May 5 is mild: 12.9-18.2 C with no forecast precipitation and max wind near 18.8 km/h.",
    read: "Good local-working weather: cool, dry, and a little breezy.",
    points: [
      { label: "00", value: 14 },
      { label: "01", value: 14.6 },
      { label: "02", value: 14.5 },
      { label: "03", value: 13.4 },
      { label: "04", value: 14.4 },
      { label: "05", value: 13.6 }
    ]
  },
  {
    slug: "air-quality-rise",
    title: "Air Quality Rise",
    kicker: "OPEN-METEO · AQI",
    source: "Open-Meteo air quality",
    sourceUrl: "https://air-quality-api.open-meteo.com/",
    mode: "line",
    unit: "US AQI",
    summary: "US AQI sits in the low-to-mid 30s in the early hours, with PM2.5 rising from 11.6 to 18.6.",
    read: "A calm air-quality lane for outdoor notes and walkable-room ideas.",
    points: [
      { label: "00", value: 35 },
      { label: "01", value: 33 },
      { label: "02", value: 32 },
      { label: "03", value: 33 },
      { label: "04", value: 35 },
      { label: "05", value: 36 }
    ]
  },
  {
    slug: "south-bay-wave-pulse",
    title: "South Bay Wave Pulse",
    kicker: "OPEN-METEO MARINE · OCEAN",
    source: "Open-Meteo marine forecast",
    sourceUrl: "https://marine-api.open-meteo.com/",
    mode: "line",
    unit: "m",
    summary: "Wave height is compact and steady around 0.54-0.58 m, with sea surface temperature at 16.6 C.",
    read: "A quiet ocean lane that pairs naturally with tidepool and local field notes.",
    points: [
      { label: "00", value: 0.56 },
      { label: "01", value: 0.56 },
      { label: "02", value: 0.54 },
      { label: "03", value: 0.56 },
      { label: "04", value: 0.56 },
      { label: "05", value: 0.58 }
    ]
  },
  {
    slug: "market-watchlist-range",
    title: "Market Watchlist Range",
    kicker: "STOOQ · PUBLIC CSV",
    source: "Stooq quote CSV",
    sourceUrl: "https://stooq.com/q/l/",
    mode: "bar",
    unit: "% intraday range",
    summary: "AAPL shows the widest range in the quick watchlist, followed by TSLA, then SPY.",
    read: "Use this as market weather, not advice: it is a volatility texture for the daily board.",
    points: [
      { label: "SPY", value: 0.49, note: "724.78 close" },
      { label: "AAPL", value: 2.91, note: "284.18 close" },
      { label: "TSLA", value: 3.32, note: "392.16 close" }
    ]
  },
  {
    slug: "crypto-mood",
    title: "Crypto Mood",
    kicker: "COINGECKO · 24H CHANGE",
    source: "CoinGecko simple price",
    sourceUrl: "https://www.coingecko.com/en/api",
    mode: "bar",
    unit: "% 24h",
    summary: "BTC, ETH, and XTZ are all green in the sampled 24h change feed.",
    read: "A useful collectible-context lane: crypto mood without turning PointCast into a trading desk.",
    points: [
      { label: "BTC", value: 2.04, note: "$81,644" },
      { label: "ETH", value: 0.75, note: "$2,373.70" },
      { label: "XTZ", value: 1.75, note: "$0.371" }
    ]
  },
  {
    slug: "nba-evening-slate",
    title: "NBA Evening Slate",
    kicker: "ESPN · SCOREBOARD",
    source: "ESPN NBA scoreboard",
    sourceUrl: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    mode: "timeline",
    unit: "games",
    summary: "Two NBA games are scheduled for the May 5 evening slate: CLE at DET and LAL at OKC.",
    read: "A small, high-signal sports strip: perfect for a Now-card companion.",
    points: [
      { label: "4:00p", value: 1, note: "CLE @ DET" },
      { label: "5:30p", value: 1, note: "LAL @ OKC" }
    ]
  },
  {
    slug: "mlb-slate-density",
    title: "MLB Slate Density",
    kicker: "ESPN · SCOREBOARD",
    source: "ESPN MLB scoreboard",
    sourceUrl: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
    mode: "bar",
    unit: "games",
    summary: "The MLB board is dense today: 15 scheduled games, with the first wave clustered around 3:40p PT.",
    read: "Great candidate for a live scoreboard row once Chartmaker gets a fetch proxy.",
    points: [
      { label: "3p", value: 5 },
      { label: "4p", value: 3 },
      { label: "5p", value: 4 },
      { label: "6p", value: 2 },
      { label: "7p", value: 1 }
    ]
  },
  {
    slug: "earthquake-pulse",
    title: "Earthquake Pulse",
    kicker: "USGS · GLOBAL",
    source: "USGS earthquake feed",
    sourceUrl: "https://earthquake.usgs.gov/fdsnws/event/1/",
    mode: "ranking",
    unit: "magnitude",
    summary: "The sampled May 5 global M4.5+ feed peaks at M5.1 on the Mid-Indian Ridge.",
    read: "This is the neat planetary lane: low friction, real-time-ish, and visually distinct from markets or sports.",
    points: [
      { label: "Mid-Indian", value: 5.1 },
      { label: "Peru", value: 5 },
      { label: "Babar", value: 4.5 },
      { label: "Banda", value: 4.5 },
      { label: "NZ", value: 4.5 }
    ]
  },
  {
    slug: "internet-sky-culture",
    title: "Internet + Sky Culture",
    kicker: "NASA APOD + HN",
    source: "NASA APOD and Hacker News Algolia",
    sourceUrl: "https://api.nasa.gov/",
    mode: "scorecard",
    unit: "signals",
    summary: 'NASA APOD is "Orion over Mount Teide"; the sampled HN front page is led by Notepad++ trademark discussion at 106 points.',
    read: "A culture lane for prompt fuel: one sky image, one tech-discourse pulse, one daily mood.",
    points: [
      { label: "APOD", value: 1, note: "Orion over Mount Teide" },
      { label: "HN top", value: 106, note: "Notepad++ trademark" },
      { label: "HN next", value: 82, note: "Del Monte peaches" },
      { label: "AI item", value: 54, note: "GLM-5V-Turbo" }
    ]
  }
];
const CHARTMAKER_RECIPES = [
  {
    slug: "shipping-weather",
    name: "Shipping weather",
    mode: "cross-chart",
    sources: ["pointcast-blocks", "el-segundo-weather"],
    question: "Do high-output PointCast days cluster around certain local weather patterns?",
    output: "Daily bars for blocks, with temperature and wind as overlay lines."
  },
  {
    slug: "market-mood-timeline",
    name: "Market mood timeline",
    mode: "timeline",
    sources: ["pointcast-blocks", "market-watchlist", "pointcast-now"],
    question: "What was PointCast publishing while the watchlist moved?",
    output: "One dated lane for blocks, one lane for market closes, one lane for front-door state."
  },
  {
    slug: "sports-pulse",
    name: "Sports pulse",
    mode: "scorecard",
    sources: ["nba-scoreboard", "mlb-scoreboard", "pointcast-now"],
    question: "What games are live around the broadcast right now?",
    output: "Compact live scoreboard cards with a PointCast action beside them."
  },
  {
    slug: "app-surface-growth",
    name: "App surface growth",
    mode: "timeline",
    sources: ["pointcast-apps", "pointcast-blocks"],
    question: "Which app surfaces are expanding and which ones need another receipt?",
    output: "App count and route launches by channel over time."
  },
  {
    slug: "room-memory-map",
    name: "Room memory map",
    mode: "map",
    sources: ["browser-local-saves", "pointcast-apps"],
    question: "Where has this browser actually been inside PointCast?",
    output: "A local-only route graph with most recent room and saved blocks."
  }
];
const CHARTMAKER_REMIXES = [
  {
    slug: "marine-layer-shipping",
    title: "Marine Layer Shipping",
    lane: "local",
    charts: ["may-5-shipping-velocity", "el-segundo-weather-window", "air-quality-rise", "south-bay-wave-pulse"],
    why: "Local atmosphere plus PointCast output turns the day into a readable field note: cool air, clean enough sky, small waves, one shipped receipt.",
    nextAction: "Make a combined weather x shipping chart with blocks as bars and temperature, AQI, and wave height as small overlay lanes."
  },
  {
    slug: "risk-on-collectibles",
    title: "Risk-On Collectibles",
    lane: "market",
    charts: ["market-watchlist-range", "crypto-mood", "may-5-shipping-velocity"],
    why: "AAPL, TSLA, BTC, ETH, and XTZ give a quick public-market mood without turning the app into a finance product.",
    nextAction: "Add a non-advice market mood badge to /now and pair it with mint/collector surfaces only as context."
  },
  {
    slug: "sports-evening-stack",
    title: "Sports Evening Stack",
    lane: "sports",
    charts: ["nba-evening-slate", "mlb-slate-density", "internet-sky-culture"],
    why: "The evening has a clean sports rhythm: two NBA games, a dense MLB slate, and enough internet culture to make a watch-card feel alive.",
    nextAction: "Build a single live scoreboard strip that can choose NBA or MLB based on active games."
  },
  {
    slug: "planetary-dashboard",
    title: "Planetary Dashboard",
    lane: "planet",
    charts: ["earthquake-pulse", "south-bay-wave-pulse", "internet-sky-culture"],
    why: "USGS, marine forecast, and NASA APOD make Chartmaker feel bigger than local productivity: earth, ocean, sky.",
    nextAction: "Turn this into a calm “world pulse” card with one event, one ocean value, and one sky image."
  },
  {
    slug: "agent-source-readiness",
    title: "Agent Source Readiness",
    lane: "culture",
    charts: ["internet-sky-culture", "may-5-shipping-velocity", "crypto-mood"],
    why: "This lane tests whether agents can explain the day from mixed sources without overclaiming: ledger facts, public APIs, and cultural prompts.",
    nextAction: "Add confidence labels per chart: native, public no-key, sampled, candidate, local-only."
  }
];
function getChartmakerPacket(now = /* @__PURE__ */ new Date()) {
  return {
    slug: "pointcast-chartmaker",
    name: "PointCast Chartmaker",
    description: "A lightweight chart lab for combining PointCast-native data with weather, market, sports, feed, and browser-local sources.",
    generatedAt: now.toISOString(),
    canonical: "https://pointcast.xyz/chartmaker",
    sources: CHARTMAKER_SOURCES,
    recipes: CHARTMAKER_RECIPES,
    today: {
      date: "2026-05-05",
      label: "Tuesday, May 5, 2026",
      charts: CHARTMAKER_TODAY_CHARTS,
      remixes: CHARTMAKER_REMIXES,
      v3: {
        name: "Chartmaker v3",
        thesis: "A daily board should not just show isolated charts; it should suggest useful crossovers that can become tomorrow’s app surfaces.",
        primaryAction: "Promote one remix into a live Chart of the Day variant."
      }
    },
    nextBuilds: [
      "Add a serverless /api/chartmaker/proxy allowlist for no-key feeds.",
      "Persist hand-picked feed definitions in content/chartmaker once the schema settles.",
      "Add client-side CSV/JSON fetch previews for weather, stocks, and scoreboards.",
      "Promote one recipe per day into /chart as the rotating Chart of the Day."
    ]
  };
}

export { getChartmakerPacket as g };
