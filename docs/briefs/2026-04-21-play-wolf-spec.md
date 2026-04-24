# Spec brief — /play/wolf v0 (Nouns-Werewolf arena, mixed human + LLM agents)

**Filed:** 2026-04-21 PT
**Author:** cc
**Source:** Mike chat 2026-04-21 PT "do another research on ai agent games" → agent-games research memo (`docs/research/2026-04-21-agent-games.md` §3.1) picked this as the top prototype: first public human-vs-LLM Werewolf arena. No one else has this; every primitive PointCast needs already exists.
**Audience:** cc. Self-assigned build spec. ~3 days work for v0.

---

## Goal

Ship a Werewolf lobby where each seat is either a human (PointCast cookie session, Nouns avatar) or an AI agent connected via WebMCP. One game per hour. Day-phase deliberation + night-phase moves carried by the existing pc-ping-v1 message bus. Public transcript. Presence DO renders the live seats. Compute-ledger logs every game's outcome.

## v0 scope (the ship)

- **5 seats per village.** 1 Wolf, 1 Seer, 3 Villagers. (7-seat variant can land in v1 with Witch + Hunter roles.)
- **Phases.** Day (3 min: free chat + vote) → Night (1 min: Wolf kill + Seer peek) → repeat until one faction wins.
- **Game clock.** One game per hour at :00 PT. Auto-start if ≥ 3 seats filled (2 wolves risk collapses; ≥ 3 means the game is playable). Auto-fill empty seats with "Sleeping Villager" NPCs (no-op actions) to keep cadence deterministic.
- **Speakers.** Every in-game message is a `pc-ping-v1` payload of `kind: "wolf-speak"` in a dedicated room id (`wolf-{YYYYMMDDHH}`). Public transcript renders live on `/play/wolf/{gameId}`.
- **Votes.** `send_ping` with `kind: "wolf-vote"` and `target: {seatId}`. One vote per seat per day-phase.
- **Night moves.** Wolf submits `wolf-kill target: {seatId}`. Seer submits `wolf-peek target: {seatId}` and receives a private reply `wolf-peek-result: "wolf" | "villager"`.
- **Avatars.** Deterministic Noun per seat (session ID → noun ID via existing hash). Visible to all players; alignment hidden until reveal.
- **Reveal.** On game end, every seat's alignment is posted to the transcript. Winning faction listed. Compute-ledger entry landed.
- **No pot in v0.** DRUM pot lands in v1 once FA1.2 originates. For now, winners get a cc-voice editorial block in CH.BTL naming them.

## What agents do

Three new WebMCP tools (added to `src/components/WebMCPTools.astro`):

- **`pointcast_wolf_join(game_id, persona_hint?)`** — claim an empty seat in the named or current game. Returns seat assignment (seatId + role, role visible only if the agent is the seat's holder — the standard closed-envelope pattern). Rejects if the game is full or in-progress.
- **`pointcast_wolf_speak(game_id, seat_id, body)`** — post a message to the day-phase transcript. Rejects if phase is Night or `seat_id` doesn't match the caller's session.
- **`pointcast_wolf_vote(game_id, seat_id, target_seat)`** — submit the day-phase vote (or night-phase kill/peek depending on role). Single-submission per phase.

Parallel existing tools that work for wolf: `latest_blocks` (view prior wolf game results), `presence_snapshot` (see who else is in the lobby), `compute_ledger` (see historical wolf outcomes).

## What humans do

- Visit `/play/wolf`. See the next game's lobby. Click "join" (one-click, uses existing Nouns session).
- Read the live transcript. Type into the chat box during Day. Click a seat's portrait to vote.
- At Night, the page grays out + shows a countdown. If you're the Wolf, you get the kill form. If the Seer, the peek form. If a Villager, you wait.

## State machine

```
LOBBY (pre-game)
  ↳ seat_claim events until 5 seats OR timeout at :55 PT
  ↳ at :00 transition → DAY 1

DAY (180s)
  ↳ speak events land in transcript
  ↳ vote events accumulate; most-voted seat eliminated on timeout
  ↳ if only 1 faction remains → GAME_END
  ↳ else → NIGHT

NIGHT (60s)
  ↳ wolf-kill + wolf-peek events land privately
  ↳ on timeout: eliminated seat revealed to transcript; seer receives result
  ↳ if only 1 faction remains → GAME_END
  ↳ else → DAY N+1

GAME_END
  ↳ reveal all alignments
  ↳ post result block (author: cc, channel: BTL, type: NOTE, title: "Wolf Game {id}")
  ↳ compute-ledger entry (kind: "sprint" or "brief" per game cadence; signature: shy per game)
  ↳ transcript archived at /play/wolf/{gameId}
```

## Storage

Two Durable Objects (reuse the pointcast-presence Worker's pattern):

- **`WolfGameDO`** — per-game state. Room id = `wolf-{YYYYMMDDHH}`. Holds seat roster, role assignments, phase clock, transcript, vote tallies. Exposes read/write endpoints for seat claim + speak + vote.
- **`WolfArchiveKV`** — once a game ends, state flushes to KV for the transcript page to read statically.

## Files to ship

Roughly nine new files + two existing components to edit. Rough estimate, not final:

### New

- `src/pages/play/wolf/index.astro` — lobby + live game view.
- `src/pages/play/wolf/[gameId].astro` — archived transcript view.
- `src/pages/play/wolf.json.ts` — agent manifest (current lobby + recent games).
- `functions/api/wolf/join.ts` — POST handler for seat claim.
- `functions/api/wolf/speak.ts` — POST handler for transcript message.
- `functions/api/wolf/vote.ts` — POST handler for votes + night actions.
- `functions/api/wolf/state.ts` — GET current game state (polled by UI every 2s in v0).
- `workers/wolf-game/index.ts` — WolfGameDO implementation.
- `src/lib/wolf.ts` — shared types, phase clock helpers, Nouns-ID-to-seat renderer, role assignment deterministic hash.

### Modified

- `src/components/WebMCPTools.astro` — add the three wolf tools.
- `src/pages/play.astro` — new card linking to `/play/wolf` with emoji 🐺, tags `agents + humans`, `social-deduction`.
- `wrangler.toml` — bind the WolfGameDO class.

## WebMCP tool specs

Each tool follows the existing pattern in `WebMCPTools.astro`:

```typescript
{
  name: 'pointcast_wolf_join',
  description: 'Join the next Werewolf game on PointCast as an AI agent or observer. Returns your seat id + private role (Wolf / Seer / Villager). Phases: Day (3 min chat + vote) → Night (1 min move) → repeat. One game/hour. 5 seats per village.',
  input: {
    type: 'object',
    properties: {
      game_id: { type: 'string', description: 'Optional. Defaults to the current lobby (next :00 slot).' },
      persona_hint: { type: 'string', description: 'Optional. Short persona string — the arena will mix it into the transcript for color.' },
    },
  },
  execute: async ({ game_id, persona_hint }) => fetch('/api/wolf/join', { method: 'POST', body: JSON.stringify({ game_id, persona_hint }) }).then(r => r.json()),
}
```

Same pattern for `speak` + `vote`.

## Non-goals (v0)

- **No on-chain pot.** DRUM comes v1 once originated.
- **No agent-matchmaking.** Agents self-select by polling `/api/wolf/state`; nobody arranges match-ups.
- **No role balancing by skill.** If three GPT-5 agents join and humiliate the humans, that's a data point, not a bug.
- **No permanent Elo.** v1 candidate if the arena fires enough games.
- **No streaming video/voice.** Transcript-only. Agents can't parse video in the loop anyway.
- **No anti-bot bans.** v0 assumes good-faith agents. Rate-limit at the transport level (same as existing `/api/ping`).
- **No private channels.** Wolves cannot privately coordinate at night. Kills are single-target, no chatter. Keeps the game legible + the transcript complete.

## Acceptance criteria

- [ ] A human can visit `/play/wolf`, see the next lobby, click "join" with cookie session, be assigned a Nouns-avatar seat + private role.
- [ ] An AI agent running Chrome Canary can call `pointcast_wolf_join()` + land in a seat.
- [ ] Day-phase messages from humans + agents render in the same transcript with Nouns + seat IDs visible.
- [ ] Votes resolve + night actions execute deterministically on phase-clock expiry.
- [ ] Game-end posts a result block in CH.BTL + appends a compute-ledger entry.
- [ ] Archived game transcripts render cleanly at `/play/wolf/{gameId}`.
- [ ] `/play/wolf.json` returns current lobby + last 10 games for agent consumers.
- [ ] Editorial block drafted by cc in CH.FD announcing the arena (see "Companion blocks" below).

## Companion blocks

Two editorial blocks planned:

- **Announcement block (next available id)** — cc-voice editorial announcing `/play/wolf` as a first-of-kind human-vs-LLM social deduction arena. Cites Foaster + WOLF benchmark + the research memo's gap analysis. Ships alongside the v0 deploy.
- **Day-one result block** — cc-voice recap of the first 5 games: who played, faction win rate, notable transcript moments. Ships ~24h after launch.

## Build ordering

1. Shared types + role hash (`src/lib/wolf.ts`) — 2h.
2. Durable Object skeleton (`workers/wolf-game/index.ts`) — 4h.
3. Four Pages Functions (`join`, `speak`, `vote`, `state`) — 4h.
4. Lobby page + live game view (`/play/wolf/index.astro`) — 6h.
5. Archive page (`/play/wolf/[gameId].astro`) — 2h.
6. Agent manifest (`/play/wolf.json.ts`) — 1h.
7. WebMCP tool additions — 2h.
8. `/play.astro` card + `wrangler.toml` binding — 1h.
9. Test with humans-only first (cc + Mike), then humans + cc-as-agent, then humans + external agent. — 4h.
10. Editorial announcement block + compute-ledger entry + sprint recap. — 2h.

**Total:** ~28h dev, conservatively 3 working days.

## Risks + mitigations

- **Agents saturate all seats.** Mitigation: mark human-only seats in the lobby. Up to 3 of the 5 seats can be agent-locked out via a `requires_human: true` flag per seat.
- **Transcript turns into spam.** Rate-limit `speak` to 1 message per 10s per seat. Drop messages > 500 chars.
- **Wolf collusion across games.** Different agent at every game; no cross-game memory of role assignments. Seat-to-role hash reseeds per game id.
- **Racist / abusive output from agents.** Mitigation: transcript posts to an unverified channel first; cc auto-reviews on game-end before promoting to public archive. Flagged transcripts get a `⚠ review pending` overlay.
- **DO quota.** Werewolf games are short and low-volume (~30 messages/game, 24 games/day = ~720 writes/day). Well under Cloudflare's DO free tier.

## Open questions for Mike

1. **Is the 5-seat minimum right?** 3-seat is faster but social deduction collapses; 7-seat is richer but harder to fill.
2. **Agent persona-hint field — keep or kill?** Could make games funnier; could introduce weird output vectors.
3. **DRUM pot size** when it lands in v1? 100 DRUM/game? 1000?
4. **Should the archive be CC0 like everything else on PointCast?** Default yes; flag for explicit signoff because some agent output may include copyrighted fragments.

## Success looks like

A month after launch:

- ≥ 30 games played.
- ≥ 10 distinct human players.
- ≥ 3 distinct AI agents that weren't cc.
- At least one external mention (Foaster community, WOLF benchmark authors, Hacker News Show HN, agent-games adjacent Substack).
- Zero abuse incidents that required a pulled transcript.

Failure looks like: 10 games, only cc + Mike played, nobody cited it. That's a useful signal too.

---

— filed by cc, 2026-04-21 PT. Ships alongside the research memo + editorial block. Build starts when Mike says go.
