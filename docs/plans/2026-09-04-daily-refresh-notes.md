# Daily refresh — what the daily visit looks like

**Filed:** 2026-09-04 · cc, from Mike's notes in the faucet session
**Mike's ask:** *"what does daily refresh look like for pointcast where at minimum, i do enjoy visiting daily … weather, real time information, etc obvi go a long way"*
**Status:** notes, not a sprint. The HELLO faucet (`/faucet/hello`) is the first new daily rung shipped from these.

## The principle

A daily site is one where the same URL is different tomorrow for a reason a person can name. PointCast already has the clocks; what it lacks is one place they all read out. Every daily thing should answer the same three questions in the first screen: **what is today**, **what did I do**, **what can I do before midnight Pacific**.

## What already resets or moves (inventory)

| Surface | Clock | Personal state |
|---|---|---|
| `/kennel-club` | one plate a day, claim window | claimed / held / delivered |
| `/faucet/hello` | one drip a day, 50 town-wide | owed / delivered, ledger |
| `/bench` | one question a day | answered |
| `/today` | one block a day | collected |
| `/race` | new race daily | ran |
| `/window`, `/tidepool`, `/marine-layer` | real weather, NOAA tides, KLAX fog | none |
| `/coffee` | cups today | cups |
| `/prayer-candles` | 24-hour burns | lit |
| `/thursday` | keeps hours | none |
| `/drum` | global count, live rooms | streaks, trophies |
| Passport seals, stamps | on claim | the passport itself |

That is eleven daily clocks. The front door lists them as rooms; it does not yet say which ones you have finished today.

## The daily refresh, proposed

1. **A "today" strip at the very top of the front door**, decided at request time like Kennel Club's `today` payload: date, El Segundo weather line (from `/api/weather`, already cached ten minutes), marine layer yes/no, tide, sunset. One line. It is the reason the page is different from yesterday before anything else loads.
2. **A personal checklist under it for signed-in people**: dog · HELLO · bench · today's block · race, each a checkbox that flips as the account does it. Five things, all free, all under a minute. This is the "did I do my rounds" loop, and it is what makes a daily visit a habit rather than a browse.
3. **Streaks without shame.** Count consecutive days any one of the five was done; show the number; never nag. The Kennel Club `claimedStreak` helper already exists in `src/lib/collect-desk`.
4. **The faucet as the reward lane.** Each daily thing can later earn a drip from a different 2019 token (bench → GRATITUDE, coffee → APIZZA, and so on); the ledger is already token-keyed. Not now.
5. **Real-time where it costs nothing.** Weather, tide, fog, and presence are already computed; surface them in the checklist strip and in the OG image for `/` so the link preview changes daily too.

## Shipped in the same PR (#1049)

- `HomeTodayStrip` inside the front-door desk: one live El Segundo weather line (`/api/weather`, ten-minute edge cache) and the five rounds as chips.
- `/api/today`: the rounds for the Los Angeles date of the request. Dog and HELLO are account-keyed and show done or not for a signed-in person; bench, today's block, and the race are listed as untracked because their state lives in the browser.

## Next

Move bench, today's block, and race state onto the account (a `rounds` KV key per user per day is enough) so all five track, then add the streak count from `claimedStreak`.
