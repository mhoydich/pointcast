---
sprintId: codex-videolens-handoff
firedAt: 2026-04-19T18:15:00-08:00
trigger: chat
durationMin: 14
shippedAs: deploy:6da3f14a
status: complete
---

# chat tick — Codex project #5: VideoLens

## What shipped

Mike 18:15 PT: *"yah, and it'd be neat to do data and sentiment analysis on the youtube video as a feature, and any other interesting data, i saw a neat service like this once"*. Filed project #5 as a standalone primitive, not a TrackLab feature.

### Brief — `docs/briefs/2026-04-19-codex-videolens.md`

~1,700 words. Full spec for VideoLens — a composable analysis primitive that takes a YouTube URL and returns a rich structured payload:

- **Video metadata** (title, channel, description, tags, publish date)
- **Engagement** (views, likes, comment count, like-ratio, velocity trend)
- **Audio features** (tempo, key, energy, valence, danceability, speechiness, loudness — via Spotify match OR Meyda fallback)
- **Transcript** (YouTube auto-captions OR AssemblyAI)
- **Sentiment arc** (sliding-window sentiment over transcript, peaks, overall label)
- **Topics** (HuggingFace zero-shot classification)
- **Visual** (dominant palette, brightness, scene-change rate)
- **Comment sentiment** (sample of ~100, positive/neutral/negative breakdown, top themes)

Every field is nullable — partial-success payloads are the norm, not the exception. `warnings: []` array at the root lists what failed.

### Why standalone, not TrackLab-internal

- PointCast has ~15 WATCH-type YouTube embeds. All of them benefit from a lens.
- TrackLab is ONE consumer; `/b/{id}` WATCH pages are another; future `/tv` slides are a third.
- Separation of concerns: TrackLab = beats; VideoLens = signal. Neither needs the other to ship.

### 5 architecture questions for Codex

- A1: composition strategy (single fn vs streaming vs job-based — recommend streaming).
- A2: caching (30-day KV on youtubeId, new `PC_VIDEOLENS_KV` namespace).
- A3: rate limiting (Mike unlimited via wallet auth, anons 3/day/IP).
- A4: partial-success handling (every field nullable, warnings array).
- A5: consumer shape (TrackLab, /b/{id} LENS chip, future /tv slide).

### 4 deliverables

- `functions/api/videolens/analyze.ts` — main endpoint
- `src/lib/videolens.ts` — client helpers + types
- `src/components/VideoLensPanel.astro` — UI panel
- `src/pages/videolens.astro` — standalone demo page

### Proof-of-concept

End of PR: run VideoLens on `/b/0262` (Alan Watts), commit the payload as `docs/samples/videolens-0262.json`. Real output, not synthetic.

### Secrets needed (Mike binds)

- `YOUTUBE_API_KEY`, `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET`, `ASSEMBLYAI_API_KEY`, `HUGGINGFACE_API_KEY`.

Same dashboard pattern as the email `RESEND_API_KEY` in `docs/setup/email-pointcast.md` Step 2.

## Block 0287 — announces #5

`mh+cc` author, sources Mike's verbatim line. Mood `sprint-pulse`. Companions: 0286 (TrackLab — its sibling creator), 0285 (YeePlayer v1), 0262 (the Alan Watts block that'll be the demo target), 0282 (the broadcast arc).

## The Codex queue at 5

Total: Pulse + STATIONS + YeePlayer v1 + TrackLab + VideoLens = ~17-30 hours of focused Codex time.

- **Interaction primitives**: Pulse, STATIONS, YeePlayer v1
- **Content primitives**: TrackLab (creates), VideoLens (enriches)

The two groups are orthogonal — Codex can tackle by primitive-kind or by sequence. All five cross-link via companions; all tagged `mood: sprint-pulse` — filterable at `/mood/sprint-pulse` for the full arc.

## Design decisions worth recording

- **VideoLens standalone vs inside TrackLab.** Considered folding. Decided no — TrackLab + VideoLens coupled would force TrackLab to ship first (or VideoLens to wait). Standalone, they're parallel.
- **Pay-as-you-go APIs rather than self-hosted models.** Real cost but no ops burden. $0.05-$0.20 per analysis at PointCast volume = pennies per month, well worth avoiding GPU hosting.
- **Cache aggressively.** YouTube metadata drifts slowly; 30-day TTL is fine. A re-analysis can be triggered manually later if needed. Keeps the spend near zero after the initial crawl.
- **Nullable everything.** No hard schema. A payload that's missing transcript but has metadata + sentiment + palette is still useful. The UI consumer renders what's there.
- **Demo on 0262 specifically.** Alan Watts meditation is a long spoken-word piece — stress-tests the transcript + sentiment arc features the most. If it works on Alan Watts, it works on shorter music tracks trivially.

## What didn't

- **Sixth project**. Tempted. Held off — five is plenty; let Codex ship 2-3 before we learn their velocity + re-stock.
- **TrackLab + VideoLens architecture doc showing shared components**. Could write a meta-doc describing how the two primitives interoperate. Deferred — both briefs reference each other already; Codex can work it out.
- **Start implementing the `VideoLensPanel` stub so it's ready pre-Codex**. Considered; decided against for the same reason as Pulse/STATIONS/TrackLab — let Codex own the full shape.

## Notes

- Build: 204 → 205 pages (+1: /b/0287).
- Deploy: `https://6da3f14a.pointcast.pages.dev/b/0287`
- Chat-fired tick.
- Cumulative today: 25 shipped (15 cron + 10 chat).
- Codex queue: 5 projects. Briefs filed within a ~55-minute window: 17:20, 17:45, 17:55, 18:05, 18:15.
- "The service Mike saw once" isn't named in the brief, but likely candidates (Genius, Musixmatch, ChartMetric, VidIQ, RunwayML, Spotify Enhanced Discover) are listed as reference for Codex.

— cc, 17:57 PT
