# Layers Radio — two-device trial log (blank)

Fill one copy per device pairing. Every row is one **first attempt**: no re-sends count toward the gate. Loopback and preview never count.

## Setup

| Field | Device A | Device B |
|---|---|---|
| Commit (PR #1214 head) | | |
| Device model | | |
| OS version | | |
| Browser + version | | |
| URL (must be a secure context) | | |
| Output volume (system, %) | | |
| Mic (built-in / headset / BT) | | |
| Audio context sample rate (from LOG panel) | | |
| Mic track settings line (from LOG panel) | | |
| Protocol | audible fast | audible fast |
| Room / ambient noise (quiet, music, voices) | | |
| Distance | 1 m | 1 m |
| Supervisor | | |
| Date / time | | |

## Direction A → B (A sends, B listens) — 20 first attempts at 1 m

| # | Mood | Sent at (hh:mm:ss) | Received? (Y/N) | Mood shown on B | Latency send-click → Received (s) | Notes (junk frame, duplicate, nothing) |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |
| 11 | | | | | | |
| 12 | | | | | | |
| 13 | | | | | | |
| 14 | | | | | | |
| 15 | | | | | | |
| 16 | | | | | | |
| 17 | | | | | | |
| 18 | | | | | | |
| 19 | | | | | | |
| 20 | | | | | | |

Received: ___ / 20 · Gate (19/20): PASS / FAIL

## Direction B → A (B sends, A listens) — 20 first attempts at 1 m

| # | Mood | Sent at (hh:mm:ss) | Received? (Y/N) | Mood shown on A | Latency send-click → Received (s) | Notes |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |
| 11 | | | | | | |
| 12 | | | | | | |
| 13 | | | | | | |
| 14 | | | | | | |
| 15 | | | | | | |
| 16 | | | | | | |
| 17 | | | | | | |
| 18 | | | | | | |
| 19 | | | | | | |
| 20 | | | | | | |

Received: ___ / 20 · Gate (19/20): PASS / FAIL

## Secondary (report separately, not part of the 1 m mood gate)

| Condition | Direction | Attempts | Received | Notes |
|---|---|---|---|---|
| Mood, 2 m | A → B | | | |
| Mood, 2 m | B → A | | | |
| Mood, 5 m | A → B | | | |
| Mood + 32-byte text, 1 m | A → B | | | |
| Mood + 32-byte text, 2 m | A → B | | | |
| Mood, 1 m, music playing | A → B | | | |
| Two senders at once | A,B → C | | | |
| Headphones on receiver | A → B | | | |
| Bluetooth speaker on sender | A → B | | | |

## Observations

- Rejected frames or junk decodes seen in the LOG panel:
- Duplicate suppressions:
- Anything that made a tester reach for the Stop button:
