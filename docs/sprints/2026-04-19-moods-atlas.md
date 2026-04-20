---
sprintId: moods-atlas
firedAt: 2026-04-19T04:11:00-08:00
trigger: cron
durationMin: 18
shippedAs: deploy:bb4c71a8
status: complete
---

# 4:11 tick — /moods tonal atlas (discovery surface)

## What shipped

The mood primitive landed in the 3:11 tick (`mood-primitive`) added the schema field, the per-block chip, and the `/mood/{slug}` filter pages. But it left a discoverability gap: a visitor had to already know a mood existed (via a chip on some block they happened to be reading) to navigate to its page. Without an index, the primitive was technically complete but practically hidden.

This tick ships **`/moods`** — the tonal atlas. A static page that:

1. Enumerates every mood slug with at least one entry across blocks + gallery.
2. Lists them sorted by total population, then by freshest-entry recency as a tie-breaker.
3. For each mood, renders a big warm-toned row showing the slug in serif display, a count badge with the block/gallery split (e.g. `4 · 4B`), and up to 3 sample block titles as a preview so visitors can feel the tonal range before clicking through.
4. Links to `/mood/{slug}` for the full filter.

Added the endpoint to the home page footer's `/endpoints` list so both humans and agents can find it.

### Current atlas contents (at deploy time)

- **rainy-week** · 4 entries (4B) — the set from sprint `mood-primitive`
- **spirit** · 1 entry (1G) — existing gallery mood
- **quiet** · 1 entry (1G) — existing gallery mood
- **current-state** · 1 entry (1G) — existing gallery mood (note: this one WANTS a matching block companion later — 0275's current-state framing is a natural cross-link)
- **grounded** · 1 entry (1G) — existing gallery mood

5 moods · 8 entries total. Small but real — the atlas is now a living index that grows whenever a new mood slug lands.

## Why this (over the pool)

- **Editorial reflection block** was the other candidate. Choosing the atlas over it because discoverability is structurally more valuable than one more editorial voice — and the atlas can be referenced BY a future editorial block as "the mood index is live now."
- **Polls JUICE** is broad enough that it's hard to ship one tight improvement without over-scoping.
- **Codex review on /drum** and **es-name-drops leader writeup** remain gated on external signals.

## Design decisions worth documenting

- **No JS.** The atlas is pure static HTML — build-time `getCollection` calls, loop, render. No hydration, no client interactions.
- **Block-gallery dual count.** The `row__count-sub` shows `4B` or `1G` or `3B·2G` — so visitors can see at a glance whether a mood is predominantly editorial or visual. This is the one stylistic nod to the cross-collection nature of the primitive.
- **Sample previews.** Up to 3 sample block titles render under each row so the mood has texture before the click. Gallery samples were considered but intentionally not included — the thumbnails would compete with the slug typography for attention.
- **Serif slug display.** Moods render in the site's serif display face, not mono. This is a deliberate tonal choice: channels (CH.XXX) are mono because they're identifiers; moods are italics-ready because they're registers. The masthead uses the same pattern (`Moods · *tonal atlas*`).
- **Count badge in warm ink.** `#8a2432` matches the mood chip on `/b/{id}` from last tick — the two surfaces visually rhyme.
- **Freshest-tiebreak sort.** When two moods have the same population (as all the gallery moods currently do, each with 1), the newer-entry wins the tiebreak. Keeps the atlas feeling alive over time rather than alphabetical-dead.

## What didn't

- **Gallery thumbnails on the atlas rows.** Considered; would compete with the typography hierarchy. Kept it text-only.
- **Seeding more moods.** Only the existing 5 are live. Future ticks can coin slugs like `late-night-calm`, `sprint-pulse`, `pre-shop-ritual`, `family-tender` etc. as authoring naturally suggests them.
- **Tonal cousins rail** (the "which moods co-occur most often" idea from the previous retro). Population is too small to compute anything meaningful yet — wait until there are ~15+ tagged entries.
- **Mood meta-mood?** Briefly considered letting moods tag each other (e.g. "rainy-week" is also kind of "quiet") but that's a graph problem, not a primitive problem. Kicked.

## Notes

- Build: 193 → 194 pages (+1: /moods).
- Astro correctly picked up the dynamic `/mood/[slug]` pages we shipped last tick as children of this new index — verified in the final render by cross-linking.
- Deploy: `https://bb4c71a8.pointcast.pages.dev/moods`
- Cumulative overnight so far: 3 ticks shipped (reverse-companions, mood-primitive, moods-atlas). ~58 min total. Each tick left the next one better positioned.

— cc, 4:30 PT
