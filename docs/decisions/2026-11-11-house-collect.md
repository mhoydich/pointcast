# House collect: the claim wallet mints a Visit Noun on request

**Date:** 2026-11-11 · **Status:** proposed, needs MH approval before merge (it spends from a hot wallet on mainnet)

## Why

Mike asked an agent to buy one of our NFTs from a phone. It could not: every
cloud-held Tezos key is wired to one narrow job (Kennel Club claims for a
signed-in member, seals, sponsored deliveries), and the only general-purpose
signer was assumed to be on the Mac. "Computers doing computer work" needs one
small door a session can knock on.

## What

`POST /api/house/collect` with an `Idempotency-Key` header and an optional
`{ agent, nounId }` body. The existing Kennel Club claim wallet
(`tz1UvNjifVKhP6Hm3ytVfWtmTiCxKozcYsSG`, key already installed as
`KENNEL_CLUB_CLAIM_SECRET_KEY`) calls `mint_noun` on Visit Nouns
(`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`). `GET` returns the day's count, the
cap and the last twenty collects.

No new secret, no new D1 table, no migration. The count and the replay record
live in `PC_RATES_KV`; the signer lock is the Kennel Club's own row in
`kennel_signer_locks`, because it is the same wallet and the same counter.

## Blast radius

- Visit Nouns mint for 0 ꜩ. Each call costs fees only: the April 2026 mints
  paid about 0.117 ꜩ, nearly all storage.
- Default cap is 3 attempts a day (`HOUSE_COLLECT_DAILY_CAP`, hard maximum 20).
  Attempts are counted before signing and stay counted when a mint fails, so a
  lost response cannot be replayed into more spend.
- Below 3 ꜩ the wallet refuses, the same floor the Kennel Club claims keep.
- The endpoint is unauthenticated on purpose: the cap is the control. The worst
  a stranger can do is use up the day's three mints, which leaves the Nouns in
  our own wallet.
- The Noun stays in the house wallet. Delivery to a recipient is a later change.

## Not done here

- No deploy. `scripts/deploy.sh` still runs from the Mac; the Cloudflare Pages
  workflow skips its deploy step until the `CLOUDFLARE_API_TOKEN` repo secret
  exists. That secret is the remaining Mac dependency for the whole site.
- No MCP tool yet. Add `house_collect` to `functions/api/mcp.ts` once this is live.
- The real chain path (`createTaquitoHouseChain`) is not exercised by tests;
  they inject a fake chain, as the Kennel Club tests do.
