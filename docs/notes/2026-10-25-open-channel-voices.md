# Open Channel voice quality fix

The initial narration selected the first local English voice, even though `localService` does not rank voice quality. It then varied that same voice with per-character rate and pitch changes. This could select a novelty or compact system voice and make it sound less natural.

The shared narrator now ranks English voices by quality-name hints (Premium, Natural, Neural, Enhanced), locale and device default, with known novelty voices last. It responds when the browser's voice list loads asynchronously, exposes a voice chooser on all three modes, and uses neutral pitch and normal pace. Selection is saved in this browser tab and never starts playback by itself. Stop, scene/prompt changes, microphone start, hidden tabs and page exit cancel playback and stale callbacks.

The playback path also supports future static authored recordings, with strict source-text matching and local-file URLs. The catalog covers 54 existing lines. The current audio manifest is empty, so recorded voices are not offered. Browser narration remains the active provider; a complete verified asset catalog is required before enabling recordings. Dessa is not connected.

## Verification

- 35 focused Open Channel tests pass, including browser ranking and delayed voices, neutral pitch/rate, cancellation, recorded playback without browser speech, exact-text catalog checks, unchanged draft/export behavior and explicit mode selection.
- Local browser check exposes Samantha as the automatic voice on this Mac. Narration starts and stops correctly; this verifies playback state, not a subjective listening assessment.
- Full build, independent review and production verification are recorded in the release PR and retained release receipt once complete.
