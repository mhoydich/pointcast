---
sprintId: today-daily-drop
firedAt: 2026-04-19T11:11:00-08:00
trigger: cron
durationMin: 19
shippedAs: deploy:31ed63e8
status: complete
---

# 11:11 tick — /today · the daily drop (v0)

## What shipped

Mike's explicit morning ask — "hold on [HELLO] tho yah, need the daily collection" — v0 lands as `/today`.

### Mechanics

- **Deterministic pick**. `src/lib/daily.ts` exports `pickDailyBlock(blocks, now)` — sorts the block collection by id (stable regardless of caller), then indexes by `daySeed(now) = (year * 1000) + dayOfYearPT(now)` mod collection size. Same day, same block, for every visitor globally. El Segundo-anchored PT calendar.
- **Today's pick for the launch**: day-seed **2026109** → **Block 0276** — "El Segundo name-drops". Editorially on-theme for the launch of a town-local ritual. Coincidence; good one.
- **Collect button**. Big dark panel, gold star, "COLLECT TODAY · TAP TO CLAIM". On click: pushes `{date, blockId, at}` to `localStorage.pc:daily:collected`, plays a two-note chime (720 Hz → 900 Hz), 20ms haptic buzz, shows a gold "+1 COLLECTED" floater, pulses the whole pick card with an amber ring. On repeat-press or already-claimed states, shifts to a green "✓ COLLECTED · COME BACK TOMORROW".
- **Stats row**: total ever collected (across all days) + consecutive-day streak ending today. Streak-computation walks backward day-by-day from today until it finds a gap.
- **Additional surfaces**: thumbnail (block's own noun or media), channel chip colored by CH, mood link (if the block carries one), QR code pointing at `/b/{id}` for phone-side deep-read, "OPEN BLOCK →" link, "COMES NEXT" note explaining the rotation.
- **Schema.org**: `CreativeWork` JSON-LD with `mainEntity` → canonical block URL. `dateModified` set to today's PT date. Agents following the LD get today's pick programmatically.

### Why client-side-only for v0

- No server writes. `/today`'s collect button is a localStorage operation; no Cloudflare Function, no KV, no auth.
- Trivially reversible. A visitor can clear storage and re-claim — and that's fine for v0, because HELLO is held and there's no consequence to this counter other than a personal streak.
- When Mike greenlights the Tezos path (per Block 0280's wallet ladder Rung 5), the on-site collection becomes the claim whitelist. Until then, showing up + tapping = the entire UX.

## Why this over the pool

Mike named this explicitly this morning ("need the daily collection"). HELLO is held but distinct — HELLO = +1 per day for just arriving; DAILY DROP = +1 per day for actively claiming today's chosen block. Different primitives, both ship-worthy. This one compounds into /tv (a Daily Drop slide is the obvious next sub-ship) and into FreshStrip's CAUGHT UP state (a "→ COLLECT TODAY'S DROP" CTA is the obvious next shape).

Alternative candidates (mini-game, presence constellation, editorial block, mood seeding) all remain open. None had Mike's name on them the way this did.

## Design decisions worth recording

- **PT calendar is the home clock.** `todayPT()` uses `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' })` to get `YYYY-MM-DD`. A visitor in Tokyo sees "the drop for April 19" when the El Segundo calendar says so, not when Tokyo's does. Consistent with the rest of the site's El Segundo anchoring.
- **Stable sort by id before seed-modulo.** The block collection's "natural" order (by timestamp, as loaded) is not stable across edits — a new block lands and every downstream index shifts. Sorting by id (`'0001' < '0002' < ... < '0281'`) produces a rotation that only changes when IDs are added, never when metadata is edited.
- **No "yesterday's pick" link yet.** Considered. Skipped — a proper calendar view (`/today/2026-04-18`) is a v1 feature needing getStaticPaths generation for each past PT day. Scope check passed; deferred.
- **Streak computed on read, not stored.** The streak number is recomputed each paint by walking the collection array backward. No stale-cache bug, no sync-needed state. Reads are O(N) in claims but claims accrue at 1/day so N is always trivial.
- **Audio + haptic on claim, not on paint.** Collecting is the sensory moment. Re-visits paint silently — the celebration only fires when the state actually changes.
- **Green claimed-state.** Claimed button switches to `#2B8A3E` (the Garden channel green); reads as "grown / done / checkmark-adjacent" rather than "disabled." Subtle but matters.

## What didn't

- **Server aggregation.** How many people claimed today's drop? Unknown. v1 fixes this with a Cloudflare Function that writes `{date, blockId, visitorId}` to KV; `/today.json` then exposes the public count. Not in v0.
- **Past-days browsing.** `/today/{date}` pages are a natural extension but require either SSG of every past day or SSR. Neither today.
- **Tie-in with /tv.** A Daily Drop slide on /tv would be perfect — "TODAY'S DROP · QR to claim". Follow-up tick, once this has landed.
- **Tie-in with FreshStrip.** The CAUGHT UP state on the home page could route to `/today` rather than a random older block. Would need to check "has user collected today's drop" — trivial localStorage peek. Follow-up tick.
- **Tezos claim flow.** Rung 5 per 0280. Requires Mike's daylight decision.
- **Push/email "new drop" reminder.** Email subs + push notifications are a different arc.

## Notes

- Build: 199 → 200 pages (+1: /today).
- Today's day-seed verified via the rendered HTML: `data-seed="2026109"` matches 2026 * 1000 + 109 (day of year for April 19). Block chosen: 0276.
- Deploy: `https://31ed63e8.pointcast.pages.dev/today`
- Cumulative today: 14 shipped (10 cron + 4 chat).
- Pattern: the `src/lib/daily.ts` helpers (`todayPT`, `dayOfYearPT`, `daySeed`, `pickDailyBlock`) are reusable — /tv can import `pickDailyBlock` directly for its Daily Drop slide without duplicating logic.
- On April 20 at 00:00 PT the pick rolls to day-seed 2026110. The collection-count carries; the current-day's claim status resets; the streak continues if the previous day was claimed.

— cc, 11:30 PT
