# Qwen build log — Spotify Playlist Room Companion

**Date:** 2026-07-26
**Builder:** Qwen Code
**Branch:** `agent/spotify-room-companion`
**Brief:** `docs/inbox/2026-07-26-qwen-playlist-room.md`

---

## What was built

The PointCast Listening Room (`/listening-room`) was rebuilt from a cosmic-sparkle demo into a playlist room companion — an art-directed listening desk for people who make playlists and argue lovingly about track 4.

### Files created
- `docs/prd/2026-07-26-spotify-playlist-room-companion.md` — decision-complete PRD
- `src/lib/playlist-room.ts` — pure helpers: URL parsing, room keys, sequence labels, receipts
- `functions/api/spotify-playlist.ts` — bounded metadata endpoint with graceful degradation
- `tests/spotify-playlist-room.test.mjs` — focused test suite (28 tests)
- `docs/qwen-logs/2026-07-26-spotify-playlist-room.md` — this log

### Files modified
- `src/pages/listening-room.astro` — full rewrite: playlist input, embed, sequence table, notes desk, gestures, receipt, activity strip
- `src/pages/listening-room.json.ts` — rewritten as truthful capability manifest
- `src/components/CursorRoom.astro` — added `roomKey` prop for playlist-specific room identity

## Architecture decisions

### Room key = playlist ID
Different playlists get different path-shaped room keys (`/listening-room/playlist/{id}`). CursorRoom got a `data-room-key` opt-in attribute so the listening room can override the default pathname-based key without affecting any other page.

### Metadata is enhancement, not precondition
The `/api/spotify-playlist` endpoint fetches public playlist metadata when Spotify credentials are configured. When they're not, or when the API returns errors, everything else works: the embed, notes, gestures, receipt, room presence. The sequence table shows a placeholder instead of track names.

### Notes are browser-local
`localStorage` keyed by playlist ID. Never sent to any server. The receipt clearly labels itself as containing local/private data. This is a structural privacy decision, not a feature toggle.

### No new dependencies
Zero new packages. The implementation uses existing infrastructure: BlockLayout, CursorRoom, the `/api/room` WebSocket, `localStorage`, and the Spotify Embed/iFrame API.

## Codex review addendum

The review pass kept Qwen's product architecture and art direction, then tightened four production edges: static `?pl=` hydration, live room-key WebSocket reconnection, shared Spotify token-helper reuse with provider links, and the documented Iframe API playback events. No new package or server-side note storage was added.

### No AI in the loop
The product is intelligently designed (sequence labels, note prompts, gesture vocabulary) but does not call any AI model. No Spotify metadata is sent to Qwen, OpenAI, or any ML system.

## What was intentionally not built

- Spotify OAuth expansion or new scopes
- Private playlist support
- Playlist mutation (save, follow, queue control)
- Cross-user synchronized transport
- AI-generated music criticism or ranking
- Database of listener notes
- Tezos mint or wallet gate
- Non-Spotify providers
- Production deploy or merge

## Validation

Tests cover: URL parsing/rejection, tracking stripping, room identity, manifest claims, privacy wording, accessibility hooks, receipt construction, CursorRoom override, metadata degradation.

## Open questions for Codex review

1. The `sequenceLabel` function uses the golden ratio (0.618) for hinge placement. Is this the right heuristic, or should it be simpler (e.g., midpoint)?
2. The metadata endpoint fetches up to 100 tracks. Should this be lower for v1?
3. The gesture vocabulary is fixed (keep this, hinge, lift, closer, rewind). Should there be a way to add custom gestures without code changes?

---

*Built by Qwen. Not Claude Code, not Manus, not Codex. The brief said to have Qwen build something neat. This is what Qwen built.*
