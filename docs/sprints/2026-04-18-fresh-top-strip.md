---
sprintId: fresh-top-strip
firedAt: 2026-04-18T17:11:00-08:00
trigger: cron
durationMin: 14
shippedAs: deploy:638c190e
status: complete
---

# Fresh-top-strip · Mike's first end-to-end /sprint PICK

## What shipped

**The autonomous loop fired end-to-end for the first time.** Mike tapped PICK on /sprint after the KV bindings landed (last hour). Cron fired at :11. cc read `/api/queue?action=list`, found three real picks, processed the oldest one, recapped, redeployed.

- **`src/components/FreshDeck.astro`** — new component. Server renders only an empty placeholder (`<aside hidden>`); client JS waits for DOMContentLoaded, queries `.grid .block-card[data-id]`, picks 3 random via partial Fisher-Yates, clones them with `cloneNode(true)`, strips grid-span classes so they flow in the deck row, appends to the placeholder, and unhides. Zero extra fetch — uses the BlockCards already in the DOM.
- **Inserted into `src/pages/index.astro`** between MorningBrief and the channels chip bar. So the home now reads: masthead → MorningBrief → **FreshDeck (3 random)** → channels nav → HomeMajors → main grid.
- **Mobile stacks single-column** with the same airier vertical gap as the home grid mobile lighten. Sub-text "· 3 RANDOM PICKS · TAP TO READ" hides under 540px.
- **Green left-border accent** distinguishes the deck visually from the regular feed without screaming.

## What didn't

- **Queue NOT auto-cleared yet.** The processed pick (`pick:...:fresh-top-strip`) was deleted manually via `wrangler kv key delete`. Future sprint candidate: bake auto-deletion into the cron-tick prompt so processed picks don't accumulate.
- **No persistence per visitor** — the deck is stateless: every page reload picks 3 fresh blocks. Considered using localStorage to "don't show the same 3 again immediately" but the random-each-visit behavior IS the point Mike asked for.
- **Did not touch the existing grid below** — the deck is purely additive. The full feed still scrolls under it. People who land on the home and immediately scroll past the brief + deck see the chronological grid as before.

## Follow-ups

- **Two more Mike picks queued for upcoming ticks:**
  - `shelling-point-poll` (50m, scheduled for 6:11 cron tick)
  - `feedback-block-strip` (30m, scheduled for 7:11)
- The "queue auto-clear after processing" pattern is worth formalizing as a sprint. Currently each cron tick processes one pick + a manual delete — that's brittle. A `processedAt` field + auto-delete after N hours would be cleaner.
- After 3-4 page-views with the FreshDeck live, watch for whether the random-pick distribution feels good or whether some bias (e.g. weight by recency) would help. The current uniform random across all 90 blocks means very old blocks resurface as often as new ones — that may be the feature, not the bug.

## Notes

- 12th sprint shipped today. 11th cron-fired (one was chat-fired KV bind earlier).
- Cumulative cc work since 7:11: ~191 min across 12 sprints + 1 health check.
- **The loop is now production-grade end-to-end:** Mike taps PICK on /sprint → KV stores → cron fires :11 → cc reads queue → ships → recaps → deletes → idles. Three real picks landed in this single tick from Mike's tap session (one shipped now, two queued for the next two ticks).
- This is the first day cc has shipped a Mike-PICKED sprint via the full autonomous loop. Earlier sprints were all chat-driven or default-from-backlog. Today's milestone.
