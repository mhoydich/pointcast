# PointCast pickleball: signals plan

Draft for Michael Hoydich, written by Claude Fable 5.2 on 2026-11-10. Nothing here is live. It extends TIER-PLAN.md: that plan says which rows go into each tier; this one says which new kinds of rows may exist and how they feed the one Court Rating.

Direction it follows (Mike, Nov 10): the level number ("3.0 or 4.2") is what people want to say; compile signals with our own weights; keep the data open for anyone to use; go global; more signals from self-declare, games that get made and recorded, other sources and feedback.

## What does not change

- One recipe. The arithmetic stays in `rating.js` upstream (mhoydich/hello-token-reserve, elsegundo.xyz) and is copied here verbatim. Every constant below is a proposal to make upstream first.
- Court Rating orders the tiers. Court Score stays a separate points race on its own page and never uses anything a player says about themselves.
- No inferred home, no contact details, adults only, link-only hosts stay link-only.

One wording fix to make upstream: the elsegundo.xyz method page says Court Rating "never changes rank" while the scoreboard is ordered by Court Rating. The ordering is the intended one; the sentence should say Court Rating never changes Court Score.

## Signals

Each signal becomes a row `{ level, weight, recency }` in the same recency-weighted mean `fromResults` already computes. Only the weight and where `level` comes from differ.

| Signal | `level` comes from | Proposed weight | Status |
| --- | --- | --- | --- |
| Tournament finish, organizer page | division level + place adjustment | 1.0 (0.5 for draws of 3 or fewer) | live |
| Self-declared level | the player | counts as 3 results | live |
| League or ladder match, organizer feed | opponents' mean rating + margin adjustment | 0.8 | proposed |
| Rec game, confirmed by both teams | opponents' mean rating + margin adjustment | 0.5 | proposed |
| Vouch from a player who shared a court | the level the voucher names | 0.25 x voucher's certainty (1 - their band / 0.5) | proposed (`tagFor` already expects vouches) |
| Reader feedback on a page (too high / about right / too low) | none | 0, calibration only | proposed |
| Check-in at a court | none | 0, activity only | proposed |
| One-sided game report | none | 0 until the other team confirms | proposed |

Margin adjustment for a game to 11: winner +0.10 plus 0.02 per point of margin, capped at +0.25; loser the mirror. This keeps game rows on the same scale as the place adjustments.

Guards:

- The same four players count at most 3 game rows per day and 10 per 30 days.
- A game row needs both teams to hold a rating; a player with none gets their self-declared level or the game does not count for the others.
- Vouches: one per voucher per player per 90 days, only between players with a confirmed game or shared result.
- Tags grow one step: Self-declared, Provisional, Settled, and the count behind Settled may include confirmed games at their weight.

## Where signals come from

Already built, not yet connected:

- **SLSaaS on thasher.xyz**: a signed self-declared level. Accept it as the self-declared row, with the attestation as its source.
- **The Rotation on thasher.xyz**: draws a round robin and keeps standings in the browser. Add "send results" so a finished Saturday becomes confirmed game rows in a feed.
- **Rally Yearbook** (PRD, Sep 2026): crew, sessions and courts. Its session object is the natural parent of a recorded game and a check-in.
- **The Paddle Register** (`/paddles`): link a claimed player's paddle to a register id; the elsegundo.xyz paddles page should read the register instead of standing alone.

To build, in order:

1. `game` row type in the results feed schema: event_id optional, court id, date, two teams, score, `confirmed_by`.
2. Record-and-confirm: one team enters the score, the other confirms from a link or a courtside QR. No app.
3. Game board per court ("Sat 9am, 3.5 to 4.0, need 2"); a game made there is pre-filled for recording.
4. Vouch and feedback buttons on player pages.
5. Check-ins and stamps (court passport), on the shared points system.

## Open data

- `rankings.json`, `rankings.csv` and `results.csv` already publish. Add `signals.csv` (one row per counted signal, with type, weight and source) so anyone can recompute or reweight.
- Publish the weights as one file with a version and a changelog.
- Publish calibration each month: for confirmed games, predicted win rate by rating gap against actual.
- MCP tools to add beside `paddle_lookup`: `pickleball_level` (a player's rating, band, tag), `pickleball_ladder` (a tier or level slice), `pickleball_game_record` (resident-only write).

## Town kit

A town is a feed id, a center point, two radii and a skin. Torrance, Manhattan Beach and Medway are new `regional` entries over the same rows. A town page carries courts, ladder, game board and its lists.

Lists that come straight from rows already held (no new data, each one a share card):

- Most medals together: partner pairs by counted finishes.
- Iron list: most events played in 24 months.
- Played up: medals in a division above the player's level.
- New this month, and biggest movers.
- Level leaders: top five at each half step.

Lists that need opt-in (claimed pages only): My Five (courts, paddles, partners), what the town plays (paddle census), yearbook superlatives.

## Search queries

Track them, in aggregate only, the same way page views are counted (no cookies, no IPs):

- On-site search terms and zero-result terms, stored as counts per day.
- Drop any term seen fewer than 3 times in 30 days, so a name typed once is never kept.
- Which player pages are opened is already the best demand signal and is in `/api/v1/views`.

## Profile and sign-in

The player page grows into one place to run a pickleball life. Public side: level with band and tag, ladders, results, partners, stamps. Private side, owner only: games waiting on confirmation, next sessions, crews, paddle setups with hours, and what is shared with whom.

Sign-in is a ladder; each rung is asked for only when an action needs it.

| Rung | What it is | Unlocks |
| --- | --- | --- |
| 0 | Nothing | Read everything, download the data |
| 1 | A device key made silently in the browser | Check in, declare a level, give feedback, collect stamps |
| 2 | A magic link or passkey on pointcast.xyz | Carry the profile across devices and sites, record and confirm games |
| 3 | Claim: an editor check, or two confirmed players who vouch | Own a results-based page, edit it, merge spellings, remove it |
| 4 | Signed attestation (Tezos wallet, as SLSaaS does) or organizer key | Publish a results feed, run a town, sign a level |

Rules: no passwords anywhere; a rung-1 profile upgrades in place and keeps its stamps; removal never needs sign-in; anything written at rung 1 is labelled unverified.

Across sites: pointcast.xyz is the sign-in provider and holds the one profile; each site (elsegundo.xyz, thasher.xyz, a town site) reads it and adds its own panel. Check-ins, stamps and declared levels are published as open records an AT Protocol account can also carry, so a profile is portable and bots can subscribe over MCP without followers.

## Real time

Publish directly when a thing is finished; no editor queue in the normal path.

- A check-in shows on the court page at once and expires on its own after two hours.
- A game publishes the moment the second team confirms: both levels, bands and the ladder recompute then, not on a nightly build.
- A finished Rotation publishes its standings and its game rows in one step.
- Every publish is one record on an open stream (JSON feed, webhook, MCP), so town sites, bots and group chats see it within seconds.
- Review happens after, not before: anything can be flagged, a flagged row stops counting until an editor looks, and corrections are published as records too.
- Still gated: claims, merges of two spellings, and new organizer feeds.

## Declare in tenths, and league seasons

- Self-declared level accepts tenths (4.2), not only half steps. Upstream change: `isLevel` takes any value from 2.0 to 8.0 at one decimal; the named Level stays the nearest half step.
- The player page shows the gap in words whenever both exist: "says 4.2, results say 3.85, two finishes".
- **League season** is a signal: a completed season on an organizer's published roster at a stated level is a row at that level, weight 0.5, recency as usual, at most two seasons counted per 12 months. With a published team or individual record, the level shifts by up to plus or minus 0.15 on win rate.
- Age-bracket divisions keep the stated skill level, as now.
- No rating by association. A partner's or teammate's finish is theirs; it reaches another player only through a shared finish or a confirmed game.

## Regions: the index and the link

A region record, published per town, metro, state, country and the world, with a source on every number and `unavailable` where there is none:

| Field | Meaning |
| --- | --- |
| players_listed, players_active_12mo | From the ladder rows |
| level_spread | Count at each half step; share at 4.5 and above |
| venues, courts | Total, and split indoor, outdoor, lit, dedicated, shared |
| courts_per_100k | Courts over resident population (census source) |
| events_12mo, draws_12mo | Published events and their total teams |
| leagues, ladders | Organizer programs running now |
| top_facilities | Venues by court count and by events hosted |
| linked_to | Regions it shares enough cross-play with, and the measured offset |

**Linked or not.** Two regions' ratings can be compared only when players have met. For each pair, count games and finishes where a player from one faced a player from the other; under 30, the pair reads "not yet linked" and no cross-region rank is shown. Over 30, publish the offset (how a 4.0 here has fared against a 4.0 there) with its band. National and global ladders are built only across linked regions.

**Depth is context, not rating.** Courts, facilities and player counts are published beside the ladder and never added to anyone's number. Whether depth predicts stronger players is a question the open data lets anyone test.

**Wiki.** Any region field can be proposed by anyone with a source link; an edit shows at once as "reported" and becomes "checked" when an editor or a second source agrees. Files: `regions.json`, `regions.csv`, an MCP tool `pickleball_region`, and a monthly "state of the region" report as the oracle's first standing answer.

First baseline (El Segundo 25-mile, as held on 2026-11-10): 848 players, 532 team finishes, 5 events, 21 venues on elsegundo.xyz within about 12 miles. Courts by type, population and league counts: unavailable until entered.
