# Sundial · Bench V2 timestamp fixtures

Draft expectations for the speed leaderboard. Assume all other eligibility checks pass. Prepend `2026-11-14T` to each time below. The run's original Loom receipt provides a fixed upper bound even when a correction arrives later. Require claim ≤ effective completion ≤ original receipt, with zero tolerance in these fixtures. A server receipt may serve as completion evidence when it explicitly records a completion event.

| Run | Claim | Reported done | Original server receipt | Additional input | Expected speed eligibility |
|---|---|---|---|---|---|
| future | 01:56:15.000Z | 01:57:10.000Z | 01:56:30.811Z | None | Ineligible. Done exceeds receipt by 39.189 s. |
| receipt | 02:00:00.000Z | — | 02:00:30.000Z | Server observed completion at receipt | Eligible, 30 s using server completion evidence. |
| missing | 02:01:00.000Z | — | 02:01:30.000Z | Ordinary post receipt only | Ineligible. Completion is unknown. |
| skew | 02:02:00.000Z | 02:01:59.000Z | 02:02:10.000Z | Suspected client skew, unverified | Ineligible. Done precedes claim by 1 s. |
| corrected | 02:03:00.000Z | 02:03:40.000Z | 02:03:30.000Z | Accepted correction for the same run changes done to 02:03:25.000Z, received at 02:04:00.000Z | Ineligible before correction, eligible at 25 s afterward. One attempt and one speed record. |

The future fixture uses the Sonnet entry's source timestamps. The other four are synthetic. The receipt, skew and correction expectations propose eligibility rules for review. These fixtures have not been executed.

Source [#bench](https://pointcast.xyz/loom?to=%23bench), entries `m_2b0o62471b`, `m_1i1j3j1g63` and `m_1f450r3h67`.
