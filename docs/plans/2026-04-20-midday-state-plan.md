# PointCast — current state + plan (2026-04-20 midday)

**Filed:** 2026-04-20 11:00 PT by cc · supersedes stale plan panel (that one was from a 2026-04-16 session about mobile trim + nouns fix + whimsical drop — all shipped days ago).

---

## Current state (what's actually live)

### Production — pointcast.xyz (deploy `632ff9f2`, branch `main`, 2026-04-20 10:58 PT)

**New today:**
- `/here` — live congregation page. Real presence DO. Renders visitors connected now as noun avatars. Works. Confirmed a first real human on snapshot just now (`{humans:1, agents:0, sessions:[{nounId:1109,...}]}` — that was you).
- `/for-nodes` — "become a node" landing page. 2-line agent-broadcast snippet. Registry of cc + codex + mike.
- `/api/presence/snapshot` — HTTP snapshot of the DO state, 5s edge cache.
- `/clock/0324` — live world clock, reads from updated collaborators roster (Mike El Segundo, cc/codex/manus cloud→UTC) + manual NYC + Tokyo zones from block 0324.
- `/collabs` — Taner removed; new "Ways to contribute" section with 6 concrete paths (node / guest block / federate / host local / donate compute / seed polls).
- Blocks `0320`–`0327` — 8 new editorial blocks (pace+identity reflection, release sprint announcement, Codex unblock status, overnight ship reflection, Collab Clock directive, Kimi K2.6 field note, Qwen 3.6 Max Preview, Presence DO online milestone).
- Polls `how-to-contribute` and `ai-lineup-vibe` — poll pool now 19.
- `src/lib/multiplayer.ts` — shared base class for future Pulse + YeePlayer v1 rooms.
- `src/lib/nodes.ts` — owned-agents registry.

**Infrastructure:**
- `pointcast-presence` Worker (separate Cloudflare Worker, `workers/presence/`). Hosts the `PresenceRoom` Durable Object. Pages binds to it via `script_name`. First time the DO has actually been live — months-long deferral closed today.
- Codex MCP integration live. `mcp__codex__codex` + `mcp__codex__codex-reply` are usable tools. Config in `~/Library/Application Support/Claude/claude_desktop_config.json`.

### Codex queue (3 shipped / 10 briefed)

| # | Brief | Status |
|---|-------|--------|
| 1 | Pulse (tap-tempo) | ⏳ queued · ready to fire — `multiplayer.ts` shipped |
| 2 | STATIONS on /tv | ✅ shipped |
| 3 | YeePlayer v1 multiplayer | ⏳ queued · ready to fire |
| 4 | TrackLab (YouTube → beats) | ⏳ queued · substantial scope |
| 5 | VideoLens (analysis API) | ⏳ queued · largest |
| 6 | Presence DO upgrade | ✅ shipped (enriched broadcasts) |
| 7 | /here congregation | ✅ shipped (hybrid: Codex backend + cc UI + cc DO-worker deploy) |
| 8 | Multiplayer primitive | ✅ shipped (cc wrote — Codex aborted pre-write twice) |
| 9 | Audio-input YeePlayer | ⏳ queued |
| 10 | Analytics + share cards | ⏳ queued · needed for launch-week ops |

### Cumulative session counter

**49 shipped** today (28 cron + 22 chat including the DO-worker-online milestone).

### What's blocked + on whom

| What | Blocked on | Nature |
|------|-----------|--------|
| Identity arc (Phase 1) | Mike · 4 decisions | URL (`/profile` / `/you` / `/me`), non-wallet visitors policy, handle visibility, sequencing |
| Launch week dates | Mike · confirm | Tue 04-22 → Mon 04-27 cadence: PH + HN + Farcaster + X + Nouns |
| Jason outreach | Mike · ready to send decision | Note drafted; `/for-nodes` live as destination. Mike's "no hurry" noted |
| Whimsical extension | Mike · install desktop app | No `/Applications/Whimsical` — extension proxy can't find localhost:21190 bridge |
| Manus kickoff (M-1 platform matrix, M-2 email routing, M-3 Resend) | Mike · dispatch from Manus chat | cc can't drive Manus programmatically |
| Codex parallel experiment | Mike · nod | cc's proposal: fire 3 atomic sub-briefs concurrently, measure conflict/overlap, decide whether to scale |
| DAO / rotation decisions | Mike · pick | Daily-drop rotation: sequential vs KV-lock vs hash-shuffle |
| Zone redesign | Mike · 4 decisions | Home-page consolidation (still open from 2026-04-19 evening) |

### Known caveats / tech debt worth naming

1. **Branch default fixed this tick.** All future deploys from my end will include `--branch=main`. Still worth baking into a `scripts/deploy.sh` so no one else trips on it either.
2. **Massive uncommitted diff.** `git status` shows ~80 modified + 100+ untracked files from this session's work. Needs a commit-hygiene pass — authored as `codex` where Codex wrote, `cc` where cc wrote, with proper source citations. Probably best to split: one commit for Brief #6 (Codex), one for Brief #7 (hybrid), one for DO-worker deploy, one for cc-only ships (blocks, polls, contribute paths).
3. **Branch `feat/collab-clock` is ahead of `main` by session's worth of commits** implicitly via the preview deploy history. Local git history is still on `main` at commit `7079974` (Codex's stations mode) + `addf6e5` (presence enrich). After commit hygiene, `feat/collab-clock` either gets fast-forwarded or deleted; pick during commit pass.
4. **MCP timeout (~60s) is a hard ceiling.** Codex's `xhigh` reasoning + any upfront reading blows past it. Working pattern: reduce to `medium` reasoning + one atomic file per turn. Codex's writes persist across MCP timeouts (the stdio subprocess keeps executing). Larger refactors → cc directly.
5. **CDN cache.** Cloudflare edge cached `/collabs/` for some minutes after the production deploy swap. `?cb=<ts>` bypasses; normal revalidation catches up. Worth flagging to anyone looking at immediate-post-deploy state.

---

## Plan (forward)

Four horizons. Each item is small enough to be a tick.

### Horizon 1 — right now (this afternoon, cc + Codex)

**Highest-leverage next moves, in order:**

1. **Codex parallel experiment** (30 min). Fire 3 atomic sub-briefs in one MCP message: `src/lib/analytics.ts`, `functions/api/pulse.ts` (extends multiplayer.ts), `src/lib/audio-onset.ts`. Measure: do concurrent sessions land without stepping on each other? If yes → that's the scaling pattern. If no → need git worktrees, file that as a follow-up.

2. **Commit hygiene pass** (15 min). Break today's uncommitted work into 4-5 authored commits (Codex, cc, hybrid, infrastructure). Preserves real attribution + makes `git log` honest.

3. **/models aggregation page** (45 min). Definitive AI-resource page: Claude, Codex, Gemini, Kimi K2.6, Qwen 3.6 Max, GLM, DeepSeek, Llama, Grok. Pull the data from collaborators.ts where they're already entries + extend. Candidate for a cc-authored sprint OR a Codex brief split across 2-3 atomic turns.

4. **Whimsical fix** (Mike-side, ~2 min). Install Whimsical desktop app from whimsical.com. cc verifies MCP reconnects after Claude restart.

5. **Kick Manus M-1** (Mike-side). Platform matrix row-filling in Manus chat. Unblocks launch ops.

### Horizon 2 — today + tonight

**Codex queue progression**:
- Brief #1 Pulse (tap-tempo) — fire the atomic sub-briefs: Pulse DO, /pulse page, phone controller.
- Brief #9 Audio-input YeePlayer — mic onset detection lib + YeePlayer opt-in.
- Brief #10 Analytics + share cards — launch-ops infrastructure.

**cc parallel work**:
- /models page ship.
- Identity arc Phase 1 kickoff (*pending Mike's 4 decisions*).
- A couple more polls, rotate the home-page freshness.

**Content**:
- Block reflecting on today's presence-DO-finally-online + Codex MCP milestone (likely written end-of-day as an editorial).
- Jason note finalization (*pending Mike*).

### Horizon 3 — rest of the week (Tue 04-21 → Fri 04-24)

**Working assumption: public launch Fri 04-24 or Mon 04-27.** Confirm with Mike.

- **Tue 04-21**: identity arc (if unblocked), Codex queue to 6/10, /models live, /workbench primitive scoped.
- **Wed 04-22**: Codex queue to 7-8/10 (Pulse + YeePlayer v1 both live), analytics beacon wired, share cards generated, /workbench shipped, Manus platform matrix done.
- **Thu 04-23**: launch-week rehearsal. Farcaster Frame unfurl test, iMessage + Slack + Twitter preview tests. Email deliverability verified (via Manus M-2/M-3). Lightning-round content pass on /home above-the-fold + any content gaps in /ai-stack + /models.
- **Fri 04-24**: LAUNCH. Product Hunt + Farcaster + X + Nouns + HN over the day. cc on active-response duty; Mike on editorial + social.

### Horizon 4 — post-launch (week of 04-27)

- Measurement — what landed where, which surfaces got traffic, which surfaces didn't, which external agents actually came and broadcast.
- /workbench iteration — persistent "what's being built right now across nodes" surface, paired with /here (ephemeral presence).
- Post-launch polish — fix bugs surfaced by real traffic, improve fast-path for any surface that got emphasis, kill anything nobody looked at.
- Codex briefs #4 TrackLab and #5 VideoLens — defer until post-launch unless they become launch narrative.

---

## Open questions awaiting Mike

1. **Identity arc decisions × 4** — URL, non-wallet, handle, sequencing.
2. **Launch date confirm** — Fri 04-24 vs Mon 04-27 vs slide a week.
3. **Codex parallel experiment** — green-light to try 3 concurrent MCP sessions on atomic sub-briefs?
4. **Commit strategy** — preserve-as-codex-commits vs batch-as-cc-commits vs squash? cc's default: preserve attribution by author.
5. **Jason note** — content alignment before sending.
6. **Manus** — when you dispatch M-1 through M-4 in Manus chat, cc will track status via filesystem.
7. **`/models` page** — cc-solo build, or split into Codex sub-briefs? cc can ship solo in ~45 min.
8. **Merging `feat/collab-clock` → `main` in git** — OK to fast-forward during commit hygiene pass?

---

## Ownership cheatsheet

| Who | Does what | Can be driven by |
|-----|-----------|------------------|
| **cc** (Claude Code) | orchestration, editorial voice, UI + client state, build + deploy, tick retros, file reads + small edits | itself |
| **Codex** (OpenAI gpt-5.4) | backend refactors, DO-style code, atomic file writes, architecture docs | cc via MCP (with ~60s ceiling) |
| **Mike** | editorial anchor, direction, external outreach, gate on decisions that change surface, Manus dispatch, DAO ratification | himself; chat |
| **Manus** | ops execution, launch-week checklists, email setup, GSC / IndexNow, objkt curation | Mike via Manus chat |

---

— cc, 11:00 PT · this doc supersedes the stale Plan panel content. If Mike wants to push this into the Plan UI panel, copy the markdown; otherwise it lives here as the single source of truth.
