# The Kettle — deploy notes

Deterministic pour-to-boil prize game. No randomness, no rake — the only tez
that ever leaves the contract is the winner payout at the moment of a boil.

## Verified

Compiled and full test scenario passing under SmartPy v0.24.1
(`pip install smartpy-tezos==0.24.1`, Python ≥3.10). Note: latest
smartpy-tezos (0.27+) rejects the module-level type-alias and helper-method
idioms — this file follows the marketplace.py style (inline record types in
`sp.cast`, asserts inlined in entrypoints), which compiles on 0.24.1.
`prize_cast.py`'s pending-compile status is caused by exactly those idioms.

Run tests (SmartPy resolves its stdlib relative to cwd, so run from
site-packages):

```
cd <venv>/lib/python3.12/site-packages
python <repo>/contracts/v2/the_kettle.py
```

## Game parameters (suggested mainnet v0)

| param | value | meaning |
|---|---|---|
| sip_mutez | 500000 (0.5ꜩ) | exact pour price |
| start_threshold | 5 | round 0 boils on the 5th pour |
| threshold_step | 2 | each round needs 2 more pours |
| carryover_bps | 1000 (10%) | slice of pot that seeds next round |

Round 0 max pot 2.5ꜩ — genuinely low stakes. Pots grow by +2 sips per round
plus compounding 10% carryover.

## Entrypoints

- `pour()` — payable, must equal `sip_mutez` exactly. Nth pour wins.
- `set_admin(address)`
- `set_sip(mutez)` / `set_threshold(nat, nat)` / `set_carryover_bps(nat)` —
  admin only, and only when `pour_count == 0` (round boundary).

## Storage for frontend

- `round_id`, `boil_threshold`, `pour_count`, `pot` — live round HUD.
- `pours` big_map `(round_id, pour_index) -> address` — the pour wall.
- `boils` big_map `round_id -> {winner, prize, pours, level, boiled_at}` —
  past winners.

## Post-origination checklist

1. Verify storage on tzkt matches params above.
2. Test pour from a throwaway wallet; confirm `pour_count` increments.
3. Boil round 0 end-to-end on ghostnet first.
4. Consider handing admin to the Standard Time TzSafe multisig once stable.
