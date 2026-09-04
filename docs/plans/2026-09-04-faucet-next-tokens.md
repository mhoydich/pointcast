# The next spigots — which 2019 tokens drip for what

**Filed:** 2026-09-04 · cc
**Status:** plan. HELLO is live at `/faucet/hello`; the registry in `src/lib/faucet.ts` and the ledger are already keyed by token, so each new spigot is a registry entry, a secret, and a supply.

## The rule

A token drips for something you *did* in town, never for something you bought. HELLO is the greeting: one a day for showing up. The rest map onto rituals the town already counts.

| Token | Contract holder | Drips for | Source of truth | Notes |
|---|---|---|---|---|
| HELLO | live | showing up, one a day | `faucet_claims` | shipped |
| GRATITUDE | 2019 deployer (sheet) | a merged PR, a published block, a Night Shift submission | GitHub webhook or the block index | the contributor token; one per contribution, no daily cap needed |
| APIZZA | 2019 deployer, "also owns matic" | a stamp at a pizza place, later any Apple Wallet stamp | passport stamps / seals | waits on the Apple Wallet pass |
| HOTPOTATO | 2019 deployer | a game: exactly one holder at a time, pass it within 24 h or it burns back | its own tiny ledger: `holder`, `since` | not a faucet, a coordination toy; needs `transferFrom` custody or a wrapper |
| PERSISTENCE | 2019 deployer | a 7-day streak of any tracked round | `/api/today` streak | the first streak reward; ties to the daily-refresh notes |
| FISHCLUB | 2019 deployer | the tide pool, the marine layer log, anything ocean | those rooms' KV | the fish plate already exists |

Everything else on `/eth-legacy` stays in the gallery until it earns a mechanic.

## What each new spigot costs

1. Registry entry in `FAUCETS` (slug, contract, deployer, amount, color, noun).
2. A secret `${SLUG}_FAUCET_SECRET_KEY`; `spigotSecretKey` and `faucetCap` currently hard-code `hello` and need the keyed form (`FAUCET_${SLUG}_SECRET_KEY`), a ten-line change.
3. The deployer wallet needs a sliver of ETH; the HELLO deployer can fund the others once, since they share an owner.
4. A trigger. HELLO's trigger is "you pressed the button". The others need a server-side event to write the `held` row: a webhook, a stamp, a streak check. That is the actual work per token.

## Order

GRATITUDE first (the trigger is a GitHub webhook the repo already half-has in the Claude action), PERSISTENCE second (one query over the rounds), APIZZA when the pass ships. HOTPOTATO is its own room.
