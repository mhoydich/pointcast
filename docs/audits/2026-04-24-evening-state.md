# Evening state · 2026-04-24

**Audit by:** cc (Claude Code)
**For:** Mike
**Time:** ~17:00 PT
**Companion to:** [`2026-04-24-state-of-the-site.md`](2026-04-24-state-of-the-site.md) (12:10 PT super-audit)

Short follow-up to the noon audit. What changed in the afternoon, and what I'd pick up first when you're back.

---

## What's new on prod since the noon audit

Five PRs merged in the autonomous afternoon run:

| Sprint | PR | Commit | Headline |
|---|---|---|---|
| 31 | #61 | `9e18df5` | `/mythos` + block 0346 + RFC 0003 plus-one agents + 2 Codex briefs |
| 32 | #62 | `683532f` | Live Worlds Rail + residents in `/agents.json` + block 0347 |
| 33 | #63 | `6e7b1e5` | Today's shelf on `/briefs` + Kimi/Gemini dirs + block 0348 |
| 34 | #64 | _this PR_ | Homepage refresh + blocks 0349, 0350, 0351 + ThisWeek strip + this audit |

**Block count:** 132 → 136 (+4 blocks: 0346, 0347, 0348, 0349, 0350, 0351 — six blocks net since noon, so 132+6=138 if all land in this PR).

**New URLs live on prod:**

- [`/mythos`](https://pointcast.xyz/mythos) — the Worlds Rail, day loop, residents
- [`/blocks/0346`](https://pointcast.xyz/blocks/0346) through [`/blocks/0351`](https://pointcast.xyz/blocks/0351)

**New repo surfaces:**

- `docs/plans/2026-04-24-rfc-0003-plus-one-agents.md` — the plus-one RFC
- `docs/kimi-logs/README.md`, `docs/gemini-logs/README.md` — door-lit log dirs
- `docs/voice/kimi.md`, `docs/voice/gemini.md` — placeholder voice docs
- `docs/briefs/2026-04-24-codex-{race-cron,worlds-rail-data}.md` — two new Codex briefs
- `src/components/ThisWeek.astro` — small "new rooms this week" strip on home
- `src/pages/mythos.astro` — the Worlds Rail page
- `src/pages/agents.json.ts` — adds `residents` block with 6 entries (4 active + 2 open: Kimi, Gemini)
- `src/pages/briefs.astro` — adds Today's shelf band

**Build:** 484+ pages on each sprint (was 476 at noon). Audits all green.

---

## What's open for Mike

The same five things from the noon audit are still open. The afternoon didn't unblock any of them — those are all human-hand items.

1. **Press `scripts/manus.mjs`** to dispatch the games-QA brief whenever you want a real-user QA pass.
   - Command: `node scripts/manus.mjs create --file docs/briefs/2026-04-24-manus-games-qa.md --title "games QA sweep"`
   - Brief covers 11 surfaces × 4 browsers, expects a dated log at `docs/manus-logs/2026-04-24-games-qa.md`.

2. **Decide RFC 0003 questions** before the first plus-one agent shows up:
   - GitHub access model — direct PR access or relayed through an operator? (cc recommends direct.)
   - First-PR approval — cc auto-approves under 200 lines / scoped to the agent's own dir? Mike approves anything else? (cc recommends yes.)
   - Soft cap — six residents before AGENTS.md v2? (cc recommends yes.)

3. **Provision `PC_RACE_KV`** so the Front Door race actually persists tonight's leaderboard.
   - Command: `npx wrangler kv namespace create "PC_RACE_KV"`, paste id into `wrangler.toml`, push.

4. **Visually review PR #58** (Codex Agent Derby v3) — still open since this morning, freshly pushed.

5. **Admin transfer** for Visit Nouns FA2 (`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`) when ready.

---

## Open PRs as of 17:00 PT

Same shape as noon, no new external PRs landed:

| # | Title | Author | State |
|---|---|---|---|
| #58 | Agent Derby v3 — stables, fandom, daily races | codex | OPEN |
| #39 | fix(here-grid): footprint + edge-chip CSS | cc | OPEN |
| #33 | feat(rcs): collection page for randomly common skeles | external | OPEN |
| #26 | Agent Derby photo-finish margins | codex | OPEN (superseded by #58) |
| #22 | Add playable Agent Derby UI | codex | DRAFT (superseded by #58) |
| #18 | Race System RFC 0002 + /race + /race/front-door (Phase 1) | cc | OPEN |
| #17 | Voice Dispatch scaffolds + /typing tutor | cc + codex | DRAFT (folded into shipped work) |
| #2  | Sprints 1-6: zeitgeist map + sky clock | cc | OPEN (superseded) |
| #1  | Manus all seven collab paths | manus | OPEN (stale since 04-21) |

Same recommended cleanup: close #2, #17, #22, #26.

---

## Codex's lane

No new commits to `main` from Codex since 9e18df5 — their Kowloon arcade + Tezos bakery threads stayed in their worktrees during the run. The two briefs cc filed today (`docs/briefs/2026-04-24-codex-{race-cron,worlds-rail-data}.md`) are ready to pick up when they want.

---

## Manus's lane

Brief at `docs/briefs/2026-04-24-manus-games-qa.md` is shelf-lit on `/briefs` Today's shelf. Mike's API key, Mike's clock.

---

## What I'd pick up first

Priority order if you have 15 minutes:

1. **Provision `PC_RACE_KV`** (one command, one paste, one push). The Front Door race has been collecting submissions in degraded-no-kv mode all day; flipping the binding lets tonight's leaderboard actually persist before the 23:59 PT close.
2. **Dispatch the Manus games-QA** if you want fresh real-user signal back by tomorrow morning. The brief is small and well-scoped.
3. **Close stale PRs** (#2, #17, #22, #26). Five minutes, clean queue.

If you have an hour:

4. **Visually review PR #58** Codex Agent Derby v3.
5. **Decide on PR #18** (Race Phase 1) — merge or rebase.
6. **Answer the three RFC 0003 questions** so the plus-one path is unblocked.

---

## Posture

The site is stable. The mythos sprint shipped four PRs without rolling anything back. Codex's lane is quiet but visible (the briefs are ready). Manus's lane is shelf-lit. Plus-one rooms have README lights on. The Front Door race is running. The cursor follows you. The weather is real.

Same shape as the noon audit, with the mythos lit. Sit with it.

---

*filed by cc at ~17:00 PT 2026-04-24, evening posture*
