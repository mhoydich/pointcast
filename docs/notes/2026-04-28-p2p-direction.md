# P2P direction note · two-layer federation for PointCast

**Author:** cc · **Filed:** 2026-04-28 · **Status:** direction note, not commitment
**Trigger:** Mike's "what's latest with peer to peer communication protocol" prompt during the autonomous sprint.

---

## TL;DR

Use **two protocols, not one**:

1. **AT Protocol** (Bluesky's stack) for **block syndication** between PointCast nodes — durable, signed, repo-shaped records.
2. **Iroh** or **Nostr** for **ephemeral live signals** — presence, /talk dispatches, mood broadcasts, visit pings.

Tezos stays the source of truth for value-bearing things. The p2p layer carries everything that's editorial or replicating.

---

## Why a layered approach

A single protocol can't gracefully handle both *durable signed content* and *ephemeral live signals* at PointCast's volume.

- **Durable layer** wants: stable identity, signed records, schema discipline, replay-able history, indexable, queryable across many nodes.
- **Ephemeral layer** wants: low latency, no permanent storage, easy join/leave, no schema overhead, NAT-traversing direct paths.

AT Protocol nails the first; Nostr or Iroh nail the second. Trying to use one for both means either burning storage on cursor positions or paying durability overhead on every visit ping.

---

## Layer 1 · AT Protocol for block syndication

### What it does
Each PointCast node = a **PDS** (Personal Data Server) equivalent. Every Block becomes a signed record in a per-node repo. Other nodes subscribe to the firehose of repos they care about.

### Lexicon shape
Define a `xyz.pointcast.block` Lexicon with the existing Block schema (id, channel, type, title, dek, body, timestamp, noun, ...). New nodes adopt the same Lexicon, plug into the firehose, get every Block from every node speaking it.

### Concrete model
- A new node clones the PointCast scaffolding, gets its own DID
- Its blocks land at `did:plc:<the-node>/xyz.pointcast.block/<rkey>`
- The firehose is a WebSocket stream — any node can replicate from any other
- A single "pointcast.xyz" relay can act as the indexer-of-record, but no node depends on it

### What this unlocks
- Federation that survives any single node going dark
- Clean cross-node block discovery (Magpie + Sparrow + future readers all read the same firehose)
- Signed provenance — every Block carries the originating node's DID signature
- Backwards-compatible: a node can speak both AT Protocol *and* the existing JSON manifest at `/blocks.json`. ATProto becomes additive, not migratory.

### What it costs
- Run a PDS instance per node (or share a relay). The reference implementation is in TypeScript and runs on a small box.
- Lexicon discipline — schema migrations need versioning.
- A learning curve on DIDs + repos + firehose if the agents on PointCast aren't already familiar.

---

## Layer 2 · ephemeral live signals

Two viable choices. Pick one based on infra preference.

### Option A · Iroh
- Direct peer connections via QUIC + holepunching
- "Tickets" model for bootstrapping — paste a ticket, you have a connection
- iroh-blobs (content-addressed sync) and iroh-docs (CRDT key-value sync) for cases where you want both ephemeral and durable
- Rust core, JS bindings via napi-rs, also Python and Swift

**Use case fit:** cursor presence on `/here`, mood broadcasts, /talk dispatches between known nodes. Fast, direct, no relay infra.

### Option B · Nostr
- Pub/sub via relays. Keypair = identity. Events are signed JSON.
- Trivial to integrate (it's just WebSockets and signed JSON)
- Doesn't scale gracefully for high-volume — every relay sees every event
- NIP-23 for long-form, NIP-65 for relay routing, NIP-89 for app-specific kinds

**Use case fit:** lightweight social signals — visitor reactions, /talk dispatches as event kinds, public mood broadcasts. Anyone can plug into the relay set.

### Recommendation
**Iroh** if PointCast wants direct peer connections with no infra dependency. **Nostr** if PointCast wants to live inside an existing decentralized social graph and gain some incidental social-graph visibility. They're not mutually exclusive — could run Nostr for public ephemera and Iroh for high-frequency presence.

---

## What this changes about PointCast's architecture

### Today
```
Tezos (value)  →  PointCast nodes (Cloudflare Pages)  →  visitor browsers
                       ↑                                       ↓
                   /blocks.json                     localStorage / Beacon
                   (single-source manifest)
```

### After layered p2p
```
Tezos (value)  →  PointCast nodes (each is a PDS)  →  visitor browsers
                       ↑                                       ↓
                   AT Protocol firehose          localStorage + Beacon
                       ↓                          + Iroh/Nostr direct
                   any other node speaking
                   xyz.pointcast.block Lexicon
```

The "Cloudflare Pages" piece becomes one possible runtime, not the only one. A node could be a self-hosted server, a personal device, an Iroh ticket someone shares.

---

## Where to start (if Mike says yes)

### Phase 0 · spike (1 weekend)
1. Define `xyz.pointcast.block` Lexicon as a sketch (no commit yet)
2. Stand up a one-node PDS in a Docker Compose, push 5 existing PointCast Blocks as records
3. Read them back via the firehose from a second node
4. Document the diff between Lexicon + the existing Block schema

### Phase 1 · dual-publish (1 sprint)
1. New Blocks land in both `/blocks.json` AND a PDS-shaped repo
2. Existing blocks backfill (one-time script)
3. `/blocks.json` becomes a derived view, not a source of truth
4. Iroh ticket on `/here` for live cursor presence (replaces the Durable Object)

### Phase 2 · federation (2-3 sprints)
1. A second PointCast node spins up (Mike's other machine, or a contributor's)
2. Firehose subscriptions cross-pollinate Blocks
3. Magpie + Sparrow readers shift to reading the firehose, not single `/blocks.json`
4. Mythos / Worlds Rail surfaces blocks-from-elsewhere with clear `did:plc:` provenance

### Phase 3 · cutover (cleanup)
1. The single-source `/blocks.json` becomes a per-node JSON manifest, not the canonical one
2. New Lexicons (post-types: `xyz.pointcast.talk`, `xyz.pointcast.race`, `xyz.pointcast.visit`) get added incrementally
3. Eventually: a node manifest at `did:plc:<node>/xyz.pointcast.node` declares which Lexicons it supports

---

## What this does **not** do

- Doesn't replace Tezos. Mints, marketplace, ownership all stay on-chain. The p2p layer is editorial + presence + replication, not value transfer.
- Doesn't replace the wallet. Tezos wallets stay the value-bearing identity. AT Protocol DIDs are content-bearing identity. They can be linked but they're different roles.
- Doesn't break agent-readability. AT Protocol is JSON-shaped. `/blocks.json` and `/agents.json` and `/llms*` all keep working — they become additional surfaces over the underlying repo.

---

## Open questions for Mike

1. Federation appetite: do you want PointCast to be one site that federates *out* (to Bluesky, ActivityPub bridges), or do you want PointCast nodes that federate *to each other* primarily? AT Protocol is good at both; the priority order matters.
2. Identity model: should each PointCast node have its own DID, or should each contributor have a personal DID and PointCast nodes are servers running on someone's behalf? The Bluesky model is "1 user = 1 DID, hosted on a PDS"; PointCast may want "1 node = 1 DID" instead.
3. Ephemeral protocol: Iroh or Nostr? Both work. The choice is mostly aesthetic + infra.
4. Phase 0 commitment: is a weekend spike valuable, or do you want to wait for the right moment to commit a sprint?

---

## Related blocks

- Block 0375 — \"Remote internship: build PointCast, build your own node\" (already laid the conceptual groundwork)
- Block 0376 — \"Sprint 376: the node onboarding loop\" (related node-building piece)
- Block 0380 — three-day sprint shipping log (this note's companion)

— cc, 2026-04-28, El Segundo
