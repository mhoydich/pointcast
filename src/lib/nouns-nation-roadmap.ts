export const NOUNS_NATION_ROADMAP_VERSION = '2026-04-29-v2';

export const NOUNS_NATION_ROADMAP = {
  name: 'Nouns Nation Builder Roadmap V2',
  url: 'https://pointcast.xyz/nouns-nation/roadmap',
  json: 'https://pointcast.xyz/nouns-nation/roadmap.json',
  deck: 'https://pointcast.xyz/decks/nouns-nation-builder-roadmap-v2.pptx',
  date: NOUNS_NATION_ROADMAP_VERSION,
  thesis:
    'Build a web-native arena first, then use agents to operate the broadcast layer, then syndicate the format into TV screens, venues, and eventually ticketed live finals.',
  position:
    'Browser room -> agent-operated broadcast -> TV-ready league -> venue and stadium format.',
  operatingRule:
    'Use AI tools to compress production cost, not to remove human taste. The moat is a repeatable ritual plus machine-readable operations.',
  latestGithubHead: 'ade9f31',
} as const;

export const aiToolingCurve = [
  {
    period: '2026',
    title: 'Agent-native production',
    signal:
      'Agents can inspect repos, run commands, edit files, call MCP tools, and work in sandboxes.',
    implication:
      'One small team can ship the control room: scorekeeping, highlights, recap drafts, sponsor inventory, QA, and manifests.',
  },
  {
    period: '2027',
    title: 'Distributed media ops',
    signal:
      'Remote MCP servers, coding agents, and repo-native workflows become normal parts of production.',
    implication:
      'Partner venues and city nodes can run standardized watch nights while agents keep the desk, feed, and receipts in sync.',
  },
  {
    period: '2028',
    title: 'Physical-world show surface',
    signal:
      'AI building tools make bespoke media formats cheap enough to rehearse, localize, and package.',
    implication:
      'The format can graduate from browser league to bar screens, campus nights, festival courts, and a flagship live final.',
  },
] as const;

export const threeYearRoadmap = [
  {
    year: 'Year 1',
    calendar: '2026',
    title: 'Prove the weekly ritual',
    headline: 'Make the league room worth returning to every week.',
    publicSurfaces: [
      'Nouns Nation hub',
      'Battle Desk V3',
      'TV cast',
      'Agent Bench',
      'Sponsorship Desk',
      'Roadmap V2 and deck',
    ],
    build: [
      'Agent desk for scout, host, commentator, QA, and scorekeeper jobs.',
      'Twelve scheduled watch nights with public recap artifacts.',
      'Sponsor kit, season calendar, and clean analytics for repeat viewing.',
    ],
    gates: [
      '12 recurring watch nights',
      '25 useful agent artifacts per month',
      '3 sponsor or ecosystem funding tests',
      'Repeat-viewing cohort visible across slates',
    ],
  },
  {
    year: 'Year 2',
    calendar: '2027',
    title: 'Syndicate the broadcast network',
    headline: 'Turn one desk into a repeatable local and partner format.',
    publicSurfaces: [
      'City or partner nodes',
      'Venue watch kits',
      'Remote MCP ops',
      'Season manifests',
      'Sponsor inventory',
    ],
    build: [
      'A partner kit for bars, campuses, DAO chapters, shops, and clubs.',
      'Federated manifests for local identity, rules, rosters, and results.',
      'A sponsor loop that buys named slates, highlights, and physical nights.',
    ],
    gates: [
      '4 city or partner nodes',
      '2-4 paid sponsors',
      'Recurring season cadence',
      '1,000-plus weekly viewers as a target, not a promise',
    ],
  },
  {
    year: 'Year 3',
    calendar: '2028',
    title: 'Package the live final',
    headline: 'Make a browser-native sport legible on a stage or stadium board.',
    publicSurfaces: [
      'Flagship live final',
      'Venue AV package',
      'Ticketed stream',
      'School and brand brackets',
      'Licensing kit',
    ],
    build: [
      'A finals format with live host, agent desk, crowd screen, and recap studio.',
      'Venue production runbook for scoreboards, QR handoffs, and sponsor reads.',
      'Licensable season package for community operators.',
    ],
    gates: [
      '1 flagship live final',
      '10-plus venue partners',
      'Break-even season economics',
      'Licensing and sponsorship revenue line',
    ],
  },
] as const;

export const venueLadder = [
  {
    stage: 'Browser room',
    body:
      'The first venue is the URL: no install, no token prerequisite, readable by humans and agents.',
  },
  {
    stage: 'Living room TV',
    body:
      'TV cast mode turns the desk into a watch-party surface for AirPlay, HDMI, smart TVs, and club screens.',
  },
  {
    stage: 'Bars, campuses, chapters',
    body:
      'Partner nodes get a local kit: schedule, QR joins, sponsor reads, results, and manifest handoff.',
  },
  {
    stage: 'Festival and stadium',
    body:
      'The final form is an event format: live finals, scoreboard graphics, agent desk, crowd rituals, and ticketed streams.',
  },
] as const;

export const capitalGatesV2 = [
  {
    gate: 'Seed check',
    amount: '$50k-$75k',
    unlock:
      'Ninety days of product proof: scheduled watch nights, agent bench loop, analytics, and sponsor collateral.',
  },
  {
    gate: 'Production tranche',
    amount: 'Up to $250k',
    unlock:
      'Released after repeat-viewing proof, useful agent output, and one sponsor or ecosystem funding partner.',
  },
  {
    gate: 'Broadcast tranche',
    amount: 'Milestone priced',
    unlock:
      'Only after partner venues want the format and the production runbook is repeatable without founder heroics.',
  },
  {
    gate: 'Onchain option',
    amount: 'Counsel-gated',
    unlock:
      'A Builder DAO or token should follow proven audience behavior, legal review, and clean governance claims.',
  },
] as const;

export const ninetyDayMoves = [
  {
    window: 'Days 1-30',
    move:
      'Lock the weekly slate, publish recaps, harden the Battler link circuit, and cut every confusing step from the viewer loop.',
  },
  {
    window: 'Days 31-60',
    move:
      'Recruit agent operators, test scorekeeper and commentator handoffs, and package the first sponsor inventory.',
  },
  {
    window: 'Days 61-90',
    move:
      'Run the first paid or grant-backed season test, publish the venue kit, and decide whether expansion capital is warranted.',
  },
] as const;

export const roadmapGithubSignals = [
  {
    label: 'MAIN',
    title: 'Origin main is current at ade9f31',
    body:
      'The branch was rebased onto the latest GitHub main before V2. The freshest product receipt fixes MCP broadcasts so /drum-agent surfaces real agent activity.',
    url: 'https://github.com/mhoydich/pointcast/commit/ade9f31',
  },
  {
    label: 'SPONSOR',
    title: 'Sponsorship Desk is now on main',
    body:
      'Commit f931c96 added the Nouns Nation sponsorship desk, which turns the venue thesis from audience-only into inventory, packages, and partner revenue tests.',
    url: 'https://github.com/mhoydich/pointcast/commit/f931c96',
  },
  {
    label: 'BATTLE',
    title: 'Battle Desk V3 is live on main',
    body:
      'Commit 1422c7e added Battle Desk V3 for the Nouns Nation arena, giving the roadmap a fresh product receipt for the weekly ritual layer.',
    url: 'https://github.com/mhoydich/pointcast/commit/1422c7e',
  },
  {
    label: 'BUILD',
    title: 'Main also landed the build fix',
    body:
      'Commit 4da250b landed dock-kit and federation-peers data so main builds cleanly before this roadmap work ships.',
    url: 'https://github.com/mhoydich/pointcast/commit/4da250b',
  },
  {
    label: 'DEPLOY',
    title: 'Deploy trigger is part of the fresh run',
    body:
      'Commit e574bac triggered a fresh Cloudflare deploy after the prior run, keeping the public surface aligned with main.',
    url: 'https://github.com/mhoydich/pointcast/commit/e574bac',
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
    title: 'Co-presence keeps turning into product',
    body:
      'Commit cf363fb added VIBE, BRING, and cursor speech bubble behavior. That matters because venue economics require people to feel each other in the room.',
    url: 'https://github.com/mhoydich/pointcast/commit/cf363fb',
  },
  {
    label: 'PRESS',
    title: 'The media catalog is becoming a surface',
    body:
      'Commit d28a2c2 added /drum-press as a catalog of drum media: eight imprints and forty-seven titles. The studio can publish archives, not only games.',
    url: 'https://github.com/mhoydich/pointcast/commit/d28a2c2',
  },
  {
    label: 'THESIS',
    title: 'Investment memo is already live',
    body:
      'Commit 55fbf07 published the first Nouns Nation investment thesis across HTML, JSON, agent discovery, and sitemap surfaces.',
    url: 'https://github.com/mhoydich/pointcast/commit/55fbf07',
  },
  {
    label: 'NATION',
    title: 'Nouns Nation has a named home',
    body:
      'Commit 954d1b5 added the standalone Nouns Nation area, federation path, join route, and the first Battle Desk V2 framing.',
    url: 'https://github.com/mhoydich/pointcast/commit/954d1b5',
  },
] as const;

export const roadmapSources = [
  {
    label: 'OpenAI Agents SDK',
    url: 'https://openai.com/index/the-next-evolution-of-the-agents-sdk',
    note: 'April 2026 agent harness, sandbox, MCP, patch tool, skills, and code-mode direction.',
  },
  {
    label: 'Anthropic MCP Docs',
    url: 'https://docs.anthropic.com/en/docs/mcp',
    note: 'MCP positioning as a standard way to connect models with tools and data.',
  },
  {
    label: 'Anthropic MCP Connector',
    url: 'https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector',
    note: 'Remote MCP server use from the Messages API with tool-call support.',
  },
  {
    label: 'Cloudflare Remote MCP',
    url: 'https://developers.cloudflare.com/agents/guides/remote-mcp-server/',
    note: 'Remote MCP server deployment pattern with authentication and client proxying.',
  },
  {
    label: 'Cloudflare MCP Servers',
    url: 'https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/',
    note: 'Managed remote MCP server catalog for account, docs, logs, and API operations.',
  },
  {
    label: 'GitHub Copilot Coding Agent',
    url: 'https://docs.github.com/copilot/concepts/coding-agent/about-copilot-coding-agent',
    note: 'Background coding agent workflow with ephemeral GitHub Actions environment and PR review loop.',
  },
  {
    label: 'GitHub Copilot MCP',
    url: 'https://docs.github.com/en/copilot/using-github-copilot/coding-agent/extending-copilot-coding-agent-with-mcp',
    note: 'MCP extension path for GitHub Copilot coding agent.',
  },
  {
    label: 'Nouns Builder Docs',
    url: 'https://docs.nouns.build/',
    note: 'Builder documentation for nounish DAO creation.',
  },
  {
    label: 'Nouns Governance',
    url: 'https://www.nouns.com/learn/nouns-dao-governance-explained',
    note: 'Nouns DAO governance and funding model context.',
  },
  {
    label: 'Nouns Nation Roadmap Deck',
    url: 'https://pointcast.xyz/decks/nouns-nation-builder-roadmap-v2.pptx',
    note: 'Editable V2 deck generated from this roadmap.',
  },
] as const;
