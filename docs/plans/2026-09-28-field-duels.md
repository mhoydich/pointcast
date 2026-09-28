# Field Duels — battles with your stamps (people and agents)

2026-09-28. Fable design → skeptic revision. FINAL design first; Fable's original proposal as an appendix.

## What changed

- **Rooms move from KV to D1.** `/api/duel` can't referee picks that are hidden and made at the same time. It keeps each room in one KV key and updates it by reading and rewriting it, so when both players pick at once, one pick is lost. Its GET also returns the full state, so nothing is hidden (`for=` only filters WebRTC signals). KV lags between Cloudflare locations and has already hit its write cap. WebRTC is cut too: `drum-vs` only has STUN servers, and phones on LTE sit behind carrier NAT.
- **Stats aren't a lottery and don't reveal routines.** The `contrib(hour/weekday)` hashes gave every couch stamp another roll. They also let anyone work a card back to the day and hour it was filed. Stats now come from honesty and showing up, plus a ±3 variation hashed from the stamp id.
- **The desk can't be solved or farmed.** Stances seeded by the date could be worked out in advance. Now they come from a server secret and are committed before you pick. A desk hand is always the agent's three newest filings, so it never gets stronger.
- **Less to build, and nothing worth cheating for.** Cut: WebRTC, the `duel:open` marker, the 7.750 post, the OG card, the MCP write tools and the live 9:30 room. Winner and loser get the same stamp.

## Thesis

Two neighbors waiting for a court play the stamps they already put on the air. The strongest hand belongs to whoever showed up, got confirmed and let the server check where they stood. A good read still beats a better hand about one time in four.

## Cards and types

Each on-site `place` or `crew` stamp from open hours is a card. Badges aren't. `value` is never read and never leaves the owner's book. A LOANER card (TIDE, all 45s) fills a short hand, and a hand of only LOANERs is practice.

- ATK = 50 + 6 First Light + 4 crew + variation
- DEF = 50 + 8 geo-ticked + 6 confirmed (another phone's on-site `still`), no variation
- SPD = 50 + 3 × min(crewSize, 5) + variation
- FOC = 50 + min(deadAirHours, 48) ÷ 4 + variation

No agent is ever geo-ticked, so agents top out at DEF 56 and every geo-ticked human card out-armors them.

Type comes from agent readings and the spot, never from the reporter's answer. The first match wins:

| Type | When | Beats | Why |
|---|---|---|---|
| TIDE | Beach, NOAA high/low | — | The ocean doesn't care |
| SIGNAL | Crew stamp, or after sunset | FOG | Radio works when eyes don't |
| FOG | KLAX hazy/none that hour | SUN | The marine layer wins the morning |
| COURT | Other courts stamps | SIGNAL | A full court never checks the dial |
| SUN | Other beach stamps | COURT | Noon glare empties the courts |

## The duel (about 70 s)

1. **Hand, 15 s.** Put three cards in order, or tap QUICK HAND (best DEF). QUICK HAND also plays on timeout.
2. **Reveal.** Card faces show type, stats, spot and the trainer's Noun. They never show a date or hour.
3. **Exchange ×3, 10 s each.** Pick STRIKE, GUARD or FOCUS. A miss plays GUARD. Picks stay hidden until both are in.
4. **Resolve.** `computeDamage` from `resolve.ts` scores each exchange, and the higher damage takes it. Two exchanges win. Otherwise total damage decides, then SPD.
5. **Result, 5 s.** The stamp slams down. Rematch or leave.

## At the fence (peer to peer)

It's peer to peer socially, with a server as referee: two phones, one code, no account.

- **Join.** Duel shows a QR and a 4-letter code (the `drum-party` recipe), or you can text `/r/duel?join=CODE`. A third phone watches read-only.
- **Transport.** D1 holds `air_duels` and `air_duel_moves`: one move row per duel, round and side, with round 0 as the hand. INSERT OR IGNORE makes LTE retries harmless. Clocks run on server time, and the first read after a deadline writes the GUARD. Clients poll every second. A duel costs about 12 writes and 150 reads, and no KV.
- **Why not the others.** PRESENCE only counts heads. `DRUM_ROOM` party frames are a blind relay, so they could later carry a "poll now" nudge but can't hide picks. If a side misses every pick, there's no contest and nobody gets stamps.

## Agents

- **The desk's hand is today's weather.** Each agent plays its three newest filings. Sky is FOG or SUN, Tides and Swell are TIDE, and Air, Sun and night answers are SIGNAL. No agent card is ever COURT. Checked rows get +6 DEF.
- **Who keeps which feed.** cc keeps Sky, Sol keeps Tides and Swell, and Frog (Fable, Noun 779) keeps Air and Sun. Beat cc's fog with your crew's SIGNAL cards.
- **Play the desk.** cc, Sol and Frog are always open for an empty court. Each has a published lean: cc leans GUARD, Sol STRIKE and Frog FOCUS, 50% each. The server draws the agent's stances from its lean and a secret, and shows a hash commitment before you pick. It reveals the stances after the duel. Reading a lean pays off, but you can't compute it in advance.
- **Night Desk Bout.** Two agents a night, rotating on `dayIndexForDate`. Each files a card order and stances as a PR 4 night-shift job by 9:30 PM, or its lean plays for it. The first read after 9:30 resolves the bout and freezes it. It is reproducible, like `nouns_battler_play`, with no cron and nothing that can stall.
- **No farming.** Agent wins go only on the agent's record. Bouts give nobody anything.

## Stakes

- **DUEL:** one per owner per LA day. Winner and loser get the same stamp.
- **DESK:** beat any agent, one per owner per ISO week.
- Both need a geo-ticked or confirmed card in the hand, so couch books and LOANERs can't earn them.
- No points: `air_points.action`'s CHECK has no duel action. No bets, transfers or leaderboard. Your W–L is private, and duel stamps don't count toward rarity.

## Where it shows

- `/r/duel`: your cards, Duel, the desk, and `?join=`.
- Receipt: one line, "Waiting? Duel the person next to you."
- `/r/me`: your W–L.
- `/r/agent/[call]`: the agent's hand and record.
- `/morning`: one bout line, hidden when there was no bout.
- MCP: one read tool, `field_duel({date?, call?})`.

## Build

Duels ship as their own PR, `field-duels`, after PR 4, which brings the night-shift board. PR 3 brings geo, confirms, conditions and the agent card. The battle engine is reused, so only the transport is new.

- **Today:** add `'duel'` to `air_stamps.kind`'s CHECK in `0023_air.sql` before it merges, because SQLite can't change a CHECK later. If 0023 is already live, use `kind 'badge'` with a dated `day`.
- **`resolve.ts`:** export `resolveExchange(a, b, sA, sB, matchup = matchupMultiplier)`. Add `.ts` to its runtime import so node tests can load it. `/battle` is unchanged.
- **`src/lib/battler/field-cards.ts`:** cards, types and leans. Tests pin that `value` is never read, that agents can't pass DEF 56, and a balance target: under random stances, an honest regular should beat a LOANER hand 65–80% of the time. A simulation gives 74%.
- **Migration** (renumber against origin/main): `air_duels (id, code, day, mode, a_owner, b_owner, state, winner, commit, deadline_at)` and `air_duel_moves (duel_id, round, side, payload, at)`.
- **`functions/api/air/duel.ts`:** GET returns the deck and the room state with hidden picks removed. POST takes open, join, hand and pick. Whichever write completes round 3 settles the duel and writes the stamps.
- **Flag:** off until the Oct 23 kill test is read, so that test measures reporting, not card hunting.

## Risks

| Risk | Mitigation |
|---|---|
| Couch reports for cards | Geo and confirms drive the stats, variation is ±3, stamps need a geo-ticked or confirmed card, no points |
| Cards reveal routines | No weekday or hour in the stats, and no date on the card face |
| The desk gets solved | Secret stances, committed before you pick |
| Newcomers always lose | A read flips one duel in four, and a first-Friday hand beats the desk about 55% of the time |

---

## Appendix: Fable's original proposal

# FIELD DUELS — Pokémon-like battles built from field stamps

2026-09-28 · cc, from the Field Reports PRD, the badges doc, `functions/api/duel.ts`, `src/lib/battler/*` and `drum-party.astro`.

## 1. Thesis

A field duel is two neighbors at the fence replaying their own broadcasts: every card is a stamp the town already heard, so the strongest deck belongs to whoever showed up most and got confirmed most, and the game is one more reason to say it once where you stand.

## 2. Cards: what you battle with

**One stamp = one card.** Every `air_stamps` row (place, crew, badge) is a card. Stats come only from its `meta_json` traits: `spot, kind, weekday, hour, crewSize, firstLight, deadAirHours` today, plus `confirmed, geo` and the agent condition buckets (`fog, rain, temp, aqi`) from PR 3. **`value` is never read**, so "0 waiting" and "5+" make identical cards (PRD principle 5).

**Type**: one per card, from conditions and spot, never from the reporter's answer.

| Type | When | Beats | Why |
|---|---|---|---|
| FOG | Agent fog bucket at the observed hour is hazy/none (KLAX, not the fog answer) | SUN | The marine layer wins the morning |
| SUN | Clear bucket in daylight | COURT | Noon glare empties the courts |
| COURT | Courts spot, no condition dominant | SIGNAL | A full court never checks the dial |
| SIGNAL | Crew stamps, Dead Air, anything after dark or before first light | FOG | Radio works when eyes don't |
| TIDE | Beach stamp at a NOAA high/low bucket (PR 3) | nobody | The ocean doesn't care: neutral both ways |

Same shape as the Nouns chart (four-cycle plus wildcard), so `matchupMultiplier` (1.3×/0.77×) needs only a second table.

**Stats** (1–99, the `mix()`/`contrib()` hashes from `stat-derivation.ts`, no RNG):

- ATK = 50 + contrib(hour) + contrib(weekday) + 10 if `firstLight`
- DEF = 50 + contrib(spot) + **12 if confirmed + 8 if geo-ticked**
- SPD = 50 + 4 × min(crewSize, 5) + contrib(weekday)
- FOC = 50 + min(deadAirHours, 72) ÷ 3 + contrib(kind)
- HP = 70 + 0.6 × DEF (unchanged)

**Honesty is power.** Confirmed + geo-ticked stamps get the full DEF bonus and the HP that follows; on-site but unconfirmed cards play at −20 DEF. Remote rows never become stamps, so never cards. Flagged or removed rows drop out at read time. Before PR 3, `confirmed` is computed at deck-build time from on-site `still` rows in `air_confirms`.

**Art.** The card is the stamp: red cancellation, spot, date, type glyph. The reporter's town-card Noun is the trainer avatar (`noun.pics/{seed}.svg`); guests get the spot's noun. One LOANER card per book (TIDE, all 45s) lets a first-timer play.

## 3. The duel

Best of three exchanges, one card each, about 75 seconds.

1. **Hand (≤20 s).** Pick and order three cards, or tap QUICK HAND (best three by DEF). Order is the lead decision. The opponent sees type and stats only, never weekday or hour.
2. **Exchange ×3 (≤10 s each).** Both cards flip. Each player picks STRIKE / GUARD / FOCUS on a server-time shot clock; a miss plays GUARD. Picks stay hidden until both are in, via the `for=<pid>` filter `/api/duel` already has.
3. **Resolve.** Damage = `ATK × type × stance × FOC bonus − DEF/4`, exactly `computeDamage` in `resolve.ts`; the higher damage takes the exchange. 2–1 wins; 1–1–1 goes to total damage, then the SPD-then-draw tail from `resolveMatch`.
4. **Result (10 s).** Stamps slam (PRD motion table); rematch or leave.

`resolve.ts` delta: export `resolveExchange(a, b, stanceA, stanceB, matchup?)` (the private `computeDamage` pair plus the round-winner rule), give `resolveMatch` an optional `matchup` defaulting to the Nouns chart, and export `mix`/`contrib`. Nothing existing changes. Both phones run the same pure function for instant animation; the server's result is the record.

## 4. Peer to peer at the courts

- **Rooms.** `/api/duel` gains `mode: 'field'` and kinds `hand`/`pick`. Same codes, KV keys, 1-hour TTL and seats; a third phone is already a spectator (`side: 0`).
- **Join.** `/r/duel?join=CODE`, a QR (the `drum-party` recipe), or **Challenge** on a friend's receipt, which makes the room and unfurls it. After the crew reveal, **Challenge the crew** writes `duel:open:<spot>` (KV, 10-minute TTL) and the spot page's 5-second poll shows "Jen wants a duel · JOIN" on each crew phone.
- **Literally peer to peer.** `/api/duel` already relays WebRTC offer/answer/ice per pid. The phones open an RTCDataChannel for picks and animations; 400 ms KV polling is the fallback (drum-vs pattern) and the server referees.
- **Bad signal.** A duel is about eight tiny POSTs, each idempotent on (room, round, pid); the clock is server `now`. One miss plays GUARD; missing all three is "no contest" with no stamps, so dropping cannot farm.
- **Spectators.** `/r/duel?watch=CODE` reads the same state (picks shown once both are in), the bleachers pattern from `/brick-choir/watch`.

## 5. Stakes

Nothing is ever taken. The winner gets a **Duel** stamp and the loser a **Good Game** stamp, both dated, in `air_stamps` with traits (`opponentType`, `exchanges`, `confirmedCards`) for rarity later. Capped at one per opponent per LA day via `UNIQUE(owner, kind, ref, day)`, ref `duel:<opponent-hash>`. **Zero points** from duels: points stay a read of reports, so the Oct 23 kill test measures reporting, not fighting. No betting, no transfer, no leaderboard; a personal W–L on `/r/me` only.

## 6. Agents

- **Decks.** Agent cards come from the agent's book (Clockwork, Checked, Night Shift levels) plus one card per kept feed (Sky, Tides, Swell, Air, Sun) built from its latest filing. Type follows the feed (Sky → FOG/SUN by KLAX bucket, Tides → TIDE, Air and night desk → SIGNAL); stats use the same traits. Only Checked rows carry the confirmed bonus and no agent is ever geo-ticked, so a fully honest human card out-armors the best agent card by 8 DEF, by law.
- **Challenge the desk.** `/r/duel` lists cc, Sol and Frog (Noun 779) as always-open opponents: the empty-court answer. The server seats `agent:<call>` as p2 and plays a fixed, published policy per agent (cc counters the likeliest stance, Sol leans STRIKE, Frog leans FOCUS), seeded by `dayIndexForDate` so it shifts daily yet stays deterministic. No LLM on the fence path.
- **Night Desk Bout.** At 9:30 PM, after the Nightly Net, a night-shift board job opens an exhibition room. Agents play through MCP `field_duel_play({room, round, stance, card})`, mirroring `nouns_battler_play`; a late agent's policy moves for it, so the bout never stalls. The result parks on the dial at 7.750 as one station post, and the edition prints it.
- **No farming.** Agent wins write only to the agent's book (a bouts tally on `/r/agent/[call]`), never a human-facing reward. A human who beats an agent earns **Beat-the-Desk** once per agent per LA week (ref `beat-the-desk:<call>`, day = ISO week).

## 7. Where it shows

Crew panel: "Challenge the crew". Receipt: "Challenge a friend". `/r/duel` (book → hand, join code, the desk, last bouts) with `?join=` and `?watch=`. `/r/me`: W–L and the three new stamps. `/r/agent/[call]`: record and bouts. Morning Edition: one line after the reporter line, "Last night's bout: Sol (FOG) over cc (COURT), 2–1", hidden when none. The dial: the 7.750 post. Unfurl: `/og/r/duel.png?room=CODE` (the `/og/quartet.png` recipe).

## 8. Data and routes delta

- **D1**, folded into `0024_air_titles.sql`: `air_stamps.kind` CHECK gains `'duel'`; new `air_duels (id, room, day, a_owner, b_owner, a_kind, b_kind, mode 'friend'|'desk'|'exhibition', winner, hands_json, rounds_json, created_at)`, one row per finished duel, read by the edition and agent cards.
- **KV:** the existing `duel:{room}:*` keys plus `duel:open:<spot>`.
- **Pure code:** `src/lib/battler/field-cards.ts` (traits → card, type chart, agent policies), the `resolve.ts` exports above, node tests like `air-points.mjs`.
- **Functions:** `/api/duel` mode `field` with `hand`/`pick`; `functions/api/air/duel.ts` GET (your deck) and POST settle (verifies room state, resolves, writes `air_duels` and stamps); MCP `field_duel_deck`, `field_duel_play`, `field_duel_record`.
- **Pages:** `src/pages/r/duel.astro`, two buttons on `/r/[spot]`, one line in `/morning`.
- **Ships:** one PR, `field-duels`, branched after PR 3 (it needs `confirmed`, `geo` and the agent card); the migration fields land in PR 3 so nothing renumbers later. MCP tools and the Night Desk Bout ride with PR 4's night-shift board.

## 9. Risks

| Risk | Mitigation |
|---|---|
| A deck reveals a regular's routine (the PRD's privacy risk) | Opponents and spectators see type and stats only; traits never leave the owner's book |
| Stamp farming at the fence | One Duel or Good Game per opponent per day; no contest on walkovers; zero points |
| Game tone leaks into the quiet rooms | Duels live only on `/r/duel` and behind the crew reveal; the spot page still asks the question first |
| KV write cap | About eight writes per duel; past ~100 duels a day, move rooms to the DRUM_ROOM DO as `ndc-duel-<code>` |
| Battling before the kill test | Zero points and separate stamps keep the Oct 23 number clean; if it fails, desk duels stay a solo toy or shelve |
