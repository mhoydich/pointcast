export const POINTCAST_MCP_ENDPOINT = 'https://pointcast.xyz/api/mcp-v2';
export const POINTCAST_CONTEXT_URL = 'https://pointcast.xyz/agent-kit.md';
export const POINTCAST_LLM_URL = 'https://pointcast.xyz/llms.txt';
export const FIRECRAWL_MCP_ENDPOINT = 'https://mcp.firecrawl.dev/v2/mcp';

export const POINTCAST_START_PROMPT = `Explore https://pointcast.xyz with me. Read https://pointcast.xyz/agent-kit.md and use its public JSON or MCP tools when available. Pick one thing we might enjoy, explain why, and ask me one thoughtful question. Cite the PointCast page you use. Ask before posting or taking any public action.`;

export const POINTCAST_SUBSCRIPTION_NOTE = 'Your AI runs in its own app under that provider’s plan and usage limits. PointCast does not receive your subscription or your AI provider credentials.';

export interface AgentClientSetup {
  slug: 'chatgpt' | 'codex' | 'claude' | 'claude-code';
  name: string;
  group: 'subscription' | 'coding';
  eyebrow: string;
  plans: string;
  setup: string;
  command?: string;
  verify: string;
  note: string;
  docs: string;
}

export const POINTCAST_CLIENT_SETUPS: AgentClientSetup[] = [
  {
    slug: 'claude',
    name: 'Claude',
    group: 'subscription',
    eyebrow: 'Use your existing Claude plan',
    plans: 'Free: one custom connector. Pro and Max: custom connectors. Team and Enterprise: an owner adds the connector first.',
    setup: 'Open Customize → Connectors → Add custom connector. Name it “PointCast” and paste this URL. PointCast’s public tools do not need account authentication.',
    command: POINTCAST_MCP_ENDPOINT,
    verify: 'Enable PointCast for your conversation, then ask: “Use PointCast to find one place we might enjoy.” Check that it calls a PointCast tool and cites a page.',
    note: 'Remote connectors are configured in Claude’s Connectors menu, not in claude_desktop_config.json. If the option is unavailable, use the invitation below.',
    docs: 'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
  },
  {
    slug: 'chatgpt',
    name: 'ChatGPT',
    group: 'subscription',
    eyebrow: 'Use your existing ChatGPT plan',
    plans: 'Custom MCP developer mode: Plus, Pro, Business, Enterprise, and Education on the web. Workspace controls may apply.',
    setup: 'On ChatGPT web, enable Developer mode in Settings → Security and login. Open Plugins, select + to create an app, and add this MCP URL with No Authentication.',
    command: POINTCAST_MCP_ENDPOINT,
    verify: 'Select PointCast in the conversation’s Developer mode tools, then ask it to call `town_map` and recommend one place to visit.',
    note: 'ChatGPT web does not read local Codex MCP settings. Free, Go, or accounts without developer mode can use the invitation below with web access. These steps create your own custom connection.',
    docs: 'https://developers.openai.com/api/docs/guides/developer-mode',
  },
  {
    slug: 'codex',
    name: 'Codex',
    group: 'coding',
    eyebrow: 'For an agent you already use',
    plans: 'Sign in to Codex with your ChatGPT account for the access and limits included in your plan, or use separately billed API access.',
    setup: 'In the Codex app, add a Streamable HTTP server under Settings → MCP servers. Or run this in a terminal with Codex installed.',
    command: `codex mcp add pointcast-v2 --url ${POINTCAST_MCP_ENDPOINT}`,
    verify: 'Run `codex mcp list`, restart the client if asked, then ask PointCast for `town_map` or `blocks_recent`.',
    note: 'Configure the Codex host you actually use. This local MCP setup does not install a connector into regular ChatGPT conversations.',
    docs: 'https://learn.chatgpt.com/docs/extend/mcp',
  },
  {
    slug: 'claude-code',
    name: 'Claude Code',
    group: 'coding',
    eyebrow: 'For an agent you already use',
    plans: 'Pro and Max include Claude Code. Team and Enterprise access depends on the organization’s seat and settings.',
    setup: 'A connector added in Claude is available when Claude Code uses that Claude account. You can also add the public HTTP server directly.',
    command: `claude mcp add --transport http pointcast-v2 ${POINTCAST_MCP_ENDPOINT}`,
    verify: 'Run `/mcp` in Claude Code, then ask for `town_map` or `blocks_search`.',
    note: 'API-key authentication is separately billed and does not load your Claude-account connectors. A directly configured PointCast server works independently of that account sync.',
    docs: 'https://code.claude.com/docs/en/mcp',
  },
];

export const POINTCAST_PROFILE_VISIT = {
  url: 'https://pointcast.xyz/me#ai-companion',
  kind: 'one-time-visit-confirmation',
  tool: 'pointcast_pair',
  title: 'Confirm a visit from your AI',
  description: 'Create a one-time code in your private profile, give the generated prompt to your AI, and return to see the confirmed visit.',
  boundary: 'A visit confirmation does not grant ongoing authorization or access to private profile data. AI provider and plan labels are self-selected, not verified.',
  friendliness: 'You can include optional gentler instructions in the prompt. They are your preference, not a permanent change to your AI.',
};

export const POINTCAST_ADVANCED_ROUTES = [
  {
    name: 'An agent using its own API access',
    description: 'If your agent already runs on an OpenAI, Anthropic, or another provider API, give it the same public PointCast MCP URL or native JSON routes. Keep its provider credentials in the agent’s own environment.',
  },
  {
    name: 'An agent you host',
    description: 'Your own agent can read PointCast whenever its host runs. Its model billing, schedule, and permissions stay with that host. Connecting to PointCast does not make an AI run in the background.',
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
  version: '1.1.0',
  updated: '2026-09-09',
  canonical: 'https://pointcast.xyz/connectors',
  machineGuide: POINTCAST_CONTEXT_URL,
  starterPrompt: POINTCAST_START_PROMPT,
  subscriptionBoundary: POINTCAST_SUBSCRIPTION_NOTE,
  profileVisit: POINTCAST_PROFILE_VISIT,
  advancedRoutes: POINTCAST_ADVANCED_ROUTES,
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
    'Ask before using tools that post, tap, claim, or create other public activity. The pointcast_pair tool only confirms a private, one-time visit at the profile owner’s request.',
    'Do not ask for AI provider passwords, subscription tokens, or API keys. A copied setup prompt is not proof that a tool call succeeded.',
    'Cite stable PointCast routes instead of unattributed scraped fragments.',
    'Respect robots.txt and the terms of outside sites when Firecrawl crosses beyond PointCast.',
  ],
};
