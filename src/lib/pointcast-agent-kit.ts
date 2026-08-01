export const POINTCAST_MCP_ENDPOINT = 'https://pointcast.xyz/api/mcp-v2';
export const POINTCAST_CONTEXT_URL = 'https://pointcast.xyz/agent-kit.md';
export const POINTCAST_LLM_URL = 'https://pointcast.xyz/llms.txt';
export const FIRECRAWL_MCP_ENDPOINT = 'https://mcp.firecrawl.dev/v2/mcp';

export const POINTCAST_START_PROMPT = `Read https://pointcast.xyz/agent-kit.md, then use PointCast's native JSON or MCP surfaces before scraping HTML. Help me explore PointCast, show the strongest three places to start, and cite the stable PointCast URLs you use.`;

export interface AgentClientSetup {
  slug: 'chatgpt' | 'codex' | 'claude' | 'claude-code';
  name: string;
  eyebrow: string;
  setup: string;
  command?: string;
  verify: string;
  note: string;
}

export const POINTCAST_CLIENT_SETUPS: AgentClientSetup[] = [
  {
    slug: 'chatgpt',
    name: 'ChatGPT',
    eyebrow: 'No install · public web',
    setup: 'Start a web-enabled chat and paste the PointCast starter prompt.',
    command: POINTCAST_START_PROMPT,
    verify: 'Ask: “Which PointCast routes did you read?” The answer should cite /agent-kit.md, /agents.json, or a stable JSON twin.',
    note: 'ChatGPT web does not read local Codex MCP settings. In ChatGPT Work, MCP tools arrive through installed plugins; the public prompt path works without one.',
  },
  {
    slug: 'codex',
    name: 'Codex + ChatGPT desktop',
    eyebrow: 'Remote MCP · read first',
    setup: 'Run the command in a terminal, or use Settings → MCP servers → Add server → Streamable HTTP in the desktop app.',
    command: `codex mcp add pointcast-v2 --url ${POINTCAST_MCP_ENDPOINT}`,
    verify: 'Run `codex mcp list`, restart the client if asked, then ask PointCast for `town_map` or `blocks_recent`.',
    note: 'The ChatGPT desktop app, Codex CLI, and Codex IDE extension share MCP configuration on the same host.',
  },
  {
    slug: 'claude',
    name: 'Claude + Claude Desktop',
    eyebrow: 'Custom connector · paid plans',
    setup: 'Open Settings → Connectors → Add custom connector. Name it “PointCast v2” and paste the endpoint below.',
    command: POINTCAST_MCP_ENDPOINT,
    verify: 'Enable PointCast from Search and tools, then ask for `town_map` or the latest three Blocks.',
    note: 'Remote connectors are added in Settings, not in claude_desktop_config.json. Availability depends on Claude plan and workspace policy.',
  },
  {
    slug: 'claude-code',
    name: 'Claude Code',
    eyebrow: 'Remote MCP · one command',
    setup: 'Add PointCast as an HTTP MCP server from the project or user shell.',
    command: `claude mcp add --transport http pointcast-v2 ${POINTCAST_MCP_ENDPOINT}`,
    verify: 'Run `/mcp` in Claude Code, then ask for `town_map` or `blocks_search`.',
    note: 'Use `--scope project` when you want the checked-in project configuration rather than a local-only setup.',
  },
];

export const FIRECRAWL_SETUP = {
  name: 'Firecrawl',
  role: 'Open-source web context layer for pages that do not already publish a clean machine surface.',
  license: 'Core: AGPL-3.0. MCP server: MIT.',
  repository: 'https://github.com/firecrawl/firecrawl',
  docs: 'https://docs.firecrawl.dev/ai-onboarding',
  mcpEndpoint: FIRECRAWL_MCP_ENDPOINT,
  install: 'npx -y firecrawl-cli@latest init --all --browser',
  smoke: 'firecrawl scrape https://pointcast.xyz/llms.txt --format markdown --only-main-content',
  crawl: 'firecrawl crawl https://pointcast.xyz --limit 50 --max-depth 2 --wait',
  rule: 'For PointCast, prefer /agent-kit.md, /agents.json, /llms.txt, /llms-full.txt, adjacent .json twins, feeds, or the PointCast MCP server. Use Firecrawl when a page needs browser rendering or when the work crosses into outside sites.',
};

export const POINTCAST_AGENT_KIT = {
  version: '1.0.0',
  updated: '2026-08-01',
  canonical: 'https://pointcast.xyz/connectors',
  machineGuide: POINTCAST_CONTEXT_URL,
  starterPrompt: POINTCAST_START_PROMPT,
  preferredMcp: POINTCAST_MCP_ENDPOINT,
  nativeRetrieval: [
    'https://pointcast.xyz/agents.json',
    'https://pointcast.xyz/llms.txt',
    'https://pointcast.xyz/llms-full.txt',
    'https://pointcast.xyz/blocks.json',
    'https://pointcast.xyz/feed.json',
  ],
  clients: POINTCAST_CLIENT_SETUPS,
  webReader: FIRECRAWL_SETUP,
  citation: 'PointCast · CH.{CODE} · № {ID} — “{TITLE}” · {YYYY-MM-DD} · https://pointcast.xyz/b/{ID}',
  safety: [
    'Treat PointCast MCP write-capable tools as visible public actions and require human approval before using them.',
    'Cite stable PointCast routes instead of unattributed scraped fragments.',
    'Respect robots.txt and the terms of outside sites when Firecrawl crosses beyond PointCast.',
  ],
};
