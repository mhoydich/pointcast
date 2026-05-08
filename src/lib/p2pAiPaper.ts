/**
 * Peer-to-Peer AI — UES Working Paper 2026-15.
 *
 * A study framework for how people interact with AI in 2026 and what is
 * about to emerge in the inter-AI communication and permissioning layers.
 * Mike's own live-artifacts setup (Slack + Google Suite + Gmail + Calendar
 * + Drive + Asana + Shopify + the PointCast MCP, all unified into a single
 * intelligence surface across Claude / OpenAI / Gemini) is the primary
 * case study. The Mist browser (Ethereum, 2015-2019, deprecated) is the
 * methodological precedent.
 */

export const PAPER_META = {
  title: 'Peer-to-Peer AI',
  subtitle: 'A framework for studying how people use AI · the live-artifacts unification · the inter-AI communication layer · the permissioning problem · UES Working Paper 2026-15',
  thesis: 'The shift underway in 2026 is not "people are using AI more." The shift is structural: a single end-user can now unify Slack, Gmail, Calendar, Drive, Asana, a custom MCP, and a commerce backend (Shopify) inside one AI client and ask questions that cross every silo at once. The intelligence layer has arrived at the desktop. What has NOT arrived is (1) inter-AI communication — Claude does not yet talk to OpenAI talk to Gemini through any open protocol — and (2) data permissioning between AI systems, where the user remains sovereign rather than being recreated as N copies inside N proprietary memories. This paper proposes a UES research framework for studying these transitions: a peer-to-peer cohort of corridor users running parallel experiments, longitudinally documented, open-licensed, and structured so that the field-note record outlasts any single AI vendor. The Mist browser (Ethereum, 2015-2019, deprecated) is the cautionary precedent and the methodological template.',
  paperNumber: 'UES-WP-2026-15',
  date: '2026-05-08',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Inquiry', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['peer-to-peer AI', 'live artifacts', 'MCP', 'Model Context Protocol', 'inter-AI communication', 'data permissioning', 'Mist browser', 'Ethereum precedent', 'University of El Segundo', 'AI cohort study', 'AI sovereignty'],
  parentSurface: 'University of El Segundo · Department of Local Inquiry',
  relatedSurfaces: ['UES-WP-2026-11 The Forkable Radius', 'UES-Federation-05 Federation Council Charter', '/eth-legacy', '/pointcast-connectors'],
};

export const THE_CASE_STUDY = {
  title: 'The Live-Artifacts Unification — Mike\'s 2026 desktop',
  description: 'A working description of what one end-user has connected to a single AI workspace as of 2026-05-08. Not advocacy; field notes.',
  surfacesConnected: [
    { surface: 'Slack', connectorType: 'first-party MCP', dataExposed: 'Channel and DM read access; canvas read/write; user profile; scheduled message creation', useCases: 'Pre-meeting briefs (read recent threads, summarize what to expect); answer-drafting (prepare a reply privately, post when satisfied); cross-channel synthesis (one question across 4 channels at once)' },
    { surface: 'Google Suite (Drive, Docs, Sheets)', connectorType: 'OAuth + first-party MCP', dataExposed: 'File read/write/search; document content access; spreadsheet read with formula resolution', useCases: 'Budget rolls (sum across 5 sheets in one prompt); document drafting from briefs; cross-document quote extraction for paper writing' },
    { surface: 'Gmail', connectorType: 'first-party MCP', dataExposed: 'Thread read/search; draft creation; label management', useCases: 'Inbox triage (which threads need a reply today); draft assistance (prepare 6 replies in batch, review before send); thread summarization for handoff' },
    { surface: 'Calendar', connectorType: 'first-party MCP', dataExposed: 'Event read/create/update; calendar listing; time suggestion', useCases: 'Pre-meeting context (what was discussed last time, who is attending); scheduling (find time for X across 4 calendars); commitment auditing (where did the week actually go)' },
    { surface: 'Asana', connectorType: 'OAuth + project-management MCP', dataExposed: 'Task read/create/update; project status; portfolio view; team rosters', useCases: 'Status reports drawn from real task state; cross-project commitment checking; weekly digest preparation; portfolio-level priority pruning' },
    { surface: 'Shopify', connectorType: 'commerce MCP', dataExposed: 'Order/customer/product/inventory read; analytics queries; collection management', useCases: 'Sales triage (yesterday vs today, by product); inventory rebalance suggestion; customer cohort analysis without leaving the AI client; LTV queries on demand' },
    { surface: 'PointCast MCP (custom)', connectorType: 'self-hosted MCP', dataExposed: 'Town-state read; agent tasks; presence; weather; channel inventory', useCases: 'Direct queries against the corridor\'s own civic-broadcast surface; cross-instance state checks; federation-aware agent coordination' },
    { surface: 'Local file system', connectorType: 'Bash + Read tools (Claude Code in particular)', dataExposed: 'Repository read/write; git operations; build commands', useCases: 'This paper is being drafted via this very access pattern. The text-editing loop is now agent-driven, not human-keystroke-driven.' },
  ],
  intelligenceLayer: 'A single AI client (Claude, OpenAI, Gemini, etc.) sits above all eight surfaces and answers cross-surface questions at the speed of the slowest underlying API. "What did I commit to in Asana that depends on a Slack thread that references a Drive doc I haven\'t read yet?" is now answerable in one prompt.',
  outputFormats: 'The same intelligence layer outputs across formats with no marginal cost — Slack message draft, Gmail reply, calendar event, Asana task, spreadsheet entry, document section, JSON, Markdown, PDF, image. The end-user no longer chooses tools by output format; they choose by intent and the format follows.',
  whatThisLooksLikeFromInside: 'The AI client becomes the dashboard. The browser tabs become read-mostly. The keyboard shortcut to the AI client is more important than any individual app\'s shortcut. The end-user\'s working memory is augmented at the surface-aggregation layer; the "20-tab problem" of 2020 is replaced by "one AI client + the surfaces it can reach." Not without trade-offs (see permissioning section).',
};

export const FOUR_TRANSITIONS = [
  { id: 'unification', title: 'The Live-Artifacts Unification', stage: 'arrived (2025-2026)', description: 'A single AI client connects to N first-party productivity surfaces (Slack, Google Suite, Gmail, Calendar, etc.) and answers cross-surface questions in one prompt. The MCP standard (Anthropic, October 2024) accelerated this; OpenAI and Google followed with their own connector formats.', whatChanged: 'The end-user can now ask questions that cross silos. The "go to Slack, then Gmail, then Calendar, then Drive" workflow collapsed into one sentence. Productivity gain is real but uneven — biggest wins are coordination tasks (status, scheduling, follow-up); smallest wins are creation tasks (writing, designing, building).', whatRemainsBroken: 'Connector reliability varies (some MCPs degrade on edge cases). Permissioning is per-connector, not aggregate (no unified "what does my AI know" view). Audit logs are inconsistent. Provider-side memory accumulates without user-visible boundaries.' },
  { id: 'inter-ai-comm', title: 'The Inter-AI Communication Layer', stage: 'forming (2026-2028 estimated)', description: 'A protocol — analogous to SMTP for email or HTTP for web — that lets agent-1 (Claude) coordinate with agent-2 (OpenAI) and agent-3 (Gemini) on a shared task, with the user as principal. Today this is bilateral and proprietary; the agent-to-agent protocols (A2A from Google, agent-handoff in OpenAI, cross-MCP-server delegation in Anthropic) are early and not interoperable.', whatChanged: 'Pre-2026, AI clients were monolithic islands. Mid-2026, multi-agent orchestration became mainstream INSIDE a single vendor (Claude\'s sub-agents, OpenAI\'s Swarm-derived patterns, Gemini\'s agent-builder). Late-2026 and beyond, the cross-vendor agent-to-agent layer is the open question.', whatRemainsBroken: 'No open protocol has won. Every vendor has incentive to lock the user into one client. The Mist precedent (2015-2019) suggests the protocol will form OUTSIDE the vendors, in user-cohort or research-cohort experimentation, before being adopted reluctantly. UES is positioned to be one of the user-cohort experiments.' },
  { id: 'permission', title: 'The Data Permission Layer', stage: 'unsolved (open)', description: 'When the end-user connects Slack to Claude, what does Claude do with that data? When they also connect Slack to OpenAI, is the same data being copied into a second proprietary memory? When they connect both to Gemini, three? Today the permission model is per-client, opaque, and irreversible (data exfiltrated into a model\'s memory does not have a delete-and-forget primitive in 2026).', whatChanged: 'The connector revolution exposed the underlying permission problem: end-users were comfortable granting per-app data access, but they did not anticipate that the AI client would synthesize across all apps and create a new aggregate dataset (the "AI\'s view of you") that is itself a privacy surface.', whatRemainsBroken: 'No standard for cross-AI permissioning. No "data-portability between AIs" pattern. No "delete from this AI\'s memory" primitive. No federation-level "I do not want my Slack data in OpenAI\'s training corpus, only in inference" toggle. The user is sovereign in theory; the user is recreated as N copies in N proprietary memories in practice.' },
  { id: 'collective', title: 'Collective AI Tools for Quality of Life', stage: 'speculative (2027+)', description: 'Once the inter-AI and permission layers stabilize, end-users in a federation could share intelligence-layer infrastructure cooperatively: a corridor-wide AI cohort that runs queries against pooled (and consent-gated) data, the way a public library shares books. The federation\'s commitment to CC0 / open-source / federation-shared schemas positions it well for this experiment.', whatChanged: '(speculative) Pooled-but-consent-gated data could enable queries no individual could run alone — "across the 100 corridor cohort members, what is the average commute distance to a First Sit anchor on a Tuesday morning?" Civic-research-grade analytics at the corridor scale, with explicit consent, retirable participation, and per-query opt-in.', whatRemainsBroken: 'No working model exists. The closest precedents (Solid by Tim Berners-Lee, MIDATA Switzerland, the various "personal data pod" projects) have been either too academic or too commercial. The federation-cohort experiment is the next-best test case.' },
];

export const MIST_PRECEDENT = {
  title: 'The Mist Browser (2015-2019, deprecated)',
  description: 'The Ethereum Foundation\'s attempt at building a peer-to-peer browser for the "decentralized web." Released as alpha in 2015, deprecated in March 2019. Its history is the methodological precedent for studying the AI-client emergence in 2026.',
  whatItWas: 'A desktop client that combined a wallet (geth-derived) with a browser shell (Electron / Chromium-based) so users could browse and transact across early dApps without trusting a centralized gateway. It tried to be MetaMask + Brave + Coinbase Wallet, all at once, in 2015 — five years too early.',
  whatItGotRight: [
    'The peer-to-peer browser thesis was correct. Users DO need a single client that can reach decentralized infrastructure.',
    'The ENS (Ethereum Name Service) integration foreshadowed the human-readable-address UX that became standard.',
    'The wallet-as-default-identity was correct — what we now call "sign in with Ethereum" started in Mist.',
    'The early-adopter cohort it cultivated (people running Mist 2015-2017) became the developer/operator class for the entire post-2017 dApp ecosystem.',
  ],
  whatItGotWrong: [
    'Tightly coupled to a specific blockchain client (geth) and a specific UI shell (Electron); both moved faster than Mist could keep up.',
    'Security model was unworkable for non-technical users (private keys held in a desktop file, recovery via mnemonic that most users could not store securely).',
    'No clear funding model; the Ethereum Foundation eventually concluded the project was not core protocol infrastructure and let it lapse.',
    'Tried to do too much at once — wallet + browser + dApp store + identity + transaction signer — instead of picking one layer.',
  ],
  whatTheAiClientEmergenceCanLearn: [
    'Pick one layer. The MCP standard does this well — it is the "permission and connection" layer, not the entire user experience.',
    'Decouple from any single vendor\'s implementation. An open protocol that ships in three implementations is more durable than a polished single-vendor client.',
    'The early-adopter cohort matters more than the technology. UES corridor cohort members who run their own MCP servers, audit their own data flows, and document their own field notes are the equivalent of the 2015-2017 Mist users — the developer/operator class for whatever 2030\'s default looks like.',
    'Plan for deprecation. Mist was retired by the same foundation that built it; the foundation\'s reputation survived because the deprecation was honest. AI vendors that claim immortality for their clients are violating the Mist lesson.',
  ],
};

export const RESEARCH_FRAMEWORK = {
  description: 'A study structure UES could use to learn from the AI-client emergence as it happens, in the corridor, with the cohort that already exists. Not a clinical-trial framework; a participatory-action-research framework.',
  cohort: {
    size: '20-40 corridor cohort members across the five candidate instances (ES, MB, HB, RB, Torrance), recruited via the Marine Layer cohort process. Cohort cap matches the existing Marine Layer cap structure (12-per-instance) so participation does not require new infrastructure.',
    diversity: 'Mix across (a) AI client choice (Claude / OpenAI / Gemini / mixed), (b) primary use case (work coordination / personal coordination / creative production / civic coordination), (c) technical comfort (engineer / power-user / casual / first-time), (d) data sensitivity (personal-only / business / civic-volunteer / sensitive-professional).',
    consent: 'Every participant has a public-record opt-in document at /p2p-ai/participants/{participant-slug} naming what they agreed to share, what they retain private, what they can withdraw. Withdrawal is one-click and retroactive (their field notes are removed from the corpus on request).',
    duration: 'Six-week initial cycle, mirroring Marine Layer\'s eight-week pattern but shorter to allow rapid iteration. Three cycles per year. Each cycle publishes its synthesis to the federation library.',
  },
  weeklyCadence: [
    { week: 1, theme: 'Connector audit', practice: 'Each participant lists every connector active in their AI client. Per-connector: what data is exposed, what is permissioned, what audit log exists. Field note format: a structured Markdown file in /p2p-ai/audits/{participant}/{week}.md.' },
    { week: 2, theme: 'Cross-surface query log', practice: 'Each participant logs 5 queries per day for 7 days that crossed two or more connected surfaces. What was the question? What surfaces did the AI reach? Was the answer correct? Was the response useful? Did the participant verify any part of the response manually?' },
    { week: 3, theme: 'Multi-AI comparison', practice: 'Each participant runs the same 10 queries against their primary AI client and at least one secondary (Claude vs OpenAI; OpenAI vs Gemini; etc.). Where did answers diverge? Where did connectors fail? Where did one AI refuse and another comply? Field notes capture both the answers and the meta-pattern.' },
    { week: 4, theme: 'Permission boundary stress test', practice: 'Each participant deliberately probes their AI client\'s permission boundaries: revoke a connector mid-session and observe; ask the AI to summarize "what you know about me"; test whether deletion of a Slack channel removes references in subsequent AI responses. Document recoverable vs unrecoverable data flows.' },
    { week: 5, theme: 'Inter-AI hand-off attempt', practice: 'Each participant attempts to coordinate two AI clients on one task — for example, draft an email in Claude and have Gemini schedule the meeting it references. What broke? What worked? What was the user-experience cost?' },
    { week: 6, theme: 'Synthesis and field-note publishing', practice: 'Each participant writes a 500-word reflection: what changed in their working habits, what they would teach a friend, what permission boundaries they now defend. Reflections are published to the federation library with consent.' },
  ],
  outputs: [
    'Per-cycle synthesis paper published as a UES Working Paper (UES-WP-2026-XX-cycle-{n}).',
    'Annual longitudinal review at the federation council\'s autumnal-equinox meeting.',
    'Open-licensed (CC0) field-note corpus that other corridor cohorts and external researchers can use, in perpetuity, with consenting-participant attribution.',
    'A "P2P AI Connector Reference" that summarizes which connectors work, which break, and what permissioning each exposes — a federation-maintained, vendor-independent companion to vendor documentation.',
  ],
  governance: 'The study\'s data, methods, and synthesis are governed by the federation council per the Charter (UES-Federation-05). Per-participant data is governed by the participant. The federation does not retain individual data after participant withdrawal.',
};

export const COLLECTIVE_TOOLS_SPECULATION = [
  { tool: 'Corridor Inbox Triage Cooperative', description: 'A consenting-cohort tool that, with explicit per-participant opt-in, runs anonymized inbox-triage analytics: "the corridor cohort\'s average response time to first email is 14 hours; yours is 23." Surfaces patterns each participant could not see alone. Privacy mechanism: differential-privacy noise + opt-out per query.', stage: 'speculative · 2027-2028' },
  { tool: 'Federation Calendar Coordination', description: 'A consenting-cohort calendar query tool: "what time of week does the corridor cohort most often have a free 30 minutes?" Useful for scheduling federation events, identifying shared attention windows. Privacy mechanism: aggregate-only output, no individual exposure.', stage: 'speculative · 2027-2028' },
  { tool: 'Cohort Reading Library', description: 'Each participant\'s consent-flagged "recent reads" (Drive docs, web articles, Slack threads they bookmarked) feed a cohort recommendation engine — not Goodreads, more like "what is the corridor reading this month." Privacy mechanism: opt-in per-item, retirable, attribution-optional.', stage: 'speculative · 2028+' },
  { tool: 'Civic AI Common-Knowledge Cache', description: 'A federation-maintained vector index of public corridor surfaces (every UES Working Paper, every federation Tier D specification, every JSON mirror at predictable paths). Any AI client can query it; queries do not flow back to participant data. Acts as a permissioned alternative to general-web training corpora for corridor-relevant questions.', stage: 'feasible 2026-2027 (the corpus already exists in the federation library)' },
  { tool: 'Connector Health Network', description: 'A federation-cohort-maintained reliability-tracker for major connectors. When the Slack MCP degrades, the cohort knows within hours; when a Google Drive permission scope changes, the cohort updates its audit notes collectively. Privacy mechanism: anonymized aggregate report; no individual\'s connector state exposed.', stage: 'feasible 2026' },
  { tool: 'Permission-Diff Between AIs', description: 'A tool that, for one participant, compares "what Claude knows about me" to "what OpenAI knows about me" to "what Gemini knows about me" — surfacing the asymmetric memory accumulation across vendors. Privacy mechanism: runs locally; no aggregation; the participant alone sees their own diff.', stage: 'feasible 2026-2027 (requires AI vendors to expose memory APIs, which only Anthropic does as of 2026-05)' },
  { tool: 'Federation Sovereign Vault', description: 'A federation-hosted Personal Data Vault per participant — not a platform-bound memory but a participant-owned key-coded data store. AI clients can query the vault under the participant\'s permission; vendor memories are scoped to single-session retention only. Privacy mechanism: vault is sovereign; vendor access is per-session.', stage: 'speculative · 2028+ (depends on inter-AI permission protocol formalization)' },
  { tool: 'Common-Question Bus', description: 'A federation-shared list of "questions cohort members would like answered." When one participant\'s AI cycle finds an answer (in their own data), they can OPT-IN to share the anonymized finding — turning the corridor into a slow distributed research engine. Privacy mechanism: opt-in per question, opt-in per finding, opt-out per cycle.', stage: 'speculative · 2028+' },
];

export const PERMISSIONING_RECOMMENDATIONS = [
  'Treat AI memory as data, not magic. Every AI vendor accumulates a memory of the user; this memory is data; data has rights. Until vendors expose programmatic delete-and-forget, the federation\'s working position is that no sensitive corridor data should be exposed to any AI client without explicit per-instance review.',
  'Per-connector minimum scope. Grant the AI client only the read scopes required for the use case. Refuse "read everything" when "read recent N" or "read by query" suffices.',
  'Audit logs are non-negotiable. If a connector does not expose a per-session audit log, the federation\'s working position is that it should not be granted access to federation surfaces.',
  'Cross-AI consistency: use the same permission language across Claude, OpenAI, Gemini, and any future client. Diverging permission languages create drift that the user cannot maintain.',
  'Publish the "what I have connected" map. Each cohort participant maintains a public list at /p2p-ai/participants/{slug}/connections.json so others can verify what data flows where. Transparency is the federation\'s default.',
  'Sunset clauses. Every connector grant expires at 12 months; renewal requires an explicit re-grant. Default-permanent permissions are an anti-pattern.',
  'Local-first when feasible. Where the use case can be served by a local-only client (Claude Code on the user\'s machine, for instance), prefer it over cloud-only. Local reduces the "vendor accumulates memory" surface.',
];

export const REFERENCES = [
  { id: 'pointcast-eth-legacy', cite: 'University of El Segundo. (2026). *ETH Legacy · Token Deployment Retrospective*. https://pointcast.xyz/eth-legacy. (Mike\'s ~43 ERC-20 deployments 2018-2021; the corridor\'s primary firsthand record of the early-Ethereum thread.)' },
  { id: 'pointcast-connectors', cite: 'University of El Segundo. (2026). *PointCast Connectors*. https://pointcast.xyz/pointcast-connectors. (Live inventory of MCP surfaces the corridor maintains.)' },
  { id: 'pointcast-charter', cite: 'University of El Segundo. (2026). *Federation Council Charter*. UES-Federation-05. https://pointcast.xyz/federation-council.' },
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius.' },
  { id: 'mist-browser', cite: 'Ethereum Foundation. (2015-2019). *Mist Browser*. github.com/ethereum/mist. (Deprecated March 2019; archived as historical reference.)' },
  { id: 'ethereum-deprecation', cite: 'Ethereum Foundation. (2019). *Mist Deprecation Announcement and Sunset Path*. blog.ethereum.org. The honest-deprecation precedent the AI-client emergence should follow.' },
  { id: 'mcp', cite: 'Anthropic. (2024-Continuing). *Model Context Protocol Specification*. modelcontextprotocol.io.' },
  { id: 'a2a', cite: 'Google. (2025). *Agent-to-Agent Protocol*. a2a.dev.' },
  { id: 'solid', cite: 'Berners-Lee, T., et al. (2018-Continuing). *Solid · Personal Online Datastore Specification*. solidproject.org.' },
  { id: 'midata', cite: 'MIDATA Cooperative. (Continuing). *Personal Health Data Cooperative*. midata.coop. (Swiss federation of personal-data cooperatives; closest existing precedent for the Federation Sovereign Vault concept.)' },
  { id: 'ostrom', cite: 'Ostrom, E. (1990). *Governing the Commons: The Evolution of Institutions for Collective Action*. Cambridge University Press. The canonical theoretical reference for collective-data-governance design.' },
  { id: 'sweeney', cite: 'Sweeney, L. (2002). *k-Anonymity: A Model for Protecting Privacy*. International Journal on Uncertainty, Fuzziness and Knowledge-based Systems. Foundational privacy-preservation reference for the cohort-aggregate tools above.' },
  { id: 'differential-privacy', cite: 'Dwork, C., et al. (2006). *Calibrating Noise to Sensitivity in Private Data Analysis*. Theory of Cryptography Conference.' },
];

export const PAPER_NOTES = {
  uesNote: 'This is a study framework, not a study. The work is the cohort cycles that follow; this paper describes how those cycles are structured, what they produce, and how the federation governs them. The first cycle is queued for 2026 Q3 if 5 corridor instances ratify the Federation Council Charter (UES-Federation-05) by then.',
  invitation: 'If you are a corridor cohort member interested in joining the first six-week cycle (2026 Q3), an external researcher who wants to use the field-note corpus, an AI vendor staff member willing to engage on cross-AI permissioning, or a Mist-era Ethereum Foundation alum who wants to share methodological lessons, email mh@pointcast.xyz with subject line "P2P AI · {role}". The cohort is capped at 40 across the five instances; the field-note corpus is open-licensed in perpetuity.',
  closingNote: 'Signed by request: Mike. The framework should be revised by the cohort, not by the convener.',
};
