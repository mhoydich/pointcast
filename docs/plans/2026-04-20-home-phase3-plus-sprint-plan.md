# Home Phase 3 + rest-of-sprint + ChatGPT operationalization

**Trigger:** Mike 2026-04-20 20:34 PT: *"the home page, lets keep trying to improve there, as next, make plan, and then i'll compact and then we'll begin, add thoughts on rest of sprint and getting chatgpt to go, we still have so much compute to use in next two days."*

**Written by:** cc, end of Sprint 2 Night 1.
**Survives:** compaction. All paths absolute within repo; all ship refs concrete.
**Context:** 48h compute burn runs through ~Thursday 2026-04-22 weekly reset. Tonight's ships already landed (deploys bab8cc2f → b5030bed covering Sprint 2 Night 1 + the bath/cos/play wave). Home is noticeably better; not done.

---

## Part 1 · Home Phase 3 — more collapse toward newspaper

**Goal:** first mobile viewport shows masthead + HeroBlock + 1 signal line + the first block card. Today: 2-3 strips still sit between HeroBlock and the grid.

**Inventory of remaining strips on home (after Phase 1 + 2):**

| Strip | Status | Move |
|---|---|---|
| Masthead | **keep** | already minimal |
| HeroBlock | **keep** | the editorial headline |
| PulseStrip | **keep** | the one-line signal |
| PingStrip | **remove** | already in ActionDrawers (ping drawer). Redundant inline. |
| NetworkStrip (PROMOTE) | **move** | into a 3-chip row *inside* TodayOnPointCast OR delete (promo surface duplicated by HeroBlock pool selection) |
| ComputeStrip | **remove** | PulseStrip already shows compute activity via last-ship + next-ship. ComputeStrip = redundant. /compute is one click away |
| TodayOnPointCast | **trim** | from 6 chips to 3; cut "also today" line |
| DailyDropStrip | **remove** | already in ActionDrawers (drop drawer) |
| SportsStrip | **move** | to `/sports` dedicated page; add chip to TodayOnPointCast rotation |
| PollsOnHome | **remove** | already in ActionDrawers (polls drawer) |
| FreshDeck | **inline-ize** | "also worth reading" row after first 9 grid cards, not its own heading |

**Net result on home (top-to-bottom after Phase 3):**

1. Masthead (wordmark · date · presence · for-agents)
2. HeroBlock (big editorial pick)
3. PulseStrip (1-line: here · cc/codex/manus/chatgpt dots · last ship · next · you)
4. TodayOnPointCast (3 chips of today's picks)
5. BlockReorder grid (the main event)
6. FreshDeck inline ("also worth reading" row)
7. ActionDrawers (ping · drop · polls · contribute)
8. Footer endpoints

**Mobile scroll budget target:** first grid card visible within **1.3 viewport heights** (current: ~2.5).

**Ship plan (Phase 3, ~1.5h):**
- Edit `src/pages/index.astro` — remove `<PingStrip />`, `<ComputeStrip />`, `<DailyDropStrip />`, `<SportsStrip />`, `<PollsOnHome />` from inline flow. Move SportsStrip to a new `src/pages/sports.astro` (or stash inside ActionDrawers polls drawer).
- Edit `src/components/TodayOnPointCast.astro` — `slice(0, 3)` instead of 6 + tighten kicker copy
- Create `src/pages/sports.astro` that imports + renders SportsStrip as its own page
- Either delete `<NetworkStrip />` (its promo rotation is already subsumed by HeroBlock's curated pool) OR keep + inline-ize

**Files touched:** index.astro (1), TodayOnPointCast.astro (1), new sports.astro (1), maybe NetworkStrip component deletion or inline move.

---

## Part 2 · Rest of sprint (48h compute burn) — ranked queue

Everything below is shippable in the remaining ~48h against the weekly compute cap. Prioritized by visitor-impact × compute-efficiency.

### Tier 1 — ship tonight/tomorrow morning (~6h total)

1. **Home Phase 3 collapse** (per Part 1 above) · 1.5h · cc
2. **BlockReorder debug via Chrome MCP mobile emulation** · 1h · cc. Chrome MCP is now loaded; I can open pointcast.xyz in an emulated iPhone tab, try to arrange, capture what's actually broken. Honest result either way.
3. **McKinsey agentic-org block** (ping `025b79e0`) · 30min · cc. Fetch via Chrome MCP since raw WebFetch gets timeouts, transform into /b/0339.
4. **Twitter `zostaff` block** (ping `a3811d08`) · 30min · cc. Same path — Chrome MCP open x.com, extract tweet content, transform into /b/0340.
5. **Drum upgrades** · 1.5h · cc + Codex parallel. Add leaderboard (localStorage-shared via a tiny KV surface or just local), shareable rhythm receipt URLs (`/drum/rhythm/{n}`), one new upgrade tier (rim-shot at 50k beats). Codex does the atomic bits; cc integrates.
6. **Manus poster via Chrome MCP** · 45min · cc. Open manus.im, check if Mike's signed in, compose a Bell Labs × Rothko poster task. If blocked by auth → stop, report, queue for Mike to paste the brief manually.

### Tier 2 — tomorrow (~5h)

7. **Google sign-in stub** (ping `e46e2d24`) · 1.5h · cc. `functions/api/auth/google/start.ts` + callback + session cookie. Just the stub + the UI affordance; full identity-merge deferred.
8. **`/briefs` page** · 45min · cc. Public surface listing every open brief for Manus/ChatGPT with status. Mike can paste from it into external sessions. Also lists briefs already shipped.
9. **Topical block wave** — 2-3 current-event blocks on AI labs landscape, hemp-THC November window update, Tezos news · 2h · cc.
10. **`/now` refresh** · 45min · cc. Lighter surface, less dashboard, more newsroom. Reuses agent dots + recent ledger.

### Tier 3 — if compute remains (~4h)

11. **Cadence autonomous dispatcher** (`functions/cron/cadence-tick.ts`) · 2h · cc. Deferred in the pivot, worth re-enabling if budget allows.
12. **Hello@pointcast.xyz email routing** · 30min · Cloudflare Email Routing via the dashboard (Mike does this, not cc).
13. **Favicon .ico rasterization** · 30min · cc. Generate via sharp-via-npx or an inline canvas trick. Stop relying on browsers hitting the SVG fallback.
14. **PrizeCast ghostnet wiring + /collect/prize move** · 1h · cc. PrizeCastChip already live in block 0334; this is the advanced surface behind it.

**Total tier 1+2+3 budget:** ~15h spread over 48h wall clock. Fits comfortably within remaining weekly bucket (Mike at ~48% used earlier; fresh capacity at xx:00 hourly marks too).

---

## Part 3 · ChatGPT operationalization

**Current state:** one brief written (drum-cookie-clicker at `docs/briefs/2026-04-20-chatgpt-drum-cookie-clicker.md`). Never handed off. cc shipped drum directly, so the brief is now redundant. ChatGPT hasn't touched the repo yet.

**Why it's hard:**
- No official MCP server for ChatGPT the orchestrator can call the way it calls Codex MCP
- ChatGPT Agent can write code in a sandbox + open PRs on GitHub, but that requires a session Mike starts manually
- OpenAI Responses API exists but Claude Code → OpenAI API → diff → PR is a lot of plumbing for marginal gain

**Three operationalization paths, ranked:**

### Path A — brief-then-paste (zero infra, works today)

cc writes a tight brief in `docs/briefs/{date}-chatgpt-{task}.md`. Mike opens ChatGPT (web, iOS app, or ChatGPT Agent), pastes the brief, ChatGPT ships, opens a PR or commits a diff, cc reviews + merges. Uses Mike's ChatGPT Max quota directly.

**Pros:** zero infra, works today, clean handoff record in `docs/briefs/`.
**Cons:** Mike is the bottleneck — the brief sits until he pastes it.

**When to use:** creative UX work, big-picture refactors, anything visual where ChatGPT's code-plus-image-gen helps. Not for atomic ships (Codex is better for those).

### Path B — build a ChatGPT shim like manus-mcp (~2h, ships real ChatGPT-via-MCP)

Mirror `tools/manus-mcp/`: create `tools/chatgpt-mcp/` — a stdio MCP server that wraps OpenAI's Responses API with the `gpt-5` model + web + code-interpreter tools. Two MCP tools:
- `chatgpt_run_task(prompt, files?, tools?)` — creates a Response, polls, returns final
- `chatgpt_task_status(response_id)` — checks existing

Config via env vars: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-5`), etc.

**Pros:** once installed (`claude mcp add chatgpt -- node …`), future cc sessions can delegate to ChatGPT on your OpenAI API quota (NOT your ChatGPT Max plan — separate billing).
**Cons:** bills against OpenAI API credits not ChatGPT Max plan. 2h to build + test.

**When to use:** if OpenAI API credits are cheaper than compute otherwise, or when ChatGPT's model is better-suited than Claude/Codex for a specific task. Probably underutilized vs. Codex for PointCast's code shape.

### Path C — Chrome MCP driving chatgpt.com (~30min to validate, brittle routine use)

Use Chrome MCP to open chatgpt.com in Mike's browser, paste the brief, read the response, save the diff. Same pattern as the proposed Manus-via-Chrome approach.

**Pros:** uses ChatGPT Max plan directly. Pretty feasible.
**Cons:** brittle — any UI change breaks the flow. Not great for automated routine work. Fine for one-offs.

**When to use:** when path A's latency is unacceptable and path B's API billing isn't desired.

### Recommended mix

- **Path A by default** — use ChatGPT for work that benefits from its creative/visual strengths. Queue via `docs/briefs/`; Mike paste-handoff.
- **Path B if Mike wants** — 2h sprint to build `tools/chatgpt-mcp/` parallel to manus-mcp. Useful if we expect to fire ChatGPT frequently from future cc sessions.
- **Path C as one-off** — use for the Manus poster task tonight if cc can drive it via Chrome MCP without Mike's intervention.

### Specific next briefs queued for ChatGPT (Path A)

- **Poster: Bell Labs × Rothko × El Segundo** (from ping `114b4636`). Creative visual work; ChatGPT Agent with image-gen is the right fit. Draft brief + Mike pastes.
- **Drum rhythm-receipt share surface** (`/drum/rhythm/{n}`). Not atomic enough for Codex; creative-visual for ChatGPT.
- **Home Phase 3 HeroBlock refresh** — once shipped, a designer's pass on HeroBlock aesthetics (typography, spacing, rotation animation). ChatGPT-visual territory.

---

## Part 4 · Decisions Mike owes before compaction

1. **Home Phase 3 — go with the collapse plan above?** (default: yes)
2. **Bar size** — keep B (current 56/64) or tune to slim / taller?
3. **ChatGPT path** — A default + Path B build tonight, or A only?
4. **Tier 1 order** — Home Phase 3 first, then topical blocks + drum + Manus? Or something else first?
5. **Sports page** — yes to `/sports` dedicated route (tier-1 #1 sub-deliverable), or just remove from home without a page?

Default if silent: home Phase 3 first, bar stays at B, Path A + B in parallel, tier 1 in listed order, /sports page gets built.

---

## Part 5 · What survives compaction

After Mike compacts the context, any future cc session can resume by reading:

- **This file** — the plan
- **`docs/sprints/2026-04-20-sprint2-night1.md`** — the retro of what shipped tonight
- **`docs/briefs/2026-04-20-codex-sprint-next.md`** — the Codex brief (all 4 shipped)
- **`docs/setup/codex-full-blast.md`** — the Codex CLI install guide for Mike
- **`tools/manus-mcp/README.md`** — the Manus shim install guide
- **`src/lib/compute-ledger.ts`** — every ship tonight is a row (discipline holds)
- **`src/lib/ship-queue.ts`** — the 15-min cadence queue with tonight's completions

Session-start read (per strengthened AGENTS.md):
```
curl -s 'https://pointcast.xyz/api/ping?action=list' | jq '.entries[-5:]'
ls docs/inbox/
cat docs/plans/2026-04-20-home-phase3-plus-sprint-plan.md  # this file
```

---

— cc, 20:40 PT (2026-04-20) · plan written before compaction so the next cc session starts knowing where we are
