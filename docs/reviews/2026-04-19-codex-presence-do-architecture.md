# Presence DO identity-enriched broadcast — architecture review

Author: `codex`  
Source: `docs/briefs/2026-04-19-codex-presence-do-upgrade.md`

This brief is best implemented as an additive contract upgrade, not a new presence stack. The current Durable Object already owns the right boundary: one global room, live fan-out, no persistence, and backwards-compatible aggregate counts. The missing piece is identity richness. We can add that without changing the endpoint, without changing the aggregate shape, and without exposing session ids.

## A1. Room model

The room should track two layers:

- `connections` keyed by a per-socket id so multiple browser tabs or components can stay connected at once
- `visitors` keyed by `sessionId` so aggregates dedupe by visitor rather than by socket

That split matters because PointCast now has several same-session consumers of `/api/presence`: `PresenceBar`, `VisitorHereStrip`, and `/tv`. Closing the old socket whenever a new one appears would keep counts correct but would make one widget silently lose live updates. The DO should instead keep every socket open, then merge them down to one visitor record for counts and broadcasts.

`visitors` stores the minimal shared record:

```json
{
  "sessionId": "private-only-inside-do",
  "nounId": 421,
  "kind": "human",
  "joinedAt": "2026-04-20T05:35:00.000Z",
  "mood": "flow",
  "listening": "Nala Sinephro - Endlessness",
  "where": "El Segundo",
  "lastSeen": 1760938500000
}
```

`nounId` should default to a deterministic hash of `sessionId` so the DO can still broadcast identity even before the client sends `identify`. That keeps the contract resilient and preserves the privacy rule: no raw session ids leave the worker, only the derived noun id does.

## A2. Message contract

Client → server messages stay tiny:

```json
{ "type": "identify", "nounId": 421, "mood": "flow", "listening": "Nala Sinephro", "where": "El Segundo" }
```

```json
{ "type": "update", "nounId": 421, "mood": "quiet", "listening": null, "where": "33.92,-118.41" }
```

```json
{ "type": "ping", "nounId": 421 }
```

Semantics:

- `identify` is sent once on socket open and hydrates the shared visitor record
- `update` is sent whenever the TELL panel changes mood, listening, or location
- `ping` refreshes liveness without mutating state

Server → client keeps the old aggregate plus a capped `sessions` array:

```json
{
  "humans": 3,
  "agents": 1,
  "sessions": [
    { "nounId": 421, "kind": "human", "joinedAt": "2026-04-20T05:35:00.000Z", "mood": "flow", "listening": "Nala Sinephro", "where": "El Segundo" },
    { "nounId": 88, "kind": "wallet", "joinedAt": "2026-04-20T05:36:12.000Z", "where": "Long Beach" },
    { "nounId": 777, "kind": "agent", "joinedAt": "2026-04-20T05:37:48.000Z" }
  ]
}
```

Design notes:

- Cap `sessions` at 50 to keep payload size bounded
- Keep `humans` as “all non-agent visitors” so `PresenceBar` stays compatible without knowing about `wallet`
- Sort by `joinedAt` ascending so slot placement is stable and new arrivals append rather than reshuffle the room every second

## A3. Privacy and client behavior

The privacy rule is simple and should stay strict:

- Never broadcast `sessionId`
- Only broadcast the derived `nounId`
- Agents may broadcast `nounId`, `kind`, and `joinedAt`, but never `mood`, `listening`, or `where`

On the client side:

- `VisitorHereStrip` should remove one matching `nounId` entry from `sessions` and treat that as “you”, then render the rest into the ghost slots
- `/tv` should reorder the array so the local viewer appears first when present, then render up to 10 noun avatars with a hover chip for `mood`
- `PresenceBar` can stay aggregate-only because `humans` and `agents` remain unchanged

This yields the new identity-rich feel without forcing a breaking API migration or introducing a second real-time system.
