# Field Reports v2 — the paper, the honest count, sourced courts (build spec)

2026-10-18. Architect pass (Opus) on `cc/field-reports-v2`, worktree `/Users/michaelhoydich/pc-v2`, cut from origin/main `da63816f`.

Law for scope: the top section of `docs/plans/2026-09-29-field-reports-v2-prd.md`, "Re-scope 2026-10-18". This spec builds exactly its four items and nothing else. Where this spec and the PRD below the re-scope disagree, this spec wins. `docs/plans/2026-09-29-field-reports-v2-build-spec-superseded.md` is reference only (written against a main three weeks older); where it and this file disagree, this file wins.

Cut, do not build: session codes, `code_via`, typed codes, a code field, `/r/call`, `scripts/air-codes.mjs --session`, the Conflict Desk, `desk_ask` changes, `air_calls` columns, the Rec & Parks letter, Crew B tooling, Regulars, Night Editor, Web Push, SMS, sponsors, cash.

---

## 0. Ground rules (every agent)

- **Never deploy.** No `wrangler deploy`, no `wrangler pages deploy`, no `--remote`, no `wrangler d1 execute` without `--local`, no `wrangler secret put`.
- **Never read secrets.** Do not open `~/.config/pointcast`, any `.dev.vars` or any secrets file. Do not grep the filesystem for keys.
- **Never commit** unless your brief says you are the committer. Never use `git stash`.
- **Own your files.** Every file below has exactly one owner (§9). Touch nothing else. If you need a change in a file you do not own, stop and put it in your return under `needs`.
- `node_modules` is a real APFS copy. Do not run `npm install`. A missing dependency goes in your return.
- **Lanes do not run the site build.** Five lanes share one worktree, and parallel Astro builds clobber `dist/` and `.astro/`. The foundation runs one build before the lanes start; the integrator runs one after (§10). Lanes run their own `node --test` files and `node --check` on any `.mjs` they write.
- **Tests:** `node --test tests/<name>.test.mjs`. **Build (foundation and integrator only):** `rm -rf dist && npm run build:bare`, then `rm -rf dist`.
- **SQL:** every statement is `db.prepare(<one string literal>).bind(...)`: no `${}` inside SQL, no `.exec(`, no string concatenation. Statements start with `SELECT`, `INSERT`, `UPDATE` or `DELETE` (the node:sqlite fake in the tests decides read vs write from the first word or a `RETURNING`; no leading comments, no `WITH`).
- **Privacy law.** `pid_hash` and `ip_hash` never leave the server. Agent rows (`source LIKE 'agent:%'`) never count as reporters, bylines or crews. Public aggregates carry no per-person times and no new handles. Nothing about minors. Subscriber emails never appear in any response body, page or log line (log counts only). `users.payload` is read only inside the house check and never leaves the function that reads it.
- **Copy voice.** Plain, short, concrete. No hype, no exclamation marks, never Mike's first person ("I", "my"). PointCast speaks as "we" or not at all.
- **Pre-existing failures on `da63816f`** (not yours unless your change touches them): `tests/morning-api.test.mjs` "KLAX through the oracle: a first read at 2:10 PM freezes…" and "GET /morning.json: a JSON Feed that freezes No. 1…"; `tests/front-door-september.test.mjs` "earlier September notes remain a dated data contract" and "home unfurl v5 keeps a request-time today dog card"; `tests/home-new-today.test.mjs` "the strip list is data…" (the Baseball kicker is 22 chars); `tests/agent-surfaces.test.mjs` "agent surface inventory…" needs a built `dist/`.

### Numbers decided here

| Thing | Value | Why |
|---|---|---|
| Migration | `migrations/auth/0031_field_reports_paper.sql` | On 2026-10-18: 0026–0028 on main; `0029_the_desk.sql` on `origin/claude/desk-venues-2026-10-03`; `0029_me_keeps.sql` and `0030_me_collections.sql` on `origin/codex/me-collections-20260930`. Next free is 0031. Re-check every `origin/*` branch with `git ls-tree` before merge. |
| Block id | `0705` | Highest on main is 0703; 0704 is on `origin/codex/hoydich-collection-feature-20261018` and `origin/codex/hoydich-play-publish-20261018`. L5 re-checks at write time and takes the next free id. |
| Kill-test window | LA days `2026-09-28` through `2026-10-23` | PRD. |
| Kill-test read | from LA day `2026-10-24` (Sat) | Task. |
| Kill-test pass | 10+ reports from 3+ people | PRD. |
| Edition crons | `45 13 * * *`, `45 14 * * *`, act only in LA hour 6 | Survives Sun Nov 1 DST. |
| Confirm link life | 48 hours from when the mail is sent | |
| Confirm resend gap | 60 s | |
| Prune | pending rows whose confirm mail went out 30+ days ago | Rows that never got a mail stay until mail is switched on. |
| RSS cap | 30 frozen editions | Task. |
| Today's courts cap | 4 sessions printed, then `+N more` | Keeps slot 2 one paragraph. |

---

## 1. The migration (foundation writes it)

`migrations/auth/0031_field_reports_paper.sql`. New tables only: no `ALTER`, no `DROP`, no `INSERT`, every statement `CREATE … IF NOT EXISTS`, so applying it twice is harmless. Old code never reads these tables. Depends on 0001 (`users`) and 0023 (`air_reports`) only for the readers, not for the DDL.

```sql
-- Field Reports v2: the paper and the honest count
-- (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §1).
-- New tables only; every statement is CREATE ... IF NOT EXISTS, so a second
-- apply is a no-op. Apply to AUTH_DB before the morning-daily Worker deploy
-- and before the Pages deploy. Until it is applied: /api/air/killtest and
-- /api/air/house answer 503, the edition's busiest-court pick falls back to
-- the Manhattan Middle courts spot, and /api/morning/subscribe answers 503.

-- The house list. kind 'pid' holds a phone's pid_hash, kind 'user' an account
-- id. Accounts with the broadcaster or director role (or the linked director
-- wallet) are house without a row. Marking a phone also excludes its earlier
-- rows, because every count reads this table at count time.
CREATE TABLE IF NOT EXISTS air_house (
  kind TEXT NOT NULL CHECK (kind IN ('pid', 'user')),
  value TEXT NOT NULL,
  note TEXT,
  added_at INTEGER NOT NULL,
  PRIMARY KEY (kind, value)
);

-- Morning Edition email, double opt-in. A row is 'pending' until its confirm
-- link is opened. `token` is the stable unsubscribe token (43 chars,
-- base64url). confirm_hash is the sha256 hex of the one-time confirm token;
-- the raw token exists only inside the morning-daily Worker and the email.
-- confirm_sent_at NULL means no confirm mail has gone out yet (the signup came
-- in while the paper's mail was off); the Worker sends those on every tick.
CREATE TABLE IF NOT EXISTS edition_subscribers (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  token TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'morning' CHECK (source IN ('morning', 'receipt', 'card', 'rss', 'other')),
  user_id TEXT,
  created_at INTEGER NOT NULL,
  confirm_hash TEXT,
  confirm_expires_at INTEGER,
  confirm_sent_at INTEGER,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER,
  last_sent_day TEXT,
  CHECK ((confirm_hash IS NULL) = (confirm_expires_at IS NULL))
);
CREATE INDEX IF NOT EXISTS edition_subscribers_send ON edition_subscribers(status, last_sent_day);
CREATE INDEX IF NOT EXISTS edition_subscribers_unsent ON edition_subscribers(status, confirm_sent_at);
CREATE UNIQUE INDEX IF NOT EXISTS edition_subscribers_confirm ON edition_subscribers(confirm_hash) WHERE confirm_hash IS NOT NULL;

-- One row per LA day the morning-daily Worker reached the send step
-- (like kennel_daily_runs, plus the edition and a reason). Times are epoch ms.
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
```

Tests that apply migrations for the new tables use `0001_init.sql`, `0023_air.sql`, `0031_field_reports_paper.sql` (add 0024/0025 only when the test needs those tables). Existing tests keep their lists: `tests/morning-api.test.mjs` stays on 0001 + 0023, which proves the busiest-court query fails soft to `courts`.

---

## 2. Shared rules

### 2.1 Who is house

A report row is house when its phone or account is on `air_house`, or its account is a director account. "Director account" mirrors `hasDirectorDeskAccess` in `src/lib/director-access.ts` (the check `/r/assign` uses) plus the `director` role:
- `users.payload.roles` holds `broadcaster` or `director`, or
- `users.payload.identities` holds `{provider, id}` with `id === 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'` and provider in `kukai`, `temple`, `umami`, `metamask-tezos`, or provider `metamask` with an id starting `tz`.

Every reader that must leave house rows out selects these three columns, verbatim (whitespace may differ), and decides in JS with `isHouseRow()` (§3.1):

```sql
EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'pid' AND h.value = r.pid_hash) AS house_pid, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'user' AND h.value = r.user_id) AS house_user, (SELECT u.payload FROM users u WHERE u.id = r.user_id) AS user_payload
```

`HOUSE_SELECT` in `functions/_lib/air-house.mjs` holds this exact text so lane tests can assert their SQL contains it (compare with whitespace collapsed to single spaces). A statement that references `air_house` fails before 0031 is applied; every caller wraps it in try/catch and falls back as its section says.

### 2.2 Who is a person

A person is `COALESCE(r.user_id, r.pid_hash)`, selected as `who`. `who` is used only for distinct counting inside a function and never leaves it.

### 2.3 Time

LA calendar days everywhere: `laDate`, `laParts`, `isoSec` from `functions/_lib/air-reading.mjs`; `laTimeMs`, `addDays`, `cutoffMs`, `editionDate` from `functions/_lib/morning.mjs`. Epoch ms in D1 for times, `YYYY-MM-DD` for days. Public dates print as `Oct 24`.

### 2.4 Who may mark a phone

`readSessionFromRequest(request, env)` from `functions/api/auth/session.ts`, then `hasDirectorDeskAccess(session)` from `src/lib/director-access.ts`, exactly as `functions/api/air/assign.ts` does.

---

## 3. Foundation (Opus, sequential, before any lane)

The foundation writes the migration, the three shared pure modules with their tests, and two static hook points, so no two lanes edit the same file. After it finishes, the files it touched are frozen.

### 3.1 `functions/_lib/air-house.mjs` (new, pure, no imports)

```js
export const HOUSE_ROLES = Object.freeze(['broadcaster', 'director']);
/** Equals DIRECTOR_ADMIN_ADDRESS in src/lib/director-access.ts (a test reads that file and pins it). */
export const DIRECTOR_WALLET = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
export const DIRECTOR_WALLET_PROVIDERS = Object.freeze(['kukai', 'temple', 'umami', 'metamask-tezos']);
/** §2.1's three columns, one line, single spaces. */
export const HOUSE_SELECT = "EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'pid' AND h.value = r.pid_hash) AS house_pid, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'user' AND h.value = r.user_id) AS house_user, (SELECT u.payload FROM users u WHERE u.id = r.user_id) AS user_payload";
/** users.payload (a JSON string, an object, or null) → whether it is a director account (§2.1). Bad JSON, null, non-objects → false. */
export function houseUser(payload)
/** A row with house_pid, house_user (0/1, true/false, or null) and user_payload → house? */
export function isHouseRow(row)
/** Collapse runs of whitespace to one space and trim: for tests comparing SQL text with HOUSE_SELECT. */
export function squash(sql)
```

### 3.2 `functions/_lib/air-killtest.mjs` (new, pure)

Imports `kindOf`, `kindRole` from `./air-kinds.mjs`; `laDate`, `isoSec` from `./air-reading.mjs`; `isHouseRow` from `./air-house.mjs`.

```js
export const KILL_TEST = Object.freeze({ from: '2026-09-28', to: '2026-10-23', readOn: '2026-10-24', minReports: 10, minPeople: 3 });
export const FREEZE_LINE = 'The game layer freezes: no new mechanics; the edition, the courts board and the early shift keep running.';
/** The rules, one plain sentence each, printed on /r/how as an ordered list in this order. */
export const KILL_TEST_RULES = Object.freeze([
  'A report counts when a person answers a spot’s main question while at the spot: how many are waiting at a court, or the fog at the beach.',
  'At the spot means the phone opened the spot’s page with that day’s code. A report filed from away does not count.',
  'Side questions do not count: parking, the court vibe and desk questions.',
  'One report per person per spot per half hour. A person is a signed-in account, or a phone when signed out.',
  'Agents never count. The early shift files its rows as agents, and they print grey.',
  'House phones and house accounts never count. Any account with the broadcaster or director role is house, and so is every phone marked as a house phone.',
  'Marking a phone as house also takes its earlier reports out of the count.',
  'Reports removed as spam never count.',
  'The window is Mon Sep 28 to Fri Oct 23, 2026, by El Segundo dates.',
  'The test passes with 10 or more reports from 3 or more people.',
  'The result is read on Sat Oct 24. If the test does not pass, the game layer freezes: no new mechanics; the edition, the courts board and the early shift keep running.',
  'The count is numbers only: no names, no times, no phones.',
]);
/** Whether spot+kind is the spot's main (live) question: kindRole(kindOf(config, spot, kind)) === 'live'. Unknown spot or kind → false. */
export function countedKind(config, spot, kind)
/**
 * rows: {spot, kind, day, slot, who, onsite, source, status, house_pid, house_user, user_payload}.
 * Keep: source === 'page', status === 'ok', onsite is 1/true, KILL_TEST.from <= day <= KILL_TEST.to,
 * countedKind(config, spot, kind), !isHouseRow(row), who is a non-empty string.
 * One report per `${who}|${spot}|${kind}|${slot}`.
 * → { window: {from, to}, needs: {reports: 10, people: 3}, reports, people, pass, final, asOf }
 *   pass = reports >= 10 && people >= 3; final = laDate(now) >= KILL_TEST.readOn; asOf = isoSec(now).
 * Numbers, booleans and the two window dates only: never an id, a who, a day list or a byline.
 */
export function killTestCount(config, rows, now)
/** "1 report from 1 person so far. The test needs 10 reports from 3 people, Sep 28 to Oct 23." Plurals: report/reports, person/people. */
export function countLine(c)
/**
 * '' unless c.final. Pass: "The read, Sat Oct 24: passed, with 12 reports from 4 people."
 * Fail: "The read, Sat Oct 24: not passed. 1 report from 1 person, short of 10 from 3. " + FREEZE_LINE
 */
export function readLine(c)
```

### 3.3 `functions/_lib/edition-mail.mjs` (new, pure, no repo imports; the Worker bundles it)

WebCrypto and `Intl` globals only.

```js
export const EDITION_SENDER = 'morning@pointcast.xyz';
export const EDITION_FROM = 'PointCast Morning Edition <morning@pointcast.xyz>';
export const SITE = 'https://pointcast.xyz';
export const FIRST_EDITION = '2026-10-03';          // a test pins it equal to morning.mjs FIRST_EDITION
export const SEND_HOUR = 6;
export const EDITION_SLOTS = 7;
export const CONFIRM_TTL_MS = 48 * 3_600_000;
export const CONFIRM_RESEND_MS = 60_000;
export const PRUNE_SENT_PENDING_MS = 30 * 86_400_000;
export const SUB_SOURCES = Object.freeze(['morning', 'receipt', 'card', 'rss', 'other']);
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
export const MAIL_OFF_NOTE = 'No mail sender yet: RESEND_API_KEY is not set, and Cloudflare Email Sending is not onboarded for pointcast.xyz (its DNS is at Namecheap).';
/** Signup answers, shared by the endpoint and the page. */
export const SIGNUP_COPY = Object.freeze({
  'check-email': 'Check your email for a confirmation link.',
  'on-list': 'You are on the list. We will email a confirmation link when the paper’s mail is switched on. Until then the paper is at /morning every day at 6:45 AM, and at /morning.xml.',
});
export function normalizeEmail(v)        // byte-for-byte the rule in functions/api/auth/email/_shared.ts (trim, lower, 3..254, /^[^\s@]+@[^\s@]+\.[^\s@]+$/u)
export function parseSource(v)           // a SUB_SOURCES value, else 'morning'
export function newToken()               // 32 random bytes → 43-char base64url, no padding
export async function sha256Hex(s)
export function timingSafeEqual(a, b)    // false on non-strings or length mismatch; XOR accumulate
export function escapeHtml(s)            // & < > " '
export function confirmUrl(raw)          // `${SITE}/api/morning/confirm?t=${raw}`
export function unsubscribeUrl(token)    // `${SITE}/api/morning/unsubscribe?t=${token}`
export function editionLink(date)        // `${SITE}/morning?d=${date}&src=em`
export const reportLink = () => `${SITE}/r?src=em`;
/** LA day and hour of `ms` via Intl America/Los_Angeles. → {send, day, reason}: reason 'before-first-edition' (day < FIRST_EDITION) | 'not-6am' (hour !== 6) | null. */
export function shouldSend(ms)
/**
 * The JSON Feed item for `day` (feed = /morning.json?d=<day> body) when it is frozen and whole:
 * id === `morning:${day}`, _pointcast.frozen === true, _pointcast.provisional !== true,
 * _pointcast.slots is an array of EDITION_SLOTS slots each with a non-empty string `line` and `label`. Else null.
 */
export function frozenItem(feed, day)
/** {subject, text, html, headers} (layout below). headers: {'List-Unsubscribe': `<${unsubscribeUrl(token)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'}. */
export function editionEmail(item, token)
/** {subject, text, html} for the double opt-in mail. */
export function confirmEmail(raw)
/**
 * Whether this env can send mail.
 *   RESEND_API_KEY set                                   → {configured: true, via: 'resend', reason: null, note: null}
 *   SEND_EMAIL bound and MORNING_SEND_EMAIL_READY 'true' → {configured: true, via: 'send_email', reason: null, note: null}
 *   SEND_EMAIL bound, not marked ready                   → {configured: false, via: null, reason: 'send-email-not-onboarded', note: MAIL_OFF_NOTE}
 *   neither                                              → {configured: false, via: null, reason: 'no-mail-sender', note: MAIL_OFF_NOTE}
 * A bare SEND_EMAIL binding is never "configured": pointcast.xyz is not onboarded to Email Sending.
 */
export function mailReadiness(env)
```

`editionEmail` text (the HTML carries the same content: one column, system fonts, every value through `escapeHtml`, the three links as `<a href>`, no images, no pixel, no tracking parameters other than `src=em`):

```
MORNING EDITION · No. 16 · SUN 18 OCT 2026 · 6:45 AM     (item._pointcast.masthead)
On the air yesterday: Guest 3348                         (item._pointcast.reporterLine; the line is left out when empty)

Sky · 6.100
Under the marine layer at KLAX, 5:53 AM (900 ft).
                                                         (one label line, one text line and a blank line per slot, seven slots)
Reporters earn points, never cash, and never for what a report says.   (_pointcast.footer)
No link, no commission.                                                (_pointcast.disclosure)

Read it on the site: https://pointcast.xyz/morning?d=2026-10-18&src=em
Report from a court: https://pointcast.xyz/r?src=em
Unsubscribe: https://pointcast.xyz/api/morning/unsubscribe?t=<token>
```

`subject` is `item.title`. The date comes from `item.id` (`morning:<date>`).

`confirmEmail(raw)`: subject `Confirm the PointCast Morning Edition`. Text: `Open this link to get the Morning Edition by email at 6:45 AM each day:` / blank / the confirm URL / blank / `The link works for 48 hours. If you did not ask for this, ignore this email and nothing more will be sent.` / blank / `PointCast · El Segundo · https://pointcast.xyz/morning`.

### 3.4 Hook points in shared files

1. `src/data/air-spots.json`: `reserved` becomes `["confirm","me","claim","board","index","assign","agent","desk","how","house","killtest"]`. Nothing else in the file changes.
2. `src/components/air/AirSpot.astro` (used by `/r/[spot]` and `/court`):
   - Inside `.air__receipt`, right after the `.air__queued` paragraph and before the `DeskCall`: `<p class="air__paper air-mono"><a href="/morning?src=receipt#paper">Get tomorrow’s paper</a></p>`. The receipt is hidden until a report lands, so the link only shows with a receipt. No script change: `src/scripts/air-client.ts` is not touched.
   - In `.air__links` in the footer, after the `Your card` link: `<span aria-hidden="true">·</span> <a href="/r/how">How we count</a>`.
   - CSS: `.air__paper { margin: 10px 0 0; font-size: 12px; } .air__paper a { color: var(--pc-ink); text-decoration: underline; text-underline-offset: 3px; }`.

### 3.5 Tests the foundation writes or updates

| File | Covers |
|---|---|
| `tests/air-house.test.mjs` (new) | `houseUser`: roles `broadcaster`, `director`, none, roles not an array, bad JSON, null, the wallet on `kukai`, `metamask` with a `tz` id, the wallet on `github` (false), another tz address (false); `isHouseRow` for each flag as 1, true, 0, null; `DIRECTOR_WALLET` equals the `DIRECTOR_ADMIN_ADDRESS` literal read from `src/lib/director-access.ts`; `squash(HOUSE_SELECT) === HOUSE_SELECT`. |
| `tests/air-killtest.test.mjs` (new) | Every filter (agent source, remote, flagged, removed, before Sep 28, after Oct 23, parking/vibe/sign kinds, beach `fog` counts, beach `tide` never); dedupe per who/spot/kind/slot, and two slots count twice; house by `house_pid`, by `house_user`, by role JSON, by wallet JSON; pass at exactly 10 and 3, not at 9/3 or 10/2; `final` false at `2026-10-24T06:59:00Z` (Oct 23 23:59 PDT) and true at `2026-10-24T07:00:00Z`; `JSON.stringify(result)` contains no fixture who, no day except the two window dates; `countLine` plurals for 0, 1, 2; `readLine` empty before final, pass and fail text, fail text ends with `FREEZE_LINE`; `KILL_TEST_RULES` has no `!` and no first-person `I `/`my `. |
| `tests/edition-mail.test.mjs` (new) | `FIRST_EDITION` equals morning.mjs; `shouldSend` at 13:45Z and 14:45Z on 2026-10-18, 2026-11-01 and 2026-11-02 (exactly one of each pair sends), 2026-10-02 never (`before-first-edition`); `frozenItem` refuses provisional, unfrozen, 6-slot, empty-line and wrong-id items; `editionEmail` escapes `<script>` and `&` in a slot line in HTML, has both List-Unsubscribe headers, every `pointcast.xyz` link except unsubscribe carries `src=em`, no `<img`, reporter line left out when empty; `confirmEmail` holds `confirmUrl(raw)`; `normalizeEmail` agrees with `_shared.ts` on 10 samples (import that file: node strips TS types); `newToken` matches `TOKEN_RE` and two differ; `timingSafeEqual`; `mailReadiness` all four branches; `parseSource`. |
| `tests/field-reports-paper-migration.test.mjs` (new) | `migrations/auth/` has exactly one `0031_*` file; every statement (comments stripped, split on `;`) starts with `CREATE TABLE IF NOT EXISTS` or `CREATE (UNIQUE )?INDEX IF NOT EXISTS`; no `ALTER`, `DROP`, `INSERT`, `UPDATE`, `DELETE`; applies on node:sqlite after 0001 + 0023, twice; the three tables exist with the columns of §1; `email` is case-insensitive (`INSERT` 'A@x.co' then 'a@x.co' fails); bad `status`, bad `source`, a hash without an expiry all fail. |
| `tests/air-kinds.test.mjs` (update) | The reserved assertion (~line 105) lists the three new ids. |

Fix only what the hook points break in `tests/air-pages.test.mjs`, `tests/air-roles.test.mjs`, `tests/air-desk-pages.test.mjs` (they read `AirSpot.astro` by regex).

### 3.6 Foundation verify

```
node --check functions/_lib/air-house.mjs functions/_lib/air-killtest.mjs functions/_lib/edition-mail.mjs
node --test tests/air-house.test.mjs tests/air-killtest.test.mjs tests/edition-mail.test.mjs tests/field-reports-paper-migration.test.mjs
node --test tests/air-*.test.mjs tests/morning-*.test.mjs tests/court*.test.mjs tests/pickleball*.test.mjs tests/early-shift-*.test.mjs
rm -rf dist && npm run build:bare && rm -rf dist
```

Everything passes except the pre-existing failures in §0 (name each one in the return). Then stop.

---

## 4. L1 — the edition (slot 2, Today's courts, /morning.xml)

Owned: `functions/_lib/morning.mjs`, `functions/_lib/morning-sources.ts`, `functions/morning.xml.ts` (new), `src/scripts/morning-client.ts`, `tests/morning-edition.test.mjs`, `tests/morning-api.test.mjs`, `tests/morning-mcp.test.mjs` (only if broken), `tests/morning-courts.test.mjs` (new), `tests/morning-rss.test.mjs` (new).

Foundation imports: `isHouseRow`, `HOUSE_SELECT`, `squash` from `functions/_lib/air-house.mjs`.

**Frozen editions must not change.** `editionFor`, `readFrozen`, `saveFrozen` and `canFreeze` keep their behavior. No SQL in this lane writes `morning_editions` (the source-contract test in `tests/morning-api.test.mjs` forbids `UPDATE morning_editions`, `DELETE FROM`, `ON CONFLICT`, `REPLACE INTO`). A stored edition is served as stored, whatever this lane changes.

### 4.1 Slot 2 picks yesterday's busiest court spot

In `functions/_lib/morning-sources.ts`, a new section `/* ---------- slot 2: the busiest court ---------- */` placed **before** `reportMoments` (so the existing regex in `tests/morning-api.test.mjs` that scans the `reportMoments` section still sees only `momentOf` and `withCardBylines` calls on `rows(i)`):

```ts
export async function busiestCourtSpot(env: MorningEnv, config: AirConfig, date: string): Promise<string>
```

One statement for LA day `addDays(date, -1)`, in its own try/catch; any failure (no `air_house` before 0031, no D1) returns `'courts'` and never makes the edition provisional:

```sql
SELECT r.spot, r.kind, COALESCE(r.user_id, r.pid_hash) AS who, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'pid' AND h.value = r.pid_hash) AS house_pid, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'user' AND h.value = r.user_id) AS house_user, (SELECT u.payload FROM users u WHERE u.id = r.user_id) AS user_payload
FROM air_reports r
WHERE r.day = ? AND r.onsite = 1 AND r.source = 'page' AND r.status = 'ok'
LIMIT 2000
```

The rows go straight into the pure picker; nothing else reads them.

Pure, in `functions/_lib/morning.mjs`:

```js
/** Candidates: config spots with channel 'CRT'. A row counts when its kind is that spot's live kind (kindRole === 'live') and !isHouseRow(row).
 *  Per spot: people = distinct `who`, n = rows. Highest people wins; a tie that includes 'courts' goes to 'courts';
 *  else higher n; else config order. No counted rows → 'courts'. */
export function pickCourtsSpot(config, rows)
```

`reportMoments(env, config, date, courtsSpot = 'courts')` loads yesterday and the same weekday a week before for `courtsSpot`'s live kind (as it does for `courts` today) and returns `courts: { spot: courtsSpot, yesterday, lastWeek }`. `gatherSources` calls `busiestCourtSpot` first, then `reportMoments` with the result.

`composeEdition` reads `sources.courts.spot` (a CRT spot id in the config, else `'courts'`):
- Label: `Courts · <that spot's mhz>` (7.500 for courts, 7.600 for el-segundo).
- The slot object gains `spot: <id>`. `canFreeze` is unchanged (it checks `id` and `line`).
- Line with a reading: `Yesterday 5:41 PM at El Segundo Recreation Park courts: 1–4 waiting, 1 reporter — Guest 3348.` The ` at <spot.name>` part only when the spot is not `courts`; for `courts` the line is exactly v1's. Then the week-before sentence for the same spot, then the Court Call line (always from spot `courts`'s `courtCall`).
- Bylines still print for house rows: the house rule decides only which spot is picked.

### 4.2 "Today's courts" when there is no reading

`sources.courts.today` (gathered in `morning-sources.ts`, §4.3). When the chosen spot has no yesterday moment **and** `today` is an object, the line is `todaysCourtsLine(today, date)`, then the week-before sentence (if any), then the Court Call line. When `today` is absent the v1 line is unchanged (`No reports from the courts yesterday.` …), so `tests/morning-edition.test.mjs`'s v1 cases keep passing. Slot `source`: `'schedule'` plus `+air` when a week-before moment printed and `+nws` when the NWS sentence printed (`schedule`, `schedule+nws`, `schedule+air+nws`). `fallback: true` (no report reached the line). `missing` still records `reports` only when the moments batch fails.

Pure, in `morning.mjs` (import `blocksOn` from `./court-board.mjs`):

```js
export const COURT_ITEMS_MAX = 4;
/**
 * courts: COURTS from src/lib/courts.ts (passed in; morning.mjs never imports JSON). date: the edition date.
 * Skips status 'closed'. Items:
 *  - spot 'courts' only (Manhattan Middle's public window): the hours rule whose days include the date's weekday, when
 *    hours.confidence is 'verified' or 'partial' → {court, label: 'open play', start: rule.open, end: rule.close ('dusk' allowed),
 *    fee: the court's 'fee' fact text when verified (e.g. 'Free'), unconfirmed: hours.confidence === 'partial'}. No rule that day → no item.
 *  - every court: blocksOn(court, laTimeMs(date, 720)) with kind 'dropin' and confidence 'verified' or 'partial'
 *    → {court, label: block.label, start, end, fee: block.fee, unconfirmed: confidence === 'partial'}.
 *  court = court.name without a trailing ' courts' or ' court' ("El Segundo Recreation Park").
 *  Sort by start minute, then court order. Print the first COURT_ITEMS_MAX; `more` = the rest.
 *  unpublished: each open court that has dropin blocks, all with a non-null `until`, the latest `until` < date
 *    → {court, through: that until}. (El Segundo after Oct 31 in today's data.)
 *  checked: the oldest `checked` among printed items and unpublished courts' blocks, or null.
 * → {items, more, unpublished, checked}
 */
export function todaysSessions(courts, date)
/** NWS forecastHourly periods → the one with Date.parse(startTime) <= atMs < Date.parse(endTime):
 *  {windMph: the largest number in windSpeed, rounded, or null; tempF: temperature when temperatureUnit === 'F', rounded, or null}.
 *  null when no period covers atMs or both values are null. */
export function nwsAtTime(periods, atMs)
/** today: {sessions: todaysSessions() output, nws: {at: minuteOfDay, windMph, tempF} | null, sunset: '6:12 PM' | null}. */
export function todaysCourtsLine(today, date)
```

`todaysCourtsLine` builds, in order, each part only when it has content:
1. `Today's courts: ` + items joined with `; `, each `<court> <label> <time>[, <fee>][ (unconfirmed)]`, then `; +N more at pointcast.xyz/pickleball` when `more > 0`, then `.`. Label through the existing `lowerFirst` (`Advanced drop-in` → `advanced drop-in`, `3.0 drop-in` stays). Time: `9 AM–12 PM`; `3–5 PM` when both share AM/PM; `8 AM to dusk`. Fee through `lowerFirst` (`Free` → `free`, `$7` stays). No items: `Today's courts: no sourced sessions today.`
2. When items printed and `checked`: `From the posted schedules, checked Sep 28.`
3. Each unpublished court: `El Segundo Recreation Park has not published drop-ins past Oct 31 yet.`
4. When `nws`: `NWS for 9 AM: wind 7 mph, 66°F.` (only the values that exist: `NWS for 9 AM: wind 7 mph.`).
5. When `sunset`: `Sunset 6:12 PM.`

Never invent a session: every item comes from a block or hours rule in the schedule, and every time and fee is the schedule's.

Example, Sat Oct 24, 2026 with today's data: `Today's courts: Manhattan Middle School open play 8 AM to dusk, free; El Segundo Recreation Park 3.0 drop-in 9 AM–12 PM, $7; El Segundo Recreation Park 3.5 drop-in 3–5 PM, $5. From the posted schedules, checked Sep 28. NWS for 8 AM: wind 6 mph, 64°F. Sunset 6:05 PM.` (Numbers illustrative.)

### 4.3 Gathering `today` (`morning-sources.ts`)

```ts
export type Nws = (date: string, now: number, env: MorningEnv) => Promise<unknown[] | null>;
```

- `sessions = todaysSessions(COURTS, date)` (`COURTS` from `src/lib/courts.ts`).
- `nws`: only when `date === laDate(now)` (the forecast cannot cover a past morning; a first read on a later day prints no NWS sentence). `(o.nws ?? nwsPeriods)(date, now, env)`: the default fetches `NWS_GRIDPOINT_URL` through `edgeCached(url, 600, load)` with `defaultConditionsDeps().fetch`, headers `Accept: application/geo+json`, a 2,500 ms abort, and returns `JSON.parse(text).properties.periods` or null. Any failure is null. Then `nwsAtTime(periods, laTimeMs(date, firstItemStartMinute ?? 540))` with `at` set to that minute.
- `sunset`: `fmtTime(buildDay(ALMANAC_PLACES[0], new Date(Date.UTC(y, m - 1, d))).sun.sunset)` (both from `src/lib/almanac.ts`, as `almanacLine` uses them), null on any failure or `'—'`.
- `gatherSources` and `editionFor` take an optional `nws?: Nws` beside `klax?: Klax`. Every `editionFor` call in `tests/morning-api.test.mjs` that does not stub `globalThis.fetch` passes `nws: async () => null` so no test reaches the network.

### 4.4 The town slot skips house items

`pickTown` skips any news item with `edition === false`. L5's front-door-news item carries it, so the launch note never prints as town news in the paper.

### 4.5 `/morning.xml` (`functions/morning.xml.ts`, new)

- `morning-sources.ts` gains `readRecentFrozen(db, limit)`: `db.prepare('SELECT date, json FROM morning_editions ORDER BY date DESC LIMIT ?').bind(limit)`, parsed through the existing `asEdition`; a missing or failing store is `[]`. The route never composes or freezes and has no SQL of its own.
- Pure `toRss(editions, {site = SITE, limit = 30} = {})` in `morning.mjs`: keep only `e.frozen === true && e.provisional !== true`, one per date, newest first, at most `limit`. Output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>PointCast Morning Edition</title>
<link>https://pointcast.xyz/morning</link>
<description>One screen at 6:45 AM in El Segundo: seven fixed slots, with bylines from Field Reports.</description>
<language>en-us</language>
<atom:link href="https://pointcast.xyz/morning.xml" rel="self" type="application/rss+xml"/>
<lastBuildDate>…newest item's pubDate…</lastBuildDate>
<item>
<title>Morning Edition No. 16 · Sun 18 Oct 2026</title>
<link>https://pointcast.xyz/morning?d=2026-10-18&amp;src=rss</link>
<guid isPermaLink="false">morning:2026-10-18</guid>
<pubDate>Sun, 18 Oct 2026 13:45:00 GMT</pubDate>
<description>…editionText(e)…</description>
</item>
</channel>
</rss>
```

  `title` = `editionTitle(date)`; `pubDate` = `new Date(cutoffMs(date)).toUTCString()`; `lastBuildDate` left out with no items. Every text node through a local `xmlEscape` (`&` `<` `>` `"` `'`, and strip characters invalid in XML 1.0: `\x00-\x08\x0B\x0C\x0E-\x1F`). No frozen editions: a valid channel with no `<item>`.
- Route: `GET` and `OPTIONS`, CORS `*`, `Content-Type: application/rss+xml; charset=utf-8`, `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=<ttl>` where ttl = min(300, seconds until `cutoffMs(addDays(editionDate(now), 1))`), at least 1. Edge cache in `caches.default` under `${origin}/morning.xml` (query strings share it), exactly as `functions/morning.json.ts` does.

### 4.6 The page client (`src/scripts/morning-client.ts`)

- `SOURCE_NAMES` reads a `+`-joined source by parts: add `schedule: 'posted schedules'`, `nws: 'NWS'`; a combined source prints its known parts joined with ` + ` (`posted schedules + NWS`).
- `sourceHref`: the courts slot links to `spotUrl(slot.spot)` when `slot.spot` is set, `/pickleball` when the source starts with `schedule`, else as today.
- `renderSlots`: when `slot.spot` is set on the courts slot, set the row label text from `slot.label` (`courts · 7.600`, lower-case as the page prints it) and its link to `spotUrl(slot.spot)`.
- Do not break `tests/morning-page.test.mjs` (L2 owns it). Run it; if it breaks, report under `needs`.

### 4.7 L1 tests

- `tests/morning-edition.test.mjs` (update): `pickCourtsSpot` (empty → courts; el-segundo 2 people beats courts 1; a 1–1 tie with courts → courts; a tie without courts → higher n, then config order; house rows by each flag drop out; parking rows never count; non-CRT beach rows never count); the slot-2 line, label and `spot` for el-segundo; `pickTown` skips `edition: false`; v1 courts cases unchanged when `today` is absent.
- `tests/morning-courts.test.mjs` (new; build `courts` fixtures inline in the schedule's shape, plus one run over the real `src/data/courts-schedule.json` read with `JSON.parse`): `todaysSessions` on a Saturday in season (Manhattan Middle window + El Segundo 3.0 and 3.5), a Monday (advanced 5–7 PM plus other courts' drop-ins, capped at 4 with `more`), a Tuesday with no El Segundo session, Sun Nov 1 2026 past the last `until` (El Segundo in `unpublished`), a partial block (`(unconfirmed)`), a closed court skipped; `nwsAtTime` inside a period, at its exact start, outside all, `"5 to 10 mph"` → 10, Celsius unit → tempF null; `todaysCourtsLine` with and without NWS and sunset, no items, unpublished; `composeEdition` with `today` and no reading prints the line plus the Court Call line, source `schedule` or `schedule+nws`, still seven slots and freezable.
- `tests/morning-rss.test.mjs` (new): `toRss` escapes `&`, `<`, `"` and drops a `\x07`; skips provisional and unfrozen editions; one item per date (frozen wins); newest first; 31 frozen editions → 30 items; links carry `&amp;src=rss`; guid `morning:<date>` with `isPermaLink="false"`; empty input is a valid channel. Route source asserts: the content type, no `.prepare(` in the route, `readRecentFrozen` used, `caches?.default`.
- `tests/morning-api.test.mjs` (update): `nws: async () => null` where needed; the "no reading" end-to-end cases now expect the Today's courts line for their date (built from the real schedule); one case with a seeded `air_house` table is not possible on 0001 + 0023 — keep the migration list as is (it proves the fallback to `courts`). Source-contract tests: `busiestCourtSpot` uses `.prepare(<literal>).bind(`; `squash(sql)` contains `HOUSE_SELECT`; `readRecentFrozen` is a `SELECT` with `.bind(`.

### 4.8 L1 verify

```
node --check functions/_lib/morning.mjs
node --test tests/morning-edition.test.mjs tests/morning-courts.test.mjs tests/morning-rss.test.mjs tests/morning-api.test.mjs tests/morning-mcp.test.mjs tests/morning-page.test.mjs
```

Return: files changed, test results (name pre-existing failures), the exact Today's courts line `todaysCourtsLine` prints for 2026-10-24 and 2026-11-01 with the real schedule (no NWS, sunset as computed), `needs`.

---

## 5. L2 — signup (page, receipt link, Pages endpoints)

Owned: `src/pages/morning.astro`, `src/scripts/morning-signup.ts` (new), `functions/api/morning/subscribe.ts` (new), `functions/api/morning/confirm.ts` (new), `functions/api/morning/unsubscribe.ts` (new), `functions/_lib/morning-mail-store.ts` (new), `wrangler.toml`, `tests/morning-subscribe-api.test.mjs` (new), `tests/morning-page.test.mjs`.

Foundation imports: from `functions/_lib/edition-mail.mjs`: `normalizeEmail, parseSource, newToken, sha256Hex, TOKEN_RE, SIGNUP_COPY`. Existing: `readPost, json, fail` from `functions/_lib/air-store.ts`; `enforceEmailRateLimit` from `functions/api/auth/email/_shared.ts`; `readSessionFromRequest` from `functions/api/auth/session.ts`.

The receipt link (`Get tomorrow’s paper` → `/morning?src=receipt#paper`) is already in `AirSpot.astro` from the foundation. Do not touch `AirSpot.astro` or `air-client.ts`.

### 5.1 Env

```ts
type MorningMailEnv = AirEnv & EmailAuthEnv & { MORNING_DAILY?: Fetcher; MORNING_INTERNAL_KEY?: string };
```

### 5.2 `POST /api/morning/subscribe`

1. `readPost(request)` first (Origin equals the request origin → else 403 `bad-origin`; JSON → 415; ≤ 4,000 bytes → 413; parse → 400 `bad-json`).
2. `normalizeEmail(body.email)` → 400 `invalid-email`. `source = parseSource(body.source)`.
3. No `AUTH_DB` → 503 `store-unavailable`.
4. `enforceEmailRateLimit(env, email, ip)` (ip from `CF-Connecting-IP`, else `'unknown'`) → 429 with its `reason` and `Retry-After`, or 503 for `rate-limit-not-configured`.
5. `SELECT status, confirm_expires_at FROM edition_subscribers WHERE email = ?`:
   - `confirmed`: write nothing.
   - `pending`: when `confirm_expires_at` is set and `< now`, `UPDATE edition_subscribers SET confirm_hash = NULL, confirm_expires_at = NULL, confirm_sent_at = NULL WHERE email = ? AND status = 'pending'` (an expired link gets a fresh one). Otherwise write nothing.
   - `unsubscribed`: `UPDATE edition_subscribers SET status = 'pending', token = ?, source = ?, unsubscribed_at = NULL, confirm_hash = NULL, confirm_expires_at = NULL, confirm_sent_at = NULL, confirmed_at = NULL, last_sent_day = NULL WHERE email = ?` with a new `newToken()`.
   - none: `INSERT INTO edition_subscribers (email, status, token, source, user_id, created_at) VALUES (?, 'pending', ?, ?, ?, ?)` (user id from `readSessionFromRequest`, else null; a broken session is null).
   Any D1 error (including no table before 0031) → 503 `store-unavailable`.
6. Unless the row was already `confirmed`, and only when `env.MORNING_DAILY` and `env.MORNING_INTERNAL_KEY` both exist: `env.MORNING_DAILY.fetch('https://morning-daily.internal/send-confirm', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Morning-Key': env.MORNING_INTERNAL_KEY}, body: JSON.stringify({email})})`. Mail is "on" for this request when that answers 2xx with JSON `sent === true`, or 2xx with `sent === false` and `reason === 'recent'`. Anything else (no binding, throw, non-2xx) is "off". **Never delete the row** because mail is off: the Worker sends the confirm mail later (pending rows with `confirm_sent_at IS NULL`, every tick).
7. 202 `{ok: true, status, message: SIGNUP_COPY[status]}` with `status` `'check-email'` when mail was on, else `'on-list'`. A confirmed address answers the same as a new one on the same mail state, so the endpoint never says who is subscribed. The body never contains the email. `Cache-Control: no-store`.

No log line carries the email. A failed Worker call logs `{message: 'morning confirm handoff failed', status}` only.

### 5.3 `GET /api/morning/confirm?t=<raw>`

`raw` fails `TOKEN_RE` → 302 `/morning?paper=invalid#paper`. No D1 → 302 `?paper=unavailable#paper`. Else:

```sql
UPDATE edition_subscribers SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, ?), confirm_hash = NULL, confirm_expires_at = NULL WHERE confirm_hash = ? AND status = 'pending' AND confirm_expires_at > ? RETURNING status
```

bound `(now, sha256Hex(raw), now)` → a row: 302 `?paper=confirmed#paper`; none: 302 `?paper=expired#paper`. Headers `Cache-Control: no-store`, `Referrer-Policy: no-referrer`. No account is created; nothing about the email is returned.

### 5.4 `/api/morning/unsubscribe?t=<token>`

- `GET`: token fails `TOKEN_RE` → HTML 400 `That link is not valid.`; `SELECT status FROM edition_subscribers WHERE token = ?` finds nothing → HTML 404 same text. Else an HTML page with one `<form method="post" action="/api/morning/unsubscribe?t=<token>">` and one button `Unsubscribe from the Morning Edition`. A GET never changes a row, so link scanners never unsubscribe anyone.
- `POST` (the form, or a mail client's RFC 8058 one-click with body `List-Unsubscribe=One-Click`; no Origin check, no body required): bad token → HTML 400. Else `UPDATE edition_subscribers SET status = 'unsubscribed', unsubscribed_at = ?, confirm_hash = NULL, confirm_expires_at = NULL WHERE token = ?` → HTML 200 `You're unsubscribed from the Morning Edition.` (also when already unsubscribed or not found, so it never reveals anything).
- Page chrome: the plain inline-style page `functions/api/collect/unsubscribe.ts` uses, kicker `PointCast · Morning Edition`, a link back to `/morning`. `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`.

Put the SQL and the page helper in `functions/_lib/morning-mail-store.ts` (literal SQL, `.bind(`), and keep the three route files thin.

### 5.5 `/morning` page (`src/pages/morning.astro`, `src/scripts/morning-signup.ts`)

- After the footer's top rule, before `.me__foot`, a section `id="paper"` `data-me-paper`: heading `Get the paper by email`; a form with one `type="email"` input (`autocomplete="email"`, `required`, label `Email`), a button `Send me the paper`; fine print `One email at 6:45 AM with the day's edition, only after you confirm by email. Unsubscribe in one tap.`; a status line `data-me-paper-status role="status"`.
- `<noscript>` inside the section: `The signup needs JavaScript. The paper is also at /morning.xml.`
- Add `{ type: 'application/rss+xml', href: '/morning.xml', title: 'PointCast Morning Edition · RSS' }` to `alternates`, and a visible `/morning.xml` link in the footer's link row beside `/morning.json`. Add `{ '@type': 'MediaObject', encodingFormat: 'application/rss+xml', contentUrl: 'https://pointcast.xyz/morning.xml' }` to the JSON-LD `encoding`.
- `morning-signup.ts`: on submit, POST `/api/morning/subscribe` `{email, source}`; `source` is `receipt`, `card` or `rss` when `?src=` is that value, else `morning`. While sending, disable the button and print `Sending…`. Then print the response `message` for `check-email` / `on-list`; `invalid-email` → `That address doesn't look right.`; `email-rate-limited` / `ip-rate-limited` → `Too many tries. Wait 15 minutes.`; anything else → `That didn't go through. Try again.` On load, read `?paper=`: `confirmed` → `You're on the list. The next edition comes by email at 6:45 AM.`; `expired` → `That link expired. Sign up again for a new one.`; `invalid` → `That link did not work.`; `unavailable` → `That didn't go through. Try again later.`; and scroll `#paper` into view. Never store the email in `localStorage`.
- Import it from the page's existing `<script>` block (`import { mountMorningSignup } from '../scripts/morning-signup'; mountMorningSignup();`). Do not edit `morning-client.ts` (L1 owns it).

### 5.6 `wrangler.toml`

Do **not** add the `MORNING_DAILY` service binding. A Pages deploy carrying a service binding to a Worker that is not deployed yet is not proven safe here, and `scripts/deploy.sh` deploys `origin/main` after any merge by any agent. Add only this comment block right after the `KENNEL_DAILY` service stanza:

```toml
# MORNING_DAILY — the Morning Edition mail Worker (workers/morning-daily,
# docs/plans/2026-10-18-field-reports-v2-paper-spec.md §5-6). Left out on
# purpose until pointcast-morning-daily is deployed: then uncomment, set the
# Pages secret MORNING_INTERNAL_KEY to the Worker's value, and deploy Pages.
# Without it, /api/morning/subscribe stores pending signups and the Worker
# sends their confirm mail on its next cron tick.
# [[services]]
# binding = "MORNING_DAILY"
# service = "pointcast-morning-daily"
```

### 5.7 L2 tests

- `tests/morning-subscribe-api.test.mjs` (new; load the three routes through vite `ssrLoadModule` as `tests/morning-api.test.mjs` does; the same `SqliteD1` fake with migrations 0001 + 0023 + 0031; a fake `PC_RATES_KV` (`get`/`put`); a fake `MORNING_DAILY` recording calls): new address → row pending, 202 `on-list` with no binding; with binding answering `{ok:true, sent:true}` → `check-email` and the call carried `X-Morning-Key`; binding throws / 503 / 502 → `on-list` and the row is still there; a pending row with an expired link is reset; confirmed → no write, same body shape; unsubscribed → pending with a new token; bad origin 403 before anything else; invalid email 400; rate-limited 429; a DB without 0031 → 503; confirm valid → `confirmed`, expired → `expired`, bad shape → `invalid`, reusing a confirm link → `expired`; unsubscribe GET leaves the row, POST with `List-Unsubscribe=One-Click` and no Origin unsubscribes; no response body or header contains the email; no `console.*` call receives the email (spy on console). Source asserts: literal SQL with `.bind(`, `readPost(` before any `normalizeEmail(` in subscribe, no `DELETE` in subscribe.
- `tests/morning-page.test.mjs` (update): the `#paper` section, the form, the RSS alternate and link; keep every existing assertion passing (L1 changes `morning-client.ts`; if one of its assertions on that file breaks, tell L1 through your return).

### 5.8 L2 verify

```
node --test tests/morning-subscribe-api.test.mjs tests/morning-page.test.mjs tests/edition-mail.test.mjs
```

Return: files changed, test results, the exact copy shipped, `needs`.

---

## 6. L3 — the Worker (`workers/morning-daily`)

Owned: `workers/morning-daily/wrangler.toml`, `workers/morning-daily/package.json`, `workers/morning-daily/src/index.ts`, `workers/morning-daily/src/run.ts`, `tests/morning-daily-run.test.mjs` (new).

Foundation imports: from `../../../functions/_lib/edition-mail.mjs`: `EDITION_FROM, FIRST_EDITION, CONFIRM_TTL_MS, CONFIRM_RESEND_MS, PRUNE_SENT_PENDING_MS, shouldSend, frozenItem, editionEmail, confirmEmail, newToken, sha256Hex, normalizeEmail, timingSafeEqual, mailReadiness`. Existing: `sendMail` from `../../../src/lib/mail.ts` (Resend first, then `SEND_EMAIL`; it returns `{configured: false}` without throwing when neither exists, which this Worker treats as a failed send). Import nothing from Pages functions that pulls in D1 views, KV or Astro.

### 6.1 `workers/morning-daily/wrangler.toml`

```toml
name = "pointcast-morning-daily"
main = "src/index.ts"
compatibility_date = "2026-10-18"
compatibility_flags = ["nodejs_compat"]

[triggers]
# 6:45 AM in El Segundo is 13:45 UTC under PDT and 14:45 UTC under PST. Both
# fire every day; the edition step acts only in the 6 AM LA hour, so exactly
# one of them sends, across the Sun Nov 1 change too. The confirm sweep runs
# on both ticks.
crons = ["45 13 * * *", "45 14 * * *"]

[vars]
MORNING_DAILY_DRY_RUN = "false"
# "true" only once pointcast.xyz is onboarded to Cloudflare Email Sending
# (DNS moved to Cloudflare). Until then SEND_EMAIL is bound but never used.
MORNING_SEND_EMAIL_READY = "false"
MORNING_EDITION_URL = "https://pointcast.xyz/morning.json"

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
#   MORNING_INTERNAL_KEY — shared with the Pages secret of the same name; unset, /send-confirm and /run answer 503.
#   RESEND_API_KEY       — the mail sender while DNS stays at Namecheap; sendMail() prefers it.
```

`package.json`: as `workers/kennel-daily/package.json`, name `pointcast-morning-daily`.

### 6.2 `run.ts`

```ts
export interface Env extends MailEnv { AUTH_DB?: D1Database; MORNING_DAILY_DRY_RUN?: string; MORNING_SEND_EMAIL_READY?: string; MORNING_EDITION_URL?: string; MORNING_INTERNAL_KEY?: string }
export type Deps = { fetch?: typeof fetch; sleep?: (ms: number) => Promise<void> };
export async function sweepConfirms(env: Env, o: { now: number }): Promise<{ sent: number; failed: number; pruned: number }>
export async function sendConfirm(env: Env, email: string, o: { now: number }): Promise<{ sent: boolean; reason: null | 'email-not-configured' | 'recent' | 'not-pending' | 'send-failed' }>
export async function runMorningDaily(env: Env, o: { now: number; dryRun?: boolean; force?: boolean } & Deps): Promise<RunResult>
export async function status(env: Env): Promise<Response>
```

**`sendConfirm`**
1. `mailReadiness(env).configured` false or no `AUTH_DB` → `{sent: false, reason: 'email-not-configured'}`.
2. `raw = newToken()`, `hash = await sha256Hex(raw)`.
3. `UPDATE edition_subscribers SET confirm_hash = ?, confirm_expires_at = ?, confirm_sent_at = ? WHERE email = ? AND status = 'pending' AND (confirm_sent_at IS NULL OR confirm_sent_at <= ?) RETURNING status` bound `(hash, now + CONFIRM_TTL_MS, now, email, now - CONFIRM_RESEND_MS)`. No row: look up `SELECT status FROM edition_subscribers WHERE email = ?`; pending → `recent`, else `not-pending`.
4. `const r = await sendMail({from: EDITION_FROM, to: email, ...confirmEmail(raw)}, env)`; a throw or `r.configured === false` → `UPDATE edition_subscribers SET confirm_hash = NULL, confirm_expires_at = NULL, confirm_sent_at = NULL WHERE email = ? AND confirm_hash = ?` and `{sent: false, reason: 'send-failed'}`. Else `{sent: true, reason: null}`.
`MORNING_DAILY_DRY_RUN` never blocks a confirm mail (a person asked for it).

**`sweepConfirms`** (every tick, before the edition step, whatever the hour):
1. No `AUTH_DB` → zeros. `DELETE FROM edition_subscribers WHERE status = 'pending' AND confirm_sent_at IS NOT NULL AND confirm_sent_at < ?` bound `now - PRUNE_SENT_PENDING_MS` → `pruned`.
2. Mail not configured → stop (pending rows wait).
3. `SELECT email FROM edition_subscribers WHERE status = 'pending' AND confirm_sent_at IS NULL ORDER BY created_at LIMIT 50` → `sendConfirm` each, counting sent/failed.

**`runMorningDaily`**
1. `g = shouldSend(now)`. Unless `force`: `!g.send` → log `{message: 'morning daily skipped', reason: g.reason}`, return `{ok: true, day: g.day, skipped: g.reason}`. No run row. With `force` (POST /run), still refuse `before-first-edition`.
2. `dryRun = o.dryRun ?? env.MORNING_DAILY_DRY_RUN === 'true'`; `readiness = mailReadiness(env)`; `configured = Boolean(env.AUTH_DB) && readiness.configured`. No `AUTH_DB` → log and return (nothing to record into).
3. Fetch `${env.MORNING_EDITION_URL ?? 'https://pointcast.xyz/morning.json'}?d=${day}` with `User-Agent: PointCast Morning Daily (+https://pointcast.xyz/morning)` and `Accept: application/feed+json`. Up to 5 attempts, waiting 0, 65, 130, 260 and 400 s before each (the injected `sleep`; Pages edge-caches a provisional `?d=` answer for 60 s, so attempts are spaced past it). An attempt ends the loop when it answers 200 and `frozenItem(body, day)` is non-null. A 400 (the clock a hair before 6:45), a 5xx, a network error, bad JSON or a provisional edition means wait and try again. The read itself is what freezes the edition.
4. Still not frozen → `writeRun({frozen: 0, reason: 'not-frozen'})`, return. Nothing is sent.
5. Not configured and not dry run → `writeRun({frozen: 1, edition_number, reason: 'email-not-configured'})`, return.
6. `SELECT email, token, last_sent_day FROM edition_subscribers WHERE status = 'confirmed' AND (last_sent_day IS NULL OR last_sent_day <> ?) ORDER BY confirmed_at, email LIMIT 1000`. None → `reason: 'no-subscribers'`.
7. For each: `attempted++`. Dry run → next. Claim: `UPDATE edition_subscribers SET last_sent_day = ? WHERE email = ? AND status = 'confirmed' AND (last_sent_day IS NULL OR last_sent_day <> ?)`; `meta.changes !== 1` → next. `sendMail({from: EDITION_FROM, to: email, ...editionEmail(item, token)}, env)`; success with `configured: true` → `sent++`. A throw or `configured: false` → `failed++`, restore with `UPDATE edition_subscribers SET last_sent_day = ? WHERE email = ? AND last_sent_day = ?` bound `(old, email, day)`.
8. `writeRun` (`INSERT INTO morning_daily_runs (…every column…) VALUES (…) ON CONFLICT(day) DO UPDATE SET …every column = excluded.…`), `edition_number = item._pointcast.number`, `frozen = 1`, `dry_run`, `configured`, `started_at`, `finished_at`. Log a JSON summary with counts only, never an address.

Return type `RunResult = {ok: true, day, skipped?: string, frozen: boolean, editionNumber: number | null, reason: string | null, configured: boolean, dryRun: boolean, attempted: number, sent: number, failed: number}`.

### 6.3 `index.ts` routes

- `scheduled(controller, env, ctx)`: `now = controller.scheduledTime`; `await sweepConfirms(env, {now})`, then `await runMorningDaily(env, {now})`. Each in its own try/catch that logs `{message, error}` without addresses.
- `POST /send-confirm`, header `X-Morning-Key`, body `{email}` (≤ 2,000 bytes): `MORNING_INTERNAL_KEY` unset → 503 `internal-key-unset`; key fails `timingSafeEqual` → 403 `bad-key`; bad JSON → 400; `normalizeEmail` fails → 400 `invalid-email`; then `sendConfirm` → `email-not-configured` 503 `{ok: false, reason}`; `send-failed` 502; `recent` and `not-pending` 200 `{ok: true, sent: false, reason}`; sent 202 `{ok: true, sent: true}`. Never echo the email.
- `POST /run`, same key check, body `{dryRun?: boolean}` (default true): `runMorningDaily(env, {now: Date.now(), dryRun, force: true})` → its result as JSON.
- `GET /` and `GET /status`: `{ok: true, configured, reason: readiness.reason, note: readiness.note, dryRun, bindings: {authDb, sendEmail, sendEmailReady, resend, internalKey}, crons: ['45 13 * * *', '45 14 * * *'], timeZone: 'America/Los_Angeles', firstEdition: FIRST_EDITION, lastRun, subscribers: {confirmed, pending, waiting}}` where `waiting` is pending with `confirm_sent_at IS NULL` (`SELECT status, (confirm_sent_at IS NULL) AS waiting, COUNT(*) AS n FROM edition_subscribers GROUP BY status, waiting`), `lastRun` the newest `morning_daily_runs` row. Missing table → those fields null. `Cache-Control: no-store`. Booleans only for bindings: never a secret, never an address. `reason`/`note` read plainly, e.g. `no-mail-sender` with `MAIL_OFF_NOTE`.
- Anything else → 404.

### 6.4 L3 tests: `tests/morning-daily-run.test.mjs` (new)

Load `workers/morning-daily/src/run.ts` and `index.ts` through vite `ssrLoadModule` as `tests/early-shift-run.test.mjs` does, over its `SqliteD1` fake with migrations 0001 + 0023 + 0031, a fake fetch serving JSON Feed bodies, a fake `SEND_EMAIL` (`send()` records messages) plus `MORNING_SEND_EMAIL_READY: 'true'` to make mail "configured", and an injected `sleep` that resolves at once and records its waits. Cases: 13:45Z on 2026-10-18 sends once to each confirmed row and none to pending or unsubscribed; a second run that day sends nothing (dedupe); 14:45Z that day skips (`not-6am`, no run row); 2026-11-01 14:45Z sends and 13:45Z skips; 2026-10-02 skips (`before-first-edition`); provisional on every attempt → `not-frozen`, nothing sent, sleeps `[65000, 130000, 260000, 400000]`; frozen on attempt 3 sends; a 6-slot edition never sends; dry run sends nothing and writes `dry_run = 1`; no mail sender (no Resend, ready `false`) → `email-not-configured` and `/status` `configured: false`, `reason: 'send-email-not-onboarded'` with the binding and `no-mail-sender` without; a send that throws restores `last_sent_day`; `sendMail` answering `{configured: false}` counts as failed; `sweepConfirms` sends one confirm per waiting pending row, sets `confirm_sent_at`, and the link's token hashes to `confirm_hash`; a second sweep sends nothing; pruning deletes a pending row whose confirm went out 31 days ago and keeps one that never got a mail; `/send-confirm` wrong key 403, unset 503, recent 200 `sent:false`, confirmed address `not-pending`; `/run` needs the key; `/status` body contains no fixture email and no key; every sent edition has both List-Unsubscribe headers, `from` = `EDITION_FROM`, and links with `src=em`; no `console.log` argument contains a fixture email.

### 6.5 L3 verify

```
node --test tests/morning-daily-run.test.mjs tests/edition-mail.test.mjs
```

Do not run `wrangler`. Return: files changed, test results, `needs`.

---

## 7. L4 — the honest count and sourced court data

Owned: `functions/_lib/air-count-store.ts` (new), `functions/api/air/house.ts` (new), `functions/api/air/killtest.ts` (new), `src/pages/r/how.astro` (new), `src/scripts/air-how.ts` (new), `src/scripts/air-house.ts` (new), `src/pages/r/me.astro`, `src/pages/r/index.astro`, `functions/_lib/courts-feed.mjs` (new), `functions/courts.json.ts`, `src/lib/courts.ts` (types only), `src/data/courts-schedule.json`, `src/pages/pickleball.astro`, `src/components/courts/CourtCard.astro` (only if visible-text parity needs it), `public/llms.txt`, `tests/air-count-api.test.mjs` (new), `tests/air-count-pages.test.mjs` (new), `tests/courts-feed.test.mjs` (new), `tests/pickleball-jsonld.test.mjs` (new), `tests/courts-schedule.test.mjs`, `tests/pickleball-board-pages.test.mjs` (only if broken).

Foundation imports: `functions/_lib/air-killtest.mjs`: `killTestCount, countLine, readLine, KILL_TEST, KILL_TEST_RULES, FREEZE_LINE`; `functions/_lib/air-house.mjs`: `HOUSE_SELECT, squash`. Existing: `readPost, json, fail, unavailable` (`air-store.ts`), `pidHash, parseDevice` (`air-kinds.mjs`), `deviceId` (`src/scripts/air-client.ts`), `readSessionFromRequest`, `hasDirectorDeskAccess`, `AIR_CONFIG` (`src/lib/air.ts`), `COURTS, COURT_SOURCES` (`src/lib/courts.ts`).

Do not touch `AirSpot.astro` (the foundation already put `How we count` in the `/court` and `/r/<spot>` footer) or `air-client.ts`.

### 7.1 `functions/_lib/air-count-store.ts`

```ts
export async function killTestRows(db: D1Database): Promise<Row[]>
export async function houseState(db: D1Database, pid: string, userId: string | null): Promise<boolean>
export async function markHouse(db: D1Database, pid: string, userId: string, now: number): Promise<void>
export async function unmarkHouse(db: D1Database, pid: string): Promise<void>
```

Kill-test rows, one statement:

```sql
SELECT r.spot, r.kind, r.day, r.slot, r.onsite, r.source, r.status, COALESCE(r.user_id, r.pid_hash) AS who, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'pid' AND h.value = r.pid_hash) AS house_pid, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'user' AND h.value = r.user_id) AS house_user, (SELECT u.payload FROM users u WHERE u.id = r.user_id) AS user_payload
FROM air_reports r
WHERE r.day >= ? AND r.day <= ? AND r.source = 'page' AND r.status = 'ok' AND r.onsite = 1
ORDER BY r.observed_at LIMIT 5000
```

bound `(KILL_TEST.from, KILL_TEST.to)`. House: `SELECT 1 AS ok FROM air_house WHERE kind = 'pid' AND value = ?`; mark is one batch of `INSERT OR IGNORE INTO air_house (kind, value, note, added_at) VALUES ('pid', ?, 'marked from /r/me', ?)` and the same for `('user', ?)`; unmark is `DELETE FROM air_house WHERE kind = 'pid' AND value = ?` (the account stays house by role).

### 7.2 `GET /api/air/killtest`

`if (!env.AUTH_DB) return unavailable();` Then `killTestCount(AIR_CONFIG, await killTestRows(db), Date.now())` → 200 `{ok: true, ...count}` with `Cache-Control: public, max-age=60` and CORS `*`. Any failure (including a DB without 0031) → 503 `store-unavailable`. The body is the count only: no ids, no `who`, no bylines, no per-day numbers.

### 7.3 `/api/air/house`

- `GET` with header `X-PC-Device` (never a query string) and the session cookie. `parseDevice` fails → 400 `bad-device`. Not a director (§2.4) → 200 `{ok: true, canMark: false}`: a non-director learns nothing about the list. Director → `{ok: true, canMark: true, marked}`. `Cache-Control: no-store`.
- `POST {action: 'mark' | 'unmark', device}`: `readPost` first; then `parseDevice` → 400; no D1 → 503; not a director → 403 `forbidden`; bad action → 400 `bad-action`. `mark` records `pidHash(device)` and the session's user id; `unmark` removes the pid row. → `{ok: true, marked}`. A D1 error (no table) → 503.
- The route never returns a hash or a user id.

### 7.4 `/r/me` house button (`src/pages/r/me.astro`, `src/scripts/air-house.ts`)

A `<section class="rm__section" data-air-house hidden>` after the claim paragraph, before the footer: heading `House phone`; a button `This is a house phone` (`data-air-house-mark`); a marked line `House phone. Its reports never count.` with an `Undo` button (`data-air-house-undo`), both hidden until state is known; fine print `House phones are left out of the kill test and the paper's busiest-court pick. Marking also takes this phone's earlier reports out of the count.` and a link `How we count` → `/r/how`. `air-house.ts` calls `GET /api/air/house` with `deviceId()` from `air-client.ts`; shows the section only when `canMark`; POSTs `{action, device}` and repaints; on failure prints `That didn't go through. Try again.` Import it in the page's existing script block beside `mountAir()`.

### 7.5 `/r/how` (`src/pages/r/how.astro`, `src/scripts/air-how.ts`)

Indexable. `BlockLayout` + `AirInk`, title `How we count · Field Reports`, description `How Field Reports counts on-site reports, who is left out, and the live count for the Oct 23 kill test: 10 reports from 3 people.`, `hideAds`, `jsonLd` a plain `WebPage`.

Sections, in order:
1. Kicker `Field Reports · how we count`, h1 `How we count`.
2. **The count** (`data-air-how-count`, `aria-live="polite"`): `—` until the API answers, never made-up zeros. `air-how.ts` fetches `/api/air/killtest` and prints `countLine(c)`; when `c.final` it prints `readLine(c)` above it. Failure: `The count is not available right now.` `<noscript>`: `The live count is at /api/air/killtest.`
3. **The rules**: `KILL_TEST_RULES` rendered at build time as an `<ol>`.
4. **What happens Oct 24**: one paragraph built from `KILL_TEST`: `On Sat Oct 24 this page reads the result. Pass: the game layer stays open. Not passed: ` + `FREEZE_LINE`.
5. **What we never count or show**: agents, house phones and accounts, remote reports, side questions; and that the count is numbers only.
6. Links: `/r` (all spots), `/morning` (the paper), `/api/air/killtest` (the numbers).

### 7.6 `/r` footer (`src/pages/r/index.astro`)

Add `<a href="/r/how">How we count</a>` to the footer's link row, first.

### 7.7 Sourced court data (`src/data/courts-schedule.json`)

A scout writes `docs/plans/2026-10-18-courts-refresh.json` in parallel. Read it when it exists. Apply an entry only when it is explicitly verified (`verified: true` or `status: 'verified'`), names a source URL that is `https://`, and carries a `checked` date. Anything else goes in your return as `skipped`, with why. If the file is missing when you finish the rest, change no schedule data and say so.

For each applied entry:
- A new source gets a new id in `sources` (`ES3`, `MB2`, …) with `label`, `url`, and `note: "Checked <date>."`.
- A new or extended block keeps the existing `Block` shape exactly (`kind`, `label`, `days`, `start`, `end`, `from`, `until`, `fee`, `src`, `checked`, `confidence: 'verified'`). Never extend an old block's `until` without a source that says so; add a new block for a new season.
- Manhattan Middle's window: change `hours` only if a source states the hours; set `checked` to the scout's date.
- A fact the scout found stale but could not re-verify: set its `confidence` to `partial` (it shows "unconfirmed"); never delete a fact silently.
- Update the El Segundo `confirm` note ("The drop-ins on rec.us end Oct 26–31…") to match.
- Update `tests/courts-schedule.test.mjs`: the `checked <= '2026-09-28'` lint becomes `<=` today's LA date; the El Segundo block list pins the new data.

### 7.8 `/courts.json` confidence (`functions/_lib/courts-feed.mjs`, `functions/courts.json.ts`, `src/lib/courts.ts`)

`src/lib/courts.ts`: `Hours` gains optional `evidence?: 'posted-sign' | 'reported'` (set in the schedule only when a source is a posted sign or a report). Types only.

Pure `functions/_lib/courts-feed.mjs`:

```js
export const HOURS_CONFIDENCE = Object.freeze(['verified', 'posted-sign', 'reported', 'unknown']);
/** court.hours, sources → {url, checked, confidence}:
 *  no hours → {url: null, checked: null, confidence: 'unknown'};
 *  confidence 'unverified' → url/checked as sourced, 'unknown';
 *  hours.evidence set → that value; 'verified' → 'verified'; 'partial' → 'reported'. url = sources[hours.src]?.url ?? null. */
export function hoursSourceOf(court, sources)
```

`/courts.json` adds `hours_source: hoursSourceOf(c, COURT_SOURCES)` to each `courts[]` entry and each `private[]` entry. Everything v1 returns stays.

### 7.9 `/pickleball` JSON-LD (`src/pages/pickleball.astro`)

- Keep one `SportsActivityLocation` per court; `openingHoursSpecification` only for `verified` hours (as today); never `TennisComplex`.
- Each existing drop-in `Event` (eventSchedule form) gains `eventStatus: 'https://schema.org/EventScheduled'`.
- Add dated occurrences for the next 14 LA days from the build day: for each verified drop-in block and each date in its season whose weekday matches, one `Event` in the court's `event` array with `name` (`<label> · <court.name>`), `startDate`/`endDate` as ISO local time with that date's LA offset (`2026-10-24T09:00:00-07:00`; Nov 1 on is `-08:00`), `eventStatus` EventScheduled, `eventAttendanceMode` offline, `location` `{ '@type': 'Place', name: court.name, address }` when a verified address exists, else `{ '@id': court id }`, and `offers` / `isAccessibleForFree: false` as the schedule form does. No Court Call Event (the Court Call is not a sourced session).
- Every fact in JSON-LD must appear as visible text on the page. If `CourtCard` does not print a block's season (`from`–`until`), print it there (`Through Oct 31`), or leave `startDate`/`endDate` out of that block's `eventSchedule`.

### 7.10 `public/llms.txt`

`tests/agent-surfaces.test.mjs` caps the file under 320 lines (313 today). Add exactly one line, right after the line that starts `- [MCP](https://pointcast.xyz/api/mcp):`:

```
- [Courts feed](https://pointcast.xyz/courts.json): Sourced South Bay pickleball courts: hours, drop-in sessions and fees, each with its source and checked date, and an hours confidence (verified, posted-sign, reported or unknown).
```

Every Markdown link stays absolute.

### 7.11 L4 tests

- `tests/air-count-api.test.mjs` (new; routes through vite `ssrLoadModule`, `SqliteD1` with migrations 0001 + 0023 + 0031; seed users rows with roles JSON and a session cookie the way `tests/air-assign-api.test.mjs` does for a director): killtest numbers on a fixture (1 guest on site at el-segundo `wait` → 1/1; the same phone marked house → 0/0; a broadcaster's row → not counted; an agent row and a parking row → not counted); the JS count agrees with a direct SQL count on the same fixture; no response body contains a fixture `pid_hash`, `ip_hash`, user id or `who`; `Cache-Control` max-age 60; DB without 0031 → 503; house GET for a guest `{canMark: false}` with no `marked` key, for a director `{canMark: true, marked: false}`; POST mark then GET `marked: true`; unmark; POST from a non-director 403; bad origin 403 first. Source asserts: literal SQL with `.bind(`, `squash(sql)` contains `HOUSE_SELECT`, `readPost(` first in POST, `if (!env.AUTH_DB) return unavailable();`.
- `tests/air-count-pages.test.mjs` (new): `/r/how` source prints every `KILL_TEST_RULES` line and `FREEZE_LINE`, has no `noindex`; `/r/me` has `data-air-house`; `/r/index.astro` links `/r/how`; `air-house.ts` sends the device in the header for GET and the body for POST, never a query string.
- `tests/courts-feed.test.mjs` (new): `hoursSourceOf` every branch.
- `tests/pickleball-jsonld.test.mjs` (new; reads `src/pages/pickleball.astro` source, and `dist/pickleball/index.html` only when present): `eventStatus` on every Event; no `TennisComplex`; dated occurrences use the right offset on both sides of Nov 1 (unit-test the helper if it is exported from a plain module); a block past its `until` has no dated occurrence; `llms.txt` grew by exactly one line and links `/courts.json`.

### 7.12 L4 verify

```
node --check functions/_lib/courts-feed.mjs
node --test tests/air-count-api.test.mjs tests/air-count-pages.test.mjs tests/courts-feed.test.mjs tests/pickleball-jsonld.test.mjs tests/courts-schedule.test.mjs tests/pickleball-board-pages.test.mjs tests/pickleball-v2.test.mjs tests/pickleball-v2-integration.test.mjs tests/court-board.test.mjs tests/air-killtest.test.mjs tests/air-house.test.mjs tests/air-api.test.mjs
```

Return: files changed, test results, every refresh entry applied or skipped (with why), `needs`.

---

## 8. L5 — publish

Owned: `src/content/blocks/0705.json` (or the next free id), `src/data/front-door-news.json`, `src/data/new-today.json`, `src/pages/sitemap-discovery.xml.ts`, `docs/plans/2026-10-18-field-reports-v2-runbook.md` (new), `tests/home-new-today.test.mjs` (only if your entries break it).

Foundation imports: none.

**Block id.** Before writing: `git fetch origin` then, for `origin/main` and every `origin/*` branch with a commit in the last 14 days (`git for-each-ref --format='%(committerdate:short) %(refname:short)' refs/remotes/origin`), list `git ls-tree --name-only <branch> src/content/blocks/` and take the next id above the highest. On 2026-10-18 that was 0705.

**Block.** Copy the shape of `src/content/blocks/0628.json` (the Morning Edition block) exactly: `id`, `channel: "FD"`, `type: "NOTE"`, `title`, `dek`, `timestamp` (the LA time you write it, with offset), `size: "1x1"`, `noun` (the id as a number), `media` (`{"kind": "image", "src": "/images/air/morning-masthead.webp"}`, an existing asset; no new art, no people or places), `body`, `companions`, `author: "cc"`, `mood: "calm"`, `meta`.
- Title: `The paper by RSS and email, and the honest count`.
- Dek: one sentence: `The Morning Edition gets an RSS feed and a signup, slot 2 prints today's courts when nobody reported, and /r/how shows the kill-test count.`
- Body, plain text, three short paragraphs, nothing claimed live before it is:
  1. The Morning Edition is at /morning.xml as RSS, and /morning has a signup. Email waits on a mail sender: signups are kept as pending and get a confirmation link once the paper's mail is switched on, and nothing is sent to anyone who has not confirmed. One-tap unsubscribe.
  2. On a morning after no court reports, the courts slot prints today's sourced sessions with times and fees, the NWS wind and temperature, and sunset. After reports, it prints yesterday's busiest court. House phones never decide it.
  3. /r/how prints how Field Reports counts and the live number for the kill test: 10 on-site reports from 3 people between Sep 28 and Oct 23. Agents and house phones never count. The page reads the result on Sat Oct 24 and says plainly what freezes if it fails.
- Companions (`surface: "external"`, absolute URLs): `/morning` "Today's paper", `/morning.xml` "The paper as RSS", `/r/how` "How we count", `/pickleball` "The Pickleball Board", `/courts.json` "The open courts feed".
- `meta`: `{"surface": "/morning", "state": "migration 0031 · workers/morning-daily · mail off until a sender exists", "next": "Sat Oct 24: the kill-test read at /r/how"}`.

**Front-door news.** Append to `src/data/front-door-news.json`:

```json
{ "label": "Field Reports", "line": "How we count is public at /r/how, with the live kill-test number: 10 on-site reports from 3 people by Oct 23. Agents and house phones never count.", "link": "/r/how", "date": "<LA day you write it>", "edition": false }
```

`edition: false` keeps it out of the paper's town slot (L1's `pickTown`), so it does not crowd out town news. Its `link` must differ from every fresh `new-today.json` link and from `/b/<block>` (`tests/home-new-today.test.mjs` "launch notes stay out…").

**New today.** Prepend one entry to `src/data/new-today.json`: `{"date": "<LA day>", "kicker": "Morning Edition", "title": "The paper: RSS and signup", "link": "/morning", "block": "0705"}` (kicker ≤ 21 chars, title ≤ 28).

**Sitemap.** `src/pages/sitemap-discovery.xml.ts`: add `['https://pointcast.xyz/morning.xml', 'daily', '0.90']` after the `morning.json` line. Do not add `/r/how`: it is a prerendered page, so `@astrojs/sitemap` (astro.config) lists it, and the config keeps the two sitemaps disjoint.

**Runbook** `docs/plans/2026-10-18-field-reports-v2-runbook.md`, short, in this order:
1. What shipped (one line per item) and what is off until mail exists.
2. Deploy order (cc does this, never a build agent): re-check the migration number on fresh `origin/main` and every `origin/*`; apply `migrations/auth/0031_field_reports_paper.sql` with `npx wrangler d1 execute pointcast-auth --remote --file <path>`; confirm with `SELECT name FROM sqlite_master WHERE name IN ('air_house','edition_subscribers','morning_daily_runs')`. Deploy the Worker (`cd workers/morning-daily && npx wrangler deploy`), set its secret `MORNING_INTERNAL_KEY` (a fresh random value), check `/status` reads `configured: false` with the plain reason. Merge the PR and run `scripts/deploy.sh`. Follow-up PR, optional: uncomment the `MORNING_DAILY` stanza in `wrangler.toml`, set the Pages secret `MORNING_INTERNAL_KEY` to the same value, deploy; signups then get their confirm mail at once instead of at the next 13:45/14:45 UTC tick.
3. Smoke: `/morning.xml` (valid RSS, items link `?src=rss`), `/morning` signup answers `on-list`, `/api/morning/unsubscribe?t=<bad>` 400 page, `/r/how` count line, `/api/air/killtest` numbers only, `/courts.json` `hours_source`, `/pickleball` passes the Rich Results Test, a receipt shows `Get tomorrow's paper`.
4. **The one thing that needs Mike: a mail sender.** Either (a) a Resend account with `pointcast.xyz` verified (its DNS records go in at Namecheap) and its API key set as the Worker's `RESEND_API_KEY`, or (b) move `pointcast.xyz` DNS to Cloudflare, onboard Email Sending, then set `MORNING_SEND_EMAIL_READY = "true"` in `workers/morning-daily/wrangler.toml` and redeploy the Worker. After either, the next tick sends every waiting confirmation; nothing else changes.
5. Optional, only Mike can do it: on each of his phones, signed in, open `/r/me` and tap `This is a house phone`. Until then a phone of his counts like anyone's.
6. Sat Oct 24: read `/r/how` (or `/api/air/killtest`). If it did not pass, the game layer freezes as the page says; nothing to deploy.
7. Rollback: Pages rolls back by redeploying the previous sha; the Worker by `wrangler rollback`; the migration's tables can stay (nothing old reads them).

L5 verify:

```
node -e "JSON.parse(require('fs').readFileSync('src/content/blocks/0705.json','utf8'))"
node -e "for (const f of ['src/data/front-door-news.json','src/data/new-today.json']) JSON.parse(require('fs').readFileSync(f,'utf8'))"
node --test tests/home-new-today.test.mjs tests/front-door-september.test.mjs
```

The pre-existing failures in §0 stay; no new failure. Return: files changed, the block id and why, test results, `needs`.

---

## 9. File ownership

Every file any agent changes appears once.

| Owner | Files |
|---|---|
| **Architect** | `docs/plans/2026-10-18-field-reports-v2-paper-spec.md` |
| **Foundation** | `migrations/auth/0031_field_reports_paper.sql` · `functions/_lib/air-house.mjs` · `functions/_lib/air-killtest.mjs` · `functions/_lib/edition-mail.mjs` · `src/data/air-spots.json` (reserved only) · `src/components/air/AirSpot.astro` (two links) · `tests/air-house.test.mjs` · `tests/air-killtest.test.mjs` · `tests/edition-mail.test.mjs` · `tests/field-reports-paper-migration.test.mjs` · `tests/air-kinds.test.mjs` · `tests/air-pages.test.mjs`, `tests/air-roles.test.mjs`, `tests/air-desk-pages.test.mjs` (only if the hook points break them) |
| **L1 edition** | `functions/_lib/morning.mjs` · `functions/_lib/morning-sources.ts` · `functions/morning.xml.ts` · `src/scripts/morning-client.ts` · `tests/morning-edition.test.mjs` · `tests/morning-api.test.mjs` · `tests/morning-mcp.test.mjs` (only if broken) · `tests/morning-courts.test.mjs` · `tests/morning-rss.test.mjs` |
| **L2 signup** | `src/pages/morning.astro` · `src/scripts/morning-signup.ts` · `functions/api/morning/subscribe.ts` · `functions/api/morning/confirm.ts` · `functions/api/morning/unsubscribe.ts` · `functions/_lib/morning-mail-store.ts` · `wrangler.toml` (comment only) · `tests/morning-subscribe-api.test.mjs` · `tests/morning-page.test.mjs` |
| **L3 worker** | `workers/morning-daily/wrangler.toml` · `workers/morning-daily/package.json` · `workers/morning-daily/src/index.ts` · `workers/morning-daily/src/run.ts` · `tests/morning-daily-run.test.mjs` |
| **L4 count + data** | `functions/_lib/air-count-store.ts` · `functions/api/air/house.ts` · `functions/api/air/killtest.ts` · `src/pages/r/how.astro` · `src/scripts/air-how.ts` · `src/scripts/air-house.ts` · `src/pages/r/me.astro` · `src/pages/r/index.astro` · `functions/_lib/courts-feed.mjs` · `functions/courts.json.ts` · `src/lib/courts.ts` (types) · `src/data/courts-schedule.json` · `src/pages/pickleball.astro` · `src/components/courts/CourtCard.astro` (only if needed) · `public/llms.txt` · `tests/air-count-api.test.mjs` · `tests/air-count-pages.test.mjs` · `tests/courts-feed.test.mjs` · `tests/pickleball-jsonld.test.mjs` · `tests/courts-schedule.test.mjs` · `tests/pickleball-board-pages.test.mjs` (only if broken) |
| **L5 publish** | `src/content/blocks/0705.json` · `src/data/front-door-news.json` · `src/data/new-today.json` · `src/pages/sitemap-discovery.xml.ts` · `docs/plans/2026-10-18-field-reports-v2-runbook.md` · `tests/home-new-today.test.mjs` (only if broken by your entries) |

Read-only for everyone: `src/scripts/air-client.ts`, `functions/_lib/air-store.ts`, `functions/_lib/court-board.mjs`, `functions/_lib/court-conditions.ts`, `src/lib/mail.ts`, `functions/api/auth/**`, `src/lib/director-access.ts`, `functions/api/mcp.ts`, `docs/plans/2026-10-18-courts-refresh.json`.

## 10. Integration (after all five lanes; the orchestrator or one integrator)

1. `node --test tests/*.test.mjs`; list failures that also fail on `da63816f` as pre-existing (§0).
2. `rm -rf dist && npm run build:bare`, then `node --test tests/agent-surfaces.test.mjs tests/pickleball-jsonld.test.mjs`, then `rm -rf dist` when done.
3. `node --check` every inline script extracted from built `/morning`, `/r/how`, `/r/me`, `/r`, `/court`, `/pickleball`.
4. `git diff --stat` touches only §9 files; no file outside it.
5. Optional local smoke: apply 0001, 0023, 0031 with `npx wrangler d1 execute pointcast-auth --local --persist-to <scratch>` and `npx wrangler pages dev dist`; sign up, read `/morning.xml`, `/api/air/killtest`.

## 11. Risks

| Risk | Mitigation |
|---|---|
| 0031 or 0705 taken by a parallel branch before merge | Re-check with `git ls-tree` on every `origin/*` right before merge; rename and update the migration test and the block references. |
| The count rules differ from the PRD's strict count | The re-scope cut typed codes and `code_via`, and the task does not exclude Fridays. On site means a day code, which can travel in a shared link; /r/how says so in plain words. Expect 1 of 10. |
| Mail cannot send until Mike adds a sender | Signups wait as pending; the page and the API say so; the Worker sends every waiting confirmation on its next tick once a sender exists. |
| Unconfirmed emails are held while mail is off | Never shown or logged; rows whose confirm went out 30+ days ago are pruned; unsubscribe works from the first mail. |
| Service binding to an undeployed Worker | Left out of `wrangler.toml` (comment only). Without it, confirmation waits up to one tick. |
| The Worker's fetch of pointcast.xyz fails or is cached provisional | Five attempts spaced past the 60 s provisional edge cache; `not-frozen` run row; `MORNING_EDITION_URL` can point at the pages.dev host. |
| KLAX down at 6:45 means no freeze and no send that day | Recorded as `not-frozen`; a later reader still freezes the page. |
| NWS only on the edition's own day | A first read on a later day drops the NWS sentence rather than print the wrong forecast. |
| The launch note crowds the town slot | `edition: false` plus `pickTown` skips it; L1 and L5 land in the same PR. |
| JSON-LD dated occurrences are build-time | 14-day window from the build day; deploys are frequent; the schedule form stays. |
| `DIRECTOR_WALLET` duplicates the director address | A test pins it to `src/lib/director-access.ts`. |
| `users.payload` read in JS for the house check | Read only inside the count functions; tests assert no response carries ids or payloads. |
| Shared rate-limit counters with sign-in magic links | Same 3-per-15-minutes per address; acceptable at today's traffic. |
| Five lanes in one worktree | Disjoint files (§9); no lane builds; the integrator builds once. |
| Pre-existing failing tests | Listed in §0; lanes name them, never "fix" them outside their files. |
