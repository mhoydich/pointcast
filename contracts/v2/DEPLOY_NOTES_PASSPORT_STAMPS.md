# Passport Stamps FA2 Deploy Notes

Status: source ready, compile/origination pending.

## Source

- Contract: `contracts/v2/passport_stamps_fa2.py`
- SmartPy target: v0.24.1
- Collection: `PointCast Passport Stamps`
- Token model: one FA2 token ID per station stamp.
- Entrypoint: `mint_stamp(stamp_id)` where `stamp_id` is `0-23`.
- Metadata: `https://pointcast.xyz/passport/stamps/{slug}.json`

## Token IDs

| Token | Code | Slug |
| --- | --- | --- |
| 0 | P00 | el-segundo |
| 1 | P01 | manhattan-beach |
| 2 | P02 | hermosa |
| 3 | P03 | redondo-beach |
| 4 | P04 | venice |
| 5 | P05 | santa-monica |
| 6 | P06 | palos-verdes |
| 7 | P07 | long-beach |
| 8 | P08 | los-angeles |
| 9 | P09 | malibu |
| 10 | P10 | pasadena |
| 11 | P11 | anaheim-oc |
| 12 | P12 | newport-laguna |
| 13 | P13 | santa-barbara |
| 14 | P14 | north-san-diego |
| 15 | P15 | palm-springs |
| 16 | P16 | lax-westchester |
| 17 | P17 | inglewood |
| 18 | P18 | torrance |
| 19 | P19 | culver-city |
| 20 | P20 | san-pedro |
| 21 | P21 | hollywood |
| 22 | P22 | burbank-glendale |
| 23 | P23 | ventura |

## Compile

Use smartpy.io or local SmartPy v0.24.1, then export:

- `/tmp/pointcast-passport-stamps-contract.json`
- `/tmp/pointcast-passport-stamps-storage.json`

Origination defaults:

- `administrator`: deploy signer, then transfer admin to Mike if needed.
- `metadata_base_url`: `https://pointcast.xyz/passport/stamps`
- `mint_price_mutez`: `0`
- `royalty_bps`: `2000`

## Shadownet

1. Fund the deploy signer printed by:

   ```sh
   node scripts/deploy-passport-stamps-shadownet.mjs
   ```

2. Paste the resulting KT1 into `src/data/contracts.json`:

   ```json
   "passport_stamps": {
     "shadownet": "KT1..."
   }
   ```

3. Smoke mint:

   ```sh
   node scripts/mint-passport-stamp-shadownet.mjs 0
   ```

4. Readiness check:

   ```sh
   node scripts/check-passport-stamps-native-readiness.mjs
   ```

## Mainnet

Do not originate from an unattended script until Mike chooses the admin wallet and funds the signer. Once a mainnet KT1 is added to `src/data/contracts.json` at `passport_stamps.mainnet`, `/passport` automatically switches from Visit Nouns companion proofs to native `mint_stamp` calls.
