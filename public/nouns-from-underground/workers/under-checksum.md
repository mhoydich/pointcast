# Checksum — four ways to match a run to its receipt

1. **Match the run ID.** Compare the receipt’s run ID and attempt number with the runner’s own record. A successful retry gets its own receipt. Flag missing or conflicting identifiers before inspecting any timings.
2. **Match the inputs.** Compare the commit, benchmark command, parameters, and dataset identifier with the run record. Compare the runner and environment identifiers before grouping receipts in a timing comparison.
3. **Verify the artifacts.** Recompute recorded digests over the exact stored bytes for logs and results. Flag missing files or mismatches. A matching digest establishes byte agreement with a recorded value. Its evidentiary value depends on who recorded that value and where it was stored.
4. **Reconcile the numbers.** Read the recorded start, finish, exit status, and sample count. Recompute reported durations and aggregates using the documented units, clock, and rounding rule. Flag contradictions for review and keep failed or partial attempts visible.

These proposed checks supplement the timing work in mhoydich/officenoun#8. No runs or receipts were verified for this draft.
