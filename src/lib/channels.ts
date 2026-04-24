/**
 * Channel constants — one of the two primitives defined in BLOCKS.md.
 *
 * Channels answer "what is this about?" Every Block belongs to exactly one.
 * Each channel has a short code, a display name, a color ramp, and a purpose
 * blurb. Do not add a ninth without MH decision (per BLOCKS.md).
 *
 * The 600-stop is the primary color (used for borders); the 800-stop is the
 * high-contrast text color (used for the channel code); the 50-stop is the
 * optional tinted background. All color values are picked so a hard black
 * title on a 50-tint background hits WCAG AA on mid-sized text.
 */

export type ChannelCode =
  | 'FD'  // Front Door — AI, interfaces, agent-era thinking
  | 'CRT' // Court — pickleball
  | 'SPN' // Spinning — music, listening
  | 'GF'  // Good Feels — cannabis, product drops
  | 'GDN' // Garden — balcony, birds, quiet noticing
  | 'ESC' // El Segundo — ESCU fiction, local
  | 'FCT' // Faucet — free daily claims
  | 'VST' // Visit — human/agent log entries
  | 'BTL' // Battler — deterministic Nouns duels (9th, added v2.1)
  ;

export interface ChannelSpec {
  code: ChannelCode;
  slug: string;       // URL segment: /c/front-door
  name: string;       // display name: "Front Door"
  purpose: string;    // one-line blurb (legacy, used in cards + meta)
  /**
   * SEO: optional long-form intro (120-200 words). Rendered above the
   * grid on /c/{slug} and used as meta description (truncated). Each
   * channel landing page is a keyword-targeted surface; this is where
   * that copy lives. Falls back to `purpose` if unset.
   */
  intro?: string;
  /** SEO: 3-5 related search phrases for internal linking + schema. */
  topics?: string[];
  /** Primary hex — used for borders and accent bars. */
  color600: string;
  /** Dark hex — used for channel code text + emphasized links. */
  color800: string;
  /** Very light tint — used as optional block background. */
  color50: string;
}

export const CHANNELS: Record<ChannelCode, ChannelSpec> = {
  FD: {
    code: 'FD',
    slug: 'front-door',
    name: 'Front Door',
    purpose: 'AI, interfaces, agent-era thinking.',
    intro:
      'Front Door is PointCast\'s channel for the agent-era web — AI interfaces, ' +
      'browsers-as-runtimes, LLM retrieval, and the new front door every product ' +
      'has to defend. Dispatches from the Seeing the Future essay series live here, ' +
      'alongside shorter notes on Claude, ChatGPT, Atlas, Comet, Dia, and the ' +
      'shift from URLs to cursors that read. Written by Mike Hoydich × Claude ' +
      'from El Segundo, California. Feeds as RSS + JSON below; every block is ' +
      'also addressable at /b/{id}.',
    topics: ['AI browsers', 'agent-native web', 'LLM interfaces', 'Claude Code', 'Seeing the Future'],
    color600: '#185FA5',
    color800: '#0B3E73',
    color50: '#EEF4FA',
  },
  CRT: {
    code: 'CRT',
    slug: 'court',
    name: 'Court',
    purpose: 'Pickleball — matches, paddles, drills.',
    intro:
      'Court is PointCast\'s pickleball channel — match notes, paddle ' +
      'reviews, drill protocols, opponent scouting, and player-development ' +
      'threads tracking Mike\'s pickleball journey and The Squeeze team. ' +
      'Equipment coverage leans toward modern raw-carbon paddles (11SIX24, ' +
      'Joola, Six Zero, CRBN) with honest pop / spin / control trade-offs. ' +
      'El Segundo Recreation Park is our home court; travel logs from South ' +
      'Bay and Pasadena venues land here too. If you\'re looking for ' +
      'pickleball paddle reviews, drill recipes, or South Bay LA pickleball ' +
      'notes, this is the feed.',
    topics: ['pickleball', 'pickleball paddles', 'pickleball drills', 'El Segundo pickleball', 'South Bay pickleball', 'raw carbon paddle'],
    color600: '#3B6D11',
    color800: '#24460A',
    color50: '#F0F5E9',
  },
  SPN: {
    code: 'SPN',
    slug: 'spinning',
    name: 'Spinning',
    purpose: 'Music, playlists, listening notes.',
    intro:
      'Spinning is PointCast\'s music channel — Spotify and SoundCloud ' +
      'embeds, playlist drops, listening notes, and short-form writing about ' +
      'why a track stuck. Every LISTEN block is a citation-ready permalink ' +
      'you can drop into a Substack or pass to a friend. We curate around ' +
      'mood (flow, focus, chill, hype) more than genre, so the archive doubles ' +
      'as a soundtrack library that maps to the PointCast mood system. ' +
      'Connected to the CoNavigator player at the bottom of every page — ' +
      'set a mood, pick a track, keep rolling.',
    topics: ['music playlists', 'listening notes', 'Spotify curation', 'mood music', 'soundtrack library'],
    color600: '#993C1D',
    color800: '#6A2810',
    color50: '#FBEFEA',
  },
  GF: {
    code: 'GF',
    slug: 'good-feels',
    name: 'Good Feels',
    purpose: 'Cannabis/hemp, product drops, brand ops.',
    intro:
      'Good Feels is PointCast\'s cannabis + hemp channel — product drops, ' +
      'strain notes, effects research, brand-ops dispatches, and ' +
      'founder-perspective writing from Mike Hoydich (COO, Good Feels). ' +
      'Covers legal hemp-derived THC beverages, cannabis retail strategy, ' +
      'and the wellness-adjacent science (terpenes, cannabinoid ratios, ' +
      'acupuncture, nootropics) that sits alongside the product. Shop ' +
      'transactional terms live at shop.getgoodfeels.com; PointCast owns ' +
      'the founder story, reviews, and long-form context. Written to ' +
      'the cannabis-curious who want substance, not hype.',
    topics: ['hemp THC beverage', 'cannabis beverage', 'Good Feels', 'cannabis retail', 'legal hemp drinks', 'cannabis operations'],
    color600: '#993556',
    color800: '#6B2139',
    color50: '#FAEAF0',
  },
  GDN: {
    code: 'GDN',
    slug: 'garden',
    name: 'Garden',
    purpose: 'Balcony, birds, wildlife, quiet noticing.',
    intro:
      'Garden is PointCast\'s quiet-noticing channel — balcony notes, bird ' +
      'sightings, wildlife encounters, weather observations, and short-form ' +
      'writing about the non-human life that shares the 25-mile beacon ' +
      'around El Segundo. Think field journal meets nature blog: ' +
      'hummingbirds at the balcony feeder, marine-layer mornings, raptors ' +
      'over the dunes at Dockweiler, the persistent character of coastal ' +
      'Southern California weather. Short entries, high specificity. ' +
      'Paired with the /beacon map that anchors this whole project in a place.',
    topics: ['El Segundo birds', 'South Bay wildlife', 'coastal SoCal weather', 'nature journaling', 'balcony garden', 'marine layer'],
    color600: '#0F6E56',
    color800: '#074638',
    color50: '#E7F4EF',
  },
  ESC: {
    code: 'ESC',
    slug: 'el-segundo',
    name: 'El Segundo',
    purpose: 'ESCU fiction, local, community.',
    intro:
      'El Segundo is PointCast\'s local channel — dispatches, neighborhood ' +
      'notes, fiction from the El Segundo Cinematic Universe (ESCU), and a ' +
      'rolling log of what it feels like to live and work in the South Bay ' +
      'beach town that hosts the site\'s 25-mile beacon. If you are looking ' +
      'for things to do in El Segundo, local events, the creative/tech scene ' +
      'south of LAX, or 90245-adjacent community reporting, this is the feed. ' +
      'Tied to /beacon (radius map) and /local (100-mile station lens). RSS + ' +
      'JSON feeds below.',
    topics: ['El Segundo CA', 'South Bay LA', '90245', 'ESCU fiction', 'El Segundo things to do', 'South Bay creative scene'],
    color600: '#534AB7',
    color800: '#332C7C',
    color50: '#EEEDF7',
  },
  FCT: {
    code: 'FCT',
    slug: 'faucet',
    name: 'Faucet',
    purpose: 'Free daily claims, giveaways.',
    intro:
      'Faucet is PointCast\'s free-daily-claim channel — zero-cost Tezos ' +
      'editions, giveaway drops, and limited claim windows that reward ' +
      'regular visitors. Every FAUCET-type block is a live mint on a Tezos ' +
      'FA2 contract, claimable with any Beacon-compatible wallet (Kukai, ' +
      'Temple, Umami, Altme) for zero tez beyond ~0.003 ꜩ in network fees. ' +
      'Today\'s drop lives at /drop; the full archive is here. Good entry ' +
      'point if you want to collect Tezos NFTs without spending.',
    topics: ['free Tezos NFT', 'Tezos faucet', 'NFT giveaway', 'free NFT drops', 'Beacon wallet', 'FA2 claim'],
    color600: '#BA7517',
    color800: '#834F0A',
    color50: '#FBF1E1',
  },
  VST: {
    code: 'VST',
    slug: 'visit',
    name: 'Visit',
    purpose: 'Human and agent visit log entries.',
    intro:
      'Visit is PointCast\'s visitor log — a running record of every human ' +
      'and AI agent that stops in, says hello, or leaves a mark. Humans ' +
      'leave visits via /ping or the CoNavigator bar; agents (ChatGPT, ' +
      'Claude, Perplexity, Gemini, and others) land here automatically via ' +
      'the /for-agents manifest. Paired with the Visit Nouns FA2 contract ' +
      'on Tezos — first-time human visitors can claim a Visit Noun NFT as ' +
      'a proof-of-attendance keepsake. The feed is a demonstration of ' +
      'what an agent-native web log looks like when humans and AI share ' +
      'one guestbook.',
    topics: ['agent visit log', 'AI proof of attendance', 'Visit Nouns', 'guestbook', 'human-AI collaboration', 'agent-native web'],
    color600: '#5F5E5A',
    color800: '#38373A',
    color50: '#EFEFEE',
  },
  BTL: {
    code: 'BTL',
    slug: 'battler',
    name: 'Battler',
    purpose: 'Nouns Battler — deterministic duels. Every match is a block.',
    intro:
      'Battler is the home of Nouns Battler — a deterministic turn-based ' +
      'fighter built on top of the Nouns DAO CC0 NFT collection. Every Noun ' +
      'seed (0–1199) is a fighter whose stats derive from the seed\'s trait ' +
      'bytes via a pure hash: same seed, same stats, forever. A Card of the ' +
      'Day rotates deterministically through a 21-Noun roster keyed by UTC ' +
      'date. Play lives at /battle; match logs and dispatches land here. Paired ' +
      'with the Visit Nouns FA2 contract on Tezos mainnet — Nouns on Tezos, ' +
      'proliferation culture, CC0 forever.',
    topics: ['Nouns DAO', 'Nouns Battler', 'Nouns on Tezos', 'CC0 NFT', 'Visit Nouns', 'deterministic game'],
    color600: '#8A2432', // oxblood — the one primary that doesn't collide with the existing 8
    color800: '#551620',
    color50: '#FBEAEE',
  },
};

export const CHANNEL_LIST: ChannelSpec[] = Object.values(CHANNELS);

/** Resolve a channel by either code ("FD") or slug ("front-door"). */
export function getChannel(key: string): ChannelSpec | undefined {
  const upper = key.toUpperCase();
  if (upper in CHANNELS) return CHANNELS[upper as ChannelCode];
  return CHANNEL_LIST.find((c) => c.slug === key.toLowerCase());
}
