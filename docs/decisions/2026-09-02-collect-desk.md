# Collecting desk: email a dog a day

Date: 2026-09-02  
Status: implemented on `codex/collect-desk-20260902`; not deployed  
Decision: rebuild `/collect` as the low-friction Kennel Club collecting desk. Preserve the previous objkt inventory and direct buy flow at `/collect/shelf`.

> Superseded 2026-09-04 (Astra finding 2): the subscriber `token` is now an
> unsubscribe-only capability. Each daily send creates a distinct random login
> token, stores only its SHA-256 hash, revokes earlier unused tokens, and gives
> it a 15-minute, single-use lifetime. Unsubscribe revokes outstanding logins.
> Auth sessions also retain their original authentication time; session
> rotation preserves it, and passkey registration/removal requires a fresh
> sign-in. Migration: `migrations/auth/0011_collect_login_tokens.sql`.

> Superseded 2026-09-04 (Astra finding 4): Pages no longer infers scheduled
> delivery readiness from its own `SEND_EMAIL` binding. `KENNEL_DAILY` is a
> service binding to the scheduled Worker, and the public status route proxies
> that Worker's binding readiness, dry-run flag, last D1 run receipt, and
> provider-acceptance counts. `/collect` says unavailable/unknown explicitly
> and does not equate provider acceptance with inbox delivery. This source
> change is not evidence that the binding was configured or deployed.

## Promise

The front door makes one offer and asks for one field:

> Collect a dog a day. Free.
>
> We’ll email you when tomorrow’s dog is ready.

Email is both delivery permission and an identity provider. Google and passkey remain alternate sign-in buttons. A confirmed person can claim before linking a Tezos wallet; the parallel claim service owns the held-until-wallet state.

## Flows

### Subscribe and confirm

1. `POST /api/collect/subscribe` accepts `{ email, tz }`.
2. The endpoint normalizes the address, rate-limits both an email hash and IP hash in `PC_RATES_KV`, and writes a pending D1 subscriber.
3. It stores a 24-hour one-time confirmation state in `oauth_states` under a hashed token key.
4. `SEND_EMAIL` sends the double-opt-in message from `PointCast Kennel Club <kennel@pointcast.xyz>`.
5. `/api/collect/confirm?token=...` consumes the state once, confirms the subscriber, creates or links the `email` auth identity, issues `pc_session`, and redirects to `/collect?confirmed=1&claim=1`.
6. The desk calls `POST /api/kennel-club/claim` with `{ tokenId }`. That endpoint is owned by the parallel free-claim lane and is stubbed in this lane’s tests.

The confirmation callback links to an already signed-in user only when the callback still carries the exact session that started the flow. A forwarded link otherwise signs into the email identity independently.

### Daily entry

1. The scheduled worker selects confirmed subscribers whose `last_sent_day` is not the Los Angeles calendar day.
2. Before each send, it conditionally writes `last_sent_day`. A concurrent or repeated run cannot claim that row twice.
3. On binding-send failure it restores the previous value so a later run can retry.
4. The button URL is `/k/today?claim=1&t=<single-use-login-token>`; the stored subscriber token appears only in the unsubscribe URL.
5. `/k/today` atomically consumes the hashed login token if it is unrevoked and no more than 15 minutes old, resolves the confirmed subscriber, issues the existing email identity’s session, and redirects to `/collect?claim=1`.
6. The desk automatically calls the claim API. A claim without a linked wallet is held by that API until a wallet is attached.

The subscriber token is a high-entropy unsubscribe capability stored only in D1 and the person’s email. It is never accepted for daily entry and is never included in public JSON or logs. A distinct login token is issued per send and stored only as a hash.

### Collection views

- `/api/collect/me` composes the signed-in session, linked Tezos holdings, owned profile handle, Kennel Club days, current streak, soulbound seals, Coffee Mugs, and Visit Nouns. It never serializes an email address.
- `/collect` starts with 30 numbered silhouettes. A signed-in response reveals only held plates and the composed totals.
- `/collect/@{handle}` resolves the handle through the live Profile Objects contract snapshot, then reads the public owner holdings. The page has `/collect/@{handle}.json` and a 1200×630 `/collect/@{handle}.og.png` twin.
- `/collect.json` advertises today’s collectible, contracts, counts, agent routes, and the old shelf without PII.

## D1 tables

Migration: `migrations/auth/0004_collect_subscribers.sql`.

`subscribers`

- `email` — normalized primary key, case-insensitive
- `user_id` — nullable foreign key to `users`; filled at confirmation
- `status` — `pending`, `confirmed`, or `unsubscribed`
- `token` — unique high-entropy reusable unsubscribe capability
- `created_at`, `confirmed_at`
- `last_sent_day` — Los Angeles `YYYY-MM-DD`; idempotency gate
- `tz` — captured browser time zone; daily September delivery still follows the project’s Los Angeles rollover

`kennel_daily_runs`

- one row per Los Angeles day
- start/finish timestamps, attempted/sent/failed counts, dry-run bit, configured bit
- operational only; contains no subscriber identifiers

`collect_login_tokens` (migration `0011`)

- SHA-256 token hash, subscriber foreign key, issue/expiry/consume/revoke times
- one raw token per daily send; 15-minute TTL and atomic single-use consume

No public or agent JSON includes an email address. The worker does not write recipient addresses to logs.

## Daily worker and cron

Worker: `workers/kennel-daily`  
Cron: `0 7 * * *` UTC — midnight Pacific during September daylight time  
Worker binding names: `AUTH_DB`, `SEND_EMAIL`, `PRESENCE_BUS`

Pages-to-Worker binding name: `KENNEL_DAILY`
Sender: `kennel@pointcast.xyz`

The handler computes the sitting from `America/Los_Angeles`, sends HTML and text bodies, supplies `List-Unsubscribe` headers, writes the run receipt, and posts one presence `burst` with kind `daily`. The presence service is bound directly; there is no public Worker-to-Worker fetch.

Set the non-secret `KENNEL_DAILY_DRY_RUN` var to `"true"` to query and render the run without email, delivery marks, or a burst. `GET /status` on the Worker reports its own readiness and last run; `GET /api/kennel-club/daily/status` reaches that exact endpoint through `KENNEL_DAILY`. A missing or unreachable binding is an explicit unavailable state. Provider acceptance counts remain separate from unknown inbox delivery. Missing email logs a structured skip and sends nothing.

Director preview: `GET /api/kennel-club/daily/preview`. It requires the existing `broadcaster` role and renders today’s final HTML with a deliberately invalid preview token.

## Email copy

Confirmation subject: `Confirm your dog-a-day delivery`

Daily subject: `Sitting NN · <Name> is ready`

Daily body:

- the day’s plate
- breed and sitting title
- one primary button: `Claim <Name> — free`
- one unsubscribe link
- a plain-text twin with the same links

## What cc must set before deploy

No setup, migration, Worker deployment, secret, or production release was performed by this branch.

1. In the `pointcast.xyz` Cloudflare zone, enable Email Routing and Email Sending. Confirm SPF, DKIM, DMARC, and bounce records have propagated and that `kennel@pointcast.xyz` is an allowed sender.
2. Confirm the scheduled Worker declares `SEND_EMAIL` (restricted to `kennel@pointcast.xyz`) and the Pages project resolves `KENNEL_DAILY` to `pointcast-kennel-daily`. Pages' own email binding is irrelevant to scheduled-worker readiness.
3. Apply the new D1 migration before either surface can accept traffic:

   ```sh
   npx wrangler d1 migrations apply pointcast-auth --remote --config wrangler.toml
   ```

4. Deploy in this order:

   - `workers/presence` first, because it adds the `daily` burst kind;
   - `workers/kennel-daily` second, with D1, email, and `pointcast-presence` service bindings resolved;
   - the PointCast Pages build last, so subscribe, confirm, `/k/today`, preview, status, and `/api/collect/me` arrive together.

5. Verify `/api/kennel-club/daily/status`, the director preview, one real double-opt-in address, one dry run, one scheduled run receipt, one delivery, one unsubscribe, and a same-day safe re-run before enabling the full list.

## Phase 2

- Automated streak seals: after the authoritative claim ledger proves the required streak or all 30 sittings, a separate issuer Worker may submit `attest` to `seal_soulbound` using the cc issuer wallet `tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY`. The issuer key must be a Worker secret, never D1 data, source, config, or a Pages binding. Mike remains the other approved issuer.
- Trades between handles: Profile Objects remain transferable handle objects. A trade desk can resolve each handle to its current owner, then compose Marketplace transfers without making email or D1 identity public. The on-chain owner at signing time is authoritative; handles do not imply custody of soulbound seals.
