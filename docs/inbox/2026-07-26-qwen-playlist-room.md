# Qwen build brief — Spotify playlist room companion

Date: 2026-07-26
Director: Mike
Builder: Qwen Code
Branch: `agent/spotify-room-companion`

## The ask

Mike: “For the Spotify integration, have Qwen build something neat. If you drop a Spotify, say a playlist, into a room, make it a fun interactive companion experience. Have it PRD. Have it be advanced, like a super talented dedicated team that’s into music built it — for music people and for those who like to make and share playlists.”

This is a real PointCast product build on the existing `/listening-room` surface, not a detached demo and not only a visual refresh.

## Product thesis

A playlist is not a rectangular player. It is a room-sized social and editorial object: an opening gesture, a sequence, pivots, a hidden hinge, a closer, a story people can annotate together. PointCast should turn a pasted or dropped Spotify playlist URL into a shareable listening room that is delightful for listeners and genuinely useful for playlist makers.

The companion must complement Spotify rather than imitate it. Spotify carries playback and provider truth. PointCast carries atmosphere, co-presence, conversation, sequencing prompts, listening memory, and a portable room receipt.

## Required first move

Read `AGENTS.md`, `BLOCKS.md`, `TASKS.md`, `VOICE.md` if present, `docs/inbox/README.md`, the current `/listening-room` page and JSON route, `BlockLayout.astro`, `CursorRoom.astro`, `/api/room`, the presence worker protocol, and the existing Spotify helpers/endpoints/tests. Inspect current repo patterns before changing code.

## Deliverables

1. Author a decision-complete, advanced PRD at:
   `docs/prd/2026-07-26-spotify-playlist-room-companion.md`

   It must include:
   - problem and product thesis
   - primary audiences and jobs to be done
   - experience principles and voice
   - full user journey from drop/paste through listening, annotating, sharing, and returning
   - feature architecture with v1 vertical slice, v1.1, and intentionally deferred capabilities
   - Spotify/provider boundary and privacy model
   - room/presence model and playlist-specific room identity
   - mobile, accessibility, reduced-motion, empty/error/offline states
   - metrics that do not require invasive tracking
   - abuse/safety considerations
   - machine-readable/agent surface contract
   - acceptance criteria and test plan
   - risks and unresolved product questions, with strong recommendations

2. Implement a polished, complete v1 vertical slice by evolving `/listening-room` and its JSON twin.

3. Add focused automated tests and run the relevant validations.

4. Add a short dated Qwen build log in `docs/claude-code-logs/` or a more clearly appropriate existing agent-log directory. Do not pretend another model authored it; title and body must say Qwen.

## V1 experience requirements

### Drop a playlist into the room

- Accept a Spotify playlist share URL through paste, text entry, and real drag/drop.
- Strictly accept Spotify playlist URLs/URIs only. Strip tracking parameters. Never inject user input as HTML.
- The existing PointCast Listening Room playlist should remain the welcoming default/demo.
- Loading a valid playlist updates a canonical, copyable room URL with a playlist ID in the query string.
- Reloading/shared links restore the playlist.
- “Try another” makes the input easy to reach without destroying local notes by surprise.

### Spotify embed and current moment

- Use Spotify’s official Embed/iFrame API for playback. Do not proxy, download, restream, or simulate audio.
- Dynamically load the pasted playlist without a full navigation.
- Listen to documented embed events where available (`ready`, `playback_started`, `playback_update`) so PointCast can truthfully label the local current moment.
- Do not claim cross-user synchronized playback. Do not autoplay. Playback requires a user gesture and remains Spotify-controlled.
- Include an obvious “Open in Spotify” route and proper Spotify attribution.

Official references:
- https://developer.spotify.com/documentation/embeds
- https://developer.spotify.com/documentation/embeds/references/iframe-api
- https://developer.spotify.com/documentation/web-api/reference/get-playlist
- https://developer.spotify.com/policy

### A companion for serious playlist people

Make the room feel musically literate without inventing musical analysis:

- “Sequence table” / side-A map: track position or current entity when reliable, with language for opener, run, hinge, late turn, and closer.
- A listening-notes desk with sharp prompts useful to playlist makers, such as:
  - What promise does the opener make?
  - Where does the room change temperature?
  - Which transition earns its surprise?
  - What is the hidden hinge?
  - Does the closer resolve, release, or reopen?
- Notes are browser-local by default, editable, and never sent to Spotify or an AI model.
- A private “room receipt” can be copied/downloaded as JSON or Markdown. It records the playlist URL/ID, note prompts and responses, marked moments, and creation time. It must clearly label local/private data.
- Do not send Spotify metadata or content to Qwen, OpenAI, or any ML system. The product is intelligently designed; it is not an AI taste judge.

### Social room layer

- Reuse PointCast’s existing per-URL room, cursor, chat, and presence infrastructure.
- Different playlist IDs must resolve to different room keys even though the Astro page path is shared.
- Avoid a new Durable Object protocol for v1 if the existing chat/event surface can carry the interaction.
- Add fast, tasteful room gestures (examples: “keep this,” “hinge,” “lift,” “closer,” “rewind”) that post concise, human-readable room messages through the existing room chat event bus.
- Show a small listening-room activity strip derived from the existing `pc:room:log-update` event. Do not store a second public chat history.
- The experience must still be excellent alone and degrade gracefully when the presence worker is unavailable.

### Visual and interaction direction

- Replace the current generic cosmic-sparkle demo feeling with an art-directed listening desk: record-shop intelligence, broadcast equipment, annotation cards, side-A sequencing, tactile controls, PointCast SPN coral/ink/cream.
- Preserve PointCast hard-edged broadcast language. No generic SaaS dashboard, glassmorphism, giant gradients, or over-rounded pills.
- The Spotify artwork must remain unmodified and unobscured; do not crop it, overlay it, or use it as a decorative background.
- The UI should feel built by people who make mixtapes and argue lovingly about track 4.
- Strong 320px mobile behavior: no overflow, large touch targets, a useful sticky listening control region only if it does not fight the Spotify embed.
- Full keyboard operation, visible focus, live-region status for load/errors, labeled controls, and `prefers-reduced-motion`.

### Metadata and degradation

- You may add a bounded server endpoint for public playlist metadata using the existing Spotify app-token helper and the official `GET /playlists/{playlist_id}` endpoint.
- Treat metadata as enhancement, not a precondition: missing credentials, restricted playlists, 403/404/429, and the February 2026 API changes must leave the embed, notes, room, sharing, and receipt usable.
- Never cache or persist Spotify content beyond the shortest practical HTTP cache. Never store provider artwork in the repo or KV. Keep attribution and links attached to displayed provider metadata.
- Do not depend on the separately broadcaster-authorized “now playing” account state; a visitor’s playlist room is not Mike’s live broadcast.

### Machine-readable surface

- Evolve `/listening-room.json` into a truthful capability manifest: input contract, privacy/storage, provider boundary, room semantics, receipt schema/version, interaction vocabulary, degradation behavior, and default playlist.
- Do not echo arbitrary query data into JSON unsafely.
- Keep CORS open for the public manifest.

## Non-goals for v1

- No Spotify OAuth expansion or new scopes.
- No private playlist support.
- No playlist mutation, saving, following, queue control, or Spotify account actions.
- No cross-user synchronized transport.
- No AI-generated music criticism or playlist ranking.
- No database of listener notes.
- No Tezos mint or wallet gate.
- No production deploy, merge, or worker deployment in this task.

## Engineering constraints

- Work only in this checked-out branch.
- Preserve unrelated behavior and avoid broad refactors.
- Do not add secrets or expose env values.
- Prefer pure helpers for parsing, canonical room identity, and receipt construction so they can be tested.
- If `CursorRoom` needs a page-specific room key, make it an explicit opt-in prop/data contract with unchanged defaults for all existing pages.
- The page must be useful with JavaScript disabled at least as an editorial/default embed and provider link, but advanced interaction can require JS.
- Keep dependency growth at zero unless there is an overwhelming reason.
- Tests should cover Spotify URL parsing/rejection, tracking stripping, playlist-specific room identity, JSON manifest claims, privacy/provider wording, and mobile/accessibility hooks.
- Run focused tests, `npm test`, `npm run build`, `npm run audit:agents`, `npm run audit:publishing`, and `git diff --check` if machine capacity permits. Report actual results only.
- Do not commit, push, merge, deploy, or publish. Leave a reviewable working tree for Codex.

## Quality bar

This should read like one coherent product made by an unusually good cross-functional music team — product, interaction, editorial, frontend, realtime, accessibility, privacy, and developer experience — not a pile of features. Make hard calls. Use restraint. Ship the vertical slice completely.
