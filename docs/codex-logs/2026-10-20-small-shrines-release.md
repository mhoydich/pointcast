# Small Shrines release

## Scope

Four secular one-minute spaces at `/small-shrines/`: Ocean, Garden, Night and Memory. Each offers an artwork, a visual focus, four gentle original prompts, a full readable transcript, optional timing and independent ambient sound. Visitors can keep their eyes open, breathe naturally, pause or leave freely. No medical claims.

Ocean and Night were made with OpenAI image_gen for this project. Garden and Memory are existing Michael Hoydich Midjourney works, verified by opening the authenticated `@mhoydich` Spotlight profile and both job details in Chrome. Original JPEGs were saved through Chrome, then resized/compressed without creative edits. Editorial shrine names are not claimed original artwork titles. Public provenance records source links, exact generation prompts, dimensions, bytes and SHA-256 hashes at `/images/small-shrines/provenance.json`.

Four original procedural audio modes (Tide, Warm Drone, Bowl, Soft Pulse) use no samples or paid service. Sound begins only on Listen. Stop closes/disconnects resources; volume, mute, cancellation-safe startup and page lifecycle cleanup are supported. See the separate audio audit for existing Nouns/Drum implementation review and provenance decisions.

Discovery includes homepage New Today and a permanent shrine room entry, Block 0719, app launch strip/catalog, agent indexes, llms, shrine index and its JSON. Existing Elemental Shrine and Open Road rooms remain intact. Work excludes IndustryNext PR7, internship1434, auth/security changes, comic PDF work and Good Feels.

## Verification

- Independent source review completed. Fixed the countdown's implicit live announcements, nested main landmark, and inaccurate sound copy.
- Client/audio/data TypeScript checks pass.
- 23 focused shrine tests pass, including 16 new client/audio tests for delayed-start cancellation, all synthesis modes, mute/volume/stop, timing/pause/resume/completion, room changes, hidden/pagehide and Astro cleanup/rebind.
- Agent surface audit passes. All four image file hashes, dimensions and byte lengths independently match provenance.
- Chrome: desktop 1102px, narrow 390px and 320px inspected. No horizontal overflow. All four images load at natural width 1536. All sound modes reach playing; Stop, mute/unmute, mode/room changes and keyboard Enter/Space timing controls verified. Range and mute touch targets are 44px. Reduced motion rules remove animations/transitions; no decorative continuous animation is used.
- Normal full suite executed: 4,138 tests, 4,049 pass, 55 fail, 9 cancelled, 25 skipped. Baseline comparison is recorded separately; no claim that the full suite is green.
- Full `npm run build:bare` passed: 3,638 pages and 126 game downloads. Built shrine HTML has one main landmark, one h1, correct canonical, silent initial controls, and all eight discovery surfaces contain the release. Final publication verification is recorded in the PR and task status.

Physical iPhone/Safari touch testing and actual speaker/headphone listening were not performed. Browser state and automated audio graph tests verify activation/cleanup; they do not verify subjective sound quality or real-device output.


## Baseline failure comparison

The normal `npm test` run before site compilation completed reported **4,138 tests: 4,049 passed, 55 failed, 9 cancelled, 25 skipped**. The full suite is not green. A clean tracked-source snapshot was created with `git archive` from pre-change main `ab5124a36a7f8e63fdeef63a75686e565eba0f8f` in `/tmp/pointcast-shrine-baseline-20261020`; its tests used the existing installed dependencies without installing or editing main. The comparison target was Small Shrines commit `c49d775c`.

Fourteen potentially affected discovery/homepage suites were run on both versions. Each run reported **72 tests: 52 passed, 16 failed, 4 skipped, 0 cancelled**, with identical failing test names. Fifteen failures stopped at the same assertion in both versions. `agent-surfaces` stopped at the missing-build-output precondition in the source-only snapshot and at the existing `llms.txt` length cap in the compiled current checkout. Both baseline and current `llms.txt` contain 332 split lines against a test limit below 320. Small Shrines shares the existing Meditate line and adds no lines.

The `fans-review` and `squeeze-league` failures assert that their own launch must remain `new-today[0]`. Both already failed on main, where Enjoy Money was first; Small Shrines changes the observed first item but introduces no new failure. Other repeated discovery failures concern old homepage order/headline/share-image contracts, the existing `drums.astro` layout assertion, an existing missing homepage image, and missing Block 0601. No broad baseline fixes or unrelated launch reordering were made.

A second baseline-only run of ten other failing source suites reported **83 tests: 54 passed, 26 failed, 3 skipped, 0 cancelled**. Its 26 failure names all match the original full run. Together, **42 of the full run's 55 failures were reproduced on unchanged main**. These additional failures cover Beach Commons, Kennel claim/today, Keyboard Notes, the Nouns Money workshop test's required tooling environment, Open Ad Network, almanac indexing, Starjam audio middleware, the town MCP catalog and UES class copy. Their implementation was not changed by Small Shrines.

The remaining **13 failures occurred in eight suites requiring built output**, while the initial full run had no completed `dist`: `agent-readiness-port`, `atari-bbs` (4), `communications-lab` (3), `corner-engineering`, `fila-el-segundo`, `fila-lookbook`, `microduck-future-book`, and `ping-local-pet`. These must be rerun after compilation; this baseline comparison does not claim they pass. The nine cancelled Co Games cases were timeouts in an unchanged suite and were not reproduced by this source comparison.

Reproduction commands (all paths below are `tests/<name>.test.mjs`):

```sh
node --test --test-reporter=tap tests/agent-surfaces.test.mjs tests/bell-signal-homepage.test.mjs tests/chain-strip.test.mjs tests/chrome-singleton.test.mjs tests/everyday-home.test.mjs tests/fans-review.test.mjs tests/front-door-fresh.test.mjs tests/front-door-september.test.mjs tests/home-music-on.test.mjs tests/home-shortwave-hero.test.mjs tests/home-signal-instrument.test.mjs tests/pickleball-jsonld.test.mjs tests/squeeze-league.test.mjs tests/railroad-history.test.mjs
node --test --test-reporter=tap tests/beach-commons-v3.test.mjs tests/kennel-club-claim.test.mjs tests/kennel-club-today.test.mjs tests/keyboard-notes.test.mjs tests/nouns-money-workshop-dom.test.mjs tests/open-ad-network.test.mjs tests/seo-discoverability.test.mjs tests/town-inspector-honesty.test.mjs tests/ues-classes.test.mjs tests/starjam-audio-routing.test.mjs
```

Evidence is retained in the task's `evidence/` folder: `full-tests.log`, `full-tests-failure-summary.json`, `baseline-sha.txt`, `discovery-baseline-tests.tap`, `discovery-current-tests.tap`, `other-baseline-tests.tap`, and `small-shrines-baseline-comparison.json`. No new failing source test was identified in this scoped comparison. Final built-page verification and production checks remain separate release gates.

Post-build rerun: all eight previously output-dependent suites now pass, **40/40 tests**, with no failures, skips or cancellations. Evidence: `evidence/postbuild-tests.log`.
