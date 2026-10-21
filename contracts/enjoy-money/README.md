# enjoy-money — Phase 1 of Enjoy. Money

One FA2 (TZIP-12) contract with TZIP-16 metadata for Hoydich Enterprises' notes
and Bot Notes. Plan: `/nouns-money/enjoy/` (data in `src/data/enjoy-money.ts`).

**Closed loop.** The contract has no sale, swap, burn-for-value, withdrawal or
redemption entrypoint and refuses tez on `mint` and `seal`.
`tests/enjoy-money-contract.test.mjs` fails if the compiled entrypoint list ever grows.

## Tokens

| id | Name | Symbol | Supply |
|---|---|---|---|
| 0 | Enjoy. Note — Series 1 | ENJOY | fixed print run, then sealed |
| 1 | Nouns Reserve — Series 1 | NOUNR | fixed print run, then sealed |
| 2 | KansasDAO Blue Note — Series 1 | BLUE | fixed print run, then sealed |
| 3 | Bot Note (Enjoy. credits) | BOT | admin mints to Treasury; never sealable |

All decimals 0. `mint` is admin-only, may only credit the configured Treasury,
and fails with `TOKEN_SEALED` once `seal(token_id)` has run. `seal` is permanent,
records the supply at sealing in the `sealed` big map, and emits a `seal` event.
Admin handoff is two-step: `set_admin(new)`, then `accept_admin()` from `new`.

## Files

- `enjoy_money_fa2.py` — SmartPy source and tests (transfers, operators, sealed
  mint, non-admin mint, admin handoff, Treasury rotation, metadata)
- `config.json` — per-environment admin, Treasury, metadata base, print runs, seal
  list, Bot Note test balance, and the recorded KT1
- `../build/enjoy_money/` — compiled Michelson with placeholder addresses
- `../../public/nouns-money/enjoy/metadata/` and `art/` — TZIP-16/21 JSON and note
  SVGs, written by `scripts/enjoy-money-metadata.mjs`
- `../../scripts/enjoy-money.mjs` — `originate`, `gate1`, `status`

## Build and test

```sh
pip install smartpy-tezos==0.24.1
python contracts/enjoy-money/enjoy_money_fa2.py      # runs the tests, writes enjoy_money*/ outputs
cp enjoy_money_build/step_001_cont_0_{contract,storage}.{json,tz} contracts/build/enjoy_money/
node --test tests/enjoy-money-contract.test.mjs
```

## Keys

- **Admin** is the stampz deploy key. It originates and stays admin. Env:
  `ENJOY_MONEY_TESTNET_SECRET_KEY` or `ENJOY_MONEY_MAINNET_SECRET_KEY`. The scripts
  refuse to sign unless that key's address equals `config.<network>.admin`.
- **Treasury** is a separate hot key that receives every mint and later pays
  claims and agents. Fund it with only enough ꜩ for gas. Phase 1 needs only its
  address.
- Keys live in env or Worker secrets only. `.gitignore` covers `*.key`, `*.secret`,
  `*.pem`, `secrets/`, `**/print/` and `contracts/enjoy-money/*.local.json`.

## Gate 1 on shadownet

1. Put the admin and Treasury addresses in `config.json` under `shadownet`.
2. Fund the admin from the faucet: `npx @tacoinfra/get-tez <admin> --amount 100 --network shadownet`.
3. `node scripts/enjoy-money.mjs originate --network shadownet` to review, then
   rerun with `--execute`. The KT1 is written to `config.json`; commit it.
4. `node scripts/enjoy-money.mjs gate1 --network shadownet` to review, then
   `--execute`: one operation group mints 100 each of notes 0–2 and 3,000 Bot
   Notes to Treasury, then seals 0–2.
5. `node scripts/enjoy-money.mjs status --network shadownet` checks supply,
   Treasury balances and seals on TzKT.
6. Manus confirms the art and names on TzKT, Kukai and objkt
   (`docs/briefs/2026-10-19-manus-enjoy-money-gate1.md`).

## Mainnet Series 1

Replace the placeholder note art with the final art, pin the art and run
`node scripts/enjoy-money-metadata.mjs --art-base ipfs://<art CID> --out <dir>`,
pin that directory, and set `config.mainnet.metadataBase` to `ipfs://<metadata CID>`.
The script refuses https metadata on mainnet. Then follow the same three commands
with `--network mainnet --confirm-mainnet I_UNDERSTAND_MAINNET`. Mainnet mints and
seals only the 100 Enjoy. notes. Nouns Reserve and Blue Note get added to
`printRuns` and `seal` when their art is final.

## Adding a series

Series 1 uses token IDs 0–3. A new series needs new token IDs. This contract
registers tokens only at origination, so Series 2 is either a new origination
with the same seal-on-mint pattern or a reviewed contract change that adds an
admin-only `add_token` entrypoint (it must not touch sealed IDs). Decide before
the Series 2 art is final.

## Adding an agent

Agents never hold keys or mint. Phase 4 adds the relay Worker, which holds one
key per agent and the caps. On this contract an agent is just a tz address that
Treasury sends Bot Notes to.
