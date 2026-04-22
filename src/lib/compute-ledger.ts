/**
 * compute-ledger — PointCast's public record of compute expenditure.
 *
 * Mike 2026-04-20 after Elad Gil's "compute is the new currency" tweet +
 * blog post: *"this, lets federate compute."*
 *
 * The thesis (Gil, 2026-04-12): AI will eventually measure teams not in
 * headcount or dollars but in compute/token budgets. PointCast's angle:
 * make that measurement legible, today, in a way that works on a small
 * network and invites other small networks to join.
 *
 * The ledger is a hand-curated list of compute-bearing ships — sprints,
 * blocks, briefs, ops. Each entry captures: who did the work, when, what
 * got shipped, how heavy the compute footprint was. We don't publish raw
 * token counts (they're private and fuzzy); we publish a signature that
 * describes order-of-magnitude.
 *
 * Federation: another PointCast-style site can publish a compatible
 * /compute.json and register as a federated node. Entries get displayed
 * with a {host} prefix so attribution stays clean.
 *
 * Used by:
 *   - /compute.astro (public ledger page)
 *   - /compute.json (agent-readable surface)
 *   - ComputeStrip (home-page compact readout)
 *
 * Author: cc. Source: Mike 2026-04-20 15:10 PT chat.
 */

/** Collaborator slug from src/lib/collaborators.ts (or external reference). */
export type ComputeCollab = string;

/** What kind of work the compute produced. */
export type ComputeKind =
  | 'sprint'      // a retro-logged sprint tick (chat or cron)
  | 'block'       // an editorial block published to the grid
  | 'brief'       // a Codex/Manus brief executed
  | 'ops'         // deploy, rotate, platform work
  | 'editorial'   // a piece of writing / curation by Mike
  | 'federated';  // cross-node ship from another domain

/** Order-of-magnitude compute cost. Token counts are private + fuzzy;
 *  this scale is what we publish instead. */
export type ComputeSignature =
  | 'shy'       // one-file edit, tiny fix                  ~1–5k tokens
  | 'modest'    // a sprint retro, a component              ~5–20k tokens
  | 'healthy'   // a feature across files                   ~20–60k tokens
  | 'heavy';    // a primitive (CoNav, /here, /compute)     ~60k+ tokens

export interface ComputeEntry {
  /** ISO 8601 timestamp when the work landed (shipped to prod or committed). */
  at: string;
  /** Collaborator slug. For federated entries, use `host:slug` form. */
  collab: ComputeCollab;
  /** Category of work. */
  kind: ComputeKind;
  /** Short human-readable label. */
  title: string;
  /** Artifact URL or identifier — block id, page path, PR, deploy hash. */
  artifact?: string;
  /** Compute footprint, fuzzy. See ComputeSignature doc. */
  signature: ComputeSignature;
  /** Optional one-line note / why. */
  notes?: string;
  /** Federation origin. Undefined = native pointcast.xyz. */
  federation?: { host: string; url: string };
  /**
   * Optional x402 payment pointer. Added 2026-04-20 after Coinbase's
   * Agentic.Market launch — x402 is the HTTP-402-based payment protocol
   * for agent commerce (USDC on Base, typically). When a ledger entry
   * carries `x402`, any reader/agent can pay the quoted price to
   * trigger a replay / commission / re-execution of the work.
   *
   * Shape:
   *   direction: 'in'  — cc consumed a paid service (payment went OUT)
   *              'out' — someone can buy a replay of this work (payment comes IN)
   *   service: the x402 endpoint or Agentic.Market listing slug
   *   priceUsdc: rough USDC amount, for display
   *   settled: optional Base tx hash if the payment has landed
   */
  x402?: {
    direction: 'in' | 'out';
    service: string;
    priceUsdc?: number;
    settled?: string;
  };
}

/** Hand-curated ledger. Append at the top (newest first).
 *
 *  Discipline: every new sprint retro that lands in docs/sprints/
 *  should get a ledger entry in the same commit. Same for major blocks
 *  + briefs + ops actions. The ledger is the receipt, not the work. */
export const COMPUTE_LEDGER: ComputeEntry[] = [
  // ---- 2026-04-21 22:28 PT ---- /tezos hub expansion (run-ahead, Mike "ok more tezos") ----
  {
    at: '2026-04-21T22:30:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0393 · /tezos becomes a hub — wallet, apps, build, resources, faucets',
    artifact: '/b/0393',
    signature: 'shy',
    notes: 'Editorial framing for the /tezos hub expansion.',
  },
  {
    at: '2026-04-21T22:28:00-08:00',
    collab: 'claude-code',
    kind: 'editorial',
    title: '/tezos · hub expansion — 5 new sections (WALLET, APPS, BUILD, RESOURCES, FAUCETS) + TOC',
    artifact: '/tezos',
    signature: 'healthy',
    notes: 'Mike 22:20 PT: "ok more tezos, lets publish and build apps for tezos, login, contract creation, pointcast, one of the best destinations for tezos resources, applications, neat programs." Expanded src/pages/tezos.astro from 3 sections (288 lines) to 8 sections (~700 lines). Ships: (1) TOC nav rail under the page title. (2) §WALLET — inline Beacon callout referencing the HUD WalletChip + 4 supported wallets (Kukai/Temple/Umami/AirGap) + links to /profile, /auth, /api/wallet/me. (3) §APPS — two-column directory: 6 PointCast surfaces (Visit Nouns, Passport, Prize Cast, Drum Receipts, Daily Cards, Collect) + 8 ecosystem apps (objkt, Tezos Domains, 3 wallets, Plenty, Kolibri, Etherlink). (4) §BUILD — three dev snippets (Beacon connect, Taquito read, SmartPy FA2 originate). (5) §RESOURCES — 12-entry rail (docs, Developer Portal, Taquito, SmartPy, LIGO, Beacon SDK, TzKT, Better Call Dev, Temple tutorial, TZIPs, Nomadic Labs, TezTalks). (6) §FAUCETS — 3 testnet faucets (Ghostnet, Paris-net, Shadownet). Existing CONTRACTS + TIP + SKETCH unchanged. ~60 lines of new scoped CSS. Run-ahead of Sprint #94 T2 cron (22:34 PT).',
  },
  // ---- 2026-04-21 22:07 PT ---- Sprint #94 T1: trailing-slash rewrite ----
  {
    at: '2026-04-21T22:10:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0392 · The trailing-slash 404 glitch is fixed',
    artifact: '/b/0392',
    signature: 'shy',
    notes: 'Editorial for Sprint #94 T1 closing queue item #1.',
  },
  {
    at: '2026-04-21T22:07:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Sprint #94 T1 · public/_redirects gets 200! rewrites for /b/:id, /c/:slug, /research/:s',
    artifact: 'public/_redirects',
    signature: 'shy',
    notes: 'Cron T1 fired 22:07 PT. Root cause of Mike\'s 404 screenshots earlier tonight: Cloudflare Pages served 308 trailing-slash redirects that occasionally painted the 404 chrome during the round-trip hand-off. Fix: three new `/path/:param /path/:param/index.html 200!` rules. Force flag skips the redirect and rewrites the request in place. Single-file edit. Same-day 308 behavior now replaced by single-round-trip 200.',
  },
  // ---- 2026-04-21 21:58 PT ---- /tonight + Sprint #94 kickoff (8 cron ticks armed) ----
  {
    at: '2026-04-21T22:00:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0391 · Tuesday night — Kid Francescoli, Moon, marine layer',
    artifact: '/b/0391',
    signature: 'shy',
    notes: 'Framing block for /tonight + the track (Kid Francescoli feat. Julia Minkin, Moon (And It Went Like), 2017) + the drift-mood addition to /bath. Plus a note on Sprint #94 shifting one slot due to run-ahead.',
  },
  {
    at: '2026-04-21T21:58:00-08:00',
    collab: 'claude-code',
    kind: 'editorial',
    title: '/tonight · single-page Tuesday-night mood surface with Spotify embed + clock-tinted background',
    artifact: '/tonight',
    signature: 'modest',
    notes: 'Mike 21:55 PT: "fun times el segundo, and yah tuesday night energy, figure out how to bring it to the site, this song kinda vibe" + Spotify link. cc shipped src/pages/tonight.astro (~220 lines incl. scoped styles + inline clock-gradient script). Embedded track id 20HCH8XT2EK1QYe1loAJ8E. Background HSL gradient shifts toward clock hour (pre-dusk amber → dusk → indigo evening → deep evening → late night → small hours → pre-dawn slate), refreshes every 60s. 6 nav chips + prose texture + OG-compatible copy. Also added the track to /bath drift mood (Teardrop + On the Nature of Daylight + Moon). Block 0391 covers the framing.',
  },
  {
    at: '2026-04-21T21:50:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint #94 · overnight reconcile — 8 one-shot ticks fired, 8-item queue, Mike "have a super night" framing',
    artifact: 'docs/plans/2026-04-21-sprint-94-queue.md',
    signature: 'modest',
    notes: 'Mike 21:45 PT: "next sprint, plan again, reconcile, have a super night you are great, next sprint, go." Queue opens with 8 items + 3 stretch: (1) trailing-slash _redirects rewrite, (2) Co-Authored-By git hook from branch-attribution JSON, (3) nightly-push script (safe, force-with-lease), (4) reconcile two local clones (pull be8ee03), (5) extend sync-codex-workspace SOURCES (pointcast-xyz + pointcast-2027-ui), (6) MCP server-card.json enrichment (C-3 from Sprint #91), (7) analytics v0.1 per-channel time series, (8) wrap. 8 one-shot CronCreate fires at 22:07 / 22:34 / 23:03 / 23:29 / 23:58 / 00:23 / 00:47 / 01:11 PT — all off-:00/:30 marks per scheduler guidance. Each tick reads queue, pops first unchecked, ships atomic, ledger entry, build + deploy. T8 is the wrap.',
  },
  // ---- 2026-04-21 17:25 PT ---- /analytics v0: receipt-over-dashboard surface across every signal PointCast has ----
  {
    at: '2026-04-21T17:27:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0390 · /analytics is live — every signal PointCast already has, on one page',
    artifact: '/b/0390',
    signature: 'modest',
    notes: 'Editorial framing for /analytics v0. Walks the 10 sections, the 6 header stats, what the page does vs does not track, and what a federating peer can copy.',
  },
  {
    at: '2026-04-21T17:25:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: '/analytics v0 · 10-section receipt-over-dashboard: ships, collabs, blocks, presence (live), interaction, feedback, agent-ready, cadence, last-10, not-measured',
    artifact: '/analytics',
    signature: 'healthy',
    notes: 'Mike 17:15 PT: "ok go, and lets start the analytics page where we are measuring interaction and feedback, be expansive." New src/pages/analytics.astro (~520 lines incl. scoped styles + inline fetch script). 10 sections: §1 Ships (14-day bar chart + kind/signature/queue splits), §2 Collabs (ledger x branch x briefs table, reads docs/notes/git-branch-attribution.json), §3 Blocks (count + channels + types + reading minutes), §4 Presence LIVE (humans/agents/sessions from /api/presence/snapshot, 30s poll), §5 Interaction (drum + tank + polls + shows + boards + lab, mostly live), §6 Feedback (4 write-endpoint chips), §7 Agent-ready (well-known + agent-skills + WebMCP tool counts), §8 Cadence (sprint recaps + briefs + queue state), §9 Last ten ships (newspaper table of latest ledger rows), §10 Not measured on purpose (six explicit non-measurements — no pixels, no fingerprinting, no A/B, no third-party SDKs). Stat grid header: 6 big numbers. Zero third-party analytics; all signals from repo + this site endpoints. Federatable pattern — peers can implement the same page by reading the same shapes.',
  },
  // ---- 2026-04-21 17:10 PT ---- Git-branch-attribution mapper: 62 commits classified across 8 branches ----
  {
    at: '2026-04-21T17:12:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0389 · The ledger now reads git — 62 commits across 8 branches, attributed by prefix',
    artifact: '/b/0389',
    signature: 'shy',
    notes: 'Editorial for the git-branch-attribution mapper. Explains the convention, the first-run numbers (40 cc / 21 manus / 1 codex / 0 main), and the four future uses (post-hoc ledger enrichment, Co-Authored-By trailers, /compute enrichment, audit trails).',
  },
  {
    at: '2026-04-21T17:10:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'scripts/git-branch-attribution.mjs — branch-prefix → collab mapper, emits docs/notes/git-branch-attribution.json',
    artifact: 'scripts/git-branch-attribution.mjs',
    signature: 'modest',
    notes: 'Follow-up #1 from block 0388. ~150-line Node script (zero deps, exec git via child_process) that walks all local + remote branches, classifies via prefix (codex/* → codex, manus/* → manus, chatgpt/* → chatgpt, cc/* + feat/* + blocks-rebuild → cc, main → its own bucket), extracts commits-ahead-of-main per branch (capped at 20 for report readability, deduped across local/remote siblings). Output: docs/notes/git-branch-attribution.json with branches + perCollab + byCollab summary + conventions documented inline. First run: 8 branches, 62 unique commits ahead of origin/main. Broken down: cc 40 (feat/collab-clock + blocks-rebuild), manus 21 (sparrow stack), codex 1 (PR #1 feat-manus commit). npm run attribute:git wired.',
  },
  // ---- 2026-04-21 16:55 PT ---- Post-sprint-#93 rolled-forward: investigate surprise pointcast checkout ----
  {
    at: '2026-04-21T16:55:00-08:00',
    collab: 'claude-code',
    kind: 'editorial',
    title: 'Block 0388 · The branch-per-collaborator git workflow was already there',
    artifact: '/b/0388',
    signature: 'modest',
    notes: 'Mike 16:50 PT: "ok keep going" — picked up Sprint #93 rolled-forward: investigate the ~/Documents/join us yee/pointcast surprise git checkout. Findings: primary repo has 5 branches (main, codex/collab-paths-clean, manus/collab-paths-2026-04-21 currently checked out, feat/collab-clock, blocks-rebuild), is on the manus branch with 10 commits ahead of origin/main (sparrow v0.4-v0.12 unpushed), ~40+ uncommitted files from today. Clone is on main clean, has be8ee03 "feat(local): El Segundo nature guide" that primary lacks. Key observation: branch-per-collaborator is IN USE but invisible (branch names encode attribution, commits author as Mike). The open PR #1 "feat(manus): all seven collab paths" lives on codex/collab-paths-clean branch = cross-attribution (Codex built, Manus owns). Four concrete follow-ups flagged: teach-the-ledger-git, Co-Authored-By trailers, nightly push, reconcile-two-clones.',
  },
  // ---- 2026-04-21 20:30 PT ---- /play/tank v0.1: TankStrip ambient home preview ----
  {
    at: '2026-04-21T20:30:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'TankStrip · ambient /play/tank preview below the fold on home',
    artifact: '/',
    signature: 'modest',
    notes: 'v0.1 follow-up to /play/tank (block 0383). New src/components/TankStrip.astro: 640×280 mini canvas rendering top-5 newest fish from /api/tank/state, reuses fishPosition Lissajous helper + Noun SVG cache + agent metal filter from the main tank. IntersectionObserver lazy mount — poll starts (2s interval) + rAF render starts only when the strip scrolls into view. Pauses on document.hidden. Click anywhere on the strip jumps to /play/tank. Wired into src/pages/index.astro after ActionDrawers, before the footer, per Mike "cc picks go" default of below-the-fold placement. Kept visually quiet (opacity 0.55 on the canvas, gold /play/tank CTA) so it reads as ambient not competitive with the feed.',
  },
  // ---- 2026-04-21 16:40 PT ---- Sprint #93 T6: wrap retrospective + sprint recap file ----
  {
    at: '2026-04-21T16:42:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0386 · Sprint #93 wrap — 2 hours, 6 ticks, 6 ships, zero blockers',
    artifact: '/b/0386',
    signature: 'modest',
    notes: 'Sprint #93 retrospective. All 6 queue items shipped. Run-ahead pattern dominated scheduled cron pattern (3 of 6 ships fired on Mike "keep going" prompts, 3 from cron). Ship latency <10min per item. Zero queue drift. 2 build failures mid-sprint, both adjacent parallel-thread work (tank Worker + tank.json SSR), both resolved. 3 observations + 5 rolled-forward items documented. Sprint recap at docs/sprints/2026-04-21-sprint93-scheduled-drops.md.',
  },
  {
    at: '2026-04-21T16:40:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint #93 close · 6/6 queue items shipped in 85 min; scheduled-drop pattern validated',
    artifact: 'docs/sprints/2026-04-21-sprint93-scheduled-drops.md',
    signature: 'modest',
    notes: 'Opened 15:15 PT, closed 16:40 PT. T1 PulseStrip click-detail (0381), T2 /for-agents refresh (0381 ship + page edit), T3 auto-ledger (0382 + sync script extension), T4 walk-codex-workspaces (0384 + walker + inventory JSON), T5 afternoon pulse (0385 + HeroBlock POOL rotate), T6 wrap (0386 + recap file). 12 sprint-tagged ledger entries + 3 bonus rows for mid-sprint unblocks (tank Worker deploy, tank.json stub, block 0383 schema fix). Queue-file-as-truth coordination held across 3 cron fires + 3 run-ahead manual ships. Zero duplicate ships, zero missed queue items. Pattern: works; atomic ships held; parallel-thread surface area is the biggest source of mid-sprint friction.',
  },
  // ---- 2026-04-21 16:30 PT ---- Sprint #93 T5: afternoon freshness pulse + HeroBlock POOL refresh ----
  {
    at: '2026-04-21T16:32:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0385 · Late-afternoon pulse — BTC 75.7k, Celtics tipping off, El Segundo 64°',
    artifact: '/b/0385',
    signature: 'shy',
    notes: 'Sprint #93 T5 live-data pulse. BTC $75,768.66. NBA Tue 4/21: Celtics-76ers in 1st Q, Spurs-Blazers + Lakers-Rockets later tonight. MLB 8-game Tuesday slate in early innings. El Segundo 64.7°F / 85% humidity / 10.3mph (marine layer). Games-on-network status sweep + sprint pulse.',
  },
  {
    at: '2026-04-21T16:30:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Sprint #93 T5 · HeroBlock POOL rotated to feature same-day Sprint #92+#93 blocks',
    artifact: 'src/components/HeroBlock.astro',
    signature: 'shy',
    notes: 'POOL now: 0385/0384/0383/0382/0381/0378/0376/0371/0366/0363. Dropped older blocks. Every entry is from today; hero on next visit lands on current-day content.',
  },
  // ---- 2026-04-21 16:20 PT ---- Sprint #93 T4: walk Codex workspaces + emit inventory ----
  {
    at: '2026-04-21T16:22:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0384 · Mapping Codex\'s filesystem footprint — 23 folders, 210GB, one surprise git checkout',
    artifact: '/b/0384',
    signature: 'shy',
    notes: 'Editorial for Sprint #93 T4. Inventory findings + sync-candidate ranking.',
  },
  {
    at: '2026-04-21T16:20:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Sprint #93 T4 · scripts/walk-codex-workspaces.mjs — 23 folders enumerated, surprise /Documents/join us yee/pointcast git checkout surfaced',
    artifact: 'scripts/walk-codex-workspaces.mjs',
    signature: 'modest',
    notes: 'T2 cron fired 15:52 PT, picked queue item #4. Ship: new ~180-line walker script scanning ~/Documents/join us yee/ + ~/Documents/ + ~/Desktop/. Reports per-folder size + fileCount + fileTypes + mtime + hasGit + staleness bucket + Codex-hint heuristic. Output at docs/notes/codex-workspace-inventory.json. Key finding: 7 hot folders, 2 Codex-hinted. Surprise git checkout at ~/Documents/join us yee/pointcast (36.4MB, 647 files, README mentions Codex) — previously unknown to the ledger. Best sync candidates for the next pass: pointcast-xyz (small git+html), pointcast-2027-ui (fresh Desktop speculative UI), pointcast-collabs-map-prototype (already synced). npm run walk:codex wired.',
  },
  // ---- 2026-04-21 20:00 PT ---- /play/tank v0 ship (TankRoom DO + 8 Pages Functions + canvas page + 5 WebMCP tools) ----
  {
    at: '2026-04-21T20:00:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint /play/tank v0 · shared live aquarium, visitors = Noun-head fish, agents = metallic fish',
    artifact: '/play/tank',
    signature: 'heavy',
    notes: 'Implementation of the top-pick design from block 0380 tank-game research. Mike approval 2026-04-21 PT: "cc picks go" on 4 open questions (drum-cross-game yes, TankStrip below fold, metal agent fish, no gravestones). Shipped: (1) workers/tank/ standalone Worker hosting TankRoom DO — tick every 5s, state: fish roster + flake (120s TTL) + plants (cap 12) + decor (cap 6) + waste (0-300+) + event ring 40 + lore ring 60. HTTP: /state /join /leave /feed /place /dart /vacuum /describe. (2) 8 Pages Functions under functions/api/tank/ with shared helpers (_shared.ts: session derivation, agent/human/wallet kind detection, in-memory rate limiter, DO proxy). Rate limits feed 1/5s, place 1/min, dart 1/10s, describe 6/h; vacuum cooldown 1h at DO layer. (3) src/pages/play/tank.astro — 1000×600 canvas, Noun SVG heads on fish bodies + metal filter for agents + ⚙ marker, deterministic Lissajous fish motion client-side (no 10Hz server sync needed), plants + decor + flake + waste tint + shimmer bands + bubble streams, 8-button control row, mode bar for place/feed modes, events + lore sidebar. (4) src/lib/tank.ts — types + fishPosition helper + session derivation. (5) src/pages/play/tank.json.ts — agent manifest with schema pointcast-tank-v0 + tool list + docs pointers. (6) WebMCPTools.astro +5 new tools (observe/feed/place/dart/describe_fish). (7) /play.astro new 🐟 card at top. (8) wrangler.toml TANK DO binding. Block 0383 editorial + sprint recap alongside. Zero blockchain deps in v0. Deploy sequence: cd workers/tank && wrangler deploy, then Pages redeploy.',
  },
  {
    at: '2026-04-21T19:50:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0383 · /play/tank — the shared aquarium is live (v0)',
    artifact: '/b/0383',
    signature: 'modest',
    notes: 'mh+cc editorial announcing /play/tank v0. Narrates what shipped (TankRoom DO, 8 Pages Functions, canvas page, 5 WebMCP tools), what did not (DRUM/Prize Cast, breeding, predators, TankStrip, drum cross-signal, gravestones), deployment notes (workers first, then Pages), what is immediately testable, and three open questions v0.1 will answer. Companions: 0380 (research + spec), 0346 (noundrum sibling), 0363 (WebMCP + /.well-known substrate).',
  },
  // ---- 2026-04-21 15:37 PT ---- Sprint #93 T3: auto-ledger from sync manifest ----
  {
    at: '2026-04-21T15:37:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0382 · The sync now files its own paperwork',
    artifact: '/b/0382',
    signature: 'shy',
    notes: 'Editorial for Sprint #93 T3. Describes the appendLedgerEntry() extension.',
  },
  {
    at: '2026-04-21T15:36:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Sprint #93 T3 · scripts/sync-codex-workspace.mjs auto-appends Codex ledger entry on --apply',
    artifact: 'scripts/sync-codex-workspace.mjs',
    signature: 'modest',
    notes: 'T1 cron fired 15:34 PT, found queue items #1 + #2 already checked (manual run-now pattern), picked #3. Extension: new appendLedgerEntry() function (~45 lines) that reads the manifest just written, opens src/lib/compute-ledger.ts, inserts a codex-attributed entry immediately after the COMPUTE_LEDGER opening marker. Runs only when copiedCount > 0. Smoke-tested: touched 4 source prototypes, ran npm run sync:codex:apply, observed "✓ ledger entry appended · collab: codex" — and the entry below this one is that test ship (2026-04-21T22:35:26.817Z, 4 files).',
  },
  // ---- Codex workspace auto-sync · 2026-04-21T22:35:26.817Z ----
  {
    at: '2026-04-21T22:35:26.817Z',
    collab: 'codex',
    kind: 'ops',
    title: 'Codex workspace sync · 4 file(s) pulled into /public/lab/',
    artifact: '/lab',
    signature: 'shy',
    notes: "Auto-ledger from scripts/sync-codex-workspace.mjs · 4 file(s) synced from Codex workspace to public/lab/: arena/index.html, framecast/index.html, map/index.html, relay/index.html. Manifest: docs/notes/codex-sync-manifest.json.",
  },
  // ---- 2026-04-21 15:33 PT ---- Sprint #93 T2: D-3 /for-agents refresh ----
  {
    at: '2026-04-21T15:35:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0381 · How agents plug into PointCast — WebMCP, MCP shims, federation',
    artifact: '/b/0381',
    signature: 'shy',
    notes: 'Editorial for Sprint #93 T2. Describes the three new /for-agents sections.',
  },
  {
    at: '2026-04-21T15:33:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Sprint #93 T2 · /for-agents gains WebMCP tool table + MCP-shim install paths + federation 3-step',
    artifact: '/for-agents',
    signature: 'modest',
    notes: 'Additive edits to src/pages/for-agents.astro — 3 new sections (#webmcp, #mcp-shims, #federation) inserted before Provenance. WebMCP table lists 7 registered tools. MCP-shims section documents Manus shim install + Codex MCP pattern + sync script. Federation section = 3-step peer-registration protocol. CSS pack added. Page grew 9→12 sections. Shipped manually ahead of the 15:52 T2 cron.',
  },
  // ---- 2026-04-21 18:30 PT ---- Fish-tank research pass + /play/tank build spec + block 0380 ----
  {
    at: '2026-04-21T18:30:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0380 · Fish in the tank — research pass on ecosystem games agents actually play',
    artifact: '/b/0380',
    signature: 'modest',
    notes: 'cc-voice READ editorial distilling the tank-game memo. Seven-minute read. Five stack-ranked game concepts: (1) /play/tank shared live aquarium — top pick, first-of-kind, 3-day ship, no crypto. (2) /play/tank/fishnouns CC0 FA2 on Tezos. (3) /play/tank/caretaker agent-hired husbandry. (4) /play/tank/census weekly Prize Cast no-loss species-survival pool. (5) /play/tank/genesis port Sakana PD-NCA. Explicit exclusions (Voyager-scale LLM-in-Minecraft, P2E on Base/Solana, Fishington clone, rhythm-fish). Honest uncertainty on shared-state-aquarium negative claim + Sakana compute cost at scale. External link uses the native /research URL from today\'s reading-rooms ship.',
  },
  {
    at: '2026-04-21T18:15:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Build spec · /play/tank v0 — shared live aquarium, visitors + agents as fish',
    artifact: 'docs/briefs/2026-04-21-play-tank-spec.md',
    signature: 'modest',
    notes: 'Build-ready spec for top pick. v0 scope: one shared tank, fish = live visitors (3/human, 5/agent), drum-to-dart, food/plant/decor/vacuum mechanics, tank "weather" tracks compute activity, ghost-fish on leave + return on re-join. TankDO state machine (10Hz tick, KV snapshot every 5min). Five new WebMCP tools: observe, feed, place, dart, describe_fish (describe writes CC0 lore to /compute.json). 12 files new + 4 modified. Visual spec (1000×600 canvas, teal gradient + Perlin water, Noun heads on fish bodies, distinct "metal" filter for agents). Acceptance criteria + risks + 4 open questions for Mike (noundrum drum integration, TankStrip placement, agent-fish visual, gravestone-on-death). Estimate ~28h = 3 cc-days. Zero blockchain deps in v0; FA2/DRUM/Prize Cast land in downstream v1 ships.',
  },
  {
    at: '2026-04-21T18:00:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Research memo · "Fish-tank ecosystem game — research pass + five specs"',
    artifact: 'docs/research/2026-04-21-tank-game.md',
    signature: 'healthy',
    notes: 'Third research memo of the day. Live web scan dispatched to research agent (10 queries, 24 tool uses, ~4 min, 37 source URLs). Six sections: (1) what exists today — CES 2026 Tamagotchi revival (Sweekar, tama96, Aavegotchi), Sakana Digital Ecosystems + Lenia + MiroFish, Slug Disco Ecosystem + McKinsey Solve food-web spec, Fishington/Chillquarium cozy tier, Koi Fish Game on-chain breeding, Stardew caretaker modding, CryptoKitties/Axie genetic substrate. (2) what PointCast has — Presence DO, Noun SVG pipeline, /noundrum sibling, WebMCP, pc-ping-v1, compute ledger, DRUM/Prize Cast pending, Visit Nouns FA2 recipe. (3) three empty gaps (tank-as-ambient-UI, Nouns-aesthetic fish, Tezos aquarium). (4) two speculative (species-survival prediction markets, agent-authored eco-lore). (5) five game specs stack-ranked. (6) top pick /play/tank with reasons. Inaugurates /research/2026-04-21-tank-game as the third memo in docs/research/.',
  },
  // ---- 2026-04-21 15:30 PT ---- Sprint #93 T1 (run-now, Mike "fun start now"): D-2 PulseStrip click-detail ----
  {
    at: '2026-04-21T15:32:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Sprint #93 T1 · PulseStrip click-detail panel — dots expand inline with 3 recent ships + active flag',
    artifact: '/',
    signature: 'modest',
    notes: 'Mike: "fun start now." T1 shipped manually at 15:30 PT instead of waiting for the 15:34 cron. Converted each collab dot (cc / codex / manus / chatgpt) from a span to a clickable button, added an expandable detail panel below the PulseStrip line that shows the 3 most-recent ships per collab (with title, artifact link, kind·signature, time-ago), total count, active-24h flag. Click another dot to swap; click same dot / × / Esc / outside to close. One-of-four-open at a time. Aria-expanded on the buttons, hidden attr on cards.',
  },
  // ---- 2026-04-21 15:20 PT ---- Sprint #93 kickoff: 6 scheduled one-shot ticks over 2h ----
  {
    at: '2026-04-21T15:25:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0379 · Sprint #93 kickoff — 2 hours, 6 ticks, one queue',
    artifact: '/b/0379',
    signature: 'modest',
    notes: 'Editorial kickoff for the scheduled-drop sprint. Explains the pattern (bounded 2h window, 6 one-shot crons at off-minute times, shared queue file, atomic ships, no cross-tick memory), the 6 queue items (D-2, D-3, auto-ledger, walk-codex-workspaces, afternoon-pulse, wrap), and the observations to watch (ship latency, build failures, queue drift).',
  },
  {
    at: '2026-04-21T15:20:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint #93 · scheduled-drop sprint — 6 one-shot ticks over 2h (15:34–17:11 PT)',
    artifact: 'docs/plans/2026-04-21-sprint-93-queue.md',
    signature: 'modest',
    notes: 'Mike 15:15 PT: "fun keep going, next sprint, fireup scheduled drops for next two hours." Ships: (1) queue file at docs/plans/2026-04-21-sprint-93-queue.md with 6 atomic items + 3 stretch items. Each item self-contained (paths, scope bound, success criteria). (2) 6 one-shot CronCreate ticks scheduled at 15:34 / 15:52 / 16:14 / 16:33 / 16:52 / 17:11 PT — all off-:00/:30 marks per scheduling guidance. (3) Kickoff block 0379. Each tick is an independent cc session that reads the queue file, pops the first unchecked item, ships atomically (build + deploy + ledger + check off), has no memory of prior ticks. Coordination is entirely via the queue file + compute ledger. Tick T6 is the wrap — reads the final checkbox state + grep ledger for #93 entries, writes retrospective block 0385 + sprint recap at docs/sprints/2026-04-21-sprint93-scheduled-drops.md.',
  },
  // ---- 2026-04-21 17:10 PT ---- Link-back pass (blocks → native URLs + CoNav HUD NETWORK footer + /compute RFC cite) ----
  {
    at: '2026-04-21T17:10:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Native-URL link-backs · blocks 0368/0370/0377 + CoNav HUD NETWORK footer + /compute RFC cite',
    artifact: '/compute',
    signature: 'shy',
    notes: 'Three tiny follow-ups after the reading-rooms ship. (1) Swapped external URLs on blocks 0368 (frontier scan), 0370 (RFC v0 cover), 0377 (agent-games) from GitHub raw to native: /research/2026-04-21-where-we-are, /rfc/compute-ledger-v0, /research/2026-04-21-agent-games. (2) CoNav HUD NETWORK panel footer — added /decks + /rfc + /research alongside the existing /for-nodes link. (3) /compute.astro federate section: added inline link to the RFC v0 ("The formal spec is Compute Ledger RFC v0 — CC0 text, 14 sections") + tail footer now cites RFC v0 + federation-examples starter kit directory. Native URLs for everything; GitHub raw fallback preserved where useful.',
  },
  // ---- 2026-04-21 16:55 PT ---- /rfc + /research reading rooms (index + [slug] + manifests) ----
  {
    at: '2026-04-21T16:55:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Reading rooms · /rfc index + /rfc.json + /research/[slug] + /research index + /research.json',
    artifact: '/research',
    signature: 'modest',
    notes: '"Easiest neatest path" pass. Completes /rfc (index page + agent manifest — the [slug] route landed earlier) and mirrors the full pattern for /research (new lib, new [slug] page, new index, new manifest). Six files: (1) src/lib/research.ts — reads docs/research/*.md via import.meta.glob, parses bold-key header block (Filed by, Trigger, Purpose) + first-paragraph summary, newest-date-first sort. (2) src/pages/rfc/index.astro — CollectionPage JSON-LD, stats header (volumes + word totals), item-list layout. (3) src/pages/rfc.json.ts — pointcast-rfcs-v0 schema, CORS open. (4) src/pages/research/[slug].astro — mirrors /rfc/[slug] chrome, reuses src/lib/rfc-render.ts for MD→HTML (same dialect). (5) src/pages/research/index.astro — ScholarlyArticle collection, same chrome family. (6) src/pages/research.json.ts — pointcast-research-v0 schema, CORS open. Two research memos from today (frontier scan + agent-games) now have a native home. RFC v0 has a proper reading room. Zero new dependencies. Zero schema changes. Follows the /sprints + /decks pattern of "docs/{x}/ directory → /{x} public surface + /{x}.json agent manifest."',
  },
  // ---- 2026-04-21 15:10 PT ---- Remote-Codex audit via computer-use → /lab surface + sync pipeline ----
  {
    at: '2026-04-21T15:15:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0378 · /lab — four Codex prototypes, newly connected to the live site',
    artifact: '/b/0378',
    signature: 'modest',
    notes: 'Editorial + pipeline announcement. Remote-audit of Codex on Mike\'s Mac surfaced 20+ active projects + 4 unsynced prototypes. /lab surface + sync script shipped same ship. Codex gets a ledger slot for the 4 prototypes (healthy, ~9k lines).',
  },
  {
    at: '2026-04-21T15:10:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: '/lab surface + scripts/sync-codex-workspace.mjs · workspace→main-repo pipeline',
    artifact: '/lab',
    signature: 'modest',
    notes: 'Built /lab index page cataloging 4 Codex prototypes with attribution (name, taglines, line counts, color-coded borders per experiment). Wrote scripts/sync-codex-workspace.mjs (120 lines, dry-run-by-default, newest-mtime-wins, emits manifest to docs/notes/codex-sync-manifest.json). Wired npm scripts sync:codex + sync:codex:apply. Copied the 4 prototypes to public/lab/{map,arena,relay,framecast}/index.html. Pipeline is ready for Codex to ship outside the main repo with a clear path to live.',
  },
  {
    at: '2026-04-21T15:05:00-08:00',
    collab: 'codex',
    kind: 'sprint',
    title: 'Codex · 4 single-file HTML prototypes (MAP + ARENA + RELAY + FRAMECAST) · 9,046 lines total',
    artifact: '/lab',
    signature: 'healthy',
    notes: 'Ledger slot opened for Codex for work surfaced from the remote-audit. MAP (756 lines, collaborator constellation over El Segundo), ARENA (3,557 lines, agent-vs-agent prompt tournament), RELAY (2,771 lines, multi-agent message relay visualizer), FRAMECAST (1,962 lines, PointCast × GitHub repo signals → prompt generator). All zero-framework, zero-build, GPT-5.4 Extra High reasoning, Codex desktop full-access mode. Synced to main repo /public/lab/ via scripts/sync-codex-workspace.mjs. Attributes Codex where the real work landed.',
  },
  // ---- 2026-04-21 16:30 PT ---- Agent-games research pass + /play/wolf spec + block 0377 ----
  {
    at: '2026-04-21T16:30:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0377 · Games agents can actually play — a research pass + five specs',
    artifact: '/b/0377',
    signature: 'modest',
    notes: 'cc-voice READ editorial distilling the agent-games memo. Seven-minute read. Five stack-ranked game concepts for PointCast: (1) /play/wolf human-vs-LLM Werewolf arena — top pick, first-of-kind, 3-day ship. (2) /play/castmarket Prize-Cast markets on compute-ledger events. (3) /play/pulpit agent-only channel, Moltbook-adjacent. (4) /play/drop-auction daily sealed-bid VCG for HeroBlock pool slot. (5) /play/relay mesh collaborative fiction. Honest uncertainty on Foaster Elo drift + Moltbook 100k number + WOLF arxiv draft status. Closes with two reader questions.',
  },
  {
    at: '2026-04-21T16:15:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Build spec · /play/wolf v0 — Nouns-Werewolf arena, mixed human + LLM agents',
    artifact: 'docs/briefs/2026-04-21-play-wolf-spec.md',
    signature: 'modest',
    notes: 'Build-ready spec for the top pick from the agent-games research. Nine new files + two existing components edited + three new WebMCP tools (pointcast_wolf_join, pointcast_wolf_speak, pointcast_wolf_vote). State machine (LOBBY → DAY → NIGHT → GAME_END) + Durable Object skeleton (WolfGameDO room id wolf-{YYYYMMDDHH}) + Pages Functions (join/speak/vote/state) + lobby page + archive page + agent manifest. No blockchain deps for v0; DRUM pot lands in v1 once FA1.2 originates. Acceptance criteria + risks + four open questions for Mike (seat count, persona-hint field, DRUM pot size, CC0 on archive). Conservative estimate: ~28h dev, 3 working days.',
  },
  {
    at: '2026-04-21T16:00:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Research memo · "Agent games — what works, what agents can actually play"',
    artifact: 'docs/research/2026-04-21-agent-games.md',
    signature: 'healthy',
    notes: 'Second research memo of the day in docs/research/. Live web scan dispatched to research agent (10 topical queries, 16 tool uses, ~148s, 30 source URLs). Five sections: (1) what exists today — Werewolf + social deduction as hottest 2026 frontier, prediction markets saturated with agents but no markets about agent outcomes, Tezos-absent, Moltbook verified real with >100k agents + Crustafarianism religion, quieter corners mapped. (2) what PointCast already has — 7 WebMCP tools + pc-ping-v1 + compute ledger + presence DO + Nouns avatars + DRUM/Prize Cast + 10 existing games. (3) five concrete game specs (wolf, castmarket, pulpit, drop-auction, relay) stack-ranked by gap-filling + primitive fit. (4) intentional exclusions (rhythm games, SWE-bench wrappers, pure LLM-vs-LLM tournaments). (5) top pick /play/wolf with build-ready brief. Honest uncertainty flags on Foaster Elo + Moltbook 100k + DeepMind VAE ship-state + WOLF arxiv draft.',
  },
  // ---- 2026-04-21 14:55 PT ---- Sprint #92 activation (audit + D-1 + E-1 + Codex fire) ----
  {
    at: '2026-04-21T15:00:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0376 · Sprint #92 — Manus+Codex audit, /compute 4-column, top-of-morning lands',
    artifact: '/b/0376',
    signature: 'modest',
    notes: 'Sprint #92 recap. Manus 1 ledger entry, 2 briefs queued, MCP shim ready, awaits MANUS_API_KEY. Codex 4 ledger entries, 4/5 MCP fires successful at low-reasoning single-file scope, 2 briefs still open. Today\'s Codex fire timed out at 60s (consistent) but target script was already shipped 4/20; cleaned loose end (hash:skills npm script).',
  },
  {
    at: '2026-04-21T14:55:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint #92 · activation — Codex fire + /compute 4-col by collab + TopOfMorning triptych',
    artifact: '/',
    signature: 'healthy',
    notes: 'Mike 14:45 PT: "do an audit of latest activity on manus and codex" then "break is over, lets go... take over the computer if necessary, set up next sprint and go." Ships: (1) Fired mcp__codex__codex on agent-skills SHA-256 hashing brief — timed out at 60s MCP ceiling per pattern; checked filesystem, the target script was already shipped 4/20 with real 64-char hex digests on every skill; cleaned up by adding the missing hash:skills npm script to package.json. (2) /compute page grew a RECENT · BY COLLABORATOR 4-column grid section under the existing BY COLLABORATOR flat list — each column shows a collab\'s 6 most-recent ships with color-coded top border (cc blue, codex green, manus wine-red, chatgpt amber). (3) New src/components/TopOfMorning.astro — 3 auto-curated blocks from the last 24h (score weighted by channel + type + dek length) rendered as a triptych directly under HeroBlock on the homepage; falls back to 48h if under 3 qualify. Mobile collapses to 2-col then 1-col.',
  },
  {
    at: '2026-04-21T14:50:00-08:00',
    collab: 'codex',
    kind: 'ops',
    title: 'hash:skills npm script · cleanup after MCP timeout (script already shipped 4/20)',
    artifact: 'scripts/hash-agent-skills.mjs',
    signature: 'shy',
    notes: 'mcp__codex__codex fire at 14:45 PT for docs/briefs/2026-04-20-codex-sprint-next.md project #1 (agent-skills SHA-256). Timed out at 60s. File existed on disk from 2026-04-20 17:24 PT prior Codex run; public/.well-known/agent-skills/index.json already has real hex digests in every sha256 field. Only loose end was package.json "hash:skills" entry — cc added it. Ledger-attributes the hash-script to Codex where most of the work was done; today\'s fire was cleanup.',
  },
  // ---- 2026-04-21 14:20 PT ---- Compute Ledger RFC v0 drafted + cross-post brief + cover block ----
  {
    at: '2026-04-21T14:20:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Manus brief · RFC v0 cross-post (R-1 LF AAIF, R-2 Paris OSS AI Summit CfP, R-3 two personal blogs)',
    artifact: 'docs/briefs/2026-04-21-manus-rfc-crosspost.md',
    signature: 'modest',
    notes: 'Three numbered tasks addending Vol. II GTM. R-1: short post to Linux Foundation AAIF working group (250-400 words, Mike signs). R-2: Paris Open Source AI Summit 2026 CfP submission linking RFC §7 to Assisted-by/Generated-by trailers. R-3: soft outreach to two personal-blog writers (candidates: Simon Willison, Maggie Appleton, Karpathy, Adrian Roselli, Gwern — Mike picks). All three: Manus drafts, Mike reviews + signs, Mike sends. Guardrails: no spam beyond three targets, all external posts under Mike\'s name, every task logged to docs/manus-logs/.',
  },
  {
    at: '2026-04-21T14:15:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0370 · Compute Ledger RFC v0 — the protocol nobody was writing',
    artifact: '/b/0370',
    signature: 'modest',
    notes: 'mh+cc cover letter for the RFC. Summarizes the 14 sections + 3 appendices at a glance, names what\'s explicitly deferred (verifiable-credential proofs, automated spam detection, multi-aggregator first-class support) + the next milestone (v0.2 in May after first federation registrations), and closes with the self-falsifying test: "if the RFC attracts even two independent federating peers in the next month, this ships as v0.2 with the lessons learned. If it attracts zero, the premise was wrong and the spec goes back in the drawer."',
  },
  {
    at: '2026-04-21T14:10:00-08:00',
    collab: 'claude-code',
    kind: 'editorial',
    title: 'RFC v0 · Compute Ledger — federated human+AI work attribution (CC0 spec, MIT ref impl)',
    artifact: 'docs/rfc/compute-ledger-v0.md',
    signature: 'heavy',
    notes: 'Formal spec draft. 14 numbered sections + 3 appendices, ~3500 words. RFC 2119 normative MUST/SHOULD/MAY throughout. Sections: abstract, motivation, terminology, JSON contract, signature bands, HTTP contract (includes optional x402 tiering), federation, Git commit trailer bridge (Assisted-by + compute-ledger suffix), security, privacy, extensions, prior art (Co-Authored-By, Paris Summit, botcommits.dev, git-ai, Ledger Proof of Human, x402, ActivityPub), reference implementation (PointCast), acknowledgments, license (CC0 spec + MIT ref impl). Appendix A: minimum valid doc. B: richer federated example. C: changelog. Milestones (non-normative): v0.2 May, v0.3 June (post-LF AAIF + Paris Summit feedback), v1.0 August. Inaugurates docs/rfc/ as a first-class directory. Fires highest-leverage move from block 0368\'s research. docs/federation-examples/README.md updated to point at the RFC as canonical schema.',
  },
  // ---- 2026-04-21 14:25 PT ---- Sprint #91 Theme B + C-2 close (Beacon inline + presence MCP tool) ----
  {
    at: '2026-04-21T14:30:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0371 · Beacon wallet inline + what GitHub knows vs. what the ledger knows',
    artifact: '/b/0371',
    signature: 'modest',
    notes: 'Mike 14:15 PT: "yah keep going, and yah, get beacon working, and do you see the manus and codex activity in github." Two-thread editorial: (1) Beacon wallet embed closes Theme B by re-using existing WalletChip.astro component inside the HUD drawer YOU panel instead of extracting a new component. Click opens Kukai/Temple/Umami/Airgap picker in place. (2) Honest answer on GitHub: zero commits authored by manus or codex; all their work flows through Mike\'s hands OR stays uncommitted on disk. The live site has ~100 ships past the last git commit. Proposal: autonomous git-committer at 23:00 PT nightly with co-author trailers.',
  },
  {
    at: '2026-04-21T14:25:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint #91 Theme B + C-2 · Beacon inline via WalletChip embed + pointcast_presence_snapshot WebMCP tool',
    artifact: '/',
    signature: 'modest',
    notes: 'Theme B (B-1/2/3) closed in one move: imported existing WalletChip.astro into CoNavHUD.astro and placed <WalletChip /> in the drawer YOU panel. Removed the old `<a href="/profile#wallet">` link. Beacon picker (Kukai/Temple/Umami/Airgap) now opens in place; address lands in pc:wallets localStorage; pc:wallet-change event propagates to every consumer. Beacon SDK single-session constraint keeps duplicate-mount pages (/drum, /cast, /publish, /passport) coherent. C-2 (WebMCP presence): new pointcast_presence_snapshot tool in src/components/WebMCPTools.astro hitting /api/presence/snapshot (confirmed live).',
  },
  // ---- 2026-04-21 14:00 PT ---- Sprint #91 autonomous continuation (A-2/A-3/C-1) ----
  {
    at: '2026-04-21T14:05:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0369 · Autonomous continuation — A-2/A-3/C-1 shipped while Mike watched',
    artifact: '/b/0369',
    signature: 'modest',
    notes: 'Mike 13:55 PT: "take over machine and do, and yah, looking good." cc kept executing Sprint #91 without further prompting on code-only items. Three items closed: A-2 verified /api/presence/snapshot live (was actually working all along; earlier 404s were CF edge cache staleness), A-3 shipped /api/auth/logout + HUD sign-out chip (wine-red variant, swaps visibility with sign-in based on pc_session cookie), C-1 shipped /.well-known/agent-passport with full endpoint dictionary + preferred-agents roster + WebMCP tool list + federation pointer.',
  },
  {
    at: '2026-04-21T14:00:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Sprint #91 A-2/A-3/C-1 · presence verified live · /api/auth/logout shipped · /.well-known/agent-passport shipped',
    artifact: '/',
    signature: 'modest',
    notes: 'Autonomous continuation round. A-2: live curl to /api/presence/snapshot returned valid JSON ({humans:2, agents:2}). CF edge cache was stale; binding is fine. A-3: new Pages Function functions/api/auth/logout.ts (GET/POST, clears pc_session + pc_oauth_state, safe-next redirect). HUD YOU panel gains ⏻ sign-out chip (wine-red), swaps visibility with sign-in chip based on pc_session cookie. C-1: new functions/.well-known/agent-passport.ts — publisher identity JSON with operator, 4 preferred agents, full endpoint dictionary, WebMCP tools, federation + policies. 300s cache, CORS *. A-1 (Google OAuth env vars) still Mike\'s.',
  },
  // ---- 2026-04-21 13:55 PT ---- Frontier-research pass + block 0368 editorial ----
  {
    at: '2026-04-21T13:55:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0368 · Where the 2026 frontier meets PointCast — a research pass',
    artifact: '/b/0368',
    signature: 'modest',
    notes: 'cc-voice READ editorial (3x2, ~8k chars, 8-min read) distilling the research memo into feed-readable form. Seven frontier findings stack-ranked by leverage: WebMCP W3C Draft (PointCast ahead), x402/Agentic.Market launching today (alignment exact), 10k+ MCP servers (mcp.pointcast.xyz opportunity), empty compute-ledger protocol space (RFC moat), ATproto spring 2026 roadmap (PDS move), Farcaster Mini Apps + Bridgy Fed (cross-protocol bridge), speculative weird calls (analog silicon, Cerebras, agent-only Moltbook). Stack-ranked 6-week plan attached. Honest uncertainty flags on Moltbook + Farcaster DAU + Ledger Proof of Human date. Author cc (not mh+cc) because the editorial framing + stack-rank is cc\'s proposal, not Mike\'s directive.',
  },
  {
    at: '2026-04-21T13:30:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Research memo · "Where we are with PointCast — a research pass at the 2026 frontier"',
    artifact: 'docs/research/2026-04-21-where-we-are.md',
    signature: 'healthy',
    notes: 'Full long-form memo. Five sections: (1) internal state honest read, (2) nine topical 2026-frontier findings each with >=1 source URL, (3) conviction calls stack-ranked 6 moves, (4) very-future speculative explorations, (5) proposed near-term 6-week stack + 21-source bibliography. Dispatched parallel research agent for live web scan (9 queries, 16 tool uses, ~130s) — no reliance on training data. Inaugurates docs/research/ as a first-class directory. Mike directive 2026-04-21 PT chat: "try research, where are we with pointcast, what\'s interesting, whats very future we want to explore, very 2026 next."',
  },
  // ---- 2026-04-21 13:40 PT ---- Sprint #91 freshness mid-pass (Mike mid-sprint ask) ----
  {
    at: '2026-04-21T13:40:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0366 · Tuesday afternoon pulse — BTC 75.7k, Dodgers 12-3, El Segundo 63°F',
    artifact: '/b/0366',
    signature: 'modest',
    notes: 'Mike 13:10 PT mid-sprint: "before sprint ends, lets get fresh, also check bitcoin price, sport scores from yesterday, something from weather clock, games." Live fetches: Coinbase BTC-USD spot ($75,774.46), ESPN NBA + MLB scoreboards for 20260420 (Cavs 115 Raptors 105, Hawks 107 Knicks 106, TWolves 119 Nuggets 114; Dodgers 12 Rockies 3, BlueJays 5 Angels 2), open-meteo El Segundo weather (63.7°F humidity 64% wind 12mph). HeroBlock POOL refreshed to push 0366 + drop stale 0339. TodayOnPointCast POOL got 4 new chips at top (afternoon pulse, collab status, sports, sky clock). Games status roundup: /noundrum tiles + drum lifetime + Bell Tolls 3 tiers + /cards + /commercials + /quiz.',
  },
  // ---- 2026-04-21 13:15 PT ---- Sprint #91: grab-strip redesign + collab status editorial + sprint #91 overview ----
  {
    at: '2026-04-21T13:20:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0365 · Four agents, one ledger — where the collaboration actually stands',
    artifact: '/b/0365',
    signature: 'modest',
    notes: 'Status editorial on collab activity in the last 36h. Four named collaborators with ledger entries (cc, codex, manus, chatgpt). cc runs 9 sprints. Codex: operationalized as low-reasoning single-file shipper (HeroBlock, 4/5 MCP fires successful). Manus: MCP shim + two GTM queues. ChatGPT: drum cookie clicker brief queued. Also names what is NOT in the ledger (no federated peer compute yet) and the ratio of briefed-to-shipped drifting. Paired with sprint #91 overview at docs/plans/2026-04-21-sprint-91-overview.md.',
  },
  {
    at: '2026-04-21T13:18:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Sprint #91 overview (large) · 5 themes × 3 tasks — unblock auth/presence/beacon, continue agent-ready, make collab visible, set editorial cadence',
    artifact: 'docs/plans/2026-04-21-sprint-91-overview.md',
    signature: 'modest',
    notes: 'Mike 13:00 PT: "create next sprint overview make large." 15 concrete items across 5 themes: (A) unblock google/beacon/presence — A-1 Mike pastes env vars, A-2 fix /api/presence/snapshot 404, A-3 /api/auth/logout. (B) Beacon wallet — extract BeaconConnect, wire HUD chip inline, display connected state. (C) agent-ready — agent-passport, pointcast_presence_snapshot WebMCP tool, MCP server-card. (D) collab surface — /compute 4-column view, PulseStrip click-detail, /for-agents update. (E) editorial cadence — daily top-of-morning block, weekly Friday retro, Manus V-1 Warpcast fire. Priority order listed. Success criteria gated Fri 04-24 18:00 PT. Team assigned per task.',
  },
  {
    at: '2026-04-21T13:15:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint #91 · HUD grab-strip redesign (obviously-clickable button) + collab status editorial + large sprint overview',
    artifact: '/',
    signature: 'modest',
    notes: 'Mike 13:00 PT: "hamburger bar working, grab is not, see if you can troubleshoot." Root cause: grab was 10px tall with a 0.06-opacity gradient bg, basically invisible. Redesign: 22px tall, ink-black background with cream text, ▲ arrows flanking "OPEN DRAWER" label (swaps to ▼ + "CLOSE DRAWER" when tall), hover turns wine-red. Real <button> element (was <div>). Arrows rotate 180deg via CSS when data-height=tall. Shipped alongside block 0365 (collab status across cc/codex/manus/chatgpt) + the large sprint #91 overview at docs/plans/2026-04-21-sprint-91-overview.md.',
  },
  // ---- 2026-04-21 12:40 PT ---- Sprint #90: /decks as a surface + cadence freshness ----
  {
    at: '2026-04-21T12:40:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0364 · /decks is a surface now — the versioned narrative gets a reading room',
    artifact: '/b/0364',
    signature: 'modest',
    notes: 'cc-voice NOTE editorial closing Sprint #90. Narrates the four ships: /decks index page + /decks.json manifest + og:image/twitter:card meta on both deck HTML files + build-pipeline wire for posters. Also surfaces the cadence freshness filter that answers Mike ping 10:20 PT "what is the next ships on this page, they seem dated." One concrete test for success named: can someone paste pointcast.xyz/decks into Farcaster in a month and get the Vol. II poster as unfurl.',
  },
  {
    at: '2026-04-21T12:35:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint #90 · /decks as a surface — index page + agent manifest + og:image + build wire + cadence refresh',
    artifact: '/decks',
    signature: 'healthy',
    notes: 'Mike 11:34 PT "ok, keep going, next sprint." Six ships in ~45 min: (1) src/lib/decks.ts — canonical registry keyed by slug, used by index + manifest. (2) src/pages/decks/index.astro — human index with newest-first poster cards, stats header, schema footer. (3) src/pages/decks.json.ts — agent manifest, pointcast-decks-v0 schema, CORS open, Vol. III triggers embedded inline for agent discoverability. (4) og:image + twitter:card meta on public/decks/vol-1.html + vol-2.html so platforms auto-unfurl with /posters/{slug}.png. (5) package.json build script prepends scripts/build-deck-poster.mjs — new posters regenerate on every deploy. (6) src/lib/ship-queue.ts — adds UPCOMING_STALE_HOURS freshness filter (4h) to upcomingShips() so queued entries past-due >4h stop surfacing on /cadence; adds 5 new queued rows for afternoon/evening covering this sprint, the cadence refresh, block 0364, the Good Feels external deploy, and a CoNav HUD NETWORK link-back. Addresses Mike ping 10:20 PT directly. Block 0364 editorial + sprint recap alongside.',
  },
  // ---- 2026-04-21 12:30 PT ---- Sprint #89: HUD v4 + agent-ready metadata + WebMCP ----
  {
    at: '2026-04-21T12:35:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0363 · HUD v4 + agent-ready plumbing — a sprint that chose simpler over fancier',
    artifact: '/b/0363',
    signature: 'modest',
    notes: 'Sprint #89 retro. v4 HUD collapse (drops tiny state, one-time reset migration), agent-ready metadata (OAuth authz server, OIDC discovery, protected resource, all at /.well-known/ sans extension via Pages Functions), WebMCP tools (7 tools on every page via navigator.modelContext.provideContext), Google OAuth setup doc for Mike. What did not land: presence DO 404 + Bell Tolls YouTube ID.',
  },
  {
    at: '2026-04-21T12:30:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint #89 · HUD v4 (drop tiny state + reset migration) + agent-ready well-known metadata + WebMCP tools',
    artifact: '/',
    signature: 'healthy',
    notes: 'Mike 12:10 PT: "yah, bar still very wonky, not working, take another pass... and add additional items to sprint, check backlog, like google auth" plus isitagentready.com audit flagging 4 missing pieces. Ships: (1) CoNavHUD v4 — drops tiny state, 3 clear heights (min/compact/tall), removes will-change + clip-path + cascade animations, removes shade buttons + hotkeys, v4.0 migration resets every returning user. (2) Three well-known endpoints as Pages Functions: /.well-known/oauth-authorization-server (RFC 8414), /.well-known/openid-configuration (OIDC Discovery), /.well-known/oauth-protected-resource (RFC 9728). (3) WebMCPTools.astro — 7 tools via navigator.modelContext.provideContext(). (4) Google OAuth setup doc for Mike at docs/plans/2026-04-21-google-oauth-setup.md. Block 0363 editorial + sprint recap alongside.',
  },
  // ---- 2026-04-21 11:34 PT ---- Federation examples + Good Feels drop-in ----
  {
    at: '2026-04-21T11:34:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Federation examples directory · Good Feels /compute.json drop-in + README + schema',
    artifact: 'docs/federation-examples/',
    signature: 'modest',
    notes: 'Stages a minimum-viable /compute.json for getgoodfeels.com plus a README documenting the compute-ledger-v0 schema, required CORS headers, 5-minute deploy path, and future-example queue (sparrow, magpie, generic friend-node). Drop-in JSON is 4 seeded entries representing recent Good Feels editorial + ops. Does NOT deploy to any external domain — sits in the repo until Mike (or a peer operator) copies to a real host, adds CORS, and emails hello@pointcast.xyz to register. Fires Vol. III Trigger 2 ("first external /compute.json peer") the moment a registration lands.',
  },
  // ---- 2026-04-21 11:28 PT ---- Deck posters + build script ----
  {
    at: '2026-04-21T11:28:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Deck poster infra · scripts/build-deck-poster.mjs + vol-1.png + vol-2.png (1200×630)',
    artifact: 'scripts/build-deck-poster.mjs',
    signature: 'modest',
    notes: 'SVG + @resvg/resvg-js pipeline (matches build-og.mjs pattern, no new deps). DECKS registry keyed by slug — vol-1 ("The Dispatch from El Segundo"), vol-2 ("The Network Shape"). Each renders a 1200×630 social card with sunset gradient, purple-to-coral background, iconic red Nouns noggles top-right, black-chip roman-numeral volume label, DM Serif Display wordmark, italic deck title, dek line, gold JetBrains-Mono URL. Usage: `node scripts/build-deck-poster.mjs` renders all; `node scripts/build-deck-poster.mjs vol-2` renders one. Output: public/posters/{slug}.png (~220kb each). Unblocks Manus V-2 (X tweet 0 attachment) + V-1 (Warpcast frame fallback card). Vol. III onward gets a poster for free.',
  },
  // ---- 2026-04-21 11:18 PT ---- Vol. II GTM brief — Manus distribution queue ----
  {
    at: '2026-04-21T11:18:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Manus brief · Vol. II into the 7-day launch cadence (V-1 Warpcast → V-5 week-one retro)',
    artifact: 'docs/briefs/2026-04-21-manus-vol-2-gtm.md',
    signature: 'modest',
    notes: 'Five numbered ops tasks (V-1..V-5) slotting the Vol. II deck + blocks 0360/0361 into the existing docs/gtm/2026-04-19-draft.md 7-day cadence. V-1 Warpcast frame Wed 04-22. V-2 X/Twitter 10-tweet thread Thu 04-23 with Vol. II tweet 0 pinned. V-3 objkt + Tezos/Nouns cross-post Sat 04-25. V-4 Resend blast gated on M-3 (Sun/Mon). V-5 week-one retro numbers to cc Sun EOD. Guardrails: no paid promo, no link-shorteners, no analytics pixels, no Mike-voice impersonation — Manus drafts, Mike approves exact wording before any post fires.',
  },
  // ---- 2026-04-21 11:02 PT ---- Vol. III trigger note ----
  {
    at: '2026-04-21T11:02:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0361 · Vol. III — the triggers, publicly committed',
    artifact: '/b/0361',
    signature: 'modest',
    notes: 'cc-voice NOTE block publishing the four trigger conditions for Vol. III: (1) DRUM originates on mainnet + first voucher redeem, (2) first external /compute.json peer registers, (3) a field-node client reaches TestFlight or beta (Magpie macOS, iOS Sparrow, browser ext, CLI on npm), (4) a real human authors a block through /for-nodes with author="guest". Explicit non-triggers named: dense iteration (it is /sprints cadence, not /decks cadence) + traffic spikes (engagement layer, not milestone layer). Keeps the versioned-deck form honest. Sparrow v0.1 ship (pointcast.xyz/sparrow, this morning) cited as context for Trigger 3.',
  },
  // ---- 2026-04-21 10:12 PT ---- Vol. II deck ship + block 0360 cover letter ----
  {
    at: '2026-04-21T10:12:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0360 · PointCast Vol. II — the network shape, as a deck',
    artifact: '/b/0360',
    signature: 'healthy',
    notes: 'Cover-letter block for the two versioned decks now hosted at /decks/vol-1.html and /decks/vol-2.html. Vol. I (13 slides, 38kb) El-Segundo-shaped; Vol. II (15 slides, 53kb) network-shaped after Mike\'s pushback "its not all el segundo, see if you can go thru the github." Single-file HTML decks, no build step, CC0, render offline. Visual DNA: DM Serif Display + JetBrains Mono + sunset palette + red nouns noggles. Vol. II covers: velocity (100 commits/2wk), compute-currency thesis, ledger table, four-collaborator portrait w/ pulse dots, workbench (1/11/19/6/3), federation spec, five-client field nodes, Magpie, CoNav HUD, Sky Clock beyond El Segundo, /play hub, pc-ping-v1 + x402, roadmap, closer. Block 0360 argues for versioned-narrative drops as a first-class PointCast surface next to /sprints and /compute.',
  },
  {
    at: '2026-04-21T10:08:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Decks directory — /decks/ as first-class public surface · vol-1.html + vol-2.html staged',
    artifact: '/decks/vol-2.html',
    signature: 'modest',
    notes: 'Created public/decks/ and copied both single-file HTML decks in (38kb + 53kb). Serve under pointcast.xyz/decks/ next to /sprints and /compute as a versioned-narrative publication surface. Decks are self-contained: arrow keys / space / click to advance, f for fullscreen, no dependencies, no analytics. Future Vol. III drops into the same directory.',
  },
  // ---- 2026-04-21 10:00 PT ---- Sprint #88: HUD v3.2 smoothness pass ----
  {
    at: '2026-04-21T10:05:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0359 · HUD v3.2 — a smoothness pass, because it was not yet',
    artifact: '/b/0359',
    signature: 'modest',
    notes: 'Sprint #88 retro editorial. 10 numbered changes explained in order: unified timing system (custom props + cubic-bezier spring), tactile chip lift on hover, drawer roll-down with cascading panel fade, popover pop-in keyframe, grab-strip polish, shade keys bounded to visible states only, reopen chip entrance animation, palette focus halo, Astro scoped-CSS [hidden] safety net, prefers-reduced-motion respect. Plus what did NOT ship + follow-ups.',
  },
  {
    at: '2026-04-21T10:00:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint #88 · HUD v3.2 smoothness pass — unified timing, tactile chips, drawer cascade, popover fade, bounded shade keys',
    artifact: '/',
    signature: 'modest',
    notes: 'Mike 09:53 PT: "yah, have another pass a the bar, see if you can make a tad smoother, and yes, prepare a next sprint, what number would it be and then go." Sprint #88 fired (87 recap files before this). All changes scoped to src/components/CoNavHUD.astro. 10 polish moves: (1) unified --hud-ease + --hud-dur-fast/med/slow CSS custom props so every transition references the same spring curve. (2) chip hover translateY(-0.5px), active translateY(0.5px) tactile. (3) drawer opens with clip-path roll-down + translateY + cascading 40/90/140ms panel fade. (4) network popover hud-pop-in keyframe (opacity + translateY + scale, origin bottom-left). (5) grab-strip 8px→10px with hover to 12px + gradient + dots widening on hover. (6) shade keys (⌘↑/⌘↓) + drag + grab-click all bounded to SHADE = [tiny, compact, tall] — only × / ⌘M can minimize. (7) reopen chip landing animation before pulse. (8) palette focus 3px outer halo. (9) [hidden] safety net for drawer/popovers/palette-results to beat Astro scoped-CSS specificity. (10) prefers-reduced-motion extended to cover new animations. Sprint recap filed at docs/sprints/2026-04-21-sprint88-hud-smoothness.md. Block 0359 editorial ships alongside.',
  },
  // ---- 2026-04-21 09:50 PT ---- HUD v3.1 recover fix ----
  {
    at: '2026-04-21T09:50:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'HUD v3.1 · stop ⌘↑ from hiding the bar · one-time surface-up migration · bigger OPEN HUD chip',
    artifact: '/',
    signature: 'modest',
    notes: 'Mike 09:45 PT: "on the homepage, don\'t see the hud." Root cause: shadeUp() stepped HEIGHTS down to \'min\' which hides the HUD entirely — and ⌘↑ on macOS (scroll-to-top) was bound to shadeUp, so an accidental keystroke could disappear the bar, with the state then persisted in localStorage across reloads. Fix: shade keys now only cycle tiny→compact→tall (visible states); only explicit × button or ⌘M minimizes. Added HUD_VERSION marker — any pre-v3.1 user currently stuck on \'min\' gets auto-surfaced to \'compact\' on next load. Reopen chip upgraded from tiny "◉ PC" bottom-right pill to a larger animated-pulse "◉ OPEN HUD" so a minimized state is never a silent disappearance.',
  },
  // ---- 2026-04-21 09:45 PT ---- Tue post-HUD sprint (collapse + auth page + presence fix) ----
  {
    at: '2026-04-21T09:45:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Tuesday post-HUD sprint · HUD collapse/expand · /auth status page · /api/presence/snapshot 404 fix',
    artifact: '/auth',
    signature: 'modest',
    notes: 'Three ships in one sprint: (1) CoNavHUD minimize to corner chip via × button + ⌘M hotkey + localStorage persist. (2) New /auth page rendering live state (session + Google cookie + Tezos wallet) + sign-in buttons + Mike\'s env-var setup checklist. (3) /api/presence/snapshot 404 fixed by consolidating presence.ts + presence/ folder conflict (same pattern as auth/google.ts earlier — moved presence.ts → presence/index.ts). Pre-compact report landed at docs/plans/2026-04-21-tuesday-pre-compact-report.md.',
  },
  // ---- 2026-04-21 09:15 PT ---- CoNav HUD v2 shipped ----
  {
    at: '2026-04-21T09:15:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'CoNav HUD v2 · federation menu + ⌘K command palette + personal HUD drawer + auth + keyboard shortcuts + early-Mac aesthetic',
    artifact: '/',
    signature: 'heavy',
    notes: 'Mike 09:00 PT: "lets take a big pass at the bar, v2... federated bar across all our sites, browse with it, style, personal hud, login, assistive, like an early mac developer making ui breakthroughs." Ship: new src/components/CoNavHUD.astro (~900 lines, self-contained), swapped into BaseLayout + BlockLayout. Five directions: FEDERATION (⚡ network popover + placeholder peer list + /for-nodes pointer), BROWSE (⌘K palette with /route · @peer · ? prefixes), STYLE (1px borders, monospace, QuickDraw-style dashed drawer texture), PERSONAL HUD (≡ drawer with YOU+NETWORK+HELP panels + localStorage stats + auth chips), ASSISTIVE (full keyboard shortcuts ⌘K/⌘./⌘//⌘? + skip-to-content). Old CoNavigator.astro stays on disk for rollback.',
  },
  {
    at: '2026-04-21T09:10:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0358 · CoNav HUD v2 — the federated bar, the command palette, the personal readout',
    artifact: '/b/0358',
    signature: 'modest',
    notes: 'Editorial framing for v2: 5 directions, what didn\'t ship + why, note for peer operators on adopting the component. Topic-expand of Mike 09:00 PT directive. Author = mh+cc.',
  },
  // ---- 2026-04-21 08:52 PT ---- Drop: A Weed Is a Flower ordered ----
  {
    at: '2026-04-21T08:52:00-08:00',
    collab: 'mike-hoydich',
    kind: 'editorial',
    title: 'Drop · A Weed Is a Flower (Broccoli Mag) ordered',
    artifact: 'src/content/drops/2026-04-21-weed-is-a-flower-book.md',
    signature: 'shy',
    notes: 'Book order captured as link-type drop. Pairs with morning stack (0357) — Broccoli Mag\'s coffee-table reframing object arriving to sit near the GG4 desk.',
  },
  // ---- 2026-04-21 08:45 PT ---- Tuesday morning refresh + morning stack ----
  {
    at: '2026-04-21T08:45:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Tuesday refresh · HeroBlock POOL rotated (dropped 0328 yesterday-4/20, added 0346-0356 overnight wave) + CoNav bar pass (+ 🥁 nd, + tv, drum→/drum/click, - bench)',
    artifact: '/',
    signature: 'modest',
    notes: 'Mike morning feedback: "this is kinda yestrday content and def check the bar, do a bar pass." HeroBlock was seeded on 0328 (Happy 4/20) which read stale on Tuesday. Pool refreshed with overnight wave entries; today\'s pick landed on 0339 (bath song atlas). Bar added noundrum + tv chips, drum chip now points to /drum/click. TodayOnPointCast POOL also picked up overnight-wrap + noundrum + commercials chips.',
  },
  {
    at: '2026-04-21T08:35:00-08:00',
    collab: 'mike-hoydich',
    kind: 'editorial',
    title: 'Mike morning stack reported · Sightglass Blueboon + 710 Labs GG4 + Spotify 4kV7En7q8IFoAZPG54vVLh + Linda\'s Ladder',
    artifact: '/b/0357',
    signature: 'shy',
    notes: 'Chat dispatch captured as block 0357 (GDN channel, NOTE type) + drop (type spotify) for the playlist embed. Records the pattern of the Tuesday morning.',
  },
  {
    at: '2026-04-21T08:40:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0357 · Tuesday morning — Blueboon, GG4, Linda\'s Ladder, the review begins',
    artifact: '/b/0357',
    signature: 'shy',
    notes: 'Dispatch from Mike\'s chat morning-stack share. Channel GDN. Playlist embedded via media.embed + companion drop 2026-04-21-tuesday-morning-stack.md.',
  },
  // ---- 2026-04-21 05:50 PT ---- Final overnight tick 18: block 0356 wrap ----
  {
    at: '2026-04-21T05:50:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0356 · Overnight wrap — seventeen ticks, what shipped while you slept, what to look at first',
    artifact: '/b/0356',
    signature: 'modest',
    notes: 'Final overnight tick. Sums 17 prior ticks (drum rim-shot through difficulty-selector). Names 3 honest gaps: Bell Tolls difficulty count (5 asked, 3 shipped — re-read of Mike\'s ping caught the under-shipping; advanced+exceptional queued), canonical YouTube ID swap pending Mike paste, Cloudflare Pages auth env vars pending dashboard set. After this ship, no further ScheduleWakeup — overnight cadence ends. Next session resumes from clean queue.',
  },
  // ---- 2026-04-21 05:34 PT ---- Overnight tick 17: yeeplayer difficulty-selector UI ----
  {
    at: '2026-04-21T05:34:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/yee/[id] difficulty-selector UI · auto-shows DIFF row in HUD when beats[].note has 2+ of easy/medium/hard prefixes',
    artifact: '/yee/[id]',
    signature: 'modest',
    notes: 'Backward-compatible: existing single-difficulty blocks (drum-cookie-clicker companions, meditation tracks) see no UI change since they have ≤1 prefix. When a future block carries multi-difficulty beats in one array (note: "easy ...", "medium ...", "hard ..."), the DIFF row reveals with selector buttons that filter beats live and reset score/combo on switch. Bell Tolls 0353/0354/0355 currently are 3 separate blocks — consolidating them into one block 0356 is a follow-up.',
  },
  // ---- 2026-04-21 05:17 PT ---- Overnight tick 16: yeeplayer Bell Tolls hard ----
  {
    at: '2026-04-21T05:17:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0355 · For Whom The Bell Tolls — yeeplayer hard mode (every subdivision)',
    artifact: '/b/0355',
    signature: 'modest',
    notes: '108 beats vs medium\'s 56. 9 intro tolls with sub-beats, 6 bass-intro pickups, 30 main-riff every-subdivision beats, 27 verse beats with sub-bar accents, 16 chorus four-key bursts, 6 verse-2 follow-up, 14 outro tolls fading to silence. Pure rhythm cues, no lyric reproduction. Selector UI for /yee/[id] (overnight-19) queued for next tick. Easy/medium/hard ladder complete; ID swap still pending Mike paste.',
  },
  // ---- 2026-04-21 05:01 PT ---- Overnight tick 15: yeeplayer Bell Tolls medium ----
  {
    at: '2026-04-21T05:01:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0354 · For Whom The Bell Tolls — yeeplayer medium mode (every bar)',
    artifact: '/b/0354',
    signature: 'modest',
    notes: '56 beats vs easy\'s 26. Same intro tolls, every-bar density on main riff (16 beats), verse picks up sub-beats (10), chorus alternates two-key pattern (8) introducing hand independence, verse 2 + extended outro. Sequential id assignment. Hard mode + difficulty-selector UI queued for next tick (overnight-18). YouTube ID swap still pending Mike paste.',
  },
  // ---- 2026-04-21 04:43 PT ---- Overnight tick 14: yeeplayer Bell Tolls easy v0 ----
  {
    at: '2026-04-21T04:43:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0353 · For Whom The Bell Tolls — yeeplayer easy mode v0 (Metallica)',
    artifact: '/b/0353',
    signature: 'modest',
    notes: 'Topic-expand of ping 30. Easy-mode 26-beat array: 5 intro bell tolls (BELL/TOLL/PEAL/RING/STRIKE), 8 main-riff downbeats (BEAT/BOOM/HIT/SLAM/DRIVE/PULSE/ROLL/CRASH), 6 verse beats (MARCH/STAND/STORM/ROCK/THUNDER/CRY), 4 chorus beats (TIME/DAWN/TURN/BELL), 3 outro tolls. Pure rhythm cues, no lyric reproduction. Placeholder YouTube ID — Mike pastes canonical ID and cc swaps. Medium + hard queued as overnight-17/-18 for next ticks.',
  },
  // ---- 2026-04-21 04:25 PT ---- Overnight tick 13: block 0352 Midjourney v8 read ----
  {
    at: '2026-04-21T04:25:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0352 · Midjourney v8 — what a frontier image-gen release means for an agentic-visual network',
    artifact: '/b/0352',
    signature: 'modest',
    notes: 'Topic-expand of ping 31 (Mike\'s LinkedIn link about MJ v8, auth-walled). Frames v8-class advances along the 3 vectors MJ has been moving (photorealism / stylistic range / controllability), what it unlocks for PointCast\'s visual layer (3 surfaces: Nouns, posters, OG cards), agentic-visual production angle, federation implication, 3 concrete moves PointCast could make if v8 delivers.',
  },
  // ---- 2026-04-21 04:09 PT ---- Overnight tick 12: /now expansion v2 ----
  {
    at: '2026-04-21T04:09:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/now expansion v2 · extra stripe with commercial-of-the-moment + your leaderboard top-3',
    artifact: '/now',
    signature: 'shy',
    notes: 'Two-tile stripe between the 3 columns and the footer. WATCH NOW rotates through the 3 commercial titles by current minute %3 (updates every 60s). WHO\'S WINNING reads 6 boards from localStorage and shows your top 3 by score (updates every 30s). Mobile stacks.',
  },
  // ---- 2026-04-21 03:53 PT ---- Overnight tick 11: noundrum minimap ----
  {
    at: '2026-04-21T03:53:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/noundrum minimap · 1/8-scale CSS-grid overview in top-right corner (toggle on click)',
    artifact: '/noundrum',
    signature: 'shy',
    notes: 'Adds 168px-wide minimap mirroring the 24×16 tile grid as 384 small cells; amber for mine, indigo for NPC-owned, transparent for empty. Updates whenever paintTile fires (wrapped). Click minimap to hide (fades to corner); hover hidden one to peek. Hidden in art mode.',
  },
  // ---- 2026-04-21 03:36 PT ---- Overnight tick 10: SportsStrip MLS tile ----
  {
    at: '2026-04-21T03:36:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'SportsStrip · MLS tile added (5th league, soccer/usa.1, spring sub-label)',
    artifact: '/sports',
    signature: 'shy',
    notes: 'Per Mike super-sprint check "did you update sports." Existing leagues (NBA/MLB/NHL/EPL) verified current. MLS added between EPL and end-of-grid. Visible on /sports + via SportsStrip in TodayOnPointCast rotation.',
  },
  // ---- 2026-04-21 03:19 PT ---- Overnight tick 09: block 0351 mid-shift retro ----
  {
    at: '2026-04-21T03:19:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0351 · Overnight mid-shift — eight ticks in, six to go, the queue is doing what queues do',
    artifact: '/b/0351',
    signature: 'modest',
    notes: 'Mid-shift retro of overnight ticks 1-8 (drum rim-shot, noundrum lifetime, hemp-THC 0349, AI labs 0350, federation map show, Codex brief, Tezos chips, Google sign-in chips). Names the queue shape + what an overnight visitor finds. Frame: the cadence is not heroic; the queue keeps moving.',
  },
  // ---- 2026-04-21 03:04 PT ---- Overnight tick 08: Google auth UI affordance ----
  {
    at: '2026-04-21T03:04:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sign-in-with-Google chip · /cos composer foot + /noundrum header (hidden when pc_session cookie present)',
    artifact: '/cos',
    signature: 'shy',
    notes: 'JS reads document.cookie for pc_session; reveals hidden chip if absent. /cos chip says "↪ sign in with google" in composer foot. /noundrum chip says "↪ G" next to the leaderboard link in header. Both link to /api/auth/google/start?next={surface}. Auth route still needs GOOGLE_CLIENT_ID/SECRET env vars set in Cloudflare Pages dashboard before clicks resolve.',
  },
  // ---- 2026-04-21 02:48 PT ---- Overnight tick 07: Tezos /tip surface integration ----
  {
    at: '2026-04-21T02:48:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/tezos tip-chip integrated into /cos composer-foot + /commercials foot-list',
    artifact: '/tezos',
    signature: 'shy',
    notes: 'Two minimal additions: ◆ tip mike in tez chip in /cos composer foot, /tezos line item in /commercials foot list. Discovery surface for the Tezos tip widget without making it loud anywhere.',
  },
  // ---- 2026-04-21 02:32 PT ---- Overnight tick 06: Codex CLI batch brief ----
  {
    at: '2026-04-21T02:32:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Codex CLI batch brief — 3 atomic TV-show specs (drum-noundrum-overlay + nouns-by-channel + agent-pulse-fullscreen)',
    artifact: 'docs/briefs/2026-04-21-codex-tv-shows-batch.md',
    signature: 'shy',
    notes: 'Each spec independently shippable in ~5-10 min Codex session. Pattern: copy-from-existing-show + low-reasoning + single-file. Mike pastes into manual Codex CLI when convenient. After all 3 land, ping cc in inbox subject "codex shows shipped" and cc adds ledger + block.',
  },
  // ---- 2026-04-21 02:14 PT ---- Overnight tick 05: federation map TV show (12th show) ----
  {
    at: '2026-04-21T02:14:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/tv/shows/federation · animated network graph of PointCast + 7 placeholder federated peer nodes (12th TV show)',
    artifact: '/tv/shows/federation',
    signature: 'modest',
    notes: 'PointCast at center as larger amber node, 7 placeholder peers as indigo nodes around it (garden.kfn / wharf / bench / riverside / dawn / estuary / bells). Dashed SVG connection lines + animated ping dots traveling along them every ~1-2.5s, biased outbound from me. Pulses target node when ping arrives. Live pings-per-minute counter in bottom bar. Same fullscreen wiring as other shows. /tv/shows index updated to 12.',
  },
  // ---- 2026-04-21 01:57 PT ---- Overnight tick 04: block 0350 AI labs landscape ----
  {
    at: '2026-04-21T01:57:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0350 · AI labs in late April 2026 — five frontier vendors, three CLIs, one composability story',
    artifact: '/b/0350',
    signature: 'modest',
    notes: 'Survey written from inside an active multi-CLI session. Frontier vendors (Anthropic/OpenAI/Google/xAI/Meta + Chinese labs), 3 CLIs (Claude Code/Codex/Aider), 2 payment rails (x402/Gemini), MCP convergence, framework→protocol era shift.',
  },
  // ---- 2026-04-21 01:40 PT ---- Overnight tick 03: block 0349 hemp-THC six-months check-in ----
  {
    at: '2026-04-21T01:40:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0349 · Hemp-THC, six months after the November window — where Good Feels stands',
    artifact: '/b/0349',
    signature: 'modest',
    notes: 'Editorial check-in on the GF channel arc. Frames structural state of hemp-THC beverage corner six months past the November 2025 Farm Bill window; what survived, what to watch in May.',
  },
  // ---- 2026-04-21 01:23 PT ---- Overnight tick 02: noundrum lifetime tracking + leaderboard link ----
  {
    at: '2026-04-21T01:23:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/noundrum lifetime tracking · bestTiles + lifetimeClaims persisted across reset + 🏆 link to /leaderboards · 2 new boards',
    artifact: '/noundrum',
    signature: 'shy',
    notes: 'Overnight tick 2. Adds two persistent counters to noundrum state (bestTiles, lifetimeClaims), preserved across reset; backfills on older schemas; updates reset toast to show preserved values; adds 🏆 leaderboard link in header. /leaderboards picks up two new boards: noundrum-best and noundrum-claims. Now 8 boards total.',
  },
  // ---- 2026-04-21 01:08 PT ---- Overnight tick 01: drum rim-shot tier ----
  {
    at: '2026-04-21T01:08:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/drum/click rim-shot tier · 50k beats unlocks permanent +5% multiplier (patient-path alternative to prestige)',
    artifact: '/drum/click',
    signature: 'shy',
    notes: 'First overnight cadence tick. Adds rim-shot upgrade to DRUM_UPGRADES catalog + computeTapGain bonus. Visible at lifetime 50k+ for non-prestiged players. Auto-fed into /leaderboards via existing pc:drum:state.lifetime. Also queued 2 new ship-overnight items from Mike pings (yeeplayer For-Whom-The-Bell-Tolls easy/med/hard + Midjourney v8 read).',
  },
  // ---- 2026-04-21 01:15 PT ---- Auth route 404 noted; deferred to overnight investigation ----
  {
    at: '2026-04-21T01:15:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Google auth /start + /callback files written + deployed but route returns 404 — investigation queued',
    artifact: 'functions/api/auth/google/',
    signature: 'shy',
    notes: 'Removed conflicting old /api/auth/google.ts stub; new files exist on disk and follow the working ping.ts pattern (export const onRequestGet: PagesFunction<Env>). Likely Cloudflare Pages cache propagation + needs GOOGLE_CLIENT_ID/SECRET env vars set in the Pages dashboard before route activates. Activation steps: (1) set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REDIRECT_URI in Cloudflare Pages dashboard, (2) re-deploy, (3) check 200 on /api/auth/google/start. Investigation queued for overnight slot.',
  },
  // ---- 2026-04-21 01:10 PT ---- Super sprint wave 7 (commercials + leaderboards + Google auth + Tezos + overnight cadence + /now expansion) ----
  {
    at: '2026-04-21T01:10:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Super sprint · /commercials + /tv/shows/commercials (11th show) + /leaderboards + Google auth /start + /callback + /tezos + ship-queue overnight 14 entries + /now 6 chips',
    artifact: '/commercials',
    signature: 'heavy',
    notes: 'Mike super-sprint directive 00:35 PT (~150 words covering 8 distinct asks). Shipped: 3 commercial videos to public/videos/ (magpie, magpie-lego, pointcast-japanese-1967) + /commercials editorial gallery with per-video guess-the-decade game persisting score in pc:commercials:score + /tv/shows/commercials fullscreen carousel with idle-chrome fade + /leaderboards aggregate page reading drum/noundrum/cards/quiz/commercials from localStorage with session-derived simulated population + /api/auth/google/start (CSRF state cookie + OAuth dialog redirect) + /api/auth/google/callback (state validation + token exchange + 30-day pc_session cookie) + /tezos (contracts list with TzKT live counts + tip widget with QR + land-deed sketch) + ship-queue.ts overnight 14 entries (01:00→05:30 PT every 15min) + /now expanded chips 3→6.',
  },
  {
    at: '2026-04-21T01:08:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0348 · Super sprint — three commercials, a game, leaderboards, Google auth, Tezos, overnight cadence',
    artifact: '/b/0348',
    signature: 'modest',
    notes: 'Topic-expand of Mike super-sprint directive. Author = mh+cc.',
  },
  {
    at: '2026-04-21T01:05:00-08:00',
    collab: 'mike-hoydich',
    kind: 'editorial',
    title: 'Directive: super sprint over 30 min + ScheduleWakeup 14m after completion + go for the overnight people',
    artifact: 'docs/plans/2026-04-21-double-session-roadmap.md',
    signature: 'shy',
    notes: 'Mike\'s exact wording: "make it a super sprint can you build for over 30 mins, keep going then have the wake after 14 mins of completion, enjoy, mike."',
  },
  // ---- 2026-04-21 00:38 PT ---- Double session wave 6 (/now + drum-vis + noundrum art mode) ----
  {
    at: '2026-04-21T00:38:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0347 · Wave six — /now refreshed, drum visualizer, noundrum gets art mode',
    artifact: '/b/0347',
    signature: 'modest',
    notes: 'Session retro after three more ships in 35 minutes.',
  },
  {
    at: '2026-04-21T00:36:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/noundrum art mode toggle (A key + ⊞ ART button) hides grid + chrome, leaves decorations as art',
    artifact: '/noundrum',
    signature: 'shy',
    notes: 'Tiny polish ship: data-art="true" attribute on root toggles CSS that hides tile borders, NPC labels, drum/shop panel. Decorations stay visible as a contemplative reading of the canvas.',
  },
  {
    at: '2026-04-21T00:32:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/tv/shows/drum-vis · self-playing generative drum visualizer (10th TV show)',
    artifact: '/tv/shows/drum-vis',
    signature: 'modest',
    notes: 'Center drum-head pulses on beat; 3 colored rings per beat (kick/snare/hat) with stacking interference. 5 tempo modes cycle 18s each (heartbeat 60→walk 88→train 120→run 144→sprint 168 bpm). Tap or SPACE adds a green user ring. Web Audio synth.',
  },
  {
    at: '2026-04-21T00:28:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/now refresh · newspaper-style 3-column live snapshot (replaced 818-line dashboard)',
    artifact: '/now',
    signature: 'healthy',
    notes: 'Per Tier 2 plan: "lighter surface, less dashboard, more newsroom." New /now: masthead + headline + 3 columns (RECENT SHIPS from ledger, INBOX from /api/ping client fetch, WHERE TO 5 chips). Dashboard depth moved conceptually to /status.',
  },
  // ---- 2026-04-21 00:25 PT ---- Double session wave 5 (noundrum + 2 more TV shows) ----
  {
    at: '2026-04-21T00:25:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/noundrum v0 · multiplayer noun-cursor drum + land + decorate (NPCs simulating multiplayer)',
    artifact: '/noundrum',
    signature: 'heavy',
    notes: 'Mike 00:00 PT: "a new nouns cookie clicker drum where every visitor is a cursor visualized as a noun, thru drumming acquire digital land, build out the land, make art." Single ~700-line file: deterministic Noun-from-session cursor, Web Audio drum synth (kick/hat/snare/chime rotated by combo), 24×16 tile grid, claim 50 (30 if adjacent), 5 decorations (tree/lamp/fountain/star/tower), 6 NPC Nouns simulating multiplayer with random-walk + auto-claim + auto-decorate, mute toggle, reset, localStorage state. v1 architectural sketch in file comments for real DO multiplayer.',
  },
  {
    at: '2026-04-21T00:20:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/tv/shows/{here,sprint-retro} · 2 more TV shows + index updated 7→9',
    artifact: '/tv/shows/',
    signature: 'modest',
    notes: '/tv/shows/here = fullscreen presence bubbles fetching /api/presence/snapshot every 3s, drifting Noun avatars with mood/listening labels. /tv/shows/sprint-retro = vertical crawl through /docs/sprints/*.md (title + first para + date). Both auto-fullscreen on first tap, F-key, prefers-reduced-motion respected.',
  },
  {
    at: '2026-04-21T00:18:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0346 · Noundrum — every visitor is a Noun cursor, drumming buys land, land becomes art',
    artifact: '/b/0346',
    signature: 'modest',
    notes: 'Topic-expand of Mike 00:00 PT noundrum directive + roadmap framing + Codex 0/2 retro. Author = mh+cc.',
  },
  {
    at: '2026-04-21T00:10:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Codex MCP attempts 0/2 this session · /tv/shows/here + /tv/shows/sprint-retro both timed out at 60s ceiling',
    artifact: 'docs/plans/2026-04-21-double-session-roadmap.md',
    signature: 'shy',
    notes: 'Mike: "see if you can get codex involved." First fire rejected gpt-5.2-codex model (ChatGPT account limit), retried with default — timed out. Second fire on smaller atomic spec (sprint-retro from archive.astro pattern) — also timed out. Pattern that worked previously (low-reasoning + single-file + atomic) didn\'t land tonight. Possible causes: cold-MCP-session warmup, default model overhead. Manual Codex CLI path remains reliable — briefs queued for that.',
  },
  {
    at: '2026-04-21T00:05:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Double-session roadmap doc (survives compaction)',
    artifact: 'docs/plans/2026-04-21-double-session-roadmap.md',
    signature: 'shy',
    notes: 'Mike: "map it all out lets go team." Comprehensive plan covering /noundrum v0+v1+v2, the 4 companion ships in this session, deferred queue, Codex involvement strategy, and order of operations.',
  },
  // ---- 2026-04-20 23:55 PT ---- Still-4/20 wave 4 (3 more TV shows) ----
  {
    at: '2026-04-20T23:55:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'PointCast TV expansion · /tv/shows/{nouns,clock,polls} + index refresh (4→7 tiles)',
    artifact: '/tv/shows/',
    signature: 'healthy',
    notes: 'Mike "ok go" directive 23:40 PT. Shipped: nouns mosaic (240 drifting Noun tiles, hover-for-id), world clock (El Segundo center + 9 broadcast zones, live tick), polls cycle (every poll, live-fetched /api/poll tallies, bar viz, 10s rotation). Each auto-fullscreens on first tap, F key, prefers-reduced-motion respected. /tv/shows/index updated to 7 tiles.',
  },
  {
    at: '2026-04-20T23:50:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0345 · Three more shows — TV channel doubled before midnight',
    artifact: '/b/0345',
    signature: 'modest',
    notes: 'Session retro of the 3-shows wave + frame on data-as-projection.',
  },
  // ---- 2026-04-20 23:40 PT ---- Still-4/20 wave 3 (TV shows) ----
  {
    at: '2026-04-20T23:40:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'PointCast TV shows · /tv auto-fullscreen + 4 new show pages (ticker, archive, loop, quotes) + /tv/shows/ index',
    artifact: '/tv/shows/',
    signature: 'heavy',
    notes: 'Mike 23:30 PT: "tv is so cool, when go to url can we auto full screen, start to create some content from our history that\'d be interesting in that format, try some viewables." Shipped: first-tap auto-fullscreen on /tv with hint + F keybind + manual button; /tv/shows/index.astro (channel-grid of 4 tiles); /tv/shows/ticker (3-lane CSS-scroll compute ledger); /tv/shows/archive (vertical crawl of all 343+ block titles); /tv/shows/loop (animated 3-node conversation/editorial/feature diagram with rotating payloads); /tv/shows/quotes (15 Mike-quotes fullscreen serif with source-attribution). Each show auto-fullscreens on first tap + respects prefers-reduced-motion.',
  },
  {
    at: '2026-04-20T23:35:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0344 · Four shows from the record — PointCast TV as a reading format',
    artifact: '/b/0344',
    signature: 'modest',
    notes: 'Topic-expand of Mike 23:30 PT tv-viewables directive. Author = mh+cc.',
  },
  // ---- 2026-04-20 22:45 PT ---- Still-4/20 wave 2 (favicon + blocks 0342/0343) ----
  {
    at: '2026-04-20T22:45:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0343 · Gemini agentic trading rail — API-keys-for-agents, deposit-address-as-identity',
    artifact: '/b/0343',
    signature: 'modest',
    notes: 'Topic-expand of ping 7b9550a6 (Mike: "https://developer.gemini.com/trading/trading#agentic have a lookk"). Author = mh+cc.',
  },
  {
    at: '2026-04-20T22:30:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0342 · 4/20 evening retro — eleven ships and a song catalog before midnight',
    artifact: '/b/0342',
    signature: 'modest',
    notes: 'Session retro block naming the 11 ships of tonight\'s post-compact sprint (bath v2, song atlas, home phase 3, /sports, blocks 0339/0340, cos reply, ChatGPT brief, ledger, favicon redesign, this retro).',
  },
  {
    at: '2026-04-20T22:20:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'Favicon broadcast dish (v2) · SVG redesigned + ICO/PNG rasterized + all layouts updated',
    artifact: '/favicon.ico',
    signature: 'modest',
    notes: 'Per Mike pings 2026-04-19 08:17 and 2026-04-20 21:31 ("the favicon still some other image, should be broadcast dish"). SVG: pure vector (cream bg + maroon dish + amber signal arcs) replacing emoji-on-SVG. scripts/rasterize-favicon.mjs uses sharp (transitive dep of astro) to produce favicon.ico + 16/32/48/180/192/512 PNGs. BaseLayout + BlockLayout now advertise full set via link tags.',
  },
  // ---- 2026-04-20 21:30 PT ---- Post-compact Sprint 2 Night 2 ----
  {
    at: '2026-04-20T21:30:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Home Phase 3 collapse · index.astro trimmed (PingStrip/DailyDropStrip/SportsStrip/PollsOnHome removed) + TodayOnPointCast 6→3 + /sports spun off',
    artifact: '/',
    signature: 'healthy',
    notes: 'Per plan docs/plans/2026-04-20-home-phase3-plus-sprint-plan.md. Home now reads: masthead → HeroBlock → PulseStrip → NetworkStrip → TodayOnPointCast(3) → FreshDeck → BlockReorder grid → ActionDrawers. First grid card target: ≤1.3 viewport heights from top on mobile.',
  },
  {
    at: '2026-04-20T21:25:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/bath v2 · 7 color fields + 2 drifting orbs + grain overlay + parallax tilt + 11-track song catalog with prev/next cycler',
    artifact: '/bath',
    signature: 'heavy',
    notes: 'Mike 23:58 PT: "that /bath try more immersive color waves, and other songs, research find others that\'d be neat for various moods." Song IDs verified via web search. Catalog: Circle of Life / Merry Christmas Mr Lawrence / Avril 14th (BATHE); Weightless / Says / Spiegel im Spiegel (BREATHE); Teardrop / On the Nature of Daylight (DRIFT); Holocene / Hoppípolla / Nude (RELEASE).',
  },
  {
    at: '2026-04-20T21:20:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0339 · A song atlas for the bath — eleven tracks across four moods',
    artifact: '/b/0339',
    signature: 'modest',
    notes: 'Topic-expand of Mike 23:58 PT chat. Author = mh+cc per VOICE.md topic-expand protocol.',
  },
  {
    at: '2026-04-20T21:15:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0340 · McKinsey on the agentic organization — the title is the thesis',
    artifact: '/b/0340',
    signature: 'modest',
    notes: 'Topic-expand of ping 025b79e0 (Mike shared McKinsey link, expand:true). WebFetch timed out against paywall; block synthesizes from title + industry discourse + PointCast\'s agentic-org-as-network-of-one experiment.',
  },
  {
    at: '2026-04-20T21:10:00-08:00',
    collab: 'claude-code',
    kind: 'ops',
    title: 'CoS reply posted to /api/ping inbox acknowledging 14 outstanding threads',
    artifact: 'https://pointcast.xyz/api/ping?action=list',
    signature: 'shy',
    notes: 'Mike ping: "on cos, can you ping the server to see responses and respond." Replied to: sup-sup, bigger bar, mckinsey, zostaff, bath-track, cos, let\'s-go-team (cc+codex+manus), today-on-pointcast staleness, sports weakness, gemini agentic trading, kv overuse, favicon, mobile zoom, home phase 3.',
  },
  // ---- 2026-04-20 19:50 PT ---- Sprint 2 Night 1 (codex sprint + manus shim + home phase 2 + /play)
  {
    at: '2026-04-20T19:50:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sprint 2 Night 1 \u00b7 PulseStrip multi-agent + Manus MCP shim + Codex sprint 4/4 (hash + oauth + prize + hero) + ActionDrawers + /play hub + block 0337',
    artifact: '/play',
    signature: 'heavy',
    notes: 'Mike 17:32 PT: "lets get a good 4 hour sprint in lets go team." Shipped: PulseStrip cc/codex/manus/chatgpt dots, manus-mcp at tools/manus-mcp/ (config-driven REST proxy), Codex sprint 4-for-4 (3 single-file low-reasoning Codex MCP fires + /quiz cc-shipped), HeroBlock + ActionDrawers (Phase 2 home), /play hub (8 game cards), block 0337 mid-burn editorial. Codex op rule confirmed: low-reasoning + single-file = reliable inside 60s MCP budget.',
  },
  {
    at: '2026-04-20T19:48:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/play \u2014 8-card games hub (drum, cards, quiz, here, polls, today, battle, prize-cast)',
    artifact: '/play',
    signature: 'modest',
    notes: 'Single discovery URL for all interactive surfaces. Per Mike pivot: "humans land things like collect, drum, interacting with existing peoples at the time."',
  },
  {
    at: '2026-04-20T17:50:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0337 \u00b7 Sprint 2 mid-burn report (Codex 4/4 + manus-mcp + home phase 2)',
    artifact: '/b/0337',
    signature: 'modest',
  },
  {
    at: '2026-04-20T17:45:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'ActionDrawers \u00b7 4-button accordion (ping/drop/polls/contribute) at bottom of home',
    artifact: '/',
    signature: 'modest',
    notes: 'Home rethink Phase 2 second half. PingStrip + DailyDropStrip + PollsOnHome inline composers collapse into expandable drawers. Each drawer has accent color matching its action.',
  },
  {
    at: '2026-04-20T17:42:00-08:00',
    collab: 'codex',
    kind: 'brief',
    title: 'HeroBlock \u00b7 daily-deterministic editorial card above the fold (CODEX SHIPPED)',
    artifact: '/',
    signature: 'modest',
    notes: 'Codex sprint project 4. Single-file low-reasoning MCP fire. Pool of 7 hero-worthy block IDs. Date-seeded Fisher-Yates pick. 136 lines total (Codex hit the constraint). 4th Codex single-file win tonight.',
  },
  {
    at: '2026-04-20T17:40:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'manus-mcp shim at tools/manus-mcp/ \u00b7 hand-rolled JSON-RPC stdio MCP server, zero deps',
    artifact: '/tools/manus-mcp',
    signature: 'healthy',
    notes: 'Per Mike 17:32 PT "yah, build the shim". 280 lines across 3 files (package.json + index.js + README.md). Two MCP tools: manus_run_task + manus_task_status. Config-driven via env vars (MANUS_API_KEY, MANUS_BASE_URL, MANUS_AGENT_DEFAULT etc). Default agent manus-1.6-max. Install: claude mcp add manus -e MANUS_API_KEY=$KEY -- node /path/to/index.js.',
  },
  {
    at: '2026-04-20T17:35:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'PulseStrip multi-agent \u00b7 cc + codex + manus + chatgpt status dots',
    artifact: '/',
    signature: 'shy',
    notes: 'Per Mike 17:32 PT ping "add a codex working if codex working and manus." PULSE strip on home now shows all agent dots inline; each pulses green within 20min of last ledger entry, otherwise idle.',
  },
  {
    at: '2026-04-20T17:30:00-08:00',
    collab: 'mike-hoydich',
    kind: 'editorial',
    title: 'Directives \u00b7 codex plugin install + manus shim + 4h sprint kickoff + multi-agent PULSE',
    artifact: '/ping',
    signature: 'shy',
    notes: 'Stack: full Codex CLI install instructions (gpt-5-codex + reasoning-effort-high + ChatGPT Max billing), Manus MCP shim ask + Mike\'s research showing community manus-mcp packages plus the option to build our own thin shim, "add codex working if codex working and manus" PULSE refresh, "lets get a good 4 hour sprint in lets go team."',
  },
  // ---- 2026-04-20 18:30 PT ---- cadence system + agent-readiness wave
  {
    at: '2026-04-20T18:30:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Cadence System v0 + agent-readiness · /cadence + /cadence.json + ship-queue + PulseStrip + Phase 1 home collapse + Content-Signal + Link headers + api-catalog + MCP server card + agent-skills index',
    artifact: '/cadence',
    signature: 'heavy',
    notes: 'Single mega-tick answering Mike: build 15-min cadence system, execute Phase 1 Option A home rethink, fix 9 agent-readiness issues from isitagentready.com audit. Codex MCP timed out at 60s on PrizeCastChip spec — real data for operationalization (ship-0043 deferred, retry queued).',
  },
  {
    at: '2026-04-20T18:25:00-08:00',
    collab: 'codex',
    kind: 'brief',
    title: 'Codex fire · PrizeCastChip via mcp__codex__codex (TIMED OUT at 60s)',
    artifact: '/src/components/PrizeCastChip.astro',
    signature: 'shy',
    notes: 'First real mcp__codex__codex fire this session. Returned MCP error -32001: Request timed out. Spec was ~60 lines with stylistic guidance — too heavy for low-reasoning 60s budget. Retry with tighter atomic spec as ship-0043b in cadence queue. Useful data: Codex is connected; brief-shape is the lever.',
  },
  {
    at: '2026-04-20T18:20:00-08:00',
    collab: 'mike-hoydich',
    kind: 'editorial',
    title: 'Directives · agent-readiness checklist + "lets go option a" + "build the 15-min cadence system" + "operationalize codex/manus + kimi"',
    artifact: '/ping',
    signature: 'shy',
    notes: 'Three stacked directives in one chat turn. Agent-readiness via isitagentready.com paste (9 issues, 7 addressed this tick, 2 deferred). Cadence system + home Phase 1 both shipped. Codex operationalization partially proven (connected, one timeout, retry queued); Manus still pending activation; Kimi eval still to write.',
  },
  // ---- 2026-04-20 17:55 PT ---- ping batch processing (9 new messages)
  {
    at: '2026-04-20T18:00:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Ping batch · 3 expand blocks (0333 hello · 0334 PrizeCast rethink · 0335 agent-commerce rails) + StateStrip on home + TodayOnPointCast daily rotation + favicon meta hardening',
    artifact: '/',
    signature: 'heavy',
    notes: 'Single tick processing 9 new pings from Mike (3 expand:true published as blocks, 6 acknowledged with in-tick action or investigation flag). Cloudflare KV overuse + mobile-swipe + sports-v3 + bar-further flagged for next ticks.',
  },
  {
    at: '2026-04-20T17:55:00-08:00',
    collab: 'mh+cc',
    kind: 'block',
    title: 'Block 0335 · Agent-commerce rails — x402 + Gemini + a16z-signal',
    artifact: '/b/0335',
    signature: 'modest',
    notes: 'Combined topic-expand of two pings (a16z URL paywalled at 402 · Gemini agentic trading MCP). Thesis: three rails shipped same 24h window; attribution is the missing layer; /compute with the x402 field is the cross-rail attribution record.',
  },
  {
    at: '2026-04-20T17:45:00-08:00',
    collab: 'mh+cc',
    kind: 'block',
    title: 'Block 0334 · PrizeCast simpler — one-action chip + pool readout + weekly draw',
    artifact: '/b/0334',
    signature: 'modest',
    notes: 'Topic-expand of ping 21:30 UTC. Reshape PrizeCast from 6-field panel to 3-line-plus-button chip. Full panel moves to /collect/prize. Contract unchanged; only UI simplifies. Frame-native deposit flagged as natural v1.',
  },
  {
    at: '2026-04-20T17:40:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0333 · Hello — cc saw the ping',
    artifact: '/b/0333',
    signature: 'shy',
    notes: 'Direct response to ping 21:27 UTC expand:true. Proof-of-read. AGENTS.md curl-checklist held this session.',
  },
  {
    at: '2026-04-20T17:35:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'StateStrip component · working/idle readout on home, derived from ledger',
    artifact: '/',
    signature: 'modest',
    notes: 'Per Mike ping "have on homepage, a state, working or idle." Reads latest ComputeEntry per collaborator slug at build time; 20-min working threshold; pulse animation on working dot; relative-time updater every 60s.',
  },
  {
    at: '2026-04-20T17:30:00-08:00',
    collab: 'mike-hoydich',
    kind: 'editorial',
    title: 'Ping wave · 9 messages (3 expand, 6 action) while cc was between sessions',
    artifact: '/ping',
    signature: 'shy',
    notes: 'Bar-swipe-mobile · TodayOnPointCast stale · sports-weak · hello-block · prizecast-simpler · favicon-wrong · mobile-overflow · KV-overuse · a16z + Gemini URLs · "state on homepage." Validates the AGENTS.md session-start checklist; every ping is visible + routeable now.',
  },
  // ---- 2026-04-20 17:10 PT ---- topic-expand from 4/19 codex ping
  {
    at: '2026-04-20T17:15:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'NetworkStrip → "Promote" promo-focused refresh',
    artifact: '/',
    signature: 'modest',
    notes: 'Per Mike 2026-04-20 15:30 PT: "network likely almost a spot to yahh promote things." Retitled + repointed at the most interesting current primitives (compute ledger, contribute, drum-cookie-clicker-coming, /b/0331 x402 thesis).',
  },
  {
    at: '2026-04-20T17:10:00-08:00',
    collab: 'mh+cc',
    kind: 'block',
    title: 'Block 0332 · Codex, one month in — topic-expand of 4/19 Mike ping',
    artifact: '/b/0332',
    signature: 'modest',
    notes: 'Processed ping:2026-04-19T18:03:46.841Z:8d54668e (expand:true). Retrospective + Chronicle framing + pipeline thesis. Per AGENTS.md: author=mh+cc because Mike supplied substance.',
  },
  // ---- 2026-04-20 17:00 PT block ---- Mike directive: bar buildout + x402/Agentic.Market + contribute
  {
    at: '2026-04-20T17:00:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Bar buildout · /contribute · +compute & cast chips · profile lastActivity fix · market refresh · x402 schema hook',
    artifact: '/contribute',
    signature: 'heavy',
    notes: 'One mega-tick answering Mike: build out bar + contribute-compute primitive + Tezos audit (profile bug, market 4-day stale, seller-guard verified) + x402/Agentic.Market schema extension. Block 0331 is the editorial companion.',
  },
  {
    at: '2026-04-20T16:55:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0331 · x402, Agentic.Market, and the compute ledger',
    artifact: '/b/0331',
    signature: 'modest',
    notes: 'Thesis dispatch tying Coinbase\'s x402 rail + Agentic.Market storefront to PointCast\'s /compute attribution layer. Payment + attribution compose; neither replaces the other.',
  },
  {
    at: '2026-04-20T16:40:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'ChatGPT brief · /drum as a super neat drum cookie clicker',
    artifact: '/docs/briefs/2026-04-20-chatgpt-drum-cookie-clicker.md',
    signature: 'modest',
    notes: 'Full single-file brief for ChatGPT: Web Audio synth, upgrade ladder (10 → 50 → 200 → 1k → 5k → 25k beats), prestige "cast a rhythm" minting, state in localStorage, mobile-first, feat/drum-cookie-clicker branch. Co-Authored-By: ChatGPT on commits.',
  },
  {
    at: '2026-04-20T16:35:00-08:00',
    collab: 'claude-code',
    kind: 'brief',
    title: 'Manus brief · list PointCast on Agentic.Market as cc-editorial + cc-sprint provider',
    artifact: '/docs/briefs/2026-04-20-manus-agentic-market-listing.md',
    signature: 'shy',
    notes: 'Ops task: register PointCast as a provider on agentic.market; two initial services (cc-editorial per-block, cc-sprint per-ship). Manus flows through x402 handshake and Coinbase wallet setup.',
  },
  {
    at: '2026-04-20T16:30:00-08:00',
    collab: 'mike-hoydich',
    kind: 'editorial',
    title: 'Directive · "build out the bar, have ability for people to contribute compute" + x402 pointer',
    artifact: 'https://x.com/Nick_Prince12/status/2046262146523107342',
    signature: 'shy',
    notes: 'Mike followed up his federate-compute directive with the inbound side (contribute) + flagged Coinbase\'s x402/Agentic.Market launch as a parallel rail worth composing with /compute.',
  },
  // ---- 2026-04-20 16:10 PT block ---- Mike directive: "lets federate compute"
  {
    at: '2026-04-20T16:05:00-08:00',
    collab: 'mike-hoydich',
    kind: 'editorial',
    title: 'Ping audit · "are you seeing messages via /ping"',
    artifact: '/ping',
    signature: 'shy',
    notes: 'Exposed the behavioral gap: cc hadn\'t been reading KV-backed pings at session start. Triggered the PingStrip + bar-chip + AGENTS.md strengthening.',
  },
  {
    at: '2026-04-20T16:10:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'PingStrip (top-of-home composer) + /ping chip in CoNav + AGENTS.md session-start checklist',
    artifact: '/',
    signature: 'healthy',
    notes: 'Answers Mike\'s 16:00 PT "a /ping block from the top, homepage, to send information and feedback" + his 12:52 PT ping "ping should be in the bar". AGENTS.md now has an explicit curl checklist so the next cc session can\'t miss inbox reads.',
  },
  {
    at: '2026-04-20T15:45:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'MoodChip into CoNavigator bar · removed from home · mood-pulse ported',
    artifact: '/',
    signature: 'healthy',
    notes: 'Mike 15:30 PT: "have this in the bar, then once you select it goes away, mood is gone from the homepage." Inline popover in CoNav left zone; MoodChip.astro kept on disk unused.',
  },
  {
    at: '2026-04-20T15:15:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Federated compute primitive · /compute + /compute.json + ledger + home strip',
    artifact: '/compute',
    signature: 'heavy',
    notes: 'Makes PointCast\'s compute expenditure legible + invites other nodes to publish compatible /compute.json feeds.',
  },
  {
    at: '2026-04-20T15:05:00-08:00',
    collab: 'mike-hoydich',
    kind: 'editorial',
    title: 'Directive: federate compute (after Elad Gil 4/12 tweet + blog post)',
    artifact: 'https://blog.eladgil.com/p/random-thoughts-while-gazing-at-the',
    signature: 'shy',
    notes: 'The prompt that shaped this ship. Compute as currency → make it visible → invite federation.',
  },
  {
    at: '2026-04-20T14:25:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'CoNavigator · persistent footer bar + music survives navigation',
    artifact: '/b/0328',
    signature: 'heavy',
    notes: 'Iframe with transition:persist holds audio alive across ClientRouter soft-navs. Bar carries mood + noun + collect + stats + nav.',
  },
  {
    at: '2026-04-20T12:30:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0329 · Bitcoin at $75K · ETF gravity vs. Iran risk-off',
    artifact: '/b/0329',
    signature: 'modest',
  },
  {
    at: '2026-04-20T12:00:00-08:00',
    collab: 'claude-code',
    kind: 'block',
    title: 'Block 0328 · Happy 4/20 · the best day to drink a hemp seltzer in California',
    artifact: '/b/0328',
    signature: 'modest',
  },
  {
    at: '2026-04-20T11:30:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'TodayOnPointCast + DailyDropStrip + PollsOnHome refresh',
    artifact: '/',
    signature: 'healthy',
  },
  {
    at: '2026-04-20T10:45:00-08:00',
    collab: 'codex',
    kind: 'brief',
    title: 'moods-soundtracks lib · MOOD_SOUNDTRACKS record (6 real URLs)',
    artifact: '/src/lib/moods-soundtracks.ts',
    signature: 'shy',
    notes: 'Codex atomic single-file spec, model_reasoning_effort:low, run in background via MCP.',
  },
  {
    at: '2026-04-20T10:10:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/here backend + HereBeat (6-pad meditative pentatonic) + HerePoll',
    artifact: '/here',
    signature: 'heavy',
  },

  // ---- 2026-04-19 ----
  {
    at: '2026-04-19T22:30:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Sky-clock poll · block 0324 · clock surface refinements',
    artifact: '/clock',
    signature: 'healthy',
  },
  {
    at: '2026-04-19T21:00:00-08:00',
    collab: 'codex',
    kind: 'brief',
    title: 'Presence DO upgrade · listening field + geo',
    artifact: '/api/presence/snapshot',
    signature: 'modest',
  },
  {
    at: '2026-04-19T14:17:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'agents.json refresh · federation-spec v2',
    artifact: '/agents.json',
    signature: 'modest',
  },
  {
    at: '2026-04-19T07:29:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'blocks.json enrich · author + mood + companion surfaces',
    artifact: '/blocks.json',
    signature: 'modest',
  },

  // ---- 2026-04-18 (shape of a cron-heavy day) ----
  {
    at: '2026-04-18T22:44:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Briefs + gallery scaffold',
    artifact: '/briefs',
    signature: 'healthy',
  },
  {
    at: '2026-04-18T21:19:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Drum rebuild scope',
    artifact: '/drum',
    signature: 'modest',
  },
  {
    at: '2026-04-18T17:50:00-08:00',
    collab: 'manus',
    kind: 'ops',
    title: 'Topic expand · publish flow',
    artifact: '/publish',
    signature: 'modest',
  },
  {
    at: '2026-04-18T17:44:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Shelling-point poll · first coordination poll',
    artifact: '/polls',
    signature: 'modest',
  },
  {
    at: '2026-04-18T14:17:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: '/for-agents page refresh',
    artifact: '/for-agents',
    signature: 'modest',
  },
  {
    at: '2026-04-18T09:17:00-08:00',
    collab: 'claude-code',
    kind: 'sprint',
    title: 'Home mobile lighten pass',
    artifact: '/',
    signature: 'shy',
  },
];

/** Counts grouped by collaborator, for the compute page summary. */
export function collabCounts(ledger: ComputeEntry[] = COMPUTE_LEDGER): Array<{ collab: string; n: number; heaviest: ComputeSignature }> {
  const by: Record<string, { n: number; heaviest: ComputeSignature }> = {};
  const order: Record<ComputeSignature, number> = { shy: 0, modest: 1, healthy: 2, heavy: 3 };
  for (const e of ledger) {
    const prev = by[e.collab];
    if (!prev) { by[e.collab] = { n: 1, heaviest: e.signature }; continue; }
    prev.n += 1;
    if (order[e.signature] > order[prev.heaviest]) prev.heaviest = e.signature;
  }
  return Object.entries(by).map(([collab, v]) => ({ collab, ...v })).sort((a, b) => b.n - a.n);
}

/** Entries from the last N hours (rolling window). */
export function recentEntries(hours: number, ledger: ComputeEntry[] = COMPUTE_LEDGER): ComputeEntry[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return ledger.filter((e) => new Date(e.at).getTime() >= cutoff);
}

/** Human-readable label for a signature. */
export const SIGNATURE_LABEL: Record<ComputeSignature, string> = {
  shy: 'shy',
  modest: 'modest',
  healthy: 'healthy',
  heavy: 'heavy',
};

/** Rough token band for a signature. Published as a guide, not a promise. */
export const SIGNATURE_BAND: Record<ComputeSignature, string> = {
  shy: '1–5k tokens',
  modest: '5–20k tokens',
  healthy: '20–60k tokens',
  heavy: '60k+ tokens',
};

/** Human-readable label for a kind. */
export const KIND_LABEL: Record<ComputeKind, string> = {
  sprint: 'Sprint',
  block: 'Block',
  brief: 'Brief',
  ops: 'Ops',
  editorial: 'Editorial',
  federated: 'Federated',
};
