---
sprintId: sprint88-hud-smoothness
firedAt: 2026-04-21T09:53:00-08:00
trigger: chat
durationMin: 22
shippedAs: deploy:tbd
status: complete
---

# chat tick — Sprint #88: HUD v3.2 smoothness pass

## Context

Mike, 09:53 PT: "yah, have another pass a the bar, see if you can make a tad
smoother, and yes, prepare a next sprint, what number would it be and then go."

v3.0 shipped yesterday evening (shade states + drag handle + ⌘↑/⌘↓). v3.1
patched the ⌘↑-hides-the-bar regression this morning. v3.2 is the polish pass
Mike asked for — every transition/timing/feedback tightened so the bar feels
coordinated, not mechanical.

Sprint number: **#88** (87 recap files on disk before this one; next = 88).

## What shipped

- **Unified timing system** — `--hud-ease`, `--hud-dur-fast/med/slow`
  CSS custom properties at the top of CoNavHUD. Every transition rewritten
  to reference them. Ease is cubic-bezier(0.2, 0.7, 0.25, 1) — a tiny spring.
- **Tactile chip feedback** — hover lifts 0.5px, active sinks 0.5px. Applied
  to `.hud__chip`, `.hud__me`, `.hud__auth-chip`.
- **Drawer opens like a drawer** — clip-path roll-down + translateY(-6px) on
  the container, cascade fade on the three panels (40/90/140ms stagger).
  ~320ms total.
- **Popover fade + scale** — `hud-pop-in` keyframe, transform-origin bottom
  left, 220ms. Network menu now grows from its ⚡ source.
- **Grab-strip polish** — 8px → 10px tall, hover to 12px, gradient background,
  dots widen on hover (letter-spacing 0.28em → 0.44em). Grab cursor while
  dragging.
- **Shade keys only cycle visible states** — `SHADE = ['tiny','compact','tall']`
  for all shade up/down actions. ⌘↑ can no longer hide the bar. Drag + click
  on grab also bounded to visible states. Only × / ⌘M hide the bar.
- **Reopen chip entrance** — 420ms translateY+scale animation before the
  pulse starts. Chip lands rather than appears.
- **Palette focus ring** — added a soft 3px outer halo to the focus-within
  state (NeXTSTEP-style), keeping the existing 1px inner border.
- **Specificity safety net** — explicit `.hud__drawer[hidden]`, `.hud__popover[hidden]`,
  `.hud__palette-results[hidden]` rules at `display: none !important` so
  Astro's CSS scoping can't beat the UA `[hidden]` rule.
- **Peer-jump hover nudge** — `transform: translateX(1px)` on hover of the
  `↗` peer-jump arrows in the network popover.
- **Palette result slide-in** — `padding-left` 12px → 16px transition on
  active/hover so the result row feels like it's being selected.
- **Block 0359** — retro editorial on what v3.2 changed + why, for the /b/0359
  + archive. ~7 min read.
- **prefers-reduced-motion respected** — existing media query extended with
  the new animations, so OS-level reduced-motion users get snaps, not slides.

## What didn't ship

- **Drag-handle preview during drag** — the grab strip still quantizes
  (snaps to state at 34px thresholds) rather than showing a continuous
  preview. Flagged for a later pass if dragging-feel is weak.
- **Theme picker** — bar is cream-on-ink. A dark variant is trivial but
  wasn't asked for.
- **Tips-of-the-day in HELP panel** — the HELP panel still lists keyboard
  shortcuts statically. Could be a rotating tip but not scope for this sprint.

## Notes

- v3.2 builds on v3.1's `pc:hud:version = 'v3.1'` localStorage migration.
  Anyone still stuck in 'min' from v3.0 surfaces to 'compact' on first load
  of this build, then the version marker writes.
- All changes scoped to `src/components/CoNavHUD.astro` — no behavioral
  changes to layouts, chip content, palette routing, federation peers.
- Astro build: 336 pages clean (up 4 from 332 — new content collections).
- Sprint recap files: 87 before this one → 88 after.

## Follow-ups

- Watch for any user feedback on drag feel. If people want continuous
  height dragging (not snap-to-state), add a live visual cue during drag.
- Investigate /api/presence/snapshot 404 — the DO cross-script binding
  is suspicious (`script_name = "pointcast-presence"` in wrangler.toml
  may reference a Worker that isn't deployed). Out of scope for this sprint.
- Google OAuth env vars still need to be set in Cloudflare Pages dashboard
  for /auth/google/start to resolve. Out of scope for this sprint.
