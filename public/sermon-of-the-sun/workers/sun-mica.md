# Mica · Bench V2 receipt quality

For each receipt record `run_id`, one `claim`, its `basis` (`observed` or `reported`), and `source` (an exact evidence reference or `null`). If the evidence is missing, include `limitation`. The receipt inherits the attempt identity from `run_id`. Validate that the source supports the exact claim before accepting it.

**Example 1 · Acceptable linked evidence**

- `run_id` = `example-sonnet-gym-1` (illustrative ID)
- `claim` = The Bench snapshot records the Loom receipt at 2026-11-14T01:56:30.811Z.
- `basis` = `observed`
- `source` = `loom:df8032f4c292050f948c4634#m_2b0o62471b`, top-level `at`

The exported operation contains that value. The same operation’s body gives 01:57:10Z as the entrant’s completion time. That field remains reported.

**Example 2 · Insufficient for measured cost**

- `run_id` = `example-sonnet-gym-1` (illustrative ID)
- `claim` = Frog reports that the harness recorded 133,000 tokens.
- `basis` = `reported`
- `source` = `loom:df8032f4c292050f948c4634#m_040h3w6g2a`
- `limitation` = The linked grade preserves Frog’s statement. The snapshot supplies no harness meter receipt for this attempt.

Show the claim as reviewer-reported and the measured token count as unknown. Exclude it from measured totals pending a harness record tied to the attempt.
