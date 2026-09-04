# Fish Club Tone Bloom — scope for cc

**Prepared 2026-09-04 by Codex (Astra) from Mike's Fish Club brief** (`docs/briefs/2026-09-04-astra-fishclub-tonebloom-scope.md`). Filed verbatim by cc; the build brief for the PointCast side follows from it. **Scope only: no implementation, deployment, secret access, funding, or sending authorized by this document.** Defaults below are recommendations for the build brief, not claims of shipped behavior.

## Decision

Build a five-minute **Fish Club** program on Tone Bloom using its existing sound engine. Choose pattern 1, with an account-bound signed receipt and server-timed heartbeats. Keep the performance on Tone Bloom and the claim on PointCast. Do not duplicate the engine or iframe it.

The small Industry Next experiment uses the same receipt contract for a greeting. It proves issuer verification, account binding, replay prevention, and attribution; it does not prove listening.

Listening remains available without an account. The **rewarded** route takes a brief trip to PointCast to sign in and bind the run before playback, then returns to Tone Bloom. This is the intentional addition to the proposed finish-only login: otherwise a stolen bearer receipt can be claimed by the wrong person. No wallet is needed at either step.

## What is established, and what needs implementation discovery

- Current PointCast registry and SQL are keyed by faucet. `spigotSecretKey` and `faucetCap` still special-case HELLO; adding a registry row alone is insufficient. Use explicit per-token environment bindings, preserving `HELLO_FAUCET_SECRET_KEY` and adding `FISHCLUB_FAUCET_SECRET_KEY` rather than silently renaming production secrets.
- FISHCLUB's public catalog records Ethereum contract `0x3bca69e033b3605a714dd815f51cb4e9d5b4693a` and deployer `0xe62e0219053ddc0c5a1dafbdfb947310a528a3a7`. This is a different address from HELLO. Catalog provenance is not a fresh balance or key check.
- `src/lib/pointcast-focus.ts` describes five focus modes and links to Tone Bloom `/focus`; the live page identifies a 25-minute sound room. Reuse the engine, not the football framing or an assumed existing ocean preset.
- Tone Bloom's deployable server runtime, persistent storage, completion hook, and exact available voice/image IDs have not been inspected. The satellite builder must establish these before estimating the integration. A completion callback alone is insufficient.
- The fish plate exists. Reuse it with its existing attribution. Local `VOICE.md` chiefly governs authorship: the draft interface copy below is Codex's, not a quote or invented experience attributed to Mike.

## The first program

Five credited minutes, one slow speed, one fixed mix of existing soft synthesized voices, and three existing ocean-compatible images selected from Tone Bloom's library. No new audio recordings, image generation, or twelve-voice control panel. If the library lacks a suitable ocean sequence, reuse the fish plate as the single visual for the pilot.

Offer Start, Pause/Resume, and Leave. Fade gently for the final ten seconds, let the fish plate settle, and leave the room still. No confetti, price, wallet dialog, streak pressure, or reward sound interrupting the ending. Volume is the listener's choice; do not pretend to measure human attention or audible output.

### What finished means

The satellite server records the start and credits elapsed intervals through a run-scoped session. Heartbeats arrive about every 15 seconds, with monotonic sequence numbers. Credit only non-overlapping server-measured intervals bounded to 20 seconds, while the client reports playback running and the page visible. A longer gap earns no elapsed credit and re-anchors the clock; pause/hidden time earns none. Duplicate or out-of-order beats earn nothing. Finish requires 300 credited seconds and at least 300 seconds of server elapsed time. Resume within a two-hour run lifetime; expiry means a new run.

This is modest friction against fast completion, not proof of listening: a scripted client can simulate beats. An HMAC authenticates the issuer and its decision, not the listener. Accept that limit for a valueless, capped greeting; no CAPTCHA, microphone, biometric signal, or attention surveillance.

## Endpoint contract (all new unless marked existing)

| Origin / endpoint | Role |
| --- | --- |
| Tone Bloom `GET /fishclub` | Anonymous listening, or "Listen and keep a fish" launch link. |
| Industry Next greeting tile | Opens PointCast's start page for the allowlisted Industry Next greeting program. |
| PointCast `GET /rewards/start?program=…` | Sign-in/consent page; GET never creates a reward or run. Only two allowlisted program IDs. |
| PointCast `POST /api/reward-runs` | Session + same-origin CSRF protection. Creates account-bound run, fixed token/program/issuer, and signed launch ticket. Returns the allowlisted satellite launch URL. |
| Satellite `POST /api/reward-runs/start` | Validates launch signature/expiry/audience, creates run once in persistent storage, sets its own run-scoped cookie; duplicate launch resumes the same run. |
| Tone Bloom `POST /api/reward-runs/:run/heartbeat` | Validates run cookie and sequence; credits server-timed intervals. |
| Satellite `POST /api/reward-runs/:run/finish` | Tone Bloom checks credited duration; Industry Next records the explicit greeting click with no duration requirement. Issues the same receipt on retries. |
| PointCast `GET /faucet/:slug#receipt=…` | Landing page captures receipt in tab session storage, immediately removes fragment, and presents claim. GET never writes the ledger. |
| PointCast `POST /api/faucet/:slug/claim` (extend existing) | Session + CSRF protection; verifies receipt, account binding, policy and cap; atomically consumes receipt and writes held claim. FISHCLUB always requires a valid completion receipt. HELLO's ordinary claim continues to work. |
| PointCast `GET /api/faucet/:slug` (existing) | Returns held/delivered balance and private claim provenance. |
| PointCast `POST /api/faucet/:slug/deliver` (existing) | Remains disabled for every faucet until issue #1052's sign-first delivery fix merges and is deployed/verified. |

The satellite receives no PointCast cookie, email, user ID, or wallet address. PointCast retains the user-to-run mapping. Satellite calls are same-origin; this pilot needs no credentialed cross-origin browser API or shared cookies. Login expiry at return preserves the receipt in tab session storage through same-tab sign-in, then requires the original account. Remove it after redemption/expiry. Another account gets a neutral account-mismatch message, never an automatic reassignment.

## Tickets, receipts, and sequence

1. Visitor selects the rewarded route; PointCast authenticates, explains the reward, and creates a random run ID associated with that account. Rate-limit starts and allow only one active run per account/program. Display "Already kept today's fish" when applicable; unrestricted listening still works.
2. PointCast signs a five-minute launch ticket containing version, issuer, audience, program, run ID, `iat`, `exp`, and a random nonce. No PII. Return URL is selected from configuration, never accepted from arbitrary input.
3. Carry the launch in the URL fragment, remove it immediately, and POST to the satellite's start endpoint. No ticket in a query string, access log, analytics payload, or referrer. Handoff pages use `Referrer-Policy: no-referrer` and omit third-party embeds/scripts until the fragment is removed.
4. Satellite validates the fixed algorithm and expected audience, then owns timing. Run creation and heartbeat updates require transactional/conditional persistent writes, not an eventually consistent KV lock.
5. On eligible completion, satellite signs `{v, iss, aud: 'pointcast-rewards', program, run, startedAt, finishedAt, creditedSeconds, nonce, iat, exp}`. Receipt validity is 30 minutes. A run's receipt nonce is stable across retries. PointCast chooses token and amount from its policy, never from a caller-supplied amount or slug alone.
6. The final button takes the receipt to PointCast. PointCast checks signature, expected issuer/program/token mapping, stored account/run, timestamp ordering, expiry, and required credited duration, then offers "Keep this fish." The claim POST is the only award step.
7. An atomic database transaction consumes the receipt and creates exactly one held ledger line; return that same claim on retries. Receipt consumption must roll back if the write fails. Refresh and double-click cannot create another award.

Use a fixed HMAC-SHA-256 token format and a maintained implementation, with signature validation before trusting fields. Separate per-satellite receipt secrets from every chain key; use distinct signing purposes for launch and completion to prevent token substitution. Allowlisted key IDs permit rotation without accepting arbitrary algorithms. Receipt secrets live only in server secret stores on PointCast and the respective satellite. Neither satellite receives a deployer key.

## Ledger, limits, and failure behavior

Add a PointCast `reward_runs` table with account, issuer, program, start/expiry, completion/redemption state and resulting claim ID. Add a unique `(issuer, receipt_nonce)` receipt record. Persist enough state for idempotent retries; keep consumed nonce records through at least receipt expiry plus clock allowance, and retain durable claim/run linkage. Do not store full signed receipts in logs.

Extend `faucet_claims` with nullable server-written `via`, `program`, and `reward_run_id`; existing HELLO rows remain valid. Include upgrades for existing databases, not just revised CREATE TABLE statements. Provenance and redemption records belong in D1; KV may cache reads, never decide single use.

FISHCLUB: **one token per account per Los Angeles day, 50 claims town-wide per day**. Day is computed at successful claim time. A run spanning midnight can yield one award on the redemption day; reusing it the next day cannot yield another. One per run with unlimited daily runs is rejected for this pilot. Repeat listening is welcome, without extra rewards. Caps apply in the same atomic operation as receipt consumption.

At daily cap or already claimed, issue no extra line and show the truthful result. Mark the run as resolved without award so tomorrow cannot turn an old completion into a fresh entitlement. A transient failure leaves it retryable within its validity window. Expired receipts require a new run; no manual override or receipt-refresh service in v1.

For HELLO, a successful Industry Next receipt claim sets `via=industrynext` on that new line. A person who already claimed HELLO today gets "Today's HELLO is already here"; never overwrite its original provenance or award a second token. A `via` query parameter alone grants no trusted attribution. Show "via Industry Next" in the person's own ledger; no public cross-site activity feed.

The claim cap does not bound a backlog's eventual daily delivery volume or gas spend. That remains a delivery-policy concern, separate from this scope and subordinate to #1052.

## The ending, in draft interface copy

- Before play: **"Five quiet minutes. A fish to keep."** Supporting line: "Sign in on PointCast to keep one FISHCLUB when you're done. No wallet needed." Secondary option: "Just listen."
- Tone Bloom completion: **"The water settles."** Button: **"Keep this fish on PointCast."** Do not say the ledger has changed yet.
- PointCast successful claim: **"One FISHCLUB is in your ledger."** Supporting line: "Leave it here. Come back when you like." Link: **"Open your faucet desk."**
- While sending is closed: **"Your fish is held here. Sending comes later."** No enabled Send button.
- Already awarded: **"Today's fish is already here. The room is still open."**
- Industry Next tile: **"Say hello across town."** Supporting line: "One HELLO, held for you on PointCast."

Add a compact HELLO/FISHCLUB switcher or balance list to the existing faucet desk; both balances must be discoverable together. Do not build a new portfolio page.

## Industry Next: one-afternoon cut

One tile, one tiny same-origin greeting handler, and the common start/finish receipt contract. After PointCast binds the account, return to the Industry Next greeting view; its explicit "Say hello" action issues the receipt and returns to PointCast for the claim. No listening timer, new token, new account system, or new hosting project.

The afternoon estimate applies **after the shared PointCast receipt plumbing exists** and only if Industry Next has a deployable server endpoint and persistent run storage. If it cannot support a server secret, ship an ordinary HELLO link only and label the cryptographic receipt experiment unproven. A static link is a smaller fallback, not equivalent evidence.

## Ownership, cut line, and acceptance

cc owns PointCast run binding, receipt validation, schema upgrade, atomic ledger writes, both token policies and claim UI. Tone Bloom's builder owns the existing engine hook, five-minute preset, server timing and completion receipt. Industry Next's builder owns the tile and greeting issuer. Share one protocol fixture/spec, not chain credentials. No agents or external messages are dispatched by this scope document.

Build order: shared PointCast contract and fake-receipt tests → Industry Next greeting integration → Tone Bloom timing integration → browser checks on real origins. Claims can launch with delivery disabled and no FISHCLUB key installed. Later, verify the sheet key derives to the catalog deployer before putting it in Cloudflare; check actual supply/ETH separately. No key access or funding is needed to prove this pilot.

Acceptance: two browsers racing the same receipt produce one claim; wrong-account, wrong-issuer, wrong-program, tampered and expired receipts award nothing; concurrent last-slot claims respect cap; failed ledger write does not burn receipt; replay across midnight awards nothing; invalid beats and long gaps do not advance time; pause/resume works; no ticket leaks to analytics/referrers; Industry Next attribution is server verified; HELLO and FISHCLUB remain distinct; all delivery routes and buttons stay closed pending #1052. Test with fake chain adapters and real ledger transactions, without mainnet sends.

Cut: no new chain, contract, mint, marketplace, price feed, wallet prompt, transferable receipt, iframe, audio rewrite, long-run tier, streak system, multiplayer reward, dashboard, or second wave of tokens. FISHCLUB is a greeting with no promised monetary value; expose no price or trading feature. Do not make a factual guarantee about future external markets.

## One-line answers for Mike / cc

| Question | Answer |
| --- | --- |
| Which run? | A new five-minute Fish Club preset on Tone Bloom's existing engine; the 25-minute focus program remains unchanged. |
| Ocean voice/images? | One quiet existing mix, slow speed, three existing ocean-compatible images; fish plate alone if no suitable set exists. Exact IDs are the satellite builder's discovery task. |
| What counts as finished? | 300 seconds of server-credited heartbeat time, certified by an account-bound satellite receipt; this is completion evidence, not proof of hearing. |
| Cap/cadence? | One FISHCLUB per account per LA day, 50 town-wide, unlimited unrewarded listening. |
| The moment? | A quiet fish-plate ending, then an explicit PointCast claim; show "in your ledger" only after the write succeeds. |
| Industry Next? | One greeting tile using the same receipt flow and immutable `via=industrynext`, with no extra HELLO for repeat daily claims. |
| Open to Mike? | No blocking product decision: use these pilot defaults. Mike can later change duration or creative selection; neither should block scoping/build discovery. |
| Technical gates? | Satellite server/storage access must be established; sending stays closed until #1052 is merged, deployed and verified. |

## Sources and verification boundary

Read from GitHub main on 2026-09-04: the next-token plan (`docs/plans/2026-09-04-faucet-next-tokens.md`), the FISHCLUB catalog (`src/content/eth-legacy/fishclub.json`), the focus program (`src/lib/pointcast-focus.ts`). The preceding HELLO review inspected the ledger/handlers; #1052 closure was not reverified here and is not presumed. Read local `VOICE.md` for authorship rules. Tone Bloom `/focus` title/description checked by HTTP; neither satellite backend was audited. Every new endpoint above is proposed.

---

**cc addendum (2026-09-04, after filing):** #1052's sign-first delivery fix merged in PR #1076 after this scope was written; delivery still stays closed pending the first watched send. The PointCast side of this scope is built from `docs/plans/2026-09-05-rewards-protocol.md`, which carries the exact token format and test vectors the satellite builders code against.
