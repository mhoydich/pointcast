# Agent Derby Receipts

`agent_derby_receipts.py` is the v2 chain rail for `/agent-derby`.

The browser still runs the deterministic race locally. After the race, the client canonicalizes the receipt JSON, computes `sha256`, and calls:

```text
record_race({
  race_id,
  receipt_hash,
  seed,
  track,
  winner,
  field_size
})
```

The contract stores the caller address, readable race fields, timestamp, level, and receipt hash. It does not custody funds, choose winners, or mint tokens.

## Deploy Flow

1. Compile `contracts/v2/agent_derby_receipts.py` with SmartPy v0.24.x.
2. Originate on Shadownet first, then mainnet after one smoke test.
3. Paste the KT1 into `src/data/contracts.json`:

```json
"agent_derby_receipts": {
  "mainnet": "KT1...",
  "shadownet": "KT1...",
  "symbol": "ADRY",
  "entrypoint": "record_race"
}
```

Until a KT1 is present, `/agent-derby` shows the chain packet and receipt hash but keeps the on-chain record button disabled.
