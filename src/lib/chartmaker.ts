export interface ChartmakerSource {
  slug: string;
  name: string;
  category: 'pointcast' | 'weather' | 'markets' | 'sports' | 'web' | 'local';
  status: 'native' | 'addable' | 'candidate';
  endpoint: string;
  cadence: string;
  measures: string[];
  joinKeys: string[];
  note: string;
}

export interface ChartmakerRecipe {
  slug: string;
  name: string;
  mode: 'cross-chart' | 'timeline' | 'scorecard' | 'map';
  sources: string[];
  question: string;
  output: string;
}

export const CHARTMAKER_SOURCES: ChartmakerSource[] = [
  {
    slug: 'pointcast-blocks',
    name: 'PointCast block ledger',
    category: 'pointcast',
    status: 'native',
    endpoint: '/blocks.json',
    cadence: 'build-time + publish',
    measures: ['blocks per day', 'channels', 'latest receipt', 'publishing velocity'],
    joinKeys: ['date', 'channel', 'blockId'],
    note: 'Canonical immutable receipt stream. This is the trusted spine for Chart of the Day.',
  },
  {
    slug: 'pointcast-now',
    name: 'PointCast Now state',
    category: 'pointcast',
    status: 'native',
    endpoint: '/now.json',
    cadence: 'publish-time snapshot',
    measures: ['current block', 'front-door state', 'featured route', 'broadcast payloads'],
    joinKeys: ['date', 'route', 'blockId'],
    note: 'Best source for the current action card and front-door context.',
  },
  {
    slug: 'pointcast-apps',
    name: 'PointCast app shelf',
    category: 'pointcast',
    status: 'native',
    endpoint: '/apps.json',
    cadence: 'publish-time snapshot',
    measures: ['apps', 'channels', 'kinds', 'paths'],
    joinKeys: ['path', 'channel', 'kind'],
    note: 'Turns the app layer itself into a chartable catalog.',
  },
  {
    slug: 'el-segundo-weather',
    name: 'El Segundo weather',
    category: 'weather',
    status: 'addable',
    endpoint: 'https://api.open-meteo.com/v1/forecast?latitude=33.9192&longitude=-118.4165&hourly=temperature_2m,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FLos_Angeles',
    cadence: 'hourly forecast',
    measures: ['temperature', 'wind speed', 'humidity', 'precipitation'],
    joinKeys: ['date', 'hour', 'location'],
    note: 'No-key weather feed suited for local mood, shipping weather, and beach-day overlays.',
  },
  {
    slug: 'market-watchlist',
    name: 'Market watchlist',
    category: 'markets',
    status: 'addable',
    endpoint: 'https://stooq.com/q/l/?s=aapl.us,tsla.us,btc.v&f=sd2t2ohlcv&h&e=csv',
    cadence: 'near-market refresh',
    measures: ['open', 'high', 'low', 'close', 'volume'],
    joinKeys: ['symbol', 'date'],
    note: 'CSV watchlist adapter for equities and crypto-style symbols; good enough for public trend cards, not trading advice.',
  },
  {
    slug: 'nba-scoreboard',
    name: 'NBA scoreboard',
    category: 'sports',
    status: 'candidate',
    endpoint: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    cadence: 'game-day refresh',
    measures: ['score', 'status', 'teams', 'start time'],
    joinKeys: ['date', 'team', 'league'],
    note: 'Candidate sports feed for live scoreboard strips and sports-versus-market/weather experiments.',
  },
  {
    slug: 'mlb-scoreboard',
    name: 'MLB scoreboard',
    category: 'sports',
    status: 'candidate',
    endpoint: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    cadence: 'game-day refresh',
    measures: ['score', 'status', 'teams', 'start time'],
    joinKeys: ['date', 'team', 'league'],
    note: 'Useful for daily slate density and local-team timeline overlays.',
  },
  {
    slug: 'rss-feed-slot',
    name: 'RSS / JSON feed slot',
    category: 'web',
    status: 'addable',
    endpoint: '/chartmaker.json#feeds',
    cadence: 'source-defined',
    measures: ['items', 'published time', 'authors', 'tags'],
    joinKeys: ['url', 'date', 'tag'],
    note: 'Open slot for hand-picked feeds: news, blogs, releases, weather alerts, or product drops.',
  },
  {
    slug: 'browser-local-saves',
    name: 'Browser-local saves',
    category: 'local',
    status: 'candidate',
    endpoint: 'localStorage:pc:*',
    cadence: 'client-side only',
    measures: ['visited rooms', 'saved blocks', 'wallet-local hints', 'collected drops'],
    joinKeys: ['route', 'date', 'local id'],
    note: 'Private, accountless overlay for personal timelines. Never shipped back to the server.',
  },
];

export const CHARTMAKER_RECIPES: ChartmakerRecipe[] = [
  {
    slug: 'shipping-weather',
    name: 'Shipping weather',
    mode: 'cross-chart',
    sources: ['pointcast-blocks', 'el-segundo-weather'],
    question: 'Do high-output PointCast days cluster around certain local weather patterns?',
    output: 'Daily bars for blocks, with temperature and wind as overlay lines.',
  },
  {
    slug: 'market-mood-timeline',
    name: 'Market mood timeline',
    mode: 'timeline',
    sources: ['pointcast-blocks', 'market-watchlist', 'pointcast-now'],
    question: 'What was PointCast publishing while the watchlist moved?',
    output: 'One dated lane for blocks, one lane for market closes, one lane for front-door state.',
  },
  {
    slug: 'sports-pulse',
    name: 'Sports pulse',
    mode: 'scorecard',
    sources: ['nba-scoreboard', 'mlb-scoreboard', 'pointcast-now'],
    question: 'What games are live around the broadcast right now?',
    output: 'Compact live scoreboard cards with a PointCast action beside them.',
  },
  {
    slug: 'app-surface-growth',
    name: 'App surface growth',
    mode: 'timeline',
    sources: ['pointcast-apps', 'pointcast-blocks'],
    question: 'Which app surfaces are expanding and which ones need another receipt?',
    output: 'App count and route launches by channel over time.',
  },
  {
    slug: 'room-memory-map',
    name: 'Room memory map',
    mode: 'map',
    sources: ['browser-local-saves', 'pointcast-apps'],
    question: 'Where has this browser actually been inside PointCast?',
    output: 'A local-only route graph with most recent room and saved blocks.',
  },
];

export function getChartmakerPacket(now = new Date()) {
  return {
    slug: 'pointcast-chartmaker',
    name: 'PointCast Chartmaker',
    description: 'A lightweight chart lab for combining PointCast-native data with weather, market, sports, feed, and browser-local sources.',
    generatedAt: now.toISOString(),
    canonical: 'https://pointcast.xyz/chartmaker',
    sources: CHARTMAKER_SOURCES,
    recipes: CHARTMAKER_RECIPES,
    nextBuilds: [
      'Add a serverless /api/chartmaker/proxy allowlist for no-key feeds.',
      'Persist hand-picked feed definitions in content/chartmaker once the schema settles.',
      'Add client-side CSV/JSON fetch previews for weather, stocks, and scoreboards.',
      'Promote one recipe per day into /chart as the rotating Chart of the Day.',
    ],
  };
}
