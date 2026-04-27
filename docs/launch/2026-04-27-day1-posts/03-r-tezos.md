# r/tezos post — day 1 launch

**Subreddit:** r/tezos
**Format:** link post or text post (text recommended — better engagement)
**CTA target:** https://pointcast.xyz/market

---

## Title

> PointCast adds a multi-collection marketplace on Tezos mainnet — first sale closed at 1 ꜩ

## Body (~600 words, hits the conventions of the sub: technical detail + on-chain proof + a note on what's open-source)

Hi r/tezos —

I run pointcast.xyz, a small daily broadcast that's been shipping out of El Segundo since spring. Today I added a marketplace at [pointcast.xyz/market](https://pointcast.xyz/market). It's live on mainnet and has already had its first real sale.

**What it is**

A single SmartPy contract on mainnet at [`KT1DoUowvD6a5TJnYMXwtR9YsjiqBKkzptc5`](https://tzkt.io/KT1DoUowvD6a5TJnYMXwtR9YsjiqBKkzptc5). One marketplace, every collection — the contract takes an `fa2_contract` field per ask, so any FA2 plugs in without re-deploying. Coffee Mugs ([`KT1JQ3Ajz…`](https://tzkt.io/KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt)) are listable on day one. Visit Nouns ([`KT1LP1oTB…`](https://tzkt.io/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh)) follow the same path. Window Snapshots, Birthdays, and a few others slot in as their contracts originate.

**Mechanics**

Listing batches `update_operators` + `list_ask` into one Kukai signature. Buying is one signature on `fulfill_ask` — the contract dispatches the FA2 transfer and splits the payment in a single Michelson operation: seller, 2.5% platform fee, per-listing royalty (seller picks the royalty BPS at list time). Sellers can cancel or update price anytime; the contract enforces no-self-fulfill and a 100% royalty cap.

**What got shipped today**

- Marketplace v3 — third-time-charm origination (first two hit `INVALID_FA2_CONTRACT` because the FA2 transfer dispatch was alphabetical-default `(amount, to_, token_id)` instead of canonical TZIP-12 `(to_, token_id, amount)`)
- A pre-sign Michelson layout safety check on the admin deploy page that walks the parsed bytecode and refuses to enable Sign if any FA2 transfer dispatch has the wrong field order. Catches the exact failure mode that burned v1 + v2.
- First sale: Ceramic Mug №0 at 1 ꜩ. The split worked — seller / fee / royalty all landed correctly on a single op.

**Open**

- Source: [`contracts/v2/marketplace.py`](https://github.com/mhoydich/pointcast/blob/main/contracts/v2/marketplace.py) (SmartPy)
- Frontend: [`src/pages/market.astro`](https://github.com/mhoydich/pointcast/blob/main/src/pages/market.astro)
- Press release: [`docs/launch/2026-04-26-marketplace-press-release.md`](https://github.com/mhoydich/pointcast/blob/main/docs/launch/2026-04-26-marketplace-press-release.md)

The whole site is CC0-flavored, MIT-flavored code, no analytics, self-hosted on Cloudflare Pages. Listings are browsable via TzKT for any agent or indexer that prefers JSON.

**On deck**

- v4 with per-ask `royalty_receiver` (seller picks who gets the royalty — original creator, themselves, a collective)
- Window Snapshots origination (3 painted-interior FA2s, free mint)
- On-chain referral splits + bid entrypoint

If you want to see how the multi-collection ask shape looks on-chain, the asks bigmap is at pointer 806745 (current). Comments / questions / "this would be cleaner if..." all welcome.

— Mike

## Posting

- Suggested time: Mon 2026-04-27 morning PT (catches both US East and EU evenings)
- Comment plan: be present in replies for the first 2-3 hours; technical questions are fair game
- If a "why not objkt" question lands: the answer is "different surface — pointcast is a content-broadcast that happens to mint, objkt is a marketplace-first. Both can coexist; the bigmap is queryable either way."
