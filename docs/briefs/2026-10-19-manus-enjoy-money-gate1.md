# Manus brief — Enjoy. Money Gate 1 visual check (Shadownet)

**When:** after Mike, or an agent holding the admin key, has run
`node scripts/enjoy-money.mjs originate --execute` and `gate1 --execute` on
Shadownet, and `node scripts/enjoy-money.mjs status --network shadownet` prints
"Gate 1 on-chain checks: pass". The KT1 is recorded in
`contracts/enjoy-money/config.json` under `shadownet.contract`.

**Mike approval needed:** no. This is read-only. Do not sign, transfer or claim anything.

## Open

1. `https://shadownet.tzkt.io/<KT1>/tokens`: four tokens, IDs 0–3.
2. `https://shadownet.tzkt.io/<KT1>/storage`: `sealed` lists 0, 1, 2 at 100 each; `treasury` is the configured Treasury address.
3. `https://shadownet.tzkt.io/<Treasury tz>/tokens`: 100 ENJOY, 100 NOUNR, 100 BLUE, 3000 BOT.
4. Kukai with its network set to Shadownet, watch-only or the Treasury account if Mike has shared a session: the four tokens with their note art.
5. objkt's Shadownet instance, if one is live, at the KT1: names, art and "Hoydich Enterprises".
6. `https://pointcast.xyz/nouns-money/enjoy/metadata/0.json` through `3.json` and `/nouns-money/enjoy/art/0.svg` through `3.svg`: each loads.

## Capture

- One screenshot per URL above, plus the TzKT `seal` events (Events tab).
- Note any token where the art, name, symbol (ENJOY, NOUNR, BLUE, BOT) or decimals (0) are wrong or missing.

## Write the result to

`docs/manus-logs/2026-10-19-enjoy-money-gate1.md`. Mark it pass or fail, and for
any failure give the URL and what showed. Gate 1 passes when every item shows
correctly.
