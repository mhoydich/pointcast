# Manus brief — QA the latest ship cluster

**Date:** 2026-05-06
**Author:** cc
**For:** Manus
**Status:** queued

---

## Background

Heavy ship cadence since the last Manus log (2026-04-23). Mike asked for a sweep over "all the latest." This brief consolidates the recent surfaces into one pass so we get one log file and one set of screenshots instead of fragmenting it across drops.

Scope = ships visible to a real visitor in a browser. Internals (lockfile refreshes, CORS headers, etc.) are noted at the end as low-priority spot-checks.

## What to QA

### 1. UES Tracks 09 / 10 / 11 — three new course pages + JSON mirrors

Three Tracks landed in sequence over the last few days:

- **Track 09 — Ocean Wing** (the Pacific edge)
  - https://pointcast.xyz/ues/ocean-wing
  - https://pointcast.xyz/ues/ocean-wing.json
- **Track 10 — Nature Practice** (12-month pathway)
  - https://pointcast.xyz/ues/nature-practice
  - https://pointcast.xyz/ues/nature-practice.json
- **Track 11 — Fire** (four-element synthesis)
  - https://pointcast.xyz/fire
  - (also reachable from `/ues` hub)

For each: 200 + renders, hub at https://pointcast.xyz/ues lists the new track, JSON mirror parses as valid JSON, no broken inline links to companion blocks/spells/visiting.

### 2. TideSurf component — shipped to disk, **not yet wired in**

- File: `src/components/TideSurf.astro` (commit `05024bf`)
- Renders a 3-chip strip styled to match the BRIEF row (TIDE / SURF / SEA) with seasonal-realistic May mocks for El Segundo.
- **Not imported in `src/pages/index.astro` yet** — there is nothing for you to see in the browser. Skip this one for visual QA; it's listed so you know it exists.
- If Mike greenlights wiring it in, that becomes its own Manus pass.

### 3. Commerce — blocks.jsonl discovery + feed headers

- New JSONL discovery surface: https://pointcast.xyz/blocks.jsonl
  - Should serve as `application/x-ndjson` (or text/plain) with one block per line, parseable.
- CORS + freshness headers refresh on commerce feeds (Codex co-authored). Spot-check headers on:
  - https://pointcast.xyz/blocks.json
  - https://pointcast.xyz/feed.json
  - https://pointcast.xyz/feed.xml
  - Confirm `Access-Control-Allow-Origin: *` and a no-store-ish `Cache-Control`. `curl -sI` is enough.

### 4. Homepage pulse modules

Three sibling strips landed on the homepage:

- WingPulseModule (#444)
- AltarsPulseModule + QuintetPulseModule (#445)

Open https://pointcast.xyz/ on desktop **and** mobile (or DevTools mobile emulation). Confirm all three render, don't overlap, and pulse animations don't cause layout shift. Capture one wide screenshot.

### 5. El Segundo nature field desk

- Recent commit `a3db264` adds a nature field desk surface. Find where it surfaces (likely homepage or `/nature` / `/local`); confirm 200 + renders.

## Accounts / tools needed

- Modern Chromium with DevTools (responsive mode for the mobile pass)
- `curl` for the header spot-checks
- No logins required for any of this — all surfaces are public

## What to capture

Write one log: `docs/manus-logs/2026-05-06-latest-ships-qa.md`

Include:

- Per-URL: status code, render verdict (✓ / ⚠ / ✗), screenshot link or embed
- The three UES tracks: one screenshot each of the page hero
- Homepage: one desktop wide-shot showing the three pulse modules
- The header spot-check: paste the relevant `curl -sI` output for blocks.json + blocks.jsonl
- Anything broken → file as a GitHub issue with the appropriate label (`bug:ues`, `bug:commerce`, `bug:homepage`) and link the issue from the log

## Acceptance criteria

- [ ] All UES Track URLs (09, 10, 11) return 200 and render
- [ ] `/ues` hub lists all three new tracks
- [ ] `/blocks.jsonl` parses as one-JSON-per-line
- [ ] CORS headers present on `/blocks.json`, `/feed.json`, `/feed.xml`
- [ ] Homepage renders cleanly desktop + mobile with all three pulse modules visible
- [ ] Manus log filed at `docs/manus-logs/2026-05-06-latest-ships-qa.md`
- [ ] Any failures filed as GitHub issues, linked from the log

## What NOT to do

- Don't wire TideSurf into the homepage. That's a Mike decision (per the AGENTS.md note that the BRIEF section was deliberately retired in April).
- Don't cross-post or syndicate any of these — this is QA only, not announcement. Syndication briefs are filed separately when Mike calls for them.
- Don't rerun `npm run build:bare` — cc already ran it green for the latest commit.

## Mike-approval gates

None for the QA itself. If you find a P0 (homepage broken, 5xx on a feed), ping Mike before filing — he may want to roll back rather than wait for a fix.

## Why this matters

Four UES Tracks now exist (05, 09, 10, 11) with the namespace conventions cc + Mike worked out in early May. Confirming the pattern holds across all three new ones — that the JSON mirrors work, the hub lists them, the cross-references resolve — locks in the template before Track 12+ get cheaper to ship. The pulse-module trio + commerce JSONL are the other half: agent-visible surfaces that PointCast claims as part of the agent-native posture. If any of them 404 in production, the posture is just words.

— cc, 2026-05-06 PT, El Segundo
