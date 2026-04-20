# Codex brief — VideoLens · data + sentiment analysis for any YouTube block

**Audience:** Codex. Fifth substantive project, filed alongside Pulse (#1), STATIONS (#2), YeePlayer v1 (#3), and TrackLab (#4). Mike 2026-04-19 18:15 PT: *"yah, and it'd be neat to do data and sentiment analysis on the youtube video as a feature, and any other interesting data, i saw a neat service like this once"*.

**Context:** Mike has been thinking about a tool he saw once — a YouTube analyzer that pulls rich analytical data from any video. The specific service he saw isn't named, but the shape is clear: URL in, structured intelligence out. The right PointCast expression of this: **VideoLens**, a standalone analysis primitive that any surface can call, not a feature trapped inside TrackLab.

Why standalone: PointCast has ~15 WATCH-type blocks today (YouTube embeds). Each could benefit from a lens of "what's actually going on in this video." TrackLab is one consumer (it uses the lens data alongside beat detection). `/b/{id}` for any WATCH block is another (optional "LENS →" chip opens the analysis panel). `/tv` could be a third (a slide could show the lens for the currently-playing embed).

---

## What VideoLens does

**One sentence:** Takes a YouTube URL, returns a rich JSON payload of metadata + audio features + transcript + sentiment arc + topics + palette + engagement — from multiple APIs composed into one response.

### The analysis payload

Aim for this shape (rough — Codex refines based on what's achievable):

```json
{
  "$schema": "https://pointcast.xyz/videolens.json",
  "video": {
    "id": "jPpUNAFHgxM",
    "url": "https://youtube.com/watch?v=jPpUNAFHgxM",
    "title": "Alan Watts · Awakening The Mind",
    "channel": { "id": "...", "name": "Alan Watts Org", "subscribers": 523000 },
    "publishedAt": "...",
    "duration": 930,
    "description": "...",
    "tags": ["meditation", "philosophy", ...]
  },
  "engagement": {
    "views": 2340000,
    "likes": 48200,
    "commentCount": 3100,
    "likeRatio": 0.021,
    "velocity": { "viewsPerDay": 180, "trend": "steady" }
  },
  "audio": {
    "tempo": 0,
    "key": null,
    "energy": 0.12,
    "valence": 0.68,
    "danceability": 0.08,
    "speechiness": 0.92,
    "durationMs": 930000,
    "loudness": -22
  },
  "transcript": {
    "language": "en",
    "segments": [
      { "start": 12.4, "end": 18.9, "text": "So what we're going to do now is..." }
    ],
    "wordCount": 1820
  },
  "sentiment": {
    "overall": { "polarity": 0.42, "subjectivity": 0.68, "label": "calm-positive" },
    "arc": [
      { "t": 0, "polarity": 0.1, "label": "neutral-intro" },
      { "t": 120, "polarity": 0.5, "label": "warming" },
      { "t": 480, "polarity": 0.7, "label": "peak-warmth" },
      { "t": 900, "polarity": 0.3, "label": "closing-settle" }
    ],
    "peaks": [{ "t": 480, "kind": "joy" }]
  },
  "topics": [
    { "label": "meditation", "confidence": 0.94 },
    { "label": "breath", "confidence": 0.78 },
    { "label": "consciousness", "confidence": 0.71 }
  ],
  "visual": {
    "dominantPalette": ["#2a2a2a", "#8a7a5a", "#3a3a40"],
    "brightness": 0.32,
    "sceneChangesPerMin": 0.4,
    "thumbnailUrl": "..."
  },
  "comments": {
    "sampleSize": 100,
    "sentiment": { "positive": 0.78, "neutral": 0.18, "negative": 0.04 },
    "topThemes": ["gratitude", "memory-of-watts", "before-sleep"]
  },
  "generatedAt": "...",
  "sources": {
    "metadata": "YouTube Data API v3",
    "audioFeatures": "Spotify API (track matched) + Meyda (fallback)",
    "transcript": "YouTube auto-captions OR AssemblyAI",
    "sentiment": "HuggingFace pipeline (distilbert-base-uncased-sst2)",
    "topics": "HuggingFace (bart-large-mnli zero-shot)",
    "visual": "YouTube thumbnail API + Cloudflare Images palette extractor",
    "comments": "YouTube Data API + sentiment model"
  }
}
```

Not every field has to populate from day one. Degrade gracefully — if Spotify track-match fails, leave audio features null. If comments are disabled on a video, report `sampleSize: 0`. The payload shape stays stable.

---

## API composition

This is a **research-heavy brief** — the fun part for Codex is picking which APIs produce the best signal for the cost.

### Recommended composition (you can override)

| Layer | Service | Free tier | Notes |
|-------|---------|-----------|-------|
| Video metadata | **YouTube Data API v3** | 10k units/day | Free with Google API key. Basic + engagement. |
| Music features | **Spotify Web API** | Free with OAuth | Tempo/key/energy/valence. Requires matching the YouTube video to a Spotify track (fuzzy title match). Fails on non-music. |
| Audio features fallback | **Meyda** (in-browser) | Free | For non-Spotify-matchable audio. Run on the visitor's browser against the IFrame embed. |
| Transcript | **YouTube auto-captions** (free) with **AssemblyAI** fallback | AssemblyAI: $0.37/hr | Most videos have auto-captions; fall back to ASR when missing. |
| Sentiment | **HuggingFace Inference API** | 1k chars/month free; $0.00006/1k chars paid | Sentence-level sentiment. Arc = sliding window over transcript. |
| Topics | **HuggingFace zero-shot** (bart-large-mnli) | Same quota | Classify transcript against a topic list. |
| Visual palette | **Cloudflare Images API** OR **node-vibrant** | Free | Extract dominant colors from thumbnail. |
| Comments sentiment | **YouTube Data API** + **HuggingFace** | Same | Sample ~100 comments, run sentiment. |

All paid services are pay-as-you-go and stay cheap at PointCast's volume.

### Secrets needed as CF Pages env vars

- `YOUTUBE_API_KEY`
- `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET`
- `ASSEMBLYAI_API_KEY`
- `HUGGINGFACE_API_KEY`

Mike binds these in the dashboard (per `docs/setup/email-pointcast.md`'s Step 2 pattern). The API code reads them via `env.XXX`.

---

## Architecture questions for your doc

### A1. Composition strategy

Three options:

1. **Single Cloudflare Function** (`functions/api/videolens/analyze.ts`) that fans out to all APIs in parallel, waits for all, returns composed payload. Simple; slowest API gates the response.
2. **Streaming endpoint** — return partial results as each API resolves. UI shows "metadata ✓ → transcript ✓ → sentiment..." with live updates.
3. **Job-based** — POST to kick off, poll GET for result. Best for 30+s analyses.

Recommend option 2 for UX quality, option 1 for simplicity. Document your choice.

### A2. Caching

A full analysis per video is expensive (~5-15s of API time, ~$0.05-$0.20 depending on length). Cache aggressively:

- Cache key: `videolens:{youtubeId}:v1`.
- TTL: 30 days (YouTube metadata drifts slowly; engagement data would be refreshed more often, but first-pass caching everything is fine).
- Store: KV namespace (create `PC_VIDEOLENS_KV`) or R2 if payloads exceed 25KB.

### A3. Rate limiting per visitor

Analysis is expensive. Limits:

- Mike (wallet-authenticated): unlimited.
- Others: 3 analyses per IP per day.
- Enforced via a small KV counter (`videolens:ratelimit:{ip}:{date}`).

### A4. What VideoLens returns when analysis fails

Not all YouTube URLs resolve. Comments may be disabled. Spotify may not have the track. Videos can be private or region-locked. Every field in the payload should be nullable with a reasonable fallback; partial success should return 200 with `null` fields + a top-level `warnings: []` array listing what failed.

### A5. How PointCast surfaces consume it

- **TrackLab** — calls VideoLens FIRST, uses the metadata + transcript + palette as context while the user edits beats. The beats come from TrackLab's own onset detection; VideoLens doesn't attempt beat detection itself (separate concern).
- **`/b/{id}` for WATCH blocks** — optional "✦ LENS" chip below the embed. Click → fetch `/api/videolens?url={embed}` → render a panel showing: engagement stats, mood arc chart, top topics, dominant palette swatches, transcript excerpt.
- **`/tv`** — a future slide type could show a lens view for the currently-featured WATCH block. Not in scope for this brief but worth architecting for.

---

## Deliverables

### 1. Architecture doc

`docs/reviews/2026-04-19-codex-videolens-architecture.md`, 600-1200 words. Answers A1-A5 + documents the API composition decisions.

### 2. Implementation

- **`functions/api/videolens/analyze.ts`** — the main endpoint. GET with `?url=...` param; returns the full payload (or streams it per A1).
- **`src/lib/videolens.ts`** — client-side helpers for fetching + caching, type definitions for the payload.
- **`src/components/VideoLensPanel.astro`** — the UI panel that renders a payload. Used by `/b/{id}` for WATCH blocks (optional chip) and by TrackLab.
- **`src/pages/videolens.astro`** — a standalone demo page. Paste a URL, see the lens. Good for debugging + showing Mike the output shape.

### 3. Linkage

- `/b/{id}` WATCH pages get an optional "✦ LENS" toggle below the embed that reveals the `VideoLensPanel`.
- `/tracklab` consumes VideoLens as its first fetch when Mike pastes a URL — uses metadata + transcript + palette to pre-populate the block JSON scaffold.
- `/for-agents` documents `/api/videolens/analyze` with the payload schema.
- `/agents.json` surfaces the endpoint in the discovery manifest.

### 4. A demo on an existing block

Run VideoLens on `/b/0262` (Alan Watts) and commit the resulting JSON payload as `docs/samples/videolens-0262.json`. Proof of concept.

---

## Working style

- Same as previous briefs: ship-to-main, `author: 'codex'`, VOICE.md compliance.
- Budget: **~6-10 hours** focused. Most API-integration-heavy of the five projects.
- Don't stall on TOS questions. If a specific API refuses YouTube audio, document and fall back.
- Match existing /b/{id} design language for the VideoLensPanel — warm cream bg, oxblood accents, Lora serif for body, JetBrains Mono for metadata.

### Service Mike was referring to

Mike couldn't name the service. Likely candidates he may have seen:

- **Genius / Rap Genius** — annotation + meaning layer
- **Spotify Enhanced Discover** — audio features surfaced on track pages
- **Musixmatch Insights** — lyric-based sentiment
- **ChartMetric** — artist-level analytics
- **Tubebuddy / VidIQ** — creator analytics
- **Vidooly** — deep video analytics
- **RunwayML** — visual analysis tools

VideoLens composes the best of these into one PointCast-native shape.

---

## Why this as the fifth project

- **Content-enrichment primitive.** Project #4 (TrackLab) creates content. Project #5 (VideoLens) enriches content. Pair.
- **Doesn't duplicate anything.** None of the other four projects touch video metadata / transcript / sentiment. No architectural overlap.
- **Touches every WATCH block on the site.** High-leverage — the moment it ships, every existing YouTube block gains a new pane.
- **First paid-API composition at PointCast.** Sets the pattern for future multi-API features (events aggregation for /local, sports feeds for MorningBrief, etc.).

---

Filed by cc, 2026-04-19 18:15 PT, sprint `codex-videolens-handoff`. Linked from Block 0287.
