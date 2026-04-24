# State of the site · 2026-04-24 afternoon PT

**Audit by:** cc (Claude Code)
**For:** Mike
**Requested:** "whats a super audit about current state, overall happy and in no hurry"

Honest read of everything shipping, everything sitting, everything broken, everything waiting on a human hand.

---

## 1. What's healthy and ripping

- **Autonomous cadence is alive.** Sprints 16–29 shipped over the last ~20 hours (overnight run 16–21 while you slept, morning run 22–29 while you were up and pinging). Nineteen PRs squashed to main. No rollbacks. No bad deploys.
- **The site is stable.** Cloudflare Pages green across every deploy. `pointcast-presence` Worker stable (Room Phase 2 shipped Sprint 16, still running). DO broadcast tick self-adapts 100ms → 1s.
- **Agent surfaces are complete.** `/for-agents`, `/agents.json`, `/wire`, `/scoreboard`, `/taproom`, `/wire.json`, `/scoreboard.json`, `/taproom.json`, `/api/wire-events` MCP tool shape — all live, all cached, all CORS-open.
- **Daily race is actually running.** Front Door race is OPEN right now (2026-04-24 00:00 → 23:59 PT). Arrival + engagement clock on every homepage load. Submit endpoint accepts. Leaderboard returns the graceful `kv-unbound` state until Mike provisions `PC_RACE_KV`. Flow is end-to-end working.
- **Cursor room default-on.** Every visitor sees their own Noun on the cursor. Peers appear when two browsers open the same URL.
- **Hour + mood + weather on the masthead.** Three axes of "today" layered on a 6–8px sky strip: time-of-day gradient (base), mood accent (live on MoodChip click), live El Segundo conditions from Open-Meteo (15-min cache).
- **Caching fixed.** `no-cache` header + `FreshnessChip` detector mean normal Cmd+R now gets fresh HTML. No more hard-refresh tax.
- **8 breweries, 27 beers live** on `/taproom` — hand-curated, editable JSON, featured flags, availability tags. Not scraped; won't age out silently.

## 2. What Mike provisions when you're ready

Everything works with graceful-no-op fallbacks, so none of these are urgent. But bindings unlock specific behaviors:

| Binding | CLI | Unlocks |
|---|---|---|
| `PC_RATES_KV` | `npx wrangler kv namespace create "PC_RATES_KV"` | Enforced rate limiting on `/api/talk`, `/api/wire-events`, `/api/race/{slug}/submit`, `/api/race/{slug}/leaderboard` — otherwise advisory-only |
| `PC_RACE_KV` | `npx wrangler kv namespace create "PC_RACE_KV"` | Front Door race submissions start persisting; leaderboard populates |
| `TALK_AUDIO` | CF dashboard → R2 bucket `pointcast-audio` → bind as `TALK_AUDIO` | Voice Dispatch Phase 3 write path goes live (still behind `if (false)` flag pending Q7/Q8) |

Paste the returned ids into `wrangler.toml` (scaffolds are commented in place), commit, push. Rate limit + race persistence start working on the next deploy.

## 3. On-chain / Tezos items waiting for you

- **Visit Nouns FA2** (`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`) — admin is still the throwaway signer `tz1PS4W…`. Runbook at [`docs/plans/2026-04-24-admin-transfer.md`](../plans/2026-04-24-admin-transfer.md). One `node scripts/transfer-admin.mjs` moves admin to your main wallet.
- **Prize Cast** — contract written (`contracts/v2/prize_cast.py` 463 lines). Never compiled. Tactical runbook at [`docs/plans/2026-04-24-prize-cast-spec.md`](../plans/2026-04-24-prize-cast-spec.md). Three decisions (compile path, baker delegate, initial cadence).
- **Passport Stamps** — one-pager at [`docs/plans/2026-04-24-passport-stamps.md`](../plans/2026-04-24-passport-stamps.md). Path A (KV-only MVP, 2 wks) vs Path B (FA2 from day one). 7 open questions.
- **Drop 001** — 4 pieces staged at `/drops/001`, 4 blocks live (0340–0343). Awaiting your image uploads + contract decision.

## 4. Open PRs (9 right now)

| # | Title | Author | State | Read |
|---|---|---|---|---|
| #58 | Agent Derby v3 — stables, fandom, daily races | codex | OPEN | Freshly pushed by cc. Review visual first. Adds home module. |
| #39 | fix(here-grid): footprint + edge-chip CSS | cc | OPEN | Small. 1 commit ahead, unrelated bugfix from last night. Fine to merge or close. |
| #33 | feat(rcs): collection page for randomly common skeles | ? | OPEN | External — not cc. Unclear context. |
| #26 | Agent Derby photo-finish margins | codex | OPEN | Superseded by #58's v3. Can close. |
| #22 | Add playable Agent Derby UI | codex | DRAFT | Superseded by #58. Can close. |
| #18 | Race System RFC 0002 + /race + /race/front-door (Phase 1) | cc | OPEN | Mike's to bless. My Sprint 25 shipped a minimal version of `/race/front-door` that WILL conflict with this PR on merge. If you merge #18, take #18's richer shell and port my live-hydration script into it. |
| #17 | Voice Dispatch scaffolds + /typing tutor | cc + codex | DRAFT | Folded into shipped work. Can close. |
| #2 | Sprints 1-6: zeitgeist map + sky clock | cc | OPEN | Super old. 2 days back. Mostly superseded by later work. Recommend close. |
| #1 | Manus all seven collab paths | manus | OPEN | Stale since 2026-04-21. Needs a "close with note / rebase / poke Manus" call. |

**Recommended clean-up:** close #2, #17, #22, #26 (all superseded). Make calls on #18, #33, #39, #1. Merge #58 after visual review.

## 5. Known bugs / confusing bits

From your screenshot + observations today:

- ✅ **FreshToday `\u2192` / `\u00B7` literal escape** — fixed Sprint 29 (PR #59)
- ✅ **AgentLedger rows run-together** — fixed Sprint 29 (is:global CSS)
- ✅ **FreshnessChip dismiss showing `\u00D7`** — fixed Sprint 29
- 🟡 **Games confusing + broken** — brief for Manus at [`docs/briefs/2026-04-24-manus-games-qa.md`](../briefs/2026-04-24-manus-games-qa.md). 11 surfaces to sweep. Your call when to kick it off.
- 🟡 **Codex's watcher re-injects** into the working tree while cc works — agent-derby v0.5 + Kowloon kitchen. Landed as PR #58 (Codex v3) today; the Kowloon work still uncommitted. Worth a coordination with Codex about when their watcher writes vs. when cc writes.
- 🟡 **The Gamgee front-door band** (the "PointCast is an agent-native broadcast" section) reads static. FreshToday below it helps. A redesign toward a "live worlds rail" feels right per your lofi-cat-girl / Zed Run reference — I'd draft a layout sketch first before building.

## 6. What's on main right now

- **128 blocks** live on prod (132 in src; 4 drafts or tooling blocks)
- **11 open channels** (FD, CRT, SPN, GF, GDN, ESC, FCT, VST, BTL + whatever Codex has added locally)
- **19 top-level routes** surfaced on the home + /for-agents manifest
- **3 RFCs** — 0001 Voice Dispatch, 0002 Race System (both have unanswered open Qs)
- **2 external satellite apps** — MoodyGold, Offbalance (on `pointcast-apps.ts`)
- **Last ship on prod:** `0d12c11 fix(home): visible render bugs + cursor on by default (#59)` — 12 min ago

## 7. What Mike's seeing that isn't on prod

Your screenshot showed:
- 174 blocks (prod has 128)
- Block 0381 "How agents plug into PointCast — WebMCP, MCP shims, federation"
- TOP OF THE MORNING · 3 FRESH · AUTO-CURATED section
- PULSE · 1 here · cc · codex · manus · last ship 3d ago / you 1m back
- PROMOTE · contribute · 5 ways to add compute to PointCast
- FooterBar chips: HERE · DRUM · ND · PING · **COS** · TV · ? · ≡ · ×

None of that is on `main`. Most likely source: a local dev server (`npm run dev`) or the `pointcast-codex-derby-v3` worktree at `http://127.0.0.1:4183/`. Translation: you have a lot of un-pushed-to-main work sitting on your machine. Worth a status check — run `git branch -a | grep -v origin` across `~/pointcast`, `~/Documents/pointcast-*` to see what's inflight.

## 8. What I'd do next (suggestions, not claims)

Priority-sorted, ship small and check with you after each:

1. **Kick off the Manus games-QA** brief. 60–90 min of their time, real signal back to us. Unblocks confidence on game lane.
2. **Close the stale PRs** (#2, #17, #22, #26). Clean the queue before it rots more.
3. **Decide on #58 (Derby v3)** — visually review, merge or adjust.
4. **Decide on #18 (Race Phase 1)** — merge or rebase + merge. Unlocks full `/race` hub.
5. **Provision `PC_RACE_KV`** — one command. Race persistence goes live.
6. **Draft the Gamgee-band redesign sketch** — design-only, static HTML, so you can react to layout before code ships.
7. **Admin transfer** when ready — blocks Drop 001 + Prize Cast mainnet + anything new that wants Mike's main as admin.

None of this is on fire. Everything has a graceful default. Sit with it.

## 9. Overall

Site is in the best shape it's been in. Humans coming in see a timely home (hour + mood + weather breathing), a live daily race, a fresh live ticker, a taproom, a cross-agent scoreboard, and the cursor-room default on so they have something to play with immediately. Agents coming in get the same plus five new JSON surfaces and a WebMCP tool hook. Codex is shipping the tezos-bakery + kowloon thread in parallel without stepping on my lane.

Things that would make it more itself:
- The Gamgee band wanting a redesign toward small-world tiles
- Font direction — started today on the hero serif swap
- Daily race rotation going beyond today's window (cron)
- Signal + moderation if `/api/talk` actually stores audio

Not pressing. Good afternoon shape.

---

_filed by cc at ~12:10 PT 2026-04-24 on Mike's ask_
