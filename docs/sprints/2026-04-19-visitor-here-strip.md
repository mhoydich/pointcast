---
sprintId: visitor-here-strip
firedAt: 2026-04-19T20:35:00-08:00
trigger: chat
durationMin: 20
shippedAs: deploy:fa88878e
status: complete
---

# chat tick — VisitorHereStrip · gathering-place representation v0

## What shipped

Mike 2026-04-19 20:30 PT — direction:

> "profiles for any visitor, even the ai, bots, scrapers spiders and yah when they are around, neat, want to represent that, how this is a place to congregate, a schelling point of its own, back to some of the original, which was lost along the way, representative of the peoples around and then there is actually a ton to do and more on the horizon"

Two artifacts that address the congregation framing without preempting the four identity-arc decisions still in Mike's court.

### 1. `src/lib/visitor.ts` — identity primitive

The shared helpers every profile / presence / gathering surface will import:

- **`cheapHash(s)`** — DJB2-style integer hash. Stable, not cryptographic.
- **`getVisitorNounId(identity)`** — maps any identity string (session id, wallet address, UA) to a Noun ID 0-1199. Deterministic.
- **`getVisitorNounUrl(identity)`** — convenience: full noun.pics URL.
- **`getVisitorDisplayName({ display, wallet, ua, sessionId })`** — returns short name with preference order: user-set override → short wallet form → known agent name (GPTBot, ClaudeBot, etc.) → `noun-NNN` fallback → `visitor`.
- **`getVisitorKind({ wallet, ua })`** — classifies as `'wallet'` | `'agent'` | `'human'`. Used for glyph/color selection.
- **`VISITOR_LS_KEYS`** — the localStorage namespace: `pc:session`, `pc:visitor:noun`, `pc:visitor:firstSeenAt`, `pc:visitor:display`.

### 2. `src/components/VisitorHereStrip.astro` — the visible "who's here" surface

Shipping v0 on the home page between FreshStrip and VoterStats. Shows:

- **YOU slot** — your assigned noun (32×32 → 40×40 on desktop), gold ring with gentle pulse animation, "YOU" label below. First-visit assigns the noun and caches it; `pc:visitor:firstSeenAt` set so future `/profile` can say "here since Apr 19".
- **11 ghost slots** — dotted-outline circles, faint purple. Light up (warm amber dot) as presence count climbs via the same `/api/presence` WebSocket PresenceBar uses. Staggered pop animation when they become lit.
- **Overflow slot (+N)** — appears when >12 visitors connect. Hides otherwise.
- **"YOUR PROFILE →"** link — anchors at `/profile` (the existing stub page). When the full `/profile` dashboard lands, this becomes the direct door.

Visual register: purple (`#534AB7`, matches ES channel) for community/gathering; gold (`#F59F00`) for YOU to stay distinct.

### Why this vs the larger /profile dashboard

Mike's four identity-arc decisions (URL, non-wallet policy, handle display, sequencing) are still pending. Shipping the full dashboard without them risks locking a URL or a policy he'd rather reshape.

VisitorHereStrip is the **minimum visible representation** that implements "peoples around" without locking anything. It uses existing `/profile` as the target (already exists), localStorage keys that future code can upgrade to server-side, and deterministic noun assignment that works for every visitor kind.

When Mike greenlights the four decisions, the next tick can:

1. Expand `/profile.astro` into the dashboard (activity log, HELLO history, votes, drops)
2. Promote VisitorHereStrip to show actual per-visitor nouns (requires DO broadcast upgrade)
3. Add agent-glyph differentiation (purple square for agents vs noun-circle for humans)

## Design decisions worth recording

- **Ghost slots instead of empty space**. Visually telegraphs "seats for others" — reinforces the gathering-place framing even when the visitor is alone. A blank strip would feel empty; dotted circles feel intentional.
- **YOU's noun assigned on FIRST visit, cached forever**. Identity persists across reloads — you are noun-421 as long as your localStorage survives. If someone clears storage, they get a new noun (fine for v0; wallet-sync is a later tick).
- **Deterministic hash, not random**. Same session ID → same noun, reproducibly. Tests cleaner. Future feature: "import your noun from laptop to phone" works by copying session id or wallet address.
- **Agent detection in both `visitor.ts` and the inline client script**. Client script does naive UA match for the WebSocket `kind` param (same as PresenceBar). The lib's `getVisitorKind()` is the authoritative version for future use.
- **Reused `pc:session` localStorage key**. PresenceBar already writes this; FreshStrip reads it. Don't fork — share.
- **"PEOPLES HERE" not "PEOPLE HERE"**. Mike's phrasing was "representative of the peoples around." Kept the word. Slightly archaic + communal.

## What didn't

- **Dashboard enhancements to `/profile`** — awaits Mike's URL + policy decisions.
- **DO broadcast upgrade to carry per-visitor nouns**. Currently the DO only sends `{humans, agents}` counts. Carrying noun IDs per slot requires a DO code change. Deferred to a tick once Mike greenlights the larger arc.
- **Agent-glyph variation**. Currently all ghost slots light up the same way regardless of whether the presence is human or agent. A bot-glyph (square vs circle, purple vs silver) would better show the mixed-species gathering Mike invoked. Small follow-up once the DO carries kind.
- **Link to a `/here` full-page gathering view**. Could be a separate page with 100+ slots for "everyone who's ever visited today." Deferred.
- **Seeding more moods** and other gated pool items. Held.

## Notes

- Build: 206 pages (unchanged; component addition without new routes).
- Rendered HTML verified: `here-slot--you` ×1, `here-slot--ghost` ×11, `here-slot--overflow` ×1, `here-strip` ×10 class references. Correct.
- Deploy: `https://fa88878e.pointcast.pages.dev`
- Chat-fired tick.
- Cumulative today: 29 shipped (18 cron + 11 chat).
- Mike's "back to some of the original, which was lost along the way" framing is noted. The earlier PointCast had strong /mesh, /visit, /beacon community-surface framing that today's ships (daily drop, broadcast, Codex queue) didn't inherit directly. VisitorHereStrip reintroduces the representation; future work can reconnect /visit's visitor log and /beacon's neighborhood map into the same gathering thread.

— cc, 20:35 PT
