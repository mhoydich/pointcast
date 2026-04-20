---
sprintId: freshstrip-daily-route
firedAt: 2026-04-19T13:11:00-08:00
trigger: cron
durationMin: 17
shippedAs: deploy:dc708999
status: complete
---

# 13:11 tick — FreshStrip CAUGHT UP routes to /today if drop unclaimed

## What shipped

The FreshStrip's `CAUGHT UP` state — the one a returning visitor sees when there's nothing new since last visit — previously routed to a random older block ("REVISIT →"). Now it checks whether today's daily drop has been claimed, and if not, routes to `/today` with a "TODAY'S DROP →" CTA.

The routing logic:

| State | CTA when daily unclaimed | CTA when daily claimed |
|-------|--------------------------|------------------------|
| HELLO (first-time) | `START HERE →` → newest block | `START HERE →` → newest block |
| N NEW (returning, new blocks) | `JUMP IN →` → newest block | `JUMP IN →` → newest block |
| CAUGHT UP (returning, no new) | **`TODAY'S DROP →` → /today** | `REVISIT →` → random older |

Only the CAUGHT UP branch changes. HELLO and N NEW states prioritize "there's new stuff to read" — that's the higher-signal routing for first-time visitors and returning visitors with unread blocks. CAUGHT UP is the state where the daily drop becomes the best "something to do now."

### How it knows

Two new `data-` attributes on the strip:
- `data-daily-id` — today's drop block id (shared with `/today` + `/tv` via `src/lib/daily`'s `pickDailyBlock`)
- `data-today` — today's PT date string (YYYY-MM-DD)

Client-side, when the paint function hits the CAUGHT UP branch, it reads `localStorage.pc:daily:collected` (the same key `/today` writes to), checks for any entry with `date === today`, and branches on that. If storage is unavailable or the entry is missing → route to /today. If present → route to a random older block (existing fallback behavior preserved).

### Screen-reader copy

- Unclaimed: "Caught up on the feed. Today's drop is still waiting — tap to collect."
- Claimed: "Caught up and claimed. Tap to revisit an older block."

## Why this over the pool

Last tick's retro (tv-daily-drop-slide) named this as an obvious follow-up. The three-tick arc (/today → /tv daily slide → FreshStrip routing) closes the morning-visitor loop end-to-end:

1. Morning visitor arrives on `pointcast.xyz` → FreshStrip surfaces their state.
2. If CAUGHT UP + unclaimed, the strip's single CTA directly points at /today.
3. /today shows the drop, tap-to-collect, streak counter ticks.
4. Tomorrow morning, the strip nudges again if tomorrow's drop is unclaimed.

Zero new surfaces, pure routing improvement on a shipped surface. Best-leverage single tick.

## Design decisions worth recording

- **Only CAUGHT UP routes to /today, not HELLO/FRESH.** Could have made /today the default CTA always. Decided against: a first-time visitor (HELLO) or a visitor with new blocks (FRESH) gets higher signal from "start here / jump in → newest block." The daily drop routing is specifically for the morning visitor who already read everything.
- **Routing is client-side via localStorage check.** Same storage key as `/today` writes (`pc:daily:collected`). No server round-trip. If storage is unavailable, default behavior is route to /today (fail-open — better to over-nudge toward a valid action than silently fall back to a random older block).
- **Share `pickDailyBlock` + `todayPT`** from `src/lib/daily.ts`. Same lib that `/today` and `/tv` daily-slide use. Single source of truth — if Mike ever changes the pick algorithm, all three surfaces update together.
- **"TODAY'S DROP" label, not "DAILY DROP".** Shorter. Reads better in the chip at the small font size the FreshStrip uses. The home feed's context means "today" is unambiguous.

## What didn't

- **Visual distinction for /today routing.** The warm-pill + CTA styling is the same regardless of target. Could add a gold tint when routing to /today to visually match the /tv daily-slide + /today's own tonal register. Considered; deferred — the CTA label change ("TODAY'S DROP") is already a strong signal.
- **Add "✦" star prefix on CTA when routing to /today.** Same tonal-match rationale. Deferred; the existing arrow → is enough.
- **Surface daily-drop state on HELLO + FRESH states too.** Could show a small secondary badge "drop ready" below the main CTA. Didn't — the strip is already dense, and the primary nudge (start here / jump in) is the right one for those states.

## Notes

- Build: 200 pages (unchanged HTML count; enhancement only).
- Data-attributes verified via grep: `data-daily-id="0276"`, `data-today="2026-04-19"` both present in rendered `dist/index.html`.
- Deploy: `https://dc708999.pointcast.pages.dev`
- Testing flow: open home in a browser where you've already voted all polls and visited since the last block timestamp. If /today hasn't been claimed, FreshStrip CTA becomes "TODAY'S DROP →". Tap → /today → collect → reload home → CTA now "REVISIT →" to a random older block.
- Cumulative today: 16 shipped (12 cron + 4 chat).
- Tomorrow at 00:00 PT the daily rotation advances. Anyone visiting home with a streak will see "TODAY'S DROP →" again, preserving the daily ritual without any server state.

— cc, 13:29 PT
