# PointCast adds a marketplace

**FOR PRESS / PUBLISHING USE — DRAFT**
**Filed by:** cc · **Status:** ready for review · **KT1 patched + live as of 2026-04-26 13:35 PT**

---

**EL SEGUNDO, CA — Sunday, April 26, 2026** — pointcast.xyz, the small living broadcast that has been running daily out of El Segundo since spring, today added a marketplace at [pointcast.xyz/market](https://pointcast.xyz/market). It is one beat in a steady drumbeat — not a relaunch, not a token sale.

The marketplace is a single SmartPy contract on Tezos mainnet at `KT1ABfp7cMEgPBEzLTR7tDut64mHgQfCYN5c`. It is multi-collection by design: a per-listing `fa2_contract` field means every PointCast FA2 plugs into the same surface without re-deploying the marketplace. Coffee Mugs (`KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt`) are listable on day one. Visit Nouns (`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`) follow the same path. Birthdays, Drum, and a queued Window Snapshots collection slot in as their contracts originate — same KT1, no migration.

Listing is one Kukai signature that batches an FA2 `update_operators` and a `list_ask`. Buying is one signature on `fulfill_ask` — the contract dispatches the FA2 transfer and splits the payment in a single Michelson operation: seller, a 2.5% platform fee, and a per-listing royalty that the seller chooses at list time. There is no PointCast token. There is no protocol fee beyond the 2.5%. Sellers can cancel or update price any time; the contract enforces no-self-fulfill and a 100% royalty cap.

> "I wanted the buy and the list to feel like one click and to make sense to anyone who's used objkt before — just native to the broadcast." — Mike Hoydich, founder

The marketplace inherits PointCast's agent-readable surface: every listing is browsable through the same `/market` page humans use, and the underlying asks bigmap is queryable via TzKT for any agent or indexer that prefers JSON. The site itself remains CC0-flavored, self-hosted on Cloudflare Pages, and free of analytics.

PointCast is a content network where every post is a numbered Block, every Block has a permanent URL, and a steady cadence of dispatches, mints, and visits make up the editorial. The marketplace is the trade layer underneath that cadence — quiet by default, available when a listing has somewhere to go.

---

**About PointCast** — A living broadcast from El Segundo, California, built by Mike Hoydich with an AI engineering team. CC0-flavored content, MIT-flavored code. [pointcast.xyz](https://pointcast.xyz) · [/manifesto](https://pointcast.xyz/manifesto) · [/agents.json](https://pointcast.xyz/agents.json) · [/market](https://pointcast.xyz/market)

**Press contact** — hello@pointcast.xyz · [@mhoydich on X](https://x.com/mhoydich) · [@mhoydich on Farcaster](https://warpcast.com/mhoydich)

**On-chain** — Marketplace contract [`KT1ABfp7cMEgPBEzLTR7tDut64mHgQfCYN5c`](https://tzkt.io/KT1ABfp7cMEgPBEzLTR7tDut64mHgQfCYN5c) (origination [op `ooESkgyRC…`](https://tzkt.io/ooESkgyRCVD8vZXkir6wVpkzU9Mi1L4rH1dQzDzNUNpAEvAr7XC)) · runbook + contract source at [`docs/plans/2026-04-26-marketplace-deploy-runbook.md`](https://github.com/mhoydich/pointcast/blob/main/docs/plans/2026-04-26-marketplace-deploy-runbook.md) and [`contracts/v2/marketplace.py`](https://github.com/mhoydich/pointcast/blob/main/contracts/v2/marketplace.py).

— end —
