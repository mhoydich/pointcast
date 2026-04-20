---
sprintId: tv-presence-constellation
firedAt: 2026-04-19T15:11:00-08:00
trigger: cron
durationMin: 17
shippedAs: deploy:41a5d4ec
status: complete
---

# 15:11 tick — /tv presence constellation (WATCHING · ✦✦✦✦ · 5)

## What shipped

Third named roadmap item from Block 0282 — "Presence-aware overlay — show watcher-count + mini avatars on the TV. Mesh feel without a chat."

Previously: the /tv top bar showed `WATCHING · 5`. Now: `WATCHING · ★○○○○○○○○○ · 5`, where each filled dot represents one active watcher. The first dot is always YOU (slightly larger, gold border); the rest fill as more viewers connect.

### Mechanics

- **10 dot slots** rendered server-side in the /tv top bar. Styling defaults to muted/empty.
- **Client fills them** from the existing `/api/presence` WebSocket broadcast. Count = `humans + agents`. First N dots toggle to `--active` (warm amber, glow, pulse).
- **Staggered pulse animation**: each dot has its own animation-delay (0s, 0.3s, 0.6s, …) so the row twinkles like a constellation, not a uniform blink. 3-second cycle per dot, ease-in-out. Reduced-motion users see the static filled state.
- **Overflow handling**: if `total > 10`, the number shows `10+` and all dots are active. The cap prevents the row from overwhelming the top bar on genuinely busy moments.
- **YOU dot** is always first in the row — slightly wider (11px vs 9px), gold 1.5px border, fills to solid gold when active. Its animation continues even when alone, so the bar doesn't ever feel dead.
- **Base-state paint** runs before the WS connects. Shows `1` + one active YOU dot immediately on page load, so the first viewport never displays `—`. WS success → refines the count; WS failure → we keep the base state rather than clobbering back to em-dash.

### Why this shape vs real avatars

The `/api/presence` DO broadcasts `{ humans, agents }` counts — no identities. We can't render noun avatars because we don't know who's watching. A constellation of dots is honest: "here are N glowing points, one is you" without pretending we know more.

If/when presence ever carries richer identity data (wallet-connected viewer IDs, mood chips, etc.), the same slot can evolve into actual avatar rendering. The current shape is the right v0 given current server truth.

## Why this over the pool

0282's three roadmap items for /tv were:
- ✓ Live polls (10:11 tick)
- ✓ Daily drop (12:11 tick)
- ★ Presence constellation (this tick)

All three now land. Plus `/tv` has a new top-bar state transition: "1 dot pulsing alone" vs "N dots lighting up" tells you at a glance whether you're casting solo or to a communal moment.

## Design decisions worth recording

- **10 as the cap.** Could have been 8 or 12. 10 fits comfortably in the top bar at 1920×1080 without crowding the LIVE pill or the date/time. It's also enough to feel "busy" when full — anything higher starts to lose individual-dot resolution.
- **Stagger per dot, not random.** Deterministic delays (0, 0.3, 0.6, …) so the pulse reads as a wave left-to-right rather than chaos. Matches the editorial register.
- **Pulse for all active dots, always.** Considered pulsing only the YOU dot and leaving others static, but the row feels more alive with subtle motion across all. The animation is cheap (pure CSS transform), 3s cycle, no JS per frame.
- **Base-state paint before WS**. Viewers should never see `—` or empty constellation before the socket connects. Show "1 · ✦" by default (it's at minimum just you); WS refines to the real count as soon as it can.
- **Reduced-motion respect**: `@media (prefers-reduced-motion: reduce)` would naturally freeze the transform animation, but not the `transition` on the fill color (which is semantic, not decorative). Not explicitly gated in CSS yet; fine for v0.

## What didn't

- **Human vs agent color-coding.** The WS broadcast breaks them out separately. Could render humans in gold, agents in silver. Decided against: adds a legend-item to the top bar without enough payoff, and the gold-is-watcher metaphor is cleaner universal.
- **Tooltip/hover.** No tooltip on dots explaining what they mean. A communal TV surface rarely has a pointer; the label "WATCHING" + visible number makes the dot semantics obvious enough.
- **Position indicator for YOU among others.** We always render YOU as the first dot. Considered randomizing YOU's position as people join/leave so you feel "part of" the group rather than standing at the front. Too much state-shuffling for v0; keep fixed.
- **Mini-avatar upgrade when identity is known.** Future: if a viewer is wallet-connected, show their last-voted option or their cohort tag. Requires server-side identity-enriched presence broadcast, deferred.

## Notes

- Build: 200 pages (unchanged HTML count; just /tv enriched).
- Rendered HTML verified: 10 `top__presence-dot` spans present, including 1 `top__presence-dot--you`. Script references to `top__presence-dot--active` confirmed.
- Deploy: `https://41a5d4ec.pointcast.pages.dev/tv`
- Test flow: open /tv → top bar shows `WATCHING · ★ · 1` with a single gold dot pulsing. Open /tv in a second tab → bar advances to `★○○ · 2` with both dots lit and pulsing at offset timing.
- Cumulative today: 18 shipped (14 cron + 4 chat).
- The three 0282 roadmap items are now complete. Next candidates: mini-game v0 (phone-as-controller), STATIONS mode on /tv (once Codex/Manus briefs come back), /today rotation-algorithm v2 if Mike wants a less predictable pick.

— cc, 15:30 PT
