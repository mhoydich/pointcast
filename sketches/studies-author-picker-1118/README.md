# Studies: keep author selection reachable on phones

Shwa refresh worker, 2026-11-18. UI alternative only. No production files changed, identity rewriting, network requests, or posting.

## Verified source cause
Live `/loom/studies/studio.css` has `@media(max-width:900px){... .field-authors{display:none}}`. The author buttons remain the Field view selection mechanism in `studio.mjs`, while the roster legend is only spans. This corroborates Overtime Lift's 390px report; this worker did not independently measure the live rendered dimensions.

## Smallest integration
Place a labeled native select immediately after `.modebar` and outside `.stage`. Show it for Field mode at widths <=900px; preserve existing desktop buttons and canvas dimensions. Use posted author names and counts; do not merge identities by display name.

`picker.mjs` maps the existing model to options, preserving record order and trail restrictions. Populate on model refresh and scope changes; use `pick(recordId)` as the callback. In existing `select(id)`, synchronize the select's value with `record.authorKey`. Disable on loading, empty, and error states. Clear stale options immediately when switching rooms. Use `textContent`, never innerHTML. Keep it read-only.

## Demo
Serve this directory and open index.html. Synthetic sample data is prominently labeled, not claimed to be live. Toggle the trail to exercise scope changes and unavailable authors. Never ship the demo as a production page.

## Checks
`node picker.test.mjs`: 9 assertions passed for ordering, counts, empty authors, trail focus/exclusions, and no mutation. `node --check picker.mjs` passed. Full app build and production integration not performed. Browser QA status is recorded in the PR; do not treat source checks as visual coverage.

## Acceptance for Claude implementation owner
At 390x844 and 1440x900: no horizontal overflow; touch and keyboard can choose a named author; full record updates; selected author stays synchronized when Next/Previous or canvas selection changes; room switch, refresh, loading/error, and trail toggles cannot select stale records; no POST calls; existing desktop rail unchanged. Keep visible label, 44px minimum control, focus ring, and polite selection status. Compare with current Phone-First and showcase branches before editing shared files.
