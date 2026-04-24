# Manus brief · games QA sweep

**To:** Manus (M)
**From:** CC (via Mike's ask: "a bunch of the games are confusing and don't work")
**Date:** 2026-04-24 afternoon PT
**Priority:** Medium — user-visible playability issues, no data loss risk
**Expected effort:** one focused session, ~60–90 min

---

## Context

Mike flagged that several game surfaces on PointCast feel broken or confusing. Over the last ~week cc, Codex, and Mike have all shipped pieces of game UX — some standalone, some interconnected — and the quality bar has drifted. cc doesn't have a real browser to reproduce what humans experience; that's the handoff.

The ask is a real-user QA pass across every currently-live game surface, with:
- Screenshots or short GIFs of what breaks
- Clear verdict per surface: **works** / **works but confusing** / **broken**
- A written log at `docs/manus-logs/2026-04-24-games-qa.md` summarizing what you tried, what happened, and what you'd change

Not asking for code fixes. Just signal so cc + Codex can prioritize.

---

## What counts as a "game" on PointCast

Eleven surfaces to sweep, ordered by user-visibility:

### 1. `/farm` — Sam's Plot (cc, Sprint 5)
3×3 garden, 4 seed types, real-wall-clock growth. LocalStorage save.
- Does plant → water → grow → harvest work end-to-end?
- Do seeds with long growth times (Pipeweed 10m) actually complete?
- Does the save survive a reload? A tab close + reopen?
- Mobile touch — can you plant and water with taps?

### 2. `/agent-derby` — Agent Derby v2 (Codex)
Deterministic horse racing. Seed → run → receipt.
- Does "RUN RACE" actually run all the way to PHOTO FINISH?
- Do the horse positions update smoothly or lurch/stall?
- Does the receipt show correct placements + time?
- The v3 work on PR #58 adds stables + badges + daily cards — **skip that for now**, test the live prod version only.

### 3. `/battle` — Nouns Battler (Codex)
Card-of-the-Day vs a seeded challenger, 3-round stat-based resolver.
- Does the daily card rotate correctly by UTC date?
- Pick a challenger, run 3 rounds — does each round resolve with clear reasoning?
- Do the stat bars (ATK/DEF/SPD/FOC) animate?
- Share-result button copies a valid share URL?

### 4. `/battle-log` — local match archive
Reads localStorage battle-log. JSON export button.
- If you've played on `/battle`, do your matches appear here?
- Does the "Export as JSON" button download valid JSON?

### 5. `/cast` — Prize Cast (spec page, pre-origination)
No active gameplay yet — but Mike wants the UI to **feel** playable even while the contract is pending.
- Does the countdown tick every second?
- Does the 7-day rhythm bar render correctly?
- Can you see a clear "this isn't live yet" message?

### 6. `/drum` — shared drum module
- Tap the grid — does each cell play a sound?
- Is there audible audio on iOS Safari (often silent until user gesture)?
- Does "save loop" work?

### 7. `/yee` — YeePlayer (rhythm game over WATCH blocks)
Browse the list; each block with `media.beats` has a `/yee/{id}` page.
- Pick one (e.g. `/yee/0236` — 11-min chakra tune-up).
- Does the YouTube iframe load?
- Do the on-screen prompts sync with the video?
- Keyboard hits register? Pointer clicks register?

### 8. `/nouns-cola-crush` — match-3
- Swap two adjacent tiles — does the match detect?
- Do cascades chain?
- Does the score update?
- Move counter decrements?

### 9. `/race/front-door` — today's Front Door race
Hydrates from `/api/race/front-door/leaderboard`.
- Status reads **OPEN**?
- Returns to home → click a block card → come back to /race/front-door → does your entry appear? (It will show `stored: false, reason: kv-unbound` for now — that's _expected_; check the UI reads legibly in that state.)
- The masthead RACE chip goes from SCHEDULED → OPEN → updates count after submit?

### 10. `/room` — Spotify companion page
- Does the Spotify iframe load?
- Does the clock-tinted background shift?

### 11. `/gandalf` — sit-with-gandalf companion
Not really a game — a meditative companion. But Mike calls it out alongside the others.
- Does the "sit" flow complete?
- Does the Samwise Sigil SVG render?
- Does LocalStorage `pc:gandalf:sigil` save?

### Cursor Room (every page, Sprint 29 default-on)
On every page now — your Noun follows the mouse.
- Is the native OS cursor hidden while Room is on?
- Does your Noun trail smoothly?
- Open two tabs to the same URL (try `/taproom` on two browsers) — does each tab see the other's cursor?
- FooterBar → click ROOM button → does toggling off restore the native cursor?

---

## Browsers + devices to cover

- **Desktop Safari** (Mike's primary)
- **Desktop Chrome**
- **iOS Safari** (iPhone) — _especially_ for `/drum` audio unlock + touch on `/farm`
- **iOS Chrome** if time

For each device, jot down "played for 2 min, here's what I saw."

---

## What to write

File: `docs/manus-logs/2026-04-24-games-qa.md`

Shape:

```md
# Manus log · 2026-04-24 · games QA

## Environment
- Machine: ___
- Browsers tested: ___

## Surface-by-surface

### /farm
Verdict: works / confusing / broken
Played for: _m
What happened: ___
Screenshots: links or embedded thumbnails
Fix priority: high / medium / low

### /agent-derby
... (same shape)

[repeat for all 11 surfaces]

## Top three priorities for Mike

1. ___
2. ___
3. ___

## Cross-cutting notes
- Anything that's a site-wide issue vs. per-surface
- Performance, jank, confusing navigation patterns
```

---

## What Mike approves

Nothing here requires Mike's go — it's a read-only QA sweep. After your log lands, cc will triage fixes and open PRs. If anything in your sweep hits a surface that requires Mike's decision (e.g. "this is fundamentally wrong, should we kill it?"), leave that flagged in the log and cc will route it.

---

## Pings

- @Claude-Code will read your log at start of next session per AGENTS.md
- If you hit a hard wall (login required somewhere, site completely down), ping via `/api/ping` with a brief message

---

*Small surface per surface. No fixes, just signal. Take your time.*
