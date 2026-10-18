# Field Reports v2 — PRD (repo copy)

Source of truth for the words: the Claude doc https://claude.ai/code/artifact/0b696da8-7080-4d02-97c0-ae4c945975fb (2026-09-29).
This copy exists so build agents can read it. Where it and the build spec disagree, the build spec's top block wins.

## Re-scope 2026-10-18 (read this before anything else)

The first v2 build stopped on 2026-09-29 (usage limit) before writing code. Three weeks later, production D1 shows the reporter loop never started: 1 human report ever (Mon Sep 28), 0 confirms, 0 Desk calls, 0 assignment fills; 82 agent rows from the early shift; 16 Morning Editions, frozen on the days someone read them. G1 (Oct 9) failed and the Oct 23 kill test will read 1 of 10 reports.

So v2 now builds only what works with zero reporters, which is what this PRD said first ("every v2 item must work with one report"; "the paper is the only loop that works with zero reports"):

1. **The paper:** edition slot 2 prints "Today's courts" (sourced sessions, wind, temperature, sunset) when there is no reading and the busiest spot when there is; /morning.xml RSS; signup that stores pending subscribers honestly until mail can send; the morning-daily Worker.
2. **The honest count:** /r/how prints the rules and the live kill-test count, the house list keeps Mike's phones out, and on Oct 23 the page reads the result and says what freezes.
3. **Sourced court data:** refresh courts-schedule.json (El Segundo drop-ins ended Oct 26-31 in our data; check November), JSON-LD on /pickleball, /courts.json confidence.
4. **Publish** it: FD block, front-door news, new-today.

Cut from this build (no reporters to protect or ask): 4-character session codes, code_via, typed codes, Conflict Desk changes, the Rec & Parks letter, Crew B tooling. They come back only if people start reporting.

Mail: pointcast.xyz DNS is at Namecheap (registrar-servers.com), so Cloudflare Email Sending cannot be onboarded without moving DNS; RESEND_API_KEY is unset. Signups wait as pending until one of those exists.

## Calls made for Mike (2026-09-29, Mike: "no feedback time, try a v2 to keep going")

These override the "Decisions for Mike" list at the bottom until Mike says otherwise.

1. **House list.** Any account with the director or broadcaster role is house automatically. Mike marks each of his phones from `/r/me` with a "This is a house phone" button that only a director/broadcaster session sees; it records the phone's `pid_hash` (and user id) in `air_house`. Marking a phone excludes its past rows too, so if Monday's Guest 3348 was Mike, pressing the button on that phone removes it from the count. Until then it counts.
2. **Strict kill-test count approved as written:** on-site, `source='page'`, `code_via IN ('typed','card')`, not house, Sep 28–Oct 23, 10+ reports from 3+ distinct people. Rows before Oct 1 (no `code_via`) count if not house. The loose count (any on-site code) prints beside it for learning only.
3. **Session codes:** 4 characters from an unambiguous alphabet, derived by HMAC from the pepper, spot and session start, so a director can view the code again later. Valid from 15 minutes before the session start to 2 hours after it. The old 10-character day codes keep working and tag `code_via='link'`.
4. **Edition email:** sender `morning@pointcast.xyz`, double opt-in, live from the first edition (Sat Oct 3, 6:45 AM). It only ever sends to confirmed subscribers. A `MORNING_DAILY_DRY_RUN` var exists for rehearsals.
5. **Edition slot 2** (busiest on-site spot yesterday, `courts` wins ties) ships now, not after Oct 3. On Oct 3, yesterday is the Friday Court Call, so the result is the same.
6. **Conflict Desk seeds:** only conflicts re-verified against live sources on 2026-09-29 are seeded. Agents ask through `desk_ask` after deploy, never by migration.
7. **No** SMS, Web Push, fence QR, new coded spots, sponsors or cash in v2.
8. **The letter** to El Segundo Recreation & Parks is drafted in `docs/plans/`, never sent by an agent. Mike sends it himself after 2 conflicts resolve.
9. **Manhattan Middle gate hours** can't be phoned by an agent. Court Call 1 stays Fri Oct 2, 7:30 AM; the "Gate's locked" answer exists for exactly this case.

# Field Reports v1 — state on 2026-09-29 (read this first)

Shipped 2026-09-28 (all live on pointcast.xyz, merged + deployed by cc):
- #1239 Field Reports: /r, /r/[spot], /court; D1 0023; one-tap on-site reports with per-spot presence codes (peppered hashes), confirm strip ("Still true?" = validators), receipt + stamps, 3-phone Morning Crew reveal (needs >=2 networks; signed-in phone = own network #1241), station posts on the Shortwave dial.
- #1240 Manhattan Middle School courts: "Paddles in the rack?" Gate's locked / 0 / 1-4 / 5-8 / 9+ / Can't say (giant paddle rack is the queue; gate hours unclear; city lists weekends + school breaks only).
- #1242 Morning Edition /morning + /morning.json: 7 slots, freeze on first read after 6:45 AM, bylines; preview until No. 1 Sat Oct 3.
- #1243 Assignments phase 1 (/r/assign): house-created calls, +10 points + ASSIGNMENT stamp, WITNESSED mark; no cash (tez payouts + sponsors specced, gated on Mike + attorney/CPA; 1099 threshold $2,000 in 2026; AB5; minors).
- #1244 Pickleball Board /pickleball: best bet now, KLAX conditions, 11 South Bay courts by shape (paddle rack / reservation + drop-in / first-come), sourced schedules (El Segundo Rec Park drop-ins Adv Mon 5-7 PM $5, Fri 9-12 $7, 3.0 Sat-Sun 9-12, 3.5 Sat-Sun 3-5; rec.us), parking + court vibe (Pancake→Condemned), validators, open /courts.json, schema.org JSON-LD.
- #1246 spot-page header: about, open-now, today, prior, weekly leaderboard (days not times, handles only, +N guests).
- #1247 front door "New today" strip + blocks 0626-0630; #1248 Shop stage 1 (paddle reviews as takes, PaidLink inert until a program approves, method page, /shop/court; Paddle Register stays affiliate-free); #1249 hummingbird feeders desk review (block 0629, art from Mike's paintings).
- #1250 Early shift + the Desk: cron worker files agent rows at 6 AM (cc=KLAX sky, Sol=NOAA 9410660 tides + NDBC 46221 swell, Frog=sun + AirNow air [blocked: no key]); agent cards /r/agent/[call]; calls from the desk (bucketed questions agents ask people on site: posted sign, closing time, lights); MCP desk_* tools; migration 0025.
Designed but not built: Regulars (geo-ticked crowns, house barred) + Night Editor title; Field Duels (stamps as cards, honesty = power, D1 move rows); Takes (predictions scored by oracles/reports, from supertake.com); stamp rarity page (jack.art/credits model; traits recorded now); Tezos season stamps (reuse seal_soulbound_v2 KT1UVn9…uroy3); Elevating local data (receipts, publish where search/AI look, patterns, monthly court report to MBUSD/El Segundo Parks, open court-status spec like GTFS).
Live numbers this morning (Tue Sep 29): first scheduled early shift ran 6:00:23 AM PT — sky, tides, swell, sun filed; air blocked. Human reports: exactly ONE genuine on-site report so far (El Segundo Rec Park, Mon 3:45 PM, "1-4", Guest). 0 confirms, 0 assignments posted, 0 desk calls, 0 frozen editions (preview), 0 crews. First Court Call: Fri Oct 2 7:30 AM at Manhattan Middle (Mike's crew). Morning Edition No. 1: Sat Oct 3 6:45 AM. Kill test: Oct 23 (10+ non-Friday reports from 3+ people besides Mike over 4 weeks, else stop adding game layer; keep edition).
Mike's standing directions: personal broadcasting; slight mobile-game lean; no people/places in generated art; art from his own Midjourney sheets (pastel for rewards, grey pixel for UI, riso for edition) + his hummingbird paintings; publish = block + front door; keep going through the list; Sonnet 5.5 builders / Opus architect / Fable concept; honesty rules (sources + checked dates; no fabricated reviews).
Waiting on Mike: AirNow key; QR card permission at the fence; Franklin C45 + Morgan's Honolulu J3CR take details; cash decision for assignments; courts name confirmed (Manhattan Middle).
Docs: ~/pc-desk/docs/plans/2026-09-28-*.md (prd, build-spec, badges-mayors, field-duels, field-assignments, pickleball-board, early-shift-desk-spec, desk-calls-design, sonnet-spikes, shop-stage1-spec).

## The v2 thesis

**v1 put a report on the air; v2 puts it on the record, and adds no new game until Oct 23 says so.**

Every v2 item must work with one report, because one is today's count. v2 first fixes what we count, so the Oct 23 number means something. It then gets two crews tapping on the days the test counts and delivers the paper to inboxes at 6:45. Agents may ask a neighbor only when two named sources disagree, and resolved answers reach the city in one plain letter.

## The loops

Each of the four loops breaks at one step today, and v2 fixes that step with the smallest change that works at one report.

| Loop | Where it breaks today | The v2 fix |
|---|---|---|
| Reporter: why tap again | The Guest got a stamp, then silence. No confirm, no byline (the edition is a preview), grey after 45 minutes. | The receipt offers "Get tomorrow's paper." The byline arrives by email at 6:45. |
| Reader: why check daily | With no live rows the board is a sourced almanac, identical tomorrow. Nothing reminds anyone it exists. | The edition goes out by email and `/morning.xml`. Slot 2 always carries today's courts. |
| Agent: value without spam | 0 calls. Tides and swell have no human check; air is blocked. Agents are a feed, not a desk. | The Conflict Desk: a call only when two named sources disagree. |
| Institution: give and get | Nobody at the city knows this exists. Hours read UNVERIFIED. | One letter to El Segundo Recreation & Parks after 2 conflicts resolve. |

**Cut: Heard by N.** At today's traffic it prints "Heard by 1" and counts Mike, agents and crawlers. It also needs a per-reader table we don't keep. The emailed byline closes the reporter loop instead.

## Bets

v2 makes five small bets, each with a dated signal, and cuts everything else until its gate.

| Bet | Why | Cost | Leading signal | Kill criterion |
|---|---|---|---|---|
| 1. Fix what we count | Every other number depends on it. | S; ships Thu Oct 1 | Every Oct 2 report carries `code_via`; none lands 2+ hours after the session | None; it is a precondition |
| 2. Two crews, no new game | Only people move the kill test. | S; one code change by Sat Oct 3 | Mon Oct 12: 5+ Crew B reports from 2+ people. Fri Oct 16: a Court Call Mike doesn't open | Oct 23 strict count fails: freeze the game layer |
| 3. The paper arrives | The only loop that works with zero reports, and it carries bylines home. | M; signup by Thu Oct 1, first send Sat Oct 3 | 10 subscribers by Sat Oct 17; 25%+ of sends get a `?src=em` click | Under 5 subscribers Oct 17: the edition stays a page |
| 4. The Conflict Desk, narrowed | The only agent mechanic that gives a neighbor something to check. `desk_ask` already exists. | S; ships Thu Oct 8 | First on-site answer by Mon Oct 12; 3 resolved by Fri Oct 23 | 0 answered by Oct 23: calls off, agents keep the early shift only |
| 5. One honest letter | The hours conflict is useful to the city, and email costs nothing. | S; Mike's time | A named staff reply or a corrected page by Sun Nov 15 | No reply after 2 emails: keep hours public, stop asking |

**What each bet builds**
- **Bet 1.**
  - A reporter is a distinct `COALESCE(user_id, pid_hash)` with an `onsite=1`, `source='page'` row, minus the house list.
  - The house list holds Mike's `pid_hash` values and `user_id`. Agents are excluded by `source`.
  - Each report gets a `code_via` tag (`typed`, `card` or `link`) and the code's age in minutes.
  - `/r/[spot]` gets a 4-character code field. Today codes arrive only by `?c=` link.
  - Court Call and Crew B codes expire 2 hours after session start. Today's `air_codes` rows last whole days.
  - The kill test counts `typed` and `card` only. Rows before Oct 1 count if not house.
  - `/r/how` prints these rules.
- **Bet 2.** Edition slot 2 is hard-wired to spot `courts` (`functions/_lib/morning.mjs:63`, `functions/_lib/morning-sources.ts`). El Segundo bylines never print. Slot 2 will pick yesterday's busiest on-site spot, with `courts` winning ties. Ship Sat Oct 3 after No. 1 freezes, before Sunday's edition.
- **Bet 3.** Clone `workers/kennel-daily` into `workers/morning-daily`, sending from `morning@pointcast.xyz` with `MORNING_DAILY_DRY_RUN`. Add table `edition_subscribers` (likely 0026; renumber against main). With no reading, slot 2 prints *Today's courts*: sourced sessions, NWS hourly wind and temperature, sunset. Add `/morning.xml`. No Web Push.
- **Bet 4.** `desk_ask` accepts a call only when it names two disagreeing sources or a fact past its checked date. One open call per spot, shown only after a receipt, 48-hour expiry, v1 caps (5 per agent per day). A confirmed answer flips "checked Sep 28" to "confirmed on site Oct 2", with a date and never a handle. No Night Editor, agent stamps or chimes.

| Seed conflict | Source A | Source B |
|---|---|---|
| Rec Park closing time | Rec page: 10 PM | City page: 9 PM |
| Manhattan Middle public hours | City: weekends and school breaks only | Friday 7:30 Court Call ("Gate's locked?") |
| El Segundo advanced drop-ins | Mike: Mon 5–7, Fri 9–12 | Places2Play: Thu 6–9, Sat 9–12 |

- **Bet 5.** After 2 conflicts resolve, Mike emails El Segundo Recreation & Parks. The ask: "Your pages say 9 and 10 PM; here's what we saw; can you confirm?" The same facts go on `/pickleball` as visible text and JSON-LD, plus one `llms.txt` line. Nothing goes to MBUSD in v2.

**Cut from v2:** Heard by N, Regulars and the geo tick, Night Editor, the spec's discovery file, schema and validator, the courts oracle and `split_shares`. Also cut: the riso Court Report, fence QR, sponsors, paid assignments, season stamps, Web Push and new coded spots. Each returns on its own gate.

## Game v2

v2 ships no new game mechanic; v1's stamps, points and badges keep running, and each designed piece waits on its own gate.

A title over three people is not a game. A mechanic launched before Oct 23 would also muddy the one test that decides the game layer.

| Piece | v2 or later | Gate | Why |
|---|---|---|---|
| Stamps, points, First Light, Morning Crew, Still True, Byline | Running (v1) | None | Already live; points stay a score |
| `/r/how` counting rules | v2, Thu Oct 1 | None | Part of bet 1; the rules should be public |
| Regulars (opt-in geo tick, house barred, 3-day minimum) | Later | G2 | It rewards exactly what Oct 23 measures, so shipping first would make the test measure the reward |
| Night Editor | Later | G2 plus 3+ human-confirmed desk answers | A title over no answers is noise |
| Field Duels | Later | G3, if crews pick it over Takes | Its own flag says read Oct 23 first; one reporter plays a loaner |
| Takes on conditions | Later | G3 plus 4+ same-weekday days with 3+ reports each | Nothing to score before that; paddle takes stay |
| Rarity page | Later | 500 human stamps from 20+ owners | Traits are already recorded |
| Season stamps (`seal_soulbound_v2`, KT1UVn9…uroy3) | Later | G3, with per-stamp opt-in | Don't mint a season with one holder |
| Referral stamps | Later | G3 | Needs a list worth referring |

**Rules any later mechanic inherits**
- Points reward the act, never the answer, with the 30-a-day cap.
- House accounts and agents never hold a Regular title, a crew or human points.
- The geo tick stays opt-in and gates only the crown. It stores 0 or 1 and never blocks a report.
- "Returning reporter" (on site in 3 of 6 weeks) is a metric, not a title.

## Data v2

v2's data product is sourced hours and an honest "unknown", not live status, because one report cannot carry a pattern.

**Patterns and forecasts**
- A pattern like "typical Friday 7:30" prints only after 4+ same-weekday days, each with 3+ on-site reports.
- The earliest Friday pattern is Fri Oct 30, if Oct 2, 9, 16 and 23 each reach 3.
- Until then the page shows the same weekday last week, labeled with its date.
- Forecasts are sourced conditions only, each naming its source. That means NWS hourly wind and temperature, KLAX sky, NOAA 9410660 tides, NDBC 46221 swell and sunset.
- No crowd forecasts in v2.

**The court-status spec (draft 0.1)**

v2 adds only two things to `/courts.json`: a `confidence` value on the existing hours provenance, and a `closures[]` array. The Conflict Desk and the letter need both. The rest stays a draft until an outside consumer asks. [GBFS](https://github.com/MobilityData/gbfs) shows what to copy then: one discovery file, JSON schemas and a public process.

| Field | Type | Rule |
|---|---|---|
| `spec_version`, `generated_at`, `ttl` | string, ISO time, seconds | Additive changes are minor; breaking ones get a new path, the old one live 90 days |
| `publisher` | {name, url, contact, license} | License is CC0 |
| `courts[].id` | slug | Stable; matches `/r/[spot]` |
| `osm` | "way/123" | Optional; set only after a survey edit |
| `name`, `geo`, `address`, `operator` | text, {lat, lon}, text, enum | Operator is city, school district or private |
| `shape` | enum | paddle-rack, reservation+drop-in, first-come |
| `courts`, `surface`, `lit`, `access` | int, text, bool or unknown, enum | Access is public, school or permit |
| `hours` | OSM [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours) string | `unknown` by default; `SH` covers school holidays |
| `hours_source` | {url, checked, confidence} | Confidence: verified, posted-sign, reported, unknown (new in v2) |
| `closures[]` | {from, to, reason, source} | From an operator or a posted sign only (new in v2) |
| `status` | {state, busy, as_of, expires_at, n_reports, n_networks} | Under 2 reports or 2 networks, or expired, prints `unknown`. No handles |

The draft becomes a spec when a non-PointCast user-agent fetches it twice across 2+ weeks. Codex or our own MCP tools don't count. No outside consumer by Mon Nov 30 means it stays an internal API.

**The monthly court report (later, at G2)**
- v2 sends one letter instead (bet 5).
- After G2, `/r/court-report/[spot]/YYYY-MM` prints coverage, day-part demand, access incidents, hours gaps, the confirm rate and one ask.
- No. 1 covers November and publishes Tue Dec 1. It goes to El Segundo only.
- MBUSD gets nothing until the district confirms school-day hours by phone.
- Signal: a named staff reply, or one hours or sign fix traced to the report. Kill: no reply after No. 2; keep publishing, stop sending.

**Citations by search and AI**
- Put the same facts in visible HTML, JSON-LD and plain text. ChatGPT and Perplexity treat JSON-LD as page text ([Search Engine Roundtable](https://seroundtable.com/chatgpt-perplexity-structured-data-text-40862.html)).
- Mark courts as [`SportsActivityLocation`](https://schema.org/SportsActivityLocation) with `openingHoursSpecification`. There is no pickleball type; don't use `TennisComplex`.
- Mark the Court Call and sourced drop-ins as [Events](https://developers.google.com/search/docs/appearance/structured-data/event) with `eventStatus`.
- Add one [`llms.txt`](https://llmstxt.org/) line pointing at `/courts.json`. Nothing shows assistants read it at answer time, but it costs nothing.
- OSM: Mike may add facts he saw on site, tagged `source=survey`. Never bulk-copy rec.us or push live status.
- Signal: the Rich Results Test passes on `/pickleball`. A weekly query ("pickleball drop-in El Segundo Friday") gets cited once in 8 weeks.
- Kill: no citation by Mon Nov 30; stop schema work and keep visible text.

**Privacy rules**
- On site, any aggregate needs 3+ reports. Anything that leaves the site suppresses cells under 5.
- Nothing sent to an institution carries handles, names, photos or anything about minors. Dates only.
- No per-reader tracking, which is one reason Heard by N is cut.
- No location is stored. A future geo tick stores 0 or 1 and drops the coordinates.
- House and agent rows never count as reporters, bylines or crews. Agent rows print grey.
- A soulbound stamp names a spot and season only, never a date or time, and needs per-stamp opt-in.

## Economy v2

v2 is points-only: people earn points, stamps and citations, only the house earns dollars, and nobody is paid before Gate $.

Paying anyone before Oct 23 would spoil the test, which measures whether people report without pay. Minors read `/r`, so no money, dividend figure or sponsor appears there in v2.

**Gate $ opens only when all six hold**
1. G2 (the Oct 23 kill test) has passed.
2. 5+ distinct non-house reporters filed in the last 30 days.
3. An attorney memo covers AB5, 18+ and no prize draws.
4. A CPA process covers W-9s and 1099-NEC tracking (the 2026 threshold is $2,000).
5. Earned revenue in the prior 30 days at least equals the bounty budget.
6. Mike signs every payout batch; agents never hold the key.

Payouts come only from the network half of earned revenue, never first from Mike's pocket. January 2027 is the earliest realistic date.

**The first real dollar**

Oracles earn cents: 100 calls make $1, and both live oracles sit at 0 settled calls. The likeliest first dollar is an affiliate commission. One Selkirk paddle near $200 pays about $30, in December at the earliest. Next is a founding edition sponsor at $25 a week for 4 weeks, asked only after 50 email subscribers.

| Option | Legal gate | Opens | Kill |
|---|---|---|---|
| Shop affiliate: Selkirk via AvantLink (15%, 30-day cookie), 11SIX24 ($10 per paddle) | FTC disclosure (built into PaidLink); Paddle Register stays affiliate-free; reviews only from real use | v2, as house work, never on `/r` | Under 20 outbound clicks a month at day 60 |
| Edition sponsor: a labeled masthead line, $100 for 4 weeks | "Sponsored" label; one-page terms (no say over content, no early look); no cannabis, Good Feels included | 50 email subscribers; never on a Court Call or `/r` | 0 paid from 5 asks |
| Courts oracle: x402 at $0.01, id `courts`, reporter shares via `split_shares` | Signed answers (`X402_RECEIPT_SK`); reporters see "cited by agents 3×", never dollars | G2, CDP keys set, and a first non-house payer on `marine-layer` or `paddles` | 0 non-house payers 30 days after listing |
| Tezos season stamps on `seal_soulbound_v2` (KT1UVn9…uroy3) | Not pay: no cash value, non-transferable; per-stamp opt-in; spot and season only | G3; Fall 2026 closes Sun Dec 20, mints the week of Dec 21 | Under 2 claims in the first batch |
| Paid assignments in tez: $3 a fill, $100 a month cap | AB5, 18+ self-certification, no draws, W-9s stored outside D1, 1099-NEC tracking | Gate $; January 2027 at the earliest | Over 50% of paid fills from the same 2 people |

Skip sponsor-funded bounties through Stripe Connect. A $5 bounty loses about 45% to fees at Stripe's published Express pricing (confirm current rates). Revisit only when a sponsor funds $20+ a fill.

**Whole-economy kill:** if G2 fails and affiliate, oracle and sponsor revenue is under $50 on Tue Dec 1, shelve the economy. Field Reports stays a free edition with points.

## Distribution

v2 spreads through people's own phones and texts: two crews, one paper, and no new channels.

**The Court Call ritual (Crew A, Manhattan Middle, Fri 7:30 AM)**

| When | Who | What |
|---|---|---|
| Thu 7 PM | Mike | Shortwave post and group-chat text: "Court Call Fri 7:30, pointcast.xyz/court." No code. |
| Thu night | Mike | Sends the session code privately to Captain A. |
| Fri 7:30 | First at the fence | Opens `/court`, taps, and reads the 4-character code aloud. Others type it. The coded link goes to the chat only as a fallback. |
| Fri by 10 AM | Mike or Captain A | Shortwave result: "Crew fired, 5 phones." |
| Sat 6:45 AM | The paper | Bylines arrive by email; Mike texts `/morning` to the chat. |

- Confirm by Thu Oct 1 that the gate opens at 7:30 on a school day. The city lists public hours for weekends and school breaks only.
- **Captain A** opens the day when Mike can't. Proof: by Fri Oct 16 a Court Call fires with someone else tapping first.

**Crew B (El Segundo Rec Park drop-ins, the kill-test lever)**
- Sessions that count: 3.0 Sat/Sun 9–12 and 3.5 Sat/Sun 3–5 through Oct 31, Advanced Mon 5–7 through Oct 26. Friday doesn't count.
- Oct 3–22 holds 9 eligible days. Three players at 4 sessions each pass the test.
- Mike names Captain B, a drop-in regular, by Fri Oct 2. The first spoken code is Sat Oct 3 at the 3.0 session.
- 0 Crew B reports by Mon Oct 12: change the session, not the product.
- The published blocks end Oct 26–31. Check rec.us for November by Sat Oct 24, or the board goes quiet.

**Cards**
- No QR on school property, ever. No fence QR anywhere in v2.
- After G2, ask El Segundo Recreation & Parks in writing for a city-court card.
- Pocket cards carry no code and link to `/morning?src=card`. Under 3 card signups in 21 days: stop printing.

**Edition email**
- Two crons, `45 13 * * *` and `45 14 * * *`, send only when the LA hour is 6. That survives the Sun Nov 1 DST change.
- Dedupe on `last_sent_day`. Double opt-in, one-click `List-Unsubscribe`, no tracking pixel, `?src=em` links.
- Signup lives on `/morning` and on every receipt: "Get tomorrow's paper."
- Health: 25%+ of sends clicked, under 5% unsubscribes. Under 15 subscribers on Oct 23: send weekly on Saturdays.

**Next courts and towns**
- Ask the Oct 2 crew: "Where else do you play, and when?"
- All 11 courts already have pages. A court gets live codes only with a named reporter who commits to one on-site report a week.
- No new coded court before G2, and at most 2 after it. Candidates: Perry Park, Manhattan Heights, Alta Vista.
- A coded court with 0 on-site reports for 21 days loses its code and live strip. Its sourced schedule stays.
- Towns: `/courts.json` is already forkable. Build nothing until an outside organizer asks and runs 3 straight weekly calls with 3+ phones (G5).

**What not to do**
- No SMS service: Twilio means A2P 10DLC registration and TCPA consent.
- No Web Push, native app, GPS gate, or leaderboard beyond the weekly spot header.
- No sponsor on a Court Call, and no mail to MBUSD.
- No "Heard by" counter, and no court without a reporter.

## Roadmap and gates

v2 runs from Court Call 1 on Fri Oct 2 to v3 scoping by Tue Dec 15, and the Oct 23 kill test decides everything after it.

| Gate | Passes when | Unlocks |
|---|---|---|
| G1, Fri Oct 9 | 2 Court Calls, each with 5+ on-site phones and a crew | Court Call stays Friday 7:30 at Manhattan Middle. Fail: move day, time or court before Oct 16 |
| G2, Fri Oct 23 | Kill test passes on the strict count | Regulars, Night Editor (after 3 confirmed desk answers), up to 2 coded courts, the court report, city-court card asks, courts oracle. Fail: freeze the game layer; keep edition, email and desk data |
| G3, Mon Nov 9 | 10 returning reporters and 50 email subscribers | Takes or Field Duels (crews pick one), season stamps, referral stamps, the sponsor ask. Under 5 returning reporters: edition-only product |
| Gate $ | All six conditions in Economy v2 | Paid assignments and dividend payouts; January 2027 at the earliest |
| G5 | An outside organizer asks and runs 3 weekly calls with 3+ phones | Fork kit; the spec's discovery file, schema and validator |

**Metrics**

| Metric | Target | Read on |
|---|---|---|
| Reports tagged with `code_via`; none 2+ hours after the session | 100% | Fri Oct 2 |
| Court Call 1 on-site phones; crew fires | 5+ and yes (under 3: move day or time) | Fri Oct 2 |
| Edition No. 1 freezes at 6:45 with no empty slot | Yes | Sat Oct 3 |
| Court Call 2 phones back from Oct 2 | 3+ | Fri Oct 9 |
| Crew B on-site reports | 5+ from 2+ people | Mon Oct 12 |
| First Conflict Desk answer on site | 1 | Mon Oct 12 |
| Captain-led Court Call | Fires without Mike tapping first | Fri Oct 16 |
| Email subscribers | 10 (kill under 5) | Sat Oct 17 |
| **Kill test, strict count** | **10+ non-Friday on-site reports from 3+ non-house people, Sep 28–Oct 23** | **Fri Oct 23** |
| Conflicts resolved on site | 3 | Fri Oct 23 |
| Email subscribers | 25 (under 15: weekly send) | Fri Oct 23 |
| Distinct daily edition readers | 15 (flag under 8) | Sat Oct 31 |
| Returning reporters (on site in 3 of 6 weeks, Sep 28–Nov 8) | 10 (under 5: edition-only) | Mon Nov 9 |
| Email subscribers | 50 | Mon Nov 9 |
| Letter: named staff reply or corrected page | 1 | Sun Nov 15 |
| AI assistant citation in 8 weekly checks | 1 | Mon Nov 30 |
| Affiliate, oracle and sponsor revenue | $50 (under, with G2 failed: shelve the economy) | Tue Dec 1 |

**Risks**

| Risk | Mitigation |
|---|---|
| Coded links leak through the group chat, so couch reports pass the test | Spoken, typed codes; 2-hour session codes; `code_via`; strict count fixed before Oct 2 |
| The strict count fails on a technicality | Report the loose count beside it for learning; pass or fail stays on the strict count |
| Monday's Guest was Mike | House list today; the count restarts at 0 and the plan is unchanged |
| Manhattan Middle is school property; a 7:30 crowd gets the gate locked for good | Confirm school-day hours by phone; no QR, no MBUSD mail; move Court Call if the gate isn't public |
| Mike is the only captain | Captains A and B named by Oct 2; the Oct 16 captain test |
| Crew B sessions end Oct 26–31 | Check rec.us for November by Oct 24 |
| Agent rows make the board read as bot town | Agent rows print grey and never count; calls only on named conflicts, one per spot |
| Small counts re-identify a crew | Suppress cells under 5 off-site; dates without handles |
| Email lands in spam or double-sends at DST | Dry-run flag, double opt-in, `List-Unsubscribe`, LA-hour check across two crons |
| Parallel work breaks main before Oct 1 | Bet 1 ships as its own PR; migrations renumbered against main |

**Decisions for Mike**
1. Was Monday's Rec Park Guest you? Answer today. If yes, the kill-test count starts at 0.
2. Open `/r/me` on each of your phones by Wed Sep 30 so the house list is complete.
3. Approve the strict kill-test count before Oct 2: typed or card codes only, house excluded, never loosened.
4. Confirm by phone by Thu Oct 1 that Manhattan Middle's gate opens at 7:30 on a school day. If not, move Court Call 1.
5. Name Captain A and Captain B by Fri Oct 2.
6. Approve `morning@pointcast.xyz` as sender and a first send Sat Oct 3, or Oct 10 if dry runs fail.
7. Agree to send the hours letter to El Segundo Recreation & Parks under your name after 2 conflicts resolve.
8. Optional: add the CDP keys (5 minutes) so both oracles list on Base, and apply to Selkirk (AvantLink) and 11SIX24.
9. Still owed from v1: the AirNow key, and confirming the "Manhattan Middle" name.

