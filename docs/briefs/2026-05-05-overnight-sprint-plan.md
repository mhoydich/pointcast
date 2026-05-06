# Overnight sprint plan — four sprints, ~25 surfaces

**Date filed:** 2026-05-05 PT (afternoon)
**Filed by:** Claude Code (cc) after Mike: _"ok work with codex to plan next 4 sprints, then go"_ + _"make this a main sprint work overnight, plan out a ton of features, etc"_
**Co-author:** codex (via mcp__codex MCP — initial 4-sprint outline returned in ~400 words; expanded by cc)

## Why this plan

The wing has 30+ surfaces of solo meditatives + audio-rich rooms. What's underdeveloped:
- **Multi-visitor presence** (the wing feels visited, not inhabited)
- **Agent affordances beyond MCP `drum_altar_ring`**
- **Ceremonial guest-receiving surfaces** (visit-day reception, not just /drum-meet)
- **Communal play** (the middle between meditation and spectacle)

Codex's read, accepted: shape the next four sprints around these gaps.

## Sprint 1 — Presence Bus

**Theme:** Make the wing feel inhabited, not just visited.

**Why this sprint matters:** Turns the wing from a collection of solos into a living place with memory, presence, and social gravity.

| surface | one-line |
|---|---|
| `/drum-room` | shared live chamber where visitors appear as brass lights; taps become room-wide bells |
| `/drum-echo` | asynchronous call-and-response: leave a 5-hit phrase, receive one from a prior visitor |
| `/drum-lobby-tv` | projection dashboard — live bells, intentions, routes, room temperature across the wing |
| `/drum-procession` | collective slow-movement surface; each visitor advances a shared ceremonial path |
| `/drum-now` | who's here right now (30s TTL presence chip, KV-backed) |
| Block 0436 | receipt |

Backing: small KV state at `room:{id}:state` with TTLs.

## Sprint 2 — Agent Choir

**Theme:** Give agents real instruments, not just code paths.

**Why this sprint matters:** Makes PointCast legible and operable by agents — strategically different from adding more visual pages.

| surface | one-line |
|---|---|
| MCP `drum_presence_read` | agent tool to read live wing state (active rooms, recent rings, intentions, queue health) |
| MCP `drum_intention_set` | agent tool to set a room's intention/mood (focus, work, calm, energize, dream) |
| `/drum-agent-altar` | agent-facing control surface for ringing bells, setting room moods, leaving short ritual notes |
| `/drum-scorebook` | machine-readable public ledger of surfaces, blocks, versions, audio language, deployment status |
| `/drum-conductor` | human + agent ops console for staging blocks, maintaining nav pills, coordinating launches |
| Block 0437 | receipt |

## Sprint 3 — Guest Receivers

**Theme:** Build ceremonial surfaces for lab visits, demos, and arrival moments.

**Why this sprint matters:** Concrete "receive the guests" artifacts, not just impressive URLs to click through.

| surface | one-line |
|---|---|
| `/drum-threshold` | first-room arrival screen — guest names/groups become lit candles, bells, soft color fields |
| `/drum-reception-tv` | hands-off projection mode that cycles live wing state, recent works, ambient greetings |
| `/drum-offering` | visitors choose one intention, color, and tone; the room folds them into a shared guest archive |
| `/drum-table` | conference-room surface — five seats, five tones, collective ambient instrument for in-person groups |
| `/drum-name-card` | per-guest custom welcome card (Noun + name + tone, shareable URL) |
| Block 0438 | receipt |

## Sprint 4 — Rhythm Commons

**Theme:** Bring pace, play, and results into the brass-and-velvet world.

**Why this sprint matters:** Fills the missing middle between meditation and spectacle — communal, replayable, colorful, audible results.

| surface | one-line |
|---|---|
| `/drum-duel` | two-person rhythm game with soft competitive scoring + beautiful miss/hit audio |
| `/drum-relay-2` | visitors pass a beat forward; each handoff mutates color, tempo, instrumentation |
| `/drum-warhol-live` | shared pop-art grid where visitor inputs recolor and remix live tiles |
| `/drum-radio-room` | listen-while ambient station with shared dials for tempo, weather, intention, density |
| `/yee-choir` | collective version of `/yeeee` — many visitors build one absurd rhythmic chant/firework system |
| Block 0439 | receipt |

## Operational reality

- CF Pages deploy queue stalls hard. Surfaces will pile up on `main` faster than they deploy. Mike kicks the dashboard manually to clear.
- Parallel agents may stomp DrumNav.astro on merge. Use atomic python heredoc patches.
- Each surface is pure-static + Web Audio where possible. KV-backed surfaces (Sprint 1, parts of Sprint 4) compound the function-tier queue more than static ones.
- Ship order: Sprint 1 → 2 → 3 → 4. Receipt block at the end of each sprint. No gates between sprints; cc continues straight through.

## What this is NOT

- Not a redesign of existing surfaces.
- Not a refactor of /api/altar or /api/quintet (existing endpoints stay).
- Not a website-wide design pass.

It's adding ~25 new surfaces in 4 thematic batches, plus 2 MCP tools, plus 4 receipt blocks.

## Stretch (not committed)

If sprint 4 finishes with energy left:
- `/drum-mesh` — every wing surface broadcasts to one ambient meta-channel; visit /drum-mesh to hear what the wing sounds like as a whole
- `/drum-lullaby` — bedtime mode (very slow, very quiet, fades over 90 minutes)
- `/yee-warhol` — Warhol pop-art treatment of /yee rhythm cards

— cc + codex, 2026-05-05 PT, El Segundo
