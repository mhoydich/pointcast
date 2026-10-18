# Field Reports v2 — build spec

2026-09-29. Architect pass (Opus) on `cc/field-reports-v2`, worktree `/Users/michaelhoydich/pc-v2`, cut from origin/main 2221dd1a.

> **foundation: changes made by the foundation pass (2026-09-29), marked "foundation:" inline.**
> 1. Migration is **0028** and the block id is **0648** (0027 and 0644 were taken; §0).
> 2. Lead update: 0 of 3 seeds verified. The El Segundo `closes` and `dropin` desk kinds are **not** added (§4.1); no conflict is seeded or hardcoded anywhere. The drafted questions stay in `docs/plans/2026-09-29-conflict-seeds.json`.
> 3. Lead update, email: `pointcast.xyz` is not onboarded to Cloudflare Email Sending and `RESEND_API_KEY` is unset. `edition_subscribers` gains `confirm_sent_at` (§2); `edition-mail.mjs` gains `mailReadiness(env)` (§4.4). Signup stores a pending row and answers plainly while mail is off; the Worker sends confirm mail to pending rows with `confirm_sent_at IS NULL` on `/send-confirm` and on every cron tick once mail works (§6.6, §7).
> 4. `air-kinds.mjs` also exports `CLAIMED_VIAS` and `parseVia`; `air-client.ts` also exports the type `AirCodeDetail`; `parseSeeds` adds `usable` per seed (§4.5).

Source of truth for scope: `docs/plans/2026-09-29-field-reports-v2-prd.md`. Its top block, "Calls made for Mike", overrides the rest of the PRD. This spec overrides the PRD wherever the two disagree on a file, a name or a number.

v1 docs this builds on: `2026-09-28-field-reports-prd.md`, `2026-09-28-field-reports-build-spec.md`, `2026-09-28-early-shift-desk-spec.md`, `2026-09-28-desk-calls-design.md`, `2026-09-28-pickleball-board.md`.

---

## 0. Ground rules (every agent)

- **Never deploy.** No `wrangler deploy`, no `--remote`, no `wrangler d1 execute` without `--local`, no `secret put`.
- **Never read secrets.** Do not open `~/.config/pointcast`, `.dev.vars` with real values, or any secrets file. Do not grep the filesystem for keys.
- **Never commit** unless your brief says you are the committer. Never use `git stash`.
- **Own your files.** Each file below has exactly one owner: the foundation or one lane (§10). Touch nothing else. If you need a change in a file you do not own, stop and put it in your return under `needs`.
- `node_modules` is a symlink to `~/pointcast/node_modules`. Do not run `npm install`. A missing dependency goes in your return.
- **Lanes do not run the site build.** Five lanes share one worktree, and parallel Astro builds clobber `dist/` and `.astro/`. The foundation runs one build before lanes start, and the integrator runs one after (§11). Lanes run their own `node --test` files and `node --check` on any `.mjs` they write.
- **Tests:** `node --test tests/<name>.test.mjs`. **Build (foundation and integrator only):** `rm -rf dist && npm run build:bare`.
- **SQL:** every statement is `db.prepare('<literal>').bind(...)`, with no `${}` inside SQL and no `.exec(`. Statements begin with `SELECT`, `INSERT`, `UPDATE` or `DELETE` (the node:sqlite fake in the tests keys off the first word or `RETURNING`; no leading comments, no `WITH`).
- **Privacy law.** `pid_hash` and `ip_hash` never leave the server. Agent rows never count as reporters, bylines or crews. Public aggregates carry no per-person times of day and no handles beyond what v1 already shows. Nothing about minors.
- **Copy voice.** Plain, short, concrete. No hype, no exclamation marks, never Mike's first person.

### Numbers decided here

| Thing | Value | Why |
|---|---|---|
| Migration | `migrations/auth/0028_field_reports_v2.sql` | foundation: renumbered from 0027. On 2026-09-29 `0026_atari_club.sql` is on origin/main and `0027_shop_agents.sql` is on `origin/cc/shop-agents-2026-09-30`, so the next free number is 0028. Re-check `git ls-tree` on every `origin/*` branch before merge; if 0028 is taken, rename to the next free number and update every test that lists it. |
| Block id | `0648` | foundation: was 0644. On 2026-09-29 the highest id on any `origin/*` branch is 0647 (`origin/cc/shop-agents-2026-09-30`; 0645 and 0646 are on main). L5 re-checks at write time and takes the next free id. |
| Session code | 4 chars from `ACDEFHJKMNPRTWXY34679` (21 chars) | No 0/O, 1/I/L, 2/Z, 5/S, 8/B, G, Q, U, V. 21^4 = 194,481. |
| Session validity | opens `starts_at − 15 min`, closes `starts_at + 2 h` | Calls made #3. |
| Kill-test window | LA days 2026-09-28 through 2026-10-23 | PRD. |
| Code cutover | LA day 2026-10-01 | Rows before it have no `code_via` and count if not house. |
| Stale fact | `checked` 45+ days old, or a block whose `until` is before today | Same 45 days as the board's "may have changed" (`STALE_DAYS` in `src/lib/court-format.ts`). |
| First emailed edition | 2026-10-03, 6:45 AM PT | `FIRST_EDITION` in `functions/_lib/morning.mjs`. |

---

## 1. Scope

Five PRD bets plus publishing. Nothing else.

| Bet | What ships | Lane |
|---|---|---|
| 1. Fix what we count | session codes, `code_via` + `code_age_min`, the house list, the kill-test counter, `/api/air/killtest`, `/r/how`, `/r/call`, the `/r/me` house button, `scripts/air-codes.mjs --session` | Foundation + L1 |
| 2. Two crews, no new game | edition slot 2 = yesterday's busiest on-site court spot (courts wins ties); "Today's courts" when there is no reading | L2 |
| 3. The paper arrives | `/morning.xml`, signup on `/morning` and on the receipt, Pages subscribe/confirm/unsubscribe, the `workers/morning-daily` Worker | L2 + L3 |
| 4. The Conflict Desk | `desk_ask` needs two disagreeing named sources or a stale fact; answered calls flip facts on `/pickleball` and `/courts.json` | Foundation + L4 |
| 5. One honest letter | `/pickleball` JSON-LD (courts, Court Call and drop-in Events with `eventStatus`), one `llms.txt` line, the letter draft | L4 + L5 |
| Publishing | one FD block, one front-door-news item, two `new-today.json` entries, the runbook | L5 |

**Cut (do not build):** Heard by N, Regulars and the geo tick, Night Editor, the spec's discovery file/schema/validator, the courts oracle, `split_shares`, the riso Court Report, fence QR, sponsors, paid assignments, season stamps, referral stamps, Web Push, SMS, new coded spots, a weekly-send cadence switch, crowd forecasts, patterns ("typical Friday").

---

## 2. Migration `migrations/auth/0028_field_reports_v2.sql` (foundation writes it)

Additive only. Old code ignores every new column and table. `ALTER TABLE … ADD COLUMN` is not idempotent: apply the file once (the runbook says how to check with `pragma_table_info`). It depends on 0023 (`air_reports`, `air_confirms`, `air_codes`) and 0025 (`air_calls`); tests apply `0001, 0023, 0024, 0025, 0028` in that order.

```sql
-- Field Reports v2 (docs/plans/2026-09-29-field-reports-v2-build-spec.md §2).
-- Additive only: new columns on air_reports, air_confirms, air_codes and
-- air_calls, and four new tables. Apply once with `wrangler d1 execute`
-- before the Pages deploy and before the morning-daily Worker deploy.
-- Pages code falls back to v1 statements on "no such column" (spec §4.9),
-- so a late migration degrades to v1 behavior instead of failing reports.

-- Bet 1: how a report's code arrived, and how old the session was.
-- typed: a 4-character session code typed into /r/<spot> or /court.
-- card:  a session code from ?c=…&via=card.
-- link:  a code from ?c= (every old 8–16 character day code is always 'link').
-- NULL:  no code, a code that did not verify, or a row from before v2.
ALTER TABLE air_reports ADD COLUMN code_via TEXT CHECK (code_via IS NULL OR code_via IN ('typed', 'card', 'link'));
ALTER TABLE air_reports ADD COLUMN code_age_min INTEGER;
ALTER TABLE air_confirms ADD COLUMN code_via TEXT CHECK (code_via IS NULL OR code_via IN ('typed', 'card', 'link'));
ALTER TABLE air_confirms ADD COLUMN code_age_min INTEGER;
CREATE INDEX IF NOT EXISTS air_reports_day_page ON air_reports(day, source, onsite);

-- Bet 1: session codes live beside day codes. A session row's code_hash is
-- codeHash(spot, CODE, AIR_CODE_PEPPER), the same hash a day code uses; its
-- code is derived again from the pepper, spot and starts_at, never stored.
-- valid_from/valid_to on a session row are the LA days it spans (v1 code
-- reads them); v2 checks starts_at − 15 min ≤ now ≤ ends_at instead.
ALTER TABLE air_codes ADD COLUMN kind TEXT NOT NULL DEFAULT 'day' CHECK (kind IN ('day', 'session'));
ALTER TABLE air_codes ADD COLUMN starts_at INTEGER;
ALTER TABLE air_codes ADD COLUMN ends_at INTEGER;
ALTER TABLE air_codes ADD COLUMN label TEXT;
ALTER TABLE air_codes ADD COLUMN created_by TEXT;
ALTER TABLE air_codes ADD COLUMN created_at INTEGER;
CREATE INDEX IF NOT EXISTS air_codes_session ON air_codes(kind, spot, starts_at);

-- Bet 1: the house list. kind 'pid' holds a phone's pid_hash, kind 'user' an
-- account id. Accounts with the broadcaster or director role are house
-- without a row. Marking a phone excludes its past rows too.
CREATE TABLE IF NOT EXISTS air_house (
  kind TEXT NOT NULL CHECK (kind IN ('pid', 'user')),
  value TEXT NOT NULL,
  note TEXT,
  added_by TEXT,
  added_at INTEGER NOT NULL,
  PRIMARY KEY (kind, value)
);

-- Bet 3: Morning Edition email. Double opt-in: a row is 'pending' until its
-- confirm link is opened. `token` is the stable unsubscribe token (43 chars,
-- base64url). confirm_hash is sha256 hex of the one-time confirm token; the
-- raw confirm token exists only inside the morning-daily Worker and the email.
CREATE TABLE IF NOT EXISTS edition_subscribers (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  token TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'morning' CHECK (source IN ('morning', 'receipt', 'card', 'other')),
  user_id TEXT,
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER,
  last_sent_day TEXT,
  confirm_hash TEXT,
  confirm_expires_at INTEGER,
  confirm_sent_at INTEGER,
  CHECK ((confirm_hash IS NULL) = (confirm_expires_at IS NULL))
);
CREATE INDEX IF NOT EXISTS edition_subscribers_send ON edition_subscribers(status, last_sent_day);
CREATE INDEX IF NOT EXISTS edition_subscribers_unsent ON edition_subscribers(status, confirm_sent_at);
CREATE UNIQUE INDEX IF NOT EXISTS edition_subscribers_confirm ON edition_subscribers(confirm_hash) WHERE confirm_hash IS NOT NULL;

-- Bet 3: one row per LA day the morning-daily Worker ran (like kennel_daily_runs).
CREATE TABLE IF NOT EXISTS morning_daily_runs (
  day TEXT PRIMARY KEY,
  edition_number INTEGER,
  frozen INTEGER NOT NULL DEFAULT 0 CHECK (frozen IN (0, 1)),
  reason TEXT CHECK (reason IS NULL OR reason IN ('not-frozen', 'email-not-configured', 'no-subscribers')),
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  attempted INTEGER NOT NULL DEFAULT 0,
  sent INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  dry_run INTEGER NOT NULL DEFAULT 0 CHECK (dry_run IN (0, 1)),
  configured INTEGER NOT NULL DEFAULT 0 CHECK (configured IN (0, 1))
);

-- Bet 4: the Conflict Desk. `fact` is the schedule fact a call's desk kind
-- resolves ('hours', 'access', 'block:<slug>' or a facts[].key), from the
-- kind's `resolves` in src/data/air-spots.json. basis_json says why the call
-- was allowed: two named sources that disagree, or a stale fact.
ALTER TABLE air_calls ADD COLUMN fact TEXT;
ALTER TABLE air_calls ADD COLUMN basis_json TEXT CHECK (basis_json IS NULL OR json_valid(basis_json));
CREATE INDEX IF NOT EXISTS air_calls_answered_fact ON air_calls(spot, fact, answered_at) WHERE status = 'answered' AND fact IS NOT NULL;
```

foundation: `confirm_sent_at` (lead update) is when the Worker last sent the row a confirm mail. NULL means never: the signup came in while the paper's mail was off. The file as shipped is `migrations/auth/0028_field_reports_v2.sql`; its header comment also says how to check `pragma_table_info` before applying.

`basis_json` shapes (written by L4's `askCall`, read by the foundation's `basisView()`):

```json
{"type":"conflict","sources":[{"name":"rec.us","url":"https://…","says":"22:00"},{"name":"City of El Segundo","url":"https://…","says":"21:00"}]}
{"type":"stale","src":"ES1","url":"https://…","checked":"2026-08-10"}
```

---

## 3. Shared rules every lane uses

### 3.1 The house clause (literal SQL, copy it exactly)

A row `r` of `air_reports` is house when its phone or account is on `air_house`, or its account has the `broadcaster` or `director` role. Any statement that must exclude house rows appends:

```sql
AND NOT EXISTS (SELECT 1 FROM air_house h WHERE (h.kind = 'pid' AND h.value = r.pid_hash) OR (h.kind = 'user' AND h.value = r.user_id))
AND NOT EXISTS (SELECT 1 FROM users u, json_each(COALESCE(json_extract(u.payload, '$.roles'), '[]')) j WHERE u.id = r.user_id AND j.value IN ('broadcaster', 'director'))
```

The kill test does the same exclusion in JS (`isHouse()`, §4.3) because it needs the numbers split strict/loose. Both must agree; L1's API test asserts they do on one fixture.

A statement that references `air_house` fails before migration 0028. Every caller wraps it and falls back (L2: to spot `courts`; L1: a 503).

### 3.2 Time

LA calendar days everywhere (`laDate`, `laParts` in `functions/_lib/air-reading.mjs`; `laWallToMs` in `functions/_lib/air-assign.mjs`). Epoch ms in D1 for times, `YYYY-MM-DD` for days. Public dates print as "Oct 5" (`MON d`). Never print a person's time of day in a new public surface.

### 3.3 Who is a director

`hasDirectorDeskAccess(session)` from `src/lib/director-access.ts`, read with `readSessionFromRequest(request, env)` from `functions/api/auth/session.ts`, exactly as `functions/api/air/assign.ts` does. The only role that exists today is `broadcaster`; the SQL clause also accepts `director` for later.

---

## 4. Foundation (Opus, sequential, before any lane)

The foundation writes the migration, every pure module more than one lane imports, and the small hook points in shared files, so that no two lanes ever edit the same file. After the foundation finishes, the files it touched are frozen unless §10 hands one to a lane.

### 4.1 `src/data/air-spots.json`

1. `reserved` becomes `["confirm","me","claim","board","index","assign","agent","desk","how","call","killtest","house","session"]`.
2. Existing desk kinds gain two optional keys (no option value changes):
   - `courts.sign`: `"evidence": "posted-sign", "resolves": {"fact": "access", "expect": "weekends"}`
   - `manhattan-heights.closes`: `"evidence": "posted-sign", "resolves": {"fact": "hours", "expect": null}`
   - `el-segundo.lights`: `"evidence": "reported"` (no `resolves`: no schedule fact to flip)
3. foundation: **not done** (lead update, 2026-09-29: 0 of 3 seeds verified; "seed nothing and hardcode no conflict anywhere in UI or data"). `el-segundo` keeps `wait, parking, vibe, lights`. The two kinds below stay a draft: add them only when a seed verifies. The `dropin` options encode the old Places2Play Thu/Sat listing, which is gone (404). The closing-time question is drafted in the seeds file with a `No sign` answer; `air-conflict.mjs` already treats `nosign` like `cant`. L4's "courtCall on a second desk kind" test needs a config with two desk kinds on one court: build it in the test (tests/air-conflict.test.mjs shows how). The draft kinds, for reference:

```json
"closes": {
  "question": "What closing time is on the posted sign?",
  "role": "side", "desk": true, "points": 3, "decayMin": 43200,
  "options": [{"v":"21:00","label":"9 PM"},{"v":"22:00","label":"10 PM"},{"v":"other","label":"Another time"},{"v":"cant","label":"Can't say"}],
  "readingLabels": {"21:00":"Sign: closes 9 PM","22:00":"Sign: closes 10 PM","other":"Sign: another closing time","cant":"Can't say"},
  "extras": [], "editorGuess": null,
  "evidence": "posted-sign", "resolves": {"fact": "hours", "expect": "22:00"}
},
"dropin": {
  "question": "Which days is advanced drop-in, per the Checkout Building?",
  "role": "side", "desk": true, "points": 3, "decayMin": 43200,
  "options": [{"v":"mon-fri","label":"Mon evening, Fri morning"},{"v":"thu-sat","label":"Thu evening, Sat morning"},{"v":"both","label":"All four"},{"v":"other","label":"Other days"},{"v":"cant","label":"Can't say"}],
  "readingLabels": {"mon-fri":"Advanced drop-in: Mon and Fri","thu-sat":"Advanced drop-in: Thu and Sat","both":"Advanced drop-in: Mon, Thu, Fri and Sat","other":"Advanced drop-in: other days","cant":"Can't say"},
  "extras": [], "editorGuess": null,
  "evidence": "reported", "resolves": {"fact": "block:advanced-drop-in", "expect": "mon-fri"}
}
```

   foundation: the seeds file marks each seed `"verified": false` and has no `status`. `parseSeeds()` reads `usable` as: `status === 'verified'`, or no `status` and `verified === true`, and both source URLs present. None are usable today, so nothing below applied.

   **Seeds.** If `docs/plans/2026-09-29-conflict-seeds.json` exists when the foundation runs, read it (§8.1 shape). For each seed with `status` absent or `"verified"`: keep these kind ids and option values when the seed's two `says` map to them; take the seed's `question` text and answer labels. Add a desk kind only when a verified seed needs one that is not here. Never change an option value of a kind that existed on 2026-09-28. Record what you did in your return.
4. `desk.templates` gains:

```json
"basis": { "conflict": "{hostA} says {labelA}. {hostB} says {labelB}.", "stale": "Last checked {checked} on {host}: {label}." },
"check": { "agrees": "Confirmed on site {on}.", "differs": "On site {on}: {label}.", "seen": "Seen on site {on}: {label}." }
```

### 4.2 `functions/_lib/air-session.mjs` (new, pure)

Imports only `./air-kinds.mjs` (`codeHash`, `spotOf`), `./air-reading.mjs` (`laDate`, `laParts`, `isoSec`) and `./air-assign.mjs` (`laWallToMs`).

```js
export const SESSION_ALPHABET = 'ACDEFHJKMNPRTWXY34679';
export const SESSION_CODE_LEN = 4;
export const SESSION_EARLY_MS = 15 * 60_000;      // opens 15 min before starts_at
export const SESSION_VALID_MS = 2 * 3_600_000;    // ends_at = starts_at + 2 h
export const SESSION_MAX_AHEAD_DAYS = 14;
export const SESSION_MAX_BEHIND_MS = 3_600_000;   // a start up to 1 h ago may still be scheduled
export const SESSIONS_PER_DAY = 10;               // creates per LA day, all spots
export const SESSION_LABEL_MAX = 40;
export const CODE_VIAS = Object.freeze(['typed', 'card', 'link']);
export const SESSION_REASONS = Object.freeze(['bad-json', 'bad-action', 'bad-spot', 'bad-day', 'bad-start', 'bad-label']);

/** 'air-session:<spot>:<ISO of startsAt>' (toISOString(), milliseconds included). */
export function sessionInput(spot, startsAt)
/** HMAC-SHA-256(pepper, sessionInput) → 4 chars: for i in 0..3, ALPHABET[((sig[2i] << 8) | sig[2i+1]) % 21]. null without a pepper. */
export async function sessionCode(pepper, spot, startsAt)
/** { opensAt: startsAt − EARLY, endsAt: startsAt + VALID } */
export function sessionWindow(startsAt)
/** Whether row {starts_at, ends_at} is open at now: starts_at − EARLY ≤ now ≤ ends_at. */
export function isSessionOpen(row, now)
/** A typed code: trim, drop spaces and dashes, upper-case. Returns /^[A-Z0-9]{2,16}$/ or null. (A typed 10-char day code is accepted; it is still 'link'.) */
export function normalizeTypedCode(input)
/** How a verified code arrived. null when codeKind is null; 'link' for a day code whatever was claimed; for a session: claimed if in CODE_VIAS, else 'link'. */
export function codeVia({ codeKind, claimed })
/** Minutes since the session start, floored (may be −15..120); null for a day code or no code. */
export function codeAgeMin({ codeKind, startsAt, at })
/** POST /api/air/session body → {action:'create', spot, startsAt, label} | {action:'void', spot, startsAt} | {reason}.
 *  create: {action, spot (spotOf, not reserved), day 'YYYY-MM-DD', start 'HH:MM', label?}; startsAt = laWallToMs(day, start);
 *    bad-start unless now − MAX_BEHIND ≤ startsAt ≤ now + 14 days; label: trimmed, 1..40 chars, no control chars or < >, else bad-label; absent → null.
 *  void: {action:'void', spot, startsAt: integer ms or ISO string}. */
export function parseSessionPost(config, body, now)
/** The air_codes row to INSERT: {spot, code_hash, valid_from, valid_to, kind:'session', starts_at, ends_at, label, created_by, created_at} plus `code` (never stored). valid_from = laDate(opensAt), valid_to = laDate(endsAt). null without a pepper. */
export async function sessionRowOf({ spot, startsAt, label, createdBy, now, pepper })
/** Director view: {spot, spotName, label, startsAt, opensAt, endsAt (ISO seconds), code, state: 'upcoming'|'open'|'closed'} */
export function sessionView(config, row, code, now)
```

### 4.3 `functions/_lib/air-killtest.mjs` (new, pure)

Imports `kindOf`, `kindRole` from `./air-kinds.mjs` and `laParts`, `isoSec`, `laDate` from `./air-reading.mjs`.

```js
export const KILL_TEST = Object.freeze({ from: '2026-09-28', to: '2026-10-23', cutover: '2026-10-01', minReports: 10, minPeople: 3, skipWeekday: 5 });
export const HOUSE_ROLES = Object.freeze(['broadcaster', 'director']);
/** air_house rows [{kind, value}] → {pids: Set, users: Set} */
export function houseSets(rows)
/** roles: a JSON string, an array or null → whether it holds a HOUSE_ROLES entry. Bad JSON is false. */
export function hasHouseRole(roles)
/** row {user_id, pid_hash, roles} */
export function isHouse(row, house)
/** A kind the test counts: the spot's live question (kindRole === 'live'), i.e. courts/el-segundo/… 'wait' and beach 'fog'. */
export function countedKind(config, spot, kind)
/** code_via is 'typed' or 'card', or the row is from before the cutover (day < '2026-10-01') and code_via is null. */
export function strictCode(row)
/**
 * rows: {spot, kind, day, slot, user_id, pid_hash, roles, onsite, source, status, code_via}.
 * Keep: source 'page', status 'ok', onsite 1, day in [from, to], countedKind, !isHouse.
 * One per (reporter = user_id ?? pid_hash, spot, kind, slot).
 * Friday (LA weekday of `day` === 5) rows go to `fridays` and nowhere else.
 * strict: the rest where strictCode; loose: the rest.
 * → { window: {from, to}, needs: {reports, people},
 *     strict: {reports, people, pass}, loose: {reports, people}, fridays: {reports},
 *     final: laDate(now) > to, asOf: isoSec(now) }
 * pass = reports ≥ 10 && people ≥ 3. Numbers only: no ids, days or bylines in the result.
 */
export function killTestCount(config, rows, house, now)
/** The rules, one plain sentence each, printed on /r/how in this order. */
export const KILL_TEST_RULES = Object.freeze([
  'A report counts when a person answers a spot’s main question while at the spot.',
  'At the spot means the phone carried a code: a 4-character session code, said out loud at the court and typed in.',
  'A session code opens 15 minutes before the session and closes 2 hours after it starts.',
  'A code that arrives inside a shared link counts on the loose line only.',
  'Reports from before Oct 1, 2026 count if the phone had any code, because typed codes did not exist yet.',
  'Friday reports are left out. Friday is the Court Call; the test asks about the other six days.',
  'House phones and house accounts never count. Agents never count.',
  'One report per person per spot per half hour.',
  'The test passes with 10 or more reports from 3 or more people, Sep 28 to Oct 23, 2026.',
  'The loose count prints beside it for learning. Pass or fail is read on the strict count only.',
]);
```

### 4.4 `functions/_lib/edition-mail.mjs` (new, pure; imported by Pages and the Worker)

No imports from the repo (the Worker bundles it). WebCrypto global.

```js
export const EDITION_SENDER = 'morning@pointcast.xyz';
export const EDITION_FROM = `PointCast Morning Edition <${EDITION_SENDER}>`;
export const SITE = 'https://pointcast.xyz';
export const FIRST_EDITION = '2026-10-03';          // test: equals morning.mjs FIRST_EDITION
export const SEND_HOUR = 6;                          // LA hour the crons act in
export const CONFIRM_TTL_MS = 48 * 3_600_000;
export const CONFIRM_RESEND_MS = 60_000;             // one confirm mail per address per minute
export const PENDING_TTL_MS = 7 * 86_400_000;        // unconfirmed rows older than this are deleted by the Worker
export const SUB_SOURCES = Object.freeze(['morning', 'receipt', 'card', 'other']);
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
export function normalizeEmail(v)                    // same rule as functions/api/auth/email/_shared.ts
export function parseSource(v)                       // one of SUB_SOURCES, default 'morning'
export function newToken()                           // 32 random bytes → 43-char base64url
export async function sha256Hex(s)
export function timingSafeEqual(a, b)                // length check + XOR accumulate (as air-desk-store.ts)
export function escapeHtml(s)
export function confirmUrl(raw)                      // `${SITE}/api/morning/confirm?t=${raw}`
export function unsubscribeUrl(token)                // `${SITE}/api/morning/unsubscribe?t=${token}`
export function editionUrl(date)                     // `${SITE}/morning?d=${date}&src=em`
/** {send, day, reason}: send only when laParts(ms).hour === 6 and day ≥ FIRST_EDITION; reason 'not-6am' | 'before-first-edition' | null.
 *  Uses Intl with America/Los_Angeles directly (no repo import). */
export function shouldSend(ms)
/** The JSON Feed item for `day` when it is frozen: id 'morning:<day>', _pointcast.frozen === true, _pointcast.provisional !== true, 7 slots with non-empty lines. Else null. */
export function frozenItem(feed, day)
/** {subject, text, html, headers}. subject = item.title. headers: List-Unsubscribe <unsubscribeUrl>, List-Unsubscribe-Post 'List-Unsubscribe=One-Click'. */
export function editionEmail(item, token)
/** {subject, text, html} for the double opt-in mail. */
export function confirmEmail(raw)
// foundation: also exported
export const EDITION_SLOTS = 7;
export const reportUrl = () => `${SITE}/r?src=em`;
/** Lead update: RESEND_API_KEY is the only proven rail; a SEND_EMAIL binding alone is never "configured".
 *  → {configured, via: 'resend' | null, reason: null | 'resend-key-unset'} */
export function mailReadiness(env)
```

`editionEmail` text layout (HTML is the same content: one column, system fonts, every value escaped, no images, no pixel, no tracking parameters except `src=em`):

```
MORNING EDITION · No. 1 · SAT 3 OCT 2026 · 6:45 AM          (_pointcast.masthead)
On the air yesterday: @mike, Guest 4471                      (_pointcast.reporterLine, omitted when empty)

Sky · 6.100
Under the marine layer at KLAX, 6:00 AM (900 ft).
… one label line and one text line per slot, seven slots …

Reporters earn points, never cash, and never for what a report says.   (_pointcast.footer)
No link, no commission.                                                (_pointcast.disclosure)

Read it on the site: https://pointcast.xyz/morning?d=2026-10-03&src=em
Report from a court: https://pointcast.xyz/r?src=em
Unsubscribe: https://pointcast.xyz/api/morning/unsubscribe?t=<token>
```

`confirmEmail`: subject `Confirm the PointCast Morning Edition`. Text: `Open this link to get the Morning Edition by email at 6:45 AM each day:` / the link / `The link works for 48 hours. If you did not ask for this, ignore this email and nothing more will be sent.`

### 4.5 `functions/_lib/air-conflict.mjs` (new, pure)

Imports `kindOf`, `labelOf`, `spotOf` from `./air-kinds.mjs`, `laDate`, `laParts` from `./air-reading.mjs`, and `fill`/`deskTemplate` are NOT imported (avoid a cycle): it reads `config.desk.templates.basis/check` itself with its own 6-line `fill`. `air-desk.mjs` imports this module, not the reverse.

```js
export const STALE_FACT_DAYS = 45;                       // test: equals STALE_DAYS in src/lib/court-format.ts
export const EVIDENCE = Object.freeze(['posted-sign', 'reported']);
export const HOURS_CONFIDENCE = Object.freeze(['verified', 'posted-sign', 'reported', 'unknown']);
export const SOURCE_NAME_RE = /^[A-Za-z0-9 .,&'()\/-]{1,40}$/;
/** 'Advanced drop-in' → 'advanced-drop-in' */
export function slugOf(label)
/** kind config → {fact, expect, evidence} | null (no `resolves`). evidence defaults to 'reported'. */
export function resolvesOf(kindCfg)
/** The fact id a spot+kind resolves, or null. */
export function factOfKind(config, spot, kind)
/**
 * The schedule entry behind a fact on a court: 'hours' → court.hours; 'access' or any other key → court.facts[key];
 * 'block:<slug>' → court.blocks whose slugOf(label) === slug (an array). null when absent.
 */
export function factEntry(schedule, spot, fact)
/** {checked, src, url} when the fact is stale at `now` (§0 rule, oldest checked of a block group; a block past `until` is stale); else null. */
export function staleBasis(schedule, spot, fact, now)
/**
 * Why a desk_ask may go out. input: {spot, kind, belief, sourceUrl?, sources?}; ctx: {schedule, now}.
 * - sources present: must be an array of exactly 2 {name, url, says}. name matches SOURCE_NAME_RE; url passes
 *   safeSourceUrl (passed in as ctx.safeUrl to avoid a cycle); the two urls differ; each says is an option value of the
 *   kind other than 'cant'; the two says differ. Any failure → {reason:'bad-sources'}.
 *   belief must equal one of the says → else {reason:'bad-belief'}. sourceUrl, if given, must equal that source's url →
 *   else {reason:'bad-source-url'}; if absent it becomes that url.
 *   → {fact: factOfKind(...) , basis: {type:'conflict', sources:[{name, url, says}×2]}, sourceUrl}
 * - no sources: staleBasis(schedule, spot, factOfKind(...), now) must be non-null → {fact, basis:{type:'stale', src, url, checked}, sourceUrl}
 *   (sourceUrl as given, validated by the caller as before); else {reason:'no-basis'}.
 */
export function askBasis(config, input, ctx)
/** CallView.basis from an air_calls row's basis_json (bad or missing JSON → null):
 *  conflict → {type:'conflict', sources:[{host, url, says, label}]}; stale → {type:'stale', host, url, checked:'Sep 28', label: belief label}.
 *  host = hostname without 'www.'; label = the option label of `says`. */
export function basisView(config, call, belief)
/** The basis line as fillParts-style parts [{text, key?}] from templates basis.conflict / basis.stale. */
export function basisParts(config, view)
/**
 * rows (newest answered first): {spot, kind, fact, value, observed_at} for answered calls with a fact,
 * joined to their answering report (on site, human, ok). Newest per (spot, fact); 'cant' and unknown kinds dropped.
 * → [{spot, fact, kind, on:'YYYY-MM-DD', value, label (readingLabels), evidence, agrees: true|false|null, line}]
 * agrees: null when resolves.expect is null; false when value is 'other'; else value === expect.
 * line: check.agrees / check.differs / check.seen with {on:'Oct 5', label}.
 */
export function factChecks(config, rows)
/** /courts.json hours_source: {url, checked, confidence, confirmed_on}. Base: hours verified → 'verified', else 'unknown';
 *  no hours → all null + 'unknown'. A 'hours' check: value 'other' → confidence 'unknown', confirmed_on null;
 *  otherwise confidence = check.evidence, confirmed_on = check.on. */
export function hoursSource(court, sources, checks)
/** closures[]: verified blocks of kind 'closed' → {from, to, reason: label, source:{id,label,url}}, plus a verified
 *  facts 'status' when court.status === 'closed' → {from:null, to:null, reason:text, source}. */
export function closuresOf(court, sources)
/** docs/plans/2026-09-29-conflict-seeds.json → {seeds:[…]} (array or {seeds}); a seed needs id, spot, fact, sourceA, sourceB. */
export function parseSeeds(json)
```

foundation: `askBasis` and `factChecks` treat both `cant` and `nosign` as non-answers (never a source's `says`, never a check). `parseSeeds` returns each kept seed with `usable: boolean`. `basisParts` on a stale basis with no URL prints `the schedule` for `{host}`.

### 4.6 `functions/_lib/air-desk.mjs` (hook points only)

- `DESK_REFUSALS` gains `'no-basis': 400, 'bad-sources': 400`.
- `TEMPLATE_VARS` gains `'basis.conflict': ['hostA','labelA','hostB','labelB']`, `'basis.stale': ['host','checked','label']`, `'check.agrees': ['on']`, `'check.differs': ['on','label']`, `'check.seen': ['on','label']`.
- `parseDeskPost(config, body, ctx = {})`: the `ask` branch accepts optional `sources` and makes `sourceUrl` optional when `sources` is present. After the existing checks it calls `askBasis(config, {spot, kind, belief, sourceUrl, sources}, {schedule: ctx.schedule ?? null, now: ctx.now ?? Date.now(), safeUrl: safeSourceUrl})` and returns `{action:'ask', agent, spot, kind, belief, sourceUrl, fact, basis}` or its `{reason}`. With no `ctx.schedule`, only a conflict basis can pass. `pass` is unchanged.
- `callView(config, call, belief, now)` adds `fact: call.fact ?? null` and `basis: basisView(config, call, belief)`.
- Re-export `basisParts` for the client.

### 4.7 `functions/_lib/air-kinds.mjs` (hook points only)

- foundation: exported as `CLAIMED_VIAS` and `parseVia(v)`.
- `parseAirReport` and `parseConfirm` read an optional `body.via`. It becomes `via: 'typed'|'card'|'link'|null`: any other value is `null`. `via` never causes a refusal. `AIR_REASONS` is unchanged.

### 4.8 `src/lib/air.ts` (types only)

- `AirKind` gains `evidence?: 'posted-sign' | 'reported'; resolves?: { fact: string; expect: string | null }`.
- `AirDeskTemplates` gains `basis: {conflict: string; stale: string}` and `check: {agrees: string; differs: string; seen: string}`.
- New: `export type CodeVia = 'typed' | 'card' | 'link';`
- New: `export type CallBasisView = { type: 'conflict'; sources: { host: string; url: string; says: string; label: string }[] } | { type: 'stale'; host: string | null; url: string | null; checked: string; label: string };`
- `CallView` gains `fact: string | null; basis: CallBasisView | null`.
- New: `export type FactCheck = { spot: string; fact: string; kind: string; on: string; value: string; label: string; evidence: 'posted-sign' | 'reported'; agrees: boolean | null; line: string };`
- New: `export type KillTestPayload = { ok: true; window: {from: string; to: string}; needs: {reports: number; people: number}; strict: {reports: number; people: number; pass: boolean}; loose: {reports: number; people: number}; fridays: {reports: number}; final: boolean; asOf: string };`

### 4.9 `functions/_lib/air-store.ts` (hook points only)

1. `ParsedReport` and `ParsedConfirm` gain `via: CodeVia | null`.
2. `writeGate` returns `{ retryAfter, onsite, codeKind: 'day' | 'session' | null, startsAt: number | null }`. The code statement becomes (v2):

   ```sql
   SELECT kind, starts_at FROM air_codes WHERE spot = ? AND code_hash = ?
     AND ((kind = 'day' AND valid_from <= ? AND valid_to >= ?) OR (kind = 'session' AND starts_at <= ? AND ends_at >= ?))
     ORDER BY kind LIMIT 1
   ```
   bound `(spot, hash, today, today, now + SESSION_EARLY_MS, now)`. If the batch throws with a message matching `/no such column|has no column/i`, run it again with the v1 statement (`SELECT 1 AS ok FROM air_codes WHERE spot = ? AND code_hash = ? AND valid_from <= ? AND valid_to >= ?`) and treat a hit as `codeKind: 'day'`. Validity is checked against server time, never `observedAt`.
3. `fileReport`: compute `via = gate.onsite ? codeVia({codeKind: gate.codeKind, claimed: p.via}) : null` and `ageMin = gate.onsite ? codeAgeMin({codeKind: gate.codeKind, startsAt: gate.startsAt, at: p.observedAt}) : null`. The upsert adds `code_via, code_age_min` to the column list and `code_via = COALESCE(excluded.code_via, air_reports.code_via), code_age_min = CASE WHEN excluded.code_via IS NULL THEN air_reports.code_age_min ELSE excluded.code_age_min END` to the `DO UPDATE SET`, and `code_via` to `RETURNING` and to `Saved`. Same "no such column" fallback to the v1 statement (then `code_via` reads as null).
4. `confirmReport`: the confirm insert adds `code_via, code_age_min` (computed after `sameNet`: only when the confirm counts on site). Same fallback.
5. `viewFiled` adds `report.via: saved.code_via ?? null`. The views section still never reads a hash.
6. `loadCall` selects `fact, basis_json` too (fallback: the v1 select, with both null).
7. Nothing else in this file changes. `answerCall` is untouched: an answered call with a `fact` is what becomes a fact check (§8.3).

### 4.10 `src/scripts/air-client.ts` (hook points only)

- Stored code JSON becomes `{code, at, via}`. `codeFor(spot)` stores `via: 'card'` when `?via=card` is in the URL, else `'link'`, for a `?c=` code.
- New exports: `storedVia(spot): CodeVia | null` (a live stored code with no `via` reads `'link'`), `setTypedCode(spot, raw): string | null` (uses `normalizeTypedCode`; stores `{code, at: Date.now(), via: 'typed'}`), `clearCode(spot): void`, `AIR_CODE_EVENT = 'air:code'` (detail `{code: string | null, via: CodeVia | null}`).
- `mountAirSpot`: `const code` becomes `let code = codeFor(spot); let codeVia = code ? storedVia(spot) : null;`. Listen on `root` for `AIR_CODE_EVENT`: set both, set `data-air-code`. Report bodies and confirm bodies carry `via: codeVia` (the `ReportBody` type gains it; queued items keep it).
- `settleReport`: when `j.report.code === 'unknown'` and the report was sent with `via === 'typed'`, the remote note reads `That code does not match a session here right now. Filed from away.` Every other case keeps its v1 copy.
- `paintCall(call)`: hide every `[data-pb-call]` in `root`; show only `[data-pb-call="<spot>:<call.kind>"]` and fill that shell's `[data-pb-call-head]` / `[data-pb-call-belief]`.
- foundation: also exports the type `AirCodeDetail = {code: string | null; via: CodeVia | null}`. `CallResultView` gains `spot?`, `kind` and `basis?`. `paintCallLines` italicizes every part whose key starts with `label` (`label`, `labelA`, `labelB`).
- `paintCallLines(head, belief, call)`: when `call.basis` is set, the belief element renders `basisParts(AIR_CONFIG, call.basis)` (same span-per-part rendering as today); otherwise `beliefParts` as today.

### 4.11 `src/components/air/AirSpot.astro` and two stubs

- Render one `<DeskCall>` per `deskKinds(spot)` entry inside the receipt (today it renders only `[0]`).
- Inside `.air__ask`, right after `.air__buttons`: `<CodeField spot={spot.id} />`.
- Inside `.air__receipt`, after the queued note and before the desk calls: `<PaperSignup source="receipt" />`.
- New stub `src/components/air/CodeField.astro`: `interface Props { spot: string }` and `<div class="air-codefield" data-air-codefield={spot} hidden></div>`. **L1 owns it after the foundation.**
- New stub `src/components/air/PaperSignup.astro`: `interface Props { source: 'receipt' | 'morning' }` and `<p class="air-paper" data-air-paper={source} hidden></p>`. **L2 owns it after the foundation.**

### 4.12 Existing tests the foundation updates

- Add `'0028_field_reports_v2.sql'` after 0025 in the migration lists of `tests/air-api.test.mjs`, `tests/air-desk-api.test.mjs`, `tests/air-board-api.test.mjs`, `tests/early-shift-run.test.mjs`, and after `M0025` in `tests/air-desk.test.mjs`. Leave `tests/air-roles.test.mjs`, `tests/morning-api.test.mjs` and `tests/air-assign*.test.mjs` on their old lists: they prove the v1 fallback.
- foundation: `tests/air-desk-api.test.mjs` also changed outside its migration line: the hook makes every v1 ask need a basis, so its `ask` helper wraps bodies in `withSources()` (two disagreeing sources, the asker's own `sourceUrl` first), and the resident-gate and MCP cases use it too. L4 owns the file from here and adds the basis cases (§8.8). The MCP case still asserts only `SIGN_URL` was fetched; L4's `askCall` will also resolve the second source URL, so update that assertion then.
- `tests/air-kinds.test.mjs`: the reserved list (line ~105) gains the five new ids; `via` parse cases.
- `tests/air-desk.test.mjs`: `parseDeskPost` ask cases now pass `sources` (or a stale ctx); new refusals `no-basis` and `bad-sources`; `TEMPLATE_VARS` coverage for the new keys; `callView` carries `fact` and `basis`.
- `tests/air-assign.test.mjs`, `tests/courts-schedule.test.mjs`: only if the new reserved ids or desk kinds break them.
- Source-regex tests that read `air-client.ts` or `AirSpot.astro`: `tests/air-pages.test.mjs`, `tests/air-roles.test.mjs`, `tests/air-assign-pages.test.mjs`, `tests/air-desk-pages.test.mjs`. Fix only what the hook points break (the multi-`DeskCall` render, `let code`, the new `via` in bodies). `tests/air-desk-pages.test.mjs` then goes to L4.

### 4.13 New foundation tests

| File | Covers |
|---|---|
| `tests/air-session.test.mjs` | alphabet has 21 unique chars and none of `0O1IL2Z5S8BGQUV`; `sessionCode` is stable, 4 chars, differs by spot and start, null without pepper; `sessionWindow`; `isSessionOpen` at −16, −15, +120, +121 min; `normalizeTypedCode`; `codeVia` table (day → link whatever claimed; session typed/card/link/garbage → typed/card/link/link; null kind → null); `codeAgeMin`; `parseSessionPost` every reason; `sessionRowOf` valid_from/valid_to across midnight and on 2026-11-01. |
| `tests/air-killtest.test.mjs` | every filter; dedupe per person/spot/slot; Friday split; cutover (a 09-29 row with null via counts strict, a 10-03 row with null via counts loose only (foundation: 10-02 is a Friday, so it would go to `fridays`), a `link` row counts loose only); house by pid, by user, by role JSON; agent rows never count; pass at exactly 10 and 3; `final` flips on 2026-10-24 LA; result has no ids. |
| `tests/edition-mail.test.mjs` | `FIRST_EDITION` equals morning.mjs; `shouldSend` at 13:45Z and 14:45Z on 2026-10-03, 2026-11-01 and 2026-11-02 (exactly one of each pair sends; 2026-10-02 never); `frozenItem` refuses provisional/unfrozen/6-slot items; `editionEmail` escapes `<script>` in a slot line, has both List-Unsubscribe headers, every link carries `src=em` except unsubscribe, no `<img`; `normalizeEmail`; token shape; `timingSafeEqual`. |
| `tests/air-conflict.test.mjs` | `askBasis`: two valid sources pass; same url, same says, `cant` says, 1 or 3 sources, bad name → `bad-sources`; belief not among says → `bad-belief`; no sources + fresh fact → `no-basis`; no sources + 46-day-old fact → stale basis; block past `until` → stale; `basisView` + `basisParts` text; `factChecks` newest-per-fact, agrees true/false/null, `other`; `hoursSource` all branches; `closuresOf` on the kelly court; `parseSeeds` array and object forms; `STALE_FACT_DAYS` equals `STALE_DAYS`. |
| `tests/air-code-via.test.mjs` | store level on node:sqlite (copy the `SqliteD1` fake from `tests/air-api.test.mjs`, migrations 0001/0023/0024/0025/0028, pepper `test`): a session row inserted via `sessionRowOf`; a report typed 10 min after start is on site with `code_via 'typed'`, `code_age_min 10`; via `link` claimed → `'link'`; 16 min early and 2 h 1 min late → remote, `code_via` null; a day code → `'link'`, `code_age_min` null; a confirm stores via; on a DB without 0028 the same report files on site through the fallback. |

### 4.14 Foundation verify

```
node --test tests/air-session.test.mjs tests/air-killtest.test.mjs tests/edition-mail.test.mjs tests/air-conflict.test.mjs tests/air-code-via.test.mjs
node --test tests/air-*.test.mjs tests/morning-*.test.mjs tests/court*.test.mjs tests/early-shift-*.test.mjs
rm -rf dist && npm run build:bare
```

All must pass (report any test that already failed on 2221dd1a as pre-existing, with its name). Then stop: lanes start from this state.

---

## 5. Bet 1: fix what we count (L1)

### 5.1 Session codes: `functions/api/air/session.ts` + `functions/_lib/air-count-store.ts`

- `GET /api/air/session` → director only (403 `forbidden` otherwise; 503 `pepper-unset` without `AIR_CODE_PEPPER`; 503 `store-unavailable` without D1). Returns `{ok, sessions: SessionView[], serverTime}` for `kind = 'session' AND ends_at >= now − 7 days`, newest start first, at most 50, each code re-derived with `sessionCode`. `Cache-Control: no-store`.
- `POST /api/air/session` → `readPost` (Origin, JSON, size) first, then director check, then `parseSessionPost`.
  - `create`: count today's creates (`SELECT COUNT(*) AS n FROM air_codes WHERE kind = 'session' AND created_at >= ?` bound to `laDayStart(now)`) → 429 `daily-cap` at 10. Build the row with `sessionRowOf`. Insert with `INSERT OR IGNORE INTO air_codes (spot, code_hash, valid_from, valid_to, kind, starts_at, ends_at, label, created_by, created_at) VALUES (…)`. `changes = 0` → look up the existing row by `(spot, code_hash)`: same `starts_at` → 409 `session-exists`; different → 409 `code-taken` (the reply tells the director to move the start by one minute, which changes the code). 201 `{ok, session}`.
  - `void`: `UPDATE air_codes SET ends_at = ? WHERE kind = 'session' AND spot = ? AND starts_at = ? AND ends_at > ?` bound `(now, spot, startsAt, now)` → 404 `not-found` when nothing changed, else `{ok}`. Voiding closes a code; it never deletes a row.
- `created_by` is `user:<userId>`.

### 5.2 The house list: `functions/api/air/house.ts`

- `GET /api/air/house` with header `X-PC-Device` (never a query string) and the session cookie → `{canMark: boolean}`, plus `marked: boolean` only when `canMark`. A non-director learns nothing about the list.
- `POST /api/air/house {action: 'mark' | 'unmark', device}` → `readPost` first, director only (403). `mark`: one batch, `INSERT OR IGNORE INTO air_house (kind, value, note, added_by, added_at) VALUES ('pid', ?, ?, ?, ?)` with `pidHash(device)` and the same for `('user', userId)`; `note` is `'marked from /r/me'`. `unmark`: `DELETE FROM air_house WHERE kind = 'pid' AND value = ?` (the pid only; the account stays house by role). → `{ok, marked}`.
- The route never returns a hash.

### 5.3 The kill test: `functions/api/air/killtest.ts`

- `GET` only. One batch:
  ```sql
  SELECT r.spot, r.kind, r.day, r.slot, r.user_id, r.pid_hash, r.onsite, r.code_via, r.source, r.status,
    (SELECT json_extract(u.payload, '$.roles') FROM users u WHERE u.id = r.user_id) AS roles
  FROM air_reports r
  WHERE r.day BETWEEN ? AND ? AND r.source = 'page' AND r.status = 'ok' AND r.onsite = 1
  LIMIT 5000
  ```
  and `SELECT kind, value FROM air_house`. Then `killTestCount(AIR_CONFIG, rows, houseSets(houseRows), now)`.
- Response: exactly the `KillTestPayload` (§4.8). `Cache-Control: public, max-age=60`. 503 `store-unavailable` on any failure (including a DB without 0028).

### 5.4 Pages

- `src/pages/r/how.astro` (new, indexable). Title `How we count · Field Reports`. Sections: "The count" (the live strict line and the loose line, filled by `src/scripts/air-how.ts` from `/api/air/killtest`; before it loads, `—`, never made-up zeros), "The rules" (`KILL_TEST_RULES` rendered at build as an ordered list), "Codes" (typed session codes, how long they last, that a shared link is fine to use but counts loose), "What we never count" (house, agents, remote reports), and a link to `/r`. Live line format: `Strict: 1 report from 1 person. Needs 10 from 3 by Fri Oct 23.` and `Loose: 1 report from 1 person.` When `final`, `Final:` replaces `Strict:`. No per-day numbers.
- `src/pages/r/call.astro` (new, `noindex`). Director-only tool. Signed out or not a director: one line, `House only. Sign in with a broadcaster account.` Director: a form (spot select of every non-reserved spot, date, time, optional label), the list of sessions from `GET /api/air/session` with the code in large mono, state, opens/closes clock, and a void button per open or upcoming session. Script `src/scripts/air-call.ts`.
- `src/pages/r/me.astro` (changed): add a section `data-air-house` after the claim button, hidden by default. `src/scripts/air-house.ts` calls `GET /api/air/house` with the phone's `deviceId()` (import from `air-client`). When `canMark`: show `This is a house phone` (button) or, when marked, `House phone. Its reports never count.` plus an `Undo` link. Copy under the button: `House phones are left out of the kill test and the edition's busiest-court pick. Marking also removes this phone's earlier reports from the count.`
- `src/components/air/CodeField.astro` (stub from the foundation, now yours): a one-line field under the answer buttons. Label `Have a code?`, input `inputmode="text" autocapitalize="characters" autocomplete="off" maxlength="16"`, button `Set`. On submit: `setTypedCode(spot, value)`; dispatch `AIR_CODE_EVENT` on the closest `[data-air-spot]` root with `{code, via: 'typed'}`; show `Code set for this visit.` A bad shape shows `Codes are letters and numbers.` Script `src/scripts/air-code-field.ts`. The field is visible on page load (remove `hidden`) on every spot page and `/court`.
- `src/pages/r/index.astro` (changed): one footer link, `How we count` → `/r/how`.

### 5.5 `scripts/air-codes.mjs` (changed)

Add `--session <spot>@<YYYY-MM-DD>T<HH:MM>[=<label>]` (repeatable). For each: `sessionRowOf` with `createdBy: 'script'`; print the INSERT to stdout (same file as day codes) and `courts 2026-10-02 07:30 → K7MX (opens 7:15, closes 9:30)` to stderr. Day-code behavior is unchanged. Exit 3 on a bad spec.

### 5.6 L1 tests

- `tests/air-count-api.test.mjs` (node:sqlite, migrations 0001/0023/0024/0025/0028): session create/list/void, 403 for a non-director, 409 both kinds, 429 at 11; house mark/unmark, `GET` hides `marked` from a non-director; killtest numbers on a fixture (1 guest typed on a Saturday → strict 1/1; the same phone marked house → 0/0; a Friday row → fridays 1); the JS house rule and the §3.1 SQL clause agree on the fixture; no response body contains any fixture pid_hash, ip_hash or user id; source asserts (literal SQL with `.bind(`, `readPost` first in POSTs, `if (!env.AUTH_DB) return unavailable();`).
- `tests/air-count-pages.test.mjs`: `/r/how` prints every `KILL_TEST_RULES` line; `/r/call` is `noindex`; `me.astro` has the house section; `AirSpot.astro` still includes `<CodeField`; `scripts/air-codes.mjs --session` prints an INSERT with `'session'` (run it with a test pepper in a child process).

### 5.7 L1 verify

```
node --test tests/air-count-api.test.mjs tests/air-count-pages.test.mjs tests/air-session.test.mjs tests/air-killtest.test.mjs tests/air-code-via.test.mjs tests/air-api.test.mjs
node --check scripts/air-codes.mjs
```

---

## 6. Bets 2 and 3: the edition (L2)

### 6.1 Slot 2 picks yesterday's busiest court spot (`functions/_lib/morning.mjs`, `functions/_lib/morning-sources.ts`)

- Candidates: every spot in the config with `channel === 'CRT'`.
- `morning-sources.ts` runs, before the moments batch, one count statement for LA day `date − 1`:
  ```sql
  SELECT r.spot, COUNT(DISTINCT COALESCE(r.user_id, r.pid_hash)) AS people, COUNT(*) AS n FROM air_reports r
  WHERE r.day = ? AND r.onsite = 1 AND r.source = 'page' AND r.status = 'ok' AND r.kind = 'wait'
    AND NOT EXISTS (SELECT 1 FROM air_house h WHERE (h.kind = 'pid' AND h.value = r.pid_hash) OR (h.kind = 'user' AND h.value = r.user_id))
    AND NOT EXISTS (SELECT 1 FROM users u, json_each(COALESCE(json_extract(u.payload, '$.roles'), '[]')) j WHERE u.id = r.user_id AND j.value IN ('broadcaster', 'director'))
  GROUP BY r.spot
  ```
  in its own try/catch: any failure (a DB without 0028 included) means spot `courts`. It never makes the edition provisional.
- Pure `pickCourtsSpot(config, counts)` in `morning.mjs`: highest `people`; a tie that includes `courts` goes to `courts`; otherwise higher `n`, then config order. No rows → `courts`.
- `reportMoments` loads yesterday and the same weekday a week before for the chosen spot's `wait` kind, as it does for `courts` today, and returns `courts: { spot, yesterday, lastWeek, today }`.
- `courtsSlot` uses the chosen spot's config for labels. Label: `Courts · <chosen spot mhz>`. Line with a reading: `Yesterday 5:41 PM at El Segundo Recreation Park courts: 1–4 waiting, 1 reporter — Guest 3348.` (the `at <spot.name>` part only when the chosen spot is not `courts`), then the week-before sentence as today, then the Court Call line (always from spot `courts`). Bylines still print for house rows: the house rule decides only which spot is picked.

### 6.2 "Today's courts" when there is no reading

When the chosen spot has no yesterday moment, the line is `todaysCourtsLine(today, date)` + the week-before sentence (if any) + the Court Call line.

- `sources.courts.today = { sessions, nws, sunset }`, gathered in `morning-sources.ts`:
  - `sessions`: for each air court in `COURTS` (`src/lib/courts.ts`), `blocksOn(court, laTimeMs(date, 720))` from `court-board.mjs`, kind `dropin`, confidence not `unverified`; each as `{name, label, start, end, fee, srcLabel, checked, unconfirmed: confidence === 'partial'}`; sorted by start then court order; at most 3.
  - `nws`: fetch `NWS_GRIDPOINT_URL` through `edgeCached` and `defaultConditionsDeps()` from `court-conditions.ts` (600 s, 2.5 s timeout); `nwsAtHour(periods, laTimeMs(date, firstSessionStartMinute ?? 540))` → `{at: 'HH:MM', windMph, tempF}` or null. Failure is null, never provisional.
  - `sunset`: the date's El Segundo sunset from `sunTimes` (`src/lib/sky.ts`) and `EL_SEGUNDO` (`src/lib/burnoff.ts`), as `sunsetAt` does for today.
- Pure in `morning.mjs`:
  - `nwsAtHour(periods, atMs)`: the period with `startTime ≤ at < endTime`; `windMph` = the largest number in `windSpeed`; `tempF` = `temperature` when `temperatureUnit === 'F'`.
  - `todaysCourtsLine(today, date)`: `Today's courts: 3.0 drop-in at El Segundo Recreation Park courts, 9 AM–12 PM, $7; 3.5 drop-in at El Segundo Recreation Park courts, 3–5 PM, $5 (rec.us, checked Sep 28). NWS for 9 AM: wind 7 mph, 66°F. Sunset 6:31 PM.` A partial block adds ` (unconfirmed)`. No sessions: `Today's courts: no listed drop-in sessions.` Missing NWS or sunset drops that sentence only. The source tag is `schedule`, `schedule+nws` or `template`; `fallback: true`.
- The courts slot still records `reports` in `missing` only when the moments batch fails, exactly as today.

### 6.3 The town slot skips house items

`pickTown` skips any news item with `edition === false`. (L5's v2 front-door-news item carries it, so the paper never prints the launch as town news.)

### 6.4 `/morning.xml` (`functions/morning.xml.ts`, new)

- RSS 2.0 of frozen editions only: `readFrozen(env.AUTH_DB, feedDates(now, 14))`, newest first. Never composes or freezes.
- Pure `toRss(editions, {site})` in `morning.mjs`: channel title `PointCast Morning Edition`, link `https://pointcast.xyz/morning`, description as the JSON Feed's, `language en-us`, `atom:link rel="self"`; one `<item>` per frozen edition: `title` = `editionTitle`, `link` = `…/morning?d=<date>`, `guid isPermaLink="false"` = `morning:<date>`, `pubDate` = RFC 822 of `cutoffMs(date)`, `description` = `editionText(e)` XML-escaped. No bylines outside the slot lines.
- `Content-Type: application/rss+xml; charset=utf-8`, `Cache-Control: public, max-age=300`, CORS `*`. No frozen editions yet: a valid empty channel.

### 6.5 Signup (`/morning` page and the receipt)

- `src/components/air/PaperSignup.astro` (stub from the foundation, now yours): for `source="receipt"`, a visible line `Get tomorrow's paper` linking to `/morning?src=receipt#paper`. Nothing else, no script.
- `src/pages/morning.astro`: add a section `id="paper"` under the edition: heading `Get the paper by email`, one email field, button `Send me the paper`, fine print `One email at 6:45 AM with the day's edition. Confirm by email first. Unsubscribe in one tap.`. Status line reads `?paper=confirmed` (`You're on the list. The next edition arrives at 6:45 AM.`), `expired` (`That link expired. Sign up again and use the newest email.`), `invalid` (`That link did not work.`). Add `alternates` entry `{type: 'application/rss+xml', href: '/morning.xml', title: 'PointCast Morning Edition'}` and a visible `RSS` link.
- Form wiring in `src/scripts/morning-client.ts` (or a new `src/scripts/morning-signup.ts` imported by the page): POST `/api/morning/subscribe` `{email, source}` where `source` is `receipt` or `card` when `?src=` says so, else `morning`. States: sending; success `Check your email to confirm.`; `invalid-email` → `That address doesn't look right.`; `email-rate-limited`/`ip-rate-limited` → `Too many tries. Wait 15 minutes.`; `morning-email-not-configured` → `Email delivery isn't set up yet. The paper is here every morning at 6:45, and at /morning.xml.`; anything else → `That didn't go through. Try again.`.

### 6.6 Pages endpoints (`functions/api/morning/*`, `functions/_lib/morning-mail-store.ts`)

Env: `AUTH_DB`, `PC_RATES_KV`/`USERS` (rate limit), `MORNING_DAILY?: Fetcher` (service binding), `MORNING_INTERNAL_KEY?: string`.

**`POST /api/morning/subscribe`**
1. `Origin` must equal the request origin (403 `bad-origin`); `Content-Type: application/json` (415); body ≤ 2,000 bytes (413); JSON (400 `bad-json`).
2. `normalizeEmail` (400 `invalid-email`); `parseSource`.
3. No `AUTH_DB` → 503 `store-unavailable`. No `MORNING_DAILY` or no `MORNING_INTERNAL_KEY` → 503 `morning-email-not-configured` (nothing written).
   foundation (lead update, overrides steps 3 and 6 where they differ): while the paper's mail is off (no binding, no key, or the Worker answers 503), signup still stores a pending row and answers 202 plainly, for example `You are on the list. We will email a confirmation link when the paper's mail is switched on.` It never deletes the new row for that reason. The Worker sends the confirm mail later to pending rows with `confirm_sent_at IS NULL`, on `/send-confirm` and on every cron tick once mail works, and sets `confirm_sent_at`. The daily edition never goes to an unconfirmed row.
4. `enforceEmailRateLimit(env, email, ip)` from `functions/api/auth/email/_shared.ts` → 429 with its reason (503 for `rate-limit-not-configured`).
5. `SELECT email, status, token FROM edition_subscribers WHERE email = ?`.
   - `confirmed`: write nothing, send nothing, go to 7.
   - `pending`: keep the row.
   - `unsubscribed`: `UPDATE edition_subscribers SET status = 'pending', token = ?, source = ?, unsubscribed_at = NULL, confirm_hash = NULL, confirm_expires_at = NULL WHERE email = ?` (new token).
   - none: `INSERT INTO edition_subscribers (email, status, token, source, user_id, created_at) VALUES (?, 'pending', ?, ?, ?, ?)` (user id from the session, or null). Remember `inserted = true`.
6. Unless confirmed: `env.MORNING_DAILY.fetch('https://morning-daily.internal/send-confirm', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Morning-Key': env.MORNING_INTERNAL_KEY}, body: JSON.stringify({email})})`. A 2xx is success. On a throw, 403 or 503: if `inserted`, `DELETE FROM edition_subscribers WHERE email = ? AND status = 'pending'`; answer 503 `morning-email-not-configured`. On 502: same delete; answer 502 `confirmation-send-failed`.
7. 202 `{ok: true, status: 'check-email'}`. The same body for every accepted address, so the endpoint never reveals who is subscribed.

**`GET /api/morning/confirm?t=<raw>`**: raw fails `TOKEN_RE` → 302 `/morning?paper=invalid#paper`. Else `UPDATE edition_subscribers SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, ?), confirm_hash = NULL, confirm_expires_at = NULL WHERE confirm_hash = ? AND status = 'pending' AND confirm_expires_at > ? RETURNING email` with `sha256Hex(raw)` → 302 `?paper=confirmed#paper`, or `?paper=expired#paper` when nothing matched. `Cache-Control: no-store`. No account is created.

**`/api/morning/unsubscribe?t=<token>`**
- `GET`: token fails `TOKEN_RE` or no row → an HTML page `That link is not valid.` (400/404). Else an HTML page with a `method="post"` form to the same URL and one button `Unsubscribe from the Morning Edition`. Scanners that follow links never unsubscribe anyone.
- `POST` (the form, or a mail client's one-click `List-Unsubscribe=One-Click`; no Origin check): `UPDATE edition_subscribers SET status = 'unsubscribed', unsubscribed_at = ?, confirm_hash = NULL, confirm_expires_at = NULL WHERE token = ?` → 200 HTML `You're unsubscribed from the Morning Edition.` (also when already unsubscribed).
- Page chrome: the plain inline style `functions/api/collect/unsubscribe.ts` uses, PointCast wording, a link back to `/morning`.

**`wrangler.toml`**: add, next to `KENNEL_DAILY`:
```toml
# Morning Edition email (docs/plans/2026-09-29-field-reports-v2-build-spec.md §6-7).
# Pages has no email binding; the morning-daily Worker sends every mail, and
# /api/morning/subscribe asks it for the confirm mail over this binding with
# the MORNING_INTERNAL_KEY secret (set on both, never committed). Deploy the
# Worker before Pages: Pages needs the service to exist.
[[services]]
binding = "MORNING_DAILY"
service = "pointcast-morning-daily"
```

**`src/pages/sitemap-discovery.xml.ts`**: add `['https://pointcast.xyz/morning.xml', 'daily', '0.90']` after the morning.json line and `['https://pointcast.xyz/r/how', 'weekly', '0.80']` in the Field Reports group.

### 6.7 L2 tests

- `tests/morning-edition.test.mjs` (update): `pickCourtsSpot` (ties to courts, higher people wins, n breaks other ties, empty → courts); the slot-2 line for a non-courts spot; `todaysCourtsLine` for a Saturday (two El Segundo drop-ins), a Tuesday (no sessions), NWS missing, a partial block; `nwsAtHour`; zero reports still fill seven slots and freeze; `pickTown` skips `edition: false`; `toRss` escapes `&` and `<` and lists only frozen editions.
- `tests/morning-subscribe-api.test.mjs` (new; node:sqlite with 0001/0023/0024/0025/0028; a fake `MORNING_DAILY` that records calls; a fake `PC_RATES_KV`): the numbered subscribe flow (new, pending, confirmed-silent, unsubscribed-resubscribe, binding missing, worker 503 deletes the new row, worker 502, rate-limited); confirm valid/expired/invalid; unsubscribe GET never changes a row, POST does; no response body contains an email other than none; source asserts (literal SQL, Origin check first in subscribe).
- `tests/morning-api.test.mjs`: update only if the slot-2 changes break it (keep its 0023-only migration list: it proves the busiest-spot query fails soft to `courts`).

### 6.8 L2 verify

```
node --test tests/morning-edition.test.mjs tests/morning-api.test.mjs tests/morning-mcp.test.mjs tests/morning-page.test.mjs tests/morning-subscribe-api.test.mjs tests/edition-mail.test.mjs
```

---

## 7. Bet 3: the paper arrives (L3, `workers/morning-daily`)

Clone the shape of `workers/kennel-daily` (layout, `writeRun`, `/status`) and the cron gate of `workers/early-shift`.

### 7.1 Files

- `workers/morning-daily/wrangler.toml`
  ```toml
  name = "pointcast-morning-daily"
  main = "src/index.ts"
  compatibility_date = "2026-09-29"
  compatibility_flags = ["nodejs_compat"]

  [triggers]
  # 6:45 AM in El Segundo is 13:45 UTC under PDT and 14:45 UTC under PST.
  # Both fire every day; shouldSend() acts only in the 6 AM LA hour, so
  # exactly one of them sends, across the Nov 1 change too.
  crons = ["45 13 * * *", "45 14 * * *"]

  [vars]
  MORNING_DAILY_DRY_RUN = "false"
  EDITION_URL = "https://pointcast.xyz/morning.json"

  [[d1_databases]]
  binding = "AUTH_DB"
  database_name = "pointcast-auth"
  database_id = "15de417a-2167-45e6-a7aa-340a7a99331c"

  [[send_email]]
  name = "SEND_EMAIL"
  allowed_sender_addresses = ["morning@pointcast.xyz"]

  [observability]
  enabled = true
  head_sampling_rate = 1

  # Secrets (wrangler secret put <name>), never committed:
  #   MORNING_INTERNAL_KEY — the same value as the Pages secret; unset, /send-confirm and /run answer 503.
  #   RESEND_API_KEY       — optional; sendMail() prefers it over SEND_EMAIL when set.
  ```
- `workers/morning-daily/package.json`: as kennel-daily's, name `pointcast-morning-daily`.
- `workers/morning-daily/src/run.ts`: `runMorningDaily(env, {now, dryRun?, fetch?, sleep?})`, `sendConfirm(env, email, {now})`, `status(env)`.
- `workers/morning-daily/src/index.ts`: `fetch` (routes below) and `scheduled` (`runMorningDaily(env, {now: controller.scheduledTime})`).

Imports: `../../../functions/_lib/edition-mail.mjs` and `sendMail` from `../../../src/lib/mail.ts`. Nothing from Pages functions that pulls in D1 views or Astro.

### 7.2 `runMorningDaily`

1. `const g = shouldSend(now)`. `g.send` false → log `{message: 'morning daily skipped', reason: g.reason}` and return. No D1 write.
2. foundation (lead update): `configured = Boolean(env.AUTH_DB) && mailReadiness(env).configured` (a Resend key; a bare `SEND_EMAIL` binding is not configured), and `/status` reports `mailReadiness(env).reason`. Was: `configured = Boolean(env.AUTH_DB && (env.RESEND_API_KEY || env.SEND_EMAIL))`; `dryRun = options.dryRun ?? env.MORNING_DAILY_DRY_RUN === 'true'`.
3. Fetch `${EDITION_URL}?d=${day}` with `User-Agent: PointCast Morning Daily (+https://pointcast.xyz/morning)`, up to 5 attempts at 0, 45, 90, 180 and 300 s after the first (the injected `sleep`). Each attempt: a 200 whose `frozenItem(feed, day)` is non-null ends the loop. A 400 (the clock ahead of 6:45), a 5xx, a network error or a provisional edition means wait and try again. The first read after 6:45 is also what freezes the edition.
4. Still not frozen → `writeRun({frozen: 0, reason: 'not-frozen'})`, return. Nothing is sent.
5. Not configured and not dry run → `writeRun({frozen: 1, reason: 'email-not-configured'})`, return.
6. `DELETE FROM edition_subscribers WHERE status = 'pending' AND created_at < ?` (now − `PENDING_TTL_MS`).
7. `SELECT email, token, last_sent_day FROM edition_subscribers WHERE status = 'confirmed' AND (last_sent_day IS NULL OR last_sent_day <> ?) ORDER BY confirmed_at, email LIMIT 1000`. None → `reason: 'no-subscribers'`.
8. For each: `attempted++`. Dry run → next. Else claim: `UPDATE edition_subscribers SET last_sent_day = ? WHERE email = ? AND status = 'confirmed' AND (last_sent_day IS NULL OR last_sent_day <> ?)`; `changes !== 1` → next. `sendMail({from: EDITION_FROM, to: email, ...editionEmail(item, token)}, env)`. Success → `sent++`. Throw → `failed++` and put `last_sent_day` back (`UPDATE … SET last_sent_day = ? WHERE email = ? AND last_sent_day = ?` with the old value).
9. `writeRun` (`INSERT … ON CONFLICT(day) DO UPDATE`, every column) with `edition_number = item._pointcast.number`, `frozen = 1`. Log a JSON summary with counts only, never an address.

### 7.3 `sendConfirm` and the routes

- `POST /send-confirm` body `{email}`, header `X-Morning-Key`:
  - `MORNING_INTERNAL_KEY` unset → 503 `internal-key-unset`; `timingSafeEqual` fails → 403 `bad-key`; bad email → 400 `invalid-email`; no mail binding → 503 `email-not-configured`.
  - `raw = newToken()`; `UPDATE edition_subscribers SET confirm_hash = ?, confirm_expires_at = ? WHERE email = ? AND status = 'pending' AND (confirm_expires_at IS NULL OR confirm_expires_at <= ?) RETURNING email` bound `(sha256Hex(raw), now + CONFIRM_TTL_MS, email, now + CONFIRM_TTL_MS − CONFIRM_RESEND_MS)`. No row → 200 `{ok: true, sent: false}` (not pending, or asked within the last minute).
  - `sendMail({from: EDITION_FROM, to: email, ...confirmEmail(raw)})`. Throw → clear the hash (`UPDATE … SET confirm_hash = NULL, confirm_expires_at = NULL WHERE email = ? AND confirm_hash = ?`) and 502 `send-failed`. Success → 202 `{ok: true, sent: true}`.
  - `MORNING_DAILY_DRY_RUN` never blocks a confirm mail.
- `POST /run` body `{dryRun?: boolean}`, same key check: runs `runMorningDaily` for today's LA day, skipping only the 6 AM hour gate (it still refuses before `FIRST_EDITION` and still needs a frozen edition); `dryRun` defaults to true. Returns the run result.
- `GET /` and `GET /status`: `{ok, configured, dryRun, bindings: {authDb, email, resend}, crons: ['45 13 * * *', '45 14 * * *'], timeZone: 'America/Los_Angeles', firstEdition, lastRun, confirmedSubscribers}` (`SELECT COUNT(*) AS n FROM edition_subscribers WHERE status = 'confirmed'`), `Cache-Control: no-store`. Never a secret, never an address.
- Anything else → 404.

### 7.4 L3 tests: `tests/morning-daily-run.test.mjs` (new)

Load `workers/morning-daily/src/run.ts` and `index.ts` through vite `ssrLoadModule`, as `tests/early-shift-run.test.mjs` does, over the same `SqliteD1` fake with migrations 0001/0023/0024/0025/0028, a fake fetch serving a JSON Feed, a fake `SEND_EMAIL` that records messages, and an injected `sleep` that returns at once. Cases: 13:45Z on 2026-10-03 sends once to each confirmed subscriber and none to pending or unsubscribed; a second call the same day sends nothing (dedupe); 14:45Z that day skips (hour 7); 2026-11-01 14:45Z sends and 13:45Z skips; 2026-10-02 skips; a provisional edition for all attempts writes `not-frozen` and sends nothing; frozen on attempt 3 sends; dry run sends nothing and writes `dry_run = 1`; a send failure restores `last_sent_day`; `/send-confirm` wrong key 403, unset 503, pending row gets a hash and a mail whose link hashes to it, a second call inside a minute sends nothing, a confirmed address sends nothing; `/status` has no address or secret; every sent message has both List-Unsubscribe headers and `from` = `EDITION_FROM`.

### 7.5 L3 verify

```
node --test tests/morning-daily-run.test.mjs tests/edition-mail.test.mjs
```

---

## 8. Bets 4 and 5: the Conflict Desk and the data (L4)

### 8.1 Seeds

`docs/plans/2026-09-29-conflict-seeds.json` is being verified in parallel. Expected shape (either a top-level array or `{verified, seeds: [...]}`):

```json
{ "id": "es-rec-close", "spot": "el-segundo", "fact": "hours", "kind": "closes",
  "question": "What closing time is on the posted sign?",
  "answers": [{"v": "21:00", "label": "9 PM"}, {"v": "22:00", "label": "10 PM"}, {"v": "other", "label": "Another time"}],
  "sourceA": {"name": "rec.us", "url": "https://…", "says": "22:00", "checked": "2026-09-29"},
  "sourceB": {"name": "City of El Segundo", "url": "https://…", "says": "21:00", "checked": "2026-09-29"},
  "status": "verified", "note": "…" }
```

`says` may be a bucket value or a label; map a label to its value through the kind's options. A seed with `status` other than `verified` (or missing a source URL) is never used. If the file is missing when L4 runs, do everything below except the `disputes` data, and say so in the return.

Seeds are asked by agents through `desk_ask` after deploy, one open call per spot (so El Segundo's two seeds go one after the other). Never by migration, never by a script L4 runs.

### 8.2 `desk_ask` accepts only a real conflict (`functions/_lib/air-desk-store.ts`, `functions/api/mcp.ts`)

- `askCall`: `parseDeskPost(config, body, {schedule: COURTS_SCHEDULE, now})` (`COURTS_SCHEDULE` from `src/lib/courts.ts`). Resolve every URL the call names (`sourceUrl` and, for a conflict, both source URLs, de-duplicated, in parallel, with the existing `resolves()`); any false → `source-unresolved`. The `air_calls` insert gains `fact, basis_json` (`JSON.stringify(parsed.basis)`). The belief row's `source_url` is `parsed.sourceUrl`.
- `passCall`, `deskPayload`, `loadBeliefs` callers: every `air_calls` select adds `fact, basis_json` so `callView` shows the basis.
- Caps unchanged: 5 asks per agent per LA day, one open call per spot, 48-hour expiry, `too-soon`.
- `mcp.ts` `desk_ask` tool: add `sources` to `inputSchema.properties` (`{type: 'array', minItems: 2, maxItems: 2, items: {type: 'object', properties: {name: {type: 'string'}, url: {type: 'string'}, says: {type: 'string', description: 'A bucket value of the kind, e.g. "22:00"'}}, required: ['name', 'url', 'says'], additionalProperties: false}}`), make `sourceUrl` optional (drop it from `required`), and rewrite the description: a call goes out only when two named public sources disagree (give both, and your belief is one of their buckets) or when the fact's schedule entry was last checked 45+ days ago or its season ended; refusals `no-basis` and `bad-sources`. Update the `desk_ask` line in the discovery HTML (~line 3366) the same way. `desk_calls` description: calls now show which sources disagree.

### 8.3 Answered calls flip facts

- `functions/_lib/air-board-store.ts`: add to the board batch
  ```sql
  SELECT c.spot, c.kind, c.fact, r.value, r.observed_at FROM air_calls c JOIN air_reports r ON r.id = c.answered_report_id
  WHERE c.status = 'answered' AND c.fact IS NOT NULL AND r.status = 'ok' AND r.onsite = 1 AND r.source = 'page'
  ORDER BY c.answered_at DESC LIMIT 200
  ```
  in its own try/catch (a DB without 0028 → no checks). Pass the rows to `boardSummary` as `o.checkRows`.
- `functions/_lib/court-board.mjs`:
  - `boardSummary` adds `checks: factChecks(config, checkRows).filter((c) => c.spot === court.id)` to each court.
  - New `deskKindsOf(config, courtId)` (every desk kind). `courtCall` finds a live call on any of the court's desk kinds. `deskKindOf` keeps returning the first (a test pins it).
  - Do not change `showable`, `blocksOn`, `sessionsNow`, `nextSession`, `openState` or their signatures: `air-client.ts` and L2 import them.
- `src/lib/courts.ts`: `BoardCourt.checks: FactCheck[]`; `Court.disputes?: Dispute[]` with `type Dispute = { id: string; fact: string; kind: string; a: { src: string; says: string }; b: { src: string; says: string }; seeded: string }`.
- `src/components/courts/CourtCard.astro`: one `<DeskCall>` per `deskKindsOf` entry (was `[0]`); a `data-pb-check="<fact>"` element (hidden) after the hours line and after each block group and the access fact; for a court with `disputes`, a visible line under the fact at build time: `Sources disagree: rec.us says 10 PM. City of El Segundo says 9 PM.` (labels from the kind's options, source labels from `COURT_SOURCES`); for spot `courts`, a visible fact line `Court Call · Fridays 7:30 AM` from `air-spots.json` `courtCall` (the JSON-LD Event must match it).
- `src/scripts/pickleball-board.ts`: `paintCall` picks the shell for `call.kind`; paint each `court.checks[i].line` into its `data-pb-check` element and unhide it; when a check exists for a fact that has a build-time "checked Sep 28" provenance, add `data-checked-on-site` to that fact so CSS can dim the old date; report POSTs from the board add `via: storedVia(spotId)`.

### 8.4 `/courts.json` (`functions/courts.json.ts`)

Additive fields only; everything v1 returns stays.
- Top level: `spec_version: '0.1'`.
- Per court: `hours_source: hoursSource(court, COURT_SOURCES, checks)`, `closures: closuresOf(court, COURT_SOURCES)`, `checks: [{fact, on, value, label, evidence, agrees}]` (no `line`, no `kind`), `disputes` as in the schedule (source ids resolved to `{id, label, url}`).
- Checks come from the same statement as §8.3, read in `payload()` in its own try/catch. Dates only. No handle, no byline, no time of day.

### 8.5 `courts-schedule.json` from verified seeds

For each verified seed: add its sources to `sources` (new ids like `ES3`, label and url from the seed, `note: "Verified 2026-09-29."`), and add a `disputes` entry on the court. Where a seed shows that a fact marked `verified` has a second source that disagrees, set that fact's (or hours') `confidence` to `partial` and, for hours, add a `conflict` in the existing `{text, rules}` shape, exactly as `manhattan-heights` has today. Change no other fact. Update `tests/courts-schedule.test.mjs` for what you changed.

### 8.6 `/pickleball` JSON-LD (`src/pages/pickleball.astro`)

- Keep one `SportsActivityLocation` per court, `openingHoursSpecification` only for verified hours, and skip hours entirely for a court with a `disputes` entry on `hours`. Never `TennisComplex`.
- Drop-in Events: keep the `eventSchedule` form, add `eventStatus: 'https://schema.org/EventScheduled'`, and skip any block whose slug has a `disputes` entry. Add dated occurrences for the next 14 days from the build day (one `Event` per occurrence inside the block's season: `startDate`/`endDate` as ISO with the LA offset for that date, `eventStatus`, `eventAttendanceMode` offline, `location` the court's `@id` plus `name` and `address` when verified, `offers` when the fee is a single amount, `isAccessibleForFree: false` when there is a fee).
- Court Call: one `Event` named `Court Call · Manhattan Middle School courts` with `eventSchedule` (Friday, 07:30–08:30, America/Los_Angeles), `eventStatus` EventScheduled, `isAccessibleForFree: true`, `organizer` PointCast, `location` the courts `@id`, and the next two Friday occurrences as dated Events. Its visible twin is the CourtCard line from §8.3.
- Every fact in JSON-LD must appear as visible text on the page.

### 8.7 `public/llms.txt`

The file is already over the 150-line cap `tests/agent-surfaces.test.mjs` checks, so add no line. Extend the existing MCP / Field Reports line (the one naming `air_latest` and `morning_edition`) with: ` Sourced South Bay court hours, drop-ins and on-site checks: https://pointcast.xyz/courts.json (CC0, confidence per fact).` Keep every Markdown link absolute.

### 8.8 L4 tests

- `tests/air-desk-api.test.mjs` (update): an ask without `sources` on a fresh fact → 400 `no-basis`; with two disagreeing sources → 201 and `call.basis.type === 'conflict'`; with sources that agree → `bad-sources`; a stale fact → 201 stale; the stored row has `fact` and `basis_json`; `source-unresolved` when source B fails to resolve; MCP `desk_ask` with `sources`.
- `tests/air-desk-pages.test.mjs` (update): `deskKindsOf`, `courtCall` on a second desk kind, `boardSummary` checks.
- `tests/court-board.test.mjs`, `tests/air-board-api.test.mjs` (update): checks in the board payload.
- `tests/courts-json.test.mjs` (new): `hours_source` for verified, partial and checked courts; `closures` for kelly; no body contains a byline, handle, `pid_hash` or a time of day in `checks`.
- `tests/pickleball-jsonld.test.mjs` (new, reads `src/pages/pickleball.astro` source and, when present, `dist/pickleball/index.html`): `eventStatus` on every Event; no `TennisComplex`; the Court Call Event; a disputed fact has no JSON-LD twin; the `llms.txt` line count did not grow.

### 8.9 L4 verify

```
node --test tests/air-desk-api.test.mjs tests/air-desk-pages.test.mjs tests/air-desk.test.mjs tests/court-board.test.mjs tests/air-board-api.test.mjs tests/courts-json.test.mjs tests/pickleball-jsonld.test.mjs tests/courts-schedule.test.mjs tests/air-conflict.test.mjs
```

---

## 9. Publishing, the letter and docs (L5)

PointCast rule: a launch needs a front-door wire block, front-door news and a visible homepage link.

- **Block** `src/content/blocks/0648.json` (re-check the next free id across every `origin/*` branch with `git ls-tree` first). Channel `FD`, type `NOTE`, size `1x1`, author `cc`, mood `calm`, `timestamp` the LA time you write it. Title: `Field Reports v2 · the count, the paper, the desk`. Dek, one sentence. Body, plain text, three short paragraphs: how the count works now (typed session codes, house left out, the rules at /r/how, the Oct 23 test); the paper by email from Sat Oct 3 at 6:45 AM with double opt-in and one-tap unsubscribe, plus /morning.xml; the desk asks a neighbor only when two named sources disagree, and a confirmed answer shows on /pickleball and /courts.json with a date, never a name. Companions: `/r/how`, `/morning`, `/pickleball`, `/courts.json`, `/r/desk`. `meta`: `surface /r/how`, `state` (migration 0028, workers/morning-daily), `next: "Oct 23 kill test; the letter to El Segundo Recreation & Parks after two conflicts resolve"`. No media unless an existing asset fits (no people or places in art). Copy must not claim anything is live before it is: the email starts Oct 3.
- **Front-door news** `src/data/front-door-news.json`: append one item `{"label": "Field Reports", "line": "How we count is public at /r/how, the Morning Edition comes by email from Oct 3, and the desk only asks when two sources disagree.", "link": "/r/how", "date": "<LA day you write it>", "edition": false}`. `edition: false` keeps it out of the paper's town slot (§6.3). Update `tests/front-door-september.test.mjs` so its label list and date check accept this item and nothing else.
- **New today** `src/data/new-today.json`: prepend two entries dated the same LA day: `{"kicker": "Field Reports · the rules", "title": "How we count", "link": "/r/how", "block": "0648"}` and `{"kicker": "Morning Edition · 6:45 AM", "title": "The paper by email", "link": "/morning", "block": "0648"}`. Check `tests/home-new-today.test.mjs` still passes.
- **Letter draft** `docs/plans/2026-09-29-rec-parks-letter-draft.md`: a draft for Mike to send himself after two conflicts resolve, to El Segundo Recreation & Parks. Plain, short, in PointCast's voice (not Mike's first person), with bracketed placeholders for Mike's greeting, name and sign-off. The ask: the city's pages say 9 PM and 10 PM for Rec Park's courts; here is what the posted sign said on [date]; can staff confirm, and the advanced drop-in days. Include a one-line description of PointCast, the two source URLs as placeholders, the dates only (no handles, no names, nothing about minors), and a closing line saying corrections will be published at /pickleball and /courts.json. Top note: `Draft. Mike sends this himself after two conflicts resolve. No agent sends it.` Nothing to MBUSD.
- **Runbook** `docs/plans/2026-09-29-field-reports-v2-runbook.md`: the deploy order and checks from §11, the secrets Mike sets (`MORNING_INTERNAL_KEY` on Pages and the Worker; the Worker's mail binding or `RESEND_API_KEY`), how to schedule Court Call 1 at `/r/call` (courts, 2026-10-02, 07:30) and Crew B's first session (el-segundo, 2026-10-03, 09:00), how Mike marks each phone at `/r/me`, the order agents ask the seed calls in, the follow-up edit to `courts-schedule.json` after a check lands (a source like `ONSITE` with the check's date), and how to read `/api/air/killtest` on Oct 23.

L5 tests: `node --test tests/front-door-september.test.mjs tests/home-new-today.test.mjs`, and a JSON parse of the block (`node -e "JSON.parse(require('fs').readFileSync('src/content/blocks/0648.json','utf8'))"`).

---

## 10. Lanes and file ownership

Every file any agent changes appears once below. "After F" means the foundation creates or edits it first, then hands it to the lane.

| Owner | Files |
|---|---|
| **Foundation** | `migrations/auth/0028_field_reports_v2.sql` · `src/data/air-spots.json` (then L4, desk kinds only) · `src/lib/air.ts` · `functions/_lib/air-session.mjs` · `functions/_lib/air-killtest.mjs` · `functions/_lib/edition-mail.mjs` · `functions/_lib/air-conflict.mjs` · `functions/_lib/air-desk.mjs` · `functions/_lib/air-kinds.mjs` · `functions/_lib/air-store.ts` · `src/scripts/air-client.ts` · `src/components/air/AirSpot.astro` · `tests/air-session.test.mjs` · `tests/air-killtest.test.mjs` · `tests/edition-mail.test.mjs` · `tests/air-conflict.test.mjs` · `tests/air-code-via.test.mjs` · `tests/air-api.test.mjs` · `tests/air-kinds.test.mjs` · `tests/air-desk.test.mjs` · `tests/early-shift-run.test.mjs` · `tests/air-assign.test.mjs`, `tests/air-pages.test.mjs`, `tests/air-roles.test.mjs`, `tests/air-assign-pages.test.mjs` (only if broken) · `tests/air-desk-pages.test.mjs` (only if broken, then handed to L4) · migration-list lines in `tests/air-desk-api.test.mjs`, `tests/air-board-api.test.mjs`, `tests/courts-schedule.test.mjs` (only if broken), then handed to L4 |
| **L1 counting** | `functions/api/air/session.ts` · `functions/api/air/house.ts` · `functions/api/air/killtest.ts` · `functions/_lib/air-count-store.ts` · `src/pages/r/how.astro` · `src/pages/r/call.astro` · `src/pages/r/me.astro` · `src/pages/r/index.astro` · `src/scripts/air-how.ts` · `src/scripts/air-call.ts` · `src/scripts/air-house.ts` · `src/scripts/air-code-field.ts` · `src/components/air/CodeField.astro` (after F) · `scripts/air-codes.mjs` · `tests/air-count-api.test.mjs` · `tests/air-count-pages.test.mjs` |
| **L2 edition** | `functions/_lib/morning.mjs` · `functions/_lib/morning-sources.ts` · `functions/morning.xml.ts` · `functions/api/morning/subscribe.ts` · `functions/api/morning/confirm.ts` · `functions/api/morning/unsubscribe.ts` · `functions/_lib/morning-mail-store.ts` · `src/pages/morning.astro` · `src/scripts/morning-client.ts` · `src/scripts/morning-signup.ts` (if used) · `src/components/air/PaperSignup.astro` (after F) · `wrangler.toml` · `src/pages/sitemap-discovery.xml.ts` · `tests/morning-edition.test.mjs` · `tests/morning-api.test.mjs` · `tests/morning-page.test.mjs` · `tests/morning-subscribe-api.test.mjs` |
| **L3 worker** | `workers/morning-daily/wrangler.toml` · `workers/morning-daily/package.json` · `workers/morning-daily/src/index.ts` · `workers/morning-daily/src/run.ts` · `tests/morning-daily-run.test.mjs` |
| **L4 desk + data** | `functions/_lib/air-desk-store.ts` · `functions/api/air/desk.ts` · `functions/api/mcp.ts` · `functions/_lib/court-board.mjs` · `functions/_lib/air-board-store.ts` · `functions/api/air/board.ts` · `functions/courts.json.ts` · `src/lib/courts.ts` · `src/components/courts/CourtCard.astro` · `src/scripts/pickleball-board.ts` · `src/pages/pickleball.astro` · `src/data/courts-schedule.json` · `src/data/air-spots.json` (after F; desk kinds only) · `public/llms.txt` · `tests/air-desk-api.test.mjs` (after F) · `tests/air-desk-pages.test.mjs` (after F) · `tests/pickleball-board-pages.test.mjs` · `tests/court-board.test.mjs` · `tests/air-board-api.test.mjs` (after F) · `tests/courts-schedule.test.mjs` (after F) · `tests/courts-json.test.mjs` · `tests/pickleball-jsonld.test.mjs` |
| **L5 publish** | `src/content/blocks/0648.json` · `src/data/front-door-news.json` · `src/data/new-today.json` · `tests/front-door-september.test.mjs` · `tests/home-new-today.test.mjs` (only if broken) · `docs/plans/2026-09-29-rec-parks-letter-draft.md` · `docs/plans/2026-09-29-field-reports-v2-runbook.md` |

Imports lanes take from the foundation (exact names):

| Lane | Imports |
|---|---|
| L1 | `air-session.mjs`: `sessionCode, sessionRowOf, sessionView, parseSessionPost, normalizeTypedCode, SESSIONS_PER_DAY` · `air-killtest.mjs`: `killTestCount, houseSets, isHouse, KILL_TEST, KILL_TEST_RULES` · `air-client.ts`: `deviceId, setTypedCode, clearCode, AIR_CODE_EVENT` · `air-store.ts`: `readPost, json, fail, unavailable, whoIs` · `air-kinds.mjs`: `pidHash, spotOf` · `air-assign.mjs`: `laDayStart` · `src/lib/air.ts`: `AIR_CONFIG, KillTestPayload, CodeVia` |
| L2 | `edition-mail.mjs`: `normalizeEmail, parseSource, newToken, sha256Hex, TOKEN_RE, SUB_SOURCES` · `court-board.mjs`: `blocksOn` (read only) · `court-conditions.ts`: `NWS_GRIDPOINT_URL, edgeCached, defaultConditionsDeps` · `functions/api/auth/email/_shared.ts`: `enforceEmailRateLimit` |
| L3 | `edition-mail.mjs`: `EDITION_FROM, FIRST_EDITION, CONFIRM_TTL_MS, CONFIRM_RESEND_MS, PENDING_TTL_MS, shouldSend, frozenItem, editionEmail, confirmEmail, newToken, sha256Hex, normalizeEmail, timingSafeEqual` · `src/lib/mail.ts`: `sendMail` |
| L4 | `air-conflict.mjs`: `factChecks, hoursSource, closuresOf, parseSeeds, slugOf, resolvesOf, factOfKind, STALE_FACT_DAYS` · `air-desk.mjs`: `parseDeskPost` (with ctx), `callView`, `DESK_REFUSALS` · `air-client.ts`: `storedVia, paintCallLines` · `src/lib/air.ts`: `FactCheck, CallBasisView, CallView` |
| L5 | none |

---

## 11. Integration, deploy order, verification

**Integration (after all five lanes; the orchestrator or one integrator agent):**
1. `node --test tests/*.test.mjs` (list failures that also fail on 2221dd1a as pre-existing).
2. `rm -rf dist && npm run build:bare`, then `node --test tests/agent-surfaces.test.mjs tests/pickleball-jsonld.test.mjs` (dist-dependent parts).
3. `node --check` on every inline script extracted from built `/r/how`, `/r/call`, `/r/me`, `/r/courts`, `/court`, `/morning`, `/pickleball`.
4. Local D1 smoke: apply 0001, 0023, 0024, 0025, 0028 with `wrangler d1 execute pointcast-auth --local --persist-to <scratch>`; `wrangler pages dev dist` with `AIR_CODE_PEPPER=test`; create a session at `/r/call`, type its code on `/court`, file, read `/api/air/killtest`.

**Deploy order (cc deploys; never an agent in this build):**
1. Re-check the migration number and block id on fresh origin/main. Apply `0028` with `--remote`. Confirm with `SELECT name FROM pragma_table_info('air_reports') WHERE name = 'code_via'`.
2. Deploy `workers/morning-daily` (`MORNING_DAILY_DRY_RUN = "true"` for the first rehearsal morning, Oct 1 or 2), then set its secret `MORNING_INTERNAL_KEY`. Check `/status`.
3. Set the Pages secret `MORNING_INTERNAL_KEY` (same value). Deploy Pages (it needs the Worker to exist for the service binding).
4. Smoke: `/r/how`, `/api/air/killtest`, `/morning.xml`, `/courts.json` `hours_source`, a signup to a house address, the confirm link, `/r/call` as director.
5. Flip `MORNING_DAILY_DRY_RUN` to `"false"` before Sat Oct 3, 6:45 AM (redeploy the Worker). If the dry runs failed, first send moves to Sat Oct 10 (Calls made #4 / PRD decision 6).
6. After deploy: agents ask verified seed calls through `desk_ask` (MCP, with `X-Yard-Resident`), one per spot at a time.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| 0028 or 0648 taken by a parallel branch before merge | Re-check with `git ls-tree` on every `origin/*` branch right before merge; rename and update the tests that list the file. |
| Pages deploys before the migration | Every new-column read and write in `air-store.ts` falls back to its v1 statement on "no such column"; the edition's busiest-spot query falls back to `courts`; L1's endpoints answer 503. |
| `ALTER TABLE` re-run fails | Apply once; the runbook checks `pragma_table_info` first. |
| Service binding to a Worker that does not exist blocks the Pages deploy | Deploy `pointcast-morning-daily` first (§11). |
| Email is not deliverable from `morning@` (binding sender list, zone setup) | `sendMail` supports `RESEND_API_KEY` or `SEND_EMAIL`; without either, signup answers `morning-email-not-configured` with a clear page message and stores nothing, and the Worker records `email-not-configured`. The email-path scout's result decides which secret Mike sets. |
| KLAX down at 6:45: the edition stays provisional and never freezes | The Worker retries for about 10 minutes, then records `not-frozen` and sends nothing that day. A reader's later load still freezes the page. |
| A session code in the group chat as `?c=` gets POSTed with `via: 'typed'` | `via` is client-claimed. The 2-hour window limits the damage; the loose count prints beside the strict one; the runbook says to send the code privately and speak it. |
| A 4-character code is guessable (194,481 codes; the receipt says whether a code matched) | Codes live 2 h 15 min; the D1 IP cap is 40 writes per 10 minutes; nothing is paid. Revisit only if the loose/strict gap looks wrong on Oct 23. |
| El Segundo has no day code, so desk answers there count on site only during Crew B sessions | Expected: the two El Segundo seeds are answered at Crew B sessions. The runbook schedules them first. |
| One open call per spot means El Segundo's two seeds queue | Ask the closing-time seed first; the drop-in seed after it is answered or expires. |
| `/pickleball` JSON-LD is built at deploy time; on-site checks are live | Disputed facts are left out of JSON-LD until the schedule file is edited after a check (runbook); visible text shows the check live. |
| Busiest-spot pick leaves out house rows, so a day with only Mike's reports at El Segundo prints Today's courts | Intended: the pick follows the count rules. Mike's bylines still print when his spot is the pick. |
| `llms.txt` is already over the 150-line cap its test checks | Extend an existing line; add none. |
| `front-door-september.test.mjs` pins the exact news list | L5 updates it with the one new item. |
| Five lanes in one worktree | Disjoint files (§10); no lane runs the build; the integrator builds once. |
| Parallel work on main touches `mcp.ts`, `wrangler.toml`, `front-door-news.json` | Rebase onto fresh origin/main before merge; resolve by keeping both sides. |
| DST on Sun Nov 1 | Two crons plus the 6 AM LA gate; tests cover Oct 3, Nov 1 and Nov 2. |
