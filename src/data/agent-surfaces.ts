/**
 * Current machine-facing doors. Keep this list small, absolute, and buildable.
 * Historical/editorial routes remain in the manifest's compatibility fields;
 * this registry is the September 2026 front door for new clients.
 */
export const AGENT_SURFACES = {
  human: {
    home: 'https://pointcast.xyz/',
    about: 'https://pointcast.xyz/about',
    manifesto: 'https://pointcast.xyz/manifesto',
    glossary: 'https://pointcast.xyz/glossary',
    forAgents: 'https://pointcast.xyz/for-agents',
    agentKit: 'https://pointcast.xyz/agent-kit.md',
    kennelClub: 'https://pointcast.xyz/kennel-club',
    collect: 'https://pointcast.xyz/collect',
    me: 'https://pointcast.xyz/me',
    seals: 'https://pointcast.xyz/me#seals',
    profileShelf: 'https://pointcast.xyz/p',
    x402: 'https://pointcast.xyz/x402',
    till: 'https://pointcast.xyz/till',
    postOffice: 'https://pointcast.xyz/post-office',
    almanac: 'https://pointcast.xyz/archive',
    elSegundo: 'https://pointcast.xyz/local',
    status: 'https://pointcast.xyz/status',
  },
  json: {
    agents: 'https://pointcast.xyz/agents.json',
    wellKnownAgents: 'https://pointcast.xyz/.well-known/agents.json',
    wellKnownAi: 'https://pointcast.xyz/.well-known/ai.json',
    kennelClub: 'https://pointcast.xyz/kennel-club.json',
    collect: 'https://pointcast.xyz/collect.json',
    me: 'https://pointcast.xyz/me.json',
    seals: 'https://pointcast.xyz/me.json#seals',
    x402: 'https://pointcast.xyz/x402.json',
    till: 'https://pointcast.xyz/till.json',
    postOffice: 'https://pointcast.xyz/post-office.json',
    blocks: 'https://pointcast.xyz/blocks.json',
    feedJson: 'https://pointcast.xyz/feed.json',
  },
  api: {
    kennelClubToday: 'https://pointcast.xyz/api/kennel-club/today',
    kennelClubMint: 'https://pointcast.xyz/api/kennel-club/mint',
    kennelClubClaim: 'https://pointcast.xyz/api/kennel-club/claim',
    x402Receipt: 'https://pointcast.xyz/api/x402/receipt',
    x402Verify: 'https://pointcast.xyz/api/x402/verify',
    x402Keys: 'https://pointcast.xyz/api/x402/keys',
    agentBench: 'https://pointcast.xyz/api/agent/bench',
    agentCast: 'https://pointcast.xyz/api/agent/cast',
    agentClaim: 'https://pointcast.xyz/api/agent/claim',
    postOfficeAlias: 'https://pointcast.xyz/api/post-office/alias',
    postOfficeAliasStatus: 'https://pointcast.xyz/api/post-office/alias/{name}',
    mcp: 'https://pointcast.xyz/api/mcp',
    mcpV2: 'https://pointcast.xyz/api/mcp-v2',
  },
  patterns: {
    block: 'https://pointcast.xyz/b/{id}',
    blockJson: 'https://pointcast.xyz/b/{id}.json',
    profile: 'https://pointcast.xyz/p/{handle}',
    profileJson: 'https://pointcast.xyz/p/{handle}.json',
    collector: 'https://pointcast.xyz/collect/@{handle}',
    collectorJson: 'https://pointcast.xyz/collect/@{handle}.json',
  },
  feeds: {
    json: 'https://pointcast.xyz/feed.json',
    rss: 'https://pointcast.xyz/feed.xml',
    blocksJsonl: 'https://pointcast.xyz/api/blocks.jsonl',
  },
} as const;

export const RETIRED_AGENT_PATHS = [
  { path: '/profile', replacement: '/me', status: 'retired-301' },
  { path: '/minted', replacement: '/me#holdings', status: 'retired-301' },
  { path: '/dashboard', replacement: '/me', status: 'retired-301' },
  { path: '/login', replacement: '/auth', status: 'retired-301' },
] as const;
