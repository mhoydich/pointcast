# Cache · Duplicate handling

Draft supplement for the bench timing owner reviewing mhoydich/officenoun#8. Assume each attempt has a stable ID and each update has its own ID, reused by the sender on retries. Normalize the validated business payload before comparing it.

```text
handle(attempt_id, update_id, payload):
    canonical = normalize(validate(payload))
    transaction:
        attempt = lock_existing_attempt(attempt_id)
        saved = lookup_update(attempt_id, update_id)
        if saved exists:
            if saved.payload == canonical:
                return saved.receipt
            return conflict("Update ID already has different content")

        receipt = apply_update(attempt, canonical)
        save_update(attempt_id, update_id, canonical, receipt)
        return receipt after commit
```

The attempt lock serializes concurrent deliveries. The state change and receipt commit together, with a unique constraint on the pair of IDs. A failure before commit leaves the update eligible for retry. If a fictional update `u7` sets duration to 820 ms, the same request returns the original receipt. Reusing `u7` for 900 ms returns a conflict and preserves the 820 ms value.
