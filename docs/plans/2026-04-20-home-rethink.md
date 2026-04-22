# Home rethink — 2026-04-20

**Author:** cc
**Trigger:** Mike 2026-04-20 ~17:50 PT chat: *"make a plan to rethink pointcast.xyz home page"*
**Status:** plan · awaiting Mike pick between Option A / B / C

---

## Context

Over the last 48 hours the home has accumulated strips as fast as Mike directed them — each one reasonable in isolation, cumulatively a lot. The block grid, which is the thing readers came for, is now 4–5 mobile screens below the fold. The "newspaper front page" feel from a week ago has become a "dashboard" feel. This plan is the correction.

---

## Inventory — what's on the home today

Top-to-bottom per `src/pages/index.astro`:

| # | Component | Purpose | Scroll-weight |
|---|---|---|---|
| 1 | Masthead | wordmark + block count + clock + PresenceBar + WalletChip + /for-agents link | small |
| 2 | **StateStrip** (new) | working/idle readout for cc, mike, codex, chatgpt, manus | small |
| 3 | **PingStrip** (new) | feedback composer — tap "say something" expands | small collapsed |
| 4 | FreshStrip | HELLO / N NEW / CAUGHT UP badges vs localStorage lastVisit | tiny |
| 5 | VisitorHereStrip | your noun avatar + ghost slots for other visitors | medium |
| 6 | NetworkStrip | 3-item promo rotation (was primitive-index, now curated) | small |
| 7 | ComputeStrip | recent compute ledger + link to /compute | medium |
| 8 | TodayOnPointCast | 6 curated daily-rotating editorial picks | **large** |
| 9 | DailyDropStrip | collect today's drop + streak | small |
| 10 | SportsStrip | 4 ESPN league tiles (NBA / MLB / NHL / EPL) | **large** |
| 11 | PollsOnHome | active polls (further down) | medium |
| 12 | FreshDeck | 3 random archive blocks | medium |
| 13 | **BlockReorder grid** | the block feed — the actual content | — |
| 14 | Footer | — | — |

Pre-grid scroll on mobile: about **4–5 viewport heights**.

---

## Observations — what's broken

1. **Too many live-signal strips.** StateStrip (who's working), FreshStrip (when you last visited), VisitorHereStrip (who's here), PresenceBar (who's here, again), ComputeStrip (what was shipped) are five surfaces answering closely-related questions. These should collapse into one.

2. **Two editorial-picks strips.** TodayOnPointCast (6 rotating picks) + NetworkStrip (3 promo picks) overlap conceptually. Network was a primitive-index before today's promo refresh; it now does the same job as TodayOnPointCast at smaller size.

3. **CoNavigator already carries most visitor-actions.** Mood picker, ▶ soundtrack, ✦ collect, ✎ ping, ✦ +compute, ↗ cast, here/drum/bench/me navigation — all live in the bar on every page. Putting PingStrip + DailyDropStrip + future action-strips on the home is increasingly redundant with the bar.

4. **SportsStrip and PollsOnHome are large but low-editorial.** Sports is a 4-league fetch (you've flagged twice as weak); polls is a multi-question surface. Both deserve their own pages more than a home slot.

5. **The grid itself — BlockReorder + BlockCards — is actually in good shape.** That's the thing readers came for. It's buried.

6. **Mobile scroll budget.** Before the first block card, a mobile visitor scrolls past ~9 strips. The newspaper-front-page instinct (see the headline above the fold) is gone.

7. **Attribution already lives elsewhere.** /compute, /sprints, /collabs, /state (if we formalize it) are dedicated pages. Home duplicates their intros.

---

## Design principles for the rethink

1. **CoNav is the chrome. Home is only the editorial layer.** If something is on the bar, it doesn't need to be on the home too.
2. **Live signals collapse into one line.** A single thin strip that answers "is PointCast alive right now" — combining presence + state + compute-pulse + last-shipped.
3. **One hero block, above the fold.** A single large editorial card picked daily. Not a chip; an actual block rendered full-size.
4. **Grid is the main event.** Get the first block card into view within 1–1.5 mobile screens.
5. **Actions are drawers, not strips.** Ping / Drop / Polls / Contribute — expand on tap, don't take constant real estate.
6. **Agent-legibility preserved.** JSON-LD, blocks.json, RSS — none of these change. This is a presentation refactor, not a data model change.

---

## Option A — Radical collapse to newspaper

**Structure:**

```
┌─────────────────────────────────────────────────────────┐
│ MASTHEAD                                                │
│ PointCast · Mon · Apr 20 · El Segundo · LIVE (n here)   │
│                                        /for-agents →    │
├─────────────────────────────────────────────────────────┤
│ HERO BLOCK (daily pick, full card, not a chip)          │
│  Big title · dek · noun · tiny read button              │
├─────────────────────────────────────────────────────────┤
│ PULSE · n here · cc working · codex idle 2h · shipped:  │
│        /b/0335 14m ago · you were last here 3h ago      │
├─────────────────────────────────────────────────────────┤
│ GRID — block cards, newest first                        │
│  [0332] [0331] [0330]                                   │
│  [0329] [0328] [0327]                                   │
│  ...                                                    │
├─────────────────────────────────────────────────────────┤
│ DRAWERS (bottom, collapsed):                            │
│  ✎ ping   ✦ collect today   ▸ vote   ✦ contribute       │
└─────────────────────────────────────────────────────────┘
```

**What collapses:**
- StateStrip + VisitorHereStrip + FreshStrip + ComputeStrip + PresenceBar → one **PulseStrip** (single thin line)
- TodayOnPointCast (6 chips) + NetworkStrip (3 promo) → **HeroBlock** (1 big pick) + "see today's picks →" link to the grid
- PingStrip + DailyDropStrip + PollsOnHome → **ActionDrawers** (bottom, expand on tap)
- SportsStrip → moves to `/sports` as its own page (keep the work, move the surface)
- FreshDeck → moves inline with the grid (small "also worth reading" row after the first 9 cards)

**Pros:**
- First block in the grid visible within 1 mobile screen
- All current affordances preserved, just moved
- Matches Mike's directional pushes: "mood is gone from the homepage", "bench is too dense", "network almost a spot to promote things"
- Mobile feels fast

**Cons:**
- Visitors who don't scroll past the grid never see Ping / Drop / Polls / Contribute (mitigated: drawers at bottom + CoNav chips on every page)
- Sports page (`/sports`) doesn't exist yet; needs a small new route
- The HeroBlock picking logic is new — needs a daily selection heuristic (seed by date like TodayOnPointCast already does, or pick by "most-linked-today" heuristic)

**Scope:** 1 new component (HeroBlock) + 1 new component (PulseStrip) + 1 new component (ActionDrawers) + 1 new page (/sports) + index.astro rewrite + 4 strip components stay on disk but become orphans (remove imports, keep files).

---

## Option B — Three zones (incremental)

**Structure:**

```
┌─────────────────────────────────────────────────────────┐
│ MASTHEAD (as today)                                     │
├─────────────────────────────────────────────────────────┤
│ LIVE ZONE (one combined strip)                          │
│  n here · cc working · last ship 14m · last visit 3h    │
├─────────────────────────────────────────────────────────┤
│ EDITORIAL ZONE                                          │
│  · TodayStrip (6 curated picks, current shape)          │
│  · FreshDeck (3 random archive)                         │
├─────────────────────────────────────────────────────────┤
│ ACTION ZONE (tabbed surface — one thing visible at a    │
│ time, tabs switch)                                      │
│  [PING] [DROP] [POLL] [CONTRIBUTE]                      │
├─────────────────────────────────────────────────────────┤
│ GRID                                                    │
├─────────────────────────────────────────────────────────┤
│ SPORTS (kept)                                           │
└─────────────────────────────────────────────────────────┘
```

**What collapses:**
- StateStrip + VisitorHereStrip + FreshStrip + ComputeStrip + PresenceBar → one LiveStrip
- PingStrip + DailyDropStrip + PollsOnHome + link-to-contribute → one ActionTabs
- TodayOnPointCast + NetworkStrip → kept as two but visually tightened
- SportsStrip → stays on home but shorter (1 row of the most-interesting game, not 4 tiles)

**Pros:**
- Preserves more; lower cognitive-change for returning visitors
- Incremental — ship the LiveStrip first, then ActionTabs, then SportsStrip-compact in separate ticks
- No new routes required

**Cons:**
- Still a dashboard, just organized. Scroll-weight before grid is ~2.5 screens instead of ~5 — better but not newspaper-fast
- Tabs add a small amount of complexity

**Scope:** 2 new components (LiveStrip, ActionTabs) + SportsStrip compact-mode + index.astro refactor. Lower risk.

---

## Option C — Tabbed home

**Structure:**

```
┌─────────────────────────────────────────────────────────┐
│ MASTHEAD                                                │
│ [TODAY] [LIVE] [FEED] [CONTRIBUTE]   ← tab bar          │
├─────────────────────────────────────────────────────────┤
│ ONE TAB RENDERS AT A TIME                               │
│                                                         │
│  TODAY: hero block + 3 curated + daily drop             │
│  LIVE:  state + presence + compute pulse                │
│  FEED:  the block grid (default tab)                    │
│  CONT:  /contribute inlined                             │
└─────────────────────────────────────────────────────────┘
```

**Pros:**
- Most compact per-surface
- Clean information architecture — each tab answers one question
- Shareable URLs (`/?tab=live`) for deep-linking a specific view

**Cons:**
- Biggest build change — tabbed state, URL sync, CSS work
- Loses the "scroll-through-the-whole-thing" editorial feel
- Tab switching hides surfaces — visitors might miss things
- Architecturally interesting but possibly over-engineered for the site's current volume

**Scope:** Tab component + URL sync + 4 tab-panel components + index.astro rewrite. Highest risk.

---

## Recommendation — **Option A**

Reasoning:
- Your last 48h of directional pushes ("mood is gone from the homepage", "bench is too dense", "network almost a spot to promote things", "same all days", "sports still weak") all point toward fewer, bigger, more editorial.
- The CoNav bar already carries the interactive primitives across every page. The home duplicating them is the main source of bloat.
- Mobile scroll budget is the hardest constraint; A fixes it most.
- B is a reasonable fallback if you'd rather incrementally collapse.
- C is architecturally interesting but doesn't fit the site's current volume or editorial ethos.

---

## Execution plan (if Option A approved)

### Phase 1 — Collapse live signals (single ship, ~30 min)

1. Create `src/components/PulseStrip.astro` — one thin line combining: presence count (from snapshot), state dot (working / idle for cc), last-ship relative time (from ledger), time-since-your-last-visit (from localStorage `pc:visit:last`).
2. `src/pages/index.astro` — remove StateStrip + FreshStrip + VisitorHereStrip + ComputeStrip + the standalone PresenceBar in the masthead. Insert PulseStrip in their place.
3. Delete imports; leave component files on disk for future reuse or /state as a dedicated page if you want the expanded view.

### Phase 2 — Hero block + drawers (single ship, ~45 min)

4. Create `src/components/HeroBlock.astro` — renders one picked block as a full card. Picking heuristic: date-seeded deterministic random from a curated pool (same pattern TodayOnPointCast uses, pool of ~10 hand-picked hero-worthy blocks). Re-curates as blocks land.
5. Create `src/components/ActionDrawers.astro` — bottom strip with 4 collapsed drawers: ✎ ping · ✦ drop · ▸ polls · ✦ contribute. Tap expands. Ping is the PingStrip composer moved in. Drop is the DailyDropStrip moved in. Polls is PollsOnHome moved in. Contribute is a tiny link + pledge composer inline.
6. `src/pages/index.astro` — remove TodayOnPointCast + NetworkStrip + PingStrip + DailyDropStrip + PollsOnHome. Insert HeroBlock above the masthead-rule, ActionDrawers after the grid.

### Phase 3 — Sports on its own page (single ship, ~20 min)

7. Create `src/pages/sports.astro` — move the SportsStrip content into a full page (same 4 league tiles, more room to add upsets/previews/trends in later v3).
8. Remove SportsStrip from home. Add a small "↗ sports" chip in ActionDrawers or in the footer.

### Phase 4 — FreshDeck inline (small polish, ~10 min)

9. FreshDeck currently renders after the grid — tighten to a single "also worth reading" row that appears inline after the first ~9 block cards, not as its own heading.

### Phase 5 — Masthead enrich (small polish, ~15 min)

10. Single-line masthead: wordmark · date · El Segundo · tiny LIVE pill (count from snapshot) · block count · /for-agents. Kill the WalletChip on the home masthead (it lives in profile/collect flows where it's needed). Clock stays.

Total: ~2 hours across ~5 focused sprints. Each phase builds + deploys independently — no big-bang rewrite.

### Files changed (Option A, all phases)

**New:**
- `src/components/PulseStrip.astro`
- `src/components/HeroBlock.astro`
- `src/components/ActionDrawers.astro`
- `src/pages/sports.astro`

**Modified:**
- `src/pages/index.astro` (removes ~8 imports, adds ~3)
- `src/components/SportsStrip.astro` (if we keep it as a component for /sports, unchanged; if we inline, it moves to /sports.astro)

**Orphaned (stay on disk, no imports):**
- `src/components/StateStrip.astro` (may move to `/state` page later)
- `src/components/FreshStrip.astro`
- `src/components/VisitorHereStrip.astro`
- `src/components/ComputeStrip.astro` (may move to `/compute` page header)
- `src/components/PingStrip.astro` (content moves into ActionDrawers)
- `src/components/DailyDropStrip.astro` (content moves into ActionDrawers)
- `src/components/NetworkStrip.astro` (promo content moves into TodayOnPointCast pool, or disappears)
- `src/components/TodayOnPointCast.astro` (pool moves into HeroBlock picker)
- `src/components/MorningPara.astro` (already orphaned)

Net change: +4 new components, ~7 components orphaned (still on disk for reuse), 1 new page.

---

## Open questions for Mike

1. **Is Option A the right level of aggression?** If "radical collapse" feels too much, Option B is the incremental version.
2. **HeroBlock picking — editorial or algorithmic?** Mike picks today's hero each morning in a ping, OR the code picks it date-deterministically from a curated pool, OR a hybrid (Mike can override via a `pc:hero:override` KV key when he wants to).
3. **Sports: own page vs. gone entirely?** `/sports` as its own route is work. An alternative: drop the home SportsStrip, don't replace it, let people go to ESPN directly. Cleaner but loses the "ambient sports pulse" that was the original intent.
4. **PulseStrip granularity.** Should it include the /compute link + compute-pulse count, or keep it purely "is PointCast alive right now" signals (presence + working + last-visit)? My default is the minimal version.
5. **Action drawers — accordion vs. tabs?** Accordion means all four headers visible, one expanded at a time. Tabs means one selected, others hidden. Accordion is more discoverable; tabs is more compact. Default is accordion.

---

## What this doesn't touch

- CoNavigator bar — already in good shape; no changes
- Block schema / BlockCard rendering — unchanged
- JSON-LD / blocks.json / RSS / feed agent surfaces — unchanged
- /compute / /contribute / /ping / /collabs / /sprints / /workbench — unchanged
- BlockReorder mechanics — still broken per Mike's earlier ping, unrelated to this rethink

---

## Trigger

Pick A, B, or C (or a mix — "A but keep NetworkStrip") and I start Phase 1 immediately on the next tick.

— cc, 17:55 PT (2026-04-20) · plan in hand; awaiting direction
