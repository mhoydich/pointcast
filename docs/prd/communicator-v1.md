# PRD: Communicator v1, the first real game

**Status:** draft, 2026-11-08. Owner: Fable (Claude) as product manager, with Mike as director. Follows `docs/plans/2026-11-08-coordination-backbone.md` (architecture) and PR #1598 (the engine and prototype). Reviewed by: Codex (ledger math, consent guard) before merge.

## 1. Problem

The prototype proves the flow in a browser tab. Nothing persists, nobody receives anything, and no bot can call it. The gap between "a nice demo" and "Thursday's 4.0 game actually happened" is: a store, an HTTP surface, reply tokens, the consent-labelled MCP tools, and one channel that can reach a person who opted in.

## 2. Goal and non-goals

**Goal.** One real doubles game scheduled end to end by the Communicator among consenting players, the score confirmed by both sides, the ledger entry written, the ratings moved. Target: within two weeks of the first deploy, with Mike as host.

**Success measures (first 30 days).**

| Measure | Target |
|---|---|
| Games that reach `confirmed` | 4 |
| Games that reach `recorded` (both sides confirmed a score) | 3 |
| Invites answered within 2 hours | 70% |
| Dropouts backfilled from the waitlist without the host doing anything | every case |
| Contact details in any message, log or read endpoint | 0 (tested) |
| Messages sent to a profile without `consent.communicator` | 0 (tested, refused at the engine and the adapter) |

**Non-goals for v1.** SMS, voice calls, payment or court booking automation, a public leaderboard beyond the ladder page, any site other than PointCast as the store, multi-sport ladders (the config exists; only `pickleball:el-segundo:open` is seeded).

## 3. Users

- **Host** (tier 2, Google or Tezos): Mike first. Asks for a game by text or voice, okays the invite list, submits the score.
- **Player** (tier 0 or 1): opted in on their own device. Gets an invite with four chips, taps one. Confirms or disputes a score.
- **Bot** (`pci_` agent identity acting for a tier 2 person): calls `communicator_request` and `communicator_ledger` freely, `communicator_invite` only with the person's recorded okay.
- **Organizer** (tier 3, later): settles disputes. Out of v1; disputes park the game and tell the host.

## 4. Scope

### 4.1 Storage (D1 `AUTH_DB`, migration `migrations/auth/0033_communicator.sql`)

- `communicator_profiles(handle PK, user_id, payload_json, public_json, updated_at)`: `payload_json` is the full `coordination/profile/1` (contact included); `public_json` is the projection. Reads of other people's profiles return `public_json` only, enforced by the query, not by filtering in JS.
- `communicator_games(id PK, ladder, host, status, state_json, slot_start, slot_end, created_at, updated_at)`: `state_json` is the engine's game object. Index on `(status, slot_start)`.
- `communicator_messages(id PK, game_id, to_handle, kind, text, replies_json, status pending|sent|answered|expired, token_hash, created_at, sent_at, answered_at)`: one row per Message. `token_hash` is the SHA-256 of the single-use reply token. The token itself is never stored.
- `communicator_ledger(id PK, ladder, kind, at, entry_json, status, created_at)`: append-only; status changes insert a new row with the same `id` prefix and a higher `created_at`; the current entry is the latest row.
- `communicator_okays(id PK, actor, kind, target_game, okayed_at)`: the host's "send invites" tap and a bot's recorded person okay. A consent-effect send without a matching okay row within 10 minutes is refused.

### 4.2 HTTP (`functions/api/communicator/*`)

| Route | Auth | Effect | Does |
|---|---|---|---|
| `POST /request` | session tier 2 | write | `parseRequest` → `proposeSlots` → `findCandidates`; returns proposal with public projections only. Stores nothing yet. |
| `POST /games` | session tier 2 | write | `createGame` with the chosen slot and candidate handles; stores the game; returns it. |
| `POST /games/:id/invite` | session tier 2 | **consent** | Records an okay, calls `invite`, stores Messages `pending`, hands them to the adapter. |
| `GET /games/:id` | session (player or host) | read | The game with names, not contacts. |
| `POST /reply` | reply token | write | Single-use token → `reply` / `confirmScore` / `disputeScore`; marks the message answered; stores the game; queues follow-up Messages (backfill, filled, short). |
| `POST /games/:id/score` | session tier 2, a player in the game | write | `submitScore`; ledger row `pending`; queues score-confirm Messages. |
| `GET /ledger/:ladder.json` | none | read | Confirmed entries plus `publicRating` per handle. The file the elsegundo.xyz build imports. |
| `GET /me` | session | read | My profile (full), my games, my pending messages. |
| `PUT /me` | session | write | Update my own profile: availability, venues, consent, channels. `contact.email` is set from the verified identity, never from the body. |

Rate limits through `PC_RATES_KV` as the rest of the API. Every write is attributed in `game.history`.

### 4.3 MCP tools (`functions/api/mcp.ts`)

`communicator_ledger` (read), `communicator_request` (write), `communicator_game` (read), `communicator_invite` (consent), `communicator_remind` (consent), `communicator_score` (write), `communicator_confirm_score` (write). Add `CONSENT_TOOL_NAMES` beside `WRITE_TOOL_NAMES`; `toolAnnotations()` gains `pointcast/effect: 'read' | 'write' | 'consent'`; `/agents.json` tools carry `effect`. A consent tool takes `okay: { by: handle, at: ISO }` and the handler verifies an okay row exists for that actor and game within 10 minutes, or refuses with `okay-required`. `agent-capabilities.ts` gains the same `effect` field.

### 4.4 Delivery adapter v0 (`functions/_lib/communicator-deliver.ts`)

- One adapter, email, through the existing `sendMail()` (Resend or the `SEND_EMAIL` binding).
- Resolves `to_handle` → the profile's private `contact.email` inside the adapter only. The engine, the routes and the MCP handlers never see an address.
- Honors `channels.quietHours` (default 21:00 to 08:00 local): a message due inside the window is held until the window ends; reminders that would land inside it move earlier, never later.
- Each chip is a link `https://pointcast.xyz/c/r/<token>?a=in` (also `out`, `maybe`, `newtime`, `confirm`, `dispute`). The token is single-use, 72 hours, bound to one message. `/c/r/` is a small page that posts to `/reply` and shows the result with the next chips, so a reply works from any mail client without JavaScript.
- **Dark launch.** `COMMUNICATOR_SEND` env var: unset or `off` logs the would-be send to `communicator_messages.status = 'sent'` with `sent_at` and a `dry-run` note, and sends nothing. `on` sends. Mike flips it after the two-phone test.
- Caps: 20 sends per host per day, 6 per recipient per day, none to a profile without consent (checked again here, after the engine).

### 4.5 Pages

- `/communicator/` becomes the real app when signed in (same engine, store-backed), the prototype when not. Demo mode stays reachable at `/communicator/?demo`.
- `/c/r/<token>`: the reply page (above).
- `/communicator/me`: my profile, availability, venues, the opt-in switch, my games.

### 4.6 Ladder seed

`pickleball:el-segundo:open` with Rec Park and Manhattan Heights venues from `courts-schedule.json`. Profiles start empty; the first players are Mike and people he invites by handing them `/communicator/me`. No import from the elsegundo.xyz ladder in v1 (that is follow-up 7 in the architecture doc).

## 5. Privacy and consent, as requirements

1. No endpoint returns another person's `contact`. Test: every read route's JSON for a non-self handle has no `@` and no 7-digit run.
2. No Message row or outbound email body carries another player's contact. Test: the adapter's rendered bodies are scanned the same way.
3. A send to a profile with `consent.communicator = false` is refused at three layers: engine (`invite` throws), route (`consent-required`), adapter (skips and logs).
4. Every consent-effect action needs an okay row from the actor within 10 minutes.
5. A person can turn off at `/communicator/me` and every pending message for them expires at once.
6. Reply tokens are single-use and expire in 72 hours; a used or expired token shows "this link was already used" with a link to the game page (signed in).

## 6. Sequencing

| Slice | Contents | Size | Blocks on |
|---|---|---|---|
| v1-a | Migration, store module, `/request`, `/games`, `/games/:id`, `/me`, `/ledger`, tests | 1 PR | #1598 merged |
| v1-b | `/invite`, `/reply`, `/score`, reply tokens, `/c/r/` page, dark-launched adapter, tests | 1 PR | v1-a |
| v1-c | MCP tools with `CONSENT_TOOL_NAMES`, `pointcast/effect`, `effect` in agents.json and capabilities; `audit:agents` | 1 PR | v1-a |
| v1-d | `/communicator/` store-backed mode and `/communicator/me` | 1 PR | v1-b |
| Launch | Mike's okay, `COMMUNICATOR_SEND=on`, two-phone Manus test, first game | Mike | all |

v1-a starts now on branch `claude/communicator-v1-20261108` (stacked on #1598).

## 7. Risks

- **Email as the only channel** is slow for "game in two hours". Mitigation: reminders at T-24h and T-2h are already in the engine; SMS is the first v2 item once a number and cost are okayed.
- **Small ladder.** Six eligible 4.0s in the demo; the real one starts at one. Mitigation: `findCandidates` with `level: null` widens the band on `short`; the host can also hand out `/communicator/me`.
- **Disputes with no organizer.** Mitigation: a disputed game stays `disputed`, counts nothing, and shows on both players' pages; tier 3 arrives in v2.
- **A bot acting without a person's okay.** Mitigation: the okay row, checked server-side on every consent tool, and the 10-minute window.

## 8. Open questions for Mike

1. Band width ±0.25 (current) or the half-step band?
2. Host tier: 2 only, or 1 with one open game at a time?
3. Reply-page domain: `pointcast.xyz/c/r/` or a short domain?
4. First recipients: do you want the first five profiles to be people you hand-invite, or an open opt-in link on the pickleball board?
