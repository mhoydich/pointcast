# Terra brief — "Say hello across town" on Industry Next

**Date filed:** 2026-09-05 (prepared 2026-09-04) · cc for Mike
**Scope:** `docs/plans/2026-09-05-fishclub-tonebloom-scope.md` (Codex/Astra), the "Industry Next: one-afternoon cut". Industry Next's builder owns the tile and the greeting issuer.
**Protocol you code against:** `docs/plans/2026-09-05-rewards-protocol.md`, with byte-exact test vectors.
**Site:** www.industrynext.xyz. One tile, one tiny same-origin handler. No listening timer, no new token, no new account system.

## What this proves

Issuer verification, account binding, replay prevention, and attribution on a second satellite. It does not prove anything about listening. If Industry Next cannot hold a server secret, ship a plain link to `https://pointcast.xyz/faucet/hello` labelled the same way and report that the cryptographic receipt experiment is unproven on this site. A static link is the smaller fallback, not equivalent evidence.

## The flow

1. Tile on Industry Next: **"Say hello across town."** · "One HELLO, held for you on PointCast." It links to `https://pointcast.xyz/rewards/start?program=industrynext-hello`.
2. PointCast signs the visitor in, binds a run to the account, and sends them back to `https://www.industrynext.xyz/hello#launch=<ticket>`.
3. `GET /hello` on Industry Next strips the fragment immediately (`Referrer-Policy: no-referrer`, no third-party script before the strip) and POSTs the ticket to `POST /api/reward-runs/start`, which verifies it per the protocol (`purpose = launch`, `aud = industrynext`) and records the run once.
4. The page shows one explicit **"Say hello"** action. `POST /api/reward-runs/:run/finish` issues the completion receipt (`purpose = receipt`, `iss = industrynext`, `aud = pointcast-rewards`, `program = industrynext-hello`, run id, `startedAt`, `finishedAt`, `creditedSeconds: 0`, stable nonce, `exp = iat + 1800`). No duration requirement. Same receipt on retries.
5. The button sends the person to `https://pointcast.xyz/faucet/hello#receipt=<receipt>`. PointCast writes the HELLO line with `via = industrynext`, or says "Today's HELLO is already here" if they already claimed today, never a second token.

The secret is `REWARDS_INDUSTRYNEXT_SECRET`, shared with PointCast only, in Industry Next's server secret store, handed over out of band. Industry Next never receives a PointCast cookie, email, user id, wallet, or any chain key.

## Acceptance

- The published test vectors verify byte for byte.
- Invalid, expired, wrong-audience tickets are refused; a valid one creates exactly one run; a second launch for the same run resumes it.
- Finish issues the same receipt on retry; a forged or edited receipt is refused by PointCast.
- No ticket or receipt in a query string, access log, analytics call, or referrer.
- Report on the handoff issue with the hosting answer and a screenshot of the ledger line reading "via Industry Next" on PointCast.
