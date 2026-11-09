# PointCast pickleball rankings: tier plan

Draft for Michael Hoydich, written by Claude Fable 5.1 and aligned to the preview build by Claude Opus 5.5. Nothing here is live. Which outside sources we may use is a separate question: see SOURCE-SURVEY.md. This plan assumes its likely outcome: most current US national and pro results sit on link-only platforms, so national data stays thin until organizers say yes or players submit their own results with a source link.

## One recipe, every tier

Every tier uses the Court Rating recipe from `public/pickleball/players/rating.js` on elsegundo.xyz, unchanged:

- Court Rating = recency-weighted mean of (division level + place adjustment). 1st +0.25, 2nd +0.10, 3rd 0, 4th -0.10. Recency halves each year.
- A draw of 3 teams or fewer counts half. A self-declared level counts as weight 3.
- Band = ±0.5 / sqrt(1 + results weight). Level = nearest half step on 2.0 to 8.0.
- Tags: Self-declared (no results), Provisional (1 or 2 results), Settled (3 or more).
- A gap of 0.5 or more between self-declared and results is shown, not hidden.

Court Score (the points ladder in `recipe.json`) is a different number. It stays on its own page, never uses self-declared input, and is not part of this plan's ordering.

The tiers differ only in which results rows go in. Nothing else changes.

## The four scales

### Shared rules (all tiers)

- **A player appears only from published results.** One finish on a public organizer page, or one self-submitted result with a working source URL that an editor checked, puts a player on a tier. A self-declared level alone lists no one anywhere; it only adjusts the rating of a player who is already listed.
- **No inference of home location.** We know where the event was, not where the player lives. A player's place on a tier comes from the event venue, never from a guessed home town, club or profile.
- **Minimum evidence to be listed:** 1 counted result (tag Provisional). Settled needs 3.
- **Ordering:** Court Rating, high to low. Then band width, narrow to wide. Then name as listed, A to Z.
- **Ties:** same rating and same band width share one rank number (shown "=12"). Within the tie, names are A to Z. The next rank number skips as in sport.
- **Unavailable:** missing data shows the word "unavailable" and a one-line reason ("no usable source yet", "no checked result"). Never zero, never a blank cell, never a dash on its own. In JSON the value is `null` with `"status": "unavailable"` and `"reason"`. In CSV the cell reads `unavailable`.
- **Adults only.** Junior, youth and under-18 divisions are dropped before anything is counted, using the word list in `config.json`.
- **Every tier publishes:** an HTML table, `rankings.json`, `rankings.csv`, and a method page that states the recipe, the feeds in, the dedupe rule, the as-of date and what is unavailable.

### National (US)

- **Scope:** every counted result whose event venue is inside the United States.
- **Events that count:** venue location rule. The organizer's published venue address or city puts the event in or out. No venue, no row.
- **Players:** anyone with a counted result at a US-venue event. US residence is not checked and not claimed.
- **Today:** the table is empty and says "unavailable: no usable national source yet" (see SOURCE-SURVEY.md). The El Segundo feed rolls up into it, so the first national rows will be Southern California players. The page says that plainly so no one reads it as a US ranking.
- **Files:** `/pickleball/rankings/national/`, with the tier in `/pickleball/rankings/rankings.json` and `rankings.csv` (shared files, one `tier` column).

### Global

- **Scope:** every counted result from every feed, any country.
- **Events that count:** venue anywhere, with a country from the organizer's page. No country, no row.
- **Players:** anyone with a counted result anywhere. Nationality is not inferred.
- **Today:** unavailable. Global exists as a page only once a second national ladder exists.
- **Files:** `/pickleball/rankings/global/`. Its JSON entry lists feeds and events, with `players: []` and `status: unavailable` until it opens.

### Regional

- **Scope:** named radius ladders. Each has a center point, a home radius (the name on the label) and an event radius (the filter that does the work). Optionally a state-level ladder per US state, filtered by venue state.
- **The first one:** El Segundo 25-mile, from elsegundo.xyz. Center is El Segundo Recreation Park (33.9216674, -118.411307). Home radius 25 miles, event radius 40 miles, per `content/pickleball/players/config.json`.
- **Honest note on "home":** the El Segundo ladder is event-based. `results.csv` and `players.json` hold no home town, club or address for anyone. "Players from the El Segundo area" means players who finished at a venue within 40 miles of the Rec Park. The 25-mile label describes the area the ladder serves; the 40-mile event filter decides who is on it. PointCast says this on every regional page.
- **Events that count:** venue within the ladder's event radius. State ladders: venue in that state.
- **Players:** anyone with a counted result at a qualifying venue.
- **Overlap:** one player can sit on several regional ladders at once. A finish in Fountain Valley counts for El Segundo 25-mile and for any Orange County ladder we later add. That is expected and stated.
- **Files:** `/pickleball/rankings/regional/<ladder-id>/` (for example `el-segundo-25`) and `/pickleball/rankings/regional/`, listing every ladder. Each ladder is a `regional` entry in `rankings.json`.

### By level

- **Scope:** not a tier of its own. It is a filter over any tier by Level (2.0, 2.5, ... 8.0).
- **How it works:** take a tier's rows, keep those whose Level equals the chosen half step, keep the same order. The band is still shown, so a 3.5 near the edge of 4.0 reads that way.
- **Players:** same as the tier under it. No extra evidence rule.
- **Files:** `/pickleball/rankings/level/<step>/` (for example `/level/4.0/`), filtering the US rollup. Any tier's rows can be filtered the same way by the `level` column in `rankings.csv`. Later: `/<tier>/level/<step>/` per tier.

## How the rollup works

1. **Feeds in.** Each regional ladder publishes a results feed in the shape of `results-feed.schema.json` (league, events with venue lat/lon and `source_url`, results with event_id, division, category, place, draw_size, player_1, player_2). PointCast stores each as a normalized feed in `src/data/pickleball-rankings/feeds/<feed-id>.json` (events with country; team finishes with `team`, `source_url`; players with name only). The El Segundo 25-mile feed is the first, converted from its open `players.json` by `scripts/pickleball-rankings/sync-el-segundo.mjs`. Later feeds come from other radius ladders, organizers who agree, or self-submitted results.
2. **Namespace.** Player ids are prefixed with the feed id (`el-segundo-25/claudio-garcia`); event ids keep the organizer's id. Two feeds that report the same event id are the same event. (Later: when two feeds name one event differently, an explicit event-merge record, like the identity merges.)
3. **Dedupe.** Rows are deduped by (event_id, division, place, team). Team is the sorted pair of player ids after merges. The same finish reported by two feeds counts once once its players are merged; without a merge record the two entries stay apart, as below.
4. **Regional to national.** Every deduped row whose event venue is in the US goes into the US ladder. A row in the El Segundo ladder and a row in a future Orange County ladder for the same finish are one row nationally.
5. **National to global.** Global is the union of every country's rows, which is the same as the union of the national ladders. Every row has a venue country, so nothing reaches global without passing a national filter.
6. **Level views.** A filter over the finished tier. No separate data.
7. **Same rating everywhere.** Because the rows are the same and the recipe is the same, a player's Court Rating is the same number on every tier they appear on. Only the rank changes.

### Identity across ladders

- A player is one entry per normalized name per feed. Two entries merge only on an explicit record: a `merge_into` row in a ladder's `players.json` with a stated reason (already applied upstream before the feed arrives), or a PointCast record in `src/data/pickleball-rankings/identities.json` (`merges`, `claims`).
- Name similarity alone never merges. Two "Chris Lee" entries from two feeds stay two entries, each marked "may be a different person with the same name".
- Collisions are shown as separate entries with the feed and events that produced each one.
- The existing El Segundo merges (same partner, one letter apart) are editor records with a reason. PointCast honors them because they are explicit, not because of the spelling.

### Do-not-list is global

- One shared file, `do-not-list.json`, same format as elsegundo.xyz: SHA-256 of the normalized name, so the public file names no one.
- A removal request on any tier removes the player from every tier and every level view, the same day, no proof asked. Partners' pages show "a player who asked to be left out".
- Feeds are checked against this list on import, so a removed name cannot return through a new feed.

## Privacy rules

- **Public results only.** Name as the organizer listed it, division and level, event name and date, finish, partner, draw size, source URL.
- **Never:** addresses, phones, emails, photos, social profiles, employers, ages beyond the published bracket (50+ stays "50+"), birth dates, home towns, or any inference about a person.
- **Adults only.** No junior divisions, ever.
- **Every player page** carries claim, correct and remove links and the do-not-list note. Claims go through an editor; only the fields the player asked for are added.
- **Open method.** Each tier has a method page, JSON and CSV. Anyone can rerun the numbers.
- **Link-only platforms.** pickleball.com, pickleballtournaments.com, pickleballbrackets.com, ppatour.com, usapickleball.org, dupr.com, mydupr.com, pickleballden.com, utrsports.net, pickleheads.com. We link out to them for context and copy nothing. The build refuses rows whose `source_url` is on this list. SOURCE-SURVEY.md says which other sources are usable.

## Phases

### P0: preview (build now)

- Pages built under `/pickleball/rankings/` with `noindex,follow`.
- US page says "unavailable as a national ranking" with the reason, then shows the rollup so far (El Segundo rows only) under the heading "Rolled up so far", captioned Southern California only. Global page says unavailable and shows no table.
- Regional index lists El Segundo 25-mile as the first regional feed, a committed snapshot of `https://elsegundo.xyz/pickleball/players/players.json` made by `scripts/pickleball-rankings/sync-el-segundo.mjs`, with claim, correct and remove on every player page and a link to the player's El Segundo page.
- Level views work over the El Segundo rows.
- Method pages, `rankings.json` and `rankings.csv` exist for every tier, with unavailable states filled in.
- Tests: dedupe, namespace, venue filter, do-not-list on import, no blocked hosts, no junior rows, unavailable never renders as 0.
- **Needs Mike's okay in his own words:** making any of this public, even as noindex. `/pickleball/rankings/` is a new public section on PointCast.

### P1: regional expansion

- Add named radius ladders (candidates: a second South Bay or Orange County center; a Bay Area center if a usable organizer source exists). Add state ladders only where at least one usable feed exists.
- Each new ladder gets its own `players.json`, `do-not-list` entries flow to the shared file, and the overlap note.
- **Needs Mike's okay:** each new ladder (a new public page), and any outreach to an organizer to ask for a results feed. A brief or an issue is not that yes.

### P2: national (when usable sources exist)

- Two ways in: an organizer agrees in writing to publish or license results in the feed shape; or a player self-submits a finish with the organizer's public source URL, and an editor checks the page before the row counts. Self-submitted rows carry `reported` until checked, then `listing`.
- The US page drops "unavailable" only when at least one non-regional feed is live. Until then it keeps the Southern California warning.
- **Needs Mike's okay:** every organizer permission ask (email or any public message), opening the self-submit form, and taking the US page out of noindex.

### P3: global

- Add non-US national ladders by the same two routes. Global goes live when a second national ladder exists.
- **Needs Mike's okay:** any outreach outside the US, each new national ladder, going live.

Across all phases: nothing posts to X, no email goes out, no public reply is made, no deploy or hosting setting changes, and nothing touches PointCast production without Mike saying so himself.

## Open questions for Mike

1. Is `/pickleball/rankings/` the right home on pointcast.xyz, or should PointCast only link to elsegundo.xyz until P2?
2. Should a region's label be the home radius (25) or the event radius (40), given the filter is the event radius?
3. Self-submitted results: who is the editor who checks source pages, and how many per week is realistic?
4. Should an unclaimed player with 1 result appear on the US ladder, or should national require Settled (3 results) to keep thin data from reading as a national rank?
5. State-level ladders: wanted at all, or only radius ladders?
6. Do you want the US "unavailable" page visible as a public promise, or kept noindex until a real national feed exists?
7. Which organizers, if any, may we ask first, and in what words?
