# Office Kit contract v0 (DRAFT, Ghostnet first)

Status: **draft. Never deployed. Needs Codex review before any origination.**
No wallet or key was used or created. Spec: `public/office-kit/SPEC.md` (CC0).

One contract, no admin, no owner, no pause, no upgrade, no fee.
It is a stock SmartPy FA2 (`Fungible`, multi-asset) plus listings and payroll.

## Entrypoints

| Entrypoint | Who | What |
|---|---|---|
| `list_piece(metadata_uri, editions, price_mutez)` | artist (sender) | Records a listing, registers token metadata with supply 0. `listing_id == token_id`. |
| `collect(listing_id, to_)` | anyone | Must send exactly the price. Price is forwarded to the artist in the same operation. Mints one edition to `to_`. Fails `SOLD_OUT` at `editions`. |
| `start_payroll(artist, amount_per_period, periods, period_seconds)` | patron (sender) | Must send exactly `amount_per_period * periods`. Escrowed. |
| `claim_payroll(payroll_id)` | the artist only | Pays all vested, unclaimed periods to the artist. |
| `cancel_payroll(payroll_id)` | the patron only | Refunds only unvested periods. Vested periods stay claimable by the artist. |
| FA2: `transfer`, `balance_of`, `update_operators` | holders | Standard TZIP-12 from the SmartPy library. |

## Design choices

- **Mint on collect.** The contract never holds inventory for sale and never holds sale money. Fewer states, nothing to get stuck.
- **Vesting:** period k vests at `start + k * period_seconds` (block timestamp). Cancel shrinks `periods` to what has vested, so the artist can still claim it later.
- `artist_fee_bps` is intentionally absent. Price 0 (free pieces) is allowed; a zero-tez payment is not sent.
- Errors: `NO_EDITIONS WRONG_AMOUNT SOLD_OUT NO_TEZ NO_PERIODS NO_PERIOD_LENGTH NO_AMOUNT NOT_ARTIST NOT_PATRON NOTHING_VESTED FULLY_VESTED`.

## Test

SmartPy 0.25.3 (`pip install smartpy-tezos`). Run from a scratch directory, since it writes output folders:

```
mkdir /tmp/ok && cd /tmp/ok && python3 <repo>/contracts/office-kit/test_office_kit.py
```

Covers: exact-price collect, wrong amount (low, high, zero), sold out, free piece, gifts to another address, contract balance stays 0 after sales; payroll vesting over time, double claim, partial cancel, cancel before vesting, full-term claim, stranger/patron/artist authorization.

## Known risks / for review

- Block timestamps (can drift by a minute or so); fine for day-scale periods.
- An artist or patron address that is a contract rejecting tez can block its own claim/refund or sales. Only affects that party.
- An artist address that cannot receive tez makes `collect` fail for that listing (buyer is protected: whole op reverts).
- Tests use public fixture addresses and check contract balance, not recipient balances (the simulator does not track those). Reviewer should confirm payouts on Ghostnet.
- Token metadata is a single `""` key pointing at the URI; a TZIP-21 richer layout and contract-level metadata are not done.
- FA2 transfers are open to holders (editions are tradable), by design.
