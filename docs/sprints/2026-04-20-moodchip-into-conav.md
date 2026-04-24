---
sprintId: moodchip-into-conav
firedAt: 2026-04-20T15:45:00-08:00
trigger: chat
durationMin: 10
shippedAs: deploy:3dc0ead9
status: complete
---

# chat tick — MoodChip moves into the CoNavigator bar

## What shipped

Mike 2026-04-20 15:30 PT: *"have this in the bar, and then once you select it goes away, kinda go thru the start here flow which you can then remove from the top and then mood is gone from the homepage."*

Mood selection is now an inline popover in CoNavigator's left zone. The top-of-home MoodChip surface is removed.

### Flow

1. First visit: CoNavigator bar shows `● SET MOOD` in the left zone.
2. Tap it → popover expands above the bar with 6 options (chill / hype / focus / flow / curious / quiet) + hint + footer note.
3. Pick a mood → `pc:mood` localStorage write, `data-pc-mood` applied to `<html>`, meditative pulse fires (respects `prefers-reduced-motion`), `pc:mood-changed` event dispatches, popover closes.
4. Bar chip now shows `● FLOW` (or whichever mood) + the ▶ SOUNDTRACK button appears. Tap the mood chip again → opens the drawer + iframe soundtrack.

### Files shipped

- **`src/components/CoNavigator.astro`**
  - New popover markup `.conav__mood-picker` with 6 `.conav__mood-opt` buttons (parallels the noun picker shape).
  - Script: `selectMood(id)`, `meditativePulse(id)`, `openMoodPicker/closeMoodPicker`. Replaces the old "no mood → redirect to `/#mood`" flow.
  - Close-bar handler now also closes the mood picker.
  - CSS: picker styles + 3-col desktop / 2-col ≤520px grid. Global `.mood-pulse` + `@keyframes moodPulse` ported from MoodChip so the animation works without MoodChip rendered anywhere.

- **`src/pages/index.astro`**
  - Removed `<MoodChip />` render + import. Replaced with a comment block citing Mike's directive. File `src/components/MoodChip.astro` remains on disk untouched (future-proof; can return if surface reappears).

- **`src/lib/compute-ledger.ts`** — added an entry for this ship. Discipline: every sprint retro gets a ledger entry in the same commit.

## Deploy

- Build: 256 pages clean (same count as prior deploy + no new routes).
- Deploy: `https://3dc0ead9.pointcast.pages.dev/` → pointcast.xyz live on main.
- Verification: home should render no MoodChip before the grid; CoNavigator left zone shows `SET MOOD` by default until clicked.

## What didn't

- **"Start here" flow in the bar** — Mike's line: "kinda go thru the start here flow which you can then remove from the top". Queued for the next tick. Needs: a 3- or 4-step onboarding popover (pick mood → pick noun → tap collect → explore) that dismisses permanently once completed, plus `FreshStrip` shedding its "START HERE" pill when the bar-version is dismissed.
- **NetworkStrip repurpose as promo slot** — Mike's "network likely almost a spot to yahh promote things". Not yet wired; current content unchanged.
- **SportsStrip refinement** — Mike's "sports module still not updated, refined, etc". Current version has cards + close-game marker; needs upset detection (ranked losing to unranked), previews (upcoming notable games), trends (win streaks / recent form).
- **BlockReorder still-broken** — Mike's "need to be able to move blocks still". Pointer-event rewrite landed earlier today but real-device testing TBD; Mike reports it doesn't work yet. Next tick to investigate.

## Follow-ups

1. Start-here flow in CoNav.
2. SportsStrip v3 (richer data, ESPN team-records fetch for upset math).
3. BlockReorder debug session (probably needs a live walkthrough with Mike on the device that's failing).
4. NetworkStrip → promo slot spec.

## Notes

- Files new: 1 (this retro).
- Files modified: 3 (CoNavigator.astro, index.astro, compute-ledger.ts).
- Cumulative: **59 shipped** (28 cron + 31 chat).

— cc, 15:45 PT (2026-04-20) · mood lives in the bar; the home is one strip lighter
