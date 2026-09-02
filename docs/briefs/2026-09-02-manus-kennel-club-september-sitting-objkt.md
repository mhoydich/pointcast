# Manus brief — Kennel Club · The September Sitting (objkt collection + daily mint QA)

**Date filed:** 2026-09-02 PT
**Filed by:** Claude Code (cc) on behalf of Mike
**Type:** ops, objkt setup, real-user mint QA
**Status:** queued until the FA2 contract is originated and the 30 plates are verified
**Series data:** `src/data/kennel-club-september-sitting.json`
**Companion brief:** `docs/briefs/2026-09-02-codex-kennel-club-september-sitting.md`

## What this is

Thirty dog portrait sittings, one minted per calendar day in September 2026 on Tezos mainnet. December was a typo; Sitting 31 is dropped. Today is 2026-09-02, so Sittings 01 and 02 mint late while the calendar stays calendar-true. Codex generates the plates, cc originates the dedicated FA2 and builds the `/kennel-club` page. Manus owns everything behind a login or real wallet.

## Preconditions (do not start before these are true)

- `src/data/contracts.json` has a non-empty `kennel_club.mainnet` KT1
- All 30 sittings show `image.status: "verified"`
- Mike has answered the edition model, price, and signer in `TASKS.md`

## Tasks

1. **objkt collection presence.** Open `https://objkt.com/collection/<KT1>` (KT1 from `src/data/contracts.json`). Confirm the collection resolves, is named "Kennel Club · The September Sitting", and token 0 (Winslow) shows the verified image and TZIP-21 attributes (Sitting, Mint date, Breed, Wardrobe, Title). Screenshot the collection page and token 0.
2. **Daily-window mint test (Shadownet first, then mainnet).** Using Temple or Kukai with a test-funded wallet, open `https://pointcast.xyz/kennel-club` on the sitting’s date. Confirm only that day’s sitting is mintable, yesterday’s is closed, and tomorrow’s reads "opens <date>". Execute one mint. Confirm the token appears in wallet and objkt. Capture the tzkt operation link.
3. **Off-day check.** Attempt a closed sitting and confirm the contract rejects it. Capture the real-user error.
4. **Mobile pass.** Repeat step 2 at 390×844 with a mobile wallet. Screenshot mint-button state before and after.

## Capture

- Screenshots: objkt collection, token 0, open/closed/minted states, wallet token view
- Logs: tzkt operation hashes for every mint attempt, including rejected ones

## Write results to

`docs/manus-logs/2026-09-01-kennel-club-first-sitting.md` for the first live-day QA, then one dated log per session.

## Requires Mike approval

- Any mainnet spend
- Any edit to objkt collection metadata
- Any public cross-post announcing the series
