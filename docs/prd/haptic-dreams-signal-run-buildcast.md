# Haptic Dreams: Signal Run + Buildcast

**Status:** V1 prototype  
**Owner:** PointCast / Haptic Dreams  
**Builders:** Terra, Luna, Codex  
**Source artifact:** `/haptic-dreams`

## Product thesis

A football game is already a language of direction, distance, timing, and
consequence. Haptic Dreams translates that language into touch, sound, and an
illustrated world. V1 makes the translation playable while keeping the source
record immutable, then opens a quiet public window onto how the prototype is
being made.

This is not a scoreboard skin, alternate-history simulation, live feed, NFT,
wearable certification claim, or betting product.

## Audience and job

- A curious football viewer can recognize a sourced game through a different
  sensory grammar.
- A haptics designer can inspect the mapping between recorded events and
  gestures without needing the proposed sleeve hardware.
- A PointCast visitor can watch verified public build milestones beside the
  playable result without being shown private work material.

## Surface 1: Saturday Kingdom — Signal Run

**Route:** `/haptic-dreams/play`

### Player fantasy

The player is the kingdom's signal keeper. They do not change Michigan–Ohio
State; they keep its 18 selected archival moments legible as the record moves
through a haptic and visual language.

### Three-minute loop

1. Enter the field and see the locked archival boundary.
2. Each sourced event occupies a ten-second beat.
3. Read the event prompt and answer with Advance, Arc, Reverse, Chorus, or
   Settle using touch, pointer, or keyboard.
4. Correct recognition adds 100 local Signal Fidelity points. A missed signal
   adds Static, but the recorded sequence continues unchanged.
5. At 3:00, show the fixed 13–10 historical result, personal fidelity grade,
   local best, sources, and replay.

### Rules

- Historical clock, possession, detail, scoring, order, and final result are
  immutable inputs.
- Player state is local-only and cannot mutate archival data.
- Sound and browser vibration are explicit opt-ins and never required.
- The game remains complete with keyboard-only input and reduced motion.
- No login, leaderboard, wallet, live data, or networked competition in V1.

### Success criteria

- All 18 events complete in 180 seconds.
- Five action families have visible touch controls and keyboard equivalents.
- Any player performance still ends at Michigan 13, Ohio State 10.
- Sources and the unofficial editorial boundary remain visible.
- Existing `/haptic-dreams` exhibition and JSON companion remain intact.

## Surface 2: Haptic Dreams Open Studio — Buildcast

**Route:** `/haptic-dreams/build`

### Viewer experience

- Desktop shows a chronological public build ledger beside the live Signal Run.
- Mobile offers Watch the Build and Play the Game modes, with the latest studio
  state close at hand.
- New milestones poll every 3.5 seconds. Auto-follow pauses when a visitor
  scrolls back and resumes only on request.
- The surface is silent and respects reduced motion.

### Published event types

- Session or phase started
- Artifact or decision published
- Test passed or failed
- Preview ready
- Release published
- Session completed

Every item is short, authored for public view, and may link only to an
allowlisted PointCast or repository receipt.

### Privacy boundary

Buildcast never publishes prompts, hidden reasoning, raw terminal output, full
diffs, private email, `/api/ping`, local paths, tokens, cookies, IP addresses,
user identifiers, or unpublished URLs. A success claim must have a matching
verification receipt.

### Delivery model

- Seed milestones make the studio truthful and useful with no infrastructure.
- Optional `PC_BUILDCAST_KV` stores curated events for 30 days.
- Optional `PC_BUILDCAST_TOKEN` authenticates POST ingestion.
- Without both bindings, GET stays in Seeded Studio mode and POST returns 503;
  the page never claims live automation.
- V1 uses polling rather than WebSockets or a Durable Object.

### Success criteria

- Split view works without horizontal overflow at desktop and 390px.
- The embedded Signal Run remains usable by touch and keyboard.
- New configured events appear within five seconds, deduplicate, and remain in
  sequence order.
- Missing bindings degrade to a complete seeded experience.
- Unauthenticated and unsafe writes are rejected.
- App, agent, sitemap, and LLM discovery surfaces expose the studio.

## Release boundary

The combined prototype can ship to a review deployment with no new production
bindings. Enabling curated edge updates is a separate production configuration
decision because it requires a KV namespace and secrets. A future live-game
version also requires a separately approved, licensed data source and a new
truth model; it must not silently replace this frozen archival edition.
