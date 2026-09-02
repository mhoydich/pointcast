# Manus brief — Kennel Club · The December Sitting (objkt collection + daily mint QA)

**Date filed:** 2026-09-02 PT
**Filed by:** Claude Code (cc) on behalf of Mike
**Type:** ops, objkt setup, real-user mint QA
**Status:** queued until the FA2 contract is originated and the 31 plates are verified
**Series data:** `src/data/kennel-club-december-sitting.json`
**Companion brief:** `docs/briefs/2026-09-02-codex-kennel-club-december-sitting.md`

## What this is

Thirty-one dog portrait sittings, one minted per day of December 2026 on Tezos mainnet. Codex generates the plates, cc originates a dedicated FA2 and builds the `/kennel-club` page. Manus owns everything behind a login or a real wallet.

## Preconditions (do not start before these are true)

- `src/data/contracts.json` has a non-empty `kennel_club.mainnet` KT1
- All 31 sittings in the series JSON show `image.status: "verified"`
- Mike has answered the edition model, price, and mint month in TASKS.md

## Tasks

1. **objkt collection presence.** Open `https://objkt.com/collection/<KT1>` (KT1 from `src/data/contracts.json`). Confirm the collection resolves, the name reads "Kennel Club · The December Sitting", and token 0 (Winslow) shows the verified image and TZIP-21 attributes (Sitting, Mint date, Breed, Wardrobe, Title). Screenshot the collection page and token 0.
2. **Daily-window mint test (Shadownet first, then mainnet).** Using Temple or Kukai with a test-funded wallet, open `https://pointcast.xyz/kennel-club` on the sitting's date. Confirm only that day's sitting is mintable, yesterday's is closed, tomorrow's reads "opens <date>". Execute one mint. Confirm the token appears in the wallet and on objkt. Capture the tzkt operation link.
3. **Off-day check.** Attempt a mint for a closed sitting and confirm the contract rejects it. Capture the error as shown to a real user.
4. **Mobile pass.** Repeat step 2 on a 390×844 viewport with a mobile wallet. Screenshot the mint button state before and after.

## Accounts and tools likely needed

- Temple or Kukai wallet, Shadownet test tez, then a small mainnet balance approved by Mike
- objkt.com (no login needed to verify; login needed only if collection metadata must be edited, which requires Mike approval)

## Capture

- Screenshots: objkt collection page, token 0 page, mint button states (open, closed, minted), wallet token view
- Logs: tzkt operation hashes for every mint attempt, including rejected ones

## Write results to

`docs/manus-logs/2026-12-01-kennel-club-first-sitting.md` for the first live day, then one dated log per QA session.

## Requires Mike approval

- Any mainnet spend
- Any edit to objkt collection metadata
- Any public cross-post announcing the series
