/**
 * Civic AI Common-Knowledge Cache — UES-Federation-06.
 *
 * Specified as a "feasible 2026-2027" tool in /p2p-ai (UES-WP-2026-15).
 * This page is the technical surface: the federation-maintained vector
 * index of public corridor surfaces (every UES Working Paper, every
 * federation Tier D specification, every JSON mirror at predictable
 * paths). Any AI client can query the cache; queries do not flow back
 * to participant data. Acts as a permissioned alternative to general-
 * web training corpora for corridor-relevant questions.
 *
 * The corpus already exists. This page makes it queryable.
 */

export const CACHE_META = {
  title: 'Common-Knowledge Cache',
  subtitle: 'A federation-maintained vector index of public corridor surfaces · queryable by any AI client · permissioned by federation, not by vendor',
  thesis: 'Every public corridor surface — Working Papers, federation specifications, instance scaffolds, Tier D programs, JSON mirrors — already exists at predictable paths. The work is not gathering them; the work is making the corpus queryable by any AI client without requiring the AI client to scrape the web. The Common-Knowledge Cache (CKK) is the federation\'s answer: a single vector-indexed corpus, maintained as federation infrastructure, exposed via one API and one MCP server, with a permission model where queries do not flow back to participant data and the corpus itself is CC0. Any AI client — Claude, OpenAI, Gemini, future — can connect and ask corridor-relevant questions. The federation owns the corpus; the vendors do not.',
  paperNumber: 'UES-Federation-06',
  date: '2026-05-08',
  parentPaper: 'UES-WP-2026-15 Peer-to-Peer AI',
  status: 'specification · feasible 2026-2027 · construction queued',
};

export const ARCHITECTURE = {
  corpus: 'Every public surface at pointcast.xyz with a JSON mirror at /{surface}.json. Currently ~85 distinct surfaces; growing at ~3-5 per active week.',
  indexing: 'Local vector embedding (no third-party embedding service). Embedding model: open-source (e.g., GTE, BGE, or Nomic Embed); the federation does NOT use OpenAI, Anthropic, or Google embedding APIs because they create vendor dependence.',
  storage: 'A single SQLite + sqlite-vec database file, ~100MB at current corpus scale, hosted at /api/ckk/ as a federation-shared resource. Versioned in git so any cohort participant can clone the entire cache locally.',
  refreshCadence: 'On every federation library publication (every new UES Working Paper, every Tier D specification revision, every instance scaffold update). Refresh time: ~3 minutes for a full reindex at current scale.',
  apiExposure: 'Two interfaces: (1) HTTPS REST API at https://pointcast.xyz/api/ckk/query?q={question} returning top-K passages with source attribution; (2) MCP server at https://pointcast.xyz/api/mcp-ckk/ that any MCP-compatible AI client can add as a connector.',
  permissionModel: 'CC0 outbound — every passage in the corpus is freely usable by querying clients. NO inbound — queries are logged for cache-tuning purposes (e.g., "what queries fail, what passages are missing") but query logs are aggregated to federation-only daily summaries with no per-querier identity retention beyond 24 hours.',
};

export const WHATS_IN = [
  { category: 'UES Working Papers', count: '15 papers shipped', examples: 'UES-WP-2026-01 Marine Layer · UES-WP-2026-11 Forkable Radius · UES-WP-2026-13 LA28 Forcing Function · UES-WP-2026-14 Bath House · UES-WP-2026-15 Peer-to-Peer AI', notes: 'Each paper exposed as full text + JSON mirror. The vector index treats paragraphs as queryable units, not whole-paper-as-one-chunk.' },
  { category: 'Federation surfaces', count: '6 federation-class documents', examples: 'UES-Federation-01 Strand Corridor · UES-Federation-02 Giant Works · UES-Federation-03 Corridor Strengths · UES-Federation-04 Giant Works Art · UES-Federation-05 Federation Council Charter · UES-Federation-06 (this page)', notes: 'Federation-class is governance + cross-instance infrastructure, distinct from Working Papers.' },
  { category: 'Instance scaffolds', count: '5 forks', examples: '/manhattan-beach (UES-Fork-MB-01) · /hermosa-beach (HB-02) · /redondo-beach (RB-03) · /torrance (TR-04) · candidate edge instances', notes: 'Per-instance terrain features, six-shape status, 90-day plans all queryable by city.' },
  { category: 'Tier D specifications', count: '16 specified · 1 deep-dived', examples: 'Bath House (deep-dive at /bath-house) · Concert Hall · Geothermal Pool · 13 others', notes: 'Specifications include cost bands, site candidates, fundraising paths, governance, horizons, and parallel-to-cases analysis.' },
  { category: 'Track surfaces', count: '11+ tracks', examples: 'Marine Layer · Geology · Ocean Wing · Fire · Nature Practice · Common Forms · Stones · Stone Game · 4-Lab Series · Walkman · Trapper Keeper', notes: 'UES tracks are practice-coded surfaces, complementary to Working Papers. Each has its own JSON mirror.' },
  { category: 'Operational surfaces', count: '~15+ live operational endpoints', examples: '/agents.json · /operating-mode.json · /coordinate · /pointcast-connectors · /commons · /first-sit · /civic-layer', notes: 'Surfaces that change frequently. Refresh cadence is per-page-build, not per-paper-publication.' },
  { category: 'Editorial corpus (selective)', count: 'curated subset', examples: 'Wave 2 archive entries · pilot business board · ramen history · Hoydich Brewing STRAND recipe · etc.', notes: 'Not every editorial post is in the cache — only those tagged for federation-library inclusion. The federation library is curated, not exhaustive.' },
];

export const QUERY_PATTERNS = [
  { pattern: 'Direct retrieval', example: '"What is the Bath House?" → returns the /bath-house thesis paragraph + program block + parallel-to-cases analysis with source links.', useCase: 'AI clients answering corridor-relevant questions for cohort members or external readers.' },
  { pattern: 'Cross-surface synthesis', example: '"What Tier D works could Hermosa Beach host?" → returns matched passages from /giant-works (Bath House Hermosa site), /giant-works-art (Bell Garden Hermosa Greenbelt), /corridor-strengths (HB best-suited works section), with cross-references.', useCase: 'Federation council prep work; per-instance Tier D queue prioritization.' },
  { pattern: 'Decision-rule retrieval', example: '"How does the federation council decide on Tier D approval?" → returns DECISION_PROTOCOL band 2 (3-of-N threshold) from /federation-council with link.', useCase: 'Procedural questions during council meetings; new-delegate orientation.' },
  { pattern: 'Precedent matching', example: '"What\'s the Mist precedent for the AI-client emergence?" → returns the MIST_PRECEDENT four-section block from /p2p-ai with links to /eth-legacy and the four explicit AI-client lessons.', useCase: 'Working-paper drafting; cohort discussion prep.' },
  { pattern: 'Inverse retrieval', example: '"What\'s NOT funded by LA28?" → returns the six neutral works from /la28-ready with their "ship-on-federation-cadence" rationale.', useCase: 'Funding-strategy clarity; partnership-conversation prep.' },
  { pattern: 'Temporal retrieval', example: '"What\'s in flight this week?" → returns /operating-mode.json plus the most-recently-published Working Papers within a date window.', useCase: 'Cohort weekly digest; federation-council quarterly check-in prep.' },
];

export const PERMISSION_DESIGN = {
  outbound: 'EVERY passage in the corpus is CC0-licensed and freely returnable to any querying client. The federation does not gatekeep what a passage says once it is published. AI clients can quote, summarize, paraphrase, or reformat freely with source attribution.',
  inbound: 'Queries arrive at /api/ckk/query?q={question} or via the MCP connector. Per-query identity (IP, user agent, session token) is retained for 24 hours for abuse-prevention only. After 24 hours, query logs are aggregated to daily summaries (e.g., "queries about Bath House: 47" with no per-querier breakdown).',
  noTraining: 'The federation does NOT train any model on query logs, on participant data, or on private corridor surfaces. The federation does not allow vendors to train on the cache itself; the CC0 license is for inference and human reading, not for training-corpus inclusion. The federation has no enforcement mechanism beyond the license terms; this is a stated principle, not a technical guarantee.',
  vendorParity: 'No AI vendor receives preferential treatment. Claude, OpenAI, Gemini, Mistral, Llama-based open clients, future vendors — all hit the same rate limits (60 queries per minute per IP) and receive the same passages. The cache is a level field.',
  participantDataExclusion: 'NO participant data is in the cache. Marine Layer cohort field notes (private), individual Commons ledger receipts (instance-private), per-cohort schedules (instance-private) — none of these reach the cache. Only the federation library\'s public-by-default surfaces.',
  appealProcess: 'If a passage in the cache is factually incorrect or causes harm, any cohort member or external reader may file an appeal at /api/ckk/appeal. The federation council reviews appeals at quarterly meetings; pending appeals are flagged in the cache itself ("disputed: see /appeals/{id}") so querying AI clients can surface the dispute.',
};

export const ANTI_PATTERNS = [
  { antiPattern: 'Per-vendor preferential indexing', why: 'Defeats the entire purpose. The cache exists because the federation owns the corpus, not the vendors. Any vendor-specific optimization (e.g., embedding tuned for OpenAI\'s retrieval) creates lock-in.' },
  { antiPattern: 'Authentication-gated reads', why: 'CC0 means CC0. Adding API keys to read public corridor surfaces would defeat the cache\'s purpose; if a passage is in the cache, anyone can retrieve it without identifying themselves.' },
  { antiPattern: 'Caching private data', why: 'Cohort member field notes, individual Commons receipts, per-instance scheduling: all instance-sovereign. The cache is for federation-library surfaces only. Per-participant data has its own permission model (the Federation Sovereign Vault concept in /p2p-ai).' },
  { antiPattern: 'Vendor-hosted index', why: 'If the cache lives on Pinecone, Weaviate-cloud, or any third-party vector service, the federation gives up custody. The cache is self-hosted in SQLite + sqlite-vec specifically to avoid vendor dependence.' },
  { antiPattern: 'Training-corpus inclusion', why: 'Some vendors might want to add the cache to their training corpus to "improve civic-AI quality." The federation\'s position is that this is incompatible with CC0\'s purpose here: the corpus is for inference and human use, not for being baked into proprietary models.' },
  { antiPattern: 'Aggregate analytics resale', why: 'Even anonymized query patterns ("X% of queries are about Bath House") could be commercialized by a third party. The federation publishes aggregate query statistics monthly to the federation library so the data stays in-corridor.' },
];

export const ROADMAP = [
  { quarter: '2026 Q3', milestone: 'Specification ratified by federation council (post-charter ratification). Embedding model selected (open-source, federation-tested). Refresh-cadence script written.' },
  { quarter: '2026 Q4', milestone: 'First reindex of all ~85 surfaces. SQLite + sqlite-vec deployed at /api/ckk/. REST endpoint live. Initial federation-cohort dogfooding.' },
  { quarter: '2027 Q1', milestone: 'MCP server live at /api/mcp-ckk/. First non-Anthropic AI clients (OpenAI, Gemini) confirmed connecting via MCP. Cross-AI query parity confirmed.' },
  { quarter: '2027 Q2', milestone: 'Appeals process live. First aggregate-statistics monthly report published. Cache-tuning loop established (which queries fail, which passages are missing, what the corpus needs next).' },
  { quarter: '2027 Q3', milestone: 'Cache-as-federation-infrastructure formalized in council charter amendment. Future Federation Sovereign Vault project queued (the per-participant complement to the cache).' },
  { quarter: '2027 Q4+', milestone: 'Cache continues as standing federation infrastructure. Annual review at autumnal-equinox council meeting.' },
];

export const REFERENCES = [
  { id: 'pointcast-p2p-ai', cite: 'University of El Segundo. (2026). *Peer-to-Peer AI*. UES-WP-2026-15. https://pointcast.xyz/p2p-ai. (Specifies the Common-Knowledge Cache as a feasible 2026-2027 tool.)' },
  { id: 'pointcast-charter', cite: 'University of El Segundo. (2026). *Federation Council Charter*. UES-Federation-05. https://pointcast.xyz/federation-council.' },
  { id: 'pointcast-connectors', cite: 'University of El Segundo. (2026). *PointCast Connectors*. https://pointcast.xyz/pointcast-connectors.' },
  { id: 'mcp', cite: 'Anthropic. (2024-Continuing). *Model Context Protocol Specification*. modelcontextprotocol.io.' },
  { id: 'sqlite-vec', cite: 'Garcia, A. (Continuing). *sqlite-vec · vector search for SQLite*. github.com/asg017/sqlite-vec.' },
  { id: 'gte', cite: 'Alibaba DAMO. (2023). *General Text Embeddings (GTE)*. Alibaba Cloud open-source.' },
  { id: 'bge', cite: 'BAAI. (Continuing). *BGE Embedding Models*. github.com/FlagOpen/FlagEmbedding.' },
  { id: 'nomic', cite: 'Nomic AI. (2024). *Nomic Embed · Open-source text embeddings*. nomic.ai.' },
  { id: 'cc0', cite: 'Creative Commons. (Continuing). *CC0 1.0 Universal Public Domain Dedication*. creativecommons.org/publicdomain/zero/1.0/.' },
];

export const CACHE_NOTES = {
  uesNote: 'The Common-Knowledge Cache is the most actionable item in /p2p-ai\'s eight-tool catalog because the corpus already exists. The work is not creating new content; the work is technical scaffolding around content the corridor has already shipped. Buildable in one focused sprint after the federation council ratifies.',
  invitation: 'If you are a vector-search engineer who wants to help build the embedding pipeline, an MCP-server developer who can implement the /api/mcp-ckk/ endpoint, or a federation cohort member willing to dogfood the cache during 2026 Q4 alpha, email mh@pointcast.xyz with subject line "CKK · {role}". The cache is a CC0 federation resource; contributors are credited but no equity, no tokens, no proprietary stake.',
};
