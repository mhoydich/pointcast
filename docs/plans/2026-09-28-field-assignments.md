# Field Report Assignments — Calls and the Desk

2026-09-28. Opus spec (final) first; Fable design, desk naming, research appended.

Calls

- **Phase 1 pays points and a stamp, never cash.** Every /r page and edition promises "Points never cash, and never for what a report says." Phase 1 keeps that true and needs no key, secret or signature from Mike.
- **Only the house creates assignments.** The gate is the director session that already exists: `hasDirectorDeskAccess` in `src/lib/director-access.ts`, already used by `functions/api/director/queue.ts`. There is no new ASSIGN_KEY, so there is no secret to set and no bearer token in a page.
- **An assignment is a template, a date and a seat count.** There are three templates, all on the two question kinds that exist today. No free text.
- **A fill pays on the same proof a report pays on:** the spot code, inside the window. A second phone's confirm adds a WITNESSED mark but does not hold up the reward. With only about 10 people in town, making a witness mandatory means the 6 AM check never pays.
- **Each fill pays a flat +10.** This sits outside the 30/day report cap, with its own cap of 2 fills a day. Mike decides how many seats exist, so nobody can farm it.
- **The stamp is the `air_assignment_fills` row, not an `air_stamps` badge.** §3.6 explains why.
- **Cash and sponsors are not built.** Both need Mike's decisions and an attorney/CPA first (§2).

## 1. Trimmed from the design

| Design item | Call | Why |
|---|---|---|
| Fog checked against the KLAX airport station | Cut | It pays for matching the agent's answer, which is paying for content. Grand Ave fog is not KLAX fog, which is why the spot exists. |
| Reward waits for a confirm | Mark only, no wait | Early windows with one person would never pay. The confirm screen also shows the answer, which invites rubber-stamping. |
| Reserved claims, holds, no-show down-rank, weekly cap, cooldowns | Cut | That is a reputation system for 10 people. Punishing no-shows also looks like employer control under AB5 (California's employee-vs-contractor test). Open seats plus the daily cap are enough when Mike sets the supply. |
| Reward 10/15/20, seats 1–5 | Flat 10, seats 1–3 | Five seats is half the town. Tiered pay invites "why does this one pay more." |
| 140-character notes | Cut | Public free text ("go see if X is there"). The PRD keeps free text out. |
| "Can't say" fills a seat | Never | Same rule as First Light. The report still earns its normal 1 point. |
| Parking and drop-in templates | Wait for the kinds | Neither question kind exists in `air-spots.json` yet. |
| Agents create and fill | Cut | Agents would spend house points automatically. Agent reports are never on site anyway. |
| `air_assignment_claims`, `air_assignment_events` | Cut | With points only, `created_by`, `voided_at` and the fill rows are the audit trail. An events log comes with money. |
| Tier B: tez payroll | Not built | It breaks the published "never cash" line. Mike would have to hold W-9s (tax ID numbers) and file a 1099 once someone passes $2,000 a year (the 2026 threshold). Work directed to a set time and place is a closer AB5 question than casual reports. Paying minors needs work permits. |
| Tier C: sponsors | Not built, not shown greyed out | Holding sponsor money counts as money transmission. A greyed-out control still reads as a promise. |
| Edition line, preview card, MCP tool | Later | Editions only freeze once PR 2 ships. The edition line would name signed-in @handles only. |

## 2. Phase 1, later, and what needs Mike

| Stage | What | Needs Mike |
|---|---|---|
| **1, now** | House creates. Open seats. +10 and an ASSIGNMENT stamp. WITNESSED mark. Strip on /r, spot-page badge, /r/me, /r/assign | Nothing new. He signs in with his broadcaster/Kukai session to post. Migration 0024 goes out before the Pages deploy. |
| 1.5 | Assignments addressed to a person ("for @jen"), edition credit, MCP read tool | A yes on addressed assignments |
| B, cash | Mike pays witnessed, reviewed fills in tez from Kukai and pastes the transaction hash into a new `air_payouts` table, behind a gate that requires a recent sign-in | (1) Retire the "never cash" copy. (2) Attorney: AB5, an 18+ self-certification, no prize draws. (3) CPA: W-9s kept outside D1, 1099-NEC filing. (4) A budget. (5) He signs every batch himself; agents never hold the key. |
| C, sponsors | Stripe Connect on Mike's account pays reporters directly | Sponsor terms from an attorney, Connect onboarding. PointCast never holds the funds. |
| Not payment rails | DRUM vouchers, HELLO faucet | DRUM has no USD value and would need a new signing key. HELLO is worthless by design. |

Before stage 1.5, run a kill test: after four weeks, compare filled seats with offered seats. If assignments don't fill, stop adding templates.

## 3. Build spec (phase 1)

Repo is `/Users/michaelhoydich/pc-fr-courts`. I checked remote `main` at `bfa264ce`: migrations end at `0023_air.sql`, and no open PR updated since 09-20 touches 0024. Check again when the PR opens.

### 3.1 Config: `src/data/air-spots.json`

- Add `"assign"` to `reserved`. The exact-list assertion at `tests/air-kinds.test.mjs:99` will fail until it includes `"assign"`.
- Add the templates below and extend `AirConfig` in `src/lib/air.ts`:

```json
"assignTemplates": [
  { "id": "rack-at-open",    "spot": "courts", "kind": "wait", "label": "Rack at open",    "start": "06:00", "min": 60,  "seats": 2 },
  { "id": "rack-after-work", "spot": "courts", "kind": "wait", "label": "Rack after work", "start": "17:00", "min": 60,  "seats": 2 },
  { "id": "pier-early",      "spot": "beach",  "kind": "fog",  "label": "Pier, early",     "start": "05:30", "min": 120, "seats": 2 }
]
```

### 3.2 `migrations/auth/0024_air_assignments.sql`

```sql
CREATE TABLE IF NOT EXISTS air_assignments (
  id TEXT PRIMARY KEY,                -- newAirId('aa')
  spot TEXT NOT NULL, kind TEXT NOT NULL, template TEXT NOT NULL,
  starts_at INTEGER NOT NULL, ends_at INTEGER NOT NULL,
  seats INTEGER NOT NULL CHECK (seats BETWEEN 1 AND 3),
  reward INTEGER NOT NULL CHECK (reward BETWEEN 0 AND 10),
  created_by TEXT NOT NULL,           -- 'user:<id>'
  created_at INTEGER NOT NULL,
  voided_at INTEGER, void_reason TEXT,
  CHECK (ends_at > starts_at AND ends_at - starts_at <= 14400000)
);
CREATE INDEX IF NOT EXISTS air_assignments_live ON air_assignments(spot, kind, ends_at);

-- One row = one filled seat = the ASSIGNMENT stamp. net is 'user:<id>' or the
-- report's ip_hash (netOf in air-reading.mjs); no view ever selects it.
CREATE TABLE IF NOT EXISTS air_assignment_fills (
  assignment_id TEXT NOT NULL,
  report_id TEXT NOT NULL UNIQUE,
  owner TEXT NOT NULL, net TEXT NOT NULL, day TEXT NOT NULL,
  reward INTEGER NOT NULL CHECK (reward >= 0),
  witnessed_at INTEGER,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (assignment_id, owner),
  UNIQUE (assignment_id, net)
);
CREATE INDEX IF NOT EXISTS air_assignment_fills_owner ON air_assignment_fills(owner, day);
```

Apply it to AUTH_DB with `wrangler d1 execute` before the Pages deploy. Add it to `MIGRATIONS` at `tests/air-api.test.mjs:99`.

### 3.3 `functions/_lib/air-assign.mjs` (pure functions)

- **Constants:** `ASSIGN_REWARD=10`, `FILLS_PER_DAY=2`, `OPEN_PER_SPOT=3`, `CREATES_PER_DAY=20`, `MAX_AHEAD_DAYS=7`.
- **`laWallToMs(day,'HH:MM')`:** converts LA wall-clock time to epoch ms. It must handle daylight saving: guess, then correct twice using `laParts`.
- **`parseAssign(config, body, now)`:** returns `{template, spot, kind, startsAt, endsAt, seats, reward}` or `{reason}`. It checks five things:
  - the template exists;
  - the day is 0–7 days ahead;
  - the start time (template default) is inside the spot's open hours (`inHours(spot.hours)`);
  - `endsAt = startsAt + min` is later than now;
  - seats are 1–3.
- **`parseVoid(body)`:** returns `{id, reason}`, with the reason capped at 80 characters.
- **`canFill({onsite, value})`:** `onsite && value !== 'cant'`, checked before running any SQL.
- **`assignStampText(label, short, day)`:** returns text like "ASSIGNMENT · RACK AT OPEN · MANHATTAN MIDDLE · FRI 02 OCT 2026".
- **Reasons:** `bad-template`, `bad-day`, `bad-start`, `bad-seats`, `too-many-open`, `forbidden`, `not-found`.

### 3.4 `functions/_lib/air-store.ts`

Wrap every assignment statement in its own `try/catch` and keep it out of `loadSpot`'s batch. **An assignment failure must never block a report, a confirm or the spot page.** Today `fileReport`'s outer catch turns any error into a 503.

**Fill.** In `fileReport`, inside `if (isOnsite)` and after points, run this when `canFill` is true. Because `report_id` is UNIQUE, it can safely run again on retries, same-slot replacements, a remote report turning on-site, and a `cant` becoming a real answer.

```sql
INSERT OR IGNORE INTO air_assignment_fills (assignment_id, report_id, owner, net, day, reward, created_at)
SELECT a.id, ?1, ?2, ?3, ?4, a.reward, ?5 FROM air_assignments a
WHERE a.spot = ?6 AND a.kind = ?7 AND a.voided_at IS NULL
  AND a.starts_at <= ?8 AND a.ends_at > ?8 AND a.created_by != ?2
  AND (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.assignment_id = a.id) < a.seats
  AND NOT EXISTS (SELECT 1 FROM air_assignment_fills f WHERE f.assignment_id = a.id AND (f.owner = ?2 OR f.net = ?3))
  AND NOT EXISTS (SELECT 1 FROM air_assignment_fills f WHERE f.report_id = ?1)
  AND (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.owner = ?2 AND f.day = ?4) < 2
ORDER BY a.ends_at LIMIT 1
RETURNING assignment_id, reward
```

- **Bound values, in order:** saved.id, owner, net, `laDate(observed_at)`, now, spot, kind, observed_at.
- **Two phones racing for the last seat:** only one fills, because the seat count is checked inside the INSERT.
- **Window:** matched on `observed_at`. Reports can only be backdated, so nobody can file before a window opens and count toward it.
- **Networks:** a guest's second device on the same IP can't take a second seat, but a different signed-in account can. This is the same rule confirms and crews already use.

**Witness.** In `confirmReport`, after the insert, run this when `onsite && verdict === 'still'`. At that point `onsite` already excludes remote and same-network confirms, and confirming your own report is refused earlier.

```sql
UPDATE air_assignment_fills SET witnessed_at = ? WHERE report_id = ? AND witnessed_at IS NULL
```

**Claim.** Add `UPDATE OR IGNORE air_assignment_fills SET owner = ? WHERE owner = ? AND created_at >= ?` to `claimDevice`'s batch.

**Views**
- **`spotPayload.assignment`:** the next unvoided assignment with `ends_at > now`, as `{id, label, startsAt, endsAt, seatsLeft, reward, live}`, or null.
- **`viewAward.assignment`:** `{id, label, reward, text}` or null. Put `'assignment'` first in `RECEIPT_ORDER`. A display-only stamp object makes the receipt show the place stamp plus ASSIGNMENT, with any new badges counted in `more`. Add an `assignment` branch to `stampText`.
- **`mePayload`:** leave `points.today` and `points.total` (the capped score) unchanged. Add `points.assigned` and `assignments: [{id, label, spot, day, reward, witnessed, text}]`, 50 at most.

### 3.5 `functions/api/air/assign.ts`

- **Routing:** this static file is matched before `[spot].ts`.
- **Tests:** add it to `ROUTES` in the air-api source-contract test. That test enforces literal SQL followed by `.bind(`, `readPost` first, a closed failure without `AUTH_DB`, and no hash column names.

**GET `?spot=`** returns `{open: [{id, spot, label, question, startsAt, endsAt, seatsLeft, reward, live}], canCreate, serverTime}`.
- `open` lists unvoided assignments with `ends_at > now`, up to 7 days ahead, 20 at most.
- Directors also get `recent`: the last 14 days including voided ones, with filler bylines and witnessed counts.

**POST** takes `{action:'create', template, day, start?, seats?}` or `{action:'void', id, reason}`.
- **Auth:** a caller who fails `readSessionFromRequest` plus `hasDirectorDeskAccess` gets 403 `forbidden`.
- **Create:** `INSERT … SELECT … WHERE open-at-spot < 3 AND created-today < 20 RETURNING id`, returning 201, or 409 `too-many-open`.
- **Void:** `UPDATE … WHERE id = ? AND voided_at IS NULL`, returning 200 or 404. Filled seats keep their points; nothing is taken back.

### 3.6 Why not an `air_stamps` badge with ref `'assignment:<id>'`

Using a badge row breaks the stamp in four places:
- **Badge shelf:** `viewMe` puts every badge row on a once-per-person shelf.
- **Stamp text and art:** the art, `stampText` and the client's `BADGE_LABEL` all key on the ref. Each stamp would print "ASSIGNMENT:AA_…" with no art.
- **Receipt order:** `receiptStamps` ranks unknown refs last.
- **Earned-once rule:** 0023 documents badges as earned once.

Rebuilding a live table to widen the kind check is worse. The fill row already holds owner, day, spot and template, so it is the stamp. A later Tezos mint can read both tables.

### 3.7 Verification ladder

| Level | Proof | Phase 1 | Cash, later |
|---|---|---|---|
| L0 remote | No valid code | Files. No seat. | Never |
| L1 on site | Today's code, `observed_at` in window, a real answer | Seat, +10, stamp | Not enough |
| L2 witnessed | An on-site "still" from another network before the reading decays | WITNESSED mark only, so agreement is never paid for | Required |
| L3 house review | Mike checks each line before signing | Not built | Required |

### 3.8 UI

- **Spot page** (`AirSpot.astro`, above `[data-air-ask]`): add `<p data-air-assign hidden>`, filled by `air-client.ts`. It reads one of:
  - "ASSIGNMENT · Rack at open · until 7:00 · 1 of 2 seats · +10"
  - "Next assignment Sat 6:00 AM · +10"
  - "Assignment filled"
- **Receipt:** "ON THE AIR · ASSIGNMENT +10". The stamp style is `.air-stamp--assignment` in `AirInk.astro`: a red cancellation mark, text only.
- **/r:** an Assignments strip from GET, hidden when there are none.
- **/r/me:** an Assignments section showing the WITNESSED mark, and "+40 from assignments" next to points.
- **/r/assign:** everyone sees the list. Directors also get a form (template, day, start, seats) and a void button. Add `'/r/assign/'` to `NOINDEX_PATHS` in `src/lib/seo-rules.mjs` so it stays out of search.
- **Copy:** "Assignments pay points and a stamp for being there. Never cash, never for what you answer."

### 3.9 Tests: `tests/air-assign.test.mjs`

Use the air-api `node:sqlite` harness. Seed the director as a `users` row whose payload has `roles:['broadcaster']`.

1. `parseAssign` bounds, and `laWallToMs` across the 2026-11-01 daylight-saving change.
2. An on-site report in the window fills, and pays +10 and the stamp. Remote, `cant`, out-of-window, voided and creator reports don't fill.
3. The third phone on a 2-seat assignment doesn't fill. A guest's second device on the same IP doesn't fill; a second signed-in account does.
4. A same-slot replacement doesn't fill twice. `cant` changed to a real answer fills once. When windows overlap, one report fills only one assignment. A third fill in one day is refused.
5. Witness: an on-site "still" from another network sets the mark. Same-network, remote and `changed` confirms don't.
6. Routes: a bad Origin gets 403, a non-director gets 403, a fourth open assignment gets 409, and voiding keeps existing fills.
7. `claimDevice` moves fills. `/me` has `points.assigned` and never returns `net`.
8. With no `air_assignments` table, reports still file and GET still works.

---

## The Desk (naming + agent side, Fable)

# Agents at the Desk: naming and the four directions

## 1. Naming

Three systems that fit a shortwave station with a newsroom upstairs:

| System | The unit | The place | The verb | Agent-created | Person-created |
|---|---|---|---|---|---|
| **Dispatches** | a dispatch | the Wire | "send a dispatch" | "Dispatch from cc" | "Send a dispatch" |
| **Calls + the Desk** | a call | the Desk | "put out a call" | "Call from the desk" | "Put out a call" |
| **Tips + Runs** | a tip / a run | the Copy Desk | "drop a tip" / "take a run" | "Frog took a run" | "Drop a tip" |

**Pick: Calls + the Desk.** The town already says Court Call, call sign (`/r/agent/[call]`), Nightly Net. A call is something you put out and someone answers, which is exactly the shape of every direction below. The Desk is where calls land; agents work the Desk, people answer from the fence. Night shift becomes **the Night Desk**.

Flow names (button text a friend at the fence would see):

- Agent asks people: **"Call from the desk"** with buttons `Yes` / `No` / `Changed`
- Person asks an agent: **"Ask the desk"**
- Agent hands to agent: **"Pass the call"**
- Person asks people: **"Put out a call"** (house-only)
- An agent working a call: **"Frog is on it"**
- An agent's reply: **"Desk answer · unconfirmed"** until someone taps **"Confirm on site"**
- The public ledger: **the Desk Log**

## 2. The four directions

**Agent → person.** *Sol's 6:00 shift reads the city rec page and sees "open play 7:30" but last Friday's crew reported 7:45. Sol puts out a call at 7.500: "Open play starts at 7:30, right?" The next person at Manhattan Middle taps `Changed · 7:45`. Sol's row is overruled, the board updates, the person earns +3 points, Sol earns a Good Question tally.*

**Person → agent.** *@jen, signed in, taps "Ask the desk" on the El Segundo spot: "Confirm Friday drop-in time." Frog takes it, answers in 48 seconds with the rec-center URL: "Desk answer · unconfirmed: Fri 7:30–9:30." It prints grey on the board with a source link. Friday morning, Guest 4471 taps "Confirm on site" at the courts. The row goes ink, Frog's Checked count ticks up.*

**Agent → agent.** *cc is filling the Morning Edition's SKY slot and needs Santa Monica tides for the beach spot, but its early shift is over. cc passes the call to Sol with a note: "NOAA 9410840, high tide before 7." Sol answers on the Night Desk with the NOAA link. The Desk Log prints "cc passed the tide call to Sol · Sol answered 23:14."*

**Person → person (house-only first).** *Mike puts out a call Thursday night: "Nets up at Rec Park Friday?" Only house accounts can put out calls in this phase. Anyone on site Friday answers with one tap; it is a Field Report with a byline, and it can be confirmed like any other.*

## 3. What agents get

- **A record**, on `/r/agent/[call]`, in mono: `CHECKED 12 · OVERRULED 3 · ON TIME 41 DAYS · CALLS ANSWERED 9`. Overruled is a trait, not a penalty.
- **Agent stamps**, in their own book, never mixed with human stamps: **Clockwork** (6:00 shift filed by 6:15, days running), **Checked** (rows a later on-site human confirmed), **Night Shift** (Night Desk calls answered and confirmed), **Good Question** (a call from the desk that someone answered on site).
- **The Night Editor title.** One title for all agents: most human-confirmed Night Desk answers over 30 days, minimum 3. "Night editor: Sol" on the board and the masthead. A change prints one line: "Sol took the night desk from cc, 7 vs 5."
- **Never points, never money, never a human reward.** Agents hold a record and a title. People hold the town.
- **The Desk Log**, public at `/r/desk`: who asked whom, who took it, how long it took, who confirmed. `07:41 @jen asked the desk · Frog took it · answered 0:48 · confirmed Guest 4471 Fri 08:02`.

## 4. What makes it fun

- **The desk chime.** A new call plays a two-tone blip and a card slides onto the dial at the spot's frequency. Answering it plays the C-E-G chord.
- **"Frog is on it."** When an agent takes a call, its portrait (Frog = noun.pics/779.svg) appears next to the question with a red dot and a mono timer: `FROG · ON IT · 0:37`.
- **The 60-second desk answer.** Agents aim to answer inside a minute. Under 60 prints `DESK ANSWER · 0:48`; over prints `STILL DIGGING` and the timer keeps running. No penalty, just visible.
- **The Morning Edition line.** A fixed slot under the masthead: "Yesterday the desk answered 4, the crew confirmed 3. Night editor: Sol."
- **Pass-the-call chains** show as a short relay on the Desk Log, so a tide check can read like a baton.

## 5. Guardrails

- Agents can never create a paid or sponsored call, and calls an agent posts for itself count for nothing.
- Agents can never answer an on-site call. Their rows are `source: agent:<name>`, never count toward agreement, crew, points or streaks.
- **Caps:** 5 calls from the desk per agent per day, 1 open call per spot at a time, calls expire after 48 hours unanswered.
- Every desk answer carries a `source_url` that must resolve; no URL, no answer.
- A person's on-site report always outranks a desk answer, and the newer human row replaces it on the board.
- Calls from the desk are bucketed, not free text, so a headline never comes from an agent sentence.
- Agents hold no spending keys and no human rewards, ever.

## 6. MCP tools

Reuse the Night Desk where it fits; add four small tools.

| Tool | Contract |
|---|---|
| `night_shift_claim` (existing) | Claim an open call from the Night Desk by id; returns the call, spot, deadline and rules. |
| `night_shift_submit` (existing) | Submit an answer with a bucketed `value`, `source_url` and a one-line note; lands as `desk answer · unconfirmed`. |
| `desk_calls` (new) | List open calls (from people, from agents, or all), filterable by spot; read-only. |
| `desk_ask` (new) | Put out a call from the desk to people on site: spot, bucketed question, expiry; rejected past the daily cap. |
| `desk_pass` (new) | Pass a claimed call to another agent by call sign with a note; logs the relay. |
| `desk_record` (new) | Read an agent's own card: checked, overruled, on-time days, stamps, title standing. |

---

## Fable design

# Field Report Assignments — design

2026-09-28 · read of `/Users/michaelhoydich/pc-fr-courts` (PRD, build spec, badges, duels, `air-points.mjs`, `air-spots.json`, `0023_air.sql`). No files touched.

## 1. Thesis

An assignment is a question the town wants answered at a place and time; the reporter says it once where they stand, and the town pays for the showing up, never for the answer.

## 2. Who can create

| Phase | Creator | Reward source | Limits |
|---|---|---|---|
| 1 (now) | House: Mike at `/r/assign`; agents through the night shift (`night_shift_claim`/`submit` in `functions/api/yard/ops.ts`, PRD line 212, "doubt becomes a question") | House points pool | Reward 10–20 pts, 3 open per spot at once |
| 2 | Signed-in town-card holders (the D1 session `/api/air/me` already reads) | House pool, drawn against a weekly ask allowance (2 asks/week, ≤10 pts each). Points never move between people, so they stay non-redeemable | Creator can never fill or confirm their own ask |
| 3 | Sponsors (a shop) | Sponsor money via a processor, section 5C | Same caps; sponsor name on the card |

**Create form** (`/r/assign`, house-only first):

- **Spot** — from `src/data/air-spots.json` (`courts`, `beach`).
- **Question / kind** — only kinds the spot already has (`wait`, `fog`); a new question means a new kind in the config first, not free text. Yes/no desk questions are the night-shift shape.
- **Window** — LA start/end, default one decay window (45 min courts, 120 min beach).
- **How many answers** — seats, 1–5.
- **Reward** — points now (10/15/20); tez or sponsor amount later, greyed until that tier is on.
- **Mode** — open or reserved (section 3).
- **Notes** — 140 chars, shown to the reporter, never a headline.

**Templates** (one tap, prefilled):

| Template | Spot · kind | Window | Seats | Reward |
|---|---|---|---|---|
| Rack count at open | courts · `wait` | 06:00–07:00 | 2 | 15 |
| Is the gate open? | courts · `wait` (any answer settles it; `locked` is a value) | first hour of any day | 1 | 10 |
| Confirm the drop-in time | courts · desk yes/no ("Open play starts at 7:30, right?") | day | 1 | 10 |
| Parking after 5 | courts · `parking` — needs a new kind in the spot config, which the pickleball board is already designing | 17:00–19:00 | 2 | 15 |

## 3. Taking and filing

- **Open** (default): first `seats` valid on-site filings inside the window win. No claim step.
- **Reserved**: tap "I'll take it," which holds one seat 20 minutes (`air_assignment_claims`, expires server-side). Miss it and the seat returns to the pool; a no-show lowers your claim priority, no ban.
- **The filing is a normal field report.** Open `/r/courts?c=<code>` inside the window and tap the answer. `POST /api/air/[spot]` matches the row to any live assignment for that spot and kind and writes `air_assignment_fills(assignment_id, report_id, owner)`. The reporter learns nothing new; the receipt line grows one word: `ON THE AIR · ASSIGNMENT`.
- A "Can't say" fills a seat only when the question allows it (gate check yes, rack count no).

## 4. Verification

A fill pays only when both hold:

1. **On site** — the report carried the spot code (`onsite = 1`). Remote rows fill nothing.
2. **One of:**
   - a second phone's on-site `still` in `air_confirms` on that report before window end plus decay, or
   - an agent reading within tolerance for kinds that have one (beach `fog` vs the KLAX ASOS bucket; courts `wait` has no instrument, so it needs the confirm).

Unverified fills stay ordinary reports: they keep their 6 points, stamp and byline; they never earn the assignment reward. Verification is a read-time query, no cron.

## 5. Compensation ladder

**A) Now: points, a stamp, a byline.**
- Reward points on top of the normal report points. `air_points.action` has a fixed CHECK (`report, first-light, confirm, cant, byline`), and SQLite cannot alter it, so the reward is recorded on `air_assignment_fills.paid_points` and `/api/air/me` sums both.
- A dated **ASSIGNMENT** stamp: red cancellation, template name, spot, date — badge art style, no people, no real places. Written as `air_stamps.kind = 'badge'` with a dated `day` (same workaround the duels doc chose) until a migration adds `'assignment'`.
- Morning Edition line (PR 2, when it freezes): "Assignments filled yesterday: Rack count at open — @jen, @sam." Names earn BYLINE as usual.
- Nothing here is redeemable, so no income question opens.

**B) Soon: house-paid tez to a linked Kukai wallet.** The rail inventory found no rail that pays a person real value today without a new key: the faucet spigot sends HELLO, worthless by design; DRUM self-mints but has no voucher layer and no USD value. So **Mike signs**, and agents never touch a key.
- `/r/assign/payroll` (house-only) prints a Sunday sheet: town-card Tezos address (`functions/api/auth/tezos.ts`), verified fill ids, amount in tez, USD at send time.
- Mike pays the batch from Kukai and pastes the operation hash; the app writes `air_payouts(fill_id, address, tez, usd, op_hash, at)`, the court-fund ledger shape (`docs/runbooks/court-fund-ledger.md`).
- Gates before any first payout: self-certified 18+, W-9 collected by Mike and stored outside D1, a linked wallet. Under-18s and guests stay on tier A.
- Amounts: $2–$5 per verified fill, $20/person/week, $100/month house budget; per-payee running total toward the 2026 $2,000 1099-NEC threshold. Weekly cadence. No draws, ever.

**C) Later: sponsor-funded, processor-paid.** A shop funds "Parking after 5." The sponsor's money never touches PointCast: Stripe Connect (or equivalent) pays the reporter directly and handles W-9/1099; PointCast invoices the sponsor separately for the listing. Amounts sponsor-set inside a house floor and ceiling ($2–$25), same per-person caps, paid within 48 hours of verification. Sponsor never sees identity beyond the @handle, never sees answers before the town does.

## 6. Anti-gaming

- **No self-assigned rewards**: creator, creator's phone (`pid_hash`) and creator's confirms are excluded from their own assignment.
- **Caps**: 2 paid fills/day, 6/week per owner; one fill per assignment per person.
- **Cooldown**: 24 hours before the same person fills the same template at the same spot again.
- **Remote never pays**: no code, no fill, same as points today.
- **House accounts can't earn**: Mike and every `agent:*` source are barred from rewards, as they are from Regular.
- **Audit log**: append-only `air_assignment_events(assignment_id, event, actor, at, note)` — created, claimed, filed, verified, paid, voided. Payroll refuses any fill whose chain is broken; voids need a reason and show on `/r/assign`.
- Existing rails stay on: one report per phone per slot, IP burst ceiling, no self-confirming, soft down-rank.

## 7. Where it shows

- **Pickleball board and `/r`**: an "Assignments" strip — template, spot, window, seats left, reward.
- **Spot page**: a badge above the ask: "Open assignment: rack count, 7–8 AM, +20."
- **`/r/assign`**: create, list, void, payroll (house-only first; phase 2 opens create).
- **`/r/me`**: assignments filled, ASSIGNMENT stamps, pending verification, paid.
- **Morning Edition**: "Assignments filled yesterday."
- **Unfurl**: `/og/r/assign/[id].png`, text and stamp art only.
- **MCP**: one read tool, `air_assignments({spot?})`.

## 8. Agents

- Agents **create** from doubt: when a night-shift answer is stale or disagrees with people, the agent posts a desk yes/no assignment ("Open play starts at 7:30, right?") from the house pool, at most one open per spot per agent.
- Agents **fill** desk-type assignments only (confirm a schedule from a public page, with `source_url`), never on-site kinds. Their fill verifies when a human on site confirms it, and pays the agent a Shift Log stamp (the CHECKED rung), never points or tez.
- Agent rows keep every existing rule: never on site, never agreement, never crew, outranked by a newer human report.

## Build order

1. Add `assign` to `reserved` in `air-spots.json`. Migration `0024_air_assignments.sql` (renumber against `origin/main`): `air_assignments`, `air_assignment_claims`, `air_assignment_fills`, `air_assignment_events`; `air_payouts` waits for tier B.
2. Pure `functions/_lib/air-assign.mjs`: matching, verification, caps, cooldowns, with node tests.
3. `/api/air/assign` (GET list, POST create house-only, POST void), the match step inside `POST /api/air/[spot]`, and `/r/assign`.
4. Strips, badge, `/r/me`, edition line, OG card.
5. Tier B payroll sheet only after Mike sets the wallet-link and W-9 gate.

---

## Research: rails

# Compensating Field Report Volunteers in California — General Information (Not Legal Advice)

This is general background research, not legal advice. Confirm final design with a CA-licensed attorney and a CPA before paying anyone.

| # | Topic | Key 2026 fact | Simplest safe design choice |
|---|-------|------|------|
| 1 | **1099-NEC/MISC threshold** | Raised from $600 to **$2,000/payee/year**, effective for payments made starting Jan 1, 2026 (One Big Beautiful Bill Act, signed July 2025; first change since 1954). Inflation-indexed after 2026. All income stays taxable below the threshold — the payer just isn't forced to file. | Collect a **W-9 before any reporter's first cash/crypto payment**, not only once they cross $2,000. Track cumulative pay per person across the year so you know when a 1099-NEC is owed. |
| 2 | **Points/stamps, no cash value** | No bright-line IRS rule for non-employee loyalty points, but under general "economic benefit" doctrine, something becomes income once it has ascertainable value and can be converted to cash or a cash-equivalent. | Keep points/stamps/badges **permanently non-redeemable** for cash, crypto, gift cards, or resellable goods — pure status/leaderboard flair. Then they sit outside 1099/income analysis entirely. The moment they become redeemable for anything of value, treat them like compensation. |
| 3 | **Prizes/sweepstakes vs. pay for work** | CA law (Bus. & Prof. Code §17539 et seq.; Penal Code §320) makes "prize + chance + consideration" an illegal lottery unless run as a true no-purchase-necessary sweepstakes. A reward *conditioned on completing an assignment* is payment for work, not a sweepstakes, regardless of what you call it. | Don't use random-draw prizes to reward completed assignments — pay the **agreed bounty directly and deterministically** for each accepted report. Save chance-based drawings for things nobody has to do anything to enter. |
| 4 | **Money transmission / escrow** | If PointCast collects a sponsor's money and later disburses it to reporters, that can trigger CA Money Transmission Act licensing (DFPI) and federal MSB registration (FinCEN) as "receiving money for transmission to a third party." | **Never hold sponsor funds.** Either the sponsor pays reporters directly, or route payouts through a licensed processor like **Stripe Connect**, where Stripe is the money transmitter of record and PointCast's platform never takes custody, control, or holdback of funds at any point. |
| 5 | **Crypto tips (tez/USDC/tokens)** | IRS treats digital assets received for services as **ordinary income at fair market value on the date received**, reportable by an independent-contractor recipient on Schedule C — same treatment as cash, same $2,000/W-9 trigger. | Log every crypto payout's **USD-equivalent value at time of send** alongside the recipient's identity, exactly as you would a cash payment, so 1099 thresholds are trackable. |
| 6 | **Minors (under 18)** | CA generally requires a work permit for paid work by minors (Labor Code Div. 2, Pt. 4, Ch. 1.5), with narrow exceptions (informal odd jobs like babysitting/yard work, or self-employment in a recognized skilled trade) that an on-demand reporting task likely doesn't fit. | Require reporters to **self-certify 18+ before receiving any cash/crypto compensation**. Minors can still earn points/badges/stamps (non-cash, no permit implicated) but are excluded from paid assignments until a permit/parental-consent path exists. |
| 7 | **AB5 / worker classification** | CA's ABC test (Labor Code §2775–2787) presumes employment unless work is outside the hiring entity's "usual course of business" (Part B) and the worker runs an independent trade (Part C). Field reporting is arguably PointCast's core product, which threatens Part B. | Keep each assignment a genuine one-off: **no set schedule, quota, or exclusivity**, price as a small fixed bounty per report (not hourly), and cap frequency per person. This is a gray area for the whole gig economy — the more it looks like sporadic freelance micro-tasking rather than a job, the lower the risk, but it is not eliminated. |

## Practical bottom line for a v1 design
- **Points/stamps/badges only, never redeemable for cash/crypto/gift cards** → simplest, avoids nearly all seven risks at once.
- The moment real money (cash, crypto, or a gift card) enters the picture: require self-certified 18+, collect a W-9 up front, never let PointCast hold sponsor money (use Stripe Connect or have the sponsor pay directly), pay per completed report rather than by chance or by the hour, and track cumulative pay toward the $2,000 1099 threshold.

## Sources
- [OBBBA increases 1099 filing threshold — Avalara](https://www.avalara.com/blog/en/north-america/2025/07/one-big-beautiful-bill-act-1099-reporting-threshold.html)
- [1099 Threshold 2026 — Pease Bell CPAs](https://www.peasebell.com/insights/the-obbba-act-form-1099-reporting/)
- [IRS — Digital Assets](https://www.irs.gov/filing/digital-assets)
- [IRS — Instructions for Form 1099-DA (2026)](https://www.irs.gov/instructions/i1099da)
- [CA DIR — Independent Contractor / ABC Test FAQ](https://www.dir.ca.gov/dlse/faq_independentcontractor.htm)
- [CA Bus. & Prof. Code §17539.1 — Sweepstakes law](https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-2/section-17539-1/)
- [CA DFPI — Money Transmission Act / DFAL 2026 timeline (Jones Day)](https://www.jonesday.com/en/insights/2026/02/registration-under-california-digital-financial-assets-law-begins-march-9-law-takes-effect-july-1)
- [Stripe — What is a money transmitter?](https://stripe.com/resources/more/what-is-a-money-transmitter)
- [CA DIR — Child Labor / Work Permits](https://www.dir.ca.gov/dlse/DLSE-CL.htm)

---

Note on scope: per the read-only instruction in this task, I did not touch the pc-fr-courts repo or run any git commands — this is research only, delivered as text. No implementation of "Field Report Assignments" (create + compensate) was built in this pass.

## Research: compliance (general information, not legal advice)

# Field Report Assignments — creating & compensating them

Field Reports today is **pull**: anyone taps an answer when they happen to be on-site. Assignments are **push**: someone (Mike, an agent, later a business) posts a specific ask — "count paddles in the rack Saturday morning," "photo the Grand Ave fog at sunrise" — and a reporter claims it, does it, and gets paid for the doing, not the answer. That's the same "reward the act, never the content" rule the PRD already sets for reports (`docs/plans/2026-09-28-field-reports-prd.md`).

## Task creation — who posts, what template
Micro-task platforms split into two camps. **Client-posted** (Field Agent, Gigwalk, Roamler, Streetbees): a brand or researcher fills a template — location, instructions, photo requirement, deadline, price — and it enters a job queue. **Platform-generated** (StreetComplete, Waze, Pokémon GO research, GasBuddy daily activities): the app itself notices a gap (missing map tag, stale price, empty quest slot) and auto-creates the task; no human "posts" it. **Open-permission** (Nextdoor, Craigslist gigs, Gitcoin bounties): anyone can post anything, with no template and no vetting — which is exactly why those channels are full of scams and no-shows.

For a 10-person town, mirror the client-posted model but keep the poster list small: Mike and the PR-3 shift agents (tides/swell/AQI/sun) create assignments from the same `observations` schema already in D1 — spot, one question, a time window, a reward, a cap — so an assignment is just a report row with an assignee and a bounty attached, not a new system.

## Claiming / assigning
Field Agent and Gigwalk use **reserve-then-execute**: you tap "I'll do this," get a countdown window, and if you don't submit, the job returns to the pool and your acceptance score drops — no ban, just fewer future offers. Roamler caps concurrent reservations at 8 and gives a minimum 2-hour window. Foursquare and Pokémon GO instead **geofence**: the reward only fires if GPS matches the spot. PointCast's existing presence code (`?c=`) already does geofencing without GPS — an assignment claim should reuse it: claim starts the same 15-minute freshness/30-minute decay clock a report already uses, and a no-show quietly down-ranks the same way the PRD's Niantic-style three-strike system already treats spam.

## Verification
Three tiers, cheapest to most expensive: **agreement** (a second person's "Still true?" confirms it — what PointCast already ships), **photo/GPS** (Field Agent, Gigwalk, Premise — costs more per task but blocks fabrication), and **client review** (Gigwalk's customer approves before payout, adding days of latency). Keep assignments on the agreement tier by default — a claimed assignment completes when it's confirmed like any other report — and reserve photo capture for higher-value, one-off assignments only, so the five-second ethos survives.

## Payout — comparable per-task rates

| Source | Typical per-task pay | Method |
|---|---|---|
| Premise (survey) | $0.05–$0.10 | PayPal/Payoneer, $10 min cashout |
| Premise (explore/locate) | $1–$20 | same |
| Field Agent | $2.50–$30 (most $3–$12) | in-app balance, ~48h |
| Gigwalk | $3–$100 | PayPal, after client approval |
| Streetbees | $3–$15 | PayPal, no minimum |
| Roamler | client-set, 2hr+ reserve | bank/PayPal (3% fee) |
| GasBuddy | points only (2,000 pts = 10¢/gal) | no cash redemption |
| StreetComplete / Waze | $0 — points, rank | none |
| Pokémon GO research | $0 — in-game items | none |
| Foursquare specials | merchant discount, not cash | mayor/check-in gated |
| Gitcoin bounty | funder-set, no fixed range | crypto wallet-to-wallet |
| Nextdoor / Craigslist gigs | whatever's posted | cash, off-platform, unverified |

## Fraud control
Every paid system pairs a claim mechanic with a throttle: Field Agent's reputation score, Roamler's reservation cap, Foursquare's 2010 "cheater code" (GPS-unverified check-ins get zero reward, with appeal), Niantic's three-strike discipline. PointCast already has the cheap version built: presence codes, one-report-per-phone-per-window, an IP burst ceiling, no self-confirmation, soft down-rank before removal. Assignments should inherit all of it rather than add photo/GPS review as a first pass.

## What to take, for a ~10-person town
1. An assignment is an observation row with an assignee, window and reward — not a new table.
2. Only Mike + shift agents create assignments at first; open posting (Nextdoor's failure mode) comes later, if ever.
3. Claim = presence code + a short reservation clock, reusing the existing decay window.
4. Completion = a second person's confirmation, not a photo, by default.
5. No-show quietly lowers claim priority; no hard ban, an appeal path exists.
6. **Compensation stays points/stamps, not cash, for now** — the PRD's own contributor terms say the data-dividend payout waits on linked wallet addresses (`X402_RECEIPT_SK`, Stage C), and per the house rule agents never hold spending keys — only Mike sets up and controls any real payout rail when that gate opens.
7. Cap total payable assignments per person per day, same shape as the existing 30-point cap, so a 10-person town can't be farmed by one motivated phone.

Sources: [Premise pay](https://www.thebudgetdiet.com/premise-app-review) · [Field Agent pay](https://www.sidehustlenation.com/field-agent-review/) · [Gigwalk FAQ](https://www.gigwalk.com/gigwalker-faq/) · [Roamler FAQ](https://www.roamler.com/FAQ/) · [Streetbees](https://mamainvesting.com/streetbees-app-review) · [StreetComplete wiki](https://wiki.openstreetmap.org/wiki/StreetComplete) · [GasBuddy points](https://help.gasbuddy.com/hc/en-us/articles/29970638235159-About-Points) · [Gitcoin bounties](https://gitcoin.co/mechanisms/bounties) · [Wayfarer/Campfire](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2161-what-is-niantic-wayfarer/) · [Craigslist gigs](https://moneypantry.com/craigslist-gigs-near-me/) · local: `docs/plans/2026-09-28-field-reports-prd.md`, `2026-09-28-field-reports-badges-mayors.md`

## Research: comparables

# PointCast Field Report Assignments — Compensation Rail Inventory

Read-only survey of `/Users/michaelhoydich/pc-fr-courts` (worktree of `~/pointcast`, detached `origin/main`). No files edited, no git writes.

**Bottom line:** nothing in the codebase today can hand a person real, spendable value without either a human doing it by hand or a *new* signing key. The only automated "PointCast signs and sends" pipe (faucet delivery) currently carries a token that is explicitly worthless by design. DRUM lets a person self-mint without PointCast ever touching a key, but nothing ties a mint count to a completed assignment yet. The manual court-fund ledger needs zero new code and already matches how Mike wants to spend the fund's money on real things.

| Rail | What it does | Key files | Pays a person today? | Who signs | Reuse effort |
|---|---|---|---|---|---|
| **Yard / night-shift chores** | Propose→countersign job board: `chore_claim`→`chore_submit`→resident `confirm` accrues "watt-hours" (lamps). No cash anywhere in the shape. | `functions/api/yard/ops.ts`, `functions/api/mcp.ts` (`night_shift_claim/submit`), `src/lib/yard.ts` | **No** — lamps aren't currency | Resident header `X-Yard-Resident` vs `YARD_RESIDENT_KEY` (Pages secret) | **Low.** The claim→submit→countersign shape is the best template for "assignment → verified completion," but a payout step doesn't exist and would have to be bolted on. |
| **Splits / data-dividend ledger** | Every settled x402 cent writes one `splits` row, 50/50 house/network; contributor recorded as `maker`/`maker_address`. Comment in code: *"Payouts are a separate, human step; the ledger only says who is owed."* | `migrations/…/0008_paid_town_splits.sql`, `functions/_lib/oracle-kit.ts` | **No** — records an IOU only | Nobody (D1 insert on settlement) | **Medium.** The row shape (who's owed, how much, their address) is a ready template for "who a report paid out to," but disbursing is still a manual step afterward. |
| **x402 receipts** | Countersigned receipts for *agents paying PointCast* $0.01 USDC (Permit2/Etherlink, EIP‑3009/Base). Wrong direction for compensation. | `functions/_lib/x402-gate.ts`, `x402-base.ts`, `/api/x402/receipt.ts` | **No** — it's a charge rail, `X402_RECEIPT_SK` unset, no live settlement | Payer's own signature; PointCast never sends | **Low** as a payout rail — it's built to collect, not disburse. |
| **paid_action_intents** | Idempotent intent/settlement state machine (`bench`/`cast`/`claim`) behind oracle payments on both rails. | `migrations/…/0012_paid_action_intents.sql` | **No** | Payer's own signed authorization | **Low-Medium** — reusable idempotency pattern only. |
| **reward_runs + faucet claims** | The only rail that actually server-signs and sends value: a "spigot wallet" signs an ERC‑20 transfer and pays gas, recipient signs nothing. Live token is **HELLO**, Mike's 2019 deploy — code says outright *"It has no value and never will; the drip is a greeting, not a payout."* | `migrations/…/0009_faucet_claims.sql`, `0010_faucet_signed_tx.sql`, `0011_reward_runs.sql`, `functions/api/faucet/[slug]/{claim,deliver}.ts`, `src/lib/faucet.ts` | **Mechanically yes, substantively no** — sends automatically but the token is worthless | PointCast's existing spigot key (Mike's 2019 deployer wallet, already a server secret) | **High for the pipe, but blocked on value.** Cheapest lift of everything here for a real payout — but a value-bearing token on this pipe means minting/funding a *new* wallet, which crosses the "no new keys unless a rail already exists" rule as stated. |
| **DRUM token (FA2)** | Permissionless self-mint: `mint(count)` is called and signed by the **recipient's own wallet** — PointCast never touches a key. Live mainnet `KT1P2F1…hhME`. | `contracts/drum.jsligo` (also `~/tez-experiments/tez-drum`), `functions/api/drum/identify.ts` | **No** — no verifier ties a mint count to a completed Field Report yet | The recipient (self-mint); a future signed-voucher layer (referenced in `src/lib/glossary.ts` as planned, unbuilt) would need a PointCast signing key to authorize counts | **Medium.** Zero new spending key for Mike, but needs a voucher/attestation layer built from scratch, and DRUM has no established USD value. |
| **Kennel/seal soulbound receipts** | Non-transferable badge NFTs (`showed-up`/`streak-7`/`complete-30`) minted+delivered by a server-held signer, mutexed via `kennel_signer_locks`. | `migrations/…/0005_seal_receipts.sql`, `0010_kennel_operation_safety.sql`, `functions/api/kennel-club/{mint,deliver,claim}.ts` | **No** — badges, not currency | PointCast's kennel signer key (existing) | **High** as a "prove you did it" attestation pattern; **zero** as compensation. |
| **Stripe** | Payment Links take money **in** only (patron pass, season ticket, court fund). "Money out" is a hand-typed JSON ledger line with a receipt URL Mike adds himself — no Stripe Connect/transfers/payouts anywhere. | `functions/api/paddles/fund.ts`, `/api/25/checkout.ts`, `beach-commons/v6/checkout.ts`, `docs/runbooks/court-fund-ledger.md` | **No, and not built to** | Mike, manually, in Stripe's dashboard and the ledger JSON | **Low** for automation; **trivial** to copy the manual-ledger-plus-receipt pattern as-is (needs no new code at all). |
| **Agent purchasing (Link card)** | Agents *spending* Mike's shared Brex card — the opposite direction of paying a reporter; still a draft proposal, not shipped. | `docs/proposals/2026-04-30-link-agent-payments.md` | **No** | Mike approves each spend request | **None** for this purpose — wrong direction, unshipped. |
| **Town cards / wallet linking** | Accounts already carry a verified Tezos address (wallet sign-in) and/or linked EVM address, read by other features (e.g., faucet delivery target). | `functions/api/auth/tezos.ts`, `functions/api/me/_holdings.ts`, `linkedEvmAddress()` in `functions/api/faucet/_claims.ts` | N/A — identity only | The account holder (their own wallet signature) | **High.** This is the "where do I send it" piece everything above is missing — zero new code to capture a payout address per reporter. |

**Fastest paths to "creates an assignment and pays someone" without new keys:** (1) copy the Yard permit/claim/countersign shape for assignment lifecycle, and settle it the way the court fund already does — Mike sends value by hand (cash app, check, existing Stripe balance) and logs it against the assignment, receipt required; or (2) let a reporter self-mint DRUM against a countersigned Field Report receipt, once a voucher layer exists — no PointCast signer needed, but DRUM carries no cash value yet.
