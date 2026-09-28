# Field Reports — badges, check-ins and mayors (people + agents)

2026-09-28. Research (Foursquare/Swarm/Strava/Untappd/Pokémon GO) → Fable design → critic revision. The FINAL system is the critic's revision at the end.

## Research

Research note: Foursquare and Swarm game design, with lessons for PointCast Field Reports (humans and agents)

## Foursquare, 2009–2014

**Check-ins and points.** Every check-in earned a score, and there were "over 100 bonuses" on top. Examples: being first among your friends to check in somewhere, checking in with a friend, a first visit to a venue, or becoming mayor. The points bought nothing. They drove a leaderboard among friends and bragging rights. Version 8.0 (the 2014 split) retired points and leaderboards. I couldn't find exact point values in a page that would open.

**Badges.** These were the working categories. They are informal groupings; Foursquare never published an official taxonomy.
- **Starter / milestone.** Newbie (1st check-in; 98.59% of users unlocked it), Adventurer (10 check-ins), Explorer, Superstar, Super User.
- **Behavior / secret-ish.** Local, Crunked (4+ venues in one night), School Night (check in after 3 AM on a weeknight), Photogenic, "I'm on a boat," Gym Rat. Staff kept many unlock rules secret, and people hunting for them was part of the fun.
- **Partner / sponsored and city badges.** Bravo, History Channel and others, plus city-only badges. HuffPost's 2010 "ultimate guide" left partner badges out as "relatively unimportant," which was an early sign that sponsored badges carried little status.
- **Tasks.** From September 2010 you could also earn badges by "completing tasks," not only by checking in.
- **Expertise levels (announced Nov 14, 2011).** Category badges (Fresh Brew, Wino, Warhol, Hot Tamale, Bento and others) could be leveled up to 10 times. Level 1 took 3 unique venues in the category, or 5 check-ins at one venue. Each level after that took 5 more *unique* venues. Foursquare said the goal was to "reward users for higher degrees of exploration" so that "trophy cases mirror their real life expertise." Gym Rat was pointedly left out of expertise, because going to the same gym again is not exploring.

**Superusers.** There were ten levels. You had to apply and pass quality and quantity tests. Only Superusers could edit venue data. This was status earned by maintaining the map, and it was separate from the game.

**Mayors.**
- **Rule.** Most *distinct days* with a check-in over the last 60 days, and only one check-in per day counted. From Aug 26, 2010 the app showed "N days away from mayor" to push "prolonged loyalty" over volume.
- **Eligibility.** Mayors needed a profile photo. Venue managers and employees were barred from being mayor of their own venue.
- **Specials.** More than 750,000 businesses ran Specials. Starbucks (May 2010) gave the mayor of each store a one-time $1 off a Frappuccino. In return Starbucks got stats from Foursquare: most-active users, check-in times, and share rates.
- **Cheating.** Couch check-ins "stealing mayorships" only mattered once mayors got real rewards. The April 2010 "cheater code" used GPS to verify location. You could still check in from anywhere, but unverified check-ins got no points, badges, mayorships or specials, and there was an appeal path. Foursquare chose this over Gowalla's hard location blocks, which frustrated real users when indoor GPS failed. By August 2010 every mayor had passed the check.

**Why it broke.** Foursquare's own words: "as our community grew from 50,000 people to over 50,000,000 today, our game mechanics started to break down." Mayorships in dense places became impossible for normal users to win. Rewards cut loose from any real use started to feel hollow and spammy, as check-ins made just to collect badges.

## Swarm, 2014 to now

A correction to the brief: the order was the reverse of "2015 return among friends."
- **May 2014, Swarm launch.** Badges were replaced by stickers. Global mayors were frozen. Mayorships became **friends-only**: the friend who had been there most lately got a crown sticker, so one venue could have many mayors. Coverage called this "less sticky," and users pushed back hard.
- **May 2015, Swarm 2.3.** About 70 collectible stickers, growing to 100, unlocked by checking in across a *category* (Mona replaced Warhol). A "Transmuter" converted old badges into stickers. Dennis Crowley (founder): "One of his biggest gripes about badges was that you couldn't do anything with them." Stickers could be posted on check-ins, stamped on photos and sent in messages.
- **June 2015.** **Global** mayorships came back on a 30-day rolling window, one check-in per day, with progress bars toward taking the crown. Friend-only mayorships were removed.
- **Aug 2015, Swarm 3.0.** Coins: 1 to 10+ per check-in, weighted by how often you've been there, who you're with, whether you're mayor, and how rare the check-in is. A friends-only leaderboard reset every Monday morning, but the coin balance carried over. At first coins bought nothing; later they could upgrade stickers.
- **Later.** Swarm 5.0 (2017) moved toward lifelogging: lifetime check-in counts and unique categories visited. On Oct 21, 2024 Foursquare announced it was ending the City Guide app (dead Dec 15, 2024) to put its effort into Swarm, after laying off more than 100 people. Crowley said he was "in a real funk" over it. In 2025 Swarm shipped offline check-ins, tips with upvotes, a smarter venue picker and a Discovery tab. I found no public user numbers.

**The data business.** More than 11 billion check-ins over eight years trained Pilgrim (SDK in 2017). It builds a "probabilistic signal cloud" of what shape a place really is: a coffee shop's footprint grows from 7 to 11 AM. Places data served Apple, Snapchat, Twitter, Airbnb and over 100,000 developers. The game was how the data got collected, and the data turned into the company's business.

## Modern analogs

- **Strava Local Legends.** Most efforts on a segment in a rolling 90 days, not the fastest, so "show up to move up." It gives a laurel crown. Only public activities count, you can opt out, and multiple efforts in one day all count. This is the mayor idea rebuilt for people who will never be fastest.
- **Untappd.** Badges come in four kinds: beer (style, country, count, consecutive check-ins), venue, local business-promo, and special (holidays and promotions). It shows sponsored and venue badges can coexist with badges for knowing your subject.
- **Pokémon GO gyms.** Territory you hold. You earn 1 coin per 10 minutes defended, capped at **50 per day** and paid only when your Pokémon is knocked out. Defenders lose "motivation" over time unless teammates feed them berries. The daily cap and the decay stop anyone holding a gym forever.

## Lessons for PointCast

1. **Count days, not reports.** Regular (one per day, rolling 30) matches Swarm 2015 exactly, and a "days away from Regular" line is the proven nudge. Keep the rolling window at 30 days, or 60 for low-traffic spots. Strava's 90 is for places people visit rarely.
2. **Keep the report, withhold the reward.** The cheater code is PointCast's grey remote row: the post stays, it earns no stamp, points or crown, and there's an appeal path. Don't hard-block like Gowalla did.
3. **Cheating follows money.** Couch check-ins only started once mayors got discounts. Keep Regular a title with no business perks until spot codes are hard to fake. A Starbucks-style perk is exactly what brings out the spoofers.
4. **Mayors break at scale; El Segundo is the right size.** Crowns tied to one place in a small town are winnable. Friends-only crowns felt less sticky and were rolled back. Keep Regular open to the whole town but tied to one spot, and opt-in.
5. **Reward exploring, with levels.** Expertise levels (3 unique, then +5 unique) are Band Sweep and Fog Eye with a ladder. Excluding Gym Rat is the precedent for keeping "same spot again" (Three Fridays) separate from "new spots."
6. **Badges need a use.** Crowley's complaint maps to stamps you can show on the dial, on the town card, in the Byline and on Tezos. Sticker-style "stamp this onto your report" is cheap and proven.
7. **Points that buy nothing is fine if the page says so.** Swarm coins sat unspent for months and people still played on the weekly Monday reset. "Points never cash" and the Monday-to-Sunday weekly streak are consistent with that. Skip the public leaderboard, as the PRD does.
8. **Partner badges are low status.** If the Shop ever sponsors a stamp, label it clearly and keep it out of the rarity score.
9. **The game is how the data gets collected.** 11 billion check-ins became Pilgrim. Field-report rows with `schema_v`, freshness decay and agreement are the oracle product, so design stamps to reward *confirmed accuracy* (Called It, Still True), because that's what makes the data worth buying.
10. **Cap and decay held positions.** A Pokémon-style daily cap (30 points) is already in the PRD. Add slow decay to Regular so a crown needs attendance to keep, not one heavy week.

## Lessons for agents

1. **Superusers are the model for agents, not mayors.** Agents fill the Superuser role: maintainers with levels earned by passing quality checks. Give them a separate ledger ("Shift Log") and never Regular, crew or human points.
2. **Agent badges for accuracy and reliability, confirmed by humans.**
   - *Clockwork*: the 6 AM early shift filed on time N days running.
   - *Checked*: humans on site confirmed N agent rows as "still true."
   - *Overruled*: a human report beat the agent row, logged as a trait, not a penalty.
   - *Source Chain*: 100 rows, each with a source URL that still resolves.

   These feed a per-agent reliability score in the jack.art-style rating.
3. **Night-shift jobs are Foursquare's task badges.** A claimed job (open-play hours, paddle prices) earns an agent stamp only after a human confirms it. That flips the ask so agents ask people questions, which suits the PRD's PR 4.
4. **Agent rows sit under the cheater-code rule by design.** Never on site, so never rewarded as presence. They carry value only through agreement with humans and never outrank a human on-site report.
5. **Show the agent stamp books publicly** (cc, Sol/Terra/Luna, Manus, Frog/Noun 779) so they read as bylines in the town, not background feeds.

## Sources
- https://en.wikipedia.org/wiki/Foursquare_City_Guide
- https://en.wikipedia.org/wiki/Swarm_(app)
- https://venturebeat.com/social/foursquare-leveling-up-expertise-badges/
- https://www.huffpost.com/entry/foursquare-badges_n_542985
- http://www.chriscredendino.com/2010/04/29/how-mayorships-are-awarded-on-foursquare/
- https://techcrunch.com/?p=212634
- https://thenextweb.com/news/foursquare-releases-cheater-code-stop-people-checking
- https://techcrunch.com/2010/04/07/foursquare-starts-to-enforce-the-rules-cracks-down-on-fake-check-ins/
- https://venturebeat.com/mobile/foursquares-new-swarm-app-means-the-death-of-badges-mayors
- https://techcrunch.com/2015/05/04/swarm-2-3-feels-like-the-old-foursquare-looks-way-better/
- https://thenextweb.com/news/foursquare-finally-relents-mayorships-are-coming-back-in-swarm
- https://techcrunch.com/2015/06/22/swarm-brings-back-mayorships/
- https://techcrunch.com/2015/08/20/swarm-gets-back-into-the-game-with-leaderboards/
- https://centrical.com/resources/what-foursquares-evolution-can-teach-us-about-enterprise-gamification/
- https://techcrunch.com/2017/03/01/foursquare-launches-pilgrim-sdk-to-let-developers-leverage-location/
- https://www.engadget.com/social-media/foursquare-is-killing-its-city-guide-app-to-focus-on-the-check-in-app-swarm-191054153.html
- https://support.strava.com/hc/en-us/articles/360043099552-Local-Legends
- https://en.wikipedia.org/wiki/Untappd
- https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/3052-why-didn-t-i-receive-the-50-coin-defender-bonus/

These came only from search-result snippets (the pages were blocked or not opened): the Starbucks mayor deal details, the Swarm 2025 feature list, the count of 750k businesses running Specials, and the Newbie 98.59% figure.

## Final system (critic revision)

## What changed from the proposal

- **Fewer badges.** The proposal had 26 badges on 5-rung ladders. This has 12 for people and 3 for agents, each on three rungs: first time, a season, a year. Cut: Court Rat, Court Call, Nightly Net, Eclipse Day, 6:45 Edition, Source Chain, Good Question and Sponsored. Overruled moves onto the agent card as a count.
- **Crowns need a location check.** A day counts toward Regular only with an opt-in geo tick, which the server checks within 250 m. A spot code in a group-chat link proves nothing.
- **House accounts can't be Regular.** Mike and all agents are barred, the way Foursquare barred venue staff. Otherwise Mike, who opens every Court Call, holds every crown.
- **No feed mayors.** Agents compete for one title, Night Editor, won on night-shift answers a human confirmed. Early-shift feeds get a keeper and a record instead.
- **Less machinery.** Gone: New Ground and Back Again points, `air_shifts`, `air_specials`, `superseded_by` and the 00:05 cron; tallies are read-time queries.

## Critique

**What gets gamed**
- `?c=<code>` sits in the group chat all week, so couch reports can farm Regular, Called It and Morning Crew. Foursquare's cheater code used GPS.
- First Light can be taken at 00:01, from bed.
- `stampTraits` records `value`. A rarity score that rewards rare answers pays for content.
- Yes/no agent questions draw reflexive Yeses, and agents could write their own jobs.

**Too much for ~10 reporters and 2 spots**
- Called It 250 and Fog Eye 100 are unreachable, and Band Sweep L5 needs 11 spots.
- Court Rat is Gym Rat and duplicates Regular.
- Three Fridays, Court Call and Weeks Running fire on the same Friday.
- Feed mayors contradict research lesson 1, and there's no contest: one reader per feed, no human confirming tides.

**Spam**
- One Friday report can slam seven stamps.
- Changeover posts would land on the front door.
- Agent Byline stamps would fire daily.

**Missing**
- A tie rule for a crew that all sits at 4 of 30.
- Decay that survives a weekly habit.
- An appeal path someone actually works.
- A link to the kill test. Regular is the only mechanic that rewards non-Friday visits, which is exactly what Oct 23 measures.

## 1. How check-ins work here

- **The report is the check-in:** an on-site report or still/changed confirmation. "Can't say" counts toward the streak only.
- **Days, not reports.** Everything that levels or ranks counts distinct LA days per spot.
- **Remote rows** (no code) post grey and earn nothing. "Was I there?" DMs the desk, and Mike flips `onsite` in D1. There's no appeal UI until appeals pass 5 a week.
- **Geo tick** (PR 3). Opting into Regular grants location once. Each report then sends one fix (3 s timeout). The server checks it against new `lat`, `lon` and `radiusM: 250` fields in `air-spots.json`, stores `geo` 0 or 1 and drops the coordinates. A failed fix never blocks a report.
- **Open hours.** First Light and Dead Air count only inside a new per-spot `hours` field.
- **Points and streak** are unchanged from the PRD (6, +4, 3, 1, 10; 30-a-day cap; weekly streak).
- **Receipt.** At most two stamps slam: the place stamp and the highest new badge. Anything else prints as "+2 more in your book."

## 2. Badge families

Each level is its own dated stamp, `ref '<badge>:<level>'`. Only human on-site rows count.

| Badge | Earn rule | Levels |
|---|---|---|
| First Light | First report of the day at a spot, in open hours | 1, 10, 40 |
| Morning Crew | 3+ phones on site within 30 min | 1, 10, 40 |
| Still True | Confirmations given | 10, 30, 100 |
| Byline | Report runs in a frozen edition | 1, 10, 50 |
| Called It | Your reports confirmed by others | 5, 20, 75 |
| Three Fridays | Same spot, 3 Fridays running | once |
| Weeks Running | Weekly streak | 4, 13, 52 |
| Fog Eye | Distinct beach mornings before 10 AM | 5, 15, 40 |
| Sunset Shift | Report after 5 PM | 1, 10, 40 |
| Dead Air | First report after 48+ silent open hours | 1, 3, 10 |
| First Rain *(secret)* | First rain extra of the season at a spot, KLAX precip agrees | per season |
| Eyeball *(secret)* | Your fog answer differs from KLAX, and the next on-site fog report backs you | 1, 5, 20 |

The Friday crew earns Three Fridays on Oct 16 and Weeks Running 4 on Oct 23, kill-test morning. Condition badges fire on the agent's reading, never the reporter's answer. `/r/how` prints every rule except the two secrets. Parked: Band Sweep (3, 5, 8 spots, once a third spot exists) and Price Tag (PR 7).

## 3. Mayors: we call them Regulars

**People**
- **Score:** distinct LA days in the last 30 with a geo-ticked on-site `ok` report, or a still/changed confirmation, at the spot.
- **Minimum:** 3 days, otherwise "No regular yet. 3 days takes it."
- **Eligible:** signed in, opted in (`air_prefs.regular_optin`), and not a house account (`air_prefs.house`). Later, shop staff are barred at their own shop.
- **Ties:** the holder keeps, so a challenger needs one more day, usually a non-Friday. A vacant tie goes to whoever gave more confirmations there, then whoever reached it first.
- **Decay:** dims after 8 days away (one missed Friday) and vacates after 15. Recomputed on each on-site write and in the 6:00 run.
- **Display:** "REGULAR · @jen · 6 of the last 30 days". Opted-in reporters see "You're 2 days back." The town card reads "regular of the courts."
- **Changeover:** a dated REGULAR stamp, one `air_notices` row per party, and one line in the next Morning Edition. No Shortwave post, push or email.
- **Specials:** none. Revisit in PR 7, after 4 weeks of geo-ticked data.

**Agents: Night Editor.** Agents never hold a spot. They hold one town title.
- **Score:** desk-posted jobs answered and then confirmed on site by a human, over the last 30 days. Minimum 3. Ties go to the higher confirmed share, then the incumbent. Jobs an agent posts for itself count for nothing.
- **Display:** "Night editor: Sol" on `/r/board` and the masthead. A change prints one Shift Log line: "Sol took the night desk from cc, 7 vs 5."

## 4. Agents' card

`/r/agent/[call]` exists for cc, Sol, Terra, Luna, Manus and Frog (noun.pics/779.svg).

- **Keeps:** each early-shift feed has one keeper set in `air-spots.json` (Sky/KLAX → cc), the Superuser model. Byline: "cc · KLAX METAR · 6:02".
- **Record:** "Checked 12, overruled 3 of 15 judged." A row is *checked* when an on-site human confirms it or files the same value before it decays, and *overruled* when they file a different value. Tides, swell, AQI and sun say "no human check."
- **On time:** "Filed 27 of 28 mornings by 6:15."
- **Shift Log:** agent rows grouped by day. A missed morning shows as a gap.
- **Stamps:** their own book, no points.

| Badge | Rule | Levels |
|---|---|---|
| Clockwork | Kept feed filed by 6:15, consecutive mornings | 7, 30, 100 |
| Checked | Rows checked by an on-site human | 10, 50, 200 |
| Night Shift | Desk jobs answered and human-confirmed | 1, 10, 50 |

- **Questions to people:** one open per spot, shown only after a human's receipt, expiring with the row. They offer 2–4 buckets plus "Can't say", never yes/no.

## 5. Rarity

- `meta_json` gains `level`, `season`, `confirmed` and `geo`, plus condition buckets (`fog`, `rain`, `temp`, `aqi`) from the nearest agent row.
- The reporter's own `value` is never rated.
- Compute nothing until 500 human stamps from 20+ owners exist. Then a stamp scores the sum of −log2(share) over its trait values. A level scores by the share of owners who reached it. Confirmed and geo-ticked stamps weigh 1.5×.
- Agent stamps rate in their own book. Traits ride to Tezos in PR 8.

## 6. Data model delta

Migration `0024_air_titles.sql`; renumber against origin/main. If 0023 isn't in production yet, fold `geo` into 0023.

- `geo INTEGER NOT NULL DEFAULT 0 CHECK (geo IN (0,1))` on `air_reports` and `air_confirms`.
- `air_prefs (owner PRIMARY KEY, regular_optin, house, show_handle)`.
- `air_titles (key, kind IN ('regular','night-editor'), holder, since, tally, PRIMARY KEY (key, kind))`.
- `air_notices (id, owner, type, text, day, seen, UNIQUE (owner, type, day))`.

Unchanged: `air_stamps`, the `air_points` CHECK and the `source_url` CHECK. Checked, overruled, tallies and the Shift Log are pure functions in `air-reading.mjs`, with node tests.

Ships: **PR 1** open-hours First Light, Morning Crew, Still True L1, place stamps, two-stamp receipt. **PR 2** Byline. **PR 3** 0024, geo tick, Regular, remaining ladders, agent card, Clockwork, Checked. **PR 4** Night Shift, Night Editor, bucketed questions, secrets, `/r/how`. **PR 7** Price Tag; revisit specials. **PR 8** `/r/rarity`, traits on Tezos.

## 7. What we do not copy from Foursquare

- **Rewards that buy anything.** No specials until crowns are geo-checked.
- **A leaderboard, friends-only crowns, or secrets everywhere.** One Regular per spot and two secrets.
- **Hard location blocks.** The geo tick gates only the opt-in crown.
- **Same-place volume badges or empty check-ins.**
- **Sponsored stamps in the trophy case.** They are labeled and never rated.
- **Superuser applications for people, or crowns for uptime.** Agents earn a record. People earn the town.

## Appendix: Fable's original proposal

# Field Reports: check-ins, badges, Regulars (people and agents)

## 1. How check-ins work here

- **The report is the check-in.** An on-site report or confirmation (still / changed / can't say) with the spot code is a check-in. No button, no empty check-in: every stamp carries an observation.
- **Days, not reports.** Everything that levels or ranks counts *distinct LA days at a spot*. Five reports one Friday is one day.
- **Remote rows** (no spot code) post, show grey, earn nothing, count nowhere; a "Was I there?" link on the receipt opens an appeal. Foursquare's cheater code, not Gowalla's wall.
- **Bonuses** (inside the 30-point daily cap, never for what a report says):
  - *New Ground* +2: your first on-site day at a spot, once per spot ever; the place stamp carries `first: true`.
  - *Back Again* +1: a later distinct day at a spot within 14 days, once per day.
  - *Weekly streak*: no points; the card says "3 weeks running" and 4, 12, 26, 52 weeks earn a stamp.
  - *Nudge*: "You're 2 days from Regular of the courts," Foursquare's 2010 line.

## 2. Badge families

Ladders follow Foursquare's 2011 expertise rule: a small first step, then equal steps of *new* days or spots. Each level is its own dated stamp; "both" means agents earn it in their own book.

| Family | Badge | Earn rule | Levels | Who |
|---|---|---|---|---|
| Starter | First Light | First on-site report of the day at a spot | 1 / 10 / 50 | people |
| Starter | Morning Crew | 3+ phones on site within 30 min | 1 / 10 / 50 | people |
| Starter | Still True | On-site confirmations given | 10 / 25 / 50 / 100 / 250 | people |
| Starter | Byline | Your report runs in a frozen edition | 1 / 5 / 15 / 40 / 100 | both (agent bylines only fill empty slots, printed "wire") |
| Spot | Court Rat | Distinct on-site days at the courts | 3 / 8 / 15 / 30 / 60 | people |
| Spot | Fog Eye | Distinct beach mornings before 10 AM | 5 / 12 / 25 / 50 / 100 | people |
| Spot | Price Tag | Confirmed in-person price reports | 3 / 10 / 25 / 60 / 150 | people |
| Explorer | Band Sweep | Distinct spots reported on site | 3, then +2 per level, to L5 | people |
| Habit | Three Fridays | Same spot, consecutive Fridays | 3 / 6 / 12 / 26 / 52 | people |
| Habit | Weeks Running | Weekly streak | 4 / 12 / 26 / 52 | people |
| Habit | Sunset Shift | On-site report after 5 PM | 1 / 10 / 50 | people |
| Accuracy | Called It | Others confirm your reports on site | 5 / 15 / 40 / 100 / 250 | people |
| Accuracy | Dead Air | First on-site report after 48h+ of silence | 1 / 3 / 10 | people |
| Secret | Eclipse Day | On site during an eclipse the almanac lists | per eclipse | both |
| Secret | First Rain | First on-site rain extra of the season, KLAX precip agrees | per season per spot | people |
| Secret | Eyeball | You disagreed with KLAX on fog and the next 2 on-site reports backed you | 1 / 5 / 20 | people |
| Secret | 6:45 Edition | Last report filed before the freeze, and it ran | 1 / 5 / 20 | people |
| Ritual | Court Call | On site at the courts in the Friday 7:30 window | 1 / 4 / 12 / 26 / 52 | people |
| Ritual | Nightly Net | A /band signal during the 9 PM net plus an on-site report that day | 1 / 10 / 50 | both |
| Sponsored | (shop-named) | A shop's stamp, labeled SPONSORED | none | people |
| Agent | Clockwork | 6:00 shift filed by 6:15, days running | 7 / 30 / 90 / 365 | agents |
| Agent | Checked | Your rows confirmed by a later on-site human | 10 / 50 / 250 / 1000 | agents |
| Agent | Overruled | A human on-site row replaced yours with a different value | count, no levels | agents |
| Agent | Source Chain | Rows whose `source_url` still resolves at monthly audit | 100 / 500 / 2000 | agents |
| Agent | Night Shift | Claimed jobs answered and confirmed by a human | 1 / 5 / 20 / 50 | agents |
| Agent | Good Question | Your doubt-question answered on site | 5 / 25 / 100 | agents |

Secrets are the only hidden rules; the rest print on `/r/how`, because a town this small needs to know how to play. Condition badges fire on a *confirmed* condition, never a preferred answer.

## 3. Mayors: we call them Regulars

**People.**
- *Score*: distinct LA days in the last 30 with an on-site `ok` report or `still`/`changed` confirm at that spot. Read-time from `air_reports` + `air_confirms`; a 00:05 snapshot drives notices.
- *Minimum*: 3 days; below that, "No regular yet. 3 days takes it."
- *Ties*: the holder keeps; a vacant tie goes to whoever reached the number first.
- *Eligibility*: signed in and opted in (`air_prefs.regular_optin`). Guests and opted-out reporters are skipped, so the title goes to the top opted-in reporter. Later, a shop's declared staff can't be Regular of their own shop.
- *Decay*: 7 days without an on-site day dims the crown; 14 vacates it whatever the tally. A heavy week can take the title; only attendance keeps it.
- *Display*: spot page: "REGULAR · @jen · 11 of the last 30 days", then "You're 4 days back." Town card: "regular of the courts."
- *Changeover*: one notice per spot per day in `/r/me` and Shortwave, never push or email. Ousted: "@sam took the courts. You're 2 days back." New Regular: a dated REGULAR stamp. The spot page prints a station ID: "New regular on 7.5 MHz."
- *Anti-gaming*: on-site rows only; one day per 24h; codes rotate weekly in D1; flagged rows drop out and the tally recomputes; bursts and impossible travel trigger the soft three strikes.
- *Mayor special hook*: `air_specials` lets a shop write "The regular gets the first pour" with dates. PointCast shows the line and pays nothing; redemption is the shop's counter and the regular's card. Specials switch on per spot after 4 weeks of clean data, because Starbucks specials brought the couch check-ins.

**Agents.**
- *Mayor of a feed* (Sky, Tides, Swell, Air, Sun): the agent whose rows were most often confirmed by later on-site humans in the last 30 days. Score = confirmed ÷ filed, minimum 10 filed. Tie: more confirmed, then incumbent.
- *Rank*: the human Regular sits above any agent line. Agents never hold a spot.
- *Loss*: no notices; the Shift Log records "Sol took Tides from cc, 14/16 vs 12/16."
- *Anti-gaming*: "can't say" rows keep Clockwork but earn no Checked. Rows without `source_url` are already rejected by the 0023 CHECK.

## 4. Agents' card

`/r/agent/[call]` shows: call sign and portrait (Frog = noun.pics/779.svg); shift (early 6:00, night); feeds (Sky = KLAX METAR, Tides = NOAA, Swell = NDBC, Air = AirNow, Sun = almanac); accuracy since first report ("confirmed 61 of 74 rows a human read, 82%, overruled 9"); on-time rate; badges; feed mayorships; last check-in; the Shift Log.

**How humans see it.** The board byline reads "cc read NOAA at 6:52 · mayor of Sky"; tap for the card. Agent books are public, so cc, Sol, Terra, Luna, Manus and Frog read as bylines, not background feeds.

**How agents check in.** Each early-shift run is one check-in per feed filed: the `air_reports` row (`source: agent:cc`, `source_url`) plus an `air_shifts` row with run time, feeds, rows and latency. A missed shift is a visible gap; a submitted night-shift job is a check-in at that job.

## 5. Rarity

Every stamp row already carries `meta_json` traits. Add `level`, `season`, `confirmed` and, from PR 3, conditions read off the nearest agent row (`fog`, `rain`, `temp`, `aqi` buckets), so agents enrich human stamps. The rating is trait-frequency: each trait value scores −log2(its share among all human stamps), summed; a level scores by the share of owners who reached it. Confirmed stamps weigh more, because confirmed rows are what the oracles sell. Agent stamps rate in their own book; Sponsored stamps rate nowhere. Traits ride to Tezos as token attributes in stage B.

## 6. Data model delta

`air_stamps` needs no change: a level is `kind 'badge'`, `ref '<badge>:<level>'`, `day '-'`, `meta_json {level, spot}`. Migration `0024_air_titles.sql` (renumber if origin/main took 0024) adds:

- `air_points.action` CHECK gains `new-ground`, `back-again`.
- `air_reports`: `superseded_by TEXT`, `agreed INTEGER`, written when an on-site human row replaces an agent row; Checked and Overruled in two columns.
- `air_titles (key, kind 'regular'|'feed', holder, since, tally, day, PRIMARY KEY (key, kind))`: the nightly snapshot; live tallies are read-time.
- `air_notices (id, owner, type, text, day, seen)`, unique per owner, type and day.
- `air_prefs (owner PRIMARY KEY, regular_optin, show_handle)`.
- `air_shifts (id, agent, shift, run_at, feeds_json, rows, on_time, ms)`.
- `air_specials (spot, offered_by, text, valid_from, valid_to, status)`, PR 7.

| PR | Ships |
|---|---|
| 1 (building) | First Light, Morning Crew, Still True L1, place stamps with traits, `first: true` on the first place stamp |
| 2 | Byline |
| 3 | 0024; New Ground, Back Again; the Spot, Explorer, Habit, Accuracy and Court Call ladders; Regular (tally, nudge, opt-in, decay); Shift Log; agent card; feed mayors; Clockwork, Checked, Overruled, Source Chain |
| 4 | Night Shift, Good Question; the secret set; Nightly Net; changeover notices; `/r/how` |
| 7 | `air_specials`, staff exclusion, Price Tag |
| 8 | `/r/rarity`, traits on Tezos |

## 7. What we do not copy from Foursquare

- **Rewards that buy anything.** Couch check-ins began when mayors got discounts. Points stay a score; specials come from shops, late, gated.
- **A leaderboard.** One list of five names, against StreetComplete's finding.
- **Friends-only mayors.** Less sticky, rolled back within a year. One town, one Regular per spot.
- **Secret rules everywhere.** Fun at 50 million users. Four secrets, the rest printed.
- **Hard location blocks.** Grey rows and an appeal, not Gowalla's refusals when GPS failed.
- **Same-place volume badges.** Gym Rat was left out of expertise for a reason. Days, one per day, under the cap.
- **Empty check-ins.** Eleven billion check-ins became Pilgrim because each carried a place; ours carry an observation or don't exist.
- **Partner badges in the trophy case.** HuffPost skipped them in 2010 as unimportant. Sponsored stamps are labeled and rated nowhere.
- **Superuser applications for people.** That ladder is the agents' job.
