/**
 * ship-queue — PointCast's 15-minute cadence backlog.
 *
 * Mike 2026-04-20 18:05 PT: *"build the system so we are active on the
 * 15 min mark, always shipping, small, medium, large, etc."*
 *
 * The queue is a hand-curated list of ships due at specific 15-min-
 * aligned timestamps. Each ship has a size (matches ComputeSignature),
 * a collaborator owner, a state machine, and a pointer at the brief or
 * artifact that defines it.
 *
 * Consumed by:
 *   - /cadence.astro (public newspaper-style schedule)
 *   - /cadence.json (agent-readable mirror)
 *   - (future) functions/cron/cadence-tick.ts (auto-dispatcher firing
 *     every 15 min in active hours 6am-2am PT)
 *
 * Disciplines:
 *   - Every ship that lands writes a matching ComputeEntry to
 *     src/lib/compute-ledger.ts (hand-curated for now; CI-automated
 *     once we have 2+ cadence cycles of data).
 *   - dueAt is always aligned to :00/:15/:30/:45 PT.
 *   - Active hours: 6am-2am PT. 2am-6am PT is a mute window.
 *
 * Author: cc. Source: Mike 2026-04-20 18:05 PT chat.
 */

import type { ComputeSignature } from './compute-ledger';

/** Ship size — reuses the compute ledger's signature bands. */
export type ShipSize = ComputeSignature;

/** Who's shipping. */
export type ShipCollab = 'cc' | 'codex' | 'chatgpt' | 'manus' | 'mike' | 'kimi';

/** State machine: queued → in-flight → shipped | skipped | deferred. */
export type ShipState = 'queued' | 'in-flight' | 'shipped' | 'skipped' | 'deferred';

export interface QueuedShip {
  /** Stable ID for linking from the ledger back to the queue. */
  id: string;
  /** Short human-readable label. Shown on /cadence. */
  title: string;
  /** Optional detail / brief pointer / artifact path. */
  body?: string;
  /** Size band — defaults the compute signature the ship will carry. */
  size: ShipSize;
  /** Owning collaborator. */
  collab: ShipCollab;
  /** ISO 8601, aligned to :00/:15/:30/:45 PT. */
  dueAt: string;
  /** ISO, when the ship started. */
  firedAt?: string;
  /** ISO, when merged / deployed. */
  landedAt?: string;
  /** State. */
  state: ShipState;
  /** Path / URL of the shipped artifact once `shipped`. */
  artifact?: string;
  /** Back-link into /compute once the ledger entry lands. */
  ledgerEntry?: string;
  /** Where this ship came from — ping key, brief path, "manual", etc. */
  source?: string;
}

/** Hand-curated seed queue. Each session: append new due-soon ships
 *  above the horizon line; mark finished ships as `shipped` + back-link
 *  their ledger entry; anything that slipped gets a fresh dueAt or
 *  moves to `deferred` with a reason in `body`.
 *
 *  Horizon line is the boundary between past (shipped/skipped/deferred)
 *  and future (queued/in-flight). Newest-queued-first within the queue. */
export const SHIP_QUEUE: QueuedShip[] = [
  // ========== 2026-04-21 TUESDAY AFTERNOON — Sprint #90 decks-as-surface + follow-ups ==========
  // Mike 2026-04-21 11:34 PT chat: "ok, keep going, next sprint." Queue for the
  // afternoon + evening. See docs/sprints/2026-04-21-sprint90-decks-as-surface.md
  // once the sprint lands.
  {
    id: 'ship-tue-decks-surface',
    title: '/decks index + /decks.json + og:image meta + build pipeline wire',
    body: 'Sprint #90 primary ship. src/pages/decks/index.astro + src/pages/decks.json.ts + src/lib/decks.ts registry. og:image + twitter:image meta on public/decks/vol-{1,2}.html. package.json build script prepends scripts/build-deck-poster.mjs.',
    size: 'healthy',
    collab: 'cc',
    dueAt: '2026-04-21T12:00:00-08:00',
    state: 'in-flight',
    source: 'Mike chat 2026-04-21 11:34 PT "ok, keep going, next sprint"',
  },
  {
    id: 'ship-tue-cadence-refresh',
    title: 'Cadence freshness filter + afternoon queue top-up',
    body: 'src/lib/ship-queue.ts: add UPCOMING_STALE_HOURS filter to upcomingShips() so queued ships past-due >4h stop surfacing on /cadence. Add 5 new afternoon/evening ships including this one. Addresses Mike ping 10:20 PT "what is the next ships on this page, they seem dated."',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T12:15:00-08:00',
    state: 'in-flight',
    source: 'Mike ping 2026-04-21 10:20 PT "what is the next ships on this page, they seem dated"',
  },
  {
    id: 'ship-tue-block-0364',
    title: 'Block 0364 · cover-letter NOTE — /decks is a surface',
    body: 'CH.FD · NOTE · cc-voice. Announces /decks as a first-class public directory next to /sprints, /compute, /workbench. References block 0360 (Vol. II cover) and 0361 (Vol. III triggers). companions wired to both.',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T12:30:00-08:00',
    state: 'queued',
    source: 'Sprint #90 · docs/sprints/2026-04-21-sprint90-decks-as-surface.md',
  },
  {
    id: 'ship-tue-goodfeels-deploy',
    title: 'Good Feels /compute.json external deploy (Trigger 2 candidate)',
    body: 'Mike-or-Manus ship. Stage from docs/federation-examples/good-feels-compute.json. Deploy to a real host (Cloudflare Worker in front of shop.getgoodfeels.com OR plain static target). Add CORS headers. Email hello@pointcast.xyz to register. Fires Vol. III Trigger 2.',
    size: 'modest',
    collab: 'mike',
    dueAt: '2026-04-21T15:00:00-08:00',
    state: 'queued',
    source: 'Sprint #90 follow-up · block 0361 Trigger 2',
  },
  {
    id: 'ship-tue-decks-linkback',
    title: '/decks link-back from CoNav HUD NETWORK panel + nav',
    body: 'Add /decks to the CoNav HUD NETWORK panel\'s static list, and to the home footer nav. Small discoverability ship — the surface exists, now it\'s linked from the chrome.',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T16:00:00-08:00',
    state: 'queued',
    source: 'Sprint #90 follow-up',
  },

  // ========== 2026-04-21 TUESDAY 09:30 PT — Post-HUD sprint ==========
  {
    id: 'ship-tue-hud-collapse',
    title: 'CoNav HUD v2 · collapse/minimize to corner chip + ⌘M hotkey + reopen',
    body: 'src/components/CoNavHUD.astro: add × minimize button, hud__reopen floating chip in bottom-right, ⌘M hotkey, localStorage persistence across navigations',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T09:30:00-08:00',
    landedAt: '2026-04-21T09:35:00-08:00',
    state: 'shipped',
    artifact: '/',
    source: 'Mike 09:20 PT: "yah and some sort of collapase expand"',
  },
  {
    id: 'ship-tue-auth-page',
    title: '/auth page · live auth state (session + Google + Tezos) + setup notes for Mike',
    body: 'New src/pages/auth.astro — reads pc_session cookie, pc:wallets localStorage, pc:session-id; renders 3-dot status + sign-in buttons + env-var setup checklist',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T09:45:00-08:00',
    landedAt: '2026-04-21T09:45:00-08:00',
    state: 'shipped',
    artifact: '/auth',
    source: 'Mike 09:20 PT: "keep working on and confirming logins, its a top priority"',
  },
  {
    id: 'ship-tue-presence-fix',
    title: '/api/presence/snapshot 404 fix · moved presence.ts → presence/index.ts (same Pages routing conflict as google.ts earlier)',
    body: 'functions/api/presence.ts + functions/api/presence/snapshot.ts both existed; conflict caused 404. Consolidated into presence/index.ts + presence/snapshot.ts.',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T09:40:00-08:00',
    landedAt: '2026-04-21T09:40:00-08:00',
    state: 'shipped',
    artifact: '/api/presence/snapshot',
    source: 'Audit agent flagged 404',
  },
  // ========== 2026-04-21 OVERNIGHT — 15-min cadence Mike directive ==========
  // Mike 2026-04-21 ~00:35 PT: "change the scheduler to kick off a new sprint
  // every 15 mins for the overnight shift, we have a bunch of compute keep
  // building." These are queued targets through ~08:00 PT. cc reads these at
  // session-start and ships in dueAt order; misses get marked deferred.
  {
    id: 'ship-overnight-01',
    title: 'Drum upgrades — leaderboard wiring + rim-shot tier (50k beats)',
    body: 'src/pages/drum/click.astro: add upgrade tier rim-shot at 50,000 beats with +0.05 multiplier; expose lifetime score to /leaderboards via existing pc:drum:state.lifetime',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T01:00:00-08:00',
    landedAt: '2026-04-21T01:08:00-08:00',
    state: 'shipped',
    artifact: '/drum/click',
    source: 'Mike super-sprint directive 00:35 PT',
  },
  // ========== New pings landed during overnight cadence ==========
  {
    id: 'ship-overnight-15',
    title: 'YeePlayer · For Whom The Bell Tolls · EASY mode v0 shipped (block 0353)',
    body: 'Easy-mode 26-beat map shipped as block 0353 with placeholder YouTube ID. Medium + hard difficulties + canonical YT ID swap queued for follow-up ticks (overnight-17/-18).',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T04:30:00-08:00',
    landedAt: '2026-04-21T04:43:00-08:00',
    state: 'shipped',
    artifact: '/b/0353',
    source: 'Mike inbox ping 30 (received during overnight cadence)',
  },
  {
    id: 'ship-overnight-17',
    title: 'YeePlayer · Bell Tolls · MEDIUM mode shipped (block 0354) — YouTube ID swap still pending',
    body: 'Block 0354 with 56 beats (every bar instead of every 2 bars). Canonical YouTube ID swap still pending — Mike has not yet pasted the Metallica VEVO ID. Both 0353 + 0354 carry the same placeholder.',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T05:00:00-08:00',
    landedAt: '2026-04-21T05:01:00-08:00',
    state: 'shipped',
    artifact: '/b/0354',
    source: 'Follow-up to overnight-15 atomic-ship scope',
  },
  {
    id: 'ship-overnight-18',
    title: 'YeePlayer · Bell Tolls · HARD mode shipped (block 0355) — selector UI deferred',
    body: 'Block 0355 with 108 beats (every subdivision, three-key polyrhythms, four-key chorus bursts). Selector UI on /yee/[id].astro deferred to overnight-19 due to atomic-ship time budget.',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T05:15:00-08:00',
    landedAt: '2026-04-21T05:17:00-08:00',
    state: 'shipped',
    artifact: '/b/0355',
    source: 'Follow-up to overnight-15 atomic-ship scope',
  },
  {
    id: 'ship-overnight-19',
    title: 'YeePlayer · /yee/[id] difficulty-selector UI enhancement',
    body: 'src/pages/yee/[id].astro: scans beats[].note for easy/medium/hard prefixes, auto-shows DIFF row in HUD with toggle buttons when 2+ difficulties detected, filters and resets state on switch. Backward compatible — single-difficulty blocks see no UI change.',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T05:30:00-08:00',
    landedAt: '2026-04-21T05:34:00-08:00',
    state: 'shipped',
    artifact: '/yee/0353',
    source: 'Scope-split from overnight-18',
  },
  {
    id: 'ship-overnight-16',
    title: 'Block 0352 — Midjourney v8 read (LinkedIn link from Mike, auth-walled)',
    body: 'Topic-expand of ping 31. LinkedIn URL inaccessible to cc; block is structural read of v8-class image-gen relevance for a small editorial network like PointCast.',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T04:15:00-08:00',
    landedAt: '2026-04-21T04:25:00-08:00',
    state: 'shipped',
    artifact: '/b/0352',
    source: 'Mike inbox ping 31 (received during overnight cadence)',
  },
  {
    id: 'ship-overnight-02',
    title: 'Noundrum v0.5 — tile-owner leaderboard pull from world state',
    body: 'src/pages/noundrum.astro: surface npc tile counts in /leaderboards under noundrum-tiles; add tiny "leaderboard" link in noundrum header',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T01:15:00-08:00',
    landedAt: '2026-04-21T01:23:00-08:00',
    state: 'shipped',
    artifact: '/noundrum',
    source: 'Mike super-sprint directive 00:35 PT',
  },
  {
    id: 'ship-overnight-03',
    title: 'Hemp-THC November 2025 update editorial block (0349)',
    body: 'New block summarizing the regulatory window status as of late April 2026; cite Good Feels arc',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T01:30:00-08:00',
    landedAt: '2026-04-21T01:40:00-08:00',
    state: 'shipped',
    artifact: '/b/0349',
    source: 'Tier 2 plan + overnight shift policy',
  },
  {
    id: 'ship-overnight-04',
    title: 'AI labs landscape April-2026 editorial block (0350)',
    body: 'Survey of frontier model launches + agentic-CLI maturity since Feb 2026',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T01:45:00-08:00',
    landedAt: '2026-04-21T01:57:00-08:00',
    state: 'shipped',
    artifact: '/b/0350',
    source: 'Tier 2 plan + overnight shift policy',
  },
  {
    id: 'ship-overnight-05',
    title: 'Federation map TV show — /tv/shows/federation',
    body: 'New TV show: network graph of PointCast-style federated nodes with pulsing connection lines + traveling ping events',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T02:00:00-08:00',
    landedAt: '2026-04-21T02:14:00-08:00',
    state: 'shipped',
    artifact: '/tv/shows/federation',
    source: 'Wave 6 deferred',
  },
  {
    id: 'ship-overnight-06',
    title: 'Codex CLI handoff brief — three small TV shows in one batch',
    body: 'docs/briefs/2026-04-21-codex-tv-shows-batch.md — atomic single-file specs for: drum-noundrum-overlay, nouns-by-channel, agent-pulse-fullscreen',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T02:15:00-08:00',
    landedAt: '2026-04-21T02:32:00-08:00',
    state: 'shipped',
    artifact: 'docs/briefs/2026-04-21-codex-tv-shows-batch.md',
    source: 'Codex involvement strategy — manual-CLI path',
  },
  {
    id: 'ship-overnight-07',
    title: 'Tezos /tip surface integration on /cos + /commercials footer',
    body: 'Add a small tip-mike chip linking to /tezos from key high-traffic surfaces',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T02:30:00-08:00',
    landedAt: '2026-04-21T02:48:00-08:00',
    state: 'shipped',
    artifact: '/tezos',
    source: 'Mike super-sprint Tezos directive 00:35 PT',
  },
  {
    id: 'ship-overnight-08',
    title: 'Auth UI affordance — "Sign in with Google" chip on /cos + /noundrum',
    body: 'Adds a small button linking to /api/auth/google/start that pre-pops the state cookie and bounces. Visible only when no pc_session cookie present.',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T02:45:00-08:00',
    landedAt: '2026-04-21T03:04:00-08:00',
    state: 'shipped',
    artifact: '/cos',
    source: 'Mike super-sprint Google auth directive 00:35 PT',
  },
  {
    id: 'ship-overnight-09',
    title: 'Block 0351 — Overnight mid-shift retro (was queued as 0349; renumbered after hemp-THC took 0349)',
    body: 'Mid-shift editorial — what landed in ticks 1-8, what\'s queued through 05:30 PT, who\'s reading.',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T03:00:00-08:00',
    landedAt: '2026-04-21T03:19:00-08:00',
    state: 'shipped',
    artifact: '/b/0351',
    source: 'Editorial loop',
  },
  {
    id: 'ship-overnight-10',
    title: 'Sports refresh — added MLS tile (5th league, soccer/usa.1)',
    body: 'src/components/SportsStrip.astro: added MLS tile after EPL; existing 4 leagues confirmed current. Tile uses spring sub-label.',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T03:15:00-08:00',
    landedAt: '2026-04-21T03:36:00-08:00',
    state: 'shipped',
    artifact: '/sports',
    source: 'Mike super-sprint check 00:35 PT — "did you update sports"',
  },
  {
    id: 'ship-overnight-11',
    title: 'Noundrum minimap — small overview of full canvas in corner',
    body: 'src/pages/noundrum.astro: add 1/8-scale CSS-grid mirror in top-right corner; click toggles hide; amber=mine, indigo=NPC owned, transparent=empty',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T03:30:00-08:00',
    landedAt: '2026-04-21T03:53:00-08:00',
    state: 'shipped',
    artifact: '/noundrum',
    source: 'Wave 5 deferred',
  },
  {
    id: 'ship-overnight-12',
    title: '/now expansion 2 — add commercial-of-the-moment chip + leaderboard preview',
    body: 'src/pages/now.astro: extra stripe between cols and footer with rotating commercial-of-moment + your top-3 leaderboard scores',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T03:45:00-08:00',
    landedAt: '2026-04-21T04:09:00-08:00',
    state: 'shipped',
    artifact: '/now',
    source: 'Mike super-sprint /now directive 00:35 PT',
  },
  {
    id: 'ship-overnight-13',
    title: 'ScheduleWakeup ping — 14m post-completion to continue overnight',
    body: 'cc fires the dynamic /loop ScheduleWakeup tool 14 minutes after each ship lands so the work continues without intervention',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-21T04:00:00-08:00',
    landedAt: '2026-04-21T01:08:00-08:00',
    state: 'shipped',
    artifact: 'ScheduleWakeup',
    source: 'Mike super-sprint scheduler directive 00:35 PT',
  },
  {
    id: 'ship-overnight-14',
    title: 'Block 0356 — overnight wrap "what landed while you slept"',
    body: 'Wake-up summary block. Sums all 17 overnight ticks; names 3 honest gaps (Bell Tolls difficulty count under-shipped vs original ping, YouTube ID pending, Cloudflare auth env vars pending). After this, no further ScheduleWakeup.',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T05:30:00-08:00',
    landedAt: '2026-04-21T05:50:00-08:00',
    state: 'shipped',
    artifact: '/b/0356',
    source: 'Editorial loop / overnight wrap',
  },
  // Bell Tolls remaining difficulties (re-read of Mike's original ping showed 5 tiers asked, not 3)
  {
    id: 'ship-bt-advanced',
    title: 'YeePlayer · Bell Tolls · ADVANCED mode (4th tier, ~150 beats)',
    body: 'Mike\'s original ping asked for 5 difficulty tiers (easy/medium/difficult/advanced/exceptional). Overnight shipped 3. Advanced is the 4th: roughly 1.5x hard density, more chord-burst patterns, sub-bar accents tightened.',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T08:00:00-08:00',
    state: 'queued',
    source: 'Re-read of ping 30 — under-shipping correction',
  },
  {
    id: 'ship-bt-exceptional',
    title: 'YeePlayer · Bell Tolls · EXCEPTIONAL mode (5th tier, ~200 beats)',
    body: 'Final tier. ~200 beats. Every triplet subdivision in main riff sections, full polyrhythm patterns in chorus, cross-handed key sequences. Likely needs the difficulty-selector UI live + canonical YouTube ID swap to be useful.',
    size: 'healthy',
    collab: 'cc',
    dueAt: '2026-04-21T08:15:00-08:00',
    state: 'queued',
    source: 'Re-read of ping 30 — under-shipping correction',
  },
  // ========== 2026-04-20 evening — tonight's live cadence ==========
  // ---- 2026-04-20 19:50 PT — Sprint 2 Night 1 ships (all SHIPPED) ----
  {
    id: 'ship-0061',
    title: '/play hub — 8 game cards (drum/cards/quiz/here/polls/today/battle/prize-cast)',
    body: 'src/pages/play.astro + TodayOnPointCast pool entry for /play',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-20T19:45:00-08:00',
    landedAt: '2026-04-20T19:48:00-08:00',
    state: 'shipped',
    artifact: '/play',
    source: 'Mike 17:32 PT chat — visitor-first pivot continued',
  },
  {
    id: 'ship-0060',
    title: 'Block 0337 — Sprint 2 mid-burn editorial',
    body: 'Captures Codex 4/4 + manus-mcp + Home Phase 2 + PULSE multi-agent',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-20T17:45:00-08:00',
    landedAt: '2026-04-20T17:50:00-08:00',
    state: 'shipped',
    artifact: '/b/0337',
    source: 'Editorial loop',
  },
  {
    id: 'ship-0059',
    title: 'ActionDrawers — 4-button accordion at bottom of home',
    body: 'src/components/ActionDrawers.astro + index.astro insert',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-20T17:45:00-08:00',
    landedAt: '2026-04-20T17:45:00-08:00',
    state: 'shipped',
    artifact: '/',
    source: 'docs/plans/2026-04-20-home-rethink.md Phase 2',
  },
  {
    id: 'ship-0058',
    title: 'HeroBlock — daily editorial card above the fold (CODEX)',
    body: 'src/components/HeroBlock.astro + index.astro insert. Codex single-file MCP fire, 136 lines, low reasoning, completed cleanly.',
    size: 'modest',
    collab: 'codex',
    dueAt: '2026-04-20T17:42:00-08:00',
    landedAt: '2026-04-20T17:42:00-08:00',
    state: 'shipped',
    artifact: '/',
    source: 'docs/briefs/2026-04-20-codex-sprint-next.md project #4',
  },
  {
    id: 'ship-0057',
    title: 'manus-mcp shim · tools/manus-mcp/',
    body: 'Hand-rolled JSON-RPC stdio MCP server, zero deps, 280 lines across 3 files. Wraps Manus REST API for Claude Code delegation on Manus credit budget. Config-driven via env vars.',
    size: 'healthy',
    collab: 'cc',
    dueAt: '2026-04-20T17:40:00-08:00',
    landedAt: '2026-04-20T17:40:00-08:00',
    state: 'shipped',
    artifact: '/tools/manus-mcp',
    source: 'Mike 17:32 PT chat — "yah, build the shim"',
  },
  {
    id: 'ship-0056',
    title: 'PulseStrip multi-agent · cc + codex + manus + chatgpt dots',
    body: 'Each agent\'s most-recent ledger entry drives a colored dot; green pulse within 20min, otherwise idle.',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-20T17:35:00-08:00',
    landedAt: '2026-04-20T17:35:00-08:00',
    state: 'shipped',
    artifact: '/',
    source: 'Mike ping 17:32 PT — "add codex working if codex working and manus"',
  },

  // ---- NEW THIS TICK (18:30 PT) — agent-readiness wave ----
  {
    id: 'ship-0041a',
    title: 'Agent-readiness · Content-Signal + Link headers + api-catalog + MCP server card + agent-skills index',
    body: 'public/robots.txt + public/_headers + public/.well-known/api-catalog + public/.well-known/mcp/server-card.json + public/.well-known/agent-skills/index.json. Per isitagentready.com audit.',
    size: 'healthy',
    collab: 'cc',
    dueAt: '2026-04-20T18:30:00-08:00',
    landedAt: '2026-04-20T18:30:00-08:00',
    state: 'shipped',
    artifact: '/.well-known/api-catalog',
    source: 'Mike 2026-04-20 ~18:15 PT audit paste from isitagentready.com',
  },
  // ---- Ships in flight / shipped this tick ----
  {
    id: 'ship-0041',
    title: 'Cadence System v0 — plan + queue + /cadence page + PulseStrip',
    body: 'docs/plans/2026-04-20-cadence-system.md + src/lib/ship-queue.ts + src/pages/cadence.astro + src/components/PulseStrip.astro',
    size: 'heavy',
    collab: 'cc',
    dueAt: '2026-04-20T18:15:00-08:00',
    landedAt: '2026-04-20T18:30:00-08:00',
    state: 'shipped',
    artifact: '/cadence',
    source: 'Mike 2026-04-20 18:05 PT chat · "build the system so we are active on the 15 min mark"',
  },
  {
    id: 'ship-0042',
    title: 'Phase 1 Option A · PulseStrip + collapse 5 home strips into 1 line',
    body: 'Replace StateStrip + FreshStrip + VisitorHereStrip + ComputeStrip + masthead-PresenceBar with one PulseStrip',
    size: 'healthy',
    collab: 'cc',
    dueAt: '2026-04-20T18:30:00-08:00',
    landedAt: '2026-04-20T18:30:00-08:00',
    state: 'shipped',
    artifact: '/',
    source: 'Mike 2026-04-20 17:55 PT chat · "lets go option a" (docs/plans/2026-04-20-home-rethink.md)',
  },
  {
    id: 'ship-0043',
    title: 'PrizeCastChip · simplified prize-cast surface (CODEX TIMEOUT)',
    body: 'Fired via mcp__codex__codex with a ~60-line spec; MCP returned Request timed out at the 60s ceiling. Real data for operationalization audit: Codex is on the line but this brief was too complex for low-reasoning 60s. Retry with tighter atomic spec (e.g. "create file X with this exact content shape") queued as ship-0043b.',
    size: 'modest',
    collab: 'codex',
    dueAt: '2026-04-20T18:30:00-08:00',
    landedAt: '2026-04-20T18:25:00-08:00',
    state: 'deferred',
    source: 'Mike ping 2026-04-20T21:30:05.706Z:90fbd5bb (expand:true) → block 0334 → cadence ship',
  },
  {
    id: 'ship-0043b',
    title: 'PrizeCastChip retry · tighter atomic spec for Codex low-reasoning 60s budget',
    body: 'Rewrite the Codex prompt to be imperative + shorter (remove stylistic references, narrow constraints, use a fill-in-the-blank template). If still times out, cc ships it directly as modest signature.',
    size: 'modest',
    collab: 'codex',
    dueAt: '2026-04-20T19:00:00-08:00',
    state: 'queued',
    source: 'Failure telemetry from ship-0043',
  },
  {
    id: 'ship-0044',
    title: 'Kimi eval brief · K2.6 vs cc on a research-block draft',
    body: 'docs/briefs/2026-04-20-kimi-eval.md — cheap experiment before committing integration sprint',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-20T18:45:00-08:00',
    state: 'queued',
    source: 'Mike 2026-04-20 18:05 PT chat · "open to getting kimi on the line"',
  },
  {
    id: 'ship-0045',
    title: 'Manus kickoff ping · Agentic.Market listing brief activation',
    body: 'POST /api/ping with subject cadence · manus-kickoff · ship-0045 pointing at docs/briefs/2026-04-20-manus-agentic-market-listing.md',
    size: 'shy',
    collab: 'cc',
    dueAt: '2026-04-20T18:45:00-08:00',
    state: 'queued',
    source: 'Mike 2026-04-20 18:05 PT chat · "we haven\'t operationalized codex or manus"',
  },

  // ========== Tomorrow (2026-04-21) — next active window ==========
  {
    id: 'ship-0046',
    title: 'Phase 2 Option A · HeroBlock component + ActionDrawers',
    body: 'Second ship in home rethink. HeroBlock renders one daily-picked block card full-size; ActionDrawers collapse ping/drop/polls/contribute at bottom.',
    size: 'healthy',
    collab: 'cc',
    dueAt: '2026-04-21T07:00:00-08:00',
    state: 'queued',
    source: 'docs/plans/2026-04-20-home-rethink.md Phase 2',
  },
  {
    id: 'ship-0047',
    title: 'Cloudflare KV overuse fix · visit.ts session dedupe',
    body: 'Add 10-min session-ID dedupe in functions/api/visit.ts so a single visitor scroll doesn\'t hit the write path 40x',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T07:15:00-08:00',
    state: 'queued',
    source: 'Mike ping 2026-04-20T21:37:32.744Z:a8cc1fd9 · "been getting cloudflaire overuse notes in gmail for kv workers"',
  },
  {
    id: 'ship-0048',
    title: 'Phase 3 Option A · /sports page + remove SportsStrip from home',
    body: 'Move SportsStrip into a dedicated /sports route; link from ActionDrawers',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T07:30:00-08:00',
    state: 'queued',
    source: 'docs/plans/2026-04-20-home-rethink.md Phase 3',
  },
  {
    id: 'ship-0049',
    title: 'Drum cookie clicker · Web Audio + upgrade ladder + prestige',
    body: 'docs/briefs/2026-04-20-chatgpt-drum-cookie-clicker.md — full rewrite of /drum',
    size: 'heavy',
    collab: 'chatgpt',
    dueAt: '2026-04-21T08:00:00-08:00',
    state: 'queued',
    source: 'Mike 2026-04-20 16:15 PT chat · "have chatgpt, upgrade drum, a super neat drum cookie clicker"',
  },
  {
    id: 'ship-0050',
    title: 'x402 fulfillment endpoint stubs · functions/api/x402/[service].ts',
    body: 'Server-side handler stubs for Manus\'s Agentic.Market listings. Returns 501 until real integration.',
    size: 'modest',
    collab: 'cc',
    dueAt: '2026-04-21T08:15:00-08:00',
    state: 'queued',
    source: 'block 0331 + Manus brief 2026-04-20 16:35 PT',
  },

  // ========== Horizon line ↑ queued / ↓ shipped or deferred ==========
  // (Filled in as ships land. Empty for now — cadence starts tonight.)
];

/** Align a timestamp down to the nearest 15-min mark. Useful when
 *  scheduling a ship for "next slot" relative to a given moment. */
export function alignToSlot(iso: string): string {
  const d = new Date(iso);
  d.setSeconds(0);
  d.setMilliseconds(0);
  const m = d.getMinutes();
  d.setMinutes(Math.floor(m / 15) * 15);
  return d.toISOString();
}

/** Next slot from a moment, rounded up. */
export function nextSlot(from: Date = new Date()): string {
  const d = new Date(from);
  d.setSeconds(0);
  d.setMilliseconds(0);
  const m = d.getMinutes();
  const next = Math.ceil((m + 0.01) / 15) * 15;
  if (next >= 60) {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  } else {
    d.setMinutes(next);
  }
  return d.toISOString();
}

/** Is a given moment inside the active cadence window (6am–2am PT)? */
export function isActiveWindow(d: Date = new Date()): boolean {
  const fmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/Los_Angeles',
  });
  const hour = parseInt(fmt.format(d), 10);
  // Active: hour >= 6 AND hour < 26 (which is 2am next day). But hours
  // are 0-23; we want 06-01 wrapping. Easier: active if NOT in [2,6).
  return !(hour >= 2 && hour < 6);
}

/** Freshness window for "upcoming" — how many hours past the dueAt
 *  before a queued ship is considered stale and hidden from the
 *  upcoming list. Stale entries stay in the underlying array (you can
 *  still find them by ID) but stop surfacing as "next ships" so the
 *  cadence page doesn't show ancient dueAt timestamps. Per Mike ping
 *  2026-04-21 10:20 PT "what is the next ships on this page, they seem
 *  dated." Explicit deferral remains valid; this just prevents benign
 *  rot from reaching the public surface. */
const UPCOMING_STALE_HOURS = 4;

/** All queued + in-flight ships in chronological order.
 *  Hides queued ships whose dueAt is more than UPCOMING_STALE_HOURS
 *  in the past — those should be explicitly shipped, skipped, or
 *  deferred rather than lingering as "next ships" forever. */
export function upcomingShips(limit = 8, now: Date = new Date()): QueuedShip[] {
  const staleCutoffMs = now.getTime() - UPCOMING_STALE_HOURS * 60 * 60 * 1000;
  return [...SHIP_QUEUE]
    .filter((s) => s.state === 'queued' || s.state === 'in-flight')
    .filter((s) => new Date(s.dueAt).getTime() >= staleCutoffMs)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, limit);
}

/** Recently-landed ships, newest-first. */
export function recentShips(limit = 24): QueuedShip[] {
  return [...SHIP_QUEUE]
    .filter((s) => s.state === 'shipped' || s.state === 'skipped' || s.state === 'deferred')
    .sort((a, b) => {
      const ta = new Date(a.landedAt ?? a.dueAt).getTime();
      const tb = new Date(b.landedAt ?? b.dueAt).getTime();
      return tb - ta;
    })
    .slice(0, limit);
}

/** The next ship that's due (or overdue), for the home PulseStrip. */
export function nextShip(): QueuedShip | null {
  const upcoming = upcomingShips(1);
  return upcoming[0] ?? null;
}

export const SIZE_LABEL: Record<ShipSize, string> = {
  shy: 'shy',
  modest: 'modest',
  healthy: 'healthy',
  heavy: 'heavy',
};

export const COLLAB_LABEL: Record<ShipCollab, string> = {
  cc: 'cc',
  codex: 'codex',
  chatgpt: 'chatgpt',
  manus: 'manus',
  mike: 'mike',
  kimi: 'kimi',
};

export const STATE_LABEL: Record<ShipState, string> = {
  queued: 'queued',
  'in-flight': 'in flight',
  shipped: 'shipped',
  skipped: 'skipped',
  deferred: 'deferred',
};
