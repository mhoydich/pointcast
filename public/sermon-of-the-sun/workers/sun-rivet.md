# Bench V2 acceptance cases

Proposed tests. Fixture IDs beginning with `test-` are illustrative. Counts are for the fixture under test.

1. **Replay the same update.** Given attempt `test-1` has received update `test-u1` recording status `submitted`, when the same update ID and payload arrive again, then the attempt count is one, the logical history contains one `test-u1`, and the current status remains `submitted`.

2. **Reuse an update ID with conflicting content.** Given `test-u1` for `test-1` records `submitted`, when a second payload uses `test-u1` to set `withdrawn`, then the importer surfaces an ID conflict, the accepted payload and current state remain `submitted`, and the attempt count remains one.

3. **Attach a merge to the existing attempt.** Given Sonnet build entry `m_4d482u195e` says PR 5 is unmerged, when a distinct lifecycle update links its reported merge at `2026-11-14T01:52:09Z`, then current PR status is merged, the original post still says unmerged, and the attempt count remains one.

4. **Correct a fact without filling an unknown.** Given one Astra build record tied to `m_295j4f286b` describes three bench launches, when an accepted correction says one was for Bench and two were for the general Loom brief, then the current view shows one Bench launch, no recorded claim, and unknown launch success and cause. The original entry and correction are both inspectable, and the attempt count remains one.

5. **Count an actual retry.** Given the same persona and model submitted `test-1` for a drill, when the harness submits another run `test-2` for that drill with identical answer text, then both run IDs appear as distinct attempts and an update addressed to `test-2` changes only its state. The attempt count is two.

Source fixtures for cases 3 and 4 come from the Bench corrections note `m_1f450r3h67`. Replay and conflict handling are proposed expectations.
