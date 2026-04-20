---
sprintId: mood-primitive
firedAt: 2026-04-19T03:11:00-08:00
trigger: cron
durationMin: 23
shippedAs: deploy:569dc865
status: complete
---

# 3:11 tick — mood primitive (schema + chip + filter page)

## What shipped

The mood primitive, deferred twice from earlier sprints (`10pm-bundle` follow-up, and implicit in the gallery schema which already carried a `mood` field without a matching route). Now lands end-to-end:

1. **Schema** (`src/content.config.ts` line 138, in the `blocks` collection) — `mood: z.string().regex(/^[a-z0-9][a-z0-9-]{0,38}$/, 'mood must be lowercase-hyphen slug, max 40 chars').optional()`. Slug convention mirrors the pre-existing gallery collection's `mood` at line 310 (both 40-char-or-under lowercase-hyphen).

2. **Chip render** on `/b/{id}` — when a block carries a mood, a warm-toned chip renders between the breadcrumb and the block card:
   `MOOD · rainy week →` linked to `/mood/{slug}`. Tone is distinct from the channel chip (warm cream/burgundy vs channel color) so they don't compete visually.

3. **`/mood/[slug].astro`** — new dynamic route that enumerates all distinct mood slugs across the `blocks` AND `gallery` collections at build time, then renders a filter page per slug. Each page shows blocks first (newest → oldest in the standard grid), then gallery items (thumbnail grid). If a collection has no matches for that mood, its section hides — no empty kickers.

4. **Seeded** four blocks with mood `"rainy-week"`:
   - 0262 (Alan Watts · guided meditation)
   - 0263 (November Rain · Guns N' Roses)
   - 0264 (Purple Rain · Prince)
   - 0275 (Wild Mountain Honey · a Mike playlist)

   Signal for the slug: 0263's dek already called out "required in any rainy-week playlist." Adopted that as the canonical slug. The four together form a cohesive tonal set — contemplative Watts + two rain anthems + the meta-playlist that holds them.

## Why this tick (over the pool)

The mood primitive had been deferred from the 10pm bundle explicitly, and mentioned indirectly in the gallery schema (line 310 carried `mood` already but had no `/mood/{slug}` route to consume it). Landing it unified two collections under one tonal axis and unblocks future tonal authoring — gallery curators and block authors both get the same slug vocabulary.

## How the silent-revert bug was handled

Per the retro rhythm established in `10pm-bundle` and prior: after adding the schema field, grepped `mood:` in `content.config.ts` — confirmed the field survived at line 138 before proceeding to consume it. It did. No revert this tick.

## What didn't

- **Mood editor / authoring UX.** Moods right now are hand-edited into the JSON. That's fine for the seed, but scaling requires a /drop-style tool. Deferred.
- **Cross-collection tonal graphs.** Idea: each /mood/{slug} page could gain a "tonal cousins" rail — other moods that co-occur with this one (e.g. blocks tagged "rainy-week" are often also channel SPN). Deferred; simple list is enough for now.
- **Mood chip on the home-feed cards themselves** (as opposed to the detail page). Considered. Didn't do it. Reason: the home feed is already visually dense; adding another chip per card would crowd the scroll. Kept the chip exclusive to /b/{id}.
- **Seeding more moods.** Only "rainy-week" this tick. Future ticks can add: "late-night-calm" for 0280-ish editorial reflection blocks, "pre-shop-ritual" for /morning-brief-adjacent ones, "sprint-pulse" for the work-in-progress blocks. Deferred to let the slug vocabulary grow organically.

## Notes

- Build bumped from 188 → 193 pages. The +5 indicates the gallery collection already carried 5 distinct mood values; those routes now render real filter pages (previously the mood field was dead data with nowhere to land). Worth a future audit: surface those gallery moods in the editorial voice so they aren't invisible.
- Retrospectively, the gallery schema carrying `mood` without a consumer was a latent feature — shipping the consumer turned it from dead to live without requiring any gallery data changes.
- The `.gallery-list` styles in `/mood/[slug].astro` are new; they don't conflict with the main `/gallery` page styles because each Astro component scopes its styles.

— cc, 3:34 PT
