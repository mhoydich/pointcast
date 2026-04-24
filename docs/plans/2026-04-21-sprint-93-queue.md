# Sprint #93 — 2-hour scheduled-drop queue

**Opened:** 2026-04-21 ~15:15 PT
**Trigger:** Mike: *"fun keep going, next sprint, fireup scheduled drops for next two hours"*
**Shape:** 6 one-shot cron ticks over the next ~2 hours. Each tick pops the first unchecked item from the queue below, ships atomically (build + deploy + ledger entry), checks the item off, and stops.

Every tick runs as an independent cc session with no prior-conversation context, so each queue item is self-contained — includes file paths, scope bounds, success criteria.

---

## Rules for every tick

1. Work in `/Users/michaelhoydich/pointcast/`.
2. Pick the FIRST unchecked `[ ]` item below. Ship it atomically.
3. After the ship lands (build clean, deploy succeeds), edit THIS file to check the item off (`[x]`).
4. Add one ledger entry at top of `src/lib/compute-ledger.ts` under the existing Sprint #93 header.
5. If the item is blocked (missing env var, API key, etc.), note why and move to the next item.
6. Keep ships atomic — ONE primary file + editorial + ledger. Not a pile.
7. Build command: `cd /Users/michaelhoydich/pointcast && npm run build` then `npx wrangler pages deploy dist --project-name pointcast --branch main --commit-dirty=true`.

---

## Queue

### [x] 1 · D-2 · PulseStrip click-detail panel  *(Mike: "fun start now" — shipped manually at 15:30 PT instead of waiting for T1 cron at 15:34)*

**Goal:** Clicking a collaborator dot on the home PulseStrip opens a small inline panel below it showing: that collab's 3 most-recent ships (title + artifact + signature), total ship count, and their status (active/idle last 24h).

**Files:**
- Edit: `src/components/PulseStrip.astro` (add click handler + detail panel markup + inline <script>)
- Ledger: attribute cc, kind=ops, signature=modest.
- Block: `src/content/blocks/0380.json` — 1-min read, "PulseStrip learns to expand"

**Scope bound:** single component + one block. No layout changes elsewhere.

**Success:** Click a dot on home → detail panel appears below PulseStrip line → shows real ship data from `/compute.json`. Click dot again (or Esc) closes it.

---

### [x] 2 · D-3 · /for-agents page refresh — document MCP + WebMCP + federation onboarding  *(Mike: "yep keep going start now" — shipped manually at 15:33 PT)*

**Goal:** `/for-agents` is PointCast's agent-facing contract page. Today it's a manifest. Add three new sections: (a) how to call the 7 WebMCP tools from an in-browser agent, (b) how to install the Manus MCP shim + Codex MCP path, (c) how a peer agent registers for federation (point at /for-nodes + the compute-ledger RFC v0 at /rfc/compute-ledger-v0).

**Files:**
- Edit: `src/pages/for-agents.astro` (extend with 3 new `<section>` blocks)
- Block: `src/content/blocks/0381.json` — 3-min read, "How agents plug into PointCast"

**Scope bound:** additive edits to one page + one block.

**Success:** `/for-agents` renders 3 new sections visible via ToC; block links to it.

---

### [x] 3 · Auto-ledger from sync manifest  *(T1 cron fired 15:34 PT, picked #3 since #1+#2 were already checked; shipped + smoke-tested)*

**Goal:** Extend `scripts/sync-codex-workspace.mjs` so that on `--apply`, it also appends a ledger entry to `src/lib/compute-ledger.ts` attributing Codex for each synced file batch. Reads `docs/notes/codex-sync-manifest.json`, writes one entry per sync session.

**Files:**
- Edit: `scripts/sync-codex-workspace.mjs` (+30 lines max)
- Block: `src/content/blocks/0382.json` — 2-min read, "The sync now files its own paperwork"

**Scope bound:** one script edit + one block.

**Success:** `npm run sync:codex:apply` runs clean; a new ledger entry tagged `collab: 'codex'` appears at top of compute-ledger.ts referencing the manifest file list.

---

### [x] 4 · Walk other Codex workspaces — enumerate + report  *(T2 cron fired 15:52 PT → picked #4; 23 folders enumerated, surprise git pointcast checkout discovered)*

**Goal:** From the remote-Codex audit we know Codex has 20+ projects in the app. The sync script currently only handles `pointcast-collabs-map-prototype`. Write `scripts/walk-codex-workspaces.mjs` that enumerates all folders under `~/Documents/join us yee/` + any other known Codex workspaces, reports folder size + file types + likely-staleness. Dry-run only — no copying. Output as `docs/notes/codex-workspace-inventory.json`.

**Files:**
- New: `scripts/walk-codex-workspaces.mjs`
- New: `docs/notes/codex-workspace-inventory.json` (emitted by the script)
- Block: `src/content/blocks/0383.json` — 4-min read, "Mapping Codex's filesystem footprint"

**Scope bound:** two new files + one block. No config changes, no syncing.

**Success:** Script runs sub-second, emits JSON with `{workspace, sizeBytes, fileTypes, lastModified}` per folder.

---

### [x] 5 · Mid-sprint freshness pulse — BTC + sports + weather + games  *(T3 cron fired 16:14 PT; live fetches → block 0385; POOL rotated to top it)*

**Goal:** Same pattern as block 0366 but fired mid-sprint-#93. Live fetches (Coinbase BTC spot, ESPN NBA + MLB for current day's scores, open-meteo El Segundo), games summary, written as a short afternoon editorial. Keeps the site's editorial cadence crisp and demonstrates the scheduled-tick pattern isn't just ops.

**Files:**
- Block: `src/content/blocks/0384.json` — 3-min read, "Afternoon pulse — <BTC>, <score>, <weather>°F"
- HeroBlock POOL refresh (drop oldest, add 0384)

**Scope bound:** one block + one POOL edit.

**Success:** Block lands with REAL fetched numbers (not placeholders); HeroBlock POOL includes 0384.

---

### [x] 6 · Sprint #93 wrap — retrospective + what's live + what rolled  *(run-now at 16:40 PT on Mike's "fun keep going"; block 0386 + docs/sprints/2026-04-21-sprint93-scheduled-drops.md)*

**Goal:** Final tick. Summarize what the 5 previous ticks shipped (or tried to ship), what's live now, what rolled to Sprint #94, and any observations on the scheduled-drop pattern itself (latency between tick + ship, build failures, drift from the queue).

**Files:**
- Block: `src/content/blocks/0385.json` — 5-min read, "Sprint #93 — 2-hour scheduled-drop wrap"
- Recap: `docs/sprints/2026-04-21-sprint93-scheduled-drops.md`

**Scope bound:** one block + one recap.

**Success:** Block + recap read the checkbox state of THIS file + the ledger entries tagged with Sprint #93, produce a coherent end-of-sprint summary.

---

## Stretch (if queue runs dry before 2h elapses)

- [ ] 7 · E-2 · Weekly Friday retro block template (we're Tuesday, so this builds the scaffold that fires Friday).
- [ ] 8 · Commit to GitHub — autonomous git-committer that picks up un-committed changes + adds co-author trailers per collab detected in the ledger.
- [ ] 9 · Bell Tolls ADVANCED tier (if Mike has pasted the YouTube ID).

---

## Timeline (local PT)

| Tick | Cron | Approx fire | Queue item |
|---|---|---|---|
| T1 | `34 15 21 4 *` | 15:34 | 1 · D-2 PulseStrip click-detail |
| T2 | `52 15 21 4 *` | 15:52 | 2 · D-3 /for-agents refresh |
| T3 | `14 16 21 4 *` | 16:14 | 3 · Auto-ledger from sync manifest |
| T4 | `33 16 21 4 *` | 16:33 | 4 · Walk other Codex workspaces |
| T5 | `52 16 21 4 *` | 16:52 | 5 · Mid-sprint freshness pulse |
| T6 | `11 17 21 4 *` | 17:11 | 6 · Sprint #93 wrap |

Times avoid :00 and :30 marks. Each tick is one-shot (fires once then auto-deletes).

---

*cc, 2026-04-21 15:15 PT. Sprint #93 opened. Ticks scheduled in-memory via CronCreate; if session exits before T6 fires, remaining ticks become shelf items for next session.*
