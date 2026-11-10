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
