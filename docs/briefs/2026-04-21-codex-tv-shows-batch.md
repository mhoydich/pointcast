# Codex CLI batch brief — three small TV shows for the lineup

**Target:** Codex CLI (manual paste — MCP timed out twice this overnight, manual is the reliable path)
**From:** cc on behalf of Mike
**Date written:** 2026-04-21 02:31 PT (overnight tick 6)
**Source:** Mike super-sprint directive 2026-04-21 ~00:35 PT — *"see if you can get codex involved"* + *"keep going on tv, noun drum very cool"*
**Handoff:** Mike opens `codex` in the pointcast repo, pastes any of the three specs below (one per session), Codex ships the file, Mike PRs/merges or just commits, ledger entry follows. Each spec is independently shippable.

---

## How to use this brief

Three independent shows. Pick any one (they don't depend on each other). Copy the **entire spec block** for that show — header through "DELIVERABLE" — into Codex CLI as the initial prompt. Each is sized for a single Codex session (~150–200 lines of output).

Pattern that works reliably (per ledger entries about Codex success/failure):
- **Low reasoning effort** (`/reasoning low`)
- **Single file output**
- **Copy-from-existing pattern** named explicitly
- **Working directory must be `/Users/michaelhoydich/pointcast`**

---

## Spec 1 — `/tv/shows/drum-noundrum-overlay.astro`

**Goal:** A new TV show that overlays the *current visitor's noundrum world state* on top of the drum visualizer's pulsing center drum. Reads `pc:noundrum:state` from `localStorage` on load; renders the visitor's owned tiles as colored dots arranged in a mini-grid INSIDE the spinning drum head; pulses each tile dot subtly on each beat. Self-playing rhythm cycles through the same 5 modes as `/tv/shows/drum-vis`.

**Pattern to copy verbatim:** `/Users/michaelhoydich/pointcast/src/pages/tv/shows/drum-vis.astro` — same skeleton, same fullscreen wiring, same audio synth, same 5 tempo modes, same idle-chrome fade. ONLY change is the inner content of the drum: instead of just a gradient circle, render a 24×16 mini-tile-grid using `pc:noundrum:state.ownedTiles` (an array of tile indices). Empty tiles are dim, owned tiles are amber.

**Constraints:**
- Single Astro file at `/Users/michaelhoydich/pointcast/src/pages/tv/shows/drum-noundrum-overlay.astro`.
- ~250 lines max.
- No new npm deps. No edits to other files.
- Inline `<style>` + inline `<script is:inline>`.
- After writing, also append a tile to `/Users/michaelhoydich/pointcast/src/pages/tv/shows/index.astro`'s `SHOWS` array with slug `drum-noundrum-overlay`, kicker `OVERLAY / RHYTHM`, palette `dark`.
- Do NOT run `npm run build` — cc will build later.

**Rationale:** Bridges the two most-engaged surfaces (drum visualizer + noundrum) into a single TV-mode reading. The drum is rhythm; the noundrum tiles are art-from-rhythm; together they read as the rhythm-becoming-art process visualized.

---

## Spec 2 — `/tv/shows/nouns-by-channel.astro`

**Goal:** Variant of `/tv/shows/nouns` that groups the Noun mosaic by **channel color**. Same drift animation per tile, same 240-tile cap, but the grid is now *sorted* by `block.channel` and tinted by the channel's `color600` value from `src/lib/channels.ts`. Reads as channels-of-nouns rather than uniform mosaic.

**Pattern to copy verbatim:** `/Users/michaelhoydich/pointcast/src/pages/tv/shows/nouns.astro`. Same structure, same drift CSS, same fullscreen wiring. Diff is purely in the data prep: import `CHANNELS` from `../../../lib/channels`, sort `tiles` by `b.data.channel`, and add a `channelColor` field to each tile object using `CHANNELS[block.channel].color600`. Tint each `.tile` with a 1px outer ring in that color (`box-shadow: 0 0 0 1px var(--ch);` set via inline style).

**Constraints:**
- Single Astro file at `/Users/michaelhoydich/pointcast/src/pages/tv/shows/nouns-by-channel.astro`.
- ~200 lines max.
- No new npm deps. No edits to other files than appending an entry to `/Users/michaelhoydich/pointcast/src/pages/tv/shows/index.astro`'s `SHOWS` array (slug `nouns-by-channel`, kicker `VISUAL / GROUPED`, palette `dark`).
- Do NOT run npm.

**Rationale:** The original nouns mosaic is character-by-character. Grouped-by-channel turns the same data into a categorical reading — you see how the archive distributes across the editorial taxonomy, character-density per channel, etc.

---

## Spec 3 — `/tv/shows/agent-pulse-fullscreen.astro`

**Goal:** Fullscreen variant of the home page's PulseStrip multi-agent dot row, but blown up to 4-quadrant fullscreen showing all four agents (cc / codex / manus / chatgpt) with their last ship title, time-ago counter, and pulsing dot when within 20 minutes of last ledger activity.

**Pattern to copy verbatim:** `/Users/michaelhoydich/pointcast/src/pages/tv/shows/clock.astro` — same skeleton, same fullscreen wiring. Replace the clock content with a 2×2 grid of agent quadrants. Each quadrant shows: agent name (large mono), last ship title (serif), relative time (mono), pulsing dot (green when working, dim when idle). Read from `COMPUTE_LEDGER` (`import { COMPUTE_LEDGER } from '../../../lib/compute-ledger'`); for each agent, find the most recent ledger entry where `e.collab` matches (treat 'mh+cc' as cc).

**Constraints:**
- Single Astro file at `/Users/michaelhoydich/pointcast/src/pages/tv/shows/agent-pulse-fullscreen.astro`.
- ~200 lines max.
- No new npm deps. No edits to other files than appending an entry to the `SHOWS` array in the index (slug `agent-pulse-fullscreen`, kicker `LIVE / AGENTS`, palette `dark`).
- Do NOT run npm.

**Rationale:** Cast this to a wall-mounted display in the workspace and you have a permanent ambient view of which agent shipped what when — exactly the kind of operational glanceability the home PulseStrip provides on a small scale, scaled up for room ambient.

---

## After all three ship

When all three are merged, ping cc in the inbox with subject `codex shows shipped` and we'll cc-side: rebuild, deploy, add ledger entries, write a block naming the codex involvement loop closing.

Atomic, low-reasoning, single-file, copy-from-existing — that pattern has worked for Codex on this repo before. Should be three clean sessions back-to-back, ~5–10 min each.

— cc, 2026-04-21 02:31 PT, overnight cadence
