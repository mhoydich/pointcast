---
sprintId: federated-compute
firedAt: 2026-04-20T15:30:00-08:00
trigger: chat
durationMin: 25
shippedAs: deploy:0c5f2018
status: complete
---

# chat tick — PointCast federates its compute ledger

## What shipped

Mike 2026-04-20 15:10 PT: *"this, lets federate compute"* — attached: Elad Gil 4/12 tweet *"Compute is the new currency. It is used to recruit engineers, drive productivity, allocate importance of projects. Companies may eventually measure their teams in token budgets vs just dollars."* Plus: *"thoughts on this re: pointcast https://blog.eladgil.com/p/random-thoughts-while-gazing-at-the"*.

The interpretation: publish a public compute ledger, invite other sites to publish one too, let federation do the work. Receipts, not dashboards.

### Files shipped

- **`src/lib/compute-ledger.ts`** (new, ~210 lines) — the data model.
  - Types: `ComputeEntry`, `ComputeKind` (sprint/block/brief/ops/editorial/federated), `ComputeSignature` (shy/modest/healthy/heavy with token bands).
  - Data: `COMPUTE_LEDGER` seeded with ~17 real entries from 2026-04-18 → today.
  - Helpers: `collabCounts()`, `recentEntries(hours)`, label + band maps.
  - Discipline doc in header: every new sprint retro should get a ledger entry in the same commit.

- **`src/pages/compute.json.ts`** (new) — agent-readable surface.
  - Full ledger + summary counts + signature/kind scale docs + 3-step federation spec + references Gil post.
  - CORS open (`Access-Control-Allow-Origin: *`) so other nodes can cross-fetch.

- **`src/pages/compute.astro`** (new, ~280 lines) — public ledger page.
  - Header: title + dek + stats strip (total, 24h, 7d, collabs).
  - Section 1: BY COLLABORATOR — counts + heaviest signature per collaborator.
  - Section 2: LEDGER — newest-first with time / who / kind / title / signature bar.
  - Section 3: SIGNATURE SCALE — shy/modest/healthy/heavy + token bands.
  - Section 4: FEDERATE YOUR COMPUTE — 3 steps + contact + repo link.

- **`src/components/ComputeStrip.astro`** (new) — compact home-page readout.
  - Kicker line (total ships + last-24h + /compute link).
  - Top 3 entries with full row detail (mobile collapses to 1).
  - Footer cites Gil + links /compute.json.
  - Purple left-rule (#5F3DC4) visually distinct from NetworkStrip (blue).

- **`src/content/blocks/0330.json`** (new) — editorial dispatch.
  - "Compute is the currency · and PointCast just federated its ledger"
  - 4 min read, `channel: FD`, mood: `federation`.
  - Body connects Gil's 12 theses to PointCast's actual shape: #3 (compute currency), #7 (closed-loop), #8 (artisanal/utility engineer split), #9 (harness defensibility), #10 (labor marketplace), #12 (anti-AI backlash narrative).

- **`src/pages/index.astro`** — wired `ComputeStrip` import + render slot between NetworkStrip and TodayOnPointCast.

- **`src/lib/collaborators.ts`** — dropped the Kenzo entry. Mike said: *"side note that kenzo entry shouldn't be there."* Clean removal; no downstream references broke.

### Thoughts on Gil's post (Mike asked)

Twelve points total. The ones that resonate with where PointCast sits:

- **#3 — compute is the currency.** This ship is the direct response. Publishing the ledger is the action, not the commentary.
- **#7 — closed-loop automation first.** Mike directs, cc ships, verify in prod. Tightest two-entity loop possible. Gil flags code/software engineering as the highest-leverage closed-loop domain; PointCast operates exactly there.
- **#8 — artisanal/utility engineer split.** Mike = artisanal director (taste, editorial, direction). cc = utility engineer (ships). Division of labor is the whole point.
- **#9 — harness defensibility.** BLOCKS.md, CoNavigator, ClientRouter music persistence are the harness. Model underneath is swappable.
- **#10 — labor marketplace, not software.** Every block here is a labor unit shipped by a named collaborator. The `Co-Authored-By` commit lines are literal proof.
- **#12 — anti-AI backlash.** Counterprogramming is to name your AI collaborators publicly + show what they shipped. /compute is part of that answer. /collabs + /sprints + /compute are now the three transparency legs.

Two points that don't resonate: **#1** (distributed IPO) and **#11** (most AI companies should exit) — PointCast isn't one of the parties in either story, so these are interesting-to-read but not actionable.

## Why this shape (not a dashboard)

Three options considered:

1. **Telemetry pipeline + dashboard** — auto-scrape cc sessions, Codex runs, Manus actions; real-time counters. Rejected: privacy-hostile, fragile, expensive, and produces a vanity metric, not a receipt.
2. **CI-derived ledger from git history** — parse `Co-Authored-By` + commit titles. Rejected for v0 because the git log has noise (cron ticks, merge commits, rebases) that would dilute the signal. Worth building later as an *optional* augmentation. Flagged in block 0330 as follow-up (b).
3. **Hand-curated ledger with a sprint-retro discipline.** Shipped. Every sprint retro writes a ledger entry in the same commit. Hand-curated means it stays honest — no noisy entries, no inflated signatures, no hidden activity.

Federation spec matches the same "cheap + honest" model: any site can publish a `/compute.json` following the shape, email to register, entries get mirrored.

## Deploy

- Build: 255 pages (up 5 from the CoNav ship — /compute, /compute.json, /b/0330, /c/FD index refresh, sitemap entries).
- Deploy: `https://0c5f2018.pointcast.pages.dev/` → pointcast.xyz/compute live on main.
- Verification: `dist/compute/index.html` (31KB), `dist/compute.json` (10KB), `dist/b/0330.json` present, home renders `compute-strip` (2 mentions, once in markup + once in CSS).

Expected surface:
- `/compute` — public ledger page with stats, by-collab, ledger, scale, federate sections.
- `/compute.json` — JSON feed with entries + federation spec.
- Home page — `ComputeStrip` between NetworkStrip and TodayOnPointCast.
- `/b/0330` — "Compute is the currency" block, 4 min read.

## Observations

- **The ledger IS the marketing.** "We shipped 57 things" is a vanity bullet. A receipt that shows what the 57 things were + who did them + how heavy the compute footprint was is load-bearing in a way the bullet isn't.
- **Signature bands beat token counts.** Raw tokens are fuzzy across providers (cc vs Codex vs ChatGPT vs Manus) and would invite bad comparisons. Bands (shy/modest/healthy/heavy) convey the useful signal without the bad one.
- **Federation is RSS-shaped, not platform-shaped.** Every node keeps its source of truth. PointCast mirrors registered nodes with attribution. No central aggregator, no platform lock-in.
- **The 4th transparency leg.** /collabs (who) + /sprints (what shipped) + /compute (cost) + /blocks.json (output). The site now publishes a full accounting of what gets made here.

## What didn't

- **Compute auto-derivation from git hooks** — noted as follow-up in block 0330 body (item b). Not needed for v0.
- **Real federation partners** — spec shipped, but no other site has published a `/compute.json` yet. Needs distribution: post about it, DM a few creator sites, PR an example for anyone who wants to fork.
- **Signature validation** — anyone can claim `heavy` for a one-line edit. Not a problem today (hand-curation keeps it honest); would be a problem at scale. Deferred.

## Follow-ups

1. Deploy → pointcast.xyz/compute live.
2. Post about it in collabs / Farcaster / X so someone else might publish a matching `/compute.json`.
3. Write the CI hook that drafts a ledger entry from a commit subject — cc can ship it tomorrow if the idea survives the week.
4. If a federated node registers, extend `src/lib/compute-ledger.ts` with a federation-fetcher that pulls + caches external `/compute.json` on build.
5. Next CoNav iteration (Mike's other outstanding direction — move MoodChip into bar, remove from home, etc.) — queued behind this ship.

## Notes

- Files new: 5 (compute-ledger.ts, compute.json.ts, compute.astro, ComputeStrip.astro, block 0330) + this retro = 6.
- Files modified: 2 (index.astro, collaborators.ts).
- Cumulative: **58 shipped** (28 cron + 30 chat). Block 0330 is the editorial companion to the primitive.

— cc, 15:30 PT (2026-04-20) · compute is the currency; we just published the balance sheet
