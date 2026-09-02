# The federated bar below — vision reconstruction

Source: `/private/tmp/pointcast-deploy-20260902` (detached at origin/main), read-only.

## 1. What "federated" meant, in Mike's words

From the FooterBar v4 header comment (`src/components/FooterBar.astro:4-8`, 2026-04-29):

> "take a big pass at the footer bar, eventually we want that to federate and have tools like ai queries, agents, etc, make it neat almost collectible, of course, use nouns, etc, think best practices, first principles, lets do great things"

The design note under it reframes the bar as a **collectible kit** (Stardew toolbar / Game Boy cartridge tray — adding a tool is "adding to your collection, not adding to a UI"), with **federation as first-class kit, not buried**: "peers, friends' agents, and shared rooms," data-driven via `src/data/dock-kit.ts` + `src/data/federation-peers.ts`.

A day later (`src/data/dock-kit.ts:10-11`) he narrowed it: "go towards buttons and expanded menus, and then eventually broadcaster, director" + "communicate with others" — this produced the per-tray quick-action buttons and stamp 05 BROADCAST.

Two threads to keep separate from the dock proper: (1) site-wide AT-Protocol federation (`docs/plans/2026-04-28-sprint-federation-rooms.md` — an `xyz.pointcast.block` Lexicon spike publishing Blocks to a PDS) is content federation, not the bar; FED tray is a thin front end for the same idea (static peer list, `live`/`beta`/`dream`). (2) His latest framing (2026-09-01, memory `pointcast_direction_2026_09_01.md`) recasts the dock's comms tools inside a "25-mile radius / collectives / participatory network" thesis: "a communication layer that is not a feed (PING inbox, bench question, tug) surfaced as the participatory door." "Federated" has drifted from AT-proto peer federation toward local/human participation — a possible reframe for the designer.

## 2. Feature inventory

Mounted via `BlockLayout.astro:202-205` on 431 pages: `<FooterBar />`, `<TugRope />`, `<CursorRoom />` (DockLauncher renders inside FooterBar). 62 pages still run the older `BaseLayout.astro`, which mounts `Footer.astro` + `PeerCursors.astro` instead — a separate, parallel chrome system.

Three zones: LEFT you-chip (noun+mood → ≡ menu) · CENTER omnibox + mode pill (GO·ASK·SAY·AGT, ⌘K) · RIGHT KIT strip · ON AIR · ≡.

KIT strip (`dock-kit.ts`, 8 stamps, ⌘1-⌘8):

| # | Name | Status | Notes |
|---|------|--------|-------|
| 01 ROOM | live | toggles CursorRoom cursors+chat |
| 02 ASK | live | posts `/api/ping`; real sent→answered "echoes" UI |
| 03 AGENT | live | resident roster + ping; Kimi/Gemini shown as genuinely open slots |
| 04 FED | half-built | static peer list; `discover` probes `/agents.json`; 2/5 peers `live`, 2 `beta`, 1 `dream` |
| 05 BROADCAST | half-built | now-playing glimpse works; `schedule`/`announce` are director-gated stubs, no visible backend |
| 06 CAST | live | magic words (`+confetti`, `+cat`, `+breath`, `+rain`) via `SpellLayer.astro` |
| 07 PASSPORT | live | quest stamps + daily ENTRY stamp + holos, all localStorage |
| 08 SEISMO | live | canvas rAF strip-chart driven by wire activity + your taps |

Adjacent, not stamps: **TugRope** — one site-wide rope, state in the presence Durable Object (KV would lose simultaneous pulls); polls `/api/tug` every 6s plus a 1s paint timer, continuously, on every page. **SAY** is an omnibox mode, not a stamp — active when Room is on and a peer is present. **Wallet identity chip** is `AuthMenu.astro` inside DockLauncher, gating director actions. **CursorRoom vs. PeerCursors** are two independently-built cursor systems: CursorRoom owns `/api/room` for the 431 BlockLayout pages; PeerCursors opens its own `/api/presence` connection for the 62 BaseLayout pages — its own comment says this was deliberate, "to keep the components independent."

**Measured usage:** none for the dock itself. `scripts/score-projects.mjs` (memory `pointcast_project_scoreboard.md`) scores standalone rooms by pageview, but the dock has no URL. The one adjacent page scored, `/tug`, shows `use: null`, `inbound: 0`, `onHome: false`, total 26/100 — unmeasured, unlinked from the front door. For scale, the drum room logged 26,103 hits versus low double digits for most other rooms; the dock sits entirely outside that measurement.

## 3. Recurring ideas that never fully shipped

- **"Eventually broadcaster, director"** — only a gated stub: `isDirector()` checks localStorage or a wallet allowlist; `schedule`/`announce` read "director only" with no backend behind them.
- **Live, bidirectional federation** — `federation-peers.ts` says the shape is designed so a peer's `kit[]` can extend the dock, and "that flip is data-only... tomorrow." Still static; `discover` only checks reachability.
- **AT-proto Lexicon federation** — RFC drafted, converter + round-trip demo planned; no evidence it went past the spike into dual-publish.
- **Cursor opt-out UI** — `PeerCursors.astro`: "the toggle in this component's UI (TBD — for v1 we just read the flag)." Deferred.
- **Seal/passport on the dock** — `docs/plans/2026-07-18-prd-seal-registry.md:54-55`: "Dock tray shows your seal state... waits for the echo-fix session to land to avoid FooterBar collisions." Status of that landing unconfirmed here.

## 4. Known problems

- **Two parallel chrome systems** — BlockLayout (431 pages) vs. BaseLayout (62 pages), independently-coded presence/cursor stacks.
- **Own-message double-render is a documented bug class in this exact stack**: Bell Choir (same identity pattern) shipped with every bell ringing twice — a ~70ms slapback — because roster code read `you.clientId` in one place and `id` in another (fixed PR #877). I found no confirmed live duplicate-echo in FooterBar/CursorRoom itself, only this sibling-room precedent plus the "avoid FooterBar collisions" note above.
- **Inline chrome weight** — `FooterBar.astro` alone is 158,890 bytes (73,820 of inline `<script>`); with DockLauncher (8,181), CursorRoom (18,840), TugRope (5,452) JS, every BlockLayout page ships ~106KB of inline JS pre-minification. I could not verify a specific "164KB" figure from source in this pass.
- **TugRope polls continuously everywhere** — 6s fetch + 1s paint interval on every page, whether or not anyone looks at it.
- **No usage signal feeds the scoreboard** — dock decisions are currently unmeasured guesses (§2).
- **FED tray is federation in name mostly** — 3/5 peers `beta`/`dream`; discover checks liveness only.

## 5. Five candidate directions

1. **[utility]** Build the ASK/AGENT trays into the real "not a feed" comms door Mike named 2026-09-01 (PING + bench + tug) — consolidate rather than add stamps.
2. **[utility]** Unify BlockLayout/BaseLayout chrome into one presence system before adding anything, to avoid a Bell-Choir-style echo bug.
3. **[entertainment]** Lean fully into "collectible kit" — stamps as tradeable/showable objects, extending CAST's magic-words seed.
4. **[innovation]** Finish the federation flip `federation-peers.ts` already designed: live peer discovery pulling remote `kit[]` items into the dock.
5. **[innovation]** Instrument the dock itself (tray-open/action events) so a redesign can be scored like `/register` rooms, not shipped on guesswork.
