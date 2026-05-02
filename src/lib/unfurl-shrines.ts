export interface UnfurlShrine {
  slug: string;
  path: string;
  miniPath: string;
  title: string;
  description: string;
  image: string;
  kind: 'home' | 'block' | 'page' | 'room' | 'campaign' | 'game' | 'feed' | 'system';
  audience: string;
  ritual: string;
  proof: string[];
  shrineSet?: string;
}

export interface ShrineSet {
  slug: string;
  title: string;
  label: string;
  description: string;
  background: string;
  backgroundVariants?: string[];
  kinds: UnfurlShrine['kind'][];
  slugs: string[];
}

export const SITE_URL = 'https://pointcast.xyz';

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}

export function absoluteImage(path: string): string {
  return path.startsWith('http') ? path : absoluteUrl(path);
}

const SHRINE_ITEMS = [
  {
    slug: 'home',
    path: '/',
    title: 'PointCast',
    description: 'The living broadcast: latest blocks, rooms, games, agent surfaces, and local signal in one front door.',
    image: '/images/og/og-home-v2.png',
    kind: 'home',
    audience: 'first-time visitors, launch posts, general social shares',
    ritual: 'Use when the ask is simply: come see what PointCast is.',
    proof: ['/blocks.json', '/agents.json', '/for-agents'],
  },
  {
    slug: 'breathe-0304',
    path: '/b/0304/',
    title: 'CH.SPN · 0304 — breathe',
    description: 'A single block unfurl with article metadata, Farcaster buttons, canonical JSON, and a 1200x630 block card.',
    image: '/images/og/b/0304.png',
    kind: 'block',
    audience: 'Farcaster, iMessage, X, Slack, and anyone inspecting per-block previews',
    ritual: 'Use as the reference specimen for whether block unfurls are healthy.',
    proof: ['/b/0304.json', '/c/spinning.json', '/c/spinning.rss'],
  },
  {
    slug: 'listening-room',
    path: '/listening-room',
    title: 'PointCast Listening Room',
    description: 'The space-sparkle music room: playlist, sponsors, room controls, and a big visual share card.',
    image: '/images/listening-room/pointcast-listening-room-space.png',
    kind: 'room',
    audience: 'music people, Nouns Cola people, Good Feels orbit, room-mode links',
    ritual: 'Use when the share should feel visual, warm, and immediately playable.',
    proof: ['/listening-room.json', '/b/0339', '/nouns-cola'],
  },
  {
    slug: 'nouns-cola',
    path: '/nouns-cola',
    title: 'Nouns Cola',
    description: 'A launch surface for the soda project: proposal, pack art, funding shape, and campaign context.',
    image: '/images/og/nouns-cola.png',
    kind: 'campaign',
    audience: 'Nouns, consumer product, sponsorship, and campaign readers',
    ritual: 'Use when the share needs a crisp object, not the whole site.',
    proof: ['/nouns-cola.json', '/nouns-cola-crush', '/dao'],
  },
  {
    slug: 'tag-signal',
    path: '/tag-signal',
    title: 'Tag Signal',
    description: 'A lightweight signal surface for tags, channels, and machine-readable discovery.',
    image: '/images/og/b/0389.png',
    kind: 'system',
    audience: 'agents, collaborators, and people tracing how the site labels itself',
    ritual: 'Use for infrastructure shares where the preview still needs to feel alive.',
    proof: ['/tag-signal.json', '/agents.json', '/mesh'],
  },
  {
    slug: 'tv',
    path: '/tv',
    title: 'PointCast TV',
    description: 'Ambient broadcast mode for the site: station surfaces, live blocks, weather, polls, and room-ready display.',
    image: '/images/og/og-home-v2.png',
    kind: 'room',
    audience: 'screens, shop displays, station experiments, ambient web people',
    ritual: 'Use when the link should promise a big-screen mode.',
    proof: ['/tv/assets', '/local.json', '/now.json'],
  },
  {
    slug: 'now',
    path: '/now',
    title: 'Right now on PointCast',
    description: 'Card of the day, latest blocks, contract state, and current site pulse in one live snapshot.',
    image: '/images/og/now.png',
    kind: 'page',
    audience: 'returning readers, launch check-ins, and anyone asking what is live today',
    ritual: 'Use as the “what is happening right now” share instead of explaining the whole archive.',
    proof: ['/now.json', '/today.json', '/status'],
  },
  {
    slug: 'archive',
    path: '/archive',
    title: 'PointCast Archive',
    description: 'Every block in chronological order, with filters, search, channels, and machine-readable mirrors.',
    image: '/images/og/archive.png',
    kind: 'page',
    audience: 'readers who want depth, crawlers, researchers, and people checking the record',
    ritual: 'Use when one block is too narrow and the homepage is too alive.',
    proof: ['/archive.json', '/blocks.json', '/sitemap-blocks.xml'],
  },
  {
    slug: 'mesh',
    path: '/mesh',
    title: 'PointCast Mesh',
    description: 'The local, online, and agent networks that PointCast sits inside, mapped as one crawlable system.',
    image: '/images/og/mesh.png',
    kind: 'system',
    audience: 'agent builders, systems readers, local collaborators, and anyone asking how it connects',
    ritual: 'Use when the share needs architecture and place instead of a single artifact.',
    proof: ['/agents.json', '/local.json', '/for-nodes'],
  },
  {
    slug: 'manifesto',
    path: '/manifesto',
    title: 'PointCast Manifesto',
    description: 'The canonical Q&A for what a Block is, why the site exists, and how human-AI publishing works here.',
    image: '/images/og/manifesto.png',
    kind: 'page',
    audience: 'new collaborators, AI-native publishing people, and anyone who needs the thesis',
    ritual: 'Use when the preview should answer “what is this?” with a durable page.',
    proof: ['/glossary', '/for-agents', '/agents.json'],
  },
  {
    slug: 'agents',
    path: '/for-agents',
    title: 'For agents',
    description: 'A manifest for crawlers, AI systems, and machine readers on how to read PointCast.',
    image: '/images/og/og-home-v2.png',
    kind: 'system',
    audience: 'LLM agents, search crawlers, workflow bots, and technical reviewers',
    ritual: 'Use when the URL is meant to be read twice: once by a human, once by software.',
    proof: ['/agents.json', '/llms.txt', '/llms-full.txt'],
  },
  {
    slug: 'battle',
    path: '/battle',
    title: 'Nouns Battler',
    description: 'Deterministic Nouns duels: every seed is a fighter, every matchup is reproducible.',
    image: '/images/og/battle.png',
    kind: 'game',
    audience: 'Nouns people, game testers, and anyone who wants a playable share',
    ritual: 'Use when the unfurl should invite a click, not just a read.',
    proof: ['/battle.json', '/battle-log', '/c/battler'],
  },
  {
    slug: 'drum',
    path: '/drum',
    title: 'Drum Room',
    description: 'A communal tapping surface with Frame metadata, persistence, and a PointCast music pulse.',
    image: '/images/og-drum.png',
    kind: 'game',
    audience: 'Farcaster, music friends, casual visitors, and anyone who should touch the site immediately',
    ritual: 'Use when the share should become an action within five seconds.',
    proof: ['/c/spinning', '/b/0339', '/listening-room'],
  },
  {
    slug: 'garden-yield',
    path: '/garden-yield',
    title: 'Garden Yield',
    description: 'A native planting planner with site presets, value scores, ranked kits, and an establishment loop.',
    image: '/images/og/garden-yield.png',
    kind: 'page',
    audience: 'local gardeners, practical planning readers, and California native plant people',
    ritual: 'Use when the share needs to show PointCast can become a tool.',
    proof: ['/garden-yield.json', '/nature-yield.json', '/b/0331'],
  },
  {
    slug: 'nature',
    path: '/nature',
    title: 'Nature · El Segundo field guide',
    description: 'A local field guide for dunes, native plants, seasonal signals, and the El Segundo blue butterfly.',
    image: '/images/og/nature.png',
    kind: 'page',
    audience: 'local nature people, native plant readers, field-guide browsers, and agent crawlers',
    ritual: 'Use when the share should feel grounded in place, plants, and living local context.',
    proof: ['/nature.json', '/local.json', '/nature-yield.json'],
  },
  {
    slug: 'houseplants',
    path: '/houseplants',
    title: 'Houseplants · Learning lab',
    description: 'An indoor plant learning module for light, watering, roots, soil, humidity, feeding, repotting, and symptoms.',
    image: '/images/og/houseplants.png',
    kind: 'page',
    audience: 'indoor gardeners, plant learners, cozy tool users, and practical care readers',
    ritual: 'Use when the link needs to feel like a lived-in care desk instead of a static article.',
    proof: ['/houseplants.json', '/nature.json', '/garden-yield'],
  },
  {
    slug: 'meditate',
    path: '/meditate',
    title: 'Ocean Meditation',
    description: 'A quiet PointCast room for timed breathing, ocean focus, tide logging, and an optional ambient tone.',
    image: '/images/og/meditate.png',
    kind: 'room',
    audience: 'overloaded readers, ocean people, quiet-mode visitors, and anyone needing a softer route',
    ritual: 'Use when the share should offer a reset rather than another feed surface.',
    proof: ['/meditate.json', '/nature', '/b/0304'],
  },
  {
    slug: 'local',
    path: '/local',
    title: 'Local · 100 miles from El Segundo',
    description: 'PointCast’s 100-mile lens: name-drops, stations, in-range blocks, nature notes, and adjacent local surfaces.',
    image: '/images/og/og-home-v2.png',
    kind: 'page',
    audience: 'local collaborators, station readers, place-based agents, and South Bay wanderers',
    ritual: 'Use when the route should situate PointCast in place before it asks for attention.',
    proof: ['/local.json', '/nature', '/beacon'],
  },
  {
    slug: 'beacon',
    path: '/beacon',
    title: 'PointCast Beacon',
    description: 'A neighborhood signal surface for nearby routes, local orientation, and place-aware discovery.',
    image: '/images/og/beacon.png',
    kind: 'system',
    audience: 'nearby readers, place-aware agents, local systems people, and collaborators entering through geography',
    ritual: 'Use when the unfurl needs to behave like a small signal fire for the neighborhood.',
    proof: ['/beacon.json', '/local.json', '/for-nodes'],
  },
  {
    slug: 'share-kit',
    path: '/share',
    title: 'Share kit',
    description: 'Audience routers, copy snippets, proof links, and campaign packets for organic PointCast distribution.',
    image: '/images/og-home-v3.png',
    kind: 'campaign',
    audience: 'launch helpers, collaborators, and anyone sending PointCast around',
    ritual: 'Use before posting elsewhere: pick the right door, then copy the packet.',
    proof: ['/share.json', '/archive', '/for-agents'],
  },
  {
    slug: 'feed-json',
    path: '/feed.json',
    title: 'PointCast JSON Feed',
    description: 'Standards-shaped JSON Feed for every block, including canonical URLs, summaries, tags, and images.',
    image: '/images/og/og-home-v2.png',
    kind: 'feed',
    audience: 'reader apps, agents, indexers, and workflow automations',
    ritual: 'Use when the "unfurl" is consumed by software instead of a human chat app.',
    proof: ['/blocks.json', '/sitemap-blocks.xml', '/feed.xml'],
  },
  {
    slug: 'blocks-json',
    path: '/blocks.json',
    title: 'PointCast Blocks JSON',
    description: 'The native archive format: every block summarized with channel, type, links, metadata, and companions.',
    image: '/images/og/archive.png',
    kind: 'feed',
    audience: 'agents, indexers, scripts, and anyone building on top of the archive',
    ritual: 'Use when the best preview is the contract of the archive itself.',
    proof: ['/feed.json', '/archive.json', '/sitemap-blocks.xml'],
  },
] satisfies Omit<UnfurlShrine, 'miniPath' | 'shrineSet'>[];

export const SHRINE_SETS: ShrineSet[] = [
  {
    slug: 'element',
    title: 'Element Shrine',
    label: 'nature · fire · stones · gems',
    description: 'A lived-in, cozy shrine for natural tools and quiet rooms: wood, paper, plants, embers, stones, gems, and soft local signal.',
    background: '/images/shrines/element-balance-shrine-bg.png',
    backgroundVariants: [
      '/images/shrines/element-nature-shrine-bg.png',
      '/images/shrines/element-fire-shrine-bg.png',
      '/images/shrines/element-stone-shrine-bg.png',
      '/images/shrines/element-balance-shrine-bg.png',
    ],
    kinds: ['page', 'room', 'system'],
    slugs: ['nature', 'garden-yield', 'houseplants', 'meditate', 'local', 'beacon'],
  },
  {
    slug: 'block',
    title: 'Block Shrine',
    label: 'single-url proof',
    description: 'A clean plinth for one canonical page: stable art, readable metadata, proof links, and a URL that survives the chat preview.',
    background: '/images/shrines/block-shrine-bg.png',
    kinds: ['home', 'block', 'page'],
    slugs: ['breathe-0304', 'home', 'now', 'archive', 'manifesto', 'garden-yield'],
  },
  {
    slug: 'room',
    title: 'Room Shrine',
    label: 'ambient surfaces',
    description: 'A spatial unfurl for places people should enter: listening rooms, TV modes, live tools, and playable corners.',
    background: '/images/shrines/room-shrine-bg.png',
    kinds: ['room', 'game'],
    slugs: ['listening-room', 'tv', 'battle', 'drum'],
  },
  {
    slug: 'system',
    title: 'System Shrine',
    label: 'agent-readable signal',
    description: 'A stricter shrine for software readers: JSON feeds, graph edges, labels, validators, and crawlable contracts.',
    background: '/images/shrines/system-shrine-bg.png',
    kinds: ['system', 'feed'],
    slugs: ['agents', 'mesh', 'tag-signal', 'feed-json', 'blocks-json'],
  },
  {
    slug: 'campaign',
    title: 'Campaign Shrine',
    label: 'launch packets',
    description: 'A bright desk for launch work: object pages, share kits, sponsorship context, and URLs built to move between people.',
    background: '/images/shrines/campaign-shrine-bg.png',
    kinds: ['campaign'],
    slugs: ['nouns-cola', 'share-kit'],
  },
];

const shrineSetBySlug = new Map<string, string>();

SHRINE_SETS.forEach((set) => {
  set.slugs.forEach((slug) => shrineSetBySlug.set(slug, set.slug));
});

export const UNFURL_SHRINES: UnfurlShrine[] = SHRINE_ITEMS.map((shrine) => ({
  ...shrine,
  miniPath: `/u/${shrine.slug}`,
  shrineSet: shrineSetBySlug.get(shrine.slug),
}));

export function getShrineSet(slug: string): ShrineSet | undefined {
  const setSlug = shrineSetBySlug.get(slug);
  return SHRINE_SETS.find((set) => set.slug === setSlug);
}

export function getMiniShrineDescription(shrine: UnfurlShrine): string {
  return `Mini shrine for ${shrine.title}: ${shrine.description}`;
}
