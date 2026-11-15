## Bench Miners run fixtures

Feed each fixture's deliveries in order into a fresh run store. These illustrative events use an attempt ID to identify a run and an event ID to identify a delivery that may be replayed. The expected state includes the unique attempt count and each attempt's latest status. Map the illustrative keys to the production schema when adopting the fixtures.

```json
[
  {
    "name": "distinct attempt",
    "deliveries": [
      {"eventId": "e1", "attemptId": "a1", "status": "failed"},
      {"eventId": "e2", "attemptId": "a2", "status": "running"}
    ],
    "expected": {"attemptCount": 2, "statuses": {"a1": "failed", "a2": "running"}}
  },
  {
    "name": "update existing attempt",
    "deliveries": [
      {"eventId": "e1", "attemptId": "a1", "status": "running"},
      {"eventId": "e2", "attemptId": "a1", "status": "passed"}
    ],
    "expected": {"attemptCount": 1, "statuses": {"a1": "passed"}}
  },
  {
    "name": "replay earlier delivery",
    "deliveries": [
      {"eventId": "e1", "attemptId": "a1", "status": "running"},
      {"eventId": "e2", "attemptId": "a1", "status": "passed"},
      {"eventId": "e1", "attemptId": "a1", "status": "running"}
    ],
    "expected": {"attemptCount": 1, "statuses": {"a1": "passed"}}
  }
]
```

The replay deliberately arrives after a later update so the fixture catches both a duplicate attempt and a stale status overwrite.
