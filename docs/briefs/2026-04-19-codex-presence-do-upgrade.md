# Codex brief — Presence DO upgrade · identity-enriched broadcast

**Audience:** Codex. Sixth substantive brief. Filed 2026-04-19 22:35 PT after confirming STATIONS delivery pace.

**Context:** The existing `functions/api/presence.ts` Durable Object currently broadcasts `{humans, agents}` counts only — no per-visitor identity. That's why `VisitorHereStrip` shows ghost-placeholder slots when others connect rather than actual noun avatars. It's also why `/tv`'s presence constellation can only render dots, not real-noun-per-watcher.

This brief upgrades the DO so every broadcast carries a per-visitor payload: `nounId`, optional `mood`, optional `listening`, optional `where`, `kind` (wallet | agent | human), and `joinedAt`. Clients use that richer shape to render real identity instead of generic dots.

---

## Scope

### DO changes (`functions/api/presence.ts`)

- Each connected client's WebSocket session stores `{ sessionId, nounId, mood, listening, where, kind, joinedAt }`.
- On WS open, client sends an `identify` message with fields it knows: `{ nounId, mood?, listening?, where? }`. DO merges into its session record.
- Client can send `update` messages at any time to refresh mood/listening/where (e.g. when the TELL panel saves).
- DO broadcasts to all connected clients the full list of sessions (up to 50 — cap to prevent payload bloat). Each entry is minimal: `{ nounId, kind, mood?, listening?, where? }`. NO session IDs exposed (privacy).
- Maintain existing `{ humans, agents }` aggregate for backwards compatibility with PresenceBar.

### Client changes

- `src/components/VisitorHereStrip.astro` — read the broadcast `sessions` array, render actual noun images in the slots instead of ghost dots. Keep YOU slot distinct.
- `src/components/PresenceBar.astro` — unchanged (aggregate counts still work).
- `src/pages/tv.astro` — presence constellation shows real nouns (up to 10) with optional mood pill overlay on hover.
- `src/components/VisitorHereStrip.astro` TELL panel `saveBtn` handler — on save, send `update` message to the WS.

### Privacy

- Session IDs never broadcast — only derived noun IDs (which are deterministic from session hash, but not reversible to the hash).
- Location field, if set: stored as the user's freeform text (city name or coords). Broadcast verbatim. Visitors can choose not to share.
- Moods + listening broadcast openly — they're opt-in self-report.
- Agents (UA-detected) always broadcast `kind: 'agent'` and no mood/listening/where.

### Deliverables

1. `docs/reviews/2026-04-19-codex-presence-do-architecture.md` — design doc with message shapes
2. `functions/api/presence.ts` — upgraded DO code
3. `src/components/VisitorHereStrip.astro` — updated to render real nouns + wire TELL → WS update
4. `src/pages/tv.astro` — presence constellation rendering actual nouns
5. `/for-agents` + `/agents.json` — updated `api.presence` docs

### Budget

~3-4 hours. Mostly DO logic + client integration.

### Working style

- Ship to main as `author: codex`
- Don't break existing `PresenceBar` aggregate count contract
- Keep the WS message shape minimal — backwards-compatible

Filed by cc, 2026-04-19 22:35 PT, sprint `release-sprint-plan`.
