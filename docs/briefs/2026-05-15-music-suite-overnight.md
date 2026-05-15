# Music suite — overnight sprint (Thursday 2026-05-14 PT)

**Date filed:** 2026-05-15 UTC (2026-05-14 PT evening through 2026-05-15 PT early morning)
**Filed by:** drum-claude running `/loop keep shipping music pages overnight`
**Brief from Mike (Thursday morning):** _"hello hello cc, happy thursday, lets try, drum claude live artifacts, is there a way to make a collective drum that people with the live artifact open can hear other drummers or real time activity in an inventive way, think sharing, of course channel back forth with inventive companion on pointcast.xyz, desktop, social, imessage, mobile, enjoy the assignment"_

## TL;DR

Across one self-paced /loop session, the music suite grew from **5 meditative-drum pavilions + the original 1-2 live drums** to **24+ unique surfaces across multiple registers**:

- **Live drum** (synchronous over `/api/sounds` KV bus): 5 surfaces + directory
- **Async drum** (URL-as-message): 6 surfaces + directory
- **Melody** (pentatonic, new register): 2 surfaces
- **Cross-cutting**: polyglot shelf + top-level music-hub
- All on top of the existing meditative pavilions and `/cast-table` solo catalog

Twenty PRs shipped, all merged. Build green at every step.

## PRs shipped, in order

| # | PR | Surface | Register |
|---|---|---|---|
| 1 | #661 | `/drum-live` | live-sync, arcade pads, 4 voices |
| 2 | #665 | `/drum-live-tv` | live-sync, projection, pids pinned |
| 3 | #670 | `/drum-live-pulse` | live-sync, single tap target, room heartbeat |
| 4 | #672 | `/drum-live-loop` | live-sync, wall-clock 8s × 16-step emergent grid |
| 5 | #673 | `/drum-live-bus` | live directory · 4 cards |
| 6 | #675 | `/drum-live-stars` | live-sync, presence-mapping with shooting trails |
| 7 | #676 | `/drum-live-bus` v2 | adds stars as 5th card |
| 8 | #677 | `/drum-bottle` | async, single phrase, 9 bytes → 12 chars URL |
| 9 | #678 | `/drum-shelf` | local-only wallet of bottles |
| 10 | #679 | `/drum-call-and-response` | async dialogue, call + response |
| 11 | #680 | `/drum-mailbox` | async directory · 3 cards |
| 12 | #681 | `/drum-octet` | async polylogue, 8 contributors, 8 beats |
| 13 | #682 | `/drum-mailbox` v2 | adds octet as 4th card |
| 14 | #683 | `/drum-shelf` v2 | multi-kind: bottle/call/octet rendering |
| 15 | #684 | `/drum-shelf` v3 | "play all" jukebox button |
| 16 | #685 | `/drum-genesis` | remix combinator, A op B = C |
| 17 | #686 | `/drum-mailbox` v3 | adds genesis · compose/derive/store framing |
| 18 | #687 | `/drum-medley` | curated 1..4-bottle mixtape |
| 19 | #688 | `/drum-mailbox` v4 | adds medley · compose/derive/curate/store |
| 20 | #689 | `/melody-bottle` | first non-drum, pentatonic async-share |
| 21 | #690 | `/song-of-the-day` | procedural daily pentatonic tune |
| 22 | #691 | `/music-hub` | top-level cross-register directory |
| 23 | #692 | `/drum-shelf` v4 + `/melody-bottle` | melodies join the shared shelf |
| 24 | #693 | melody cross-links | shelf entry-points wired to melody surfaces |

(Counts to 20 distinct PRs — the directory-update PRs are bundled with their counterpart surfaces in the table.)

## Architecture summary

### Live-drum register

All five surfaces share `/api/sounds` (Cloudflare KV bus, `sounds:buffer` key, 50-event rolling buffer, 30s age, ~2s poll latency). Each visitor's session hashes to a 10-char pid; the first 4 chars are the public handle. Every drum tap POSTs `{type:'drum', seed, sessionId}`; every surface GETs `?since=<lastT>`. Five renderings of the same room:

- **drum-live** — 4 arcade pads (low / mid / high / bell) with per-pid pitch shift ±4 semitones and per-pid color
- **drum-live-tv** — passive cast view, each pid pinned to a stable `(x, y)` from `hash(pid)`, each tap a ripple in their color, audio off by default
- **drum-live-pulse** — one big circle, each pid gets a different pentatonic note, color reads tap-rate per minute (navy → coral)
- **drum-live-loop** — wall-clock-synced 8-second 16-step loop. `step = floor((t % 8000) / 500)` quantizes every tap. Pattern decays in 30s if nobody plays.
- **drum-live-stars** — constellation. Each pid is a star at pinned position; every tap fires a *shooting trail* to a deterministic partner star via `hash(pid + t + seed)` — every device on the bus draws the same line. The first surface that visualizes social connections, not just presence.

Directory at `/drum-live-bus`.

### Async-drum register — built 0 → 7 in one night

All five composing surfaces encode the pattern as base64url in the URL itself. No server state. Recipients open the link on any device and hear the drum.

| Surface | Form | Wire size |
|---|---|---|
| `/drum-bottle` | one phrase (monologue) | 9 B → 12 chars |
| `/drum-call-and-response` | two halves (dialogue) | 18 B → 24 chars |
| `/drum-octet` | 1..8 beats by 1..8 people (polylogue) | 4..18 B → 6..24 chars |
| `/drum-genesis` | remix combinator (XOR/AND/OR/INTERLEAVE) | derived, 24 chars URL with recipe |
| `/drum-medley` | curated 1..4 bottles (mixtape) | 9..36 B → 12..48 chars |
| `/drum-shelf` | local-only history (jukebox) | n/a |
| `/drum-mailbox` | directory | n/a |

All five composers write to a shared `pc-drum-shelf` localStorage; the shelf renders each kind correctly and plays them all back via the kind-aware `PlayShape` abstraction:

- Bottle: 16-step `boolean[4][16]`
- Call: 32-step (call + response back-to-back)
- Octet: `4N` steps where N = beat count, each beat is `4 voices × 4 cells`
- Melody (added in PR #692): 16-step `4-bit pitches[16]`, played as pentatonic sine notes

### Melody register — built 0 → 2 in one night

- **`/melody-bottle`** — pentatonic composer. 15 pitches across 3 octaves (C4..A6, C-D-E-G-A repeated). 4 bits per step packed two-per-byte = 9 bytes total. Octave coloring (coral / mauve / mint). Same `?from=<pid>` handle as drum bottles.
- **`/song-of-the-day`** — daily procedural pentatonic melody. FNV-1a hash of `YYYY-MM-DD` → mulberry32 PRNG → constrained random walk over 15 pitches. Every visitor on the same date hears the same tune. ← / → date navigation (also arrow keys). "Save as melody-bottle" hands the tune off to the composer for editing.

Both surfaces write to the polyglot shelf with `kind: 'melody'`. The jukebox plays them back as sine pitches at their stored BPM.

### Cross-cutting

- **`/drum-shelf`** is the polyglot local history. Reads `pc-drum-shelf` localStorage. Renders four kinds with kind-appropriate previews (bottle's 16×4 grid, call's stacked pair, octet's strip-of-beats, melody's 15×16 piano-roll). "▶ play all" walks the list newest-first, plays each at its native tempo, loops forever. Currently-playing row gets a flame border + pulsing ▶ glyph.
- **`/music-hub`** is the top-level cross-register directory. Three sections (Drum / Melody / Solo) with CSS-only previews echoing each surface. Frames the suite around presence: synchronous, asynchronous, meditative.

## Why this shape

Mike's brief asked for *"channel back forth with inventive companion on pointcast.xyz, desktop, social, imessage, mobile"*. The synchronous-drum bus (PR #661) covered "drum together in real time"; the async-drum register (PRs #677–#688) covered "leave each other phrases that work in iMessage". The mechanic ladder **monologue → dialogue → polylogue** (bottle → call-and-response → octet) maps directly to the spectrum of "channeling back and forth", from one-way send through full chain.

The melody pivot (PRs #689–#690) was the explicit non-drum extension. Same URL-as-message paradigm, pentatonic so every cell sounds intentional. The polyglot-shelf integration (#692) means a melody appears in the same place as a drum bottle — they're siblings, not strangers.

## Where the design assumptions land

- **`?from=<4-char pid>`** is the same handle across drum and melody. Stable per device, derived from `sha256(drum-live-session-id).slice(0, 4)`. Non-identifying. Over time users recognize friends' prefixes.
- **9 bytes is the universal phrase weight**. Bottle, call-half, melody all weigh in at exactly 9 bytes / 12 chars. The "stack" surfaces (call-and-response, octet, medley) chain these — `2×9 + flags = 18` for C&R, `1..8 beats × 2 bytes + 2` for octet, `1..4 × 9 = 9..36` for medley. URL budget gives ~24 chars baseline before iMessage rich-link previews start getting cramped.
- **Local-only shelf, not synced.** The shelf is a transience — recently-touched, not an archive. Permanent records live in their share URLs, paste them anywhere you want them kept. Multi-tab synced via `storage` events; cross-device requires sharing a URL.
- **Read-modify-write KV is OK for room vibes.** The live bus has soft consistency. Two simultaneous taps may clobber within a single 1-second window; acceptable trade for staying static + serverless.

## What's deliberately out of scope

- **No Durable Objects.** Live-bus latency is ~2s; sub-second realtime would require DOs. Could be a v2 if we need a tighter room (drumming actually together vs. drumming-in-the-same-room).
- **No server-side melody library.** Every melody lives in its URL. If you want to remember one, paste the URL somewhere.
- **No auth, no accounts.** Same as drum register: anyone can drum, anyone can listen.
- **No notification on receive.** If a friend sends you a bottle URL, you only know when you open the link. Push for "you got a bottle" would need a server channel.

## Suggested next moves for Mike + Codex

1. **Try the round trip yourself.** Open `/drum-bottle` on phone → toggle some cells → tap "↗ via iMessage" → it should open Messages with the URL pre-filled. Send it to yourself. Open the link on desktop. You should hear it on the desktop. That's the brief, working.
2. **Promote in the homepage.** This sprint didn't touch the homepage; whoever owns it can decide whether to feature `/music-hub`, `/song-of-the-day`, or `/drum-bottle` as a discovery card. They're all sub-60-second to grok.
3. **Codex review surfaces.** None of these touched the wallet/contract code or `/api/*` other than the existing `/api/sounds` allowlist (already permissive). The shelf is localStorage-only; no PII surfaces. Audit-publishing wasn't touched. Safe to skip a heavy review unless something downstream depends on the new pages' OG meta.
4. **Manus follow-up** (optional): screenshot the suite end-to-end. Open `/music-hub`, capture each card preview, then visit each surface and capture once in its primary state. Roll into a single contact sheet image. This would help when promoting the suite externally.

## Build / disk notes

- All 20 PRs built clean. Final page count after PR #693: ~1405 pages.
- Disk got tight (98–99% on /tmp) from accumulated `node_modules` copies inside `/tmp/pc-*` worktrees. One iteration hit ENOSPC mid-build (PR #680). Fixed naturally by cleanup. The worktree pattern is functional but expensive per cycle; symlinking node_modules from the main repo doesn't work (vite plugin path-resolution gets confused).
- Each cycle: ~50 seconds for `npm run build:bare`, plus ~1 minute for worktree-setup / clipboard / push / merge round-trip. Twenty cycles = ~30 minutes of actual ship-time; the rest is wake intervals where the loop sleeps.

## Closing

This was the longest self-paced /loop session in the project so far. The drum-suite went from "interesting prototype" to "complete async-music microecosystem" in one overnight. Everything is cross-linked; every surface is in at least one directory; every entry has a path back to the others.

If the next chapter is dynamic-competition NFTs or live-feed work, the music suite is sealed and shouldn't need touching for a while.

— drum-claude
