# Codex brief — multiplayer primitive · shared DO base for Pulse + YeePlayer v1 + future games

**Audience:** Codex. Eighth substantive brief. Extracts common code from Pulse (brief #1) and YeePlayer v1 (brief #3) into a reusable DO pattern.

**Context:** Pulse and YeePlayer v1 both need: pairing flow (QR → phone → WS), multi-client sync, broadcast pattern, anti-abuse rate limit, session timeout. Writing two versions from scratch duplicates logic and drifts over time. Better: one shared module that both import.

---

## The primitive

A `MultiplayerRoom` Durable Object base class + helpers that both Pulse and YeePlayer v1 extend.

### Shared concerns

- **Session ID generation** — 6-char base32, collision-safe
- **Client pairing** — each WS open gets a `role` (`host` for TV, `player` for phone)
- **Join/leave lifecycle** — on open/close, update room state
- **Broadcast** — send state to all connected clients at a configured rate
- **Rate limiting** — per-client tap/action throttle
- **Anti-abuse** — per-IP session creation limit
- **Auto-close** — room dies N minutes after last message

### Extension points (subclasses override)

- `onPlayerAction(playerId, action)` — what to do with a tap/input
- `computeAggregate()` — how to roll up player inputs into broadcast state
- `broadcastCadence` — ms between broadcasts
- `maxPlayers` — cap per room

### Files

- `functions/api/_multiplayer.ts` — base class + helpers
- `functions/api/pulse.ts` — extends, implements Pulse's tap-tempo rollup
- `functions/api/yee.ts` — extends, implements YeePlayer's beat-match rollup

### Back-compat

If Pulse (brief #1) and YeePlayer v1 (brief #3) have already shipped with inlined DO code, this brief refactors them to share the base. If they haven't shipped yet, brief #8 lands first and they use it from day one.

---

## Deliverables

1. `docs/reviews/2026-04-19-codex-multiplayer-architecture.md`
2. `functions/api/_multiplayer.ts` — the base class
3. Refactor (or initial write) of `functions/api/pulse.ts` + `functions/api/yee.ts`
4. Test harness: `docs/reviews/multiplayer-smoke-test.md` with 5-step manual verification
5. `/for-agents` + `/agents.json` docs the shared `/api/multiplayer/*` endpoints (or whatever URL structure makes sense)

## Budget

~3-4 hours if Pulse + YeePlayer v1 haven't shipped. ~2-3 hours if refactoring existing.

## Working style

- Prefer composition over inheritance if JavaScript/TypeScript makes it cleaner
- Ship-to-main, author `codex`
- Preserve the WS message shapes so Pulse/YeePlayer clients don't break

Filed by cc, 2026-04-19 22:35 PT.
