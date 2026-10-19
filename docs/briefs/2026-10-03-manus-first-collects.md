# Manus brief — first collects from the want list (2026-10-03)

**Requires Mike approval before any purchase.** Nothing here spends tez until Mike
names the picks and a budget in the issue or PR thread.

## Context

`/collection/wants` lists Tezos work worth collecting next, grouped by price tier.
Prices on the page were observed on the date shown and may be stale. Each pick is
checked against Mike's wallet `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw` at build, so
a collected piece flips to "collected" on the next deploy.

## URLs to open

1. https://pointcast.xyz/collection/wants (and `/collection/wants.json`)
2. Each approved pick's `url` (objkt.com or fxhash.xyz)
3. https://pointcast.xyz/collection after the next deploy
4. https://pointcast.xyz/collect — confirm the "September sitting ended" notice shows (today is after 2026-09-30, Pacific time)

## Accounts and tools

- Mike's Tezos wallet (Temple or Kukai) for `tz2FjJ…xFw`. Mike signs, or approves Manus signing.
- objkt.com and fxhash.xyz, connected to that wallet.

## Step 0 — verify the want list (no approval needed)

`src/data/want-list.json` ships empty. The cloud agent that built the page could not
reach TzKT, objkt or fxhash, so the candidates below are **unverified and from memory**.
For each candidate:

- Confirm the contract on tzkt.io.
- Record the live floor price in tez and the date.
- Check it isn't already held by `tz2FjJ…xFw`. Skeles and Froggos may already be held.
- Keep 12–16 picks across the tiers `free`, `under-10`, `10-100` and `stretch`, adding nounish, beach or El Segundo work you find.

Write each verified pick into `src/data/want-list.json`, using the `WantPick` shape in
`src/lib/want-list.ts`, and open a PR.

| Candidate | Contract (unverified) | Tier guess |
|---|---|---|
| Teia / hic et nunc open editions | KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton | free |
| 8bidou 8x8 pixel art | KT1MxDwChiDwd6WBVs24g1NjERUoK622ZEFp | free |
| fxhash gentk v2, pick a calm or minimal project | KT1U6EHmNxJTkvaWJ4ThczG4FSDaHC21ssvi | under-10 |
| Neonz | KT1MsdyBSAMQwzvDH4jt2mxUKJvBSWZuPoRJ | under-10 |
| Ziggurats | KT1PNcZQkJXMQ2Mg92HG1kyrcu3auFX5pfd8 | under-10 |
| DOGAMI | KT1NVvPsNDChrLRH5K2cy6Sc9r1uuUwdiZQd | under-10 |
| Versum editions | KT1LjmAdYQCLBjwv4S2oFkEzyHVkomAf5MrW | under-10 |
| Tezzardz | KT1LHHLso8zQWQWg1HUukajdxxbkGfNoHjh6 | 10-100 |
| GOGOs | KT1SyPgtiXTaEfBuMZKviWGNHqVrBBEjvtfQ | 10-100 |
| fxhash gentk v1, an early project | KT1KEa8z6vWXDJrVqtMrAeDVzsvxat3kHaCE | 10-100 |
| Low-numbered HEN genesis-era OBJKT | KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton | stretch |

## Steps

1. For each approved pick, record the live price and edition count before buying. If the live price is more than 25% above the page price, stop and ask Mike.
2. Collect it. Record the operation hash.
3. After the next deploy, confirm the pick shows "collected" on `/collection/wants` and appears in the `/collection` grid.
4. QA `/collection/wants` at 390px width: no horizontal scroll, the price tags stay legible, and the links open the right token.

## Capture

- A screenshot of each objkt or fxhash confirmation
- Operation hashes, with tzkt.io links
- Before and after screenshots of `/collection/wants`
- A 390px screenshot of `/collect` showing the run-over notice

## Write results to

`docs/manus-logs/2026-10-03-first-collects.md`
