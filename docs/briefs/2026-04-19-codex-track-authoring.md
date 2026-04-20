# Codex brief — YeePlayer Track Authoring Tool

**Audience:** Codex. Fourth substantive project, alongside Pulse (`docs/briefs/2026-04-19-codex-pulse-minigame.md`), STATIONS (`docs/briefs/2026-04-19-codex-tv-stations.md`), and YeePlayer v1 (`docs/briefs/2026-04-19-codex-yeeplayer-v1.md`). Mike 2026-04-19 18:00 PT confirmed ChatGPT Pro tier + Max Codex access — real capacity for multi-project parallelism.

**Context:** PointCast's YeePlayer has four hand-authored tracks today (0236 Chakra, 0262 Alan Watts, 0263 November Rain, 0264 Purple Rain). Every new track requires cc to manually write a `media.beats` array — which takes real editorial time and doesn't scale. The inverse of this problem: Mike or any visitor pastes a YouTube URL at `/drop`, and a tool produces a ready-to-use `beats` array in ~60s. That's the project.

---

## The tool: **TrackLab**

**One sentence:** Paste a YouTube URL at `/tracklab`, the tool pulls the audio, runs onset detection to find beat candidates, lets you name + color each detected beat, and outputs a full `media.beats` JSON ready to paste into a new block (or auto-creates the block if you're Mike).

### Why it matters

- **Content multiplier.** Four tracks today → unbounded tomorrow. Any YouTube music or spoken-word video becomes playable.
- **Unblocks YeePlayer v1.** Codex's multiplayer YeePlayer (project #3) is more interesting at 20 tracks than at 4.
- **Proof-of-concept for author-time tooling.** PointCast has lots of "at-build-time" automation (daily drop rotation, mood filtering) but no "at-author-time" tooling. TrackLab is the first.

### Primary user is Mike, not visitors

- Mike authenticates somehow (Beacon wallet, or simple password via CF Access) → TrackLab gives him the full pipeline (URL → beats → save as block).
- Visitors get a limited preview mode (paste URL, see candidate beats, export as JSON to paste into a PR). No block-write for non-Mike.

---

## Mechanics

### 1. Paste a URL

Visit `/tracklab`. Input: a YouTube URL. Submit. Tool:
- Extracts the video ID.
- Fetches the audio track (see Architecture A2 for approach).
- Uploads it to a temporary Cloudflare R2 bucket (`pointcast-tracklab-audio`, 24h expiry).
- Runs onset detection on the audio → beat candidates.

### 2. Beat editor UI

The UI shows:
- A waveform visualization of the audio (D3 or Canvas-based).
- Detected beat markers overlaid on the waveform as vertical lines (clickable).
- A table below: timestamp, label (auto-generated — e.g. "VERSE 1", "CHORUS", "OUTRO" via simple heuristic), color picker (default cycles bija palette).
- Play/pause scrubber syncs the waveform with audio playback.
- Allow: click to add a beat; right-click to remove; drag to adjust timestamp.

### 3. Export

Two buttons:
- **Export JSON** — outputs a `media.beats` array Mike can paste into a block.
- **Save as block** (Mike-only) — creates a new JSON file at `src/content/blocks/{next-id}.json` with the full block schema, opens a PR or pushes directly to main.

### 4. Preview

After export, show a mini-YeePlayer embed with the track + beats so Mike can verify before committing.

---

## Architecture questions for your doc

### A1. Onset detection library

Browser-side options:
- **Meyda** (https://meyda.js.org) — audio feature extraction, includes onset detection.
- **essentia.js** (https://essentia.upf.edu) — Essentia WASM port, most sophisticated but heavy (~5MB).
- **aubio.js** (https://github.com/qiuxiang/aubiojs) — onset + tempo, lighter (~500KB).

Server-side alternative: Cloudflare Worker can't run real audio DSP at scale (CPU cost). Better to run in-browser after audio download.

Recommend Meyda for v0 — simplest integration, acceptable accuracy for rough beat markers (Mike edits anyway). Document the choice.

### A2. YouTube audio extraction

YouTube terms prohibit direct audio downloads for most uses. Options:

1. **ytdl-core (Node)** or **youtube-dl / yt-dlp (CLI)** — violates TOS for public redistribution; acceptable for private authoring tool if PointCast states "fair use for transformative authoring."
2. **Use YouTube Data API + IFrame Player API, analyze via Web Audio API tap into audio output** — legal but requires keeping the video playing in-browser during analysis. Slower UX.
3. **Pre-decode via a hosted service** (e.g., `cobalt.tools`, but those change often).

Pragmatic v0: option 2 (in-browser via IFrame Player API + analyser node). Slower but TOS-compliant. Document fallbacks for if a video is region-locked or has embed-disabled.

### A3. File sizes + bandwidth

If you go option 1 (download the audio), a 5-minute song is ~5MB MP3. Cloudflare R2 storage is cheap but egress has cost. A 15-minute Alan Watts video is ~15MB. Document the storage + bandwidth math.

If option 2 (Web Audio analysis of embed), no storage needed — all analysis happens in the visitor's browser against the playing audio.

### A4. Mike-only gate

TrackLab's "Save as block" action writes to the repo. Needs auth.

Options:
- **CF Access** — gate the entire `/tracklab` page behind a CF Access token. Simple but heavy (requires one-time IdP setup).
- **Beacon wallet check** — TrackLab verifies the connecting wallet matches Mike's `tz2...` address before enabling the save button. Lighter, stays in-site.
- **Password / API key** — Mike enters a password; cc stores the hash in a CF env var. Simplest, least secure.

Recommend the Beacon check — it's already the wallet primitive the site uses, and graceful degradation (visitor → export-only mode) is easy.

### A5. "Save as block" write path

Options:
1. **GitHub API with a PAT** — cc Function POSTs to `api.github.com/repos/.../contents/...` to create the file. Requires a PAT stored as CF secret.
2. **Cloudflare KV write + deferred commit** — save to KV, cc picks up next sprint tick and commits. Slower but no GitHub secret needed.
3. **Edge build hook** — trigger a Cloudflare Pages rebuild after writing. Requires the content to land somewhere first (R2 or KV).

Recommend option 1 with a PAT scoped to `contents:write` on `MikeHoydich/pointcast` only.

---

## Deliverables

### 1. Architecture doc

`docs/reviews/2026-04-19-codex-tracklab-architecture.md`, 600-1200 words. Answers A1-A5.

### 2. Implementation

- **`src/pages/tracklab.astro`** — the authoring UI. Big single-page SPA-ish experience. Can use a tiny framework (Preact?) or vanilla JS — your call.
- **`functions/api/tracklab/extract-audio.ts`** (if going option 1 on A2) — proxies YouTube audio fetch.
- **`functions/api/tracklab/save-block.ts`** — the Mike-only write endpoint. GitHub-API-based per A5.
- **Library integration** — `meyda` or `aubio.js` as npm dep or CDN script.

### 3. Linkage

- `/drop` gains a "PASTE MUSIC URL → AUTHOR A TRACK →" button routing to `/tracklab?url=...`.
- `/for-agents` documents `/tracklab` + the `/api/tracklab/*` endpoints.
- `/yee` index page carries a "AUTHOR A NEW TRACK" link pointing to TrackLab when the viewer is Mike.

### 4. A demo track

End your PR by running TrackLab on one new video (Mike will suggest one, or pick something you'd find interesting — maybe a Brian Eno ambient track or a piece of indie electronica). Commit the resulting block with `author: 'codex'` and source cited.

---

## Working style

- Same as previous briefs: ship-to-main, author `codex`, match existing design language.
- Budget: **~4-8 hours** focused. This is the biggest of the four projects — audio DSP + UI + auth + write-path.
- If you hit a wall on YouTube audio extraction (A2), ship with the in-browser Web Audio route and document the limitation. Don't let TOS uncertainty stall the project.
- If the onset detection isn't accurate enough, that's OK — Mike edits the output. The tool's job is "draft, not final."

---

## Why this as the fourth project

- **Content-generation primitive.** The previous three (Pulse, STATIONS, YeePlayer v1) are interaction primitives. This is the first primitive that CREATES content. Different muscle; valuable separately.
- **Scales YeePlayer v1.** Codex's v1 multiplayer mode only shines when there are 20+ tracks. TrackLab produces them.
- **First "at-author-time" tool.** PointCast has strong at-build-time automation. TrackLab opens the door to more authoring helpers (glossary builder, mood-tagging UI, etc.) — patterns Codex can reuse.
- **Self-contained enough to ship in parallel.** Doesn't touch `/tv`, doesn't depend on Pulse or STATIONS. Codex can sequence or parallel without coordination overhead.

---

Filed by cc, 2026-04-19 18:05 PT, sprint `codex-tracklab-handoff`. Linked from Block 0286.
