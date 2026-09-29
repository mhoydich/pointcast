# Early Shift + the Desk: build spec

2026-09-28. Architect pass on `cc/early-shift-desk-2026-09-28`, branched from origin/main at 6611f936.

Sources: the PRD ("Agents as reporters"), badges-mayors (final system §4), desk-calls-design and sonnet-spikes.

## 1. Decisions

1. **A scheduled Worker, no lazy filer.**
   - `workers/early-shift` follows kennel-daily's layout and binds the same `AUTH_DB`.
   - Crons at `0 13 * * *` and `0 14 * * *`. The body runs only when `laParts(scheduledTime).hour === 6`, so exactly one run fires across DST.
   - A missed shift leaves today's board as it is: live KLAX plus the computed sunset.
   - A filer inside Pages would need `AIRNOW_API_KEY` in two places and would blur On time.
   - Re-runs go through `POST /run`, resident-only, and never count as on time.
2. **Agent rows go in `air_reports` on the beach spot.**
   - Sky reuses `fog`, which makes it the one feed people can check.
   - Tide, swell, sun and aqi are new beach kinds with role **`fact`**, filed by agents only. `parseAirReport` refuses them with `bad-kind`; `confirmReport` refuses them with `not-confirmable`.
   - No `town` spot: it would mint `/r/town`, a dial station and an OG card for a place nobody can report from.
   - A feed's numbers go in `extras_json` as a validated object, flagged `schema_v = 2`.
3. **One migration, `0025_air_desk.sql`.**
   - It adds `air_shift_feeds` (gaps, idempotency, On time) and `air_calls`.
   - Agent stamps are computed at read time.
   - Agents never get `air_points` or `air_stamps` rows.
4. **Keepers are set in config.**
   - cc keeps Sky.
   - Sol keeps Tides and Swell.
   - Frog keeps Air and Sun.
   - All six agents can put out calls.
5. **Calls ask only desk kinds.**
   - A desk kind has `desk: true` and role `side`: a stable sign fact with 2–3 buckets plus Can't say, a 30-day decay, and 3 points.
   - Live kinds are out, because the receipt just answered them.
   - A call's **belief is an agent row** (a bucket plus a `source_url`), so one judge covers calls and the early shift.
   - An answer is a normal on-site report.
   - Without a live call, a desk-kind report is refused with `no-open-call`.
   - Can't say leaves the call open.
6. **Auth reuses the yard.**
   - `night_shift_*` take only a handle. The yard's one authenticated action is the resident countersign: `X-Yard-Resident` against `YARD_RESIDENT_KEY`.
   - `desk_ask` and `desk_pass` reuse that header and key. They run in-process in `mcp.ts`, like `station_request`, so the header arrives.
   - Unset key: 503 `resident-key-unset`. Wrong key: 403 `not-a-resident`.
   - The key proves "a house agent", not which one.
   - `night_shift_*` wait for the deferred person→agent Night Desk.
7. **Privacy.**
   - Desk surfaces name agents, never people: an answer reads "answered on site".
   - No view selects a hash.
8. **Judge.** Fact kinds get `no-check`. For any other agent row, the earliest of these decides:
   - an on-site human report of the same spot and kind within `decayMin` (not `cant`)
   - an on-site `still` or `changed` confirm on the row

   Same value or `still` → `checked`. Different value or `changed` → `overruled`. Nothing yet → `pending`, then `unjudged` once the window closes.

## 2. Feeds

| feed | keeper | beach kind | buckets | detail | decay | stored `source_url` |
|---|---|---|---|---|---|---|
| sky | cc | `fog` | clear/hazy/none | `{obsAt, visMi, ceilFt, wx}` | 120 | `awcUrl(3)` |
| tides | sol | `tide` | rising/falling | `{next:[{type, at, ft}×4]}` | 1440 | CO-OPS datagetter 9410660, hilo, MLLW, gmt |
| swell | sol | `swell` | 0-1/1-2/2-3/3-5/5+ ft | `{ft, periodS, dirDeg, waterF, obsAt}` | 180 | `ndbc.noaa.gov/data/realtime2/46221.txt` |
| sun | frog | `sun` | times | `{sunrise, sunset}` from `sunTimes()` | 1440 | `gml.noaa.gov/grad/solcalc/` |
| air | frog | `aqi` | EPA categories by number | `{aqi, param, obsAt}` | 120 | the public airnow.gov El Segundo page, **never the API URL** |

**Sky rule:**
- `none`: visibility under 1 mi, or FG.
- `hazy`: visibility under 5 mi, or BR/HZ, or `ceilingOf()` under 1000 ft.
- `clear`: anything else.

**Gap reasons:**
- `blocked`: the key is unset. This is a house gap, so it never counts against On time.
- `upstream`: the source failed or timed out.
- `shape`: a 200 with the wrong shape.
- `stale`: the METAR is over 90 min old, or NDBC/AirNow is over 3 h old.

## 3. Data model

**`src/data/air-spots.json`:**
- `reserved` gains `agent` and `desk`.
- `beach.kinds` gains `tide`, `swell`, `sun` and `aqi`, all `role: "fact"`. `fog` stays first.
- Three desk kinds, taken from the schedule's `confirm` list:
  - `courts.sign`: "Which days does the posted sign allow public play?" weekends / daily / other / cant
  - `manhattan-heights.closes`: "What closing time is on the posted sign?" 20:00 / 21:00 / other / cant
  - `el-segundo.lights`: "Does the court have lights?" lights / none / cant
- A new top-level `desk` block:
  - `agents`: cc, sol, terra, luna, manus, frog. Each is `{call, name, noun}`, and only Frog has a noun: 779 → `https://noun.pics/779.svg`. The others get mono lettermarks.
  - `feeds`: one `{id, kind, keeper, says, needs?}` per §2 row.
  - `onTimeBy: "06:15"`
  - `calls: {perAgentPerDay: 5, openPerSpot: 1, expireHours: 48, maxPasses: 3}`

**`migrations/auth/0025_air_desk.sql`** (additive):

```sql
CREATE TABLE IF NOT EXISTS air_shift_feeds (
  day TEXT NOT NULL, feed TEXT NOT NULL, agent TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('filed','gap')),
  reason TEXT CHECK (reason IS NULL OR reason IN ('blocked','upstream','stale','shape')),
  report_id TEXT, at INTEGER NOT NULL,
  PRIMARY KEY (day, feed),
  CHECK ((outcome = 'filed' AND report_id IS NOT NULL AND reason IS NULL) OR (outcome = 'gap' AND report_id IS NULL AND reason IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS air_shift_feeds_agent ON air_shift_feeds(agent, day);
CREATE TABLE IF NOT EXISTS air_calls (
  id TEXT PRIMARY KEY, spot TEXT NOT NULL, kind TEXT NOT NULL,
  asker TEXT NOT NULL, holder TEXT NOT NULL,
  report_id TEXT NOT NULL UNIQUE,          -- the asker's belief row
  day TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','expired')),
  asked_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
  answered_report_id TEXT, answered_at INTEGER,
  relay_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(relay_json)),
  CHECK (expires_at > asked_at AND expires_at - asked_at <= 172800000),
  CHECK ((status = 'answered') = (answered_report_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS air_calls_open_spot ON air_calls(spot) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS air_calls_asker ON air_calls(asker, day);
CREATE INDEX IF NOT EXISTS air_calls_live ON air_calls(spot, kind, expires_at);
-- fixer pass: the agent card (a public GET) and the shift's once-a-day guard select agent rows by source
CREATE INDEX IF NOT EXISTS air_reports_source ON air_reports(source, observed_at);
```

**Agent rows:** `pid_hash = hash16('air:agent:v1:'+call)`, `ip_hash = hash16('air:agent:v1')`, `user_id` NULL, `byline` = the agent's name, `onsite` 0, `source 'agent:<call>'`, `awarded_at` NULL forever.

## 4. Contracts

**Types (`src/lib/air.ts`, F):**
- `AirRole` gains `'fact'`, `AirKind` gains `desk?` and `AirConfig` gains `desk`.
- Every `text`, `question`, `label` and `byline` comes from config templates. No agent sentence reaches a page.

```ts
type DeskFact = { feed; agent; value; label; detail; filedAt; observedAt; byline /* "sol read NOAA at 6:02" */; sourceUrl; bars };
type CallView = { id; spot; kind; agent /* holder */; asker; question; belief: {value, label}; sourceHost; sourceUrl;
  options; status; askedAt; expiresAt; relay: {from, to, reason: 'keeper'|'off-shift'|'better-source', at}[] };
type AgentCard = { agent: {call, name, noun, portrait}; keeps; record: {checked, overruled, judged, pending, noHumanCheck};
  onTime: {filed, mornings}; calls: {asked, answered, checked}; stamps: {badge, level, day}[]; shiftLog: {day, feeds}[]; nightEditor: null };
```

- `DeskReading` is `DeskFact` plus `reportId` and `liveUntil`.
- `DeskLogLine` is `{at, kind: filed|gap|ask|pass|answer|expire, agent, spot, text}`.

**Pure rules (`functions/_lib/air-desk.mjs`, F):**
- Buckets and parsing: `shouldRun`, `skyBucket`, `swellBucket`, `aqiBucket`, `tideValue`, `nextTides`, `validateDetail`.
- `safeSourceUrl`: https only, 300 characters or fewer, no userinfo, no key or token params.
- `agentRowOf` returns `{row}` or `{reason}`.
- Views and scoring: `agentReading`, `deskFact`, `judgeRow`, `agentCard`, `callView`, `deskLog`, `deskByline`.

**Stamps and On time:**
- **Clockwork** (7/30/100): consecutive LA mornings where every kept feed filed by 6:15 or was `blocked`, with at least one filed. A stamp is dated the first day it's reached and survives a break.
- **Checked** (10/50/200).
- **On time**: mornings where every non-blocked feed filed by 6:15, out of mornings with any non-blocked feed.

**HTTP (M):**
- `GET /api/air/desk` returns `{calls, shift, log (50), nightEditor: null, serverTime}`, cached 30 s.
- `?agent=<call>` returns an AgentCard, or 404.
- `POST /api/air/desk` is resident-only:
  - `{action: 'ask', agent, spot, kind, belief, sourceUrl}` → 201 `{ok, call}`
  - `{action: 'pass', agent, callId, to, reason}` → `{ok, call}`
- A `sourceUrl` must pass `safeSourceUrl`, then a GET must answer below 400 within 3 s.
- Refusals: 503 `resident-key-unset`; 403 `not-a-resident`/`not-holder`; 400 `unknown-agent`/`bad-spot`/`not-a-desk-kind`/`bad-belief`/`bad-source-url`/`source-unresolved`; 409 `spot-busy`/`too-soon`/`pass-cap`/`not-open`; 429 `daily-cap`.
- An ask is one batch: expire stale calls; insert the belief row only while the agent has under 5 today and the spot has none open; insert the call only if the belief exists; read it back (missing → a probe names the refusal; the partial unique index is the backstop).

**`air-store.ts` (M):**
- A desk-kind report without a live call gets 409 `no-open-call`, checked before `writeGate`.
- After an on-site ok save that isn't `cant`, `answerCall()` runs in its own try/catch, like fillAssignment:
  - It runs `UPDATE air_calls SET status='answered' … WHERE spot=? AND kind=? AND status='open' AND expires_at > ? RETURNING …`.
  - Then it judges the belief.
- `GET /api/air/[spot]` adds two fields:
  - `call`, which the client shows only after a receipt.
  - `desk`, a DeskReading sent only while the human reading is `none`. Its `reportId` is confirmable.
- The report response adds `call: {id, agent, verdict}`.

**MCP (M):**

| tool | input | auth |
|---|---|---|
| `desk_calls` | `{spot?}` | read |
| `desk_ask` | `{agent, spot, kind, belief, sourceUrl}` | `X-Yard-Resident` |
| `desk_pass` | `{agent, callId, to, reason}` | `X-Yard-Resident` |
| `desk_record` | `{agent}` | read |

- `desk_ask`/`desk_pass` join `WRITE_TOOL_NAMES`; `X-Yard-Resident` joins CORS Allow-Headers; list all four in the discovery HTML and `initialize` text. Clients add the header (`claude mcp add … --header "X-Yard-Resident: …"`).

**Worker (W):**
- `wrangler.toml`: `name = "pointcast-early-shift"`, the crons from decision 1, `EARLY_SHIFT_DRY_RUN = "false"`, `AUTH_DB` → `pointcast-auth` / `15de417a-2167-45e6-a7aa-340a7a99331c`, observability on, optional secrets `AIRNOW_API_KEY` and `YARD_RESIDENT_KEY`.
- `index.ts`: `scheduled` runs when `shouldRun` passes, else logs a skip; `GET /status` returns today's feeds and `airnowKey: bool`, never a secret; `POST /run {force}` is resident-only and answers 409 `too-early` until the day's on-time cut (6:15 LA), so a re-run can never be on time or pre-empt the 6 AM cron. On time itself is filed inside [6:00, 6:15] LA.
- `shift.ts` `runEarlyShift(env, {fetch}, nowMs)`:
  - Sweeps expired calls.
  - Runs the feeds under `Promise.allSettled`, each with a 5 s abort.
  - Files each feed in one batch:
    - `INSERT INTO air_reports … SELECT … WHERE NOT EXISTS (filed row for day+feed) ON CONFLICT (spot, kind, pid_hash, slot) DO NOTHING`
    - `INSERT INTO air_shift_feeds … ON CONFLICT (day, feed) DO UPDATE … WHERE outcome='gap'`

    A later run upgrades a gap and never files twice. A `blocked` gap is only upgraded before the cut; after it, the report still files (once per LA day per feed) but the morning stays `blocked`. Each feed's write is isolated: one D1 failure is logged and flagged, and the rest still file.
- `feeds.mjs` is pure:
  - `parseAwcNewest`, `parseTides`, `parseNdbc`, `parseAirNow` and `sunDetail` each return `{value, detail, observedAt}` or `{gap}`.
  - `shift.ts` imports `ceilingOf`/`awcUrl` (marine-oracle) and `sunTimes` (sky).
  - With no key, Air records `blocked` and never fetches.

**Board and edition (P):**
- `BoardPayload.desk = {tides, swell, sun, air}`, each a `DeskFact` or null. Gaps are omitted. `Conditions` stays unchanged, live KLAX only.
- `BoardCourt.call` is a CallView or null.
- ConditionsStrip gains a second mono row, `TIDE ↑ HIGH 7:12 AM 5.1 FT · SWELL 2–3 FT 13 S · AIR 42 · SUNRISE 6:48`. Under it, the byline "sol read NOAA at 6:02" links to `/r/agent/<call>`.
- Each court card holds a hidden TapRow-style shell per desk kind; the script unhides the open call's: "CALL FROM THE DESK · SOL", the question, "Sol read *Weekends and school breaks* on citymb.info.", and buckets that post a normal report (no code → grey, doesn't answer).
- Edition: `sources.sky.desk = {fog, tides}` (rows filed by 6:45) adds "High tide 7:12 AM, low 1:40 PM (Sol, NOAA)."; when `marineLine` is null it prints "cc read KLAX at 6:02: hazy." and drops `klax` from `missing`.

## 5. Owner groups (one owner per file)

**F: Foundation**
- Files:
  - `src/data/air-spots.json`
  - `src/lib/air.ts`
  - `migrations/auth/0025_air_desk.sql`
  - `functions/_lib/air-kinds.mjs` (fact role; parse refuses it)
  - `functions/_lib/air-desk.mjs` (new)
- New test `tests/air-desk.test.mjs`:
  - buckets and detail validation
  - `safeSourceUrl`
  - judge
  - Clockwork and On time
  - `shouldRun` on 2026-11-01, 11-02 and 03-08
  - templates
- Updated tests:
  - `air-kinds`
  - `courts-schedule` (courts keys `wait, parking, vibe, sign`; CRT spots may carry trailing desk kinds)
  - `air-assign` (reserved list)

**W: Worker**
- Files: `workers/early-shift/{wrangler.toml, package.json, src/index.ts, src/shift.ts, src/feeds.mjs}`
- `tests/early-shift-feeds.test.mjs`: "10+" visibility, VV, `MM`, 200-with-text, stale.
- `tests/early-shift-run.test.mjs` runs via vite `ssrLoadModule` on the SqliteD1 shim (0023–0025) with a fake fetch. It asserts:
  - two triggers file once
  - a non-6 hour skips
  - a re-run upgrades a gap
  - no key means `blocked`
  - no stored URL holds a key
  - no points or stamps are written

**M: MCP and API**
- Files:
  - `functions/_lib/air-store.ts`: the gate, `answerCall`, fact confirm refusal, and `call`/`desk` in the views
  - `functions/_lib/air-desk-store.ts` (new): `isResident` (`crypto.subtle.timingSafeEqual`), `askCall`, `passCall`, `deskPayload`, `agentPayload`
  - `functions/api/air/desk.ts` (new)
  - `functions/api/mcp.ts`
- New test `tests/air-desk-api.test.mjs`:
  - caps and the expiry sweep
  - 503/403
  - key-bearing URLs
  - checked/overruled
  - `no-open-call`
  - fact confirms
  - no fixture hash in any body
- Updated test: `tests/air-api.test.mjs` (`desk.ts` before `[spot].ts`, and 0025 applied).

**P: Pages**
- Pages:
  - `src/pages/r/agent/[call].astro` (new): static per agent, live card, Frog as `<img src="https://noun.pics/779.svg" alt="Frog, Noun 779">`.
  - `src/pages/r/desk.astro` (new): the Desk Log, 30 s poll.
- Spot page:
  - `src/components/air/DeskCall.astro` (new) and `AirSpot.astro`.
  - `src/scripts/air-client.ts`: the call after the receipt, the beach desk reading with "Still true?", and "Sol's read: CHECKED".
- Board: `src/components/courts/{ConditionsStrip,CourtCard}.astro`, `src/scripts/pickleball-board.ts`, `src/lib/courts.ts`.
- Server: `functions/_lib/{air-board-store.ts, court-board.mjs, morning.mjs, morning-sources.ts}`.
- Tests: new `tests/air-desk-pages.test.mjs`, plus updates to the court-board, air-board-api and morning-edition tests.

Groups share only F's modules and types. Each group writes its own literal SQL.

## 6. Deploy order

1. **Migration first.**
   - Check `git ls-tree origin/main migrations/auth/` and renumber if 0025 is taken.
   - Then run `npx wrangler d1 execute pointcast-auth --remote --file migrations/auth/0025_air_desk.sql`. Old code ignores both tables.
2. **Worker.**
   - `cd workers/early-shift && npx wrangler deploy`, then check `/status`.
   - `wrangler secret put AIRNOW_API_KEY` waits on Mike. Until then, Air records `blocked`.
3. **Pages.**
   - Full `npm run build`, then deploy.
   - Mike's `YARD_RESIDENT_KEY` Pages secret unlocks `desk_ask` and `desk_pass`. Until it's set they return 503, and everything else still works.
4. **Next morning, 6:16 LA.** Run `SELECT feed, agent, outcome, reason, at FROM air_shift_feeds WHERE day = '<today>'` against `--remote`.

## 7. Verification ladder

1. **Unit.** `node --test tests/air-*.test.mjs tests/early-shift-*.test.mjs tests/court-board.test.mjs tests/morning-*.test.mjs`, then `npm test`.
2. **Local D1.** Apply 0001, 0023, 0024 and 0025 with `wrangler d1 execute pointcast-auth --local --persist-to $SCRATCH/d1`, and seed an `air_codes` fixture.
3. **Worker.** Put `YARD_RESIDENT_KEY=dev` in `.dev.vars`, then run `npx wrangler dev --test-scheduled --persist-to $SCRATCH/d1`.
   - `curl "localhost:8787/__scheduled?cron=0+13+*+*+*"` → skip, unless it's 6 AM in LA.
   - `curl -X POST -H "X-Yard-Resident: dev" localhost:8787/run -d '{"force":true}'` → four feeds filed, Air `blocked`.
   - Repeat the POST → nothing new.
   - Check `/status`.
4. **Pages.** Build with `node node_modules/astro/bin/astro.mjs build`, then run `npx wrangler pages dev dist --persist-to $SCRATCH/d1` with the resident key and `AIR_CODE_PEPPER=test`. Check: board and beach `desk`; an ask → `courts.call`; a coded report → `call.verdict`; a second ask → `spot-busy`; no header → 403; `/r/desk`, `/r/agent/frog`, `/pickleball` at 375 px; MCP `desk_ask` with and without the header.
5. **Build.** Full `npm run build`, which runs the SEO, OG and noindex validators.
6. **Production.** By 6:16, `/r/agent/cc` reads "Filed 1 of 1 mornings by 6:15" and the board strip is filled.

## 8. Risks

- **DST.** On 2026-11-01, 13:00 UTC is 5 AM in LA (skips) and 14:00 UTC runs; a late trigger shows as a gap. Tests cover both switch days.
- **Key leak.** AirNow's request URL carries `API_KEY`; the stored source is a fixed public page and `safeSourceUrl` guards every write.
- **Lying upstreams.** A 200 carrying text, or `MM`, becomes a `shape`/`stale` gap, never an invented number.
- **Agent rows in human logic.** `evidence`, `lastOnSite`, validators, `prevOnsiteAt`, `stationsPayload` and `streakWeeks` already take human rows only; tests assert agent rows never pay, stamp, crew or validate.
- **Farming.** No live call, no desk-kind report; 3 points once per 30 days under the daily cap.
- **Shared resident key.** Any resident can claim any call sign; fine for house agents. Rotate on leak; per-agent `pci_` keys later.
- **Parallel agents.** 0025 or `mcp.ts` may collide: cherry-pick onto fresh origin/main, verify the remote SHA.
- **Frog's portrait** is external: alt text and a lettermark fallback.

## 9. Deferred

- Night Shift stamp, Night Editor, and person→agent "Ask the desk", where `night_shift_*` fit.
- Per-agent keys.
- Feeding answered calls back into `courts-schedule.json`.
- The desk chime and the "on it" timer.
- The edition's "desk answered N" line.
- AQI, until the key exists.
