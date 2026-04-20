---
sprintId: home-mobile-lighten
firedAt: 2026-04-18T09:11:00-08:00
trigger: cron
durationMin: 18
shippedAs: pending-deploy
status: complete
---

# Home · mobile lighten (record-scratch fix)

## What shipped

CSS-only changes — three files touched, zero JS, zero schema.

- **`BlockCard.astro` mobile compact mode** (`@media (max-width: 639px)`):
  - Hide `.block-card__body` and `.block-card__preview` on grid mode (NOT on detail mode at /b/{id}). Title + dek + meta becomes the glance; tap to read body.
  - Tighter card padding: 12px 14px (was default).
  - Smaller noun illustration: 36×36 (was default ~44×44).
  - Subtle `→` after the title on READ/NOTE/LINK/VISIT cards as a "more inside" hint, channel-colored.
  - WATCH/LISTEN/MINT/FAUCET cards untouched — their facade chip IS the glance.
- **`index.astro` grid spacing** (`@media (max-width: 639px)`):
  - Vertical gap: 16px (was 12px). Horizontal moot at single column.
  - `grid-auto-rows: minmax(120px, auto)` — smaller floor since bodies are gone.
- **`MorningBrief.astro` mobile** (`@media (max-width: 540px)`):
  - Bottom row becomes a horizontal-scroll strip (no wrap) with a thin scrollbar.
  - Tap targets: 36px min-height, 7px×10px padding (was 3px×7px).
  - Labels visible again (was hidden at this breakpoint — bigger targets gave the room back).
  - Brief container itself gets 10px×12px padding for breathing room.

## What didn't

- **Compact-mode toggle for desktop**: not needed — desktop dense is fine per Mike's "better on desktop" callout. Keeping the rule mobile-only avoids regression on the desktop reading experience he likes.
- **DRUM CTA promotion in HomeMajors**: the drum module is already prominent (3 tap buttons, big stats row). No change needed.
- **First-viewport-only compact mode**: considered showing bodies on cards 5+ even on mobile, but the cleaner rule is "mobile = always compact, desktop = always full." Simpler mental model.

## Follow-ups

- Watch for: any block where the body is the actual content (e.g. NOTE blocks where the title is the lead and body has the punchline). On mobile, the user has to tap to see the punchline. If this becomes a complaint, surface a 1-line clamp instead of full hide for NOTE.
- Lighthouse score on mobile is now lower payload — measure on next perf pass.
- A "compact mode" preference toggle (localStorage `pc:density=compact|comfortable|spacious`) is a future sprint if Mike wants user-controllable density.

## Notes

- Cron tick :11 fired clean third time in a row. The autonomous loop is working as designed.
- Voice-audit + products-scaffold + home-mobile-lighten = three sprints landed without Mike review, all author=cc, all docs/sprints/ recapped. ~78 min of cumulative cc work since 7:11.
- Backlog status after this sprint: 5 ready, 2 needs-input, 3 done. Next ready: `codex-manus-brief-3` (20m). The pace puts us at ~30-35% of weekly progress by noon, which was Mike's target.
