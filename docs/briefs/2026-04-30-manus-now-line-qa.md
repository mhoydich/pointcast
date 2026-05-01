# Manus brief — NowLine QA on pointcast.xyz home

**Date:** 2026-04-30
**Author:** cc (Claude Code)
**Status:** QA needed before merging to main

## Context

A new `NowLine` strip was added under the masthead on the homepage. Goal:
give every visit something fresh to read or do, even on the 25th visit
of the day. Current iteration is a static one-line strip that surfaces
the latest block, total block count, latest publish time, and the
dominant channel from the last 6 blocks, plus three quick links.

The component lives at `src/components/NowLine.astro` and is mounted in
`src/pages/index.astro` immediately after the masthead `</header>`
(line 291).

## What to test

Open https://pointcast.xyz (or the preview deploy if linked in the
issue this brief is filed against). The NowLine sits between the
"POINTCAST · 188 BLOCKS · time · YOU · CONNECT WALLET · /for-agents"
masthead and the big "PointCast is shipping while the page is open."
ship-hero.

### Functional checks

1. **Renders on every page load** — refresh 5 times. NowLine should be
   present every time, no flash, no layout jump.
2. **Latest block link works** — click "latest block" in the right rail
   of the NowLine. It should open the latest block detail page (today
   that's `/b/0411`).
3. **Status link** — click "status". Should open `/status`.
4. **Wire link** — click "wire". Should open `/wire`.
5. **Time string is in PT** — the body text shows e.g. "latest Apr 30,
   11:00 AM PDT". Confirm the timezone label (`PDT` in summer, `PST`
   in winter) and that the time matches the actual publish time of the
   latest block.
6. **Channel name is human-readable** — "recent center: Battler" (not
   "BTL"). If the dominant channel changes, the name should follow.

### Visual checks

Capture screenshots in:
- **Desktop** Chrome at 1440×900
- **Tablet** at 768 wide
- **Mobile** at 375 wide (iPhone 12-ish)
- **Dark mode** toggle if your OS supports it (PointCast is light-only
  but check there are no contrast regressions)

For each, confirm:
- The NowLine doesn't push the ship-hero below the fold on a 1440×900
  desktop.
- The orange pulse dot, NOW LINE kicker, headline, and links all sit
  on one row on desktop.
- On mobile (≤720px), the link rail wraps to its own row below the
  copy and is left-aligned.
- No horizontal overflow at any width.

### Semantic / content concerns to flag

1. **Two above-the-fold `<h2>`s.** NowLine's headline ("Sports Desk
   roundup — …") and the ship-hero's headline ("PointCast is shipping
   while the page is open.") are both `<h2>`s and both sit above the
   fold on desktop. Note whether this feels visually competitive or
   redundant — both surface the latest ship.
2. **Content overlap with ship-hero.** The ship-hero immediately below
   already shows latest ships with titles + ages. The NowLine repeats
   the latest title. Is the strip earning its space or is it noise?
3. **No "fresh on the 25th visit" delta.** This iteration is fully
   static — refreshing the page does not change the content unless a
   new block was published since the build. Note whether the strip
   feels worthwhile without rotation.

## Accounts/tools

- A regular browser session is enough; no login needed for the home
  page.

## Where to write results

`docs/manus-logs/2026-04-30-nowline-qa.md` with:
- A short PASS/FAIL per functional check
- Screenshots (desktop, tablet, mobile) inline or linked
- Your honest read on the three semantic concerns above

## Mike approval needed for

- Removing or replacing the strip if your read is "this duplicates the
  ship-hero." Flag and stop, do not edit.
