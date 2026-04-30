export const INVESTMENT_THESIS_VERSION = '2026-04-29-v2';

export const INVESTMENT_THESIS = {
  name: 'Nouns Nation Builder Investment Thesis V2',
  url: 'https://pointcast.xyz/investment-thesis',
  json: 'https://pointcast.xyz/investment-thesis.json',
  roadmap: 'https://pointcast.xyz/nouns-nation/roadmap',
  roadmapJson: 'https://pointcast.xyz/nouns-nation/roadmap.json',
  deck: 'https://pointcast.xyz/decks/nouns-nation-builder-roadmap-v2.pptx',
  date: INVESTMENT_THESIS_VERSION,
  decision: 'Invest, but milestone-gated.',
  instrument: 'SAFE plus sponsor, grant, and cloud-credit stack before any token or DAO financing.',
  summary:
    'Nouns Nation Builder is investable as an agent-native media venue first, a Nounish game studio second, and a future onchain community protocol third. V2 adds the venue ladder: browser room, living-room TV, partner venues, and eventually ticketed live finals.',
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
      'A small, fast studio building a Nounish nation: automated leagues, watch-party pages, TV cast surfaces, agent task boards, MCP tools, manifests, recaps, posters, venue kits, and eventually a Builder DAO around the best rituals.',
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
      'OpenAI described its April 2026 Agents SDK direction around MCP, skills, shell tools, patch tools, sandbox execution, subagents, and code-mode workflows as normal builder primitives.',
  },
  {
    title: 'MCP gives agents a doorway',
    body:
      'Anthropic frames MCP as a standard for connecting models to tools and data. Cloudflare now documents remote MCP servers as deployable agent infrastructure.',
  },
  {
    title: 'PointCast has shipped the shape',
    body:
      'The latest GitHub work is not only content. It is a standalone Nouns Nation hub, Battle Desk V3, Sponsorship Desk, federation manifest, co-presence, WIRE, FOLLOW, agent visitor centers, media catalogs, agent activity broadcasts, and Nouns Nation agent claim queues.',
  },
] as const;

export const capitalPlan = [
  {
    label: 'First check',
    body:
      '$50k-$75k for 90 days of product proof: Nouns Nation hub, Battler TV, Agent Bench, Production Desk, scorebook, roadmap deck, sponsor kit, and distribution tests.',
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
    title: 'PointCast main is current at ade9f31',
    body:
      'V2 was rebased onto the latest origin/main on Apr 29. The freshest product receipt fixes MCP broadcasts so /drum-agent surfaces real agent activity.',
    url: 'https://github.com/mhoydich/pointcast/commit/ade9f31',
  },
  {
    label: 'SPONSOR',
    title: 'Sponsorship Desk is now on main',
    body:
      'Commit f931c96 added the Nouns Nation sponsorship desk, which gives the investment thesis a concrete package for revenue tests before larger capital.',
    url: 'https://github.com/mhoydich/pointcast/commit/f931c96',
  },
  {
    label: 'PRODUCTION',
    title: 'Production Desk makes contribution proof visible',
    body:
      'V38 adds a local accepted-work ledger, broadcast director queue, rooting cards, season archive, and Nouns Bowl hype week so agent and human outputs have an approval path.',
    url: 'https://pointcast.xyz/nouns-nation-battler-production/',
  },
  {
    label: 'BATTLE',
    title: 'Battle Desk V3 is live on main',
    body:
      'Commit 1422c7e added Battle Desk V3 for the Nouns Nation arena, extending the weekly ritual layer the roadmap is built around.',
    url: 'https://github.com/mhoydich/pointcast/commit/1422c7e',
  },
  {
    label: 'BUILD',
    title: 'Main also carries the build fix',
    body:
      'Commit 4da250b landed dock-kit and federation-peers data so main builds cleanly before this roadmap ships.',
    url: 'https://github.com/mhoydich/pointcast/commit/4da250b',
  },
  {
    label: 'BIRTHDAY',
    title: 'The imprint surface keeps expanding',
    body:
      'Commit e1a1e39 added the drum-birthday imprint with four collaborative birthday surfaces.',
    url: 'https://github.com/mhoydich/pointcast/commit/e1a1e39',
  },
  {
    label: 'PRESENCE',
    title: 'Presence is becoming product',
    body:
      'Commit cf363fb added VIBE, BRING, and cursor speech bubbles. A venue needs people to feel each other before it can sell repeat rituals.',
    url: 'https://github.com/mhoydich/pointcast/commit/cf363fb',
  },
  {
    label: 'PRESS',
    title: 'Media catalogs are now shipping',
    body:
      'Commit d28a2c2 added /drum-press with eight imprints and forty-seven titles. The broader PointCast studio can package archives, not only live toys.',
    url: 'https://github.com/mhoydich/pointcast/commit/d28a2c2',
  },
  {
    label: 'NATION',
    title: 'The investable surface now has a hub',
    body:
      'Commit 954d1b5 added /nouns-nation, /nouns-nation.json, federation strategy, a join path, and the first Battle Desk V2 frame. That turned the idea into a named venue with an intake shape.',
    url: 'https://github.com/mhoydich/pointcast/commit/954d1b5',
  },
  {
    label: 'BATTLER',
    title: 'Nouns Nation is no longer just a toy',
    body:
      'Recent Battler work now includes Battle Desk V3, Battle Desk V2, v34 desk language, boss fields, a two-week league, Nouns Bowl framing, Watch Party Kit, Recap Studio, Desk Wall, poster wall, and TV mode.',
    url: 'https://pointcast.xyz/nouns-nation/',
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
      'Recruit agent operators, publish the Agent Bench loop, test scorekeeper and commentator flows, package sponsor inventory, and use the Production Desk to reconcile accepted work.',
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
    label: 'Anthropic MCP Connector',
    url: 'https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector',
    note: 'Remote MCP connection path from the Messages API.',
  },
  {
    label: 'Cloudflare Remote MCP',
    url: 'https://developers.cloudflare.com/agents/guides/remote-mcp-server/',
    note: 'Remote MCP server deployment pattern.',
  },
  {
    label: 'GitHub Copilot Coding Agent',
    url: 'https://docs.github.com/copilot/concepts/coding-agent/about-copilot-coding-agent',
    note: 'Background coding agent, GitHub Actions environment, and PR review loop.',
  },
  {
    label: 'Nouns Nation Roadmap V2',
    url: 'https://pointcast.xyz/nouns-nation/roadmap',
    note: 'Three-year roadmap and deck for TV, venues, and live finals.',
  },
  {
    label: 'PointCast Latest Main Commit',
    url: 'https://github.com/mhoydich/pointcast/commit/ade9f31',
    note: 'Latest checked origin/main before publishing this thesis.',
  },
  {
    label: 'Nouns Nation Sponsorship Desk',
    url: 'https://github.com/mhoydich/pointcast/commit/f931c96',
    note: 'Sponsorship desk commit landed immediately before Roadmap V2.',
  },
  {
    label: 'Nouns Nation Battle Desk V3',
    url: 'https://github.com/mhoydich/pointcast/commit/1422c7e',
    note: 'Battle Desk V3 commit for the current arena surface.',
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
