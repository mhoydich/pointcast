# Architecture review — /here · live congregation page

**Author:** cc  
**Source:** docs/briefs/2026-04-19-codex-here-congregation.md · Brief #7  
**Filed:** 2026-04-20 09:45 PT  
**Status:** shipped (partial — backend by Codex, UI by cc; see division of labor below)

---

## What /here is

A full-page page-scale counterpart to `VisitorHereStrip` on the home page. Renders every currently-connected visitor as a noun avatar in a responsive grid, with their optional self-reported state (mood, listening, where). The live pulse of the network, as a page you can load and watch.

Brief #7 sits on top of Brief #6 (presence DO upgrade). Without `{sessions: [{nounId, kind, joinedAt, mood?, ...}]}` in the broadcast, `/here` would be just a dot count. With it, `/here` is a room.

---

## Three components

1. **`functions/api/presence.ts` (modified)** — the Durable Object that manages WebSocket presence. Additive changes for /here:
   - Extracted a `snapshot()` method that returns `{humans, agents, sessions}` — the same shape as the WS broadcast.
   - Added a `GET /snapshot` handler on the DO that returns `snapshot()` as JSON.
   - `broadcast()` now calls `snapshot()` internally (single source of truth).
   
2. **`functions/api/presence/snapshot.ts` (new)** — a Cloudflare Pages Function that proxies to the DO's `/snapshot` handler. Adds a `Cache-Control: public, max-age=5, s-maxage=5` header so edge-cached for 5s. Prevents a thundering-herd pattern when many clients hit snapshot on page load.

3. **`src/components/HereGrid.astro` (new)** — the reusable congregation renderer. Server-rendered skeleton (only the YOU cell placeholder), client-hydrated via:
   - Initial `fetch('/api/presence/snapshot')` to populate fast.
   - WS connection to `/api/presence?sid={pc:session}&kind=human` for live updates.
   - Mood aggregation in the header (`12 HERE · 4 chill · 2 hype · 1 focus · 5 unset`).
   - YOU-cell self-match: derive nounId from the local `pc:session` sid, find the matching session in the broadcast array by nounId + closest joinedAt. Sid is never sent over WS (privacy preserved).
   - Overflow label when `others.length > cap - 1` (default cap = 64).

4. **`src/pages/here.astro` (new)** — page shell composing `HereGrid` in the dark/amber `/tv` visual language. EventPage JSON-LD. Machine-readable strip links to `/api/presence/snapshot` + `/api/presence` + `/for-agents` + `/for-nodes`.

---

## Division of labor

**Codex shipped the backend:**
- Extracted `snapshot()` helper and `/snapshot` endpoint on the DO (refactor of an existing hot file — Codex's strength).
- `functions/api/presence/snapshot.ts` (Pages Function wrapper).

**cc shipped the UI:**
- `src/components/HereGrid.astro` (client-side WS + state logic).
- `src/pages/here.astro` (page shell, JSON-LD).
- This architecture doc.
- `/for-agents` + `/agents.json` additions (next).

The division was forced by a practical constraint: the Codex MCP integration that came online this morning has a ~60s request timeout, and Codex can't complete a multi-file implementation in one turn without reading 5-10 files first. The 1-file-per-turn pattern worked for `snapshot.ts` but the subsequent HereGrid attempt aborted before Codex could start writing. cc picked up the UI side rather than ping-pong another 2-3 turns. Worked out cleanly: backend refactor is Codex's fit, UI + client state is cc's.

---

## Wire contract

Broadcast shape (unchanged from Brief #6, same for WS + HTTP snapshot):

```json
{
  "humans": 4,
  "agents": 2,
  "sessions": [
    {
      "nounId": 321,
      "kind": "human",
      "joinedAt": "2026-04-20T09:42:11.002Z",
      "mood": "chill",
      "listening": "Wild Mountain Honey",
      "where": "El Segundo"
    }
  ]
}
```

Session ids are NEVER in `sessions[]`. Privacy preserved at the DO boundary.

---

## Performance notes

- **Snapshot endpoint cached 5s at the edge** — /here's first paint doesn't hit the DO directly. Mass page-load from a social post still only hits the DO once per 5s per Cloudflare POP.
- **WS opens after initial paint** — no connection overhead on first byte.
- **Grid capped at 64 visible cells** — heavier congregations render an overflow counter. The cap is a prop (`<HereGrid cap={N}`/>), easy to tune.
- **Mood aggregation is O(sessions) per update** — cheap, no memoization needed at this scale. If the room gets to 500+, revisit.

---

## Open follow-ups (not in this ship)

- **Agent owner labels**: when an agent connects with a registered `name` (see `src/lib/nodes.ts`, added today), HereGrid should label it like "openclaw · jason" instead of just "AGENT". Currently shows raw `kind`. Low-priority polish.
- **Click-through to /p/{slug}**: when a visitor belongs to a registered node, the cell should link to their profile. Depends on /p/{slug} route existing.
- **Mood filters**: `/here?mood=chill` shows only chill visitors. Trivial URL-param + client-side filter addition.
- **Historic /here**: a `/here?at=YYYY-MM-DDTHH:MM` endpoint that returns a snapshot at a past time. Requires DO to archive snapshots periodically — out of scope for v0.

---

## Verification checklist

- [x] `functions/api/presence.ts` has `snapshot()` method.
- [x] `functions/api/presence/snapshot.ts` exists, proxies with 5s cache.
- [x] `src/components/HereGrid.astro` exists.
- [x] `src/pages/here.astro` exists, uses HereGrid.
- [ ] `/for-agents` has `/here` endpoint line (to be added).
- [ ] `/agents.json` has `/here` entry (to be added).
- [ ] `npx astro build` clean (cc to run).
- [ ] Deploy to `*.pointcast.pages.dev` (cc to run).
- [ ] Smoke test: load /here anonymously — should show YOU + nothing else. Open second tab — should show 2.
