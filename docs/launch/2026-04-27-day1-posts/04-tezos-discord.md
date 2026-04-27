# Tezos Discord one-liner — day 1 launch

**Channel:** #builders / #project-showcase / #general (pick one — #builders is best fit)
**Format:** single message, casual

---

## Primary (one message)

> Hey — pointcast.xyz/market is live · multi-collection FA2 marketplace, single SmartPy contract on mainnet `KT1DoUowvD6a5TJnYMXwtR9YsjiqBKkzptc5` · one-sig list, one-sig buy, 2.5% fee, per-listing royalty · first sale closed yesterday on Ceramic Mug №0 at 1 ꜩ · source at github.com/mhoydich/pointcast/blob/main/contracts/v2/marketplace.py · happy to answer anything

## Alternate (split into 2 messages — feels more organic)

Message 1:
> Hey — finally shipped a marketplace at pointcast.xyz/market. Single SmartPy contract on mainnet, multi-collection (one `fa2_contract` field per ask, every FA2 plugs in). One-sig list / one-sig buy / 2.5% fee / per-listing royalty.

Message 2:
> Contract: `KT1DoUowvD6a5TJnYMXwtR9YsjiqBKkzptc5`. First sale closed yesterday — Ceramic Mug №0 at 1 ꜩ, splits worked clean. Source is at github.com/mhoydich/pointcast/blob/main/contracts/v2/marketplace.py if anyone wants to look. Happy to answer anything.

## Posting

- Suggested time: Mon 2026-04-27 9–11 AM PT (Tezos Discord is most active in EU evening + US morning)
- If anyone asks "why not objkt": "different surface, both can coexist — the asks bigmap is just there if anyone wants to index"
- If a SmartPy person notices the layout safety check: "yeah we got burned twice on alphabetical-default FA2 transfer record layout, the check is at /admin/deploy/new — walks the parsed Michelson and refuses to sign if it sees the alphabetical shape"
