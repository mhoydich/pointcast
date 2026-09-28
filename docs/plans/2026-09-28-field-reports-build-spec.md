# Build spec: Field Reports (/r) and Morning Edition (/morning)

> **Decisions from Mike, 2026-09-28 (these override anything below).**
> - Product name: **Field Reports**. Framing: personal broadcasting.
> - Short URL: **`pointcast.xyz/r`** (Field Reports home / band plan). Spot deep links: `/r/<spot>` (e.g. `/r/courts`). **`/court`** is an alias page that renders the courts spot directly (canonical link to `/r/courts`). Do NOT rely on `_redirects` (functions/_middleware.ts preempts 200 rewrites); build `src/pages/court.astro` as a real page.
> - API lives under `/api/air/*` (`/api/air/[spot]`, `/api/air/confirm`, `/api/air/me`, `/api/air/claim`, `GET /api/air`).
> - Courts public name is NOT confirmed: use the neutral name "The courts" / short "COURTS" in `src/data/air-spots.json` so Mike can rename in one line.
> - Agents are reporters too (PR 3): `air_reports.source` is `'page'` or `'agent:<name>'` with a `source_url`. Agent rows never count toward agreement, crew, points or streaks, and a newer on-site human report outranks them. The 0023 migration already allows this so PR 3 needs no migration.
> - `/r/board` (PR 3) is the dashboard: spots x facts, latest value, byline (person or agent), fading signal bars. `board` is reserved as a spot id now.
> - Roadmap after PR 2: PR 3 early-shift agents + board, PR 4 night-shift jobs + agent-to-human questions, PR 5 Shop (PaidLink, review fields, method page, /shop/court), PR 6 Takes (predictions scored by oracles/later reports, inspired by supertake.com), PR 7 local shops + in-person price reports, PR 8 Tezos season stamps.


Verified against `/Users/michaelhoydich/pc-field-reports` (checkout 21c51924) on 2026-09-28.

## 0. Ground rules
- **Fresh branch.** Branch from a fresh `origin/main` in a new worktree. Parallel agents are active, so re-check `ls migrations/auth` there: 0022 is the latest locally, and 0019 is already doubled.
- **Static site.** Astro output is static (no adapter). Anything computed at read time is a Pages Function under `functions/`. Do **not** create `src/pages/morning.json.ts`: it would be generated at build time and would collide with `functions/morning.json.ts`.
- **D1 for state.** All report state lives in D1 `AUTH_DB` (`pointcast-auth`). The only KV write per report is the Shortwave station post in `VISITS`, and there are at most 2 per spot per window. Rate limits count D1 rows instead of writing `PC_RATES_KV` (per the KV write-diet decision in `docs/decisions/2026-09-02-kv-write-diet.md`).
- **Pure logic in `.mjs`.** Put pure logic in `functions/_lib/*.mjs` so `node --test tests/*.test.mjs` runs it without the Pages runtime. This follows the `functions/_lib/paddle-wear.mjs` pattern.
- **Naming.** `/field`, `/field.json` and `/api/field` belong to a different product. Use `air_` and `/r`.
- **Fail closed.** If `AUTH_DB` is unbound, POSTs return 503. The client then queues the report locally.

## 1. Files

**PR 1: Field Reports**

| Path | New or changed | Purpose |
|---|---|---|
| `src/data/air-spots.json` | new | The two spots, their questions and buckets (v1 frozen) |
| `src/lib/air.ts` | new | Typed loader for spots, `labelFor()`, `COURT_CALL`, shared by Astro and functions |
| `migrations/auth/0023_air.sql` | new | Tables in section 3, including `morning_editions` for PR 2 |
| `functions/_lib/air-kinds.mjs` | new | `parseAirReport`, `parseConfirm`. Rejects, never repairs. |
| `functions/_lib/air-reading.mjs` | new | `reading()`, `bars()`, `crewFrom()`, `streakWeeks()`, `windowIdx()` |
| `functions/_lib/air-points.mjs` | new | Price list, daily cap, badge rules |
| `functions/_lib/air-store.ts` | new | D1 queries (prepared statements only), device and IP hashing, code check |
| `functions/api/air/index.ts` | new | `GET /api/air` |
| `functions/api/air/[spot].ts` | new | `GET` returns the reading; `POST` files a report |
| `functions/api/air/confirm.ts` | new | `POST /api/air/confirm` |
| `functions/api/air/me.ts` | new | `GET /api/air/me` |
| `functions/api/air/claim.ts` | new | `POST /api/air/claim` |
| `functions/api/shortwave.ts` | changed | Export `writeStationPost()`. Widen the stored type: `via` adds `'air'`, `attribution` adds `'station'`, plus optional `mhz` and `spot`. Public `VIAS` stays `['bar','page','agent']`. |
| `src/lib/band.ts` | changed | Add `COURT_CALL = { step: 180, weekday: 5, minute: 450, minutes: 60 }` and `courtCallState(now)` |
| `src/components/HomeShortwaveHero.astro` | changed | `stepOf` uses `p.mhz`; label for `via:'air'`; COURT marker and line |
| `src/pages/r/index.astro` | new | Band plan: the list of stations |
| `src/pages/r/[spot].astro` | new | Ask, confirm, receipt, stamp, crew (`getStaticPaths` from the spots file) |
| `src/pages/r/me.astro` | new | Your card: stamps, streak, points, claim |
| `src/scripts/air-client.ts` | new | Client flow, queue, polling, animation events |
| `src/lib/shortwave-client.ts` | changed | Extract the hero's static blip into `playBlip()` so `/r` reuses it |
| `functions/og/r/[spot].png.ts` | new | Per-spot unfurl card, following `functions/og/live/[room].ts` |
| `src/lib/play-layer.ts` | changed | Append 3 stamps to `PASSPORT_STAMPS` |
| `public/manifest.webmanifest` | changed | Add a "Report" shortcut to `/r` |

**PR 2: Morning Edition**

| Path | New or changed | Purpose |
|---|---|---|
| `functions/_lib/morning.mjs` | new | Pure: `editionDate`, `editionNumber`, `composeEdition`, `toJsonFeed` |
| `functions/_lib/morning-sources.ts` | new | Gathers slot inputs |
| `functions/morning.json.ts` | new | Read-time edition, freeze on first read |
| `src/pages/morning.astro` | new | Static shell that fetches `/morning.json` |
| `functions/api/mcp.ts` | changed | Add `air_latest` and `morning_edition` |
| `functions/api/today.ts` | changed | Add the `morning` round |

## 2. Spot config (`src/data/air-spots.json`)
```json
{ "version": 1, "reserved": ["confirm","me","claim","board","index"],
  "spots": [
    { "id": "courts", "name": "The courts", "short": "COURTS", "channel": "CRT", "color": "#3B6D11", "mhz": 7.5, "noun": 0,
      "courtCall": { "weekday": 5, "time": "07:30" },
      "kinds": { "wait": { "question": "How many waiting?", "decayMin": 45,
        "options": [ {"v":"0","label":"0 · walk on"}, {"v":"1-4","label":"1–4"}, {"v":"5+","label":"5+"}, {"v":"cant","label":"Can't say"} ],
        "extras": ["wind","damp","nets-down","lights-on","league"], "editorGuess": null } } },
    { "id": "beach", "name": "Grand Ave beach", "short": "GRAND AVE", "channel": "ESC", "color": "#534AB7", "mhz": 6.1, "noun": 0,
      "kinds": { "fog": { "question": "Can you see the pier?", "decayMin": 120,
        "options": [ {"v":"clear","label":"Clear"}, {"v":"hazy","label":"Hazy"}, {"v":"none","label":"Can't see it"}, {"v":"cant","label":"Can't say"} ],
        "extras": ["drizzle","wind","sun-out"], "editorGuess": null } } } ] }
```
- **Frequencies.** 7.500 is step 180 and 6.100 is step 124. Both sit outside the Nightly Net exclusion: `NET.step` is 168, and the hero skips `|s-168| < 4`.
- **Mike to confirm.** Names and noun seeds are Mike's call (open questions 1–2).

## 3. D1 migration (`migrations/auth/0023_air.sql`)
```sql
CREATE TABLE IF NOT EXISTS air_reports (
  id TEXT PRIMARY KEY, spot TEXT NOT NULL, kind TEXT NOT NULL, value TEXT NOT NULL,
  extras_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(extras_json)),
  schema_v INTEGER NOT NULL DEFAULT 1,
  observed_at INTEGER NOT NULL, day TEXT NOT NULL, slot INTEGER NOT NULL,
  pid_hash TEXT NOT NULL, ip_hash TEXT NOT NULL, user_id TEXT, byline TEXT NOT NULL,
  onsite INTEGER NOT NULL DEFAULT 0 CHECK (onsite IN (0,1)),
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','flagged','removed')),
  source TEXT NOT NULL DEFAULT 'page' CHECK (source = 'page' OR source LIKE 'agent:%'),
  source_url TEXT,
  created_at INTEGER NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS air_reports_once ON air_reports(spot, kind, pid_hash, slot);
CREATE INDEX IF NOT EXISTS air_reports_spot ON air_reports(spot, kind, observed_at DESC);
CREATE INDEX IF NOT EXISTS air_reports_user ON air_reports(user_id, day);
CREATE INDEX IF NOT EXISTS air_reports_pid ON air_reports(pid_hash, observed_at);
CREATE INDEX IF NOT EXISTS air_reports_ip ON air_reports(ip_hash, observed_at);

CREATE TABLE IF NOT EXISTS air_confirms (
  report_id TEXT NOT NULL, pid_hash TEXT NOT NULL, ip_hash TEXT NOT NULL, user_id TEXT,
  verdict TEXT NOT NULL CHECK (verdict IN ('still','changed','cant')),
  onsite INTEGER NOT NULL DEFAULT 0 CHECK (onsite IN (0,1)), at INTEGER NOT NULL,
  PRIMARY KEY (report_id, pid_hash));
CREATE INDEX IF NOT EXISTS air_confirms_pid ON air_confirms(pid_hash, at);
CREATE INDEX IF NOT EXISTS air_confirms_ip ON air_confirms(ip_hash, at);

CREATE TABLE IF NOT EXISTS air_points (
  id TEXT PRIMARY KEY, owner TEXT NOT NULL,            -- 'user:<id>' | 'dev:<pid_hash>'
  action TEXT NOT NULL CHECK (action IN ('report','first-light','confirm','cant','byline')),
  ref TEXT NOT NULL, units INTEGER NOT NULL CHECK (units >= 0), day TEXT NOT NULL,
  report_id TEXT, created_at INTEGER NOT NULL, UNIQUE (owner, action, ref));
CREATE INDEX IF NOT EXISTS air_points_owner ON air_points(owner, day);

CREATE TABLE IF NOT EXISTS air_stamps (
  id TEXT PRIMARY KEY, owner TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('place','crew','badge')),
  ref TEXT NOT NULL, day TEXT NOT NULL,                -- badges use day '-' (earned once)
  report_id TEXT, meta_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(meta_json)),
  created_at INTEGER NOT NULL, UNIQUE (owner, kind, ref, day));

CREATE TABLE IF NOT EXISTS air_firsts (spot TEXT NOT NULL, day TEXT NOT NULL, report_id TEXT NOT NULL, PRIMARY KEY (spot, day));

CREATE TABLE IF NOT EXISTS air_broadcasts (
  spot TEXT NOT NULL, kind TEXT NOT NULL, win TEXT NOT NULL,   -- '<day>:<windowIdx>'
  post_id TEXT NOT NULL, support INTEGER NOT NULL, crew_at INTEGER, PRIMARY KEY (spot, kind, win));

CREATE TABLE IF NOT EXISTS air_codes (spot TEXT NOT NULL, code_hash TEXT NOT NULL, valid_from TEXT NOT NULL, valid_to TEXT NOT NULL, PRIMARY KEY (spot, code_hash));

CREATE TABLE IF NOT EXISTS morning_editions (date TEXT PRIMARY KEY, number INTEGER NOT NULL, json TEXT NOT NULL CHECK (json_valid(json)), frozen_at INTEGER NOT NULL);
```
- **Codes.** Seed `air_codes` with `sha256('air-code:'+spot+':'+CODE)[:16]` for `courts/FRI` and `beach/SAND`, valid 2026-09-28 to 2026-10-31. To rotate a code, run `wrangler d1 execute`; no deploy is needed.
- **Hashing.** `pid_hash = sha256('air:v1:'+device)[:16]`. `ip_hash = sha256(ip+'|'+day+'|'+(env.AIR_IP_SALT ?? 'pointcast-air-v1'))[:16]`. `AIR_IP_SALT` is an optional new secret.
- **Time fields.** `slot = floor(observed_at / 1_800_000)`. `windowIdx = floor(minuteOfDayLA / decayMin)`. `day` comes from `townDate()` in `src/lib/band.ts`.

## 4. API contracts
All responses are JSON with `Cache-Control: no-store`. POSTs require `Content-Type: application/json`, a body of 4,000 bytes or less, and `Origin` equal to the request origin; otherwise they return 403, as in `shopping-metrics.ts:31`. No response ever includes `pid_hash` or `ip_hash`.

### `GET /api/air/[spot]` (poll target)
```json
{ "spot": {"id":"courts","name":"The courts","short":"COURTS","channel":"CRT","mhz":7.5,"kind":"wait","question":"How many waiting?","options":[{"v":"0","label":"0 · walk on"},{"v":"1-4","label":"1–4"},{"v":"5+","label":"5+"},{"v":"cant","label":"Can't say"}],"decayMin":45,"courtCall":{"weekday":5,"time":"07:30"}},
  "reading": {"value":"1-4","label":"1–4 waiting","status":"agree","support":3,"reportId":"ar_…","observedAt":"2026-10-02T14:39:10Z","ageMin":1,"bars":5,"liveUntil":"2026-10-02T15:24:10Z","bylines":["@mike","Guest 4471","@sam"],"crew":{"id":"courts:2026-10-02:9","n":3,"at":"2026-10-02T14:39:10Z"}},
  "today": [{"id":"ar_…","at":"07:36","byline":"@mike","value":"1-4","onsite":true,"confirms":1,"live":true}],
  "yesterday": {"at":"07:41","label":"1–4 waiting","support":5,"bylines":["@mike","Guest 4471","@sam"],"more":2},
  "lastWeek": {"date":"2026-09-25","at":"07:41","label":"1–4 waiting","support":3},
  "typical": null, "editorGuess": null, "serverTime": "2026-10-02T14:39:12Z" }
```
- `reading.status` is `none`, `single` or `agree`. With `none`, `value` is `null`.
- `today` covers the current LA day only, capped at 20 rows.
- `typical` stays `null` until there are 4+ same-weekday days, each with 3+ reports.

### `POST /api/air/[spot]`: file a report
Request:
```json
{ "kind":"wait", "value":"1-4", "device":"<uuid v4>", "code":"FRI", "extras":[], "asGuest":false, "observedAt":1790951880000 }
```
Response: 201 for a new report, or 200 with `replaced:true` when it replaces your own report in the same slot.
```json
{ "ok":true, "replaced":false,
  "report": {"id":"ar_…","value":"1-4","label":"1–4 waiting","observedAt":"…","byline":"Guest 4471","onsite":true},
  "reading": { "…": "same shape as GET" },
  "award": {"points":10,"pointsToday":10,"cap":30,"streakWeeks":1,"firstLight":true,
            "stamps":[{"kind":"place","ref":"courts","day":"2026-10-02","text":"COURTS · FRI 02 OCT 2026"}],
            "badges":["first-light"], "crew":null},
  "claim": {"until":"2026-10-03T14:36:00Z"} }
```
Errors:
- 400 `{ok:false, reason}`. Reasons: `bad-json`, `bad-spot`, `bad-kind`, `bad-value`, `bad-extras`, `bad-device`, `bad-observed-at`, `stale-observation`.
- 429 `{ok:false, reason:'rate-limited', retryAfter}`.
- 503 `{ok:false, reason:'store-unavailable'}`.

### `POST /api/air/confirm`
Request: `{ "reportId":"ar_…", "verdict":"still"|"changed"|"cant", "device":"…", "code":"FRI" }`

Response 200: `{ ok, reading, award:{points:3,…}, next: "report"|null }`. `next` is `"report"` after `changed`, which tells the UI to show the four buttons.

Errors:
- 400 `own-report`
- 404 `not-found`
- 409 `already-confirmed` (returns `reading`)
- 410 `expired`, when the report is outside its decay window

### `GET /api/air`
Returns `{ spots:[{id,name,short,mhz,channel,reading:{label,status,ageMin,bars}|null,lastAt}], courtCall:{live,minutesUntil} }`.

### `GET /api/air/me`
Send the header `X-PC-Device: <uuid>`, the session cookie, or both. Never put the device id in the query string.

Returns `{ owner, byline, points:{today,total}, streakWeeks, stamps:[…], badges:[…], reports:[last 20] }`. It only ever returns the caller's own rows.

### `POST /api/air/claim`
Request: `{device}`. Requires the `pc_session` cookie.
- Moves `dev:<pid>` rows created in the last 24 h (reports with `user_id IS NULL`, points and stamps) to `user:<id>`, and sets the byline to the card @handle.
- Uses `UPDATE OR IGNORE` for unique conflicts.
- Rate limit: `rateLimit(request, env, {bucket:'air:claim', windowSec:3600, maxRequests:5, clientId:'user:'+id})` from `functions/_rate-limit.ts`. This is the only KV rate key.

## 5. Rules
- **Validation** (`air-kinds.mjs`):
  - `spot` must be a key in the spots file and not a reserved id.
  - `kind` must be a key of that spot.
  - `value` must be an exact option `v`. An en dash, spaces or a different case is rejected.
  - `extras`: array of 3 or fewer from the kind's allowlist, with no duplicates.
  - `device`: a lowercase uuid v4.
  - `observedAt`: optional integer, where `now-15min ≤ observedAt ≤ now+60s`. Older values give `stale-observation`.
  - Strings are never coerced to numbers.
- **Identity.** Use `readSessionFromRequest` (`functions/api/auth/session.ts`) and `readCardByUser` (`functions/_lib/town-card.ts`). The byline is `@handle`, or `Guest ${1000 + parseInt(pid_hash.slice(0,4),16) % 9000}` when anonymous or when `asGuest` is true.
- **Onsite.** A report is on site when `code` is present and its hash exists in `air_codes` for this spot on today's date.
- **Rate limits** (D1 counts, checked before insert):
  - Reports: 12 per hour per `pid_hash`.
  - Confirms: 30 per hour per `pid_hash`.
  - Reports plus confirms: 40 per 10 minutes per `ip_hash`.
  - One row per `(spot, kind, pid_hash, slot)` through `INSERT … ON CONFLICT(spot,kind,pid_hash,slot) DO UPDATE SET value, extras_json, observed_at`.
- **Points** (`air-points.mjs`):
  - `report` is 6 with `ref = spot:kind:day:windowIdx`.
  - `first-light` is 4 with `ref = spot:day`. It is awarded only when `INSERT OR IGNORE INTO air_firsts` changes a row and the report is on site.
  - `confirm` is 3 with `ref = reportId`.
  - `cant` is 1 and replaces `report` points when the value is `cant`.
  - `byline` is 10 with `ref = morning:<date>`.
  - Remote rows get 0.
  - Daily cap: sum the owner's units for the day, then insert `min(units, 30 - sum)`. Units never depend on `value`.
- **Crew.**
  - After each on-site write, count distinct pids over on-site `ok` reports and on-site `still` confirms at the spot in the last 30 minutes.
  - At 3 or more, and if `air_broadcasts.crew_at` is null, set `crew_at`.
  - Insert a `crew` stamp and a `morning-crew` badge for each member's owner.
  - Update the station post, then `announce()`.
- **Badges written in the MVP:** `first-light`, `morning-crew`, and `still-true` (10 on-site confirms given).

## 6. Shortwave and the dial
- **First post.** On the first on-site report in `(spot, kind, day:windowIdx)`:
  - Call `writeStationPost(env, {spot, mhz, color, noun, text})`.
  - It writes `VISITS` `shortwave:post:v1:<reversed-ts id>` with a 365-day TTL, the same key scheme as today.
  - Then insert `air_broadcasts`.
- **Post text** (280 characters or fewer): `On the air from The courts: 1–4 waiting · 1 reporter · 7:36`.
- **Crew update.** When the crew fires, overwrite the same key with `… · 3 agree · 7:39`. That makes at most 2 KV writes per window.
- **Push.** Each write calls the existing `announce()` (PRESENCE `idFromName('global')`), best effort. Add meta `{air:true, spot, mhz}`.
- **Public POST unchanged.** `normalizePost` still throws on `via:'air'`, so nobody can fake a station.
- **Hero** (`src/components/HomeShortwaveHero.astro`):
  - Line 80: `stepOf(p) = typeof p.mhz === 'number' ? mhzToStep(p.mhz) : <existing hash rule>`. The call sites at lines 115, 126, 154, 156, 157 and 236 pass the post, not the id.
  - Line 134: the `via` label becomes `'the field'` for `'air'`.
  - Add a COURT marker at `pct(7.5)` beside the NET marker at line 33.
  - Add a line under the Net line: `Court Call · Fri 7:30 AM on 7.500` linking to `/r/courts`.

## 7. Client (`src/scripts/air-client.ts` on `/r/[spot]`)
- **localStorage keys**, every access wrapped in try/catch:
  - `pc_air_device` (a `crypto.randomUUID()`; falls back to an in-memory id)
  - `pc_air_code:<spot>` (from `?c=`, kept 12 h)
  - `pc_air_queue`
  - `pc_air_seen_crew`
  - `pc_air_mute`
- **Flow:**
  1. GET the reading.
  2. If `reading.status !== 'none'` and the report is not the device's own, show the confirm strip. Otherwise show the four buttons.
  3. Animate optimistically on tap, then POST.
  4. On failure, retry at 1 s, 3 s and 9 s.
  5. If it still fails, put the report in `pc_air_queue` and show a dashed stamp: "Saved on this phone. Sending when you have signal."
  6. On the next open, resend queued items younger than 15 minutes.
- **Polling:**
  - Every 5 s while visible, for 30 minutes after the device's own action. Otherwise every 30 s.
  - Pause while hidden, and fetch immediately on `visibilitychange`.
  - Also refetch on `pc:shortwave:post`, which the dock bar re-emits from PRESENCE, when `detail.via === 'air'` and the spot matches.
- **Root `data-air-state`:** `idle`, `sending`, `stamped`, `queued` or `crew`. Smoke tests read it.
- **Events** (`CustomEvent` on `window`), with times measured from the tap:
  - `air:tap` at 0 ms: ink fill, scale 0.97 to 1 over 120 ms, `vibrate([30,40,30])`.
  - `air:print` from 120 to 420 ms: the receipt line.
  - `air:blip` at 120 ms: `playBlip()`.
  - `air:needle` from 120 to 720 ms.
  - `air:stamp` at `max(420 ms, server 2xx)`: scale 1.4 to 1, rotate −6°, 120 ms `cubic-bezier(.2,1.6,.4,1)`, then an 80 ms ink bleed and a 90 Hz thump.
  - `air:first-light`: 300 ms after the stamp.
  - `air:agree`: whenever the support count changes.
  - `air:crew`: when `reading.crew.id` is not in `pc_air_seen_crew` and this device is a member. Bars count up over 600 ms, 3 stamps ring in with a 120 ms stagger, the MORNING CREW stamp slams, confetti runs through the `BirthdayCelebrate.astro:193` classes, and a C-E-G chord plays. Non-members see only the line "Morning crew: 3 on the air."
- **Reduced motion** (`prefers-reduced-motion`): every motion becomes a 150 ms opacity fade, with no confetti and no needle.
- **Sound** plays only after a user gesture, and the mute toggle is respected.
- **Copy** under the buttons: "Reports are public. Your location is not stored. Reporters earn points, never cash."

## 8. Unfurl card
- `functions/og/r/[spot].png.ts` uses `functions/_lib/og-render.ts`, following `functions/og/live/[room].ts`.
- Layout: `COURTS COURTS · 7.500 MHz`, then a big `1–4 waiting`, then `3 agree · 7:39 AM`. With no live reading, it shows `Court Call · Fri 7:30 AM`.
- Headers: `Cache-Control: public, max-age=60`.
- The `/r/[spot]` page sets `og:image` to `/og/r/<spot>.png`.

## 9. PR 2: Morning Edition
- **`editionDate(now)`.** Use the LA date if LA local time is 06:45 or later; otherwise use the previous date. Use `Intl` with `America/Los_Angeles`, which covers DST (DST ends 2026-11-01).
- **`editionNumber(date)`** = days since 2026-10-03, plus 1.
- **Sources** (`morning-sources.ts`):
  - **Sky:** `previewMarine` from `functions/_lib/oracles/marine-layer.ts`, plus the beach reading at the cutoff.
  - **Courts:** yesterday's last reading with bylines, the same weekday last week, and `courtCallState`.
  - **Price:** the nearest release within ±14 days with an MSRP, from `src/data/paddle-calendar.json`. Otherwise the newest register change.
  - **Town:** `src/data/front-door-news.json` items 7 days old or less. Otherwise the newest `shortwave:post:v1:` post whose handle is not in `OWNER_HANDLES`. Otherwise the almanac line.
  - **Ritual:** `netState` from `src/lib/band.ts`.
  - **Pick:** `env.ASSETS.fetch('/today.json')`.
  - **Shop:** a register paddle with "No link, no commission." THC items are excluded.
- **`GET /morning.json?d=YYYY-MM-DD`.**
  - `d` is optional. It must be between 2026-10-03 and the current edition date inclusive; otherwise return 400.
  - If the date is frozen, serve it.
  - If it is not frozen, compose it. When no source is provisional, run one D1 `batch`:
    - `INSERT OR IGNORE morning_editions`
    - byline `air_points` (10) and `byline` badges for every report id cited in the slots
  - Returns JSON Feed 1.1 with `Content-Type: application/feed+json; charset=utf-8`.
  - Cache frozen editions in `caches.default` for 300 s and provisional ones for 60 s.
- **Feed item shape:**
```json
{ "version":"https://jsonfeed.org/version/1.1", "title":"PointCast Morning Edition", "home_page_url":"https://pointcast.xyz/morning", "feed_url":"https://pointcast.xyz/morning.json",
  "items":[{ "id":"morning:2026-10-03", "url":"https://pointcast.xyz/morning?d=2026-10-03", "title":"Morning Edition No. 1 · Sat 3 Oct 2026", "date_published":"2026-10-03T13:45:00Z", "content_text":"…seven lines…",
    "_pointcast":{ "number":1, "frozen":true, "provisional":false, "reporters":["@mike","Guest 4471","@sam"], "more":2,
      "slots":[{"id":"sky","label":"Sky · 6.100","line":"…","source":"klax-asos+air","reportIds":["ar_…"],"bylines":["@jen"],"fallback":false}] } }] }
```
- **Page.** `src/pages/morning.astro` is a static BlockLayout shell.
  - It reads `?d=` and fetches `/morning.json`.
  - It renders the masthead, the live strip (`GET /api/air`) and 7 slot rows.
  - A `<noscript>` block links to `/morning.json`.
- **MCP** (`functions/api/mcp.ts`):
  - Add tool definitions next to `paddle_lookup` (~line 507) and cases next to its case (~line 1850).
  - Update the doc list (~line 85) and the HTML list (~line 3066).
  - `air_latest {spot:'courts'|'beach'}` returns the reading plus `lastWeek`.
  - `morning_edition {date?}` returns the edition object.
  - Both are read-only, with no submit tool.
- **Today round** (`functions/api/today.ts:19`): add `'morning'` to the union, and the round `{id:'morning', label:'Read the Morning Edition', href:'/morning', done:null}`.

## 10. Tests (`node --test tests/*.test.mjs`)
- **`tests/air-kinds.test.mjs`:**
  - Every rejection reason.
  - `'1–4'` (en dash) is rejected.
  - `'10'` as a string is rejected for numeric fields.
  - Extras outside the allowlist are rejected.
  - `observedAt` 16 minutes old is `stale-observation`.
  - Snapshot: v1 option values equal `['0','1-4','5+','cant']` and `['clear','hazy','none','cant']`, so buckets cannot drift.
  - No spot id collides with a reserved id.
- **`tests/air-reading.test.mjs`:**
  - Readings for none, single and agree.
  - Only the latest row per pid counts.
  - `cant` never wins against a real answer.
  - Remote rows have zero support.
  - Rows expire at 45 and 120 minutes.
  - Bars go 5, then down to 1, then expire.
  - The crew fires at 3 distinct on-site pids within 30 minutes.
  - The crew does not fire at 2, with a remote third, with the same pid twice, or with confirms by the reporter.
  - Weekly streaks are counted across an LA week boundary.
- **`tests/air-points.test.mjs`:**
  - The price list.
  - First light pays once per spot per day.
  - The cap stops at 30.
  - Remote pays 0 and `cant` pays 1.
  - `0` and `5+` award identical units.
  - The byline pays 10.
- **`tests/air-api.test.mjs`:** source assertions in the style of `paddle-wear-api.test.mjs`.
  - Only `.prepare(…).bind(` is used, with no template SQL.
  - No `VISITS.put` except through `writeStationPost`.
  - The Origin check is present.
  - No `pid_hash` or `ip_hash` appears in response builders.
  - `rateLimit` is used only in `claim.ts`.
- **`tests/shortwave.test.mjs`** (update): `normalizePost({text:'x', via:'air'})` throws. `writeStationPost` sets `via:'air'`, `attribution:'station'` and `mhz`.
- **`tests/home-shortwave-hero.test.mjs`** (update): `stepOf` honors `mhz`. 7.500 and 6.100 are outside the NET exclusion. The COURT marker renders.
- **`tests/today-rounds.test.mjs`** (update): the `morning` round is present with `done:null`.
- **`tests/morning-edition.test.mjs`:**
  - 06:44 LA returns yesterday and 06:45 returns today, including 2026-11-01.
  - Always 7 slots.
  - With zero reports, every slot is still filled and has `fallback:true` where it should.
  - A single report is labeled "1 reporter".
  - JSON Feed has `version` and `title`, and every item has an `id`.
  - A provisional edition is never frozen.
- **`radius25-passport.test.mjs`:** check that it still passes after the new stamps are appended to `PASSPORT_STAMPS`.

## 11. Reuse map

| Need | Existing code |
|---|---|
| Session and byline | `functions/api/auth/session.ts` (`readSessionFromRequest`), `functions/_lib/town-card.ts` (`readCardByUser`) |
| Validator and test pattern, `MIN_SHOWN` = 3 | `functions/_lib/paddle-wear.mjs`, `tests/paddle-wear-api.test.mjs` |
| Dial math | `src/lib/band.ts` (`BAND`, `NET`, `mhzToStep`, `formatMhz`, `townDate`, `hash32`, `netState`) |
| Live push | `announce()` in `functions/api/shortwave.ts`, PRESENCE DO, the dock bar's `pc:shortwave:post` |
| Sky slot | `src/lib/marine-oracle.ts`, `src/lib/burnoff.ts`, `functions/_lib/oracles/marine-layer.ts` (`previewMarine`) |
| Daily pick | `src/lib/daily.ts` through the static `/today.json` |
| Shop link | `src/lib/commerce.ts` (`outboundCheckout`), `functions/api/shopping-metrics.ts` |
| OG render | `functions/_lib/og-render.ts`, `functions/og/live/[room].ts` |
| Confetti | `src/components/BirthdayCelebrate.astro` (`.confetti-overlay`, `.confetti-particle`) |
| Passport | `src/lib/play-layer.ts` (`PASSPORT_STAMPS`) |
| Rate limit (claim only) | `functions/_rate-limit.ts` |
| Not used | `PC_CHECKIN_KV` (bound, no handler). Leave it alone. |

## 12. Deploy
1. Run `git fetch origin`, then create a worktree from `origin/main` on branch `cc/field-reports-2026-09-28`. Confirm the migration number.
2. Run `npm test`, then a full `npm run build`, then `node --check` on the inline scripts extracted from the built `/r/*` and `/morning` pages.
3. Run `npx wrangler d1 execute pointcast-auth --remote --file migrations/auth/0023_air.sql`. Record it in the repo's migration ledger, as Pool Together did. Seed `air_codes`.
4. Merge with a single `gh pr merge` call. This is a Pages-only deploy: there are no Worker changes and PRESENCE is untouched. Verify the remote SHA.
5. Smoke test in prod:
   - `GET /api/air` and `GET /api/air/courts`.
   - `/og/r/courts.png`.
   - One POST from a test device, then retire it with `UPDATE air_reports SET status='removed' WHERE pid_hash=?`.
   - The hero shows a blip at 7.500.
6. On Thursday, Oct 1, Mike files real reports at both spots.
7. PR 2 follows the same steps, with no migration (the table ships in 0023). Load `/morning.json` once after 6:45 on Sat, Oct 3 to confirm the freeze.

## 13. PR 3: Shop (outline)
- Add `affiliate?: {program, network, rate, disclosure}` to `outboundCheckout()`.
- Add a `src/components/PaidLink.astro` component that renders the link plus "Paid link. PointCast earns a commission if you buy."
- Add optional `paddleId`, `buyUrl`, `affiliate` and `disclosure` to `PointCastReview`.
- Add pages `/reviews/paddles/method` and `/shop/court` (a lane in `shop.astro`).
- Add a `/paddles/changes` entry announcing the change.
- Generalize the `SHOPPING_ITEMS` allowlist to include paddles.
- No live paid links until a program approves.