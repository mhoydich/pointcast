# The Pickleball Board — build spec

2026-09-28. Opus spec first; Fable design, conditions research appended. Court research JSON: docs/plans/2026-09-28-courts-research.json.

# Build spec: The Pickleball Board (`/pickleball`)

Spec for 2026-09-28, built on `/Users/michaelhoydich/pc-fr-courts` at `bfa264ce`. One PR, no migration. `/r/courts` and `/court` must stay byte-identical, so Friday's flow is untouched.

## 0. What I re-checked today (this corrects the research)
Fetching rec.us returns an empty JavaScript page and manhattanbeach.gov returns 403, so I opened both in a browser.
- **El Segundo drop-ins:** the current sections end Oct 26–31. Places2Play lists a Thu/Sat session; rec.us does not.
- **Manhattan Middle (MBMS):** the city lists it as public only on weekends and MBUSD school breaks. "Mon–Fri 4 PM" appears only on third-party sites.
- **Manhattan Heights:** prices went up for 2026.
- **Hawthorne:** the city also lists Ramona Park.
- **KLAX METAR:** wind is in knots, temperature is in °C, and `wdir` can be `"VRB"`.
- **NWS gridpoint:** `LOX/148,40`.

## 1. Decisions
- **Routes**
  - `/pickleball` is the board.
  - `GET /api/air/board` is its API. The static route wins over `[spot].ts`, and `board` is already reserved.
  - `/r/board` redirects to `/pickleball`.
- **Data**
  - `air-spots.json` says what can be reported.
  - `courts-schedule.json` holds sourced facts. Facts render at build time; the API carries only what changes.
- **Air spots:** only open public courts get one. Everything else is a listing.
- **Kind roles**
  - `live` (the default, today's behavior): First Light, station post, crew.
  - `side` (parking): a reading and confirms, but no First Light, no station post, no crew.
  - `rating` (vibe): a 30-day aggregate. No reading, no confirms.

## 2. Files: one owner group each
F (foundation) merges first. Then A, B and C work in parallel against F's types. Each group owns its tests in §11.

**F**
- `src/data/air-spots.json` (§4).
- `src/data/courts-schedule.json`: new (§3).
- `src/lib/air.ts`: add `AirKind.role?/points?/payEvery?` and `AirSpot.shape?`; make `hours` optional.
- `src/lib/courts.ts`: new loader, plus the types `Court`, `Block`, `Fact`, `Conditions` and `BoardPayload`.
- `functions/_lib/air-kinds.mjs`: `kindRole()`.
- `functions/_lib/air-points.mjs`: `reportAwards({units, payEvery})`.
- `functions/_lib/air-store.ts` (§5): also export `withBylines`.
- `src/scripts/air-client.ts`: add only `export storedCode(spot)`. It reads `pc_air_code:<spot>` and never reads `?c=`.

**A**
- `functions/_lib/court-board.mjs` (§6).
- `functions/_lib/air-board-store.ts`.
- `functions/api/air/board.ts`.

**B**
- `src/pages/pickleball.astro`.
- `src/components/courts/{NowHero,ConditionsStrip,CourtCard,TapRow}.astro`.
- `src/scripts/pickleball-board.ts`.
- `src/pages/r/board.astro`: noindex, meta refresh.

**C**
- `functions/_lib/court-weather.mjs` (§8).
- `functions/_lib/court-conditions.ts`.
- `functions/og/pickleball.png.ts`: best-bet card, cached 60 s.
- `src/pages/r/index.astro`: a board link.
- `public/manifest.webmanifest`: a "Courts" shortcut.

**Untouched:** `AirSpot.astro`, `r/[spot].astro`, `court.astro`, `band.ts`, `marine-oracle.ts`, `burnoff.ts`.

## 3. `src/data/courts-schedule.json`
```json
{ "version": 1, "sources": {}, "courts": [{ "id": "el-segundo", "air": true, "order": 1, "name": "…", "short": "…", "city": "…",
    "shape": "…", "status": "open|closed", "facts": [], "hours": {}, "walkOn": {}, "blocks": [], "reserve": {"label": "…", "url": "…"} }],
  "private": [], "confirm": [] }
```
- **Provenance:** every fact, hours object and block carries `{"src": "ES2", "checked": "2026-09-28", "confidence": "verified|partial|unverified"}`.
- **Block shape:** `{"kind": "dropin|priority|closed", "label", "days": [1], "start": "17:00", "end": "19:00", "from", "until", "fee"}`.
- **Hours shape:** `{"rules": [{"days": [0,6], "open": "08:00", "close": "dusk"}], "else": "closed|unknown"}`.
- **Rendering**
  - `verified` renders.
  - `partial` renders with an "unconfirmed" tag.
  - `unverified` never renders.
  - A fact checked 45 or more days ago reads "may have changed".
  - Every line shows its source and date, e.g. "from rec.us, checked Sep 28".

**Sources**
- ES1: https://www.rec.us/organizations/el-segundo-recreation?search=pickleball
- ES2: https://www.rec.us/locations/7527b987-0f0b-473e-9680-0c90758f6dcd
- MB1: https://www.manhattanbeach.gov/departments/parks-and-recreation/tennis
- RB1: https://cms2.revize.com/revize/redondobeachca/Community%20Services/Alta%20Vista%20&%20Wilderness%20Park/Alta%20Vista%20Court%20Fees.pdf
- RB2: https://cms2.revize.com/revize/redondobeachca/Community%20Services/Pickleball/Perry%20Park%20Flyer%20(1).pdf
- RB3: https://www.redondo.org/departments/community_services/classes_and_activities/pickleball.php
- HW1: https://www.cityofhawthorne.org/departments/community-services/tennis-pickleball-courts
- HB1: https://www.hermosabeach.gov/Home/Components/FacilityDirectory/FacilityDirectory/125/248
- TO1: https://www.torranceca.gov/Our-Community/Classes-and-Programs/Classes-Programs/Adult-Sports/Pickleball
- CS1: https://calismash.com/
- LL1: https://love.life/pickleball (from the earlier research pass; not re-opened today)
- WD1: https://www.westdrift.com/experience/pickleball/ (from the earlier research pass; not re-opened today)
- MIKE: "Mike said". This is a label, not a source.

**Entries.** Each is verified unless marked, checked 2026-09-28. Times are LA local, 24-hour.

`courts` (paddle-rack; MB1, MIKE)
- 1501 N Redondo Ave.
- 5 open-play courts and 1 beginner court. Free. "Challenge Court" rules are posted.
- Hours: Sat–Sun 08:00–dusk; `else: "unknown"`.
- "Open during MBUSD breaks" shows as text only; it is not a computed rule.
- The paddle rack is the queue (MIKE).

`el-segundo` (reservation+drop-in; ES1, ES2)
- 401 Sheldon St. Open 08:00–22:00.
- `walkOn`: free when a court isn't reserved; programs take priority.
- Drop-ins:
  - Advanced: Mon 17–19, $5, Sep 7–Oct 26.
  - Advanced: Fri 09–12, $7, Sep 4–Oct 30.
  - 3.0: Sat/Sun 09–12, $7, Sep 5–Oct 31.
  - 3.5: Sat/Sun 15–17, $5, Sep 5–Oct 31.
- Paddle-saddle rotation. Pick up a wristband at the Checkout Building.
- Reserve on Rec.

`manhattan-heights` (reservation+drop-in; MB1)
- 1600 Manhattan Beach Blvd.
- Hours: Mon–Fri 08–21, Sat–Sun 08–20. The same page also says 8–8, so show that as a conflict.
- Drop-ins: Mon–Fri 08–12 (3 courts on Wednesday, 7 other days), Mon/Fri 18–21, Sat 17–20. $3 resident / $4 non-resident per day.
- Reservations: online only. Residents can book 4 days ahead, non-residents 3. $12 resident / $16 non-resident per hour.

`alta-vista` (reservation+drop-in; RB1, RB3)
- Drop-ins: Mon/Wed/Fri 08–12 and Tue/Thu 17–21. $5.
- A $25/yr membership is required.
- Reserve through recweb@redondo.org.

`perry` (first-come; RB2, RB3)
- 2301 Grant Ave. 3 courts, shared with basketball.
- "Paddle Saddle/Paddle Rack". Slippery when wet. Bring your own net.
- Priority blocks:
  - Pickleball 08–14 (**partial**: the flyer's day grid is an image).
  - Youth basketball Mon–Thu 17–21, Dec 1–Mar 31.

`anderson` (first-come; RB3)
- 1 court on a half basketball court.
- Priority block: Sportball, Sun 09:30–11.

`ainsworth` (first-come; HW1): 3851 W. El Segundo Blvd. 4 hybrid courts, nets provided.

`hollyglen` (first-come; HW1): 5255 W. 137th St. 4 hybrid courts, bring your own net.

`ramona` (first-come; HW1): 4662 W. 136th St. 2 hybrid courts, bring your own net.

`torrance-dee` (reservation+drop-in; TO1)
- Dee Hardison Sports Center, 2400 Jefferson St.
- Drop-in Mon/Wed 10–14. $5, capped at 30 players, 18+.
- Register on torrance.rec.us.

`kelly` (HB1; `air: false`): 861 Valley Dr, Hermosa Beach. 4 courts, closed for renovation.

**`private`**
- California Smash (CS1): 9 indoor courts, 815 N Nash St. Mon–Fri 8–10, Sat 9–9, Sun 9–7. Book on CourtReserve.
- Love.Life (LL1, partial): 3 indoor courts, members only.
- Westdrift (WD1, partial): hotel courts.

**`confirm`** (open questions, shown as "Help us confirm", never as facts)
- MBMS: weekday access, the lot, restrooms, lights.
- El Segundo: lights, parking, league nights, the **November schedule**, and the Places2Play Thu/Sat claim.
- Manhattan Heights: which closing hour is right.
- Alta Vista: address and hours.
- Perry: the priority grid.
- Anderson: address.
- Hawthorne courts: hours.
- Not covered yet: Live Oak, Mira Costa, Torrance Wilson (outdoor), Westchester, Culver City, Lawndale.
- Parking, at every court.

## 4. `air-spots.json`
- **`courts`:** keep `wait` as the first key, because `primaryKind` depends on key order. Add the `parking` and `vibe` kinds, and `"shape": "paddle-rack"`.
- **New spots**
  - Channel `CRT`, color `#3B6D11`, noun 0.
  - mhz from 7.600 through 8.400 in steps of 0.100, in §3 order. That keeps them clear of NET (7.200 ±4 steps) and COURT (7.500).
  - Set `hours` only where verified. A spot without it never counts First Light.
- **`wait` at reservation+drop-in spots:** "Paddles in the rack?" Values: `booked` ("No open court"), `0` ("0 · walk on"), `1-4`, `5-8`, `9+`, `cant`.
- **`wait` at first-come spots:** same values, except `taken` ("Another sport on it") replaces `booked`. Extras: `wind`, `damp`, `no-net`.
- **`parking`:** `role: "side"`, `decayMin: 60`, `points: 3`. Values: `easy`, `tight`, `full`, `paid`, `cant`.
- **`vibe`:** "How's the court?" `role: "rating"`, `decayMin: 43200`, `points: 2`, `payEvery: "week"`. Values:
  - `pancake`: "Pancake · glass smooth"
  - `solid`: "Solid · no complaints"
  - `character`: "Character · cracks, sad net"
  - `survival`: "Survival Mode · sand, puddles, prayer"
  - `condemned`: "Condemned · don't"

  Extras: `no-windscreen`, `no-shade`, `lights-out`, `net-loose`, `restrooms-locked`.

## 5. Store changes (F): role gates only
- **`fileReport`**
  - Call `firstLightOpen` and `onAir` only when the kind's role is `live`.
  - Award `units: cfg.points ?? 6`.
  - With `payEvery: 'week'`, the award ref is `spot:kind:w<weekOf(day)>`.
  - `cant` still pays 1.
- **`confirmReport`**
  - Confirming a `rating` kind returns 400 `not-confirmable`.
  - Call `onAir` only for `live` kinds.
- **Unchanged:** `targetOf`, `stationsPayload`, `GET /api/air/[spot]`.
- **Why no migration is needed**
  - `air_reports.kind` is free TEXT (migration 0023).
  - The new kinds pay under the existing `report` action, with the kind in the ref.
  - Non-live kinds never write crew or broadcast rows.

## 6. Pure functions (A): `court-board.mjs`
- `showable(fact, now)` → `{show, tag}`.
- `blocksOn(court, day)`: filters by weekday and the inclusive `from`..`until` range.
- `sessionsNow(court, now, sunsetMin)` → `[{block, until}]`.
- `nextSession(court, now, sunsetMin, days = 7)` → `{block, when: "Sat 9 AM"}` or null. It never looks past `until`.
- `openState(court, now, sunsetMin)` → `open`, `closed` or `unknown`. It resolves `dusk`.
- `groupEvidence(rows, confirms)` → a Map keyed by `spot:kind`.
- `qualityVibe(rows, now)`
  - Reads on-site, `ok` page rows from the last 30 days, keeping the latest per `user_id` (else `pid_hash`).
  - Returns null with fewer than 3 ratings.
  - Otherwise returns `{mode, label, runnerUp, n, chips}`, where `runnerUp` shows only at 30% or more. No star averages.
- `bestBet(cards)` takes the first rule that matches; ties go to `order`:
  1. A live `wait` reading of `0`, `1-4`, `5-8` or `9+`, ranked by bucket, then support, then age.
  2. A drop-in running now.
  3. An open court with a displayed `walkOn` fact.
  4. The soonest next session.

  It ignores vibe, never picks `locked`, `booked` or `taken`, and never infers a wait.
- `boardSummary(input)` → the `BoardPayload`, with no hashes.

## 7. API (A): `GET /api/air/board`
`air-board-store.ts` runs one `db.batch`. Every statement is `.prepare(literal).bind(…)`, as the existing source test enforces:
1. `wait` and `parking` reports from the last 90 min, or kept alive by an on-site `still` confirm in the last 60 min.
2. The confirms on those reports.
3. Today's last on-site report per spot and kind.
4. Vibe rows from the last 30 days.
5. Validators today: `COUNT(DISTINCT pid_hash)` and `COUNT(DISTINCT spot)` over on-site reports UNION on-site `still` confirms. Only the counts leave the batch.

Then: `withBylines`, then `readConditions(now)` from C, then `boardSummary`.

**Payload**
- `serverTime`
- `validatorsToday: {phones, courts}`
- `conditions: {wind: {mph, gustMph, dir, words}, tempF, heat, wet, marine: {label, openedAt}, sunset, next3h}`. Any part may be null.
- `best: {court, reason: live|dropin|open|next, line}`, e.g. "Advanced drop-in now until 7 PM · $5 · no reports yet".
- `courts[]: {id, status, now[], next, readings: {wait, parking}, last: {wait, parking}, vibe}`. Each reading is `{value, label, status, support, reportId, ageMin, bars, liveUntil, bylines, crew}`.

**Behavior**
- Cache: 30 s in `caches.default`, `Cache-Control: public, max-age=30`. Nothing in the response is per-viewer.
- No DB: 503 with `no-store`.
- Weather feeds down: those fields are null and the response is still 200.

## 8. Conditions (C)
**`court-weather.mjs`**
- `metarNow(text)` takes the newest AWC row and returns `{mph, gustMph, dir, tempF, wet, observedAt}`.
  - `mph` is knots × 1.15078.
  - `gustMph` may be null.
  - `dir` may be `VRB`.
  - `wet` is true when the row matches `/DZ|RA/`.
- `windWords`: under 15 mph, nothing. 15–20: "lobs are a gamble". 20–25: "dinks only". 25+: "the ball is in Hawthorne".
- `heatWords`: over 85°F, "court runs 10–20° hotter than the air".
- `wetWords`: "wet paint, no traction".
- `nwsNext3h` → `{maxWindMph, maxPop, short}` or null.

**`court-conditions.ts`**
- Calls `awcUrl(3)` and `answerMarine({date: null})`, cached 300 s with a local `edgeCached`.
- Calls NWS with a 2.5 s timeout and a User-Agent, cached 600 s.
- Sunset comes from `sunTimes(…, EL_SEGUNDO)`.
- Each source sits in its own try, so one failure doesn't take down the others.
- The strip is labeled "KLAX".

## 9. Page (B)
- **Layout:** `BlockLayout`, `og:image` `/og/pickleball.png`. Phone-first at 375 px: 16 px gutters, no sideways scroll, hard corners, Inter and mono, CRT color.
- **Sections, top to bottom**
  1. **Masthead:** "THE PICKLEBALL BOARD · Mon 5:12 PM", a live dot, `courts-stamp.webp`, and "12 validators today across 4 courts".
  2. **NowHero.**
  3. **ConditionsStrip.**
  4. **CourtCards,** best bet first. Each card shows:
     - the reading with its signal bars;
     - "validated by N" with `still-true.webp`;
     - now/next, with source and date;
     - facts that pass `showable()`;
     - parking;
     - vibe ("Mostly Solid, some Character · 7 ratings" or "Be the first to rate");
     - a Book link;
     - a Report link (via `spotUrl(id)`).
  5. **Help us confirm.**
  6. **Private and paid.**
  7. **Footer:** "Reporters earn points, never cash, and never for what a report says."
- **Behavior:** polls every 30 s while visible, and a POST response updates its own card right away. No maps, no photos.

## 10. Validators and tap rows (B)
- **Still true? (Yes / Changed)** appears on live `wait` and `parking` readings that have a `reportId`.
  - It POSTs `/api/air/confirm` with `{reportId, verdict, device: deviceId(), code: storedCode(id)}`.
  - **Never call `codeFor()` here:** it reads `?c=` from the URL and would store that code under the wrong spot.
  - When the response has `onsite: false`, show in grey: "Counted from away · open your group link at the court."
  - After Changed, `wait` links to `/r/<id>` and `parking` opens its TapRow.
- **TapRow** (parking, vibe) POSTs `/api/air/<id>` with `{kind, value, extras (up to 2 vibe chips), device, code, observedAt}`.
  - On success it shows `+N` and any badge art.
  - A failed send shows "Didn't send. Tap again."
- **Fallbacks**
  - An expired reading shows Report instead of Still true.
  - A spot with no code seeded yet shows "no on-site code yet".

## 11. Tests
**F**
- `courts.wait` values are unchanged, and `wait` is still the first kind.
- Every spot has a unique mhz, none within NET ±4.
- A weekly award pays only once.
- A parking report at 06:05 gets no First Light, no broadcast, no VISITS write and no crew.
- A vibe confirm returns 400.
- Every existing `air-api` test passes unchanged.
- Schedule lint: every fact has `src`, `checked` and `confidence`; every air id resolves to a spot; `until >= from`.

**A**
- Mon 17:00 is in session; 19:00 is not.
- Oct 27 shows no Monday block.
- Confidence: `unverified` is hidden, `partial` is tagged, and a fact 46 days old is stale.
- `dusk` resolves to sunset, and the DST change on 2026-11-01 is handled.
- Vibe: under 3 ratings returns null; one rating per phone; remote and agent rows are ignored.
- A locked gate loses to a drop-in; a live `0` beats a drop-in.
- The API under `node:sqlite` returns no `pid_hash`, sets the cache header, and returns 503 with no DB.

**B**
- No `codeFor(` calls.
- Every storage access is wrapped in `try`.
- Links go through `spotUrl()`.
- `/r/board` is noindex.

**C**
- Knots convert to mph.
- `VRB` wind direction and a null gust are handled.
- `DZ` counts as wet.
- An NWS failure returns null.
- The OG card renders from an empty board.

## 12. Verification ladder
1. Land F on a fresh `origin/main` worktree and run `node --test`.
2. Merge A, B and C. Run `npm test`, then `npm run build`, then `node --check` on the inline scripts under `dist/pickleball/`.
3. `dist/r/courts/` and `dist/court/` must be identical to a pre-PR build.
4. Run `wrangler pages dev` against a local D1 at migration 0023:
   - An empty DB returns 200 with null readings.
   - Seeded rows show readings, validators and vibe.
   - At 375 px nothing scrolls sideways, and Still true works.
5. Merge with a single `gh pr merge`, then verify the remote SHA.
6. In production:
   - Check `/pickleball`, `/api/air/board` (including headers), `/og/pickleball.png` and `/r/el-segundo`.
   - Send one test confirm, then set its rows to `status='removed'`.
7. Optional: Mike seeds spot codes with `scripts/air-codes.mjs`.

## 13. Risks
- **Court Call may hit a locked gate.** Friday 7:30 AM at MBMS is outside the city's listed public hours there, so "Gate's locked" may be the usual Friday answer. Mike should confirm.
- **El Segundo goes quiet after October.** The drop-in blocks end Oct 31, and the board shows none until a JSON PR adds the November schedule.
- **Spots without codes stay empty.** They can only take remote reports, so they show no readings and no validators.
- **More stations on the dial.** Nine new stations appear on `/r`. Non-live kinds never post.
- **D1 load.** Five statements per cache miss. The unindexed `observed_at` scan is fine at current volume.
- **Shared daily cap.** Parking and vibe points count against the same daily cap of 30.
- **Parallel agents.** Cherry-pick onto a fresh `origin/main` before pushing.

---

## Fable design

# THE PICKLEBALL BOARD

Design for PointCast Field Reports · 2026-09-28.

## 1. Route and name

**`/pickleball`**, titled THE PICKLEBALL BOARD. Not `/courts`: `/court` already means Manhattan Middle (the `/r/courts` alias in `src/pages/court.astro`), and a `/court` vs `/courts` pair is a typo trap at the fence. `/pickleball` is what you say out loud and what people search. The reserved `/r/board` id 301s to it.

The job: **"Where can I play right now?"** Everything on the page is either an answer to that or a way to make the answer more trustworthy.

## 2. Mobile layout at 375px, top to bottom

1. **Masthead** — "THE PICKLEBALL BOARD · Mon 5:12 PM" in the Field Reports mono topline, live dot when any spot has a fresh on-site reading.
2. **NOW hero** (one channel-colored card): the best bet and its reason, built from three inputs in order — a live on-site reading inside its decay window, then a published block running now, then open hours. "MANHATTAN MIDDLE · open, 1–4 in the rack · validated by 3 · wind 6 mph" or "EL SEGUNDO REC · Advanced drop-in now until 7 PM · no reports yet". With nothing live and nothing scheduled: "No live reports. Next: 3.0 drop-in Sat 9 AM at Rec Park." The hero never guesses a wait.
3. **Conditions strip** (horizontal scroll, mono): `WIND 6 SW · G 11` · `68°F` · `MARINE LAYER burned off 10:40` · `SUNSET 6:41` · `NEXT 3H clear`. Wind and gust come from the KLAX METAR JSON `src/lib/marine-oracle.ts` already fetches (`wspd/wgst/wdir` ride beside `clouds`); temp and sunset from `/api/weather`; burn-off from the `burnoff.ts` rule; next 3 hours from NWS `api.weather.gov/points/33.9214,-118.4061` → `forecastHourly`, cached 10 min in `caches.default` like `/api/weather`. Plain words under the numbers: under 15 mph nothing; 15–20 "lobs are a gamble"; 25+ "the ball is in Hawthorne". Above 85°F: "court runs 10–20° hotter than the air". Drizzle in the METAR: "wet paint, no traction".
4. **Court cards**, one per spot, sorted by NOW rank. Each: name + short, shape tag, reading line with signal bars, schedule line, parking line, vibe line, the **Still true?** strip, and a "Report" link into `/r/[spot]`.
5. **Help us confirm** — unverified spots as one-liners naming what is missing.
6. **Private and paid** — California Smash, Love.Life, Westdrift as plain listings: no questions, no rating.
7. Footer: "Reporters earn points, never cash, and never for what a report says."

No map, no photos, no imagery of places or people. Noun sprites and block grammar only.

## 3. Court shapes

A `shape` in each spot's config picks the question set and the card's schedule block. Four shapes:

| Shape | Spots | One-tap question(s) | Card shows |
|---|---|---|---|
| `paddle-rack` | Manhattan Middle (live), Perry Park (Redondo, "Paddle Saddle" per the city flyer) | "Paddles in the rack?" unchanged: Gate's locked / 0 walk on / 1–4 / 5–8 / 9+ / Can't say | Reading; public hours from source ("Mon–Fri 4 PM–dusk, weekends 8 AM–dusk · from the city, checked Sep 28"); no reserve link |
| `reservation+drop-in` | El Segundo Rec Park, Alta Vista (Redondo), Manhattan Heights | Inside a published drop-in block: "Drop-in running? How many waiting?" — Not running / 0 / 1–4 / 5–8 / 9+ / Can't say. Outside one: "Courts free to walk on?" — All booked / 1–2 open / Mostly open / Can't say | Current block "Advanced drop-in NOW until 7 PM · Mon · $5", next block today, Book link (Rec / WebTrac / ActiveCommunities), the paddle-saddle note |
| `first-come` | Anderson Park, Ainsworth, Hollyglen | "How many waiting?" 0 / 1–4 / 5–8 / 9+ / Can't say, plus a `nets-up` extra where the city provides none | Priority windows if published; "BYO net" where sourced |
| `mixed` | Torrance Wilson Park, Live Oak | "Free to walk on?" only, unscheduled | Reserve link plus walk-on reading; a schedule line only once a block is sourced |

Schedule lines render only from the JSON in section 7. El Segundo's Monday 5–7 and Friday 9–12 advanced sessions are confirmed on rec.us (opened directly, $5 and $7). The Places2Play "Thu 6–9 / Sat 9–12" claim conflicts with it and is not shown.

## 4. Quality: one funny tap

Kind `vibe`, question "How's the court?":

- **Pancake** — glass smooth
- **Solid** — no complaints
- **Character** — cracks, dead spots, sad net
- **Survival Mode** — sand, puddles, prayer
- **Condemned** — don't

Optional chips, pick up to two, fixed list, never free text: `no windscreen` · `no shade` · `lights out` · `net loose` · `restrooms locked`.

Aggregation: rolling 30 days, on-site rows only, latest per phone, one per phone per 7 days. Shown at 3+ ratings as a vibe line: "Mostly Solid, some Character · 7 ratings · lights out ×3". Under 3: "Be the first to rate." Never a star average: the bucket is the mode, and the runner-up shows only at 30%+.

Points: 2, flat, once per spot per 7 days, on site only. Condemned pays the same as Pancake. Ratings never rank spots; the NOW hero ignores vibe.

## 5. Parking

Kind `parking`, "Parking?": Easy / Tight / Full / Paid / Can't say. Decay 60 min, same bars, same grey "Last report 4:10: tight" after. Typical-by-hour shows only after 3+ reports in that hour bucket across 4+ days (the Paddle Register `MIN_SHOWN` rule). Static parking facts stay sourced or say UNVERIFIED — Manhattan Middle: "street parking; lot size unverified".

## 6. Validators

- **Still true?** on every card with a live reading, inline: Yes / Changed. It POSTs to the existing `/api/air/confirm`. On site (the phone holds `pc_air_code:<spot>`) it pays 3 and counts; remote shows grey, pays 0, never counts toward agreement or the crew.
- **Validator count** on the reading line: "1–4 in the rack · validated by 3". Reporters and on-site "still" confirms both count, the existing `reading()` support rule.
- **Still True badge** (10 on-site confirmations, already MVP) shows as a small stamp by your name on the board.
- **Validators today**: one line under the masthead, "12 validators today across 4 courts".
- **Agents never validate.** `air_confirms` rejects any `source` other than `page`. Agents may file schedule re-checks (section 7) and remote readings marked `agent:<name>`, which render grey and lose to any human on-site row.
- A card whose last on-site reading has decayed swaps "Still true?" for "Report": you cannot validate a stale reading.

## 7. Data

**Schedules**: `src/data/air-schedules.json`, keyed by spot:

```json
"el-segundo": {
  "blocks": [{ "kind": "dropin", "level": "Advanced", "days": [1], "start": "17:00", "end": "19:00", "fee": "$5",
    "source": "https://www.rec.us/organizations/el-segundo-recreation?search=pickleball",
    "checked": "2026-09-28", "by": "cc", "confidence": "verified" }],
  "hours": { "open": "08:00", "close": "22:00", "source": "https://www.rec.us/locations/7527b987-…", "checked": "2026-09-28" },
  "reserve": { "label": "Book on Rec", "url": "https://www.rec.us/organizations/el-segundo-recreation" }
}
```

Block kinds: `dropin`, `league` (blocks courts, asks nothing), `priority`, `closed` (Kelly Courts renovation). Only `verified` renders as a schedule line; `partial` renders with an "unconfirmed" tag; `unverified` never renders. A block older than 45 days reads "checked Sep 28, may have changed". The agent night shift (`night_shift_claim`) re-opens each source URL, bumps `checked` in a PR and files a diff line; it never touches D1.

**Spots config**: `kinds` is already a map, so `wait`, `parking` and `vibe` sit side by side; `primaryKind()` keeps `wait` first so `/r/[spot]` is unchanged. Add `board: { shape, address, addressSource, parkingNote, lights, links }`. Each new spot claims a CRT frequency and gets `air_codes` seeded only when Mike can post its code; until then its reports are remote and the card says "no on-site code yet".

**Add now** (verified or partial): `el-segundo` Rec Park (verified), `perry` (verified), `alta-vista` (verified), `anderson` (verified), `ainsworth` and `hollyglen` (verified), `manhattan-heights` (partial), `torrance-wilson` (partial), `westchester` (partial). Kelly Courts as a `closed` card.

**Help us confirm**: Live Oak (drop-in vs reservation-only, court lights), Mira Costa (hours, access), Lawndale (any court at all), Manhattan Middle's lot and restrooms, El Segundo's lights and parking.

## 8. Ship order

**PR 1 — the board.** `/pickleball` page, conditions strip (wind, temp, sunset, burn-off; NWS optional), `air-schedules.json` with the verified blocks, new spots with `wait` and `parking` kinds, inline Still true?, `/og/pickleball.png`. `/r/courts`, `court.astro`, `AirSpot.astro` and `air-client.ts` are not touched; the board links into them. Friday's flow runs exactly as built.

**PR 2 — vibe and the night shift.** The `vibe` kind and its 30-day line, chips, the validators-today line, the schedule re-check job, partial spots with "unconfirmed" tags, a "Courts today" slot in the Morning Edition.

**PR 3 — the hero gets smart.** NWS next-3h in the rank, "typical Monday 5 PM" history at 4+ same-weekday days, a kind switcher on `/r/[spot]` so a spot page can ask parking after wait, agent-filed schedule diffs on the dial.

## 9. Honesty rules

1. No schedule renders without a `source` URL and a `checked` date, and the line says both: "from rec.us, checked Sep 28".
2. Conflicts show as conflicts or not at all: Rec Park hours read "8 AM–10 PM on Rec; the city page says 9 PM".
3. "Mike said" is a label, not a source; it stays on until a page confirms it (Mon/Fri advanced is now confirmed).
4. UNVERIFIED facts never appear as facts; they live in "help us confirm".
5. Readings are only what phones reported: no editor guess, no wait inferred from weather.
6. Every rating pays the same, and the hero ignores ratings.
7. No people, no photos of real courts, no maps with pins: Nouns, blocks, mono.
8. Agents are labeled `agent:<name>`, shown grey, and never validate.

---

## Conditions, quality, parking research

# PointCast Field Reports — Conditions, Parking & Quality Research

## 1. Weather that actually matters outdoors

**Wind** is the dominant variable — a pickleball is a 26g whiffle ball, uniquely wind-sensitive. Consensus threshold: comfortable play under **15 mph**; **15–20 mph** visibly distorts trajectory (higher arc against the wind, flatter/faster with it); most groups stop at **25 mph+** as the ball becomes uncontrollable. ([The Dink](https://www.thedinkpickleball.com/is-it-better-to-play-with-or-against-the-wind-in-pickleball-according-to-science/), [The Skilled Pickle](https://www.theskilledpickle.com/blog/how-much-wind-is-too-much-for-pickleball), [Hudef](https://hudefsport.com/blogs/news-1/good-wind-resist-pickleball-ball-breeze-ok-15mph-guide))

**Heat**: most players are fine to ~85°F air temp; risk rises past a 90°F heat index, gets dangerous past 95°F. Hard courts run **10–20°F hotter than air temp** — a real number worth surfacing since METAR only reports air temp. ([Baptist Health](https://www.baptisthealth.com/blog/sports-medicine/safe-pickleball-play-during-hot-weather), [PB5Star](https://www.pb5star.com/a/blog/when-is-it-too-hot-to-play-pickleball-safety-tips-for-summer))

**Sun glare** is worst at low sun angle (dawn/dusk), when it sits at eye level over the net — a straight function of your already-computed sunset time plus azimuth, not something reports need to ask about directly.

**Wet courts**: even light drizzle is broadly considered unsafe — a thin water film kills shoe traction regardless of skill; the practical field test cited repeatedly is "can you slide a shoe on the paint with zero resistance." ([Pickleball Union](https://pickleballunion.com/can-you-play-pickleball-in-the-rain/), [PB5Star](https://www.pb5star.com/a/blog/wet-court-considerations-can-you-play-pickleball-in-the-rain)) — this is exactly what a marine-layer drizzle morning at Grand Ave/courts nearby would produce.

**Free data PointCast can already read:**
- **Wind (speed/gust/dir)**: KLAX METAR via aviationweather.gov — already the source in `burnoff.ts` for the ceiling record; same feed carries wind fields.
- **Sunset/sun angle**: already computed (`sky.ts`/`sunTimes`).
- **Hourly forecast (temp, precip, sky)**: NWS gridpoint API. Pattern: `GET https://api.weather.gov/points/{lat},{lon}` → response's `properties.forecastHourly` and `properties.forecastGridData` give the resolved office+gridX/Y URLs to call directly. El Segundo: `https://api.weather.gov/points/33.9214,-118.4061`. Manhattan Beach: `https://api.weather.gov/points/33.8889,-118.4053`. ([api.weather.gov gridpoints doc](https://weather-gov.github.io/api/gridpoints))

## 2. A funny, 2-second court QUALITY tap

Single-tap bucket (funny, honest, no essay):
- 🥞 **Pancake** — glass-smooth, brand new
- 🎾 **Solid** — normal court, no complaints
- 🕳️ **Character** — cracks, dead spots, net's a little sad
- 🌊 **Survival Mode** — sand traps, puddle ponds, bring a prayer
- 🚫 **Condemned** — don't. just don't

Optional chips (pick up to 2): `no windscreen` · `no shade` · `lights work` / `lights out` · `net too loose` · `restrooms locked`. This mirrors how court-finder apps already structure the data (surface, lighting, amenities as separate facets rather than one score) — Pickleheads and Bounce both list surface/lighting/parking/amenities as discrete fields rather than a star average. ([AssetWorks on crack inspection](https://www.assetworks.com/eam/blog/eam-optimize-pickleball-court-maintenance-with-asset-management-software/), general court-finder pattern via [Pickleheads](https://www.pickleheads.com/courts/us/california/manhattan-beach/manhattan-beach-middle-school))

## 3. Parking as a reportable condition

Bucket: **easy / tight / full / paid**, same tap-and-decay pattern as the existing kinds.

**Manhattan Middle School (1501 N Redondo Ave)**: street parking is the norm; reviewers note it gets tight at peak hours, no dedicated large lot confirmed. UNVERIFIED lot size — sources conflict ("free curb parking" vs. "limited"). ([Pickleheads](https://www.pickleheads.com/courts/us/california/manhattan-beach/manhattan-beach-middle-school), [Yelp](https://www.yelp.com/biz/manhattan-beach-middle-school-pickleball-courts-manhattan-beach))

**El Segundo Recreation Park (401 Sheldon St)**: has both a private lot and street parking, described as ample. ([Places2Play](https://www.places2play.org/place?id=8235), [Yelp Recreation Park](https://www.yelp.com/biz/recreation-park-el-segundo))

**El Segundo court structure — reservation + drop-in**: 8 courts, reservable 7 days/week 8am–9pm (residents book 10 days out, non-residents 7); confirmed fee drop-in sessions are **Thursday 6–9pm** and **Saturday 9am–noon**. ([Places2Play](https://www.places2play.org/place?id=8235)) The Monday 5–7pm / Friday 9–12 **advanced** drop-in Mike described did not surface in any indexed source — the city's own program page 403'd on fetch — so tag that specific slot **"Mike said,"** not verified against ESREC.org; the ESREC pickleball page (`elsegundorecparks.gov/.../adult-sports/pickleball`) is the source to hand a night-shift job to confirm directly and reconcile against the Thu/Sat pattern found here.

Sources: all inline above.
