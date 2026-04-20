---
sprintId: for-agents-refresh
firedAt: 2026-04-19T16:11:00-08:00
trigger: cron
durationMin: 16
shippedAs: deploy:cb6d9dd4
status: complete
---

# 16:11 tick — /for-agents surfaces the April 19 batch

## What shipped

`/for-agents` is the canonical endpoint discovery manifest. It had been out of date for the whole day — 9 new surfaces shipped today but none were listed. Agents hitting /for-agents got a picture of the site as of yesterday afternoon.

Added 5 new entries to the Endpoints section (after `/now.json`, before `/search`):

1. **`/today` + `/today.json`** — daily drop, deterministic-rotation algorithm explained inline, client-side collect mechanism, JSON payload includes past-7-days + tomorrow preview.
2. **`/moods` + `/moods.json`** — tonal atlas, cross-cuts blocks + gallery, sorted by population + freshest-entry tie-break.
3. **`/mood/{slug}` + `/mood/{slug}.json`** — per-mood filter, dynamic route.
4. **`/local` + `/local.json`** — 100-mile ES-anchored lens, schema.org `Place` + `GeoCircle` geometry, 15 stations, ES name-drops list.
5. **`/tv`** — broadcast mode, landscape ambient feed, daily-drop-first rotation, live poll slides with QR-to-vote, presence constellation.

Each entry briefly names: the surface, the primitive it encodes, and any algorithm or invariant an agent needs to know (e.g. the `daySeed` formula for /today, the `meta.location` SoCal-token match for /local).

## Why this over the pool

PointCast's design contract is "every human surface has a machine mirror + the manifest surfaces both." The mirror was shipped tick-by-tick; the manifest wasn't updated each time. Catching up today.

Also: Mike's morning directive ("get codex and manus back in the loop") depends on Codex/Manus being able to find the new surfaces. /for-agents is the reference they'll check. Refreshing here removes a friction point for their work.

## Design decisions worth recording

- **Inline algorithmic details, not "see /today for more".** Each entry for a surface with a non-obvious algorithm (daySeed, SoCal-token match, cross-cut sort) explains the algorithm in one sentence. Saves agents a follow-up fetch.
- **Bold the surface name + one-word primitive.** "**daily drop.**" "**tonal atlas.**" "**100-mile lens.**" Makes scanning easier. Already the convention for older entries on the page.
- **Group by theme, not alphabetical.** The new entries cluster together right after `/now.json` because they're all "live state" surfaces sharing a rhythm (today's date, today's mood, today's lens). An alphabetical ordering would fragment that cluster.
- **`/tv` called out as standalone, not "tv + tv.json".** There's no machine mirror for /tv yet — it's the display surface, not an ingestable data endpoint. A future `/tv.json` (or `/tv/state.json` for real-time broadcast state) is a reasonable follow-up if one emerges.

## What didn't

- **Mention the /today rotation predictability.** Spotted in the 14:11 retro (sequential walk). Not flagged on /for-agents — that's an editorial detail for Mike's daylight decision, not something agents need to know in the manifest. The `rotation.algorithm` string in /today.json does carry the honest description.
- **Update the intro paragraph.** The "{totalBlocks} blocks and counting" count auto-updates from getCollection. Didn't add a "April 2026 batch" callout or similar — the endpoint list is the truth.
- **Update `/agents.json`**. The discovery manifest at /agents.json is another layer of endpoint listing. Haven't touched it this tick — next sweep-tick can sync it with /for-agents.
- **Update `/llms.txt` / `/llms-full.txt`**. Same story; not updated this tick.

## Notes

- Build: 200 pages (unchanged HTML count; /for-agents content-only update).
- Rendered HTML verified: all 5 new primary endpoints (`/today`, `/moods`, `/mood/`, `/local`, `/tv`) present via grep.
- Fixed an inline Edit typo mid-process — Edit tool added an `r">` prefix on one line from a mis-scoped replace. Caught it in visual review, reverted before build. Noting here because the content.config.ts silent-revert bug and my own Edit-tool typos both produce the same kind of invisible regression; belt-and-suspenders is "grep after every edit."
- Deploy: `https://cb6d9dd4.pointcast.pages.dev/for-agents`
- Cumulative today: 19 shipped (15 cron + 4 chat).
- Next candidates: /agents.json refresh, mini-game v0, STATIONS mode on /tv.

— cc, 16:30 PT
