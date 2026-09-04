# Sol brief — the Fish Club program on Tone Bloom

**Date filed:** 2026-09-05 (prepared 2026-09-04) · cc for Mike
**Scope:** `docs/plans/2026-09-05-fishclub-tonebloom-scope.md` (Codex/Astra). Tone Bloom's builder owns the engine hook, the five-minute preset, server timing, and the completion receipt.
**Protocol you code against:** `docs/plans/2026-09-05-rewards-protocol.md`, with byte-exact test vectors. PointCast's side ships from the same document.
**Site:** tonebloom.xyz (Mike's; built with ChatGPT). Nothing here touches the 25-minute focus room.

## Discovery first (report before building)

The scope says this plainly: Tone Bloom's server runtime, persistent storage, and completion hook have not been inspected. Establish and report:

- Where tonebloom.xyz is hosted and whether it can run a server endpoint with a secret (Cloudflare Pages Functions, a worker, a small Node host). If it cannot hold a server secret, stop and say so; the pilot then ships as "Just listen" plus a plain link to PointCast, and the receipt experiment stays unproven.
- What persistent store is available for runs (D1, KV with conditional writes, a database). Heartbeat credit needs conditional or transactional writes, not an eventually consistent lock.
- The voice and image IDs in the library that read as ocean, and one slow speed. If nothing fits, the fish plate alone is the visual for the pilot.

## The program

`GET /fishclub`: five credited minutes, one slow speed, one fixed soft mix, three ocean-compatible images or the fish plate. Start, Pause/Resume, Leave. Fade for the last ten seconds, let the plate settle, leave the room still. Two entry points on the page: "Just listen" (anonymous, no run) and "Listen and keep a fish" (links to `https://pointcast.xyz/rewards/start?program=fishclub-tonebloom`).

Copy, from the scope: **"Five quiet minutes. A fish to keep."** · "Sign in on PointCast to keep one FISHCLUB when you're done. No wallet needed." · completion: **"The water settles."** · button **"Keep this fish on PointCast."** Do not say the ledger has changed; PointCast says that after its own write.

## The three server endpoints

1. `POST /api/reward-runs/start` with the launch ticket from the URL fragment (`#launch=…`, stripped immediately on load; the page carries `Referrer-Policy: no-referrer` and loads no third-party script before the strip). Verify the ticket per the protocol (`purpose = launch`, `aud = tonebloom`, `kid`, `exp`). Create the run once in persistent storage keyed by the run id; a duplicate launch resumes the same run. Set a run-scoped cookie.
2. `POST /api/reward-runs/:run/heartbeat`: run cookie plus a monotonic `seq`. Credit only non-overlapping server-measured intervals bounded to 20 seconds, while the client reports playback running and the page visible. A gap longer than 20 seconds earns nothing and re-anchors. Duplicate or out-of-order beats earn nothing. Run lifetime two hours.
3. `POST /api/reward-runs/:run/finish`: requires 300 credited seconds and at least 300 seconds of server elapsed time. Issue the completion receipt per the protocol (`purpose = receipt`, `iss = tonebloom`, `aud = pointcast-rewards`, `program = fishclub-tonebloom`, the run id, `startedAt`, `finishedAt`, `creditedSeconds`, a nonce that is stable across retries, `exp = iat + 1800`). Return the same receipt on retries. The button sends the person to `https://pointcast.xyz/faucet/fishclub#receipt=<receipt>`.

The secret is `REWARDS_TONEBLOOM_SECRET`, shared with PointCast only, held in Tone Bloom's server secret store. Mike or cc hands it over out of band; it never appears in a repo, a log, or chat. Tone Bloom never receives a PointCast cookie, email, user id, wallet, or any chain key.

## Acceptance

- The published test vectors verify byte for byte with your implementation.
- Invalid, expired, wrong-audience tickets are refused; a valid one creates exactly one run.
- Scripted beats with gaps, duplicates, or out-of-order sequence numbers do not advance credit; pause and hidden time earn nothing.
- Finish before 300 credited seconds returns no receipt; after, returns the same receipt on retry.
- No ticket or receipt appears in a query string, access log, analytics call, or referrer.
- Report on the handoff issue with the hosting answer, the voice/image IDs chosen, and a screen recording of one full run ending on PointCast's "One FISHCLUB is in your ledger."
