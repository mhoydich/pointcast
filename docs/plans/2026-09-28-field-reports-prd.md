# PointCast Field Reports + Morning Edition + Shop — PRD

2026-09-28 · Mike Hoydich (director), drafted by cc with Fable concept + judge panel.

## First principles

Field Reports gives a neighbor a five-second way to answer what another neighbor is about to ask. Then it puts that answer on the air for the whole town.

**The problem.** The front door is a Shortwave feed. Last week it sat three days stale, and every post on it was Mike's. A broadcast with one voice is a blog. People need a reason to come back, and a reason to speak when they do.

**The core unit is one observation.** An observation is one place, one question, one bucketed answer, one time and one reporter. For example: "Rec Park courts, how many waiting, 1–4, Fri 7:38, @jen." Stamps, bylines, points, the dial, the Morning Edition, the shop and later the oracles are all reads of that one row. If a feature cannot be written as a read of observations, it waits.

**Personal broadcasting.** PointCast's line is "Say it once. The whole town hears it." A field report is the smallest version of that. You tap one answer where you stand, and it lands on the dial that every open PointCast page already shows. It carries your name and your spot. It is not a post and not a review.

**What we are building**

| Piece | Job | First route |
|---|---|---|
| Field Reports | One question per spot, answered on site in five seconds | `/r` and `/r/courts` |
| Morning Edition | One screen at 6:45 AM with seven fixed slots and bylines from reports | `/morning` |
| Shop | Clean reviews and honest links, starting with paddles | `/shop/court` (stage 1) |

**Principles**
1. **Answer first, radio second.** The page asks "How many waiting?" before it says anything about frequencies.
2. **Useful to people who never report.** The spot page answers "worth going?" on its own.
3. **Confirming costs less than reporting.** A later arrival taps "Still true" in three seconds.
4. **Never ship empty.** Every slot falls back to KLAX weather, the Paddle Register or last week.
5. **Reward the act, never the content.** Points never depend on what a report says.
6. **Aggregate before you expose.** No location is stored. History shows only at three or more reports.
7. **D1 is the source of truth.** KV stays off the per-report write path.

**Why now**
- The parts already exist: the Shortwave dial, town cards, Sign in with PointCast, the presence bus, D1 auth, the KLAX burn-off rule and the 92-paddle register.
- The Paddle oracle's contributor terms already say the network half waits "until field-report contributors have payout addresses." Field Reports is the step that was designed for.
- Nobody we found publishes live court waits as reusable data. [Pickleheads](https://news.joinpickleheads.com/p/chat-players-courts-follow) runs court chats, [PlayTime Scheduler](https://playtimescheduler.com/user-guide.php) runs RSVPs, and [PickleCheck](https://www.picklecheck.com/) runs check-ins.
- Mike already has a Friday-morning court crew. That is the smallest network that can stand on its own ([Lenny's Newsletter](https://www.lennysnewsletter.com/p/atomic-network)).

**Names and URLs.** The product is Field Reports, and the act is "going on the air." The short URL you say out loud at the fence is `pointcast.xyz/r`. Each spot gets a deep link like `pointcast.xyz/r/courts`, and `pointcast.xyz/court` goes straight to the home courts. The edition lives at `/morning`. Code uses an `air_` prefix, because `/field` and `/api/field` already exist: that product is a consent receipt and rejects observation content by design.

## The Friday court moment

On Friday, October 2, five friends at the courts each tap one answer. When the third phone lands, every phone plays the same crew reveal, and on Saturday morning their names are in the paper.

**Thursday night.** Mike posts on Shortwave: "Court Call, Friday 7:30 at Rec Park. Bring your phone." The front-door dial shows a COURT CALL marker at 7.500 MHz.

1. **7:36:00. Mike opens the day.** At the fence he opens `pointcast.xyz/r/courts?c=<code>` and taps **1–4**. His stamp slams down with a "First light" line. The dial shows one blip at 7.500.
2. **7:37:30. The ask.** Mike texts the link to the group chat. It unfurls as a card: "Rec Park courts · 1–4 waiting · 1 reporter · 7:36." He says, "Open it. Tap how many are waiting."
3. **0.0–1.0 s. Load.** Jen's page loads in under a second on LTE. The header reads "Rec Park courts · Fri 7:38." A strip on top asks "Still 1–4 waiting?" with **Yes** and **Changed**.
4. **1.0–2.5 s. One tap.** Jen taps **Yes**. The button snaps to solid ink in 120 ms. Her Android phone buzzes 30-40-30 ms. iPhones get sound only.
5. **2.5–3.7 s. On the air.** A receipt line prints in mono: `07:38 · REC PARK · 1–4 WAITING · ON THE AIR`. A static blip plays and a small needle swings to 7.500. A red stamp slams down: `REC PARK · FRI 02 OCT 2026`.
6. **3.7–5.0 s. The count.** Under the stamp it reads "2 agree", with two rows: `@mike 1–4` and `Guest 4471 still true`. Points read "+3". A quiet link says "Sign in to keep your stamp."
7. **7:39:10. The third tap.** Sam taps **1–4**. The server sees three different phones on site within 30 minutes and marks the crew.
8. **Within 5 s. Crew reveal on every phone.** Each open page hears it by push or on its next 5-second poll. Tally bars count up over 600 ms and three small stamps ring in. A MORNING CREW stamp slams on top with a three-note chord and confetti. A phone that was locked plays the reveal once when it reopens.
9. **7:39:15. The town hears it.** The front-door blip updates to "On the air from Rec Park courts: 1–4 waiting · 3 agree." It is one post per spot per window, updated in place, so the feed never gets six copies. Open PointCast pages show a toast.
10. **7:41. Five in.** Two more friends tap. Each gets a stamp and sees "5 agree." Nobody made an account.
11. **9:15. A late arrival.** A friend of Jen's opens the forwarded link. The 7:41 reading has expired, so it shows grey as "Last report 7:41: 1–4 waiting." She taps **5+** and the reading becomes "5+ waiting · 1 reporter."
12. **Saturday, 6:45 AM. The byline.** Morning Edition No. 1 freezes with this line: "Yesterday 7:41: 1–4 waiting, 5 agree — @mike, Guest 4471, @sam +2." Each reporter named earns the BYLINE badge.
13. **Next Friday, 7:05 AM. The return.** Jen opens `/r/courts` before she leaves home. It reads "Last Friday 7:41: 1–4 waiting, 5 agree. Court Call 7:30."

**What each friend leaves with:** a stamp (two if they were in the crew), a link that unfurls with the live reading, a line in Saturday's edition, and a reason to check before next Friday.

## What others learned

The products that keep people contributing make each report useful within the hour. They make confirming cheaper than reporting, and they tie status to places, not to volume.

| Product | Mechanic | What worked | What to take |
|---|---|---|---|
| GasBuddy | 200 points per price report; points buy tickets in a $100 gas-card draw ([GasBuddy](https://www.gasbuddy.com/prizegiveaway/winners)) | A lottery ticket feels exciting at low cost | Fixed, published points. No draw until we have official rules. |
| Waze | Fixed points: report 6, one-tap "There / Not there" 2; ranks relative to your area, recalculated monthly ([SlashGear](https://www.slashgear.com/2235547/waze-points-explained/), [Waze wiki](https://www.waze.com/wiki/USA/Your_Rank_and_Points)) | Confirming is cheap, and the data helps the reporter's own drive | A confirm strip before the report; decay per kind |
| StreetComplete | One simple question per place, answered on site; stars and achievements, no prominent leaderboard ([FAQ](https://wiki.openstreetmap.org/wiki/StreetComplete/FAQ)) | Tiny tasks; its FAQ warns that competition makes people sloppy | One question per spot, "Can't say" always allowed, personal rank only |
| Swarm / Foursquare | Mayorships over a rolling 30 days, one check-in per day ([TechCrunch](https://techcrunch.com/2015/06/22/swarm-brings-back-mayorships/)) | Place-bound status | Check-ins that told nobody anything churned ([Wikipedia](https://en.wikipedia.org/wiki/Foursquare_City_Guide)). Every check-in here is an answer. |
| Untappd | Venue badges level up with check-ins at 5 different venues ([Untappd](https://untappd.com/blog/post/59586869893/venue-badge-leveling)) | Rewards exploring, not farming | Distinct-spot badges |
| Premise | Location checks, image checks and ML anti-spoofing ([Premise](https://premise.com/how-premise-works/)) | Quality control at scale | A presence code and soft flags, not a hard GPS gate |
| Citizen | Moderators review user video before alerts (search snippets only) | Trust comes from an editor desk | Numbers fill templates; free text never becomes a headline |
| Nextdoor | Legal name and address; invites from verified neighbors ([Wikipedia](https://en.wikipedia.org/wiki/Nextdoor)) | Trust from identity, at a high moderation cost | Too heavy for us. Use town cards and optional sign-in. |
| Surfline | Pay-per-call reports in 1985, then paid spotters and 500+ cams, no crowd reports ([Wikipedia](https://en.wikipedia.org/wiki/Surfline)) | Checking before you go became a habit | Pair crowd fog reports with KLAX ASOS; a crowd alone is not enough |
| Duolingo | 7-day-streak learners are 3.6x more likely to finish; streak freezes help ([Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)) | Loss aversion after week one | Weekly streaks, because courts are weekly |
| NPS Passport | Ink cancellation with the park name and date, stamped only on site ([NPS](https://www.nps.gov/thingstodo/passport-stamp.htm)) | Proof you were there, and collectible | The stamp is the receipt |
| Jackbox | Players join on their phones with a room code, no app ([Wikipedia](https://en.wikipedia.org/wiki/Jackbox_Games)) | Group play with nothing to install | A link and a code, no account |
| Ingress | 15M portals submitted, 5M accepted, later used as PokéStops ([Wikipedia](https://en.wikipedia.org/wiki/Ingress_(video_game))) | Play data became infrastructure | One record, many readers |
| Strava | Its heatmap exposed military bases; now routes stay hidden until enough people use them ([Engadget](https://www.engadget.com/2018-03-13-after-exposing-secret-military-bases-strava-restricts-data-visi.html)) | Privacy thresholds | Aggregate at 3+; no public history for any one person |
| Axios Local | 5–6 short items per weekday issue ([Simon Owens](https://simonowens.substack.com/p/how-axios-local-is-leveraging-ai)) | Same shape every morning | Seven fixed slots at 6:45 |
| Morning Brew | Referral rewards at 3, 5, 25 and 100 referrals ([GrowSurf](https://growsurf.com/blog/how-morning-brew-grew-its-subscribers/)) | About 30% of subscribers came from referrals (secondary source) | Later: referral stamps |
| Supertake | Invite-only "takes": themed portfolios with a plain-language thesis, a "what would change my mind" line and a public record since each take began ([Supertake](https://supertake.com/)) | A record you can check beats a points total | Reporter standing = how often others confirmed you. Later: "takes" on what happens next, scored by the oracles. |
| Consumer Reports | Buys products anonymously; no free samples, no ads ([CR](https://www.consumerreports.org/about-us/what-we-do/research-testing/)) | Trust comes from the method | A public method page for the Shop |

**Five lessons we take**
1. A contribution must help someone within the hour. "Worth going?" is the product.
2. Confirming must cost less than reporting. It is also our anti-spam layer.
3. Tie status to places. Exploration badges must require different places.
4. Keep a desk between raw reports and headlines. Report numbers fill templates, and free text never does.
5. Store once, read everywhere. Waze shares one dataset with 450+ governments ([Wikipedia](https://en.wikipedia.org/wiki/Waze)).

## The game layer

The game rewards showing up and telling the truth. You get stamps you keep and points that are only a score. There is no cash.

**Check-ins.** A report is the check-in, so there is no separate check-in button. A confirmation also counts as being there.

**Streaks are weekly.** A week (Monday to Sunday, LA time) counts if you file one on-site report or confirmation. The page shows "3 weeks running." Courts are a weekly habit, and a daily streak would break for normal people. Duolingo found that some slack keeps people going longer ([Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)). One freeze per month ships after the MVP.

**Stamps.** Every on-site report earns a place stamp with the spot name and date, like an NPS passport cancellation ([NPS](https://www.nps.gov/thingstodo/passport-stamp.htm)). Stamps never reset. They are what later mints on Tezos. Three field stamps join the existing `/passport` list instead of a second passport.

**Badges**

| Badge | Earn rule | Why | Ships |
|---|---|---|---|
| First Light | First on-site report of the day at a spot | Breaking the silence is the most valuable report | MVP |
| Morning Crew | 3+ phones report or confirm on site at one spot within 30 minutes; all of them earn it | The group act gets a group payoff | MVP |
| Still True | Give 10 on-site confirmations | Confirming is the cheap act that makes data trustworthy | MVP |
| Byline | A report of yours runs in a frozen Morning Edition | Ties the game to the paper | PR 2 |
| Called It | Someone else confirms 5 of your reports | Rewards accuracy, not volume | Week 3 |
| Three Fridays | On site at the same spot 3 Fridays in a row | The court habit, made visible | Week 3 |
| Fog Eye | Beach reports on 5 different mornings | Seeds the second spot | Week 3 |
| Dead Air | First report at a spot that was silent for 48+ hours | Revives quiet spots | Week 3 |
| Sunset Shift | An on-site report after 5 PM | Spreads data beyond Friday morning | Week 3 |
| Band Sweep | Reports at 3 different spots | Explore town, don't farm one spot | When spot 3 ships |
| Price Tag | 3 confirmed price reports | Feeds the Shop's price line | With price reports |
| Regular | Most report-days at a spot over a rolling 30 days, one per day; opt-in title | Place-bound status, like Swarm's mayor | Later, opt-in |

**Points**

| Action | Points | Rule |
|---|---|---|
| On-site report | 6 | One per spot per kind per decay window |
| First Light bonus | +4 | Once per spot per day |
| On-site confirmation | 3 | Not your own report; one per report |
| "Can't say" | 1 | An honest non-answer is worth something |
| Byline | 10 | Awarded when the edition freezes |
| Remote report (no spot code) | 0 | Shown grey, never counted |

The daily cap is 30 points per person. Points never depend on the answer, so "0 waiting" and "5+" pay the same.

**What points do now.** Points are a score, not a currency. They show on your card and set your personal rank in town. There is no leaderboard, following StreetComplete ([FAQ](https://wiki.openstreetmap.org/wiki/StreetComplete/FAQ)). There is no prize draw either, because a draw is a sweepstakes and needs official rules first. Every edition carries this line: "Reporters earn points, never cash, and never for what a report says." The FTC allows incentives that don't depend on sentiment, as long as they are disclosed ([FTC Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)).

**Anonymous or signed in.** Anyone can report without an account. Anonymous reports show as "Guest 4471", and their stamps stay on that phone. Signing in with PointCast within 24 hours moves the stamps and points to your town card and @handle.

**Anti-spam**
- **Presence code.** The link carries a spot code (`?c=<code>`, never written in the repo). A report or confirmation without it is "remote": shown grey, worth 0, and never counted for agreement, the crew or the edition.
- **One per phone.** A phone gets one report per spot per 30-minute slot, enforced by a D1 unique index. A second tap replaces your own answer and earns nothing.
- **IP is only a ceiling.** Friends at the courts share an IP, so the IP limit is a burst cap: 40 writes per 10 minutes per hashed IP.
- **No self-confirming.** You cannot confirm your own report.
- **Soft penalties.** Like Niantic's three strikes ([Niantic](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/39-three-strike-discipline-policy/)), the steps are a quiet down-rank, then a pause, then removal. Flags come from bursts and impossible travel.
- **Fresh only.** Observations older than 15 minutes are rejected. Reports queued offline resend inside that window.
- **No GPS in the MVP.** A location prompt would kill the five seconds.

**No cash now, chain later.** Stamps mint as soulbound Tezos tokens after the kill test passes. The data dividend comes once the oracle kit can credit reporters per answer. The last section lays out that path.

## One observation, many uses

Each report is written once to D1. The dial, the spot page, the Morning Edition and MCP read it now, and the Shop and oracles read it later.

**The record** (`air_reports` in D1 `AUTH_DB`)

| Field | Example | Why |
|---|---|---|
| `id` | `ar_7f3c9a…` | Stable id for feeds, bylines and audit |
| `spot` | `courts` | Key into `src/data/air-spots.json` |
| `kind` | `wait` | One question per spot per kind |
| `value` | `1-4` | A frozen bucket from validator v1; buckets never change silently |
| `extras_json` | `["wind"]` | Optional details from a fixed list, never free text |
| `schema_v` | `1` | Lets the edition and oracles read old rows safely |
| `observed_at` | `1790951880000` | Server time, or a queued time under 15 minutes old |
| `day`, `slot` | `2026-10-02`, 30-minute slot | LA day for streaks; slot for the one-per-phone rule |
| `pid_hash` | 16 hex chars | sha256 of the phone's random id, so no account is needed |
| `ip_hash` | 16 hex chars | Salted by day, so today cannot be linked to yesterday |
| `user_id`, `byline` | `@jen` or `Guest 4471` | Byline comes from the town card, never from the request |
| `onsite` | `1` | The report carried the spot code |
| `status` | `ok`, `flagged`, `removed` | Soft moderation that keeps history |
| `source` | `page` or `agent:cc` | Agents file the same record, never on site, and always with a source URL |

Confirmations live in `air_confirms`: the report, the phone, a verdict (still, changed or can't say), the on-site flag and the time.

**Freshness**

| Kind | Spot | Decay | After decay |
|---|---|---|---|
| `wait` | Rec Park courts | 45 min | Grey line: "Last report 7:41: 1–4 waiting" |
| `fog` | Grand Ave beach | 120 min | Same, plus the KLAX verdict |
| `price` (later) | Local shops | 7 days | "Seen $X, 5 days ago" |
| `swap` (later) | Courts | 7 days | Listing expires |

Signal bars = ceil(5 × (1 − age ÷ decay)). A courts report shows five bars for 9 minutes, then one fewer every 9 minutes.

**Agreement.** `reading(spot, kind, now)` is one pure function:
1. Take live on-site rows (inside the decay window, status `ok`), using the latest row per phone.
2. Support for a value = phones that reported it + on-site "still" confirmations on it.
3. The value with the most support wins, and ties go to the newest. "Can't say" never wins if a real answer exists.
4. The label reads "1 reporter" or "N agree". Remote rows show grey with zero support.
5. The crew fires at 3+ distinct on-site phones (reports or "still") within 30 minutes. It fires once per spot per window.
6. History such as "typical Friday 8 AM" shows only after 4+ same-weekday days. Each number shown needs 3+ reports, the Paddle Register's `MIN_SHOWN` rule. Until then the page shows the same weekday last week.

**Reputation (later).** Trust = the share of your reports that others confirmed over 90 days. It will weight support and later unlock editing spot details. The MVP stores the inputs and uses none of them.

**Where it flows**

| Reader | Reads | Rule | When |
|---|---|---|---|
| Spot page `/r/[spot]` | The reading plus today's rows | Live rows only; today's list clears at midnight | MVP |
| Front-door dial | One station post per spot per window, parked at the spot's frequency | Updated in place at 3 agree | MVP |
| Unfurl card `/og/r/[spot].png` | The reading when the link is shared | Falls back to the next Court Call | MVP |
| Morning Edition | The reading at the 6:45 cutoff, yesterday's last reading, and the same weekday last week | Single reports allowed, labeled "1 reporter" | PR 2 |
| MCP `air_latest`, `morning_edition` | The same functions | Read-only | PR 2 |
| Shop price line | `kind: price` with a register paddle id or product slug | "Seen $189 at [shop], 3 days ago, 2 reporters" next to MSRP | Stage 2 |
| Courts oracle | Agreed on-site readings only | Needs a kit change: `contributor` is fixed per spec today, with one `splits.maker` per settled cent | Later |
| Marine Layer oracle | Beach fog reports as a second witness beside KLAX ASOS | Same kit change | Later |

**Agents as reporters.** Agents keep the board from ever being empty, and a human report always outranks them.
- **Early shift (6:00 AM cron).** Deterministic readers file agent rows from free public sources: KLAX METAR burn-off (already in `burnoff.ts`), NOAA tides at Santa Monica, NDBC swell, AirNow air quality, sunrise and sunset. No LLM, so it is cheap and repeatable.
- **Night shift.** Fuzzier facts go on the existing night-shift job board (`functions/api/yard/ops.ts`, MCP `night_shift_claim` and `night_shift_submit`). Examples: open-play hours from the city rec page, current prices for the top 20 register paddles, this week's El Segundo events. Claude, Codex or Fable claim a job and submit an answer with its sources.
- **Rules.** Agent rows carry `source: agent:<name>` and a `source_url`. They show a byline like "cc read NOAA at 6:52". They never count toward agreement, the crew or points. A newer on-site human report replaces them on the board.
- **Doubt becomes a question.** When agent data is stale or disagrees with people, the agent posts a yes/no question into `/r` for the next person on site, StreetComplete style. For example: "Open play starts at 7:30, right?"
- **Prices split by where they come from.** Agents track online prices, such as register paddles and shop items. People report in-person prices, such as coffee, gas and court fees. There is no clean free gas API and we do not scrape GasBuddy, so gas stays a human job.

**The board (`/r/board`).** A grid of spots and facts: the latest value, who said it (person or agent), and signal bars that fade with age. It is the page you check before you drive to the courts. The edition, the oracles and MCP `local_snapshot` read the same rows.

## Morning Edition

The Morning Edition is one screen at 6:45 AM with seven fixed slots, and it never ships empty.

**Where and when.** The route is `/morning`, because `/today`, `/editions` and `/morning-ocean` already belong to other things. Past editions live at `/morning?d=2026-10-03`. The edition is assembled at read time, with no cron. The first request after 6:45 AM LA freezes that day's edition into D1, so the archive and its bylines never change. Before 6:45 the page shows yesterday's edition. A live strip above the edition ("Now: courts 1–4 waiting, 12 min ago") is never frozen.

**Slots**

| # | Slot | Source | Fills from reports? | Example line (Sat 3 Oct) |
|---|---|---|---|---|
| 1 | Sky · 6.100 | KLAX ASOS burn-off rule (`previewMarine`, `src/lib/burnoff.ts`), plus the newest beach report | Yes, as a second witness | "Marine layer at dawn; burn-off call 10:40 AM. At the beach 6:31: can't see the pier — @jen." |
| 2 | Courts · 7.500 | Yesterday's last reading, the same weekday last week, and the next Court Call | Yes, with bylines | "Yesterday 7:41: 1–4 waiting, 5 agree — @mike, Guest 4471, @sam +2. Court Call Friday 7:30." |
| 3 | A price | Paddle calendar and register; later a confirmed price report | Later | "Gearbox Pressure X ships Oct 1 at $279.99 MSRP. From the register, no link." |
| 4 | Today in town | `front-door-news.json` items under 7 days old, then the newest Shortwave line not by Mike, then the almanac | No | "On Shortwave at 8:12 PM: 'Lights out on court 4.' — Guest 2210" |
| 5 | Daily ritual | The Nightly Net (`NET` in `src/lib/band.ts`), Still Hour, or the day's drum | No | "The Nightly Net, 9:00 PM on 7.200." |
| 6 | One pick | The daily block from `/today.json` (`pickDailyBlock`), or the newest review on review days | No | "Block 0612, Drum Party: five phones, one kit." |
| 7 | Shop | One item through `outboundCheckout()`, with its disclosure beside the link | Later (local prices, swap) | "Coming Oct 5: RPM Jade, $269.99 MSRP. No link, no commission." |

`front-door-news.json` was last dated September 4, which is why slot 4 needs its fallback chain.

**Masthead and footer.** The masthead reads `MORNING EDITION · No. 1 · SAT 3 OCT 2026 · 6:45 AM`. A reporter line, "On the air yesterday: @mike, @sam, Guest 4471 +2", is hidden when nobody reported. The footer carries the points line and the shop disclosure.

**Slot rules**
- Every slot has a chain of sources. The last link is a static file or a template, so it cannot fail.
- Report numbers fill templates. Free text never becomes headline copy.
- Each slot records `fallback: true` in the JSON when it used a fallback.
- If KLAX fails at freeze time, the edition serves as provisional and retries. It never freezes with a hole.

**Feeds**

| Format | Route | Ships |
|---|---|---|
| Page | `/morning` | PR 2 |
| JSON Feed 1.1 | `/morning.json`, `application/feed+json`, last 7 editions, stable ids like `morning:2026-10-03` ([JSON Feed](https://www.jsonfeed.org/version/1.1/)) | PR 2 |
| MCP | `morning_edition({date?})` and `air_latest({spot})` in `functions/api/mcp.ts` | PR 2 |
| Daily round | A "Read the Morning Edition" round in `/api/today` | PR 2 |
| RSS | `/morning.xml` | Week 3 |
| Email | Daily at 6:45 once `SEND_EMAIL` is bound | Later |
| Weekly block | A READ block on ESC that sums up the week's reports | Later, Mike's call |

**Why this shape.** Local dailies keep the slots fixed and the items few, and the habit comes from the same shape at the same time ([Axios Local](https://simonowens.substack.com/p/how-axios-local-is-leveraging-ai)). Conditions apps win because people check them before going ([Surfline](https://apps.apple.com/us/app/surfline-wave-surf-reports/id393782096)). The edition is also the return reason least likely to fail: it works on days with zero reports.

## Shop

The Shop earns trust first and money second. It runs on honest reviews, and every paid link says it is paid, right next to the link.

**The promise we keep.** The Paddle Register says it "carries no affiliate links and no discount codes," and the patron pass is sold on that promise. The register stays affiliate-free. Paid links live only on review pages and in a court lane of the Shop. We announce the change on `/paddles/changes` before the first paid link goes live.

**Stages**

| Stage | What | Where | Gate |
|---|---|---|---|
| 1. Paddle reviews | Reviews with honest links, tied to the register by paddle id | `/reviews/paddles/[id]`, a `/shop/court` lane in the existing Shop hub, `/reviews/paddles/method` | A program approves us. No paid link goes live before that. |
| 2. Local El Segundo shops | Shops become spots of kind `shop`. Price reports (7-day decay) feed "seen $X here" lines. | `/shop/local` | Two shops agree to be listed, and a third report spot is proven |
| 3. Local marketplace | Extend `/paddle-exchange` (today a static page) with listings: register id, condition checklist, wear hours. Handoff is "Friday 9 AM at the courts." No fees. Listings expire in 7 days. | `/paddle-exchange` | Stage 1 is live and the Friday crew has held for 4+ weeks |

**Affiliate order**

| Program | Rate | Status |
|---|---|---|
| Selkirk via AvantLink | 15%, 30-day cookie ([Selkirk](https://www.selkirk.com/pages/selkirk-affiliate-program)) | Open. Apply first. |
| Engage via Skimlinks or FlexOffers | 10% or 8% ([AvidAffiliate](https://avidaffiliate.com/programs/engagepickleball-com/)) | Open |
| CRBN, Six Zero | Ambassador programs with commission ([CRBN](https://crbnpickleball.com/pages/crbn-ambassador-program), [UpPromote](https://uppromote.com/affiliate-programs/pickleball/)) | Apply after the first reviews |
| 11SIX24 ambassador | $15 credit or $10 cash per paddle (`docs/11six24-affiliate.md`) | Waiting on Mike's application |
| JOOLA | Not taking new affiliates ([JOOLA](https://affiliate.joola.com/)) | Skip |
| Amazon Associates | About 3%, unverified | Fallback only |

**Disclosure rules**
1. Beside every paid link: "Paid link. PointCast earns a commission if you buy." Never "affiliate" alone, and never only in a footer ([FTC Endorsement Guides](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides)).
2. Owned products say so: "Good Feels is Mike's company." This follows the owned-filings label in `PressWireStrip.astro`.
3. Ranking ignores commission. The method page lists where each paddle came from (bought or sample), hours played, test dates and each brand's rate. Consumer Reports is the model ([CR](https://www.consumerreports.org/about-us/what-we-do/research-testing/)).
4. Mike's own paddles are bylined as insider picks.
5. No points or rewards tied to what a review says, and no suppressed reviews ([FTC rule Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)).
6. Click counts stay honest. `shopping-metrics` counts outbound taps and reports `confirmedSales: null` until a network reports sales.

**Code changes.** `outboundCheckout()` in `src/lib/commerce.ts` gains `affiliate?: {program, network, rate, disclosure}`. A `PaidLink` component renders the link and its disclosure as one unit, so they cannot be separated. Reviews in `src/data/reviews.ts` gain `paddleId`, `buyUrl`, `affiliate` and `disclosure`.

**In the edition.** Slot 7 rotates. Monday is a review pick. Wednesday is a local shop with its latest price report (stage 2). Friday is a swap listing (stage 3). Until those exist, the slot shows a register paddle marked "No link, no commission." Good Feels THC items stay out of the edition, because the edition has no 21+ gate.

**Marketplace precedent.** SidelineSwap charges 12% plus 3% processing and gives an Elite Seller badge ([SidelineSwap](https://sidelineswap.com/how-it-works)). Third Shot Drop puts paddle life at about 8–12 months ([Third Shot Drop](https://www.thirdshotdrop.com/trade-up-program/)). We charge nothing and meet in person. Once wear reports pass 8 months, the owner gets a "time to swap?" nudge.

## Design direction

It should feel like a coastal radio shack's logbook drawn in PointCast's block grammar: one question, one red light, one stamp.

**Principles**
1. **BlockLayout law holds.** White, ink, Inter and JetBrains Mono, two weights, hard corners and channel colors (`BLOCKS.md`, `--pc-*` tokens in `src/layouts/BlockLayout.astro`).
2. **One added signal color: on-air red.** It means "live" and nothing else.
3. **Big targets.** Buttons are 72 px tall and full width, the question is 40 px, and everything sits in thumb reach at 375 px wide.
4. **Delight comes after the data.** The animation starts on tap and never blocks the POST.
5. **Silence stays quiet.** Never show "0 reporters" or "OFF AIR since Tuesday". Show the next Court Call and last week instead.
6. **Mechanical motion.** Things snap, print and slam. Nothing floats.

**Palette**

| Token | Hex | Use |
|---|---|---|
| `--pc-bg` | #FFFFFF | Page |
| `--pc-ink` | #12110E | Text, pressed buttons |
| `--pc-accent` | #185FA5 | Links, default Shortwave color |
| CRT court green | #3B6D11 | Courts spot and labels |
| ESC town purple | #534AB7 | Beach and town spots |
| `--air-live` | #D42A1E | Live dot, stamp ink at 85% opacity |
| `--air-receipt` | #F7F5EF | The receipt card only |
| `--air-static` | #9A9890 | Remote, expired and fading bars |

**Type.** Inter 400 and 600 for the question and prose. JetBrains Mono 400 and 600, uppercase, for frequencies, times, receipt lines and stamps. The question is 40/44 px, button labels 24 px, mono meta 13 px, and stamp text 15 px with 0.08em tracking.

**Motion**

| Event | Motion | Time | Reduced motion |
|---|---|---|---|
| Tap | Button fills with ink, scale 0.97 to 1 | 120 ms | Color change only |
| Print | Receipt line types in, stepped | 300 ms | Appears |
| Needle | Mini-dial needle springs to the station with one overshoot | 600 ms | Jumps |
| Stamp | Scale 1.4 to 1, rotate −6°, ink bleed from 1 px blur to sharp | 120 ms + 80 ms | 150 ms fade |
| Agree | The count rolls to the new number | 200 ms | Swaps |
| Crew | Bars count up, 3 stamps ring in with a 120 ms stagger, MORNING CREW slams, confetti | About 2 s | Fade, no confetti |

**Sound.** The tap reuses the hero's WebAudio bandpass static blip. The stamp adds a low 90 Hz thump, and the crew gets a three-note chord. Sound plays only after a tap, as autoplay rules require. The phone remembers a mute toggle.

**Haptics.** Taps call `navigator.vibrate([30,40,30])`, and the crew calls `[40,60,40,60,120]`. That works in Chrome on Android. iOS Safari has no Vibration API ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate), [caniuse](https://caniuse.com/vibration)), so sound carries the moment on iPhone.

**Confetti.** Reuse `.confetti-overlay` and `.confetti-particle` from `BirthdayCelebrate.astro`. The alternative is canvas-confetti with `disableForReducedMotion` ([canvas-confetti](https://www.github.com/catdad/canvas-confetti)).

**Copy voice.** Plain and short, radio second. "How many waiting?" not "Key up." "On the air" appears only after the tap.

A mood board page accompanies this PRD. It holds the palette, type, motion, references and three screen sketches.

## MVP and the road after

Ship Field Reports for two spots before Friday, October 2. Ship the Morning Edition in time for Saturday's first bylines. Then let four Fridays decide the rest.

**Scope**

| In the MVP | Out, and when |
|---|---|
| Two spots: Rec Park courts (wait) and Grand Ave beach (fog) | Price, shop and swap spots (Shop stages 2–3) |
| One question, confirm strip first, "Can't say" always | Three chip rows; free-text notes |
| Receipt, stamp slam, and a crew reveal at 3 that replays on reopen | Hold-to-transmit, call signs, VU meter |
| D1 tables with a one-per-phone unique index | KV hot docs |
| Station posts parked on the dial, plus a Court Call marker | Per-report OG images (a per-spot card instead) |
| Per-spot unfurl card `/og/r/[spot].png` | GPS, photos, a service worker (a localStorage queue instead) |
| Points, a weekly streak and 3 badges | Draw, ranks, Regular title, trust tiers, freezes |
| Three stamps appended to `/passport` | A second passport |
| PR 2: `/morning`, `/morning.json`, MCP read tools, a today round, BYLINE | `/morning.xml` (week 3); email (when `SEND_EMAIL` is bound) |
| — | MCP submit, per-report oracle credit, Tezos mints, all paid links |

**Build plan**
1. **Mon Sep 28.** Mike answers open questions 1–4. Check the next free migration number on origin/main.
2. **Tue Sep 29.** Migration `0023_air.sql`, plus pure modules `air-kinds.mjs`, `air-reading.mjs` and `air-points.mjs` with node tests.
3. **Wed Sep 30.** The `/api/air` endpoints, station posts on the dial and the Court Call marker.
4. **Thu Oct 1.** The `/r/[spot]` page, animations, unfurl card and passport stamps. Merge and deploy PR 1. Mike files test reports at both spots.
5. **Fri Oct 2, 7:30 AM.** The first Court Call. Watch D1 live.
6. **Fri Oct 2, 6 PM.** Merge PR 2: `/morning`, `/morning.json`, MCP tools, the today round and BYLINE.
7. **Sat Oct 3, 6:45 AM.** Edition No. 1 freezes with Friday's bylines.
8. **Week of Oct 5.** PR 3: the Shop disclosure component and review fields, with no live paid links. Apply to Selkirk.
9. **Fri Oct 23.** Run the kill test.

**The loop after PR 2.** Each item is one PR, built and deployed in order, with the kill test deciding how far the game layer goes.

| PR | Ships | Why it is next |
|---|---|---|
| 1 | `/r`, `/r/[spot]`, `/court`, D1 tables, stamps, crew reveal, dial posts, unfurl card | The Friday court moment |
| 2 | `/morning`, `/morning.json`, MCP read tools, today round, BYLINE | The daily return reason |
| 3 | Early-shift agents (tides, swell, AQI, sun) and the `/r/board` dashboard | The board is never empty |
| 4 | Night-shift jobs and agent-to-human questions | Agents fill the fuzzy facts; people confirm |
| 5 | Shop: `PaidLink`, review fields, method page, the `/shop/court` lane | Clean reviews before any paid link |
| 6 | Takes: predictions scored by oracles and later reports, plus "yesterday's best take" in the edition | A cheap daily game on data we already have |
| 7 | Local shops as spots, with in-person price reports | Shop stage 2 |
| 8 | Season stamps on Tezos | Chain stage B, after the kill test |

**Metrics**

| Metric | Target | Read on |
|---|---|---|
| Reporters on Oct 2 | 5+ phones at the courts, and the crew fires | Oct 2 |
| Tap to stamp | Median under 1.5 s on LTE, with zero lost reports | Oct 2 |
| Kill test: non-Friday reports from people other than Mike | 10+ reports from 3+ people over 4 weeks. Zero means stop the game layer and keep the edition. | Oct 23 |
| Return | 30% of Oct 2 phones open `/r` or `/morning` again within 7 days | Oct 9 |
| Confirm ratio | 1 confirmation per 2 reports | Weekly |
| Claim rate | 25% of anonymous reporters sign in to keep their stamps | Oct 23 |
| Edition health | Zero empty slots, and every day frozen | Weekly |
| Front-door freshness | A post not by Mike on the dial 4 days out of 7 | By Oct 31 |
| Edition readers | 15 distinct daily readers | By Oct 31 |

**Risks**

| Risk | Mitigation |
|---|---|
| A crowd of one: most days nobody reports | The Court Call marker, the last-week fallback, an edition that works with zero reports, and the kill test |
| Silence reads as an abandoned town | Hide zero counts. Show the next Court Call and last week. |
| Radio jargon confuses people at the fence | Question first; radio words only in small mono |
| Phones sleep between games, so the reveal plays to nobody | The crew is decided on the server and replays when a phone reopens |
| Friends share one IP and block each other | Per-phone unique index; IP only as a ceiling |
| Couch spam through a forwarded link | Remote rows count zero; codes live in D1 and can rotate without a deploy; soft penalties |
| Weak signal at the courts | Optimistic UI and a localStorage queue that resends within 15 minutes |
| The KV write cap | Everything goes to D1. KV takes at most 2 writes per spot per window, for the station post. |
| A regular's routine becomes public | No location stored, no public history per person, today's rows clear at midnight, a "report as Guest" toggle |
| Breaking the Paddle Register's no-affiliate promise | Paid links only on review pages and `/shop/court`, announced in the changelog first |
| Parallel agents take migration 0023 (0019 is already doubled) | Check origin/main before the PR, and renumber if needed |
| Game tone clashes with the quiet rooms (Still Hour says no streak, no score) | The game lives only on `/r` surfaces |

**Chain and points path**

| Stage | What | Gate |
|---|---|---|
| A (now) | Stamps and points in D1. Points are never redeemable. | None |
| B | Season stamps mint as soulbound Tezos tokens to opted-in Kukai addresses. One per spot per season, confirmed on-site stamps only. The house pays gas, and receipts go in `seal_receipts`. | The kill test passes; Mike picks the season and contract |
| C | Data dividend: a courts oracle. The oracle kit accepts per-answer contributors and splits each cent across the reporters in the reading. Payout addresses come from linked wallets. | `X402_RECEIPT_SK` is set and the kit change is reviewed |
| D | Points stay a score. Any prize needs official sweepstakes rules. Any token for points needs its own review. | Mike's call |

**Open questions for Mike**
1. Which courts are they ("Rec Park" is a placeholder until you confirm), and what is the right public name? Is Friday 7:30 AM right for Court Call?
2. Is the second spot the beach at Grand Ave, with the question "Can you see the pier?"
3. Should signed-in bylines default to @handle or to Guest?
4. Should we ask Parks & Rec about a fence QR code, or stick to Mike's phone and texted links?
5. Where does `/morning` sit on the front door? Does `/today` link to it or absorb it?
6. Should the Shop lane be `/shop/court` inside the Good Feels hub, or a separate surface?
7. Do we apply to Selkirk through AvantLink now? Where does the 11SIX24 application stand?
8. Should Good Feels items ever appear in the edition's shop slot?
9. Should we publish the points price list while there is nothing to spend points on?
10. Do you want a weekly ESC READ block of reports, or should reports stay out of the blocks collection?
