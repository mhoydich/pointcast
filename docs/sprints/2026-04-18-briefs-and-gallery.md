---
sprintId: briefs-and-gallery
firedAt: 2026-04-18T22:45:00-08:00
trigger: chat
durationMin: 28
shippedAs: deploy:42d50637
status: complete
---

# /briefs + /gallery — Codex/Manus queue surface + Midjourney slideshow

## What shipped

Mike's chat: "get codex working, figure it out, and yah manus, and yah, see if you can get midjourney working, make a midjourney slide show". cc can't actually wire another agent's API — Codex and Manus are separate runtimes. What cc CAN do: make the collaboration surface legible so both agents have a clear queue to pick from, and ship the gallery viewer primitive that Mike populates with his own Midjourney outputs.

### /briefs — reads `docs/briefs/*.md` at build time

- **`src/lib/briefs.ts`** — `import.meta.glob` reader, pulls H1 as title, detects assignee from filename (codex / manus / cc / mixed), counts `## Task` headers for task count, extracts one-line lede from the first non-meta paragraph, looks for `status: complete` marker anywhere in the body.
- **`/briefs` page** — groups by assignee. Codex section has blue accents (role: atomic review tasks, one PR per task). Manus section has orange (role: Cloudflare dashboard / DNS / GSC / IndexNow / objkt / social — anything behind a login). cc-internal section has purple. Each card: date, task count, COMPLETE chip when marked, title, lede, link to the raw GitHub file. "HOW THE HANDOFF WORKS" 4-step at the bottom.
- **Stats strip:** total briefs / total tasks / for-codex count / for-manus count — fed from the existing docs/briefs/ files (7 today).
- **Agent adoption path:** Codex reads `/briefs`, picks a task, opens a PR, tags Mike. Manus reads `/briefs`, runs the ops work, posts a screenshot in the recap. Status signal: append `status: complete` to the brief body → cc picks it up next build → COMPLETE chip renders.

### /gallery — Midjourney slideshow primitive

- **`gallery` content collection** in src/content.config.ts. Schema: slug, title, imageUrl (relative or absolute), optional promptSummary (≤280), tool (midjourney/ideogram/sora/runway/nouns/other), optional mood (slug — feeds future /mood/{slug}), createdAt, author (default mike), source, draft.
- **`/gallery` page** — responsive grid of square tiles (minmax 220px), tap to open full-screen lightbox. Arrow keys + swipe navigate. ESC closes. `a` or ▶ toggles autoplay (6s/frame). Counter + caption (title, tool chip, mood, prompt summary, creation date).
- **Four CC0 Noun seeds** (noun.pics, licensed per nouns.wtf) at /content/gallery/noun-{0101, 0222, 0404, 0888}.json — proves the mechanics while empty of MJ. Mike adds real MJ via /drop or PR; new entries sort to top by createdAt.
- **Authoring docs** at src/content/gallery/_README.md — minimum shape + workflow ("drop URL → next tick files it → rendered").

### Also

- **Discovery wiring:** /briefs + /gallery added to agents.json human-endpoints map + home footer.
- **Two build glitches caught mid-sprint:** (1) gallery `defineCollection` silently dropped from the schema file — re-applied inline right before the export. (2) Caught via `astro sync` GenerateContentTypesError; fixed with a fresh `.astro` cache clear + re-land.

## What didn't

- **Per-product OG images on gallery tiles** — not yet. Gallery tiles use the imageUrl directly as a visual tile. If Mike wants custom OG cards per entry, future sprint.
- **Prompt reproduction from Midjourney** — gallery `promptSummary` is 280 chars max specifically to hold Mike's own summary, not copyrighted prompt text from other creators. If Mike wants to paste full MJ prompts, he owns what he typed; cc won't invent prompts for gathered images.
- **Actually engaging Codex / Manus APIs** — remains a separate-runtime thing. /briefs is the connection tissue, not the RPC.
- **Mood primitive** deferred from 10pm bundle — the `mood` field already exists on gallery entries. Block mood + /mood/{slug} filter page is the next cron tick.

## Follow-ups

- **Mike populates /gallery** by dropping MJ URLs via /drop or committing JSON. Nouns seeds stay as permanent demo unless he deletes them.
- **Mood primitive (11:11 or next chat-tick)** — add mood field to block schema too, build /mood/{slug} filter page surfacing every block/gallery entry with matching mood.
- **Codex R4-1 through R4-5** waiting in docs/briefs/2026-04-18-codex-round-4.md — now visible at /briefs on the Codex panel. Same for M-3-1/2/3 for Manus.
- If gallery gets 20+ entries, add tool filter (show only midjourney / only nouns / etc.) + mood filter.

## Notes

- 23rd sprint shipped today. Cumulative cc work: ~383 min.
- Two schema-revert bugs in two ticks (companions earlier, gallery now). Documented mitigation: always grep for the added field after an edit. Today I caught both via build errors; the pattern is robust enough that these recover cleanly.
- The "can't wire another agent's API" constraint forced a different answer: make the work legible instead of automating it. /briefs isn't a proxy, it's a shared bulletin board. Feels right for the collaboration model Mike's described — three agents, one record, one human merging.
- Gallery ships with four CC0 pieces so the viewer isn't empty. First real Midjourney entry lands whenever Mike drops one. Pipeline tested end-to-end on Nouns; same pipeline handles MJ once URLs arrive.
