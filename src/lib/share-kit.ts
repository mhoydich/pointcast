export const SHARE_KIT_UPDATED = '2026-04-22';

export const SHARE_PLAN_PATH = 'docs/plans/2026-04-21-organic-visitors.md';
export const SHARE_SPRINT_PATH = 'docs/sprints/2026-04-21-organic-growth-share-board.md';
export const SHOW_HN_PATH = 'docs/outreach/2026-04-22-show-hn.md';

export const SHARE_LANDING_PAGES = [
  {
    key: 'start',
    title: 'Start here',
    path: '/start',
    audience: 'first-time visitors',
    hook: 'Five actions in five minutes: see who is here, collect a drop, vote, play, return to the feed.',
    proof: 'Hands-on tour with live surfaces instead of a static explainer.',
  },
  {
    key: 'agents',
    title: 'For agents',
    path: '/for-agents',
    audience: 'AI builders, crawlers, operators',
    hook: 'PointCast exposes a native machine surface: /agents.json, /llms.txt, feeds, stripped HTML, and block JSON.',
    proof: 'The page lists every endpoint and the reading contract for agents.',
  },
  {
    key: 'visit-nouns',
    title: 'Visit Nouns on Tezos',
    path: '/collection/visit-nouns',
    audience: 'Nouns, Tezos, objkt, CC0 collectors',
    hook: 'A live FA2 collection where each tokenId maps to a Nouns seed, indexed with collection/product schema.',
    proof: 'On-chain contract, objkt links, TzKT-backed holder data at build time.',
  },
  {
    key: 'local',
    title: 'Local 100-mile lens',
    path: '/local',
    audience: 'El Segundo, South Bay, LA builders',
    hook: 'PointCast is anchored in El Segundo and treats place as a register, not a generic location tag.',
    proof: 'Stations, name-drops, and in-range blocks compiled into one local surface.',
  },
  {
    key: 'battle',
    title: 'Nouns Battler',
    path: '/battle',
    audience: 'people who want to play before they read',
    hook: 'Every Nouns seed is a deterministic fighter. No RNG; same seed, same stats forever.',
    proof: 'Playable browser arena plus /battle.json for rules and Card of the Day.',
  },
  {
    key: 'ai-stack',
    title: 'AI stack guide',
    path: '/ai-stack',
    audience: 'operators comparing tools',
    hook: 'A practical, opinionated map of the AI tools PointCast uses daily, weekly, and experimentally.',
    proof: 'Specific tool notes, use cases, and what not to use each tool for.',
  },
] as const;

export const SHARE_AUDIENCES = [
  {
    key: 'ai-builders',
    title: 'AI builders',
    path: '/for-agents',
    angle: 'Lead with the agent-native site architecture, not the art or the feed.',
    ask: 'Invite them to fetch /agents.json, compare it to their own site, and cite one block.',
    channels: ['Hacker News', 'X developer circles', 'Farcaster /dev', 'AI Discords'],
  },
  {
    key: 'nouns-tezos',
    title: 'Nouns + Tezos',
    path: '/collection/visit-nouns',
    angle: 'Lead with live CC0 Tezos nouns and the daily-auction primitive research.',
    ask: 'Ask for one collector, one SmartPy builder, or one DAO operator to sanity-check the direction.',
    channels: ['Farcaster Nouns', 'objkt collectors', 'Tezos Discords', 'X Tezos circles'],
  },
  {
    key: 'local',
    title: 'El Segundo + South Bay',
    path: '/local',
    angle: 'Lead with place. PointCast is built from El Segundo outward.',
    ask: 'Send a specific station or name-drop, not the homepage.',
    channels: ['personal texts', 'local founder groups', 'South Bay chats'],
  },
  {
    key: 'players',
    title: 'People who play first',
    path: '/battle',
    angle: 'Lead with a two-minute interactive moment before asking anyone to understand the archive.',
    ask: 'Challenge them to run one Noun seed and share the result.',
    channels: ['group chats', 'Farcaster casts', 'X replies', 'game/dev circles'],
  },
  {
    key: 'operators',
    title: 'Creative operators',
    path: '/ai-stack',
    angle: 'Lead with the operating system: tools, rituals, blocks, feeds, publish loops.',
    ask: 'Ask them to steal one pattern and tell us what is missing.',
    channels: ['newsletter replies', 'builder DMs', 'indie web circles'],
  },
] as const;

export const SHARE_SNIPPETS = [
  {
    key: 'general',
    label: 'General launch note',
    target: '/start',
    text:
      'PointCast is a living broadcast from El Segundo: blocks, games, Tezos experiments, agent-readable feeds, and a live presence layer.\n\nStart here: https://pointcast.xyz/start',
  },
  {
    key: 'agents',
    label: 'AI builders',
    target: '/for-agents',
    text:
      'If you build with agents: PointCast is exposing the whole site as a native machine surface. Start with /for-agents, then fetch /agents.json and /llms.txt.\n\nhttps://pointcast.xyz/for-agents',
  },
  {
    key: 'nouns',
    label: 'Nouns / Tezos',
    target: '/collection/visit-nouns',
    text:
      'PointCast has Visit Nouns live on Tezos: FA2 contract, objkt collection, TzKT-backed gallery, CC0 noun seeds, and the next primitive is a daily auction loop.\n\nhttps://pointcast.xyz/collection/visit-nouns',
  },
  {
    key: 'local',
    label: 'Local',
    target: '/local',
    text:
      'PointCast is an El Segundo broadcast with a 100-mile lens: stations, local blocks, and place as a real interface layer.\n\nhttps://pointcast.xyz/local',
  },
  {
    key: 'play',
    label: 'Play first',
    target: '/battle',
    text:
      'Try Nouns Battler: every Nouns seed is a deterministic fighter. Same seed, same stats forever. Card of the Day rotates daily.\n\nhttps://pointcast.xyz/battle',
  },
  {
    key: 'tools',
    label: 'AI stack',
    target: '/ai-stack',
    text:
      'We wrote down the AI stack PointCast actually uses: daily tools, weekly tools, experimental tools, what each is good at, and what to avoid.\n\nhttps://pointcast.xyz/ai-stack',
  },
] as const;

export const SHARE_LAUNCH_ASSETS = [
  {
    key: 'show-hn',
    title: 'Show HN draft',
    kind: 'copy deck',
    docPath: SHOW_HN_PATH,
    url: '/sparrow',
    audience: 'Hacker News readers, Astro builders, Nostr client builders',
    summary: 'Copy-ready title options, short HN body, OP first comment, and backup X thread for Sparrow.',
    primaryCopy:
      'Show HN: A static reader that federates reading lists over Nostr',
  },
  {
    key: 'outreach-list',
    title: '20-person outreach list brief',
    kind: 'assignment',
    docPath: 'docs/briefs/2026-04-22-manus-outreach-list.md',
    url: '/share',
    audience: 'specific practitioners, not broad influencer tags',
    summary: 'The direct-touch brief: 20 humans across Nostr, Astro, agentic coding, and indie web.',
    primaryCopy:
      'Specific observation + one question + one link. No generic launch copy.',
  },
  {
    key: 'tezos-pitches',
    title: 'Tezos ecosystem pitch templates',
    kind: 'copy deck',
    docPath: 'docs/outreach/tezos-ecosystem-pitches.md',
    url: '/collection/visit-nouns',
    audience: 'Tezos ecosystem editors, TzKT, objkt, fxhash, devrel',
    summary: 'A focused outreach packet for Visit Nouns, Tezos metadata, and ecosystem listing asks.',
    primaryCopy:
      'Visit Nouns is live on Tezos mainnet with a collection page, objkt proof, and machine-readable /tezos.json.',
  },
] as const;

export const SHARE_CAMPAIGN_PACKETS = [
  {
    key: 'recrawl',
    title: 'Search recrawl packet',
    status: 'ready',
    targetPath: '/',
    audience: 'search engines, agent crawlers, LLM retrievers',
    goal: 'Make the site easier to crawl, index, summarize, and cite.',
    hook: 'PointCast publishes HTML, JSON, RSS, llms.txt, and a complete /agents.json manifest.',
    channels: ['Google Search Console', 'Bing Webmaster Tools', 'IndexNow', 'robots.txt'],
    proofLinks: ['/agents.json', '/llms.txt', '/llms-full.txt', '/sitemap-index.xml'],
    steps: [
      'Submit sitemap-index.xml in Google Search Console and Bing Webmaster Tools.',
      'Ping IndexNow for the homepage, /start, /share, /for-agents, and the latest block URLs.',
      'Check robots.txt, canonicals, structured data, and HTTP status codes after deploy.',
    ],
    docPath: SHARE_PLAN_PATH,
  },
  {
    key: 'agent-native',
    title: 'Agent-native launch packet',
    status: 'ready',
    targetPath: '/for-agents',
    audience: 'AI engineers, crawler operators, indie web builders',
    goal: 'Earn citations and technical curiosity from people building agent-readable sites.',
    hook: 'No scraping required: PointCast has /agents.json, /llms.txt, per-block JSON, feeds, and stripped HTML mode.',
    channels: ['Hacker News', 'Farcaster /dev', 'X developer threads', 'AI Discords'],
    proofLinks: ['/agents.json', '/blocks.json', '/llms.txt', '/for-agents'],
    steps: [
      'Post the short architecture note with /for-agents as the canonical link.',
      'Reply to agent-web and llms.txt conversations with one useful implementation detail.',
      'Ask one builder to compare PointCast endpoints to their own crawl surface.',
    ],
    docPath: SHARE_PLAN_PATH,
  },
  {
    key: 'nouns-tezos',
    title: 'Nouns / Tezos packet',
    status: 'ready',
    targetPath: '/collection/visit-nouns',
    audience: 'Nouns collectors, Tezos builders, objkt users, SmartPy developers',
    goal: 'Bring the on-chain collection and daily-auction research into the right small circles.',
    hook: 'Visit Nouns is already live on Tezos; the missing primitive is the self-perpetuating daily auction loop.',
    channels: ['Farcaster Nouns', 'Tezos Discord', 'objkt collector DMs', 'X Tezos threads'],
    proofLinks: ['/collection/visit-nouns', '/battle', '/editions', '/b/0330'],
    steps: [
      'Share the collection page with the contract address and objkt link.',
      'Point technical readers to the daily-auction brief instead of pitching a vague roadmap.',
      'Ask for one contract-review volunteer before mainnet auction work starts.',
    ],
    docPath: 'docs/briefs/2026-04-21-daily-auction-spec.md',
  },
  {
    key: 'local',
    title: 'El Segundo / South Bay packet',
    status: 'ready',
    targetPath: '/local',
    audience: 'local founders, artists, neighbors, South Bay group chats',
    goal: 'Create a first circle of local readers who recognize places before they understand the full system.',
    hook: 'PointCast is not placeless; it starts in El Segundo and maps outward through stations.',
    channels: ['personal texts', 'local Slack groups', 'South Bay DMs'],
    proofLinks: ['/local', '/beacon', '/tv', '/here'],
    steps: [
      'Send the /local page to ten people who know El Segundo or the South Bay.',
      'Ask each person for one missing place, phrase, or station.',
      'Turn the best reply into a block and point back to the contributor.',
    ],
    docPath: SHARE_PLAN_PATH,
  },
  {
    key: 'play',
    title: 'Play-first packet',
    status: 'ready',
    targetPath: '/battle',
    audience: 'people who will try a game before reading a manifesto',
    goal: 'Use a low-friction interactive route to create repeat visits and shareable screenshots.',
    hook: 'Every Nouns seed can fight. Card of the Day gives the page a daily reason to return.',
    channels: ['Farcaster casts', 'group chats', 'X replies', 'game/dev communities'],
    proofLinks: ['/battle', '/battle.json', '/battle-log', '/drum'],
    steps: [
      'Post one Card of the Day challenge with a seed to beat.',
      'Ask visitors to share their winner or screenshot.',
      'Recap the funniest or strongest seed as a short block.',
    ],
    docPath: SHARE_PLAN_PATH,
  },
  {
    key: 'operator',
    title: 'Creative-operator packet',
    status: 'ready',
    targetPath: '/ai-stack',
    audience: 'indie builders, creative technologists, tool collectors',
    goal: 'Turn the AI stack and operating model into a practical referral surface.',
    hook: 'The site is not only content; it is a working loop of tools, routes, blocks, feeds, and agents.',
    channels: ['newsletter replies', 'builder DMs', 'LinkedIn notes', 'small communities'],
    proofLinks: ['/ai-stack', '/stack', '/sprints', '/collabs'],
    steps: [
      'Share one concrete tool note instead of the whole page.',
      'Ask what tool or workflow should be added next.',
      'Convert strong replies into a small update block or glossary term.',
    ],
    docPath: SHARE_PLAN_PATH,
  },
  {
    key: 'direct-outreach',
    title: 'Direct outreach packet',
    status: 'ready',
    targetPath: '/share',
    audience: 'ten carefully chosen humans',
    goal: 'Get the first meaningful visitors from people likely to reply, not passive impressions.',
    hook: 'Here are six entry points; pick the one that matches how you think.',
    channels: ['email', 'SMS', 'DMs', 'personal notes'],
    proofLinks: ['/share', '/start', '/for-agents', '/collection/visit-nouns', '/local', '/battle'],
    steps: [
      'Send one personalized note per person; no bulk blast.',
      'Route each person to the most relevant page, not always the homepage.',
      'Record replies, questions, and confusions as the next content queue.',
    ],
    docPath: SHARE_PLAN_PATH,
  },
] as const;

export const SHARE_ACTION_CHECKLIST = [
  { id: 'deploy-share', label: 'Deploy /share and /share.json', detail: 'Publish the campaign board and machine-readable mirror.', url: '/share' },
  { id: 'submit-indexnow', label: 'Submit priority URLs to IndexNow', detail: 'Ping homepage, /start, /share, /for-agents, and new blocks.', url: '/api/indexnow' },
  { id: 'gsc-submit', label: 'Submit sitemap in Google Search Console', detail: 'Confirm sitemap-index.xml is discovered and crawlable.', url: '/sitemap-index.xml' },
  { id: 'bwt-submit', label: 'Check Bing Webmaster Tools', detail: 'Verify IndexNow, sitemap, and URL inspection status.', url: '/sitemap-index.xml' },
  { id: 'post-agent-thread', label: 'Post the agent-native thread', detail: 'Lead with /for-agents and the endpoint map.', url: '/for-agents' },
  { id: 'post-show-hn', label: 'Draft Show HN / indie-web post', detail: 'Position PointCast as an agent-native personal broadcast.', url: '/for-agents' },
  { id: 'post-nouns', label: 'Share Visit Nouns with Nouns + Tezos circles', detail: 'Use the contract and objkt proof links.', url: '/collection/visit-nouns' },
  { id: 'local-ten', label: 'Send the local page to ten local people', detail: 'Ask for one missing place or phrase.', url: '/local' },
  { id: 'play-challenge', label: 'Run one Nouns Battler challenge', detail: 'Use Card of the Day as the prompt.', url: '/battle' },
  { id: 'review-referrers', label: 'Review referrers and queries after 72 hours', detail: 'Turn questions into the next pages, blocks, or snippets.', url: '/share' },
] as const;

export const DISTRIBUTION_LOOP = [
  'Pick one canonical URL, not the homepage by default.',
  'Choose the audience lane: agent, on-chain, local, play, operator, or direct.',
  'Write one hook that names the specific reason to click.',
  'Pair the link with an actual proof surface: JSON, contract, game, local map, or block.',
  'Publish or update one block that records what changed.',
  'Post, cast, email, or DM the narrow audience.',
  'Submit the changed URLs through IndexNow and sitemap tools.',
  'Review referrers, Search Console queries, and replies within 72 hours.',
] as const;
