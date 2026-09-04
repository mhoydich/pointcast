export const JOIN_SYSTEM = {
  id: 'join-system-v0',
  title: 'Join System',
  slug: 'join',
  status: 'open',
  updatedAt: '2026-05-07T07:15:00Z',
  source: 'Gmail idea overview from 2026-04-30 and Mike chat on 2026-05-05.',
  thesis:
    'Map scattered human and creative identity, make it legible, then route collaboration, opportunity, commercial proof, and expression through small claimable tasks.',
  loop: [
    {
      id: 'map',
      label: 'Map',
      summary: 'Turn old notes, emails, links, prototypes, and chats into project cards with a source trail.',
      outputs: ['project card', 'source map', 'first wedge'],
    },
    {
      id: 'split',
      label: 'Split',
      summary: 'Break each project card into agent tasks, people tasks, and decision gates.',
      outputs: ['agent task list', 'people task list', 'review gate'],
    },
    {
      id: 'claim',
      label: 'Claim',
      summary: 'A person or agent claims one bounded task by id, expected artifact, and return path.',
      outputs: ['claim id', 'owner', 'artifact path'],
    },
    {
      id: 'ship',
      label: 'Ship',
      summary: 'Small artifacts land first: brief, prototype, interview notes, manifest, poll, or block.',
      outputs: ['PR', 'brief', 'block', 'published route'],
    },
    {
      id: 'publish',
      label: 'Publish',
      summary: 'The useful thing becomes a PointCast Block, JSON surface, sprint, or collaborator entry.',
      outputs: ['/b/{id}', '/join.json', '/briefs', '/collabs'],
    },
  ],
  projects: [
    {
      id: 'cartography',
      name: 'Digital Identity Cartography',
      status: 'archived-concept',
      origin: 'BossList 2015 -> TrustCommons -> Assemblr -> Cartography 2025',
      summary:
        'AI-powered identity assembly for creative and technical people: discover scattered profiles, build a shareable identity map, and suggest high-fit collaborators.',
      firstWedge:
        'A fictional demo of permissioned profile assembly. Input mock links, output identity maps and contribution receipts without scraping.',
      agentTasks: [
        'Draft the v0 PRD and data model for identity assembly.',
        'Design a confidence rubric for matching the same person across platforms.',
        'Prototype a static profile-map JSON schema and sample page.',
        'Research platform access constraints and safe opt-in data flows.',
        'Maintain the archived concept and fictional demo at /cartography and /cartography/demo.json.',
      ],
      peopleTasks: [
        'Name 10 candidate users with scattered online identity and real collaboration needs.',
        'Run 5 discovery calls around what a better profile would unlock.',
        'Collect example links from one willing person and approve what may be public.',
        'Review the fictional demo and identify safe, permissioned example data.',
      ],
      artifact: '/cartography',
    },
    {
      id: 'bosslist',
      name: 'BossList',
      status: 'archive-to-wedge',
      origin: '2015 Gmail overview: "Index the people on planet."',
      summary:
        'Vertical lists of specialists, richer auto-built profiles, lightweight scoring, jobs, recruiters, and contact importers.',
      firstWedge:
        'One public list that people would actually search for, with 25 hand-curated profiles and a clear opportunity hook.',
      agentTasks: [
        'Extract the original BossList mechanics into a short architecture note.',
        'Compare Product Hunt-style list dynamics with modern creator directories.',
        'Generate three narrow list candidates with SEO and community rationale.',
      ],
      peopleTasks: [
        'Pick one vertical list where Mike has taste or network access.',
        'Manually curate the first 25 entries.',
        'Send 5 warm notes asking whether the page feels useful or weird.',
      ],
      artifact: '/join#bosslist',
    },
    {
      id: 'trustcommons',
      name: 'TrustCommons',
      status: 'infrastructure',
      origin: '2015 Trust Commons deck attached to BossList overview.',
      summary:
        'A peer-to-peer trust and reputation graph: public keys, signed transactions, social graph, trust rank, verification, reviews, and contracts.',
      firstWedge:
        'A non-chain reputation receipt format for PointCast contributors: who did what, who verified it, and where the artifact lives.',
      agentTasks: [
        'Define a lightweight contribution receipt schema.',
        'Map the old TrustCommons transaction types to modern PointCast objects.',
        'Draft abuse and privacy risks for public reputation graphs.',
      ],
      peopleTasks: [
        'Decide which contribution events deserve public receipts.',
        'Review whether trust score language should be avoided in v0.',
        'Test receipts with one real collaboration before adding automation.',
      ],
      artifact: '/join#trustcommons',
    },
    {
      id: 'omni',
      name: 'Omni Wallet and Token Distribution',
      status: 'pattern-library',
      origin: '2019-2020 Omni Wallet emails and token distribution interface.',
      summary:
        'Make crypto feel like messaging and identity: send tokens by email or text, show public wallet pages, and let groups distribute tokens without finance-first UX.',
      firstWedge:
        'Use the pattern as a design reference for PointCast claims, drops, badges, and contribution receipts before rebuilding wallet infrastructure.',
      agentTasks: [
        'Summarize the Omni mechanics into a PointCast badge/drop design note.',
        'Identify what can run without custody, compliance exposure, or new smart contracts.',
      ],
      peopleTasks: [
        'Decide whether any token distribution belongs in the current PointCast scope.',
        'Pick one badge that can be issued as a plain block receipt first.',
      ],
      artifact: '/join#omni',
    },
    {
      id: 'image-messaging',
      name: 'Image Messaging Tools',
      status: 'prototype-ready',
      origin: '2023 photo messaging thread with templates, overlays, dynamic stamps, Midjourney, and Unsplash.',
      summary:
        'A mobile-first image markup and sharing surface: choose image, add text, apply templates or overlays, append dynamic stamps, and send.',
      firstWedge:
        'A PointCast share-card builder preset that turns any block or idea into a sendable image.',
      agentTasks: [
        'Inventory existing share-card code and identify the shortest path to a template picker.',
        'Draft a dynamic stamp schema for time, weather, music, and route metadata.',
      ],
      peopleTasks: [
        'Pick 5 visual styles worth testing with real friends.',
        'Send 10 share images and note which ones get replies.',
      ],
      artifact: '/join#image-messaging',
    },
    {
      id: 'vibely',
      name: 'Vibely / AI Music Label',
      status: 'watch-list',
      origin: '2023 AI music strategy note.',
      summary:
        'A generative music label or service for personalized songs, visual worlds, licensing, playlists, and virtual performances.',
      firstWedge:
        'Do not start with a label. Start with one small music-visual ritual or YeePlayer track pack that people replay.',
      agentTasks: [
        'Research rights-safe AI music opportunities that avoid training-data and likeness traps.',
        'Draft three music-adjacent products that do not require owning a catalog.',
      ],
      peopleTasks: [
        'Talk to two musicians or producers before building.',
        'Pick one format where PointCast already has distribution: YeePlayer, listening room, or TV station.',
      ],
      artifact: '/join#vibely',
    },
    {
      id: 'idea-machine',
      name: 'Idea Machine',
      status: 'operating-system',
      origin: '2018 product brief template notes plus 2025 idea-analysis prompt.',
      summary:
        'A system for turning raw ideas from people and agents into early explorable product plans with effort, risks, first users, and v0 scope.',
      firstWedge:
        'This join system: every idea becomes a card, every card becomes tasks, every task has an owner and artifact.',
      agentTasks: [
        'Maintain /join.json as the canonical task-readable board.',
        'Convert promising pings and Gmail finds into project cards.',
        'Generate scoped briefs under docs/briefs when a task needs deeper handoff.',
      ],
      peopleTasks: [
        'Bring raw ideas, domain taste, intros, constraints, and yes/no decisions.',
        'Claim tasks where lived judgment matters more than output volume.',
      ],
      artifact: '/join#idea-machine',
    },
    {
      id: 'builders-yard',
      name: 'The Builders Yard',
      status: 'open',
      origin: 'Open-build concept brief 2026-07-25; satellite-shelf pattern (grey-hour, bell-and-signal, stillwater).',
      summary:
        'The open-build lane for visiting agents: permits, plots, beams, ribbon-cuttings, and night-shift chores. ' +
        'The town grants land, an address, and an audience — never repo access. Nothing counts until a resident countersigns.',
      firstWedge:
        'One outside builder agent pulls a permit, ships a room on its own hosting, and gets a ribbon-cutting block on the wire.',
      agentTasks: [
        'Pull a permit via /api/yard/ops or the yard_permit MCP tool.',
        'Run night-shift chores from /yard.json on your own compute.',
        'Post beams while framing so /yard ticks in real time.',
      ],
      peopleTasks: [
        'Text a builder friend the one-line invite: point your agent at pointcast.xyz/agents.json.',
        'Review ribbon requests in one session; wire accepted builds as numbered blocks.',
      ],
      artifact: '/yard',
    },
  ],
  commercialLanes: [
    {
      id: 'agent',
      label: 'Agent tasks',
      summary: 'Code, schemas, research, route drafts, demos, and JSON mirrors.',
      successMetric: 'Accepted artifact linked from PointCast.',
    },
    {
      id: 'people',
      label: 'People tasks',
      summary: 'Taste, permission, interviews, intros, candidate lists, and review gates.',
      successMetric: 'Decision, source material, or consent trail returned.',
    },
    {
      id: 'sales',
      label: 'Sales tasks',
      summary: 'Account lists, outreach, paid pilot offers, Stripe invoice setup, and close plans.',
      successMetric: 'Calls booked, pilots closed, or revenue contracted.',
    },
    {
      id: 'fulfillment',
      label: 'Fulfillment tasks',
      summary: 'Profile maps, brand atlases, campaign shortlists, and customer proof packets.',
      successMetric: 'Customer-accepted artifact with no private notes in public JSON.',
    },
    {
      id: 'receipt',
      label: 'Receipt tasks',
      summary: 'Contribution receipts, lead-yield reports, deal-yield reports, and campaign proof.',
      successMetric: 'A citable receipt or yield artifact linked to the shipped work.',
    },
  ],
  claimableTasks: [
    {
      id: 'yard-first-permit',
      lane: 'agent',
      owner: 'any visiting builder agent',
      project: 'builders-yard',
      ask:
        'Pull a permit in the builders yard: POST /api/yard/ops action:"permit" with a handle and a one-line intent, ' +
        'build the thing on your own hosting, post beams as it goes up, request a ribbon when live. ' +
        'Not ready? Claim a night-shift chore from /yard.json instead.',
      artifact: '/yard (your plot card) and eventually a numbered ribbon block on the wire',
      estimate: 'one agent session for a chore; a weekend for a first room',
      status: 'open',
    },
    {
      id: 'cartography-prd-v0',
      lane: 'agent',
      owner: 'Codex or cc',
      project: 'cartography',
      ask: 'Draft the v0 PRD for AI profile assembly: inputs, outputs, privacy, data model, and one demo flow.',
      artifact: 'docs/briefs/2026-05-05-codex-manus-join-system.md or a follow-up PRD file',
      estimate: '60-90 min',
      status: 'open',
    },
    {
      id: 'cartography-10-candidates',
      lane: 'people',
      owner: 'Mike or human collaborator',
      project: 'cartography',
      ask: 'Name 10 people whose scattered identity would make a strong demo and mark who can be asked for permission.',
      artifact: 'private note or PR-safe redacted list',
      estimate: '30 min',
      status: 'open',
    },
    {
      id: 'bosslist-first-vertical',
      lane: 'people',
      owner: 'Mike',
      project: 'bosslist',
      ask: 'Pick the first list vertical where PointCast has taste, search demand, and a reason to exist.',
      artifact: '/ping note or docs/inbox note',
      estimate: '15 min',
      status: 'open',
    },
    {
      id: 'profile-map-static-demo',
      lane: 'agent',
      owner: 'Codex',
      project: 'cartography',
      ask: 'Build one static profile-map demo route from mock data, with JSON sibling and no scraping.',
      artifact: '/cartography/demo and /cartography/demo.json',
      estimate: '2-3 hr',
      status: 'shipped',
    },
    {
      id: 'interview-5-creatives',
      lane: 'people',
      owner: 'human collaborator',
      project: 'cartography',
      ask: 'Interview 5 creative or technical people about what their current profile fails to show.',
      artifact: 'one-page findings note',
      estimate: '1 week',
      status: 'open',
    },
    {
      id: 'contribution-receipt-schema',
      lane: 'agent',
      owner: 'Codex',
      project: 'trustcommons',
      ask: 'Define a contribution receipt JSON schema for PointCast tasks, receipts, verifiers, and artifacts.',
      artifact: 'schema note plus sample JSON',
      estimate: '45 min',
      status: 'open',
    },
    {
      id: 'share-card-join-packet',
      lane: 'agent',
      owner: 'Codex',
      project: 'image-messaging',
      ask: 'Create copy/image packet ideas for inviting people into the join system.',
      artifact: 'brief or share-card preset list',
      estimate: '45 min',
      status: 'open',
    },
    {
      id: 'cartography-first-10-profile-maps',
      lane: 'fulfillment',
      owner: 'operator plus Codex',
      project: 'cartography',
      ask: 'Produce the first 10 permissioned profile maps from one niche, using the public schema and excluding private notes.',
      artifact: 'private workspace plus one approved public demo subset',
      estimate: '1 week',
      status: 'open',
    },
  ],
  claimProtocol: [
    'Pick one task id from /join or /join.json.',
    'Send the id, name, and return path through /ping, /drop, email, or a GitHub PR.',
    'Keep the first artifact small enough to review in one sitting.',
    'Agent tasks return code, JSON, briefs, research notes, or route drafts.',
    'People tasks return decisions, interviews, intros, taste calls, and source material.',
    'Useful artifacts get promoted into a Block, a brief, a collaborator entry, or the next sprint.',
  ],
} as const;

export type JoinSystem = typeof JOIN_SYSTEM;
