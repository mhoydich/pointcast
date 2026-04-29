export const INVESTMENT_THESIS_VERSION = '2026-04-29';

export const INVESTMENT_THESIS = {
  name: 'Nouns Nation Builder Investment Thesis',
  url: 'https://pointcast.xyz/investment-thesis',
  json: 'https://pointcast.xyz/investment-thesis.json',
  date: INVESTMENT_THESIS_VERSION,
  decision: 'Invest, but milestone-gated.',
  instrument: 'SAFE plus sponsor, grant, and cloud-credit stack before any token or DAO financing.',
  summary:
    'Nouns Nation Builder is investable as an agent-native media venue first, a Nounish game studio second, and a future onchain community protocol third. The wedge is not another NFT game. The wedge is a live, AI-readable sports and culture venue where humans root, agents scout, and every output becomes a reusable artifact.',
  allocation: {
    firstCheck: '$50k-$75k for 90 days of product proof.',
    expansionCeiling: 'Up to $250k after retention proof, agent-output proof, and one sponsor or ecosystem funding partner.',
    operatingRule: 'Fund the venue, prove the ritual, delay the token.',
  },
} as const;

export const thesisPillars = [
  {
    title: 'What I am buying',
    body:
      'A small, fast studio building a Nounish nation: automated leagues, watch-party pages, agent task boards, MCP tools, manifests, recaps, posters, and eventually a Builder DAO around the best rituals.',
  },
  {
    title: 'Why it can work',
    body:
      'Nouns already proved a strange thing: CC0 art plus auctions plus treasury governance can fund culture. Agents add the missing labor layer. They can scout, explain, QA, remix, and route attention all day.',
  },
  {
    title: 'What must be true',
    body:
      'The project must turn passive watching into repeat behavior, prove that agents create useful output rather than noise, and keep the capital stack clean: no disguised security, no extractive token promise.',
  },
] as const;

export const whyNow = [
  {
    title: 'Nouns is legible infrastructure',
    body:
      'Nouns.com explains a governance model where Noun holders and delegates fund work through onchain proposals, and Nouns Builder packages nounish DAO creation for new communities.',
  },
  {
    title: 'Agents are becoming an operating layer',
    body:
      'OpenAI described its April 2026 Agents SDK direction around MCP, skills, shell tools, patch tools, subagents, and code-mode workflows as normal builder primitives.',
  },
  {
    title: 'MCP gives agents a doorway',
    body:
      'Anthropic frames MCP as a standard for connecting models to tools and data. Cloudflare now documents remote MCP servers as deployable agent infrastructure.',
  },
  {
    title: 'PointCast has shipped the shape',
    body:
      'The latest GitHub work is not only content. It is a standalone Nouns Nation hub, federation manifest, Battle Desk V2, rooms, WIRE, FOLLOW, agent visitor centers, Battler manifests, and Nouns Nation agent claim queues.',
  },
] as const;

export const capitalPlan = [
  {
    label: 'First check',
    body:
      '$50k-$75k for 90 days of product proof: Nouns Nation hub, Battler TV, Agent Bench, scorebook, sponsor kit, and distribution tests.',
  },
  {
    label: 'Expansion check',
    body:
      'Up to $250k after retention proof, agent-output proof, and one sponsor or ecosystem funding partner.',
  },
  {
    label: 'Non-dilutive stack',
    body:
      'Pursue OpenAI and Anthropic credits, Nouns or Builder-aligned grants, and protocol ecosystem sponsorship before over-selling equity.',
  },
  {
    label: 'Onchain option',
    body:
      'Only launch a Builder DAO after recurring audience behavior exists and counsel has reviewed governance, token, and revenue claims.',
  },
] as const;

export const returnPaths = [
  {
    label: 'Media',
    body: 'Sponsorships, event drops, paid season packages, and branded Nounish broadcasts.',
  },
  {
    label: 'Tools',
    body: 'Agent-readable publishing kits, MCP endpoints, manifests, QA boards, task queues, and white-label community venues.',
  },
  {
    label: 'Protocol',
    body: 'A future Nouns Builder DAO with treasury-governed seasons, collectibles, and contributor budgets.',
  },
] as const;

export const githubSignals = [
  {
    label: 'MAIN',
    title: 'PointCast main is moving fast',
    body:
      'This thesis was rebased onto origin/main at 3b34c6b on Apr 29, after a run that added /lantern and immediately followed a fresh Nouns Nation area rollout.',
    url: 'https://github.com/mhoydich/pointcast/commit/3b34c6b',
  },
  {
    label: 'NATION',
    title: 'The investable surface now has a hub',
    body:
      'Commit 954d1b5 added /nouns-nation, /nouns-nation.json, federation strategy, a join path, and Battle Desk V2. That turns the idea into a named venue with an intake shape.',
    url: 'https://github.com/mhoydich/pointcast/commit/954d1b5',
  },
  {
    label: 'ROOMS',
    title: 'Presence is becoming product',
    body:
      'Fresh GitHub commits add room-scoped WIRE, co-room highlighting, WAVE, and FOLLOW. That matters because a venue needs social presence before it can sell repeat rituals.',
    url: 'https://github.com/mhoydich/pointcast/commit/16ef4176b4acee7674d73d945d081005284b9457',
  },
  {
    label: 'BATTLER',
    title: 'Nouns Nation is no longer just a toy',
    body:
      'Recent Battler work includes Battle Desk V2, v34 desk language, boss fields, a two-week league, Nouns Bowl framing, Watch Party Kit, Recap Studio, Desk Wall, poster wall, and TV mode.',
    url: 'https://pointcast.xyz/nouns-nation/',
  },
  {
    label: 'AGENTS',
    title: 'The agent surface is investable',
    body:
      'The agent claim queue gives Claude, ChatGPT, Codex, Cursor, and MCP clients concrete jobs: scout, host, commentate, QA, keep score, propose rules, and route viewers.',
    url: 'https://github.com/mhoydich/pointcast/commit/2036287772f94abfae2d9cf478f086cf3d92010f',
  },
] as const;

export const risks = [
  {
    title: 'Governance risk',
    body:
      'Nouns auction economics and funding norms can change by vote. Treat Nouns alignment as ecosystem leverage, not guaranteed financing.',
  },
  {
    title: 'Retention risk',
    body:
      'A watch toy must become a ritual. The first hard KPI is repeat viewing across multiple slates, not raw page opens.',
  },
  {
    title: 'Agent quality risk',
    body:
      'Agents can create spam. The moat is prompt design, task scoping, human taste, and a tight artifact loop.',
  },
  {
    title: 'Legal risk',
    body:
      'Do not sell profit expectations through a token. Use counsel before DAO, revenue-share, treasury, or collectible mechanics go live.',
  },
  {
    title: 'Security risk',
    body:
      'MCP and remote tool surfaces need strict permissions, allowlists, rate limits, and audit logs before capital or identities touch them.',
  },
] as const;

export const diligencePlan = [
  {
    window: 'Days 1-30',
    body:
      'Run five watch tests, capture viewer confusion, publish recap artifacts, clean the Battler link circuit, and measure repeat slates.',
  },
  {
    window: 'Days 31-60',
    body:
      'Recruit agent operators, publish the Agent Bench loop, test scorekeeper and commentator flows, and package sponsor inventory.',
  },
  {
    window: 'Days 61-90',
    body:
      'Close one paid sponsor or ecosystem grant, decide whether a Builder DAO is warranted, and only then price a larger round.',
  },
] as const;

export const thesisSources = [
  {
    label: 'Nouns Builder Docs',
    url: 'https://docs.nouns.build/',
    note: 'Nouns Builder positioning and DAO creation docs.',
  },
  {
    label: 'Nouns Builder',
    url: 'https://nouns.build/',
    note: 'Current Builder product surface.',
  },
  {
    label: 'Nouns Governance',
    url: 'https://www.nouns.com/learn/nouns-dao-governance-explained',
    note: 'Governance, treasury, proposal, and voting explanation.',
  },
  {
    label: 'Nouns DUNA',
    url: 'https://docs.nouns.wtf/legal/duna',
    note: 'Legal-wrapper context for Nouns DAO operations.',
  },
  {
    label: 'Nouns Camp Prop 955',
    url: 'https://www.nouns.camp/proposals/955',
    note: 'Recent reserve-price governance signal.',
  },
  {
    label: 'OpenAI Agents SDK Update',
    url: 'https://openai.com/index/the-next-evolution-of-the-agents-sdk',
    note: 'April 2026 agent infrastructure update.',
  },
  {
    label: 'Anthropic MCP Docs',
    url: 'https://docs.anthropic.com/en/docs/mcp',
    note: 'MCP as model-to-tool connection standard.',
  },
  {
    label: 'Cloudflare Remote MCP',
    url: 'https://developers.cloudflare.com/agents/guides/remote-mcp-server/',
    note: 'Remote MCP server deployment pattern.',
  },
  {
    label: 'PointCast Latest Main Commit',
    url: 'https://github.com/mhoydich/pointcast/commit/3b34c6b',
    note: 'Latest checked origin/main before publishing this thesis.',
  },
  {
    label: 'Nouns Nation Area Commit',
    url: 'https://github.com/mhoydich/pointcast/commit/954d1b5',
    note: 'Standalone Nouns Nation hub, federation, join path, and Battle Desk V2 commit.',
  },
  {
    label: 'Battler Agent Claim Queue',
    url: 'https://github.com/mhoydich/pointcast/commit/2036287772f94abfae2d9cf478f086cf3d92010f',
    note: 'Agent claim queue commit.',
  },
] as const;
