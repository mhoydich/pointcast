# PRD — Spotify Playlist Room Companion

**Date:** 2026-07-26
**Builder:** Qwen Code
**Branch:** `agent/spotify-room-companion`
**Status:** v1 vertical slice — ready for Codex review
**Surface:** `/listening-room` + `/listening-room.json`

---

## 1. Problem and product thesis

A playlist is not a rectangle. It is an opening gesture, a sequence with pivots, a hidden hinge, a closer, a story people annotate together. Spotify handles playback. PointCast should handle everything around it: atmosphere, co-presence, conversation, sequencing prompts, listening memory, and a portable room receipt.

The current `/listening-room` is a cosmic-sparkle demo with a hardcoded iframe. It entertains but does not serve the person who made the playlist or the person who wants to listen closely. The companion replaces the demo with an art-directed listening desk that treats every pasted playlist as a room-sized editorial object.

**Thesis:** PointCast turns a Spotify playlist URL into a shareable listening room — delightful for listeners, genuinely useful for playlist makers, and agent-legible by default.

---

## 2. Primary audiences and jobs to be done

### Playlist makers (curators, DJs, friends with taste)
- **Job:** "I spent three hours on this sequence. I want someone to notice track 4 is the hinge."
- **Need:** A way to share a playlist with context, see where listeners pause, annotate the sequence.

### Attentive listeners
- **Job:** "I want to listen to this the way it was meant to be heard — in order, with space to think."
- **Need:** A focused environment that doesn't fight the music, with prompts that deepen the listen.

### Room companions (friends listening together, async or live)
- **Job:** "We're listening to the same thing at the same time from different places."
- **Need:** Co-presence, quick gestures, shared annotations without requiring a separate app.

### Agents and crawlers
- **Job:** "What is this room? What playlist? What can I do here?"
- **Need:** A truthful JSON manifest, stable URLs, no JavaScript-required content.

---

## 3. Experience principles

1. **The playlist is the room.** Not a player widget in a page — the playlist identity shapes the room key, the URL, the presence, the receipt.
2. **Complement, don't imitate.** Spotify carries playback truth. PointCast carries atmosphere, annotation, and memory.
3. **Local-first privacy.** Notes stay in the browser. Nothing goes to an AI model. The receipt is yours.
4. **Musical literacy without invention.** The interface uses real language for sequencing (opener, run, hinge, late turn, closer) without fabricating analysis it can't support.
5. **Hard-edged broadcast aesthetic.** Record-shop intelligence. No glassmorphism, no giant gradients, no over-rounded pills. PointCast SPN coral/ink/cream.
6. **Graceful degradation.** Missing Spotify credentials? The embed still works. No JavaScript? The editorial default and provider link render. Worker down? The room is still excellent alone.

---

## 4. Voice and editorial tone

- Monospace metadata, sentence-case titles, wide-tracked uppercase labels.
- Language that sounds like someone who makes mixtapes and argues lovingly about track 4.
- No generic SaaS copy. No "Welcome to your listening experience!" No emoji in UI labels.
- Prompts are specific and useful: "What promise does the opener make?" not "How does this song make you feel?"

---

## 5. Full user journey

### 5.1 Arrive at the default room
1. Visitor opens `/listening-room`.
2. The PointCast default playlist (the house mix, `35WC68tu9rrBoRrW3N2n0M`) loads as the welcoming demo.
3. The listening desk renders: Spotify embed, sequence table, notes desk, activity strip, room receipt.
4. The room key is `/listening-room/playlist/35WC68tu9rrBoRrW3N2n0M`.

### 5.2 Drop a playlist into the room
1. Visitor pastes a Spotify playlist URL into the input field (or drags a URL onto the drop zone).
2. Client parses the URL, strips tracking parameters (`si`, `utm_source`, etc.), validates it's a playlist.
3. If valid: the URL updates to `/listening-room?pl={playlistId}`. The iframe reloads dynamically. The room key changes. The sequence table resets.
4. If invalid: a clear error message appears. The current playlist is undisturbed.

### 5.3 Listen and annotate
1. The Spotify embed plays (user gesture required — no autoplay).
2. The embed's Iframe API fires `playback_started` and `playback_update`; the player rail truthfully reports play, pause, buffering, clock, and the current track when bounded metadata is available.
3. The sequence table labels each track's position: opener (1), early run (2–3), run (4–7), hinge zone (track 8 or wherever the energy shifts — default midpoint), late turn, closer (last).
4. The notes desk offers five sharp prompts. Notes are stored in `localStorage` keyed by playlist ID.
5. Quick gestures ("keep this", "hinge", "lift", "closer", "rewind") post human-readable messages to the room chat via the existing event bus.

### 5.4 Share the room
1. The canonical URL (`/listening-room?pl={id}`) is copyable.
2. The room receipt can be downloaded as JSON or Markdown. It includes: playlist URL/ID, note prompts and responses, marked moments, creation time. It clearly labels local/private data.

### 5.5 Return to the room
1. Reloading `/listening-room?pl={id}` restores the playlist, notes, and sequence state from localStorage.
2. "Try another" resets the input without destroying notes by surprise — notes persist per playlist ID.

---

## 6. Feature architecture

### v1 vertical slice (this build)
- Spotify playlist URL input (paste, text entry, drag/drop) with strict validation and tracking-parameter stripping
- Dynamic Spotify embed via Iframe API (no full navigation)
- Sequence table with positional labels (opener, run, hinge, late turn, closer)
- Listening-notes desk with five curated prompts, localStorage persistence
- Room receipt (JSON/Markdown download) with clear local-data labeling
- Playlist-specific room identity via `data-room-key` on CursorRoom
- Live room-key switching via `pc:room:key`, including a WebSocket reconnect into the new playlist room
- Official Spotify Iframe API controller with `ready`, `playback_started`, and `playback_update`
- Quick gesture buttons posting to existing room chat
- Activity strip from `pc:room:log-update`
- Art-directed listening desk visual design (SPN coral/ink/cream, hard edges, monospace metadata)
- `/listening-room.json` capability manifest
- Bounded `/api/spotify-playlist` metadata endpoint with graceful degradation
- Mobile-first responsive layout (320px+)
- Full keyboard operation, visible focus, live-region status, `prefers-reduced-motion`
- Works without JS for the default playlist (editorial embed + provider link)

### v1.1 (next iteration, not this build)
- Room-level shared annotations (requires a new message type on the existing chat bus)
- Drag-and-drop visual feedback refinement
- Playlist artwork display from metadata endpoint (when credentials available)

### Intentionally deferred
- Spotify OAuth expansion or new scopes
- Private playlist support
- Playlist mutation (save, follow, queue control)
- Cross-user synchronized transport
- AI-generated music criticism or ranking
- Database of listener notes
- Tezos mint or wallet gate
- Non-Spotify providers (Apple Music, SoundCloud)
- Production deploy or merge to main

---

## 7. Spotify/provider boundary and privacy model

### What PointCast does
- Embeds Spotify content via the official Embed/iFrame API
- Parses Spotify playlist URLs to extract playlist IDs
- Optionally fetches public playlist metadata via the Spotify Web API (bounded server endpoint)
- Labels track positions in the sequence table using embed events when available
- Provides annotation tools that are browser-local

### What PointCast does NOT do
- Proxy, download, restream, or simulate audio
- Store Spotify metadata in KV or any persistent store beyond shortest practical HTTP cache
- Send Spotify metadata or content to Qwen, OpenAI, or any ML system
- Claim cross-user synchronized playback
- Autoplay (playback requires user gesture, remains Spotify-controlled)
- Crop, overlay, or use Spotify artwork as decorative background
- Depend on Mike's broadcaster-authorized "now playing" account state

### Attribution
- Every displayed Spotify element carries proper attribution
- "Open in Spotify" link is always visible and obvious
- Embed includes `utm_source=generator` per Spotify embed guidelines

### Privacy
- Notes are browser-local (`localStorage`), never sent to any server
- Room receipt clearly labels local/private data
- No tracking parameters from Spotify URLs are stored or forwarded
- The room key is derived from the playlist ID — no personal data in the key

---

## 8. Room/presence model and playlist-specific room identity

### Room key derivation
- Default room: `/listening-room/playlist/35WC68tu9rrBoRrW3N2n0M`
- Parsed playlist: `/listening-room/playlist/{spotifyPlaylistId}`
- The room key is passed to CursorRoom via `data-room-key` attribute
- CursorRoom uses this as the `?url=` parameter for the WebSocket connection
- Different playlist IDs → different room keys → different presence/chat contexts

### Presence behavior
- Reuses existing per-URL room, cursor, chat, and presence infrastructure
- No new Durable Object protocol — the existing chat/event surface carries the interaction
- Quick gestures post as concise chat messages through the existing bus
- Activity strip derives from `pc:room:log-update` event
- Degrades gracefully when the presence worker is unavailable

---

## 9. Mobile, accessibility, reduced-motion, empty/error/offline states

### Mobile (320px+)
- Single-column layout, no horizontal overflow
- Large touch targets (min 44px)
- Sticky listening control only if it doesn't fight the Spotify embed
- Sequence table collapses to a compact list
- Notes desk stacks vertically

### Accessibility
- Full keyboard operation (Tab, Enter, Escape)
- Visible focus indicators on all interactive elements
- `aria-live="polite"` for load/error status messages
- All controls labeled with `aria-label` or visible text
- Skip-to-content link preserved from BlockLayout
- Color contrast meets WCAG AA (SPN coral `#993C1D` on cream `#FAF6F0` = 5.8:1)

### Reduced motion
- `prefers-reduced-motion: reduce` disables canvas animation, particle effects, and transition animations
- Layout and functionality remain identical

### Empty states
- No playlist loaded (shouldn't happen — default always loads): show default playlist
- No notes yet: "No notes for this playlist yet. The prompts on the right are a place to start."
- No room activity: activity strip is hidden (existing CursorRoom behavior)

### Error states
- Invalid URL: "That doesn't look like a Spotify playlist URL. Paste a link from Spotify > Share > Copy link."
- Metadata fetch failed: embed and all other features continue; metadata section shows "Playlist details unavailable"
- WebSocket disconnected: room gestures still queue locally; activity strip shows last known state

### Offline
- Spotify embed handles its own offline behavior
- Notes and receipt remain accessible from localStorage
- Room presence naturally disconnects

---

## 10. Metrics without invasive tracking

- No analytics SDK. No cookies. No fingerprinting.
- Observable signals:
  - Room key diversity: how many distinct playlist IDs appear in room keys (visible in the presence worker logs)
  - Receipt downloads: countable via a future optional endpoint, not in v1
  - Gesture frequency: visible in room chat logs
- These are sufficient for v1. Do not add tracking.

---

## 11. Abuse/safety considerations

- URL input is strictly validated: only Spotify playlist URLs accepted
- User input is never injected as HTML (text content via `textContent`, not `innerHTML`)
- Chat messages go through existing 120-char limit and rate limiting
- Quick gestures are fixed vocabulary — no free-text injection through gesture buttons
- Metadata endpoint is rate-limited (existing middleware) and bounded (one API call per request)
- No user-generated content is persisted server-side in v1

---

## 12. Machine-readable/agent surface contract

### `/listening-room.json`
The manifest declares:
- Input contract (what URL formats are accepted)
- Privacy/storage model (browser-local, no server persistence of notes)
- Provider boundary (Spotify embed only, no proxying)
- Room semantics (playlist-specific room keys)
- Receipt schema version
- Interaction vocabulary (gesture labels)
- Degradation behavior
- Default playlist

### CORS
- Open (`Access-Control-Allow-Origin: *`) for the public manifest

### Safety
- No arbitrary query data echoed into JSON unsafely
- Playlist ID validated before inclusion in manifest

---

## 13. Acceptance criteria and test plan

### Automated tests (this build)
- [x] Spotify URL parsing: valid playlist URLs → correct ID extraction
- [x] Spotify URL rejection: non-playlist, non-Spotify, malformed URLs → null
- [x] Tracking parameter stripping: `si`, `utm_source`, `utm_medium` removed
- [x] Playlist-specific room identity: different IDs → different room keys
- [x] JSON manifest claims: required fields present, correct types
- [x] Privacy/provider wording: manifest declares local storage, no AI, Spotify boundary
- [x] Mobile/accessibility hooks: viewport meta, aria-live, reduced-motion, skip-link
- [x] Receipt construction: valid JSON with required fields, clear local-data label

### Manual verification
- [x] Paste a playlist URL → room updates, URL changes, notes reset for new playlist
- [x] Reload shared URL → playlist and browser-local note restore
- [ ] Write notes → download receipt → receipt contains notes
- [ ] Open in two tabs with different playlists → different room keys in WebSocket URL
- [ ] Disable JS → default playlist embed renders with provider link
- [x] 320px viewport → no horizontal overflow; measured document width equals viewport width
- [ ] Tab through all controls → focus visible, logical order
- [ ] `prefers-reduced-motion` → no canvas animation

---

## 14. Risks and unresolved product questions

### Risks
1. **Spotify Iframe API event reliability.** The `playback_update` event may not fire for all playlists or may be delayed. **Mitigation:** sequence table works without it; track positions are labeled statically; embed events are enhancement only.
2. **Metadata endpoint without credentials.** If Spotify app credentials aren't configured, the endpoint returns 503. **Mitigation:** the entire experience works without metadata; the embed is the primary surface.
3. **localStorage quota.** Heavy note-writing could hit the 5MB limit. **Mitigation:** notes are small text; receipt export provides an escape hatch; localStorage errors are caught silently.

### Unresolved questions (recommendations)
1. **Should the sequence table show track names?** Yes when bounded metadata is available. Each name links back to Spotify. When metadata is restricted or unavailable, the editorial desk degrades to a truthful placeholder without blocking playback, notes, presence, or receipts.
2. **Should gestures be emoji or text?** Recommendation: text. "keep this" is more legible in a chat log than 🔖. Matches PointCast's broadcast language.
3. **Should the receipt include the room URL?** Recommendation: yes. The receipt is a portable artifact. The URL lets someone reopen the room.
4. **What happens when someone drops a track URL instead of a playlist?** Recommendation: reject with a clear message. The room is for playlists. Tracks can be shared via existing Block LISTEN type.

---

*This PRD is decision-complete for v1. The vertical slice ships the full journey from drop/paste through playback-aware listening, annotating, sharing, and returning. v1.1 adds shared annotations. Everything else is intentionally deferred.*
