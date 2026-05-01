# Codex brief: cross-surface comms architecture audit + WebSocket upgrade path

**Date filed:** 2026-04-30 PT (late session)
**Filed by:** Claude Code (cc) on behalf of Mike
**Severity:** medium — current latency works but is the next wall
**Mike's ask (verbatim):** *"check the websockets, visualization, communication, latency along with the sprint"*

## tl;dr

PointCast has 60+ /drum-* surfaces that need to share state. We've built three communication tiers organically over the last few weeks; this brief documents what each does, where it falls down, and proposes a fourth tier (Durable Object WebSockets) that would unlock sub-100ms cross-surface broadcast for the moments where it matters. **Not a rewrite — an additive fast lane.** Existing tiers stay as fallback.

## What we have today

### Tier 1 — `/api/sounds` (KV polling, broadcast bus)

**The default cross-surface bus.** Every drum surface POSTs taps here; every cast surface (`/drum-tv`, `/drum-marquee`, `/drum-radio`, `/drum-viz`) GETs and renders.

- Storage: single KV key `sounds:buffer` → array of last 50 events, 60s TTL
- Event shape: `{ type, seed, t, pid }`
- Allowlist: ~50 event families (drum, orchestra, choir, lounge, theremin, bells, organ, strings, marimba, hang, tr808, harp, rhodes, button, daily, jam, jam-amp, potato, milestone, tap, kettle, pace, bath, shout, applause, walkie, graffiti, letter, pin, heart, confessional, soft, agent, mcp, birthday, cake-light, cake-blow, sign, pinata, pinata-burst, wish, roll, toast, profile, emoji, emoji-add, drum)
- Polling cadence: usually 1.5–2s on cast surfaces; 1s on `/drum-v11`; 400ms in `/drum-vs`
- **Typical end-to-end latency: 1.5–2s** (server flush + poll cadence + propagation)

**Known issue: KV race on writes.** Single key, read-modify-write. Two simultaneous POSTs can clobber each other. Caught + worked around in the MCP dual-broadcast (PR #254 sequenced) and the `/drum-vs` win-clamp (PR #281). For high-rate surfaces the pattern is acceptable; under bursty load you get occasional dropped events.

### Tier 2 — `/api/duel` (KV polling, room-scoped)

**Room-scoped event bus for 1v1 games.** Each room gets its own KV keys so the global `/api/sounds` race doesn't apply.

- Storage: `duel:{room}:state` (1h TTL), `duel:{room}:events` (60s TTL), `duel:{room}:signals` (90s TTL — for WebRTC SDP/ICE)
- Schema: typed; `{ p1Pid, p2Pid, p1Score, p2Score, mode, winner, … duel-mode fields … }`
- Polling cadence: 400ms in `/drum-vs`
- **Typical end-to-end latency: ~400ms** (single-room contention is rare since only 2 players write per room)

### Tier 3 — WebRTC P2P data channel (PR #268)

**True peer-to-peer fast lane for 1v1.** Once two players are seated in a `/drum-vs` room, signaling rides on `/api/duel` (offer/answer/ICE) and a data channel opens.

- Once connected: tap events fire over the data channel
- **Typical end-to-end latency: 30–100ms** (peer-to-peer RTT)
- Server still receives a parallel KV POST for canonical scoring + winner detection (defense in depth)
- Falls back to KV at 400ms if WebRTC fails (corporate NAT, mobile carrier, no support)

### Tier 4 — `/api/visit` (KV polling, presence)

**Who's-on-the-page tracking.** Used by the room presence chip + cast surfaces.

- Polling cadence: 5–10s
- **Typical end-to-end latency: 5–10s** (deliberately slow — presence isn't tap-rate)

## Where each tier falls down

| use case | works on | falls down |
|---|---|---|
| Cast a single drum tap to `/drum-tv` | T1 (KV) ~2s | feels laggy when watching live |
| Hear another visitor's bell on `/drum-v11` | T1 (KV+listener) ~1s | cross-device chime is audibly delayed |
| 1v1 tap race on `/drum-vs` | T1 fallback / T3 P2P | T3 fails on symmetric NAT, drops to T1 |
| Live agent bench glow on `/drum-meet` | T1 ~1.5s | seat lights up on a perceptible delay |
| MCP `drum_tap` reflected on `/drum-tv` | T1 ~1.5s | lab demo has visible lag |
| Group jam on `/drum-jam` (3+ players) | T1 with KV race | rapid concurrent taps clobber |

The pattern: **T1 works, but every "live" demo has a visible delay**. For the AI-lab visit specifically, the tap-to-cast latency is the moment that defines "this feels alive" vs "this feels laggy."

## Proposal: Tier 5 — Durable Object WebSocket hub

A Cloudflare Durable Object that holds an in-memory list of WebSocket subscribers per channel. Surfaces opt-in: connect via WebSocket as a fast lane, fall back to KV polling if the upgrade fails.

### Architecture sketch

```
functions/api/ws/[[path]].ts   ← upgrade handler, routes to DO
src/durable-objects/DrumHub.ts ← the DO class
wrangler.toml                  ← durable_objects binding
```

`DrumHub` Durable Object:
- One instance per channel (e.g., `global`, `meet`, `duel:{room}`, `birthday`, `relay`)
- Maintains a Set<WebSocket> of connected clients
- On message in: validate, persist to KV (preserve existing T1 contract), broadcast to all subscribers
- On client disconnect: remove from set
- Hibernates on inactivity (CF auto-handles)

Client API (drop-in for existing surfaces):

```js
// New helper: src/lib/drum-ws.ts
const ws = drumWs.subscribe('global');  // or 'duel:K3M9X7' or 'meet'
ws.onevent((evt) => { /* same shape as /api/sounds events */ });
ws.send({ type: 'drum', seed: 1 });     // broadcast + persist
// Falls back to KV polling if upgrade fails
```

### Latency targets

| tier | from | to | est. latency |
|---|---|---|---|
| T1 | tap | cast surface | 1.5–2s |
| T5 (proposed) | tap | cast surface | **80–200ms** |
| T3 (existing) | tap | peer | 30–100ms (1v1 only) |

Order-of-magnitude improvement on the cast path. Critical for the `/drum-tv-meet` visit demo specifically.

### Risks

1. **Wrangler / DO config drift.** Adding a DO binding requires a `wrangler.toml` update + a DO migration. Easy to get wrong; can break other deploys. Worth piloting on a non-critical channel first.
2. **CF Pages Functions DO support.** Pages Functions support DOs but the binding semantics differ from pure Workers. Want a working hello-world before committing.
3. **CF free-tier limits.** DO has its own pricing tier. Need to check usage projections vs plan.
4. **Hibernation behavior.** Open WebSockets when nothing's happening shouldn't bill — DO hibernation handles that, but worth verifying.
5. **Auth / abuse.** Open WebSocket endpoint = potential vector. Same allowlist + rate-limit posture as `/api/sounds` should apply, but easier to flood when there's no per-request HTTP roundtrip.

### Phased rollout

**Phase 1 — pilot on `/drum-tv-meet` only**
- Build the DO + handler
- Wire `/drum-tv-meet` (visit-day surface, low-stakes) to the WebSocket
- Keep `/drum-tv-meet` working with KV-polling fallback if WS connection fails
- Measure cross-surface latency in a single Mike+Morgan smoke

**Phase 2 — opt-in for `/drum-vs` (the room-scoped game)**
- Replace the 400ms KV signal poll with a WebSocket subscribe to `duel:{room}`
- WebRTC P2P stays as the actual gameplay channel; this just speeds the seat/state sync
- Falls back gracefully

**Phase 3 — opt-in for cast surfaces (`/drum-tv`, `/drum-marquee`, `/drum-radio`, `/drum-viz`)**
- Subscribe to `global`
- Same UX, faster
- Falls back

**Phase 4 — `/drum-meet` agent bench**
- The seats glow on /api/sounds events; switch to WebSocket so the bench visibly reacts within 100ms of MCP calls
- This is the single most impactful place for the AI-lab demo

### What I (cc) am NOT doing

- Not implementing this myself in the current sprint window — Mike asked for the audit "along with the sprint"; I'm filing this brief and pushing on the build piece (`/drum-tv-meet` the surface) in parallel
- Not changing `/api/sounds` semantics — T1 stays the canonical bus, T5 is additive
- Not breaking T3 (WebRTC P2P) — it's the fastest tier we have for 1v1 and it works

## Coordination

- **codex** — this is your lane if you want it. I think there's ~3-6h of careful work here (DO setup + handler + lib + pilot wiring + smoke). Consider piloting on `/drum-tv-meet` first since I'm shipping it tonight.
- **manus** — once the WS lane lights up on a deployed surface, we'll want browser-side QA: open two phones, tap on one, measure perceived latency on the other.
- **cc** — ready to consume the new lane on existing surfaces once it's live. I'll wire `/drum-meet` agent bench + `/drum-vs` signaling to the WS lane in a follow-up PR after codex lands the infra.

## Files to look at first

- `functions/api/sounds.ts` — the T1 contract; preserve event shape
- `functions/api/duel.ts` — the T2 contract; signaling already lives here (could ride the WS lane)
- `src/pages/drum-vs.astro` — biggest existing real-time consumer; sees both T1 and T3 today
- `src/pages/drum-tv.astro`, `drum-tv-v2.astro`, `drum-marquee.astro`, `drum-radio.astro`, `drum-viz.astro` — cast surfaces; all currently 1.5–2s polled
- `wrangler.toml` (or wrangler config) — for DO binding
- `src/components/RoomPresenceChip.astro` — the simplest live-updating widget; would be a clean third surface to wire (after `/drum-tv-meet` pilot + `/drum-vs` upgrade)

## Visualization side note

Per Mike's ask, visualization is part of the sweep. Current cast surfaces (`/drum-tv`, `/drum-viz`, `/drum-marquee`, `/drum-radio`) each have their own bespoke render. The proposed WS lane doesn't change render logic — just speeds the data delivery. **Visualization quality is bounded by data freshness**, so the WS upgrade is the prerequisite for the next visualization push (waveform-density displays, spatial audio cues, multi-screen sync).

— cc
