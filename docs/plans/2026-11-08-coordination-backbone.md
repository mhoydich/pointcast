# The coordination backbone and the Communicator

**Status:** architecture, 2026-11-08. One working slice ships with this doc: `public/communicator/` (pure engine, demo roster, clickable prototype) and `tests/communicator.test.mjs`. Nothing here sends a real message, signs anyone in, posts anywhere or deploys.

**Thesis.** Infinite resources, finite coordination. A town has enough courts, enough 4.0 players and enough Thursday evenings. What it lacks is the thing that lines them up. This doc is one shared design for that thing, used by elsegundo.xyz, pointcast.xyz and every sister town (Medway MA and New Braunfels TX are live as pages; this makes them live as towns), open by default so any person or bot can plug in, and copyable to the next town in an afternoon.

**Sources read.** elsegundo.xyz: `netlify/functions/ping.mjs`, `lib/ping/core.mjs`, `public/pickleball/players/rating.js`, `scripts/pickleball-players/{build,scoreboard,import-feed}.mjs`, `content/pickleball/players/config.json`, `netlify/lib/two-scores/core.mjs`, `netlify/lib/pickleball/join.mjs`, `netlify/lib/pick-me/core.mjs`, `netlify/functions/{mcp,trading-desk-mcp,neighbors,visitors}.mjs`, `netlify/lib/city.mjs`, `cities/*.json`, `docs/{SOUTH-BAY-CITIES,VISITING-BOTS,AGENT-DESK}.md`, the `desk` branch inbox. PointCast: `functions/api/ping.ts`, `functions/api/auth/*`, `migrations/auth/*`, `src/lib/auth/types.ts`, `functions/api/mcp.ts`, `src/lib/agent-capabilities.ts`, `src/data/agent-surfaces.ts`, `docs/plans/2026-09-28-pickleball-board.md`, `src/data/courts-schedule.json`, `docs/prd/pointcast-mobile-messaging.md`, `src/data/federation-peers.ts`. The desk note `inbox/chatgpt/2026-11-08t212657z-el-segundo-league-rules.md` (ES Rec league rules, May 2026) set the scoring rules.

---

## 0. What exists today, in one table

| Piece | elsegundo.xyz | pointcast.xyz | Gap |
|---|---|---|---|
| Browser identity | Ping "line": server-minted `ln_`/`pk_`, hash stored, key in localStorage. Join edit key `jk_`. Two Scores crew code + phone token. | PMM P-256 keypair in localStorage; `deviceId()` UUID. | Four different key shapes; none portable between sites. |
| Verified identity | None. Join UI says tiers 2/3 "coming next". | D1 `AUTH_DB`: `users`, `identities`, `sessions`, `passkey_credentials`, `agent_keys`. Email magic link, Google OIDC, Tezos (Kukai), GitHub, X built; passkeys add-only. `project-ticket` hands a 120 s ticket to a whitelisted origin (only `network-el-segundo` today). | elsegundo.xyz has no way to consume PointCast's identity. |
| Profile | Per-function records (ping line name/zone/streak, join entry, crew nick). No profile store. | `PointCastUser {userId pcu_, identities[], preferredName, roles}`; `user_state` table. | No shared, portable profile; no consent or contact-channel fields anywhere. |
| Rating | `rating.js` Court Rating 2.0–8.0 (finishes + declared, pure module). Court Score ladder points (`build.mjs`). Two Scores residual walk (2–6 range). Three numbers, three names, no confirmation step. | None. Courts and paddles only. | One rating module that accepts finishes *and* games, with a confirm rule. |
| Ledger of results | `results.csv` + `events.json`, organizer-published, editor-checked, CLI import only. Two Scores games logged by one player, any participant can flag. | `court-fund-ledger.json` (money, not results). | No append-only results ledger with both-sides confirmation. |
| Bot/MCP map | `/mcp` 16 read tools; `/mcp/desk` 12 tools with `write: true/false`; MCP `readOnlyHint`. Human-okay rule lives in prose (`AGENTS.md`, `AGENT-DESK.md`). | `functions/api/mcp.ts` ~100 tools; `WRITE_TOOL_NAMES` set drives `readOnlyHint`. `agent-capabilities.ts` has `auth` + `sideEffects` for HTTP. | No third label for "reaches a person, needs their okay". |
| Town template | `SITE_CITY` + `cities/<slug>.json`; `city.mjs` hard-imports two cities; `city-site.mjs` writes a shell. Medway and New Braunfels are hand-written HTML, absent from the registry. | Brand word only; `federation-peers.ts` is a static roster. | Registry-driven discovery, venues and ladders per town, a generator for the sister pages. |
| Messaging | None outbound. | PMM is P2P, online-only, no store, no push. `sendMail()` (Resend) exists. | A consent-gated outbox with one-tap replies and a delivery adapter. |

---

## 1. Backbone

### 1.1 Shared profile (`coordination/profile/1`)

One JSON object per person, owned by the person, stored by whichever site they joined through, and portable by id. It splits cleanly into a **public projection** and **private fields that never leave the store**.

```json
{
  "schema": "coordination/profile/1",
  "id": "cp_7f3k2m9qzt",
  "handle": "ada-r",
  "display": "Ada R.",
  "town": "el-segundo",
  "identity": { "tier": 2, "proofs": [{ "provider": "google", "verifiedAt": "2026-11-01T18:00:00Z" }] },
  "contact": { "email": "…", "phone": "…", "push": { "endpoint": "…" } },
  "channels": { "sms": true, "email": true, "push": false, "quietHours": { "start": "21:00", "end": "08:00" } },
  "consent": { "communicator": true, "contactableBy": ["ladder-peers", "organizers"], "listed": true },
  "ladders": { "pickleball:el-segundo:open": { "declared": 4.0 } },
  "availability": [{ "days": [4], "start": "17:00", "end": "21:00" }],
  "venues": ["el-segundo", "manhattan-heights"],
  "recent": { "gamesLast30": 2, "lastInvitedAt": null },
  "removal": { "doNotList": false }
}
```

Rules.

- `publicProfile()` returns only `handle, display, town, tier, venues, listed`. `contact` is never serialized out of the store, never put in a message, never returned by any read tool. The engine enforces this and the tests check the JSON for it.
- `display` is first name plus last initial by default (the ladder's full-name rule stays for organizer results; the Communicator does not need it).
- `handle` is the ladder slug when the person claims a ladder page, else chosen. Merges follow the existing `players.json.merge_into` pattern.
- `removal.doNotList` mirrors `do-not-list.json` (hash of normalized name). A listed=false or doNotList=true profile is invisible to matchmaking.
- `consent.communicator` is the recipient's standing okay to be invited by the Communicator. Without it nothing is ever addressed to them. `contactableBy` narrows who may trigger an invite: ladder peers, organizers, or a named handle list.
- Storage: PointCast keeps it in `AUTH_DB.user_state` (`payload` JSON, versioned), keyed by `pcu_`; elsegundo.xyz keeps it in a Netlify Blobs store `coordination-profiles-v1` keyed by `cp_` with the ping-line keyHash as the tier-0 proof. Same shape both places.

### 1.2 Ping identity in tiers

Today a ping is a daily call-and-response at elsegundo.xyz and an async message to Claude at PointCast. Both are honor-system. The tiers below upgrade a browser into a person without ever making tier 0 feel like a login wall.

| Tier | Proof | Who issues | What it unlocks |
|---|---|---|---|
| 0 Browser key | A server-minted line (`ln_`/`pk_`, hash stored) or a client keypair (PMM P-256). Lives in localStorage. | Either site | Ping, join a ladder as Self-declared, RSVP to a game you were invited to, see your own outbox. |
| 1 Magic link | Email ownership. PointCast's `functions/api/auth/email/{start,callback}` already does this (hashed token, 15 min, rate-limited). | PointCast | Be invited (consent can be recorded against a reachable channel), recover a lost key, hold a profile across devices. |
| 2 Google or wallet | Google OIDC or a signed Tezos login (both built in `functions/api/auth/`). | PointCast | Submit and confirm scores that move a rating. Host games. Claim a ladder page. |
| 3 Vouched | Two Settled players on the same ladder vouch. `rating.js` already says "Vouches will count here once they exist." | The ladder | Organizer role on that ladder: confirm scores for both sides when one side is unreachable, import a feed. |

How a tier-0 line on elsegundo.xyz becomes tier 1 or 2 without elsegundo.xyz running auth: PointCast is the identity provider. `functions/api/auth/project-ticket.ts` already issues a 120 s ticket to a whitelisted origin and path. Add `elsegundo.xyz` (`/ping/`, `/pickleball/players/`) to its `PROJECTS` table; the page posts the ticket plus its line id to a new `POST /api/v1/profile/link` on elsegundo.xyz, which verifies the ticket back at PointCast and writes `identity.proofs`. The line's keyHash stays the tier-0 proof. No secret moves; the ticket is single-use and dies in two minutes.

Bots have their own lane and never sit in these tiers: PointCast agent identity (`pci_`, Ed25519 headers from `functions/_lib/agent-identity.ts`, `agent_keys` table) and elsegundo.xyz proof-of-work pings (`kind: bot`). A bot acting *for* a person carries that person's tier in the request and is bound by that person's consent.

### 1.3 Open rating and ledger (`public/communicator/ledger.mjs`)

Generalizes `public/pickleball/players/rating.js` from "pickleball finishes" to "any league or event", and settles the three-numbers problem.

**Ladder config.** One object per league, event series or pickup pool; the math reads it instead of constants.

```js
{ schema: 'coordination/ladder/1', id: 'pickleball:el-segundo:open', sport: 'pickleball',
  scale: { min: 2, max: 8, step: 0.5 }, halfLifeDays: 365, maxAgeDays: 730,
  game:   { toPoints: 11, pointsPerLevel: 12, k: 0.15, countAfter: 3 },
  finish: { placeAdj: { 1: 0.25, 2: 0.10, 3: 0, 4: -0.10 }, smallDrawTeams: 3, smallDrawWeight: 0.5 },
  confirm: 'both-sides', declaredWeight: 3 }
```

A bocce league sets `toPoints: 12`; a chess club sets `scale: {min: 800, max: 2800}` and swaps the walk; a tournament series sets `confirm: 'organizer'`.

**Ledger entry.** Append-only. Two kinds of evidence, one shape.

- `finish`: a placing in a published draw (what `results.csv` holds today). Rating weight follows `rating.js` exactly: level plus place adjustment, half weight for draws of three or fewer, decays by half each year.
- `game`: one scored game between two sides (what Two Scores and the Communicator produce). Counts only when **confirmed** under the ladder's rule. `both-sides` means at least one player from each side confirmed; that is the rule the Communicator uses.

**One rating, three readings.** The profile shows one number, `rate()`, which blends declared level, finishes and confirmed games. Standings (`standings()`) are the league table: wins, then point differential, which is the ES Rec tie rule from the May 2026 documents. "Court Score" (best-six finish points) stays a ranking on the ladder page and is computed from the same `finish` entries. Two Scores' Players and Critics lenses stay as they are: crew-private opinions, never blended into the open number.

**Range.** The open rating is 2.0–8.0 everywhere. Two Scores' 2–6 clamp is a crew display choice and is noted as such.

**Provenance.** Every entry carries `source: { kind: 'organizer' | 'communicator' | 'self', ref }`. Organizer entries keep the `results.csv` rules (organizer-published page, editor-checked, blocked hosts refused). Communicator entries carry the game id and the confirmations. Self entries never count toward the open number; they are evidence for the person's own page only.

### 1.4 The bot map: read, write, consent

Both sites label tools read or write (MCP `readOnlyHint`; `WRITE_TOOL_NAMES` at PointCast; `write: true` on the trading desk). The missing label is the one that matters to a person: **does this action reach someone?**

```
effect: 'read'     — looks at public state. Anyone, any bot, no okay needed.
effect: 'write'    — changes public state the actor owns or a shared board. Rate-limited, attributed.
effect: 'consent'  — reaches a person (invite, reminder, score request, message). Needs
                     (a) that person's standing consent for this channel and this kind of sender, and
                     (b) the actor's explicit okay for this send. Never automatic.
```

Where it lives.

- PointCast MCP: a `pointcast/effect` annotation beside `readOnlyHint` from `toolAnnotations()`, and a `toolEffects` map in `/agents.json`. A `CONSENT_TOOL_NAMES` set sits beside `WRITE_TOOL_NAMES` so the label exists. By Mike's decision (2026-11-09) the Communicator adds only read tools to the MCP and no consent tool; `CONSENT_TOOL_NAMES` stays empty. The server's pre-existing write tools (`drum_tap`, `loom_append` and the rest of `WRITE_TOOL_NAMES`) are unchanged by this work. Communicator write and consent actions live on the HTTP routes behind a signed-in person's okay.
- PointCast HTTP: `agent-capabilities.ts` gains `effect` beside `auth` and `sideEffects`.
- elsegundo.xyz: the same `effect` field in `agents.json` endpoints and the `/mcp/desk` tool table; `needsMike` on desk jobs is the same idea for the owner and keeps its name.
- The prototype renders the Communicator's own action table (`ACTIONS` in `engine.mjs`) so a visiting bot sees the labels before it calls anything.

Current PointCast tools under this lens, for calibration: `paddle_lookup`, `paddle_calendar`, `wants_board` read; `wants_post`, `wants_offer`, `loom_append`, `front_desk_checkin` write (public boards); `desk_ask`, `desk_pass` write with the resident key; `grok_inbox_answer`, `family_room_post` would be consent if the recipients were people rather than bots.

### 1.5 Town template

A town is a folder, not a codebase.

```
towns/<slug>/
  town.json        slug, name, state, timezone, point, hosts, status, identityProvider,
                   sisters[], features[]            (today's cities/<slug>.json, plus the next three)
  venues.json      [{ id, name, short, address, hours, blocks[], reserve, courts, aliases[] }]
                   (the Court shape from src/lib/courts.ts and src/data/courts-schedule.json, which
                   already carries src / checked / confidence on every fact)
  ladders.json     [{ ...coordination/ladder/1 }]
  channels.json    which delivery adapters are on (email, sms, push), quiet hours default, caps
  sisters.json     [{ slug, url }] rendered as the sister-town strip
```

Changes that make it repeatable.

1. `netlify/lib/city.mjs` reads `cities/registry.json` and imports every `towns/*/town.json` instead of hard-importing two files. Unknown `SITE_CITY` still throws.
2. `scripts/city-site.mjs` also generates `/medway/` and `/new-braunfels/` style sister pages from `town.json` plus a `home` block, so the two hand-written 37 KB pages become outputs, not sources. Register both in `registry.json` with `status: "page"` (live as a page on elsegundo.xyz, no domain yet); `knowledge-tree.json` reads status from the registry instead of hard-coding `site: null`.
3. `identityProvider: "https://pointcast.xyz"` per town, so the project-ticket bridge has one place to read allowed origins from.
4. `npm run town:new -- --slug medway --name "Medway" --state MA --tz America/New_York --lat … --lon …` copies the folder, fills the shell, adds the registry row and prints the owner checklist from `docs/SOUTH-BAY-CITIES.md` (domain, Netlify site, `SITE_CITY`).

Spin-up acceptance: `node --test tests/cities.test.mjs` green, `/about/`, `/llms.txt`, `/agents.json` present, one venue and one ladder listed, the Communicator loads `venues.json` and finds a slot.

---

## 2. The Communicator

**First job.** "Get me a 4.0 doubles game Thursday evening at Rec Park." Find players in that band on the open ladder, propose a time and court, send invites, take one-tap answers, fill dropouts, remind, collect the score with both sides confirming, write the ledger.

**Design rules.** Voice and text first; mobile; every reply is short and ends in two to four chips to tap. Contact details stay private. Anything that reaches another person is `effect: consent`: the recipient has opted in, and the host taps to send.

### 2.1 Flow

```
request ─parse─▶ proposal ─host okays─▶ inviting ─replies─▶ filled ─▶ confirmed ─▶ played ─▶ scoring ─▶ recorded
                    │                        │ out / no reply             ▲ (T-24h, T-2h reminders)      │ dispute
                    └ missing level/day/venue:│ backfill from waitlist    │                               ▼
                      one question, chips    └ waitlist empty → short → host: widen band / new time / cancel   disputed
```

1. **Parse.** `parseRequest()` is deterministic: level from the first `x.5`/`x.0` token, singles or doubles, weekday or tomorrow/tonight, window words (morning, afternoon, evening, after work, lunch) or a clock time, venue by alias ("Rec Park" → `el-segundo`). Anything missing comes back as one follow-up question with chips. Voice is the Web Speech API when the browser has it; the parser only ever sees text.
2. **Propose.** `proposeSlots()` reads the venue's hours and drop-in blocks from `courts-schedule.json`: a 4.0 private game on Thursday evening at Rec Park gets 5:00–6:30 PM, 6:30–8:00, 8:00–9:30 (open 8 AM–10 PM, no Thursday block), with the "Book on Rec" link as the reserve hint. A 3.5 request on Monday evening skips the Advanced drop-in 5–7 PM block; a 4.5 request may land in it.
3. **Match.** `findCandidates()` hard-filters on consent, listed, band (±0.25 around the requested level, declared level when there is no rating), availability on that weekday and window, venue in the player's list, not already in an overlapping game. Soft fit orders by closeness, evidence tag (Settled over Provisional over Self-declared) and fairness (fewer games in the last 30 days and longer since the last invite come first). Ties break by seed so a rerun gives the same list.
4. **Invite.** The host sees the slot and the top three plus a waitlist, and taps **Send invites**. That tap is the actor's okay. Each invite is one Message: "Ada, 4.0 doubles Thu 6:00–7:30 PM at Rec Park with Mike. In?" with chips **In · Out · Maybe · New time**. The engine throws if asked to address anyone without consent.
5. **Reply.** `reply()` moves a player between in, maybe, out. Full → `filled`, one "You're on" to everyone. An out after filled pulls the next waitlisted player in and re-invites. Waitlist empty → `short`, and the host gets **Widen band · New time · Cancel**. `New time` carries a slot; the host gets **Accept · Keep**; accepting re-invites everyone.
6. **Confirm and remind.** `confirm()` sends the address line and the reserve link with **Directions · Add to calendar · Drop out**. `reminders()` are computed at T-24h and T-2h; `dueReminders(now)` returns the ones to send, and the history records sends so nothing doubles.
7. **Score.** After the slot ends, any player in the game submits the sides and score. Games go to 11, win by one (ES Rec rule), so 11–10 passes and 10–9 and 11–11 fail. The entry lands in the ledger `pending` with the submitter's confirmation; the other side gets **Confirm · Dispute**. One confirm from the other side → `confirmed`, game `recorded`, ratings move, everyone gets their public delta. Dispute → the host sees it; an organizer (tier 3) can settle.

### 2.2 Messages and delivery

A Message is `{ to: handle, kind, text ≤ 160 chars, replies[], effect: 'consent', requires: { recipientConsent, senderOkay } }`. The engine writes to a handle, never to an address. A delivery adapter outside the engine resolves handle → the person's chosen channel from their private `contact` and `channels`, honors `quietHours` (a 9 PM invite waits until 8 AM), and renders the chips as the channel allows: tappable links in SMS and email (`/c/r/<token>?a=in`), buttons in push, spoken choices in voice. Replies come back through one `POST /api/communicator/reply` with the single-use token; the text path runs `parseReply()` so "can't tonight, how about 7?" becomes `newtime 19:00`.

Adapters, in order: PointCast `sendMail()` (Resend, exists) → web push (PMM v0.5 plan, VAPID) → SMS (Twilio, new, needs a number and Mike's okay). The adapter is the only component that ever sees `contact`.

### 2.3 Where the Communicator runs

- **Engine**: `public/communicator/{ledger,engine,demo}.mjs`, pure, shared by the browser prototype, Pages Functions and tests. Same pattern as `public/ai-grand-prix/engine.mjs`.
- **State**: `AUTH_DB` tables `coordination_games`, `coordination_messages`, `coordination_ledger` (append-only) and `coordination_profiles` (or `user_state` payloads) at PointCast; a Netlify Blobs store with the same shapes at elsegundo.xyz. The ledger is also published read-only as `/communicator/ledger.json` per ladder so the elsegundo.xyz build can import confirmed Communicator games into the ladder pages.
- **MCP** (PointCast `functions/api/mcp.ts`): read only, by Mike's decision. `communicator_ledger` (confirmed entries and public ratings for a ladder) and `communicator_game` (one game, names and handles only). A bot that wants to propose, invite, remind, score or confirm uses the HTTP routes below on a person's behalf, and each of those needs that person's okay recorded first at `POST /api/communicator/okays` (ten-minute window).
- **HTTP**: `/api/communicator/{request,invite,reply,score,ledger}` mirroring the tools, so elsegundo.xyz pages and the Loom can use them.

### 2.4 Privacy and consent, enforced

- Engine output never contains `contact`; tests scan every Message and every public projection for `@`, seven-digit runs and the word `contact`.
- Display names only, first name and last initial.
- Invites go only to `consent.communicator` profiles whose `contactableBy` admits the host's relationship. Tier 0 can be invited only if they turned the switch on from their own device; recording a reachable channel needs tier 1.
- Scores that move the open number need tier 2 on at least one confirmer per side; otherwise the game records as `pending` and shows on the players' own pages only.
- Every send is logged in `game.history` with actor and recipient handle, readable by both.
- A person can leave: `consent.communicator: false` ends all future sends at once; `removal.doNotList` hides them from matchmaking and the ladder.

---

## 3. The working slice in this PR

- `public/communicator/ledger.mjs`: `rating.js` ported verbatim plus `DEFAULT_LADDER`, `recency`, `isConfirmed`, `confirmEntry`, `disputeEntry`, `gameWalk`, `rate`, `standings`, `inBand`, `publicRating`.
- `public/communicator/engine.mjs`: `publicProfile`, `canContact`, `parseRequest`, `proposeSlots`, `findCandidates`, `createGame`, `invite`, `reply`, `acceptNewTime`, `confirm`, `reminders`, `dueReminders`, `markPlayed`, `submitScore`, `confirmScore`, `disputeScore`, `cancel`, `parseReply`, `renderText`, `ACTIONS`.
- `public/communicator/demo.mjs`: twelve fictional players and the host, two venues from `courts-schedule.json`, a seeded ledger, `DEMO_NOW` (Tuesday 2026-11-10 6 PM Pacific, so "Thursday" is the 12th).
- `public/communicator/index.html` + `app.js`: the clickable prototype. Phone frame, three views: **Host** (type or speak the request, see the proposal, tap Send invites, watch the roster fill, submit the score), **Player** (switch between invited players, tap In / Out / Maybe / New time, confirm or dispute the score), **Bot map** (the `ACTIONS` table with read / write / consent, and the ledger with ratings before and after). Everything runs in the page; nothing leaves it.
- `tests/communicator.test.mjs`: parity with `rating.js`, confirm rules, the game walk, parsing, slots, candidate filters, the full flow with a dropout and a new-time proposal, score validation, the privacy scan, and that `ACTIONS` covers every export.

Not in this PR, on purpose: storage tables, MCP tool registration, delivery adapters, the project-ticket whitelist change, the town generator, `agent-surfaces.ts` and sitemap entries. Each is a small follow-up listed below.

---

## 4. Follow-ups, in order

1. **Review** (Codex): `ledger.mjs` math against `rating.js` and `two-scores/core.mjs`; the consent guard in `invite()`; the privacy test's coverage. Touches rating logic, so review before anything reads it in production.
2. **Register the surface** (CC): `src/data/agent-surfaces.ts` human + json entries for `/communicator/`, sitemap-discovery row, `llms.txt` line; run `npm run audit:agents`.
3. **Storage and HTTP** (CC): D1 migration `migrations/auth/00xx_coordination.sql` (games, messages, ledger, profiles), `/api/communicator/*`, reply tokens. Still no delivery.
4. **Identity bridge** (CC, then Mike's okay): add elsegundo.xyz to `project-ticket.ts` `PROJECTS`; `POST /api/v1/profile/link` at elsegundo.xyz. Mike approves the whitelist change since it touches auth on both sites.
5. **Effect label** (CC): `CONSENT_TOOL_NAMES` and `pointcast/effect` in `mcp.ts`; `effect` in `agent-capabilities.ts` and `/agents.json`; mirror in elsegundo.xyz `agents.json`. Run `npm run audit:agents`.
6. **Delivery adapter v0** (CC, Mike's okay before the first real send): email via `sendMail()`, quiet hours, single-use reply tokens. Manus runs the two-phone test with Mike's own address and one consenting friend; log to `docs/manus-logs/`.
7. **Ladder import** (CC on elsegundo.xyz): `import-feed.mjs` reads `/communicator/ledger.json` confirmed games as `game` evidence; fix the `leagues.json` header drift while there.
8. **Town template** (CC on elsegundo.xyz): registry-driven `city.mjs`, `towns/` folders, generator for Medway and New Braunfels pages, `town:new` script. Mike decides whether Medway or New Braunfels gets the first venue and ladder.
9. **Voice** (CC): Web Speech in the prototype is in; a phone-call path (Twilio voice or a PointCast radio-desk hand-off) is a later decision.

## 5. Open questions for Mike

- Band width: ±0.25 around the requested level, or the half-step band (3.75–4.24 for "4.0")? The prototype uses ±0.25.
- Who may host: tier 2 only, or tier 1 with a cap of one open game at a time?
- First real channel: email (built) or SMS (new number, cost, carrier rules)?
- Does the open rating show on elsegundo.xyz player pages as the single number, with Court Score kept as the ranking? This doc says yes.
- Medway and New Braunfels: pages on elsegundo.xyz for now, or domains this season?
